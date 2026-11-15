# Invo. — Sistem Point of Sale (POS) & Manajemen Inventori FIFO

Sistem POS & Inventori modern untuk bisnis retail, grosir, manufaktur ringan (konveksi), dan agribisnis dengan pelacakan modal berbasis FIFO (First-In, First-Out), konversi multi-satuan dinamis, dual-mode pengelolaan stok (Physical Allocation vs Floating Pool), paket bundling/hampers multi-item on-demand, manajemen SPK produksi konveksi (Make-to-Stock), manajemen hutang supplier (AP Aged Payables Net 30), serta pembayaran ganda (*split payment*) di kasir.

---

## 🗺️ Diagram Alur Bisnis Lengkap (Comprehensive Business Flow Diagrams)

### 1. Arsitektur Rantai Pasok Terpadu (End-to-End Enterprise Supply Chain)
Diagram di bawah menggambarkan siklus operasional hulu ke hilir: dari pembelian bahan baku ke supplier dengan termin hutang, konversi FIFO, proses produksi konveksi (SPK jahit), pemaketan hampers/repackage, transaksi kasir split payment, hingga rekonsiliasi laba rugi:

```mermaid
flowchart TD
    SUP["🤝 Supplier Bahan Baku / Grosir"] -->|"Kirim Barang & Terbitkan Faktur"| INBOUND_PURCHASE["📥 Pembelian / Restock (Purchases)"]

    subgraph AP_MGMT["Manajemen Termin Pembayaran & Hutang Dagang (Aged Payables)"]
        INBOUND_PURCHASE --> AP_CHECK{"Metode Pembayaran?"}
        AP_CHECK -->|"Tunai (CASH)"| AP_PAID["Status: Lunas (Paid)"]
        AP_CHECK -->|"Kredit (Net 15 / Net 30 / Net 60)"| AP_DEBT["Catat Hutang Usaha & Due Date Jatuh Tempo"]
        AP_DEBT --> AP_AGING["Laporan Aging Hutang (0-30, 31-60, 61-90, >90 Hari)"]
        AP_AGING --> AP_PAYMENT["💳 Pembayaran Cicilan Hutang (purchase_payments)"]
        AP_PAYMENT -->|"Lunas Penuh"| AP_PAID
    end

    subgraph FIFO_STORAGE["Penerimaan & Lapisan Batch Inventori (FIFO)"]
        INBOUND_PURCHASE -->|"Hitung Qty Grosir x Konversi Satuan Dasar"| CONV_BASE["Satuan Dasar (Meter / PCS / Kg)"]
        CONV_BASE --> RAW_BATCHES["📦 Inventory Batches Bahan Baku (Lapisan FIFO)"]
        RAW_BATCHES --> CALC_HPP["Hitung Rata-Rata HPP Dasar per Batch"]
    end

    subgraph VALUE_ADD["Pengolahan Nilai Tambah & Model Stok"]
        RAW_BATCHES --> PATH_CHOICE{"Jalur Pemanfaatan Stok"}
        
        PATH_CHOICE -->|"Jalur 1: Produksi Make-to-Stock"| SPK_PROD["✂️ SPK Jahit Konveksi (productions)"]
        SPK_PROD -->|"Potong Bahan Baku FIFO + Biaya Jahit + Aksesoris"| PROD_BATCH["📦 Batch Baru Produk Jadi (HPP Komposit)"]
        
        PATH_CHOICE -->|"Jalur 2: Stok Bebas Langsung"| FLOAT_POOL["🌊 Floating Pool (Konversi Otomatis On-Demand)"]
        
        PATH_CHOICE -->|"Jalur 3: Kemasan Fisik"| REPACK_ALLOC["📦 Physical Allocation (Repackage Kuota Display)"]
        
        PATH_CHOICE -->|"Jalur 4: Resep Hadiah / Parcel"| BUNDLE_HAMPERS["🧺 Composite Bundling (Hampers Buah JIT)"]
    end

    subgraph RETAIL_SALES["Penjualan POS Kasir & Multi-Payment"]
        PROD_BATCH & FLOAT_POOL & REPACK_ALLOC & BUNDLE_HAMPERS --> POS_CART["🛒 POS Kasir (Keranjang Belanja)"]
        POS_CART --> BACKDATE_VAL["Validasi Tanggal: Real-Time vs Backdate (Historis)"]
        BACKDATE_VAL --> SPLIT_PAY{"Pilihan Pembayaran Kasir"}
        SPLIT_PAY -->|"Single Method"| PAY_SINGLE["CASH / TRANSFER / QRIS"]
        SPLIT_PAY -->|"Split Payment"| PAY_MULTI["Kombinasi Kas + Transfer Bank / QRIS"]
        PAY_MULTI & PAY_SINGLE --> ATOMIC_DEDUCT["Eksekusi Checkout Atomic:<br>• Deduct FIFO Batch Terlama<br>• Snapshot HPP & Harga Jual Terkunci<br>• Catat Jurnal Pembayaran (CSH1, BNK1, QRIS1)"]
    end

    subgraph FINANCIAL_REPORTS["Laporan Finansial & Rekonsiliasi"]
        ATOMIC_DEDUCT --> P_L_REPORT["📊 Laporan Laba Rugi (P&L):<br>• Omzet Bersih<br>• HPP FIFO Terpotong<br>• Beban Operasional<br>• Laba Kotor & Laba Bersih"]
        ATOMIC_DEDUCT --> CASH_RECON["🏦 Rekonsiliasi Kas Toko & Mutasi Bank"]
    end
```

