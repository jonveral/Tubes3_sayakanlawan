# TUGAS BESAR III IF2211 STRATEGI ALGORITMA

## Implementasi Pattern Matching pada Chromium Browser Extension untuk Deteksi Judi Online

## Identitas

| Nama | NIM |
| --- | --- |
| Timothy Bernard Soeharto | 13524092 |
| Jonathan Alveraldo Bangun | 13524120 |
| Ramadhian Nabil Firdaus Gumay | 13524126 |

## Deskripsi Singkat

Judol Detector adalah Chromium browser extension untuk mendeteksi teks yang berpotensi berkaitan dengan judi online pada halaman web. Extension mengambil teks dari DOM halaman, mencocokkannya dengan daftar keyword, lalu menampilkan hasil deteksi melalui highlight pada halaman dan statistik pada popup.

Pencocokan teks dilakukan menggunakan beberapa pendekatan pattern matching, yaitu Knuth-Morris-Pratt, Boyer-Moore, Regular Expression, Weighted Levenshtein Distance, serta algoritma bonus Aho-Corasick dan Rabin-Karp.

## Fitur

- Deteksi keyword judi online dari teks halaman web.
- Pattern matching exact menggunakan Knuth-Morris-Pratt dan Boyer-Moore.
- Pattern matching tambahan menggunakan Regular Expression.
- Fuzzy matching menggunakan Weighted Levenshtein Distance.
- Algoritma bonus Aho-Corasick dan Rabin-Karp.
- Highlight pada teks yang terdeteksi di halaman.
- Tooltip berisi informasi hasil deteksi.
- Popup statistik berisi jumlah match, keyword terdeteksi, algoritma, dan waktu eksekusi.
- Manual rescan dari popup.
- Mode blur/censorship untuk teks yang terdeteksi.

## Teknologi

- TypeScript
- Chromium Extension Manifest V3
- Node.js
- esbuild
- Vite

## Struktur Direktori

```text
public/
  manifest.json
  keywords/
    keywords.txt

scripts/
  build.mjs

src/
  algorithms/
  content/
  detection/
  keywords/
  popup/
  shared/

dist/
```

Keterangan:

- `public/manifest.json`: konfigurasi utama extension yang dibaca oleh browser.
- `public/keywords/keywords.txt`: daftar keyword yang digunakan untuk deteksi.
- `scripts/build.mjs`: script build untuk membuat folder `dist/`.
- `src/algorithms/`: implementasi algoritma pattern matching.
- `src/content/`: content script untuk membaca DOM, menjalankan deteksi, dan memberi highlight.
- `src/detection/`: pipeline utama yang menggabungkan hasil tiap algoritma.
- `src/keywords/`: loader keyword dari file `keywords.txt`.
- `src/popup/`: tampilan dan logika popup extension.
- `src/shared/`: kontrak data, message type, dan utilitas statistik.
- `dist/`: hasil build yang dimuat ke browser.

## Cara Menjalankan

Install dependency:

```bash
npm install
```

Build extension:

```bash
npm run build
```

Load extension di Chromium browser:

1. Buka `chrome://extensions`.
2. Aktifkan `Developer mode`.
3. Pilih `Load unpacked`.
4. Pilih folder `dist/`.
5. Buka halaman web yang ingin diperiksa.
6. Klik icon extension untuk melihat statistik atau melakukan rescan.

## Script NPM

```bash
npm run typecheck
npm run build
```

- `npm run typecheck`: memeriksa tipe TypeScript tanpa menghasilkan file build.
- `npm run build`: menjalankan typecheck lalu membuat output extension ke folder `dist/`.

## Alur Kerja Extension

1. Browser membaca `manifest.json`.
2. Browser memuat `content.js` ke halaman web sesuai konfigurasi content script.
3. Content script memuat daftar keyword dari `keywords.txt`.
4. Content script mengambil teks dari DOM halaman.
5. Pipeline deteksi menjalankan algoritma pattern matching.
6. Hasil deteksi digunakan untuk memberi highlight pada halaman.
7. Hasil scan disimpan ke `chrome.storage`.
8. Popup membaca hasil scan dan menampilkan statistik.

## Catatan

- Folder `dist/` adalah output hasil build.
- Perubahan pada source di `src/` perlu di-build ulang agar masuk ke `dist/`.
- Folder `node_modules/` berisi dependency Node.js hasil `npm install` dan tidak perlu diedit manual.
