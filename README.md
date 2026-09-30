# Invo. — Sistem Point of Sale (POS) & Manajemen Inventori FIFO

Sistem POS & Inventori modern untuk bisnis retail, grosir, dan manufaktur ringan dengan pelacakan modal berbasis FIFO (First-In, First-Out), konversi multi-satuan dinamis, dual-mode pengelolaan stok (Physical Allocation vs Floating Pool), serta paket bundling/hampers multi-item on-demand.

---

## 🌟 Fitur Utama & Model Inventori

### 1. Dual-Mode Pengelolaan Stok Jual (NEW v1.6.0)

#### A. Floating Pool (Stok Fleksibel / On-Demand)
- **Konsep:** Seluruh stok tersimpan sebagai satu tumpukan bebas di gudang. Satuan turunan (Box, Lusin, PCS) menghitung kapasitas siap jualnya secara real-time dari sisa stok gudang.
- **Sample Case:**
  - Gudang memiliki **449 PCS** kacamata (atau telur/kain meteran).
  - Satuan Jual: `1 Box = 50 PCS`, `1 Lusin = 12 PCS`, `1 PCS = 1 PCS`.
  - Di layar kasir, stok tampil: **449 PCS**, **37 Lusin** (449/12), dan **8 Box** (449/50).
  - Ketika ada pelanggan membeli **1 Lusin (12 PCS)**, kasir membungkus 12 PCS langsung dari tumpukan gudang.
  - Sisa stok gudang menjadi **437 PCS**. Layar kasir seketika memperbarui seluruh opsi:
    - PCS: `437 PCS`
    - Lusin: `36 Lusin` (437/12)
    - Box: `8 Box` (437/50)
  - **Kelebihan:** Tidak ada stok yang terkunci atau mubazir terbungkus jika tren pasar eceran sedang tinggi.

#### B. Physical Allocation (Repackage / Alokasi Kuota Fisik)
- **Konsep:** Pemilik membagi stok gudang ke dalam kemasan fisik siap jual dengan kuota tertentu di rak display toko.
- **Sample Case:**
  - Dari total **449 PCS**, pemilik membagi fisik menjadi:
    - **5 Box** (5 × 50 = 250 PCS)
    - **15 Lusin** (15 × 12 = 180 PCS)
    - **19 PCS** Eceran (19 × 1 = 19 PCS)
    - *Total Alokasi:* $250 + 180 + 19 = 449\text{ PCS}$ (100% klop dengan stok fisik gudang).
  - Di layar kasir, stok tampil murni sesuai kuota fisik kemasan: **5 Box**, **15 Lusin**, dan **19 PCS**.
  - Jika ada pembeli ingin membeli 25 PCS eceran, kasir hanya bisa menjual 19 PCS (karena 15 Lusin lainnya sudah diikat/dibungkus rapi secara fisik di rak dan tidak boleh dipecah sembarangan).
  - **Proteksi Sistem:** Mencegah *over-allocation* (jumlah alokasi tidak boleh melebihi total stok gudang). Dilengkapi tombol `⚡ Alokasikan Sisa ke Eceran` dan `🌊 Reset ke Floating Pool`.

---

### 2. Kapan Melakukan Switching (Floating Pool ⇄ Physical Allocation)?

| Arah Switching | Pemicu Kondisi Nyata di Lapangan (Trigger Kasus Bisnis) | Aksi di Sistem |
| :--- | :--- | :--- |
| **Floating Pool ➔ Physical Allocation** | 1. **Dead Stock & Menjelang Expired:** Barang curah (seperti sarden kaleng, susu, atau tepung terigu) yang mendekati masa expired dipisahkan dari tumpukan umum dan dialokasikan ke kuota paket grosir/promo murah agar cepat laku.<br>2. **Persaingan Harga (Price War):** Terjadi perang harga di pasar eceran; pemilik mengemas kuota fisik 20 Lusin dengan harga promo hemat agar perputaran uang modal lebih cepat.<br>3. **Kecepatan Layanan Jam Sibuk:** Mengemas paket lebih awal di pagi hari agar pembeli saat jam ramai bisa langsung mengambil tanpa antre penimbangan/pengepakan. | Klik tombol `📦 Repackage / Alokasi Stok` pada kartu barang, masukkan kuota fisik per satuan, lalu klik `💾 Simpan Alokasi Stok`. |
| **Physical Allocation ➔ Floating Pool** | 1. **Promo Selesai / Permintaan Eceran Membludak:** Pasar grosir lesu sementara pembeli eceran banyak; pemilik cukup membongkar ikatan kemasan dan mengembalikan barang ke tumpukan bebas.<br>2. **Fleksibilitas Bebas:** Tidak ingin ada stok terikat ke satuan tertentu. | Klik tombol `🌊 Reset ke Floating Pool` pada modal Repackage. Seluruh sisa kuota langsung menyatu kembali menjadi stok bebas tanpa merusak HPP FIFO. |