---

### 2. Dual-Mode Pengelolaan Stok: Floating Pool vs Physical Allocation & Logika Switching
Diagram alur penentuan mode stok siap jual dan proses peralihan (*switching*) berdasarkan dinamika pasar:

```mermaid
flowchart TD
    TOTAL_WH["📦 Total Stok Fisik di Gudang (Contoh: 449 PCS Kacamata)"] --> PILIH_MODE{"Pilih Mode Pengelolaan Stok"}

    subgraph FLOATING_POOL_FLOW["🌊 Mode Floating Pool (Default / Fleksibel)"]
        PILIH_MODE -->|"Karakteristik: Barang curah, telur, buah segar, kain meteran"| FL_FREE["Stok Bebas Tanpa Pengikatan Kuota di Awal"]
        FL_FREE --> FL_CALC["Perhitungan Kapasitas Siap Jual Otomatis di Kasir:"]
        FL_CALC --> V_PCS["PCS: 449 / 1 = 449 PCS"]
        FL_CALC --> V_LUSIN["Lusin: floor(449 / 12) = 37 Lusin"]
        FL_CALC --> V_BOX["Box: floor(449 / 50) = 8 Box"]
        V_LUSIN -->|"Pelanggan Beli 1 Lusin (12 PCS)"| SALE_FL["Kasir Ambil 12 PCS dari Tumpukan Gudang"]
        SALE_FL -->|"Sisa Gudang: 437 PCS"| RECALC_FL["Otomatis Ter-update: 437 PCS, 36 Lusin, 8 Box"]
    end

    subgraph SWITCH_TO_ALLOC["🔄 Pemicu Switching: Floating Pool ke Physical Allocation"]
        FL_FREE -.->|"1. Barang Mendekati Expired (Kemas Paket Sembako Murah)<br>2. Perang Harga Pasar (Amankan Margin dengan Paket Grosir)<br>3. Kesiapan Display Jam Sibuk (Packing di Pagi Hari)"| ACTION_REPACK["Buka Menu Produk ➔ Klik Repackage / Alokasi Stok"]
    end

    subgraph ALLOC_FLOW["📦 Mode Physical Allocation (Repackage)"]
        ACTION_REPACK --> INPUT_QUOTA["Owner Membagi Kuota Fisik Kemasan:<br>• 5 Box (250 PCS)<br>• 15 Lusin (180 PCS)<br>• 19 PCS Eceran (19 PCS)"]
        INPUT_QUOTA --> VALIDATION{"Validasi Matematis:<br>Total Alokasi <= Stok Fisik Gudang?"}
        VALIDATION -->|"Total 449 <= 449 (VALID)"| SAVE_QUOTA["💾 Simpan Kuota Fisik (stock_mode = 'allocated')"]
        VALIDATION -->|"Total > 449 (OVER-ALLOCATION)"| BLOCK_QUOTA["❌ Tombol Simpan Terkunci & Muncul Peringatan Merah"]
        SAVE_QUOTA --> POS_ALLOC_RESTRICT["Kasir Hanya Menjual Sesuai Kuota Kemasan Fisik di Rak Display"]
        POS_ALLOC_RESTRICT -->|"Pembeli Minta 25 PCS Eceran"| REJECT_OVER["Kasir Hanya Bisa Jual 19 PCS (Kemasan Lusin Tidak Boleh Dipecah)"]
    end

    subgraph SWITCH_TO_FLOAT["🔄 Pemicu Switching: Physical Allocation ke Floating Pool"]
        POS_ALLOC_RESTRICT -.->|"1. Periode Promo Berakhir<br>2. Peminat Grosir Sepi tapi Pembeli Eceran Melonjak"| ACTION_RESET["Klik Tombol Merah: Reset ke Floating Pool"]
        ACTION_RESET --> FL_FREE
    end
```

