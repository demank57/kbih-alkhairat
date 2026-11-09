export function terbilang(nominal: number): string {
  const angka = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  
  if (nominal < 0) {
    return "Minus " + terbilang(Math.abs(nominal));
  }
  
  let hasil = "";
  if (nominal < 12) {
    hasil = angka[nominal];
  } else if (nominal < 20) {
    hasil = terbilang(nominal - 10) + " Belas";
  } else if (nominal < 100) {
    hasil = terbilang(Math.floor(nominal / 10)) + " Puluh " + terbilang(nominal % 10);
  } else if (nominal < 200) {
    hasil = "Seratus " + terbilang(nominal - 100);
  } else if (nominal < 1000) {
    hasil = terbilang(Math.floor(nominal / 100)) + " Ratus " + terbilang(nominal % 100);
  } else if (nominal < 2000) {
    hasil = "Seribu " + terbilang(nominal - 1000);
  } else if (nominal < 1000000) {
    hasil = terbilang(Math.floor(nominal / 1000)) + " Ribu " + terbilang(nominal % 1000);
  } else if (nominal < 1000000000) {
    hasil = terbilang(Math.floor(nominal / 1000000)) + " Juta " + terbilang(nominal % 1000000);
  } else if (nominal < 1000000000000) {
    hasil = terbilang(Math.floor(nominal / 1000000000)) + " Milyar " + terbilang(nominal % 1000000000);
  }
  
  // Clean empty spaces
  return hasil.replace(/\s+/g, ' ').trim() + " Rupiah";
}