---

### 3. Kaitan dengan Composite Bundling / Hampers Buah (Model B - On-Demand)

Bagaimana jika toko menjual **Paket Hampers Buah** (misal: 1.5 kg Mangga + 1.0 kg Apel + 0.5 kg Anggur + 1 Keranjang)?
- **Masalah Jika Dipaketkan Fisik di Awal:** Buah segar mudah busuk jika dibungkus plastik parcel berhari-hari sebelum laku.
- **Solusi Model B (On-Demand / Just-In-Time):**
  - Barang komponen (Mangga, Apel, Anggur) tetap berada di gudang dalam mode **Floating Pool**.
  - Sistem menghitung kapasitas produksi hampers secara otomatis berbasis **Bottleneck** (stok buah yang paling sedikit).
  - Ketika kasir mengklik checkout 1 Paket Hampers, sistem otomatis memotong stok mangga 1.5kg, apel 1kg, anggur 0.5kg, dan keranjang 1 pcs dari batch FIFO masing-masing.
  - **Sinergi Switching:** Jika ada buah yang sudah sangat matang dan harus dihabiskan hari ini, pemilik dapat beralih ke *Physical Allocation* untuk mengunci kuota promo parcel hari itu juga, menjamin efisiensi modal dan meminimalkan kerugian buah busuk.

---

### 4. Setup Multi-Satuan & Pricing Engine
- Konversi satuan grosir ke pecahan eceran (Roll → Meter → Sprei M/L/XL atau Dus → Lusin → PCS).
- Penetapan harga otomatis via `% Margin Profit` atau `Manual Pricing`.
- Sinkronisasi otomatis harga jual saat restock pembelian baru masuk.

### 5. POS Kasir & Riwayat Transaksi
- Penjualan kasir cepat dengan metode bayar CASH, TRANSFER, dan QRIS.
- Dukungan transaksi *Real-Time* maupun *Backdate* (pencatatan tanggal lampau).
- Cetak struk belanja rapi.

### 6. Laporan Finansial & FIFO Batch Tracker
- Laporan Laba Rugi komprehensif (Omzet Penjualan, HPP/COGS FIFO, Beban Operasional, Laba Kotor & Bersih).
- Kartu batch inventori dengan indikator sisa stok dan peringatan stok menipis (*low-stock alert*).

### 7. Hak Akses Berbasis Peran (RBAC)
- **Owner:** Akses penuh seluruh fitur, laporan, dan konfigurasi margin.
- **Kasir:** Terfokus pada transaksi POS dan riwayat penjualan harian.
- **Reseller:** Akses katalog khusus produk bertanda reseller.
- **Developer:** Panel maintenance, reset data, dan inspeksi integritas sistem.

---

## 🚀 Panduan Instalasi & Menjalankan

1. **Install Dependensi:**
   ```bash
   npm install
   ```
2. **Jalankan Migrasi Database:**
   ```bash
   npx knex migrate:latest
   ```
3. **Jalankan Server:**
   ```bash
   npm run dev
   # Server berjalan di http://localhost:3000
   ```

## 👤 Akun Bawaan (Default)
- **Owner:** `admin@pos.com` / `admin123`
- **Developer:** `developer@pos.com` / `developer123`
- **Cashier:** `kasir@pos.com` / `kasir123`
- **Reseller:** `reseller@pos.com` / `reseller123`