---

### 3. Composite Bundling / Hampers Buah (Model B - On-Demand JIT)
Diagram alur perakitan paket parcel multi-item tanpa perlu pembungkusan fisik di muka (mencegah buah busuk):

```mermaid
flowchart TD
    subgraph INVENTORI_BAHAN["1. Bahan Baku Independen di Gudang (Floating Pool)"]
        B1["🥭 Mangga: 30 Kg (HPP: Rp 20.000/Kg)"]
        B2["🍎 Apel: 12 Kg (HPP: Rp 35.000/Kg)"]
        B3["🍇 Anggur: 10 Kg (HPP: Rp 60.000/Kg)"]
        B4["🧺 Keranjang Parcel: 25 Pcs (HPP: Rp 15.000/Pcs)"]
    end

    subgraph DEFINISI_RESEP["2. Formulir Resep (Bill of Materials / BOM)"]
        BOM["Paket Hampers Buah Segar Premium<br>Harga Jual: Rp 150.000"]
        BOM --> R1["Kebutuhan: 1.5 Kg Mangga"]
        BOM --> R2["Kebutuhan: 1.0 Kg Apel"]
        BOM --> R3["Kebutuhan: 0.5 Kg Anggur"]
        BOM --> R4["Kebutuhan: 1.0 Pcs Keranjang"]
    end

    subgraph DYNAMIC_ENGINE["3. Deteksi Bottleneck & Perhitungan HPP Komposit (JIT)"]
        R1 & B1 --> K1["Kapasitas Mangga = floor(30 / 1.5) = 20 Paket"]
        R2 & B2 --> K2["Kapasitas Apel = floor(12 / 1.0) = 12 Paket (BOTTLENECK)"]
        R3 & B3 --> K3["Kapasitas Anggur = floor(10 / 0.5) = 20 Paket"]
        R4 & B4 --> K4["Kapasitas Keranjang = floor(25 / 1.0) = 25 Paket"]
        
        K1 & K2 & K3 & K4 --> DETECT_BOTTLENECK["Stok Siap Rakit: MIN(20, 12, 20, 25) = 12 Paket"]
        
        R1 --> H1["Biaya Mangga = 1.5 x Rp 20.000 = Rp 30.000"]
        R2 --> H2["Biaya Apel = 1.0 x Rp 35.000 = Rp 35.000"]
        R3 --> H3["Biaya Anggur = 0.5 x Rp 60.000 = Rp 30.000"]
        R4 --> H4["Biaya Keranjang = 1.0 x Rp 15.000 = Rp 15.000"]
        H1 & H2 & H3 & H4 --> CALC_HPP["Total HPP Paket = Rp 110.000"]
        CALC_HPP --> CALC_PROFIT["Estimasi Profit = Rp 150.000 - Rp 110.000 = Rp 40.000 (+36.4%)"]
    end

    subgraph CHECKOUT_TRANSACTION["4. Transaksi Kasir POS & Pemotongan Multi-FIFO Atomic"]
        DETECT_BOTTLENECK --> SALE_ACTION["Pelanggan Beli 1 Paket Hampers di Kasir"]
        SALE_ACTION --> ATOMIC_DEDUCT["Database Transaction (Knex.js Atomic):<br>1. Potong 1.5 Kg Mangga dari Batch Terlama (FIFO)<br>2. Potong 1.0 Kg Apel dari Batch Terlama (FIFO)<br>3. Potong 0.5 Kg Anggur dari Batch Terlama (FIFO)<br>4. Potong 1.0 Pcs Keranjang dari Batch Terlama (FIFO)<br>5. Catat 1 Baris Penjualan dengan HPP Aktual Rp 110.000"]
        ATOMIC_DEDUCT --> FIN_SYNC["Laporan Keuangan Terupdate Otomatis:<br>• Omzet Bertambah Rp 150.000<br>• COGS Bertambah Rp 110.000<br>• Laba Kotor Bersih Rp 40.000"]
    end
```

