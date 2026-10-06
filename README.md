# MyArsip Nikah

Aplikasi arsip nikah digital untuk Desa Pelang Kidul.

## Struktur proyek

- `ArsipNikah-FIX23.html` - halaman utama aplikasi
- `css/style.css` - stylesheet utama
- `js/config.js` - konfigurasi aplikasi dan credentials default
- `js/app.js` - logika utama aplikasi
- `maskot-si-arsip-nikah.png` - asset maskot

## Cara menjalankan

1. Buka file `index.html` atau `ArsipNikah-FIX23.html` di browser.
2. Jika ingin menggunakan Supabase, isi konfigurasi di `js/config.js`.
3. Jika ingin demo lokal, login akan menggunakan email/password default yang ada di file konfigurasi.

## Catatan

- Untuk penggunaan nyata, sebaiknya mengganti login lokal dengan sistem autentikasi server-side dan database yang aman.
- Kunci Supabase yang dipakai di frontend sebaiknya hanya `anon/public key`, bukan secret key.
