import { useState, useEffect } from 'react';
import { SystemState, Jamaah, HajiPeriod, Payment, LembagaConfig, UserAccount, DepartureSchedule } from './types';
import { INITIAL_STATE } from './initialData';

// Firebase Integrations
import { auth, db, googleProvider, OperationType, handleFirestoreError, testConnection } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, getDocs, onSnapshot, writeBatch } from 'firebase/firestore';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

// Subcomponents
import Dashboard from './components/Dashboard';
import JamaahManager from './components/JamaahManager';
import PeriodeManager from './components/PeriodeManager';
import PembayaranManager from './components/PembayaranManager';
import DepartureScheduleManager from './components/DepartureScheduleManager';
import ReportHistory from './components/ReportHistory';
import SettingsManager from './components/SettingsManager';
import PrintPreview from './components/PrintPreview';
import OnlineAccessModal from './components/OnlineAccessModal';

// Icons
import {
  Users,
  Calendar,
  CreditCard,
  FileText,
  Settings,
  Menu,
  X,
  Compass,
  ArrowRight,
  ShieldCheck,
  Award,
  LogOut,
  HelpCircle,
  Database,
  LayoutDashboard,
  User,
  Heart,
  Globe,
  Share2
} from 'lucide-react';

export default function App() {
  const [state, setState] = useState<SystemState>(() => {
    try {
      const saved = localStorage.getItem('manajemen_haji_state_v2');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load local Haji state, reverting to mock data', e);
    }
    return INITIAL_STATE;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'jamaah' | 'periode' | 'pembayaran' | 'departure' | 'report' | 'settings'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);

  // Print States
  const [printType, setPrintType] = useState<'dossier' | 'receipt' | 'register' | 'directory' | null>(null);
  const [selectedPrintJamaah, setSelectedPrintJamaah] = useState<Jamaah | null>(null);
  const [selectedPrintPayment, setSelectedPrintPayment] = useState<Payment | null>(null);
  const [selectedPrintList, setSelectedPrintList] = useState<Jamaah[]>([]);
  const [printTitle, setPrintTitle] = useState('');
  const [printSubTitle, setPrintSubTitle] = useState('');

  // Firebase auth & synchronization states
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [syncStatus, setSyncStatus] = useState<'offline' | 'loading' | 'synced' | 'error'>('offline');

  // Local Server synchronization state
  const [localBackendActive, setLocalBackendActive] = useState(false);

  // Auto-detect local backend server availability on localhost:3000
  useEffect(() => {
    fetch('/api/data')
      .then(async (res) => {
        if (res.ok) {
          const serverState = await res.json();
          if (serverState && typeof serverState === 'object' && serverState.jamaahList) {
            setState(serverState);
            setLocalBackendActive(true);
            console.log("✓ Connected to Localhost Express Backend File Storage (kbih_data.json)");
          }
        }
      })
      .catch((err) => {
        console.warn("Localhost backend server not detected, fallback to standard client localStorage mode:", err);
      });
  }, []);

  // Persistence side-effect (Offline capability: always save to localStorage as a cache/fallback)
  useEffect(() => {
    localStorage.setItem('manajemen_haji_state_v2', JSON.stringify(state));

    // Auto-save to Localhost Express server if active
    if (localBackendActive) {
      fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(state)
      })
      .then(res => {
        if (!res.ok) {
          console.warn("Local server auto-save returned abnormal status:", res.status);
        }
      })
      .catch(err => {
        console.error("Local server auto-save failed:", err);
      });
    }
  }, [state, localBackendActive]);

  // Firebase Setup & Seeding Effect
  useEffect(() => {
    testConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setFbUser(user);
      if (user) {
        setSyncStatus('loading');
        try {
          const jamaahSnap = await getDocs(collection(db, 'jamaah')).catch(err => {
            handleFirestoreError(err, OperationType.GET, 'jamaah');
            throw err;
          });
          
          if (jamaahSnap.empty) {
            // First time cloud sync: Seed Firestore with local state
            await setDoc(doc(db, 'config', 'lembaga'), state.lembaga);

            const batch = writeBatch(db);
            for (const acc of state.accounts) {
              batch.set(doc(db, 'accounts', acc.id), acc);
            }
            for (const j of state.jamaahList) {
              batch.set(doc(db, 'jamaah', j.id), j);
            }
            for (const p of state.periodeList) {
              batch.set(doc(db, 'periode', p.id), p);
            }
            for (const pay of state.paymentList) {
              batch.set(doc(db, 'payment', pay.id), pay);
            }
            if (state.departureScheduleList) {
              for (const ds of state.departureScheduleList) {
                batch.set(doc(db, 'departure_schedule', ds.id), ds);
              }
            }
            await batch.commit().catch(err => {
              handleFirestoreError(err, OperationType.WRITE, 'batch-seed');
              throw err;
            });
            console.log("Firestore successfully seeded with initial local state.");
          }
          setSyncStatus('synced');
        } catch (error) {
          console.error("Failed to seed/fetch Firestore", error);
          setSyncStatus('error');
        }
      } else {
        setSyncStatus('offline');
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time Firestore synchronizer
  useEffect(() => {
    if (!fbUser) return;

    const unsubLembaga = onSnapshot(doc(db, 'config', 'lembaga'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as LembagaConfig;
        setState(prev => ({ ...prev, lembaga: data }));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'config/lembaga'));

    const unsubJamaah = onSnapshot(collection(db, 'jamaah'), (querySnap) => {
      const list: Jamaah[] = [];
      querySnap.forEach((docSnap) => {
        const item = docSnap.data() as Jamaah;
        if (item) {
          list.push({ ...item, id: String(item.id || docSnap.id) });
        }
      });
      list.sort((a,b) => String(b.id || '').localeCompare(String(a.id || '')));
      setState(prev => ({ ...prev, jamaahList: list }));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'jamaah'));

    const unsubPeriode = onSnapshot(collection(db, 'periode'), (querySnap) => {
      const list: HajiPeriod[] = [];
      querySnap.forEach((docSnap) => {
        const item = docSnap.data() as HajiPeriod;
        if (item) {
          list.push({ ...item, id: String(item.id || docSnap.id) });
        }
      });
      list.sort((a,b) => String(a.id || '').localeCompare(String(b.id || '')));
      setState(prev => ({ ...prev, periodeList: list }));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'periode'));

    const unsubPayment = onSnapshot(collection(db, 'payment'), (querySnap) => {
      const list: Payment[] = [];
      querySnap.forEach((docSnap) => {
        const item = docSnap.data() as Payment;
        if (item) {
          list.push({ ...item, id: String(item.id || docSnap.id) });
        }
      });
      list.sort((a,b) => String(b.id || '').localeCompare(String(a.id || '')));
      setState(prev => ({ ...prev, paymentList: list }));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'payment'));

    const unsubAccounts = onSnapshot(collection(db, 'accounts'), (querySnap) => {
      const list: UserAccount[] = [];
      querySnap.forEach((docSnap) => {
        const item = docSnap.data() as UserAccount;
        if (item) {
          list.push({ ...item, id: String(item.id || docSnap.id) });
        }
      });
      list.sort((a,b) => String(a.id || '').localeCompare(String(b.id || '')));
      setState(prev => ({ ...prev, accounts: list }));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'accounts'));

    const unsubSchedules = onSnapshot(collection(db, 'departure_schedule'), (querySnap) => {
      const list: DepartureSchedule[] = [];
      querySnap.forEach((docSnap) => {
        const item = docSnap.data() as DepartureSchedule;
        if (item) {
          list.push({ ...item, id: String(item.id || docSnap.id) });
        }
      });
      list.sort((a,b) => String(b.id || '').localeCompare(String(a.id || '')));
      setState(prev => ({ ...prev, departureScheduleList: list }));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'departure_schedule'));

    return () => {
      unsubLembaga();
      unsubJamaah();
      unsubPeriode();
      unsubPayment();
      unsubAccounts();
      unsubSchedules();
    };
  }, [fbUser]);

  // Active user selector (Admin/Operator)
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return state.accounts[0]?.id || 'ACC-01';
  });
  const currentUser = state.accounts.find(a => a.id === currentUserId) || state.accounts[0];

  // Actions
  const handleAddJamaah = (newJamaah: Jamaah) => {
    setState(prev => ({
      ...prev,
      jamaahList: [newJamaah, ...prev.jamaahList]
    }));
    if (auth.currentUser) {
      setDoc(doc(db, 'jamaah', newJamaah.id), newJamaah).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `jamaah/${newJamaah.id}`);
      });
    }
  };

  const handleUpdateJamaah = (updatedJamaah: Jamaah) => {
    setState(prev => ({
      ...prev,
      jamaahList: prev.jamaahList.map(j => j.id === updatedJamaah.id ? updatedJamaah : j)
    }));
    if (auth.currentUser) {
      setDoc(doc(db, 'jamaah', updatedJamaah.id), updatedJamaah).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `jamaah/${updatedJamaah.id}`);
      });
    }
  };

  const handleDeleteJamaah = (id: string) => {
    const paymentsToDelete = state.paymentList.filter(p => p.jamaahId === id);
    
    setState(prev => ({
      ...prev,
      jamaahList: prev.jamaahList.filter(j => j.id !== id),
      // Also cascade delete related payments
      paymentList: prev.paymentList.filter(p => p.jamaahId !== id)
    }));

    if (auth.currentUser) {
      deleteDoc(doc(db, 'jamaah', id)).catch(err => {
        handleFirestoreError(err, OperationType.DELETE, `jamaah/${id}`);
      });
      paymentsToDelete.forEach(p => {
        deleteDoc(doc(db, 'payment', p.id)).catch(err => {});
      });
    }
  };

  const handleAddPeriode = (newPeriod: HajiPeriod) => {
    setState(prev => ({
      ...prev,
      periodeList: [...prev.periodeList, newPeriod]
    }));
    if (auth.currentUser) {
      setDoc(doc(db, 'periode', newPeriod.id), newPeriod).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `periode/${newPeriod.id}`);
      });
    }
  };

  const handleUpdatePeriode = (updatedPeriod: HajiPeriod) => {
    setState(prev => ({
      ...prev,
      periodeList: prev.periodeList.map(p => p.id === updatedPeriod.id ? updatedPeriod : p)
    }));
    if (auth.currentUser) {
      setDoc(doc(db, 'periode', updatedPeriod.id), updatedPeriod).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `periode/${updatedPeriod.id}`);
      });
    }
  };

  const handleDeletePeriode = (id: string) => {
    setState(prev => ({
      ...prev,
      periodeList: prev.periodeList.filter(p => p.id !== id)
    }));
    if (auth.currentUser) {
      deleteDoc(doc(db, 'periode', id)).catch(err => {
        handleFirestoreError(err, OperationType.DELETE, `periode/${id}`);
      });
    }
  };

  const handleAddPayment = (newPayment: Payment) => {
    setState(prev => ({
      ...prev,
      paymentList: [newPayment, ...prev.paymentList]
    }));
    if (auth.currentUser) {
      setDoc(doc(db, 'payment', newPayment.id), newPayment).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `payment/${newPayment.id}`);
      });
    }
  };

  const handleUpdatePayment = (updatedPayment: Payment) => {
    setState(prev => ({
      ...prev,
      paymentList: prev.paymentList.map(p => p.id === updatedPayment.id ? updatedPayment : p)
    }));
    if (auth.currentUser) {
      setDoc(doc(db, 'payment', updatedPayment.id), updatedPayment).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `payment/${updatedPayment.id}`);
      });
    }
  };

  const handleDeletePayment = (id: string) => {
    setState(prev => ({
      ...prev,
      paymentList: prev.paymentList.filter(p => p.id !== id)
    }));
    if (auth.currentUser) {
      deleteDoc(doc(db, 'payment', id)).catch(err => {
        handleFirestoreError(err, OperationType.DELETE, `payment/${id}`);
      });
    }
  };

  const handleUpdateLembaga = (newConfig: LembagaConfig) => {
    setState(prev => ({
      ...prev,
      lembaga: newConfig
    }));
    if (auth.currentUser) {
      setDoc(doc(db, 'config', 'lembaga'), newConfig).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, 'config/lembaga');
      });
    }
  };

  const handleAddAccount = (newAcc: UserAccount) => {
    setState(prev => ({
      ...prev,
      accounts: [...prev.accounts, newAcc]
    }));
    if (auth.currentUser) {
      setDoc(doc(db, 'accounts', newAcc.id), newAcc).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `accounts/${newAcc.id}`);
      });
    }
  };

  const handleUpdateAccount = (updatedAcc: UserAccount) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => a.id === updatedAcc.id ? updatedAcc : a)
    }));
    if (auth.currentUser) {
      setDoc(doc(db, 'accounts', updatedAcc.id), updatedAcc).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `accounts/${updatedAcc.id}`);
      });
    }
  };

  const handleDeleteAccount = (id: string) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.filter(a => a.id !== id)
    }));
    if (auth.currentUser) {
      deleteDoc(doc(db, 'accounts', id)).catch(err => {
        handleFirestoreError(err, OperationType.DELETE, `accounts/${id}`);
      });
    }
  };

  const handleAddSchedule = (newSchedule: DepartureSchedule) => {
    setState(prev => ({
      ...prev,
      departureScheduleList: [newSchedule, ...(prev.departureScheduleList || [])]
    }));
    if (auth.currentUser) {
      setDoc(doc(db, 'departure_schedule', newSchedule.id), newSchedule).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `departure_schedule/${newSchedule.id}`);
      });
    }
    // If the new schedule is registered with Diberangkatkan status immediately, set active status to Tidak Aktif
    if (newSchedule.status === 'Diberangkatkan') {
      const match = state.jamaahList.find(j => j.id === newSchedule.jamaahId);
      if (match) {
        const updatedJ = { ...match, statusAktif: 'Tidak Aktif' as const };
        handleUpdateJamaah(updatedJ);
      }
    }
  };

  const handleUpdateSchedule = (updatedSchedule: DepartureSchedule) => {
    setState(prev => ({
      ...prev,
      departureScheduleList: (prev.departureScheduleList || []).map(ds => ds.id === updatedSchedule.id ? updatedSchedule : ds)
    }));
    if (auth.currentUser) {
      setDoc(doc(db, 'departure_schedule', updatedSchedule.id), updatedSchedule).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `departure_schedule/${updatedSchedule.id}`);
      });
    }
  };

  const handleDeleteSchedule = (id: string) => {
    setState(prev => ({
      ...prev,
      departureScheduleList: (prev.departureScheduleList || []).filter(ds => ds.id !== id)
    }));
    if (auth.currentUser) {
      deleteDoc(doc(db, 'departure_schedule', id)).catch(err => {
        handleFirestoreError(err, OperationType.DELETE, `departure_schedule/${id}`);
      });
    }
  };

  const handleMarkAsDeparted = (scheduleId: string, jamaahId: string, departState: boolean) => {
    // 1. Update the status of the schedule in state & firebase
    setState(prev => {
      const updatedSchedules = (prev.departureScheduleList || []).map(ds => {
        if (ds.id === scheduleId) {
          return { ...ds, status: (departState ? 'Diberangkatkan' : 'Draft') as 'Draft' | 'Diberangkatkan' };
        }
        return ds;
      });

      const updatedJamaahList = prev.jamaahList.map(j => {
        if (j.id === jamaahId) {
          return { ...j, statusAktif: (departState ? 'Tidak Aktif' : 'Aktif') as 'Aktif' | 'Tidak Aktif' };
        }
        return j;
      });

      return {
        ...prev,
        departureScheduleList: updatedSchedules,
        jamaahList: updatedJamaahList
      };
    });

    if (auth.currentUser) {
      // Retrieve the current schedule structure
      const mSchedule = state.departureScheduleList?.find(ds => ds.id === scheduleId);
      if (mSchedule) {
        const updatedSchedule = { ...mSchedule, status: (departState ? 'Diberangkatkan' : 'Draft') as 'Draft' | 'Diberangkatkan' };
        setDoc(doc(db, 'departure_schedule', scheduleId), updatedSchedule).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `departure_schedule/${scheduleId}`);
        });
      }
      const mJamaah = state.jamaahList.find(j => j.id === jamaahId);
      if (mJamaah) {
        const updatedJamaah = { ...mJamaah, statusAktif: (departState ? 'Tidak Aktif' : 'Aktif') as 'Aktif' | 'Tidak Aktif' };
        setDoc(doc(db, 'jamaah', jamaahId), updatedJamaah).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `jamaah/${jamaahId}`);
        });
      }
    }
  };

  // Database actions
  const handleExportDB = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `haji_mandiri_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportDB = async (importedState: SystemState) => {
    setState(importedState);
    if (auth.currentUser) {
      setSyncStatus('loading');
      try {
        await setDoc(doc(db, 'config', 'lembaga'), importedState.lembaga);
        
        const batch = writeBatch(db);
        for (const j of importedState.jamaahList) {
          batch.set(doc(db, 'jamaah', j.id), j);
        }
        for (const p of importedState.periodeList) {
          batch.set(doc(db, 'periode', p.id), p);
        }
        for (const pay of importedState.paymentList) {
          batch.set(doc(db, 'payment', pay.id), pay);
        }
        if (importedState.departureScheduleList) {
          for (const ds of importedState.departureScheduleList) {
            batch.set(doc(db, 'departure_schedule', ds.id), ds);
          }
        }
        for (const a of importedState.accounts) {
          batch.set(doc(db, 'accounts', a.id), a);
        }
        await batch.commit();
        setSyncStatus('synced');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'import-batch');
        setSyncStatus('error');
      }
    }
  };

  const handleClearDB = async () => {
    const defaultClearedState: SystemState = {
      jamaahList: [],
      periodeList: [
        { id: "P-D1", tahun: new Date().getFullYear().toString(), kuota: 200, status: 'buka' }
      ],
      paymentList: [],
      departureScheduleList: [],
      lembaga: {
        namaLembaga: "KBIH Baru / Tanpa Nama",
        namaPengelola: "Pejabat KBIH",
        noHp: "0812-xxxx",
        alamat: "Alamat Kantor Belum Diatur"
      },
      accounts: [
        { id: "ACC-01", username: "admin", nama: "Administrator Sistem", peran: "Admin" }
      ]
    };
    setState(defaultClearedState);
    if (auth.currentUser) {
      setSyncStatus('loading');
      try {
        const purgeCollection = async (colName: string) => {
          const snap = await getDocs(collection(db, colName));
          const batch = writeBatch(db);
          snap.forEach(d => {
            batch.delete(d.ref);
          });
          await batch.commit();
        };

        await purgeCollection('jamaah');
        await purgeCollection('periode');
        await purgeCollection('payment');
        await purgeCollection('accounts');
        await purgeCollection('departure_schedule');

        await setDoc(doc(db, 'config', 'lembaga'), defaultClearedState.lembaga);
        await setDoc(doc(db, 'accounts', 'ACC-01'), defaultClearedState.accounts[0]);
        await setDoc(doc(db, 'periode', 'P-D1'), defaultClearedState.periodeList[0]);
        setSyncStatus('synced');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'clear-all');
        setSyncStatus('error');
      }
    }
  };

  // Open Dossier Print
  const handleSelectPrintJamaah = (j: Jamaah) => {
    setSelectedPrintJamaah(j);
    setPrintType('dossier');
  };

  // Open Receipt Print
  const handleSelectPrintReceipt = (p: Payment) => {
    setSelectedPrintPayment(p);
    
    // Inject the Name of the Pilgrim directly for receipt representation
    const associatedPilgrim = state.jamaahList.find(j => j.id === p.jamaahId);
    const virtualPaymentObj = {
      ...p,
      // Overriding jamaahId code to the actual Name is easier for formatting
      jamaahId: associatedPilgrim ? associatedPilgrim.namaLengkap : 'Jamaah Mandiri'
    };
    setSelectedPrintPayment(virtualPaymentObj);
    setPrintType('receipt');
  };

  // Open Register List Print
  const handleSelectPrintRegister = (list: Jamaah[], startDate: string, endDate: string) => {
    setSelectedPrintList(list);
    setPrintTitle('LAPORAN JOURNAL REGISTER REKAPITULASI JAMAAH');
    setPrintSubTitle(`Rentang Tanggal Pendaftaran: ${startDate} s/d ${endDate}`);
    setPrintType('register');
  };

  // Open Directory List Print
  const handleSelectPrintDirectory = (list: Jamaah[], year: string) => {
    setSelectedPrintList(list);
    setPrintTitle(`DIREKTORI ADMINISTRASI DAFTAR JAMAAH HAJI`);
    setPrintSubTitle(`Tahun Keberangkatan Haji: ${year}`);
    setPrintType('directory');
  };

  const handleClosePrintModal = () => {
    setPrintType(null);
    setSelectedPrintJamaah(null);
    setSelectedPrintPayment(null);
    setSelectedPrintList([]);
    setPrintTitle('');
    setPrintSubTitle('');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans select-none antialiased text-slate-800">
      
      {/* MOBILE HEADER NAVBAR */}
      <header className="lg:hidden bg-white text-slate-800 shadow-sm border-b border-slate-200 px-4 py-3 flex justify-between items-center no-print sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#f59e0b] flex items-center justify-center text-white font-bold shadow">
            <User size={16} className="text-white fill-white" />
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-tight text-slate-800">
              {state.lembaga.namaLembaga}
            </h1>
          </div>
        </div>

        {/* Mobile menu and Online action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOnlineModalOpen(true)}
            className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition shadow-xs cursor-pointer"
          >
            <Globe size={13} className="text-[#f59e0b]" />
            <span>Online</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-600 hover:text-emerald-700 bg-slate-100 rounded hover:bg-slate-200 transition"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[52px] bg-[#0b4d2c] border-b border-emerald-800 text-white z-40 p-4 space-y-1 shadow-lg no-print">
          <button
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2 px-3 rounded text-xs font-bold flex items-center gap-2 transition ${activeTab === 'dashboard' ? 'bg-[#14532d] text-white border-l-4 border-[#f59e0b]' : 'hover:bg-white/10'}`}
          >
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => { setActiveTab('jamaah'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2 px-3 rounded text-xs font-bold flex items-center gap-2 transition ${activeTab === 'jamaah' ? 'bg-[#14532d] text-white border-l-4 border-[#f59e0b]' : 'hover:bg-white/10'}`}
          >
            <Users size={15} />
            <span>Manajemen Jamaah</span>
          </button>
          <button
            onClick={() => { setActiveTab('periode'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2 px-3 rounded text-xs font-bold flex items-center gap-2 transition ${activeTab === 'periode' ? 'bg-[#14532d] text-white border-l-4 border-[#f59e0b]' : 'hover:bg-white/10'}`}
          >
            <Calendar size={15} />
            <span>Manajemen Periode</span>
          </button>
          <button
            onClick={() => { setActiveTab('pembayaran'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2 px-3 rounded text-xs font-bold flex items-center gap-2 transition ${activeTab === 'pembayaran' ? 'bg-[#14532d] text-white border-l-4 border-[#f59e0b]' : 'hover:bg-white/10'}`}
          >
            <CreditCard size={15} />
            <span>Manajemen Pembayaran</span>
          </button>
          <button
            onClick={() => { setActiveTab('departure'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2 px-3 rounded text-xs font-bold flex items-center gap-2 transition ${activeTab === 'departure' ? 'bg-[#14532d] text-white border-l-4 border-[#f59e0b]' : 'hover:bg-white/10'}`}
          >
            <Calendar size={15} />
            <span>Jadwal Keberangkatan</span>
          </button>
          <button
            onClick={() => { setActiveTab('report'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2 px-3 rounded text-xs font-bold flex items-center gap-2 transition ${activeTab === 'report' ? 'bg-[#14532d] text-white border-l-4 border-[#f59e0b]' : 'hover:bg-white/10'}`}
          >
            <FileText size={15} />
            <span>Laporan & Riwayat</span>
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
            className={`w-full text-left py-2 px-3 rounded text-xs font-bold flex items-center gap-2 transition ${activeTab === 'settings' ? 'bg-[#14532d] text-white border-l-4 border-[#f59e0b]' : 'hover:bg-white/10'}`}
          >
            <Settings size={15} />
            <span>Pengaturan</span>
          </button>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* DESKTOP SIDEBAR RAIL */}
        <aside className="hidden lg:flex w-64 bg-[#0b4d2c] text-white flex-col justify-between flex-shrink-0 no-print border-r border-[#072412] shadow-xl">
          <div>
            {/* Header: Brand of KBIH */}
            <div className="p-5 flex items-center gap-3 border-b border-emerald-900/30 bg-black/10">
              <div className="w-10 h-10 rounded-full bg-[#f59e0b] flex items-center justify-center text-white shadow-md flex-shrink-0">
                <User size={20} className="text-white fill-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-emerald-200 mt-0.5 font-bold">Aplikasi Haji</p>
                <h1 className="text-xs font-black tracking-tight text-white uppercase truncate">
                  {state.lembaga.namaLembaga}
                </h1>
              </div>
            </div>
            
            <div className="py-4">
              <div className="px-5 mb-2 text-[10px] uppercase font-black text-emerald-300/80 tracking-widest">Menu Utama</div>
              
              <nav className="space-y-1">
                {/* 1. Dashboard */}
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full text-left py-2.5 px-5 text-xs font-bold flex items-center justify-between transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-[#14532d] text-white border-l-4 border-[#f59e0b] shadow-sm'
                      : 'text-emerald-100/90 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard size={15} className="text-emerald-300" />
                    <span>Dashboard</span>
                  </div>
                </button>

                {/* 2. Manajemen Jamaah */}
                <button
                  onClick={() => setActiveTab('jamaah')}
                  className={`w-full text-left py-2.5 px-5 text-xs font-bold flex items-center justify-between transition-all ${
                    activeTab === 'jamaah'
                      ? 'bg-[#14532d] text-white border-l-4 border-[#f59e0b] shadow-sm'
                      : 'text-emerald-100/90 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users size={15} className="text-emerald-300" />
                    <span>Manajemen Jamaah</span>
                  </div>
                  <span className={`text-[9px] py-0.2 px-1.5 rounded font-sans font-bold ${activeTab === 'jamaah' ? 'bg-emerald-950 text-emerald-100' : 'bg-emerald-950/50 text-emerald-300'}`}>
                    {state.jamaahList.length}
                  </span>
                </button>

                {/* 3. Manajemen Periode */}
                <button
                  onClick={() => setActiveTab('periode')}
                  className={`w-full text-left py-2.5 px-5 text-xs font-bold flex items-center justify-between transition-all ${
                    activeTab === 'periode'
                      ? 'bg-[#14532d] text-white border-l-4 border-[#f59e0b] shadow-sm'
                      : 'text-emerald-100/90 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar size={15} className="text-emerald-300" />
                    <span>Manajemen Periode</span>
                  </div>
                  <span className={`text-[9px] py-0.2 px-1.5 rounded font-sans font-bold ${activeTab === 'periode' ? 'bg-emerald-950 text-emerald-100' : 'bg-emerald-950/50 text-emerald-300'}`}>
                    {state.periodeList.length}
                  </span>
                </button>

                {/* 4. Manajemen Pembayaran */}
                <button
                  onClick={() => setActiveTab('pembayaran')}
                  className={`w-full text-left py-2.5 px-5 text-xs font-bold flex items-center justify-between transition-all ${
                    activeTab === 'pembayaran'
                      ? 'bg-[#14532d] text-white border-l-4 border-[#f59e0b] shadow-sm'
                      : 'text-emerald-100/90 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard size={15} className="text-emerald-300" />
                    <span>Manajemen Pembayaran</span>
                  </div>
                  <span className={`text-[9px] py-0.2 px-1.5 rounded font-sans font-bold ${activeTab === 'pembayaran' ? 'bg-emerald-950 text-emerald-100' : 'bg-emerald-950/50 text-emerald-300'}`}>
                    {state.paymentList.length}
                  </span>
                </button>

                {/* 5. Jadwal Keberangkatan */}
                <button
                  onClick={() => setActiveTab('departure')}
                  className={`w-full text-left py-2.5 px-5 text-xs font-bold flex items-center justify-between transition-all ${
                    activeTab === 'departure'
                      ? 'bg-[#14532d] text-white border-l-4 border-[#f59e0b] shadow-sm'
                      : 'text-emerald-100/90 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar size={15} className="text-emerald-300" />
                    <span>Jadwal Keberangkatan</span>
                  </div>
                  <span className={`text-[9px] py-0.2 px-1.5 rounded font-sans font-bold ${activeTab === 'departure' ? 'bg-emerald-950 text-emerald-100' : 'bg-emerald-950/50 text-emerald-300'}`}>
                    {(state.departureScheduleList || []).length}
                  </span>
                </button>

                {/* 6. Laporan & Riwayat */}
                <button
                  onClick={() => setActiveTab('report')}
                  className={`w-full text-left py-2.5 px-5 text-xs font-bold flex items-center justify-between transition-all ${
                    activeTab === 'report'
                      ? 'bg-[#14532d] text-white border-l-4 border-[#f59e0b] shadow-sm'
                      : 'text-emerald-100/90 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText size={15} className="text-emerald-300" />
                    <span>Laporan & Riwayat</span>
                  </div>
                </button>

                {/* 6. Pengaturan */}
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full text-left py-2.5 px-5 text-xs font-bold flex items-center gap-2.5 rounded transition-all ${
                    activeTab === 'settings'
                      ? 'bg-[#14532d] text-white border-l-4 border-[#f59e0b] shadow-sm'
                      : 'text-emerald-100/90 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Settings size={15} className="text-emerald-300" />
                  <span>Pengaturan</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Sidebar Footer Details matching screenshot */}
          <div className="p-5 border-t border-emerald-900/30 bg-black/10">
            <div className="text-[10px] text-emerald-300/50 font-medium tracking-wide">
              <p>Sistem Pendaftaran Haji Mandiri</p>
              <p className="mt-0.5">v1.0.0 © 2025</p>
            </div>
          </div>
        </aside>

        {/* WORKSPACE AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* DESKTOP HEADER BAR */}
          <header className="hidden lg:flex bg-white text-slate-800 shadow-xs border-b border-slate-200/60 px-6 py-4 justify-between items-center no-print sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-slate-800 tracking-tight capitalize">
                {activeTab === 'dashboard' ? 'Dashboard' : 
                 activeTab === 'jamaah' ? 'Manajemen Jamaah' :
                 activeTab === 'periode' ? 'Manajemen Periode & Kuota' :
                 activeTab === 'pembayaran' ? 'Manajemen Pembayaran' :
                 activeTab === 'departure' ? 'Jadwal Keberangkatan' :
                 activeTab === 'report' ? 'Laporan & Riwayat' : 'Pengaturan'}
              </h2>
              
              {/* Dynamic Synchronization State Indicators (Floating subtly next to Title) */}
              <div className="flex items-center gap-2 ml-4">
                {localBackendActive ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-150">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-1 inline-block" />
                    Lokal Disk Sync
                  </span>
                ) : fbUser ? (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-150">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 inline-block animate-pulse" />
                      Firebase Aktif ({fbUser.displayName?.split(' ')[0] || fbUser.email?.split('@')[0]})
                    </span>
                    <button
                      onClick={async () => {
                        await signOut(auth);
                      }}
                      className="text-[10px] text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Keluar dari sesi Firebase"
                    >
                      (Keluar)
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      setSyncStatus('loading');
                      try {
                        await signInWithPopup(auth, googleProvider);
                      } catch (err) {
                        console.error("Auth error", err);
                        setSyncStatus('error');
                      }
                    }}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-[#0b4d2c] border border-emerald-250 transition cursor-pointer shadow-xs active:scale-95"
                    title="Klik untuk menghubungkan database ke Firebase Cloud via Akun Google"
                  >
                    <Cloud size={11} className="mr-1 text-emerald-600" />
                    Hubungkan Firebase (Google)
                  </button>
                )}
              </div>
            </div>

            {/* Right Profile & Online Access */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsOnlineModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0b4d2c] border border-emerald-200/90 font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                title="Buka Tautan Online & QR Code"
              >
                <Globe size={14} className="text-[#f59e0b]" />
                <span>Akses Online</span>
              </button>

              {/* Active user selector (Admin/Operator) */}
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Operator:</span>
                <select
                  value={currentUserId}
                  onChange={(e) => setCurrentUserId(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-bold cursor-pointer outline-none focus:ring-1 focus:ring-[#0b4d2c] transition"
                >
                  {state.accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.peran} - {acc.username}</option>
                  ))}
                </select>
              </div>

              {/* User badge */}
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <div className="w-8 h-8 rounded-full bg-[#105130] text-[#4ade80] flex items-center justify-center font-black text-xs uppercase shadow-inner">
                  {currentUser?.nama?.substring(0, 2).toUpperCase() || 'AD'}
                </div>
                <div className="text-left text-xs leading-none">
                  <p className="font-bold text-slate-700 leading-tight">{currentUser?.nama || 'Admin'}</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-65px)] no-print">
            
            {/* TAB DETECTOR RENDERER */}
            {activeTab === 'dashboard' && (
              <Dashboard
                state={state}
                setActiveTab={setActiveTab}
                currentUser={currentUser}
                onOpenOnlineModal={() => setIsOnlineModalOpen(true)}
              />
            )}

            {activeTab === 'jamaah' && (
              <JamaahManager
                jamaahList={state.jamaahList}
                periodeList={state.periodeList}
                onAddJamaah={handleAddJamaah}
                onUpdateJamaah={handleUpdateJamaah}
                onDeleteJamaah={handleDeleteJamaah}
                onSelectPrintJamaah={handleSelectPrintJamaah}
                localBackendActive={localBackendActive}
              />
            )}

            {activeTab === 'periode' && (
              <PeriodeManager
                periodeList={state.periodeList}
                jamaahList={state.jamaahList}
                onAddPeriode={handleAddPeriode}
                onUpdatePeriode={handleUpdatePeriode}
                onDeletePeriode={handleDeletePeriode}
              />
            )}

            {activeTab === 'pembayaran' && (
              <PembayaranManager
                paymentList={state.paymentList}
                jamaahList={state.jamaahList}
                onAddPayment={handleAddPayment}
                onUpdatePayment={handleUpdatePayment}
                onDeletePayment={handleDeletePayment}
                onSelectPrintReceipt={handleSelectPrintReceipt}
              />
            )}

            {activeTab === 'departure' && (
              <DepartureScheduleManager
                departureScheduleList={state.departureScheduleList || []}
                jamaahList={state.jamaahList}
                onAddSchedule={handleAddSchedule}
                onUpdateSchedule={handleUpdateSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onMarkAsDeparted={handleMarkAsDeparted}
              />
            )}

            {activeTab === 'report' && (
              <ReportHistory
                jamaahList={state.jamaahList}
                paymentList={state.paymentList}
                periodeList={state.periodeList}
                lembaga={state.lembaga}
                onSelectPrintJamaah={handleSelectPrintJamaah}
                onSelectPrintReceipt={handleSelectPrintReceipt}
                onSelectPrintRegister={handleSelectPrintRegister}
                onSelectPrintDirectory={handleSelectPrintDirectory}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsManager
                lembaga={state.lembaga}
                accounts={state.accounts}
                onUpdateLembaga={handleUpdateLembaga}
                onAddAccount={handleAddAccount}
                onUpdateAccount={handleUpdateAccount}
                onDeleteAccount={handleDeleteAccount}
                onExportDB={handleExportDB}
                onImportDB={handleImportDB}
                onClearDB={handleClearDB}
                onOpenOnlineAccess={() => setIsOnlineModalOpen(true)}
              />
            )}

          </main>
        </div>
      </div>

      {/* PRINT DIALOG SYSTEM */}
      <PrintPreview
        type={printType}
        selectedJamaah={selectedPrintJamaah}
        selectedPayment={selectedPrintPayment}
        selectedList={selectedPrintList}
        title={printTitle}
        subTitle={printSubTitle}
        lembaga={state.lembaga}
        onClose={handleClosePrintModal}
      />

      {/* ONLINE ACCESS & SHARING DIALOG */}
      <OnlineAccessModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        lembagaName={state.lembaga.namaLembaga}
        isCloudSynced={syncStatus === 'synced'}
        onConnectCloud={async () => {
          setSyncStatus('loading');
          try {
            await signInWithPopup(auth, googleProvider);
          } catch (err) {
            console.error("Auth error", err);
            setSyncStatus('error');
          }
        }}
      />

    </div>
  );
}