---

### 4. Alur Produksi Konveksi: SPK Jahit & Kalkulasi HPP Komposit (Make-to-Stock)
Diagram alur konversi bahan mentah/kain menjadi produk jadi bernilai jual tinggi:

```mermaid
flowchart TD
    RAW_INPUT["Pilih Bahan Baku Kain Mentah (Misal: Kain Katun Rayon)"] --> SELECT_PRODUCT["Pilih Varian Produk Jadi (Misal: Sprei Ukuran L)"]
    SELECT_PRODUCT --> INPUT_QTY["Input Jumlah Jadi: 20 Pcs Sprei L (Konversi: 2.5 Meter/Pcs)"]
    
    subgraph FIFO_ESTIMATE["Kalkulasi Kebutuhan & Biaya Bahan Baku FIFO"]
        INPUT_QTY --> CALC_METERS["Kebutuhan Bahan = 20 x 2.5 = 50 Meter"]
        CALC_METERS --> FIFO_CHECK{"Cek Ketersediaan Stok Batch FIFO Aktif"}
        FIFO_CHECK -->|"Tersedia 60 Meter @ Rp 20.000"| RAW_COST["Biaya Bahan Mentah = 50 x Rp 20.000 = Rp 1.000.000"]
        FIFO_CHECK -->|"Kurang dari 50 Meter"| STOP_PROD["❌ Tolak SPK: Bahan Baku Tidak Cukup"]
    end

    subgraph COMPOSITE_COSTING["Kalkulasi Biaya Konveksi Tambahan"]
        RAW_COST --> INPUT_LABOR["Input Ongkos Jahit per Pcs: Rp 15.000 (Total Rp 300.000)"]
        INPUT_LABOR --> INPUT_ACC["Input Aksesoris/Karet per Pcs: Rp 5.000 (Total Rp 100.000)"]
        INPUT_ACC --> SUM_PROD_COST["Total Biaya Produksi = Rp 1.000.000 + 300.000 + 100.000 = Rp 1.400.000"]
        SUM_PROD_COST --> UNIT_COST_CALC["HPP Komposit Produk Jadi = Rp 1.400.000 / 20 = Rp 70.000 / Pcs"]
    end

    subgraph EXEC_PRODUCTION["Eksekusi SPK Selesai (Atomic Database Transaction)"]
        UNIT_COST_CALC --> DEDUCT_RAW["1. Potong 50 Meter Kain Katun dari Batch Mentah Terlama (FIFO)"]
        DEDUCT_RAW --> CREATE_FG_BATCH["2. Terbitkan Batch Baru di inventory_batches:<br>• Nama: Sprei Ukuran L<br>• Qty Awal: 20 Pcs<br>• HPP Dasar: Rp 70.000 / Pcs"]
        CREATE_FG_BATCH --> RECORD_SPK["3. Simpan Riwayat SPK di tabel 'productions' (No: PRD-202611-0001, Status: DONE)"]
        RECORD_SPK --> READY_DISPLAY["4. 20 Pcs Sprei L Siap Muncul di Kasir POS dengan HPP Akurat Rp 70.000"]
    end
```

---

### 5. Alur Kasir POS, Split Multi-Payment & Rekonsiliasi Jurnal Keuangan
Diagram alur penanganan kasir dengan berbagai metode bayar, pembayaran parsial (*split payment*), dan kode akun jurnal:

```mermaid
flowchart TD
    START_POS["Kasir Membuka Modul POS Kasir"] --> CHOOSE_ITEMS["Pilih Produk ke Keranjang (Reguler / Alokasi / Bundle)"]
    CHOOSE_ITEMS --> SET_BACKDATE["Set Tanggal Transaksi: Waktu Sekarang atau Backdate (Historis)"]
    SET_BACKDATE --> CHOOSE_SPLIT{"Jenis Pembayaran Pelanggan"}

    subgraph SINGLE_PAY_FLOW["Opsi A: Single Payment"]
        CHOOSE_SPLIT -->|"Satu Metode Saja"| SINGLE_METHOD{"Pilih Kanal"}
        SINGLE_METHOD -->|"CASH"| S_CASH["Input Nominal Tunai ➔ Hitung Kembalian ➔ Kode Jurnal: CSH1"]
        SINGLE_METHOD -->|"TRANSFER"| S_TRF["Pilih Bank Tujuan (BCA/Mandiri) ➔ Kode Jurnal: BNK1"]
        SINGLE_METHOD -->|"QRIS"| S_QRIS["Scan QRIS Statis/Dinamis ➔ Kode Jurnal: QRIS1"]
    end

    subgraph MULTI_PAY_FLOW["Opsi B: Split Multi-Payment (Contoh: Total Rp 500.000)"]
        CHOOSE_SPLIT -->|"Split Pembayaran"| INPUT_SPLIT["Kasir Menambah Kanal Pembayaran:"]
        INPUT_SPLIT --> SPLIT_1["Kanal 1: CASH Rp 200.000 (Jurnal: CSH1)"]
        INPUT_SPLIT --> SPLIT_2["Kanal 2: TRANSFER Rp 300.000 (Jurnal: BNK1)"]
        SPLIT_1 & SPLIT_2 --> VALIDATE_SUM{"Validasi: Total Bayar >= Total Tagihan?"}
        VALIDATE_SUM -->|"Kurang"| ERR_SPLIT["Peringatan: Jumlah Pembayaran Masih Kurang"]
        VALIDATE_SUM -->|"Sesuai / Lebih"| OK_SPLIT["Valid: Set is_split = true & Hitung Kembalian Tunai"]
    end

    subgraph COMMIT_TRANSACTION["Eksekusi Penyimpanan Database Atomic"]
        S_CASH & S_TRF & S_QRIS & OK_SPLIT --> ATOMIC_SAVE["Database Transaction (Knex.js):<br>1. Simpan Header Transaksi (tabel 'transactions')<br>2. Simpan Rincian Pembayaran (tabel 'transaction_payments')<br>3. Simpan Snapshot Penjualan (tabel 'transaction_items')<br>4. Potong Stok Batch FIFO Terlama"]
        ATOMIC_SAVE --> PRINT_RECEIPT["Cetak Struk Transaksi (Rincian Kanal Split Tercetak Jelas)"]
        ATOMIC_SAVE --> CASH_SETTLEMENT["Rekonsiliasi Kasir & Laporan Per Kanal:<br>• Setoran Fisik Laci Kasir (CSH1)<br>• Mutasi Rekening Bank (BNK1)<br>• Settlement QRIS E-Wallet (QRIS1)"]
    end
```

---

## 🌟 Fitur Utama Sistem

### 1. Dual-Mode Pengelolaan Stok Jual
- **Floating Pool (Default):** Seluruh stok tersimpan sebagai satu tumpukan bebas di gudang. Satuan turunan (Box, Lusin, PCS) menghitung kapasitas siap jualnya secara real-time dari sisa stok gudang tanpa mengunci stok fisik.
- **Physical Allocation (Repackage):** Pemilik membagi stok gudang ke dalam kemasan fisik siap jual dengan kuota tertentu di rak display toko, dilengkapi kalkulator live dan proteksi anti over-allocation.
- **Tombol Pintas Dinamis:** `⚡ Alokasikan Sisa ke Eceran` dan `🌊 Reset ke Floating Pool` untuk kemudahan operasional harian.

### 2. Composite Bundling / Paket Hampers (Model B - On-Demand JIT)
- Formula resep (*Bill of Materials*) untuk merakit paket hadiah/parcel dari berbagai komponen barang master.
- Deteksi kapasitas stok siap rakit secara otomatis berdasarkan komponen terendah (*Bottleneck*).
- Pemotongan multi-komponen FIFO secara atomic saat kasir melakukan checkout, mencatat total HPP aktual tanpa mendistorsi laporan laba rugi.

### 3. Make-to-Stock / SPK Jahit Produksi Konveksi
- Surat Perintah Kerja (SPK) untuk mengubah bahan baku mentah (misal: kain katun) menjadi produk jadi bernilai jual tinggi (misal: sprei kasur).
- Perhitungan HPP komposit otomatis: memadukan biaya bahan baku FIFO dengan ongkos tenaga jahit (*labor cost*) dan aksesoris (*accessory cost*).
- Penerbitan batch persediaan barang jadi baru secara otomatis begitu SPK diselesaikan.

### 4. Manajemen Hutang Dagang (Aged Payables & Net 30)
- Mendukung pencatatan pembelian restock secara kredit dengan termin pembayaran fleksibel (*Cash*, *Net 15*, *Net 30*, *Net 60*, atau *Custom*).
- Pelacakan jatuh tempo (*due date*) dan status pelunasan (*paid*, *partially_paid*, *not_paid*).
- Pencatatan pembayaran cicilan hutang supplier via tabel `purchase_payments`.
- Laporan Analisis Umur Hutang (*Aged Payables Report*: 0-30, 31-60, 61-90, dan >90 hari).

### 5. Split Multi-Payment & Multi-Journal Kasir POS
- Pelanggan dapat membayar dengan kombinasi metode (misal: sebagian tunai dan sisanya transfer bank atau QRIS).
- Pelacakan kode akun jurnal penerimaan kas/bank: `CSH1` (Kas Kasir), `BNK1` (Bank Transfer), `QRIS1` (QRIS Settlement).
- Dukungan transaksi penjualan *Real-Time* maupun *Backdate* (pencatatan tanggal lampau untuk migrasi data).

### 6. Laporan Finansial Komprehensif & FIFO Engine
- Laporan Laba Rugi real-time (*Gross Profit* = Omzet - HPP FIFO, *Net Profit* = Laba Kotor - Beban Pengeluaran Operasional).
- Kartu persediaan batch FIFO dengan persentase sisa stok dan indikator peringatan stok menipis (*low-stock alert*).

### 7. Hak Akses Berbasis Peran (RBAC)
- **Owner:** Akses penuh seluruh fitur, konfigurasi harga, SPK jahit, alokasi stok, dan laporan keuangan.
- **Kasir:** Melayani transaksi POS (single/split payment) dan riwayat transaksi harian.
- **Reseller:** Akses portal POS khusus dengan katalog produk bertanda `reseller_visible`.
- **Developer:** Panel isolasi tunggal (*Developer Maintenance*) untuk pemeliharaan dan pembersihan data terfilter tanpa merusak akun pengguna.

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
3. **Jalankan Server (Development):**
   ```bash
   npm run dev
   # Akses sistem di browser: http://localhost:3000
   ```

## 👤 Akun Bawaan (Default Login)
- **Owner (Admin):** `admin@pos.com` / `admin123`
- **Developer:** `developer@pos.com` / `developer123`
- **Cashier (Kasir):** `kasir@pos.com` / `kasir123`
- **Reseller:** `reseller@pos.com` / `reseller123`
