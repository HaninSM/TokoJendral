# 📄 PRODUCT REQUIREMENTS DOCUMENT (PRD)
# Sistem POS & Manajemen Inventori Enterprise Multi-Role

---

## 📌 Dokumen Meta & Version Control

| Atribut | Detail |
| :--- | :--- |
| **Nama Proyek** | Multi-Role POS & Inventory System with FIFO, Dual-Mode Stock, Make-to-Stock Production, AP Aging & Split Payment |
| **Status Dokumen** | **APPROVED & IMPLEMENTED** |
| **Versi Terkini** | **v1.7.0** |
| **Tanggal Rilis Terkini** | 15 November 2026 |
| **Arsitektur** | Spec-Driven Development (SDD) & MVC Module Architecture |
| **Stack Teknologi** | Node.js, Express.js, Knex.js, SQLite (better-sqlite3), Vanilla JS SPA, Modern CSS3 SaaS Theme |

---

## 📜 Riwayat Versi (Change Tracking & Changelog)

| Versi | Tanggal | Status | Ringkasan Perubahan |
| :---: | :---: | :---: | :--- |
| **v1.0.0** | 26 Sep 2026 | *Baseline* | Rilis inisial SDD: 9 tabel, stok FIFO satuan dasar, kasir & reseller POS, laporan laba rugi. |
| **v1.1.0** | 27 Sep 2026 | *Superseded* | Upgrade Master Item & Multi-Unit Variant (tabel `items`, single-setup multi-satuan, autocomplete pembelian, direct qty di POS). |
| **v1.2.0** | 27 Sep 2026 | *Superseded* | Data Migration & Backdate POS: Input tanggal backdate di POS Kasir, normalisasi boundary tanggal laporan, reset bersih baris varian, sinkronisasi dinamis label kebutuhan stok. |
| **v1.3.0** | 28 Sep 2026 | *Superseded* | Otomatisasi Harga Jual Berbasis Margin pada Pembelian (Inbound Margin Sync) dengan jaminan integritas data transaksi penjualan historis tidak terpengaruh (frozen snapshot). |
| **v1.4.0** | 28 Sep 2026 | *Superseded* | Role Khusus "Developer" & Modul Pembersihan Data Terfilter: Penambahan peran Developer dengan tampilan antarmuka terisolasi (hanya 1 menu khusus), formulir penghapusan fleksibel (wipe all data atau seleksi form/modul tertentu dengan rentang tanggal), proteksi akun sistem, serta kontrol akses ketat (RBAC). |
| **v1.5.0** | 28 Sep 2026 | *Superseded* | Peremajaan Antarmuka Menyeluruh (Invo. Modern SaaS UI Theme Overhaul) & Visual User Guide: Transformasi desain visual sistem mengikuti desain referensi Invo. dengan palet Electric Blue (`#1a62ff`), desktop window wrapper beraksen 3-dots Mac, logo geometris 3D cube, navigasi kapsul pil menyala, 4 stat cards berikon pastel & badge tren, widget grafik batang vertikal pendapatan bulanan, kartu aksi promosi, serta dokumentasi visual buku panduan yang dilengkapi tangkapan layar (*screenshots*). |
| **v1.6.0** | 30 Sep 2026 | *Superseded* | Dual-Mode Pengelolaan Stok (Physical Allocation vs Floating Pool) & Composite Bundling / Hampers Buah (Model B - On-Demand JIT): Dukungan penuh fleksibilitas stok di pasar nyata. Mode *Floating Pool* untuk konversi bebas otomatis (telur, kain), mode *Physical Allocation (Repackage)* dengan kalkulator kuota real-time dan validasi anti over-allocation, perakitan paket hampers multi-item berbasis resep (*Bill of Materials*) dengan kapasitas bottleneck otomatis, serta pemotongan multi-komponen FIFO atomic saat checkout kasir. |
| **v1.7.0** | 15 Nov 2026 | **Current** | **Make-to-Stock Konveksi (SPK Jahit), Manajemen Hutang Supplier (Aged Payables Net 30), Split Multi-Payment Kasir & Dokumentasi Diagram Alur Bisnis Terintegrasi:**<br>• **Modul Produksi Konveksi (SPK Jahit):** Konversi bahan mentah/kain menjadi barang jadi siap jual dengan kalkulasi HPP Komposit (bahan baku FIFO + ongkos jahit + aksesoris) dan penerbitan batch barang jadi baru otomatis.<br>• **Modul Hutang Usaha & Termin Pembayaran:** Dukungan pembelian kredit (Cash, Net 15, Net 30, Net 60, Custom), jatuh tempo, pencatatan pembayaran cicilan (`purchase_payments`), dan Laporan Analisis Umur Hutang (*Aged Payables Report*).<br>• **Modul Split Multi-Payment Kasir:** Pembayaran ganda kasir (CASH + TRANSFER/QRIS) dengan pencatatan kode jurnal multi-kanal (`CSH1`, `BNK1`, `QRIS1`).<br>• **Diagram Alur Bisnis Mermaid Lengkap:** Menyematkan diagram alur rantai pasok, dual-mode stok, bundling hampers, SPK konveksi, kasir split-payment, dan skema database ERD mutakhir. |

---

## 🏷️ Legenda Penanda Perubahan (Change Highlighting Legend)

* 🟢 `<span class="badge-add">[TAMBAH v1.7]</span>` : Fitur baru pada v1.7.0 (SPK Jahit Konveksi, Hutang Net 30, Split Multi-Payment Kasir, Diagram Mermaid Bisnis).
* 🟢 `<span class="badge-add">[TAMBAH v1.6]</span>` : Fitur pada v1.6.0 (Dual-Mode Stok & Composite Bundling).
* 🟢 `<span class="badge-add">[TAMBAH v1.5]</span>` : Fitur antarmuka pada v1.5.0 (Invo. Design System).
* 🟢 `<span class="badge-add">[TAMBAH v1.4]</span>` : Fitur peran Developer & Data Cleanup pada v1.4.0.
* 🟢 `<span class="badge-add">[TAMBAH v1.3]</span>` : Inbound Margin Auto-Sync pada v1.3.0.
* 🟢 `<span class="badge-add">[TAMBAH v1.2]</span>` : Backdate POS & Reset Form pada v1.2.0.
* 🟢 `<span class="badge-add">[TAMBAH v1.1]</span>` : Master Item & Multi-Unit pada v1.1.0.

---

## 1. EXECUTIVE SUMMARY & BUSINESS CONTEXT

Sistem Point of Sale (POS) dan manajemen inventori konveksi/tekstil/retail/eceran yang mendukung multi-role (*Owner*, *Kasir*, *Reseller*, *Developer*) dengan kemampuan:
1. **Konversi Satuan Bertingkat (Bulk-to-Retail):** Inbound dalam satuan besar grosir (Roll, Kodi, Dus, Bal) yang dikonversi ke **Satuan Dasar** penyimpanan stok (Meter, Yard, PCS, Kg).
2. **Pelacakan Stok FIFO Berbasis Satuan Dasar:** Pengeluaran stok memotong batch tertua (*First In, First Out*) untuk memastikan HPP akurat dan mencegah distorsi valuasi.
3. **Hierarki Master Item & Varian Satuan Jual:** Satu barang induk master dapat memiliki banyak satuan pecahan eceran (contoh: Barang `XXX` dipecah menjadi `Sprei M`, `Sprei L`, `Sprei XL` atau `Kacamata` menjadi `PCS`, `Lusin`, `Box`).
4. **Dual-Mode Pengelolaan Stok Siap Jual (Floating Pool vs Physical Allocation):**
   - *Floating Pool (Default):* Tumpukan stok bebas di gudang, kapasitas terkonversi otomatis ke semua satuan tanpa mengunci stok fisik (ideal untuk barang curah/segar).
   - *Physical Allocation (Repackage):* Alokasi kuota fisik siap jual per kemasan dengan proteksi anti over-allocation, tombol alokasi cepat ke eceran, dan tombol reset ke floating pool kapan saja.
5. **Composite Bundling / Paket Hampers (Model B - On-Demand JIT):**
   - Pembuatan paket parcel multi-item (misal: 1.5kg Mangga + 1.0kg Apel + 0.5kg Anggur + 1 Keranjang).
   - Penentuan stok siap rakit berbasis kapasitas bahan terkecil (*Bottleneck*).
   - Pemotongan stok multi-komponen secara atomic via FIFO saat checkout kasir, merekam HPP komposit akurat di Laporan Laba Rugi.
6. 🟢 `[TAMBAH v1.7]` **Manajemen SPK Produksi Konveksi (Make-to-Stock):**
   - Penerbitan Surat Perintah Kerja (SPK) untuk memproses bahan baku kain menjadi produk jadi.
   - Perhitungan **HPP Komposit**: memadukan biaya bahan baku FIFO aktual dengan ongkos jahit mitra (*labor cost*) dan aksesoris (*accessory cost*).
   - Pemotongan bahan baku dan penerbitan batch persediaan barang jadi baru secara otomatis.
7. 🟢 `[TAMBAH v1.7]` **Manajemen Hutang Dagang Supplier (AP Aged Payables Net 30):**
   - Pembelian restock dengan termin pembayaran kredit (*Cash*, *Net 15*, *Net 30*, *Net 60*, *Custom*).
   - Pelacakan tanggal jatuh tempo (*due date*), status pembayaran (*paid*, *partially_paid*, *not_paid*), dan pencatatan riwayat cicilan (`purchase_payments`).
   - Laporan Analisis Umur Hutang Supplier (*Aged Payables Report*).
8. 🟢 `[TAMBAH v1.7]` **Split Multi-Payment Kasir & Pelacakan Multi-Jurnal:**
   - Transaksi kasir dapat dibayar dengan kombinasi berbagai kanal (misal: tunai + transfer bank/QRIS).
   - Integrasi kode akun jurnal (`CSH1`, `BNK1`, `QRIS1`) untuk rekonsiliasi kas dan mutasi bank.
9. **Kesiapan Migrasi Data Historis (Backdate Transaction):** Input transaksi tanggal lampau (*backdate*) di kasir untuk mempermudah migrasi data nota fisik lama.
10. **Laporan Keuangan Otomatis:** Perhitungan *Gross Profit* (Omzet - HPP FIFO) dan *Net Profit* (Laba Kotor - Pengeluaran Operasional).

---

## 2. PENGGUNA SISTEM (USER PERSONAS & ROLES)

| Role | Tanggung Jawab Utama | Hak Akses |
| :--- | :--- | :--- |
| **Owner (Admin)** | Pemilik toko. Mengatur master barang, supplier, pembelian restock (tunai/kredit), pembayaran hutang dagang, SPK produksi konveksi, alokasi stok (repackage), paket hampers (bundling), keuangan, dan manajemen user. | Akses Penuh (Full Access) ke seluruh modul operasional, inventori, produksi, laporan, dan pengaturan. |
| **Kasir** | Melayani transaksi penjualan offline/di toko secara langsung, termasuk pembayaran tunggal atau split multi-payment dan input transaksi backdate. | POS Kasir, input jumlah barang, input tanggal transaksi, penerimaan pembayaran multi-kanal, riwayat transaksi pribadi. |
| **Reseller** | Tenaga pemasar / agen luar. | POS Penjualan dengan **katalog produk terfilter** (`reseller_visible = true`), riwayat penjualan pribadi. |
| **Developer** | Teknisi / pengembang sistem. Melakukan pemeliharaan, reset data pengujian, atau pembersihan data transaksional lampau. | **Hanya 1 Menu Khusus:** *Developer Maintenance & Data Cleanup*. Seluruh menu kasir, pembelian, inventori, produksi, dan laporan disembunyikan. Akses eksklusif ke API pembersihan data. |

---

## 3. SPESIFIKASI PROSES BISNIS & DIAGRAM ALUR (MERMAID BUSINESS FLOW)

### 3.1 Alur Rantai Pasok Hulu ke Hilir Terintegrasi (Enterprise Supply Chain Flow)

```mermaid
flowchart TD
    SUP["🤝 Supplier Bahan Baku / Grosir"] -->|"1. Kirim Barang & Terbitkan Faktur"| BUY["📥 Pembelian / Restock (Purchases)"]

    subgraph AP_SUB["Manajemen Termin Pembayaran & Hutang Supplier (AP Aging)"]
        BUY --> AP_CHECK{"Metode Pembayaran?"}
        AP_CHECK -->|"Tunai (CASH)"| AP_PAID["Status: Lunas (Paid)"]
        AP_CHECK -->|"Kredit (Net 15 / Net 30 / Net 60)"| AP_DEBT["Catat Hutang Dagang & Tanggal Jatuh Tempo (Due Date)"]
        AP_DEBT --> AP_AGING["Laporan Aging Hutang (0-30, 31-60, 61-90, >90 Hari)"]
        AP_AGING --> AP_PAYMENT["💳 Pembayaran Cicilan Hutang (tabel 'purchase_payments')"]
        AP_PAYMENT -->|"Lunas Penuh"| AP_PAID
    end

    subgraph INBOUND_FIFO["Penerimaan & Lapisan Batch Inventori FIFO"]
        BUY -->|"2. Hitung: Qty Grosir x Konversi"| CALC_BASE["Satuan Dasar Penyimpanan (Meter, PCS, Kg)"]
        CALC_BASE --> RAW_BATCHES["📦 Inventory Batches Bahan Baku (Lapisan FIFO)"]
        RAW_BATCHES --> CALC_HPP["Hitung Rata-Rata HPP Dasar per Batch"]
    end

    subgraph PRODUCTION_AND_MODELS["Pengolahan Nilai Tambah & Model Stok (v1.7.0)"]
        RAW_BATCHES --> PATH_CHOICE{"Pilihan Pemanfaatan Stok"}
        
        PATH_CHOICE -->|"Opsi 1: Produksi Make-to-Stock"| SPK_PROD["✂️ SPK Jahit Konveksi (tabel 'productions')"]
        SPK_PROD -->|"Potong Bahan FIFO + Ongkos Jahit + Aksesoris"| PROD_BATCH["📦 Batch Baru Produk Jadi (HPP Komposit)"]
        
        PATH_CHOICE -->|"Opsi 2: Stok Bebas Langsung"| FLOAT_POOL["🌊 Floating Pool (Konversi Otomatis On-Demand)"]
        
        PATH_CHOICE -->|"Opsi 3: Kemasan Fisik"| REPACK_ALLOC["📦 Physical Allocation (Repackage Kuota Display)"]
        
        PATH_CHOICE -->|"Opsi 4: Resep Hadiah / Parcel"| BUNDLE_HAMPERS["🧺 Composite Bundling (Hampers Buah JIT)"]
    end

    subgraph POS_CHECKOUT["Penjualan POS Kasir & Multi-Payment"]
        PROD_BATCH & FLOAT_POOL & REPACK_ALLOC & BUNDLE_HAMPERS --> POS_CART["🛒 POS Kasir (Keranjang Belanja)"]
        POS_CART --> BACKDATE_VAL["Validasi Tanggal: Real-Time vs Backdate (Historis)"]
        BACKDATE_VAL --> SPLIT_PAY{"Pilihan Pembayaran Kasir"}
        SPLIT_PAY -->|"Single Method"| PAY_SINGLE["CASH / TRANSFER / QRIS"]
        SPLIT_PAY -->|"Split Multi-Payment"| PAY_MULTI["Kombinasi Kas + Transfer Bank / QRIS"]
        PAY_MULTI & PAY_SINGLE --> ATOMIC_DEDUCT["Eksekusi Checkout Atomic:<br>• Deduct FIFO Batch Terlama<br>• Snapshot HPP & Harga Jual Terkunci<br>• Catat Jurnal Pembayaran (CSH1, BNK1, QRIS1)"]
    end

    subgraph FIN_RECON["Laporan Finansial & Rekonsiliasi"]
        ATOMIC_DEDUCT --> P_L_REPORT["📊 Laporan Laba Rugi (P&L):<br>• Omzet Bersih<br>• HPP FIFO Terpotong<br>• Beban Operasional<br>• Laba Kotor & Laba Bersih"]
        ATOMIC_DEDUCT --> CASH_RECON["🏦 Rekonsiliasi Kas Toko & Mutasi Bank"]
    end
```

---

### 3.2 Alur Bisnis Dual-Mode Stok: Floating Pool vs Physical Allocation & Logika Switching

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

### 3.3 Alur Bisnis Composite Bundling / Hampers Buah (Model B - On-Demand JIT)

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

### 3.4 Alur Produksi Konveksi: SPK Jahit & Kalkulasi HPP Komposit (Make-to-Stock)

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

### 3.5 Alur Kasir POS, Split Multi-Payment & Rekonsiliasi Jurnal Keuangan

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

## 4. DETIL PERUBAHAN FITUR (GAP & FEATURE HIGHLIGHTS v1.7.0)

### 4.1 Modul Produksi Konveksi & SPK Jahit (`ProductionService` & `Productions.js`)
* 🟢 `[TAMBAH v1.7]` **Fungsi `ProductionService.calculateEstimate`:**
  * Menghitung kebutuhan bahan mentah: $\text{Kebutuhan Meter} = \text{Qty Jadi} \times \text{Konversi}$.
  * Menghitung biaya bahan baku dari batch FIFO terlama yang aktif.
  * Menghitung total biaya: $\text{Total Cost} = \text{Biaya Bahan} + (\text{Ongkos Jahit} \times \text{Qty}) + (\text{Biaya Aksesoris} \times \text{Qty})$.
  * Menghitung **HPP Komposit Satuan Jadi**: $\text{Unit Cost} = \text{Total Cost} / \text{Qty Jadi}$.
* 🟢 `[TAMBAH v1.7]` **Fungsi `ProductionService.executeProduction`:**
  * Memotong stok bahan mentah dari `inventory_batches` lapisan tertua secara atomik.
  * Menerbitkan batch persediaan baru di `inventory_batches` untuk varian produk jadi dengan HPP komposit tersebut.
  * Menyimpan riwayat produksi ke tabel `productions` dengan kode unik format `PRD-YYYYMM-XXXX`.

### 4.2 Modul Hutang Dagang Supplier & Termin Pembayaran (`PurchaseService` & `Purchases.js`)
* 🟢 `[TAMBAH v1.7]` **Termin Pembayaran Fleksibel (Payment Terms):**
  * Mendukung opsi termin: `cash`, `net_15`, `net_30`, `net_60`, dan `custom`.
  * Otomatisasi tanggal jatuh tempo (*due date*) sesuai pilihan termin.
  * Status pembayaran: `paid` (lunas), `partially_paid` (sebagian), dan `not_paid` (belum bayar).
* 🟢 `[TAMBAH v1.7]` **Tabel Pembayaran Cicilan (`purchase_payments`):**
  * Mencatat setiap transaksi pembayaran hutang ke supplier (nominal, tanggal, metode kas/bank, dan catatan).
* 🟢 `[TAMBAH v1.7]` **Laporan Umur Hutang (Aged Payables Report):**
  * Mengelompokkan kewajiban hutang supplier ke dalam rentang: *Current (Belum Jatuh Tempo)*, *1-30 Hari*, *31-60 Hari*, *61-90 Hari*, dan *>90 Hari Terlambat*.

### 4.3 Modul Split Multi-Payment & Multi-Journal Kasir (`TransactionService` & `POS.js`)
* 🟢 `[TAMBAH v1.7]` **Penyimpanan Multi-Kanal Pembayaran (`transaction_payments`):**
  * Mendukung pelunasan kasir dengan kombinasi kanal bayar.
  * Menyimpan kode jurnal akuntansi: `CSH1` (Kas Toko), `BNK1` (Bank BCA/Mandiri), `QRIS1` (QRIS Settlement).
  * Validasi over-payment pada kanal non-tunai (uang kembalian hanya diperbolehkan jika berasal dari porsi tunai).

### 4.4 Modul Repackage & Alokasi Stok Fisik (`InventoryService` & `ProductsComponent`)
* Mengizinkan pembagian stok gudang menjadi kuota kemasan fisik siap jual (Box, Lusin, PCS promo) dengan perlindungan anti over-allocation dan tombol reset instan ke floating pool.

### 4.5 Modul Composite Bundling & Resep Hampers (`InventoryService` & `ProductsComponent`)
* Mengizinkan perakitan paket multi-item berdasarkan resep (*Bill of Materials*), menghitung kapasitas bottleneck secara dinamis, dan memotong multi-komponen FIFO saat checkout.

---

## 5. SKEMA DATABASE TERKINI (DATABASE SCHEMA v1.7.0)

```mermaid
erDiagram
    users {
        int id PK
        string name
        string email UK
        string password_hash
        string role "owner, cashier, reseller, developer"
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    items {
        int id PK
        string name
        string base_unit
        string category "raw, manufactured, retail, bundle"
        text description
        timestamp created_at
        timestamp updated_at
    }

    product_units {
        int id PK
        int item_id FK
        string item_name
        string unit_name
        decimal conversion_factor
        string pricing_method "manual, percentage_margin"
        decimal margin_percentage
        decimal selling_price
        boolean is_active
        boolean reseller_visible
        string stock_mode "floating, allocated"
        decimal allocated_stock
        boolean is_bundle
        timestamp created_at
        timestamp updated_at
    }

    bundle_items {
        int id PK
        int bundle_unit_id FK
        int component_item_id FK
        string component_item_name
        decimal quantity_needed
        timestamp created_at
        timestamp updated_at
    }

    productions {
        int id PK
        string production_number UK
        date production_date
        int raw_item_id FK
        int product_unit_id FK
        decimal quantity_produced
        decimal base_quantity_used
        decimal labor_cost_per_unit
        decimal accessory_cost_per_unit
        decimal raw_material_cost
        decimal total_cost
        decimal unit_cost
        string tailor_name
        string status "draft, done, cancelled"
        text notes
        timestamp created_at
        timestamp updated_at
    }

    suppliers {
        int id PK
        string name
        string phone
        string email
        text address
        timestamp created_at
        timestamp updated_at
    }

    purchases {
        int id PK
        int supplier_id FK
        int user_id FK
        timestamp purchase_date
        decimal total_cost
        string payment_term "cash, net_15, net_30, net_60, custom"
        date due_date
        string payment_status "paid, not_paid, partially_paid"
        decimal amount_paid
        text notes
        timestamp created_at
        timestamp updated_at
    }

    purchase_payments {
        int id PK
        int purchase_id FK
        int user_id FK
        date payment_date
        decimal amount
        string payment_method "CASH, BANK"
        text notes
        timestamp created_at
    }

    inventory_batches {
        int id PK
        int purchase_id FK
        int item_id FK
        string item_name
        decimal initial_quantity
        decimal remaining_quantity
        decimal base_cost_price
        timestamp received_date
        timestamp created_at
        timestamp updated_at
    }

    transactions {
        int id PK
        int user_id FK
        string customer_name
        decimal total_amount
        string payment_method "CASH, TRANSFER, QRIS, SPLIT"
        string payment_status "paid, pending"
        decimal amount_paid
        decimal change_amount
        boolean is_split
        timestamp transaction_date
        timestamp created_at
        timestamp updated_at
    }

    transaction_payments {
        int id PK
        int transaction_id FK
        string payment_method "CASH, TRANSFER, QRIS"
        string journal_code "CSH1, BNK1, QRIS1"
        decimal amount
        decimal tendered_amount
        decimal change_amount
        string reference
        timestamp created_at
    }

    transaction_items {
        int id PK
        int transaction_id FK
        int batch_id FK
        int product_unit_id FK
        decimal quantity_sold
        decimal base_quantity_deducted
        decimal unit_price
        decimal cost_price
        decimal subtotal_price
        timestamp created_at
    }

    expenses {
        int id PK
        int user_id FK
        string category
        decimal amount
        text description
        timestamp expense_date
        timestamp created_at
    }

    settings {
        int id PK
        string key UK
        text value
        timestamp updated_at
    }

    items ||--o{ inventory_batches : "memiliki batch stok"
    items ||--o{ product_units : "memiliki satuan jual"
    items ||--o{ productions : "sebagai bahan mentah SPK"
    product_units ||--o{ productions : "sebagai barang jadi SPK"
    product_units ||--o{ bundle_items : "memiliki resep bahan"
    items ||--o{ bundle_items : "komponen bahan resep"
    suppliers ||--o{ purchases : "memasok pesanan"
    purchases ||--o{ purchase_payments : "dicicil melalui"
    users ||--o{ purchases : "mencatat pembelian"
    purchases ||--o{ inventory_batches : "menghasilkan batch"
    users ||--o{ transactions : "melayani checkout"
    transactions ||--o{ transaction_payments : "dibayar melalui kanal"
    transactions ||--o{ transaction_items : "memuat item penjualan"
    product_units ||--o{ transaction_items : "dijual sebagai"
    inventory_batches ||--o{ transaction_items : "dipotong FIFO"
    users ||--o{ expenses : "mencatat biaya operasional"
```

---

## 6. SPESIFIKASI ENDPOINT REST API (API v1.7.0)

### 6.1 SPK Produksi Konveksi (`/api/productions`)
* `GET /api/productions` — Mengambil seluruh daftar riwayat SPK produksi.
* `POST /api/productions/estimate` — Menghitung preview estimasi HPP komposit dan validasi stok bahan baku.
* `POST /api/productions` — Menerbitkan dan mengeksekusi SPK jahit, memotong bahan baku FIFO dan menerbitkan batch barang jadi baru.
* `GET /api/productions/:id` — Detail dokumen SPK produksi dan rincian biaya.

### 6.2 Manajemen Hutang Supplier & Pembelian (`/api/purchases`)
* `POST /api/purchases` — Mencatat pembelian restock (mendukung `paymentTerm`, `dueDate`, `paymentStatus`, dan `amountPaid`).
* `POST /api/purchases/:id/payments` — Mencatat pembayaran cicilan hutang supplier ke tabel `purchase_payments`.
* `GET /api/purchases/aged-payables` — Laporan analisis umur hutang supplier (*Aged Payables Summary & Detail*).

### 6.3 Repackage & Alokasi Stok (`/api/products`)
* `POST /api/products/repackage` — Alokasi kuota fisik per satuan jual dengan validasi anti over-allocation.
* `POST /api/products/repackage/reset` — Reset kuota fisik kembali ke mode Floating Pool bebas.

### 6.4 Composite Bundling (`/api/products`)
* `POST /api/products/bundle` — Pembuatan paket hampers/bundling multi-item dengan resep *Bill of Materials*.
* `GET /api/products/bundle/:id/recipe` — Melihat rincian komponen bahan penyusun paket hampers.

### 6.5 Checkout POS Kasir & Split Payment (`/api/transactions`)
* `POST /api/transactions/checkout` — Checkout penjualan kasir dengan dukungan:
  - Pembayaran tunggal (`paymentMethod`) atau pembayaran ganda (`payments: [{ paymentMethod, journalCode, amount, tenderedAmount }]`).
  - Pencatatan backdate historis (`transactionDate`).
  - Pemotongan stok multi-komponen FIFO atomic untuk produk bundling.

---

## 7. KRITERIA PENERIMAAN & PENGUJIAN (ACCEPTANCE CRITERIA)

| Kode Uji | Deskripsi Skenario | Hasil yang Diharapkan | Status |
| :---: | :--- | :--- | :---: |
| **AC-01** | Input Pembelian 1 Kodi bahan mentah XXX seharga Rp 1.200.000 dengan konversi 60 Meter. | Batch FIFO tersimpan 60 Meter dengan HPP Rp 20.000/meter. Barang XXX otomatis ada di master item. | **PASSED** |
| **AC-02** | Setup Multi-Satuan barang XXX: Sprei M (2m), Sprei L (2.5m, Margin 40%), Sprei XL (3m, Margin 50%) dalam 1 modal. | Ketiga satuan tersimpan sekaligus. Harga Sprei L otomatis Rp 70rb, Sprei XL otomatis Rp 90rb. | **PASSED** |
| **AC-03** | Transaksi POS Backdate pada 15 Agustus 2026. | Transaksi tersimpan dengan `transaction_date = 2026-08-15`. Nota struk dan laporan Agustus merekam transaksi ini. | **PASSED** |
| **AC-04** | Verifikasi Laporan Periode Backdate (Agustus 2026). | Laporan Penjualan dan Laba Rugi periode Agustus mencatat Omzet Rp 70.000, COGS Rp 20.000, Laba Kotor Rp 50.000. | **PASSED** |
| **AC-05** | Buka Modal Setup Produk Baru & Ubah Textbox Satuan Dasar ke "Yard". | Daftar satuan jual bersih, header kolom kebutuhan tabel satuan jual seketika berubah menjadi `Kebutuhan (Yard)`. | **PASSED** |
| **AC-06** | Setup Barang Kacamata margin 50% (harga awal 0) lalu input Pembelian perdana @ Rp 100.000. | Harga jual `product_units` varian Kacamata Hitam otomatis berubah dari Rp 0 menjadi Rp 150.000. | **PASSED** |
| **AC-07** | Transaksi Penjualan Rp 150.000 diikuti Pembelian ke-2 @ Rp 200.000. | Harga jual katalog naik menjadi Rp 228.947, namun snapshot `transaction_items.unit_price` transaksi lama tetap Rp 150.000. | **PASSED** |
| **AC-08** | Login dengan akun Role Developer (`developer@pos.com`). | Hanya muncul 1 menu tunggal (Developer Maintenance). Mencoba navigasi rute lain tetap terkunci di menu Developer. | **PASSED** |
| **AC-09** | Eksekusi penghapusan data terfilter dengan rentang tanggal. | Data pada modul terpilih dalam rentang tanggal terhapus bersih, sedangkan data di luar periode tanggal tetap utuh. | **PASSED** |
| **AC-10** | Tampilan Dashboard & Seluruh Halaman dengan Tema Invo. Modern SaaS. | Window wrapper beraksen 3-dots Mac, logo 3D Invo, navigasi kapsul pil menyala `#1a62ff`, 4 stat cards pastel, dan grafik bulanan tampil presisi. | **PASSED** |
| **AC-11** | Alokasi Kuota Fisik (Repackage) Valid. | Total alokasi 5 Box, 15 Lusin, 19 PCS (total 449 PCS) berhasil disimpan, `stock_mode` menjadi `allocated`. | **PASSED** |
| **AC-12** | Proteksi Validasi Over-Allocation Repackage. | Alokasi 10 Box (500 PCS) melebihi stok gudang (399 PCS) ditolak dengan error 400 dan tombol simpan terkunci otomatis. | **PASSED** |
| **AC-13** | Reset Alokasi Fisik ke Mode Floating Pool Bebas. | Tombol `Reset ke Floating Pool` mengembalikan seluruh satuan ke konversi otomatis on-demand tanpa merusak layer FIFO. | **PASSED** |
| **AC-14** | Pembuatan Resep Paket Hampers & Deteksi Bottleneck. | Paket hampers buah dengan 4 komponen berhasil dibuat, kapasitas stok siap rakit terdeteksi otomatis dari komponen terendah (*bottleneck*). | **PASSED** |
| **AC-15** | Checkout Kasir Paket Hampers & Pemotongan Multi-FIFO. | Penjualan 1 Paket Hampers memotong masing-masing komponen dari batch FIFO terlama secara atomic, merekam HPP komposit akurat. | **PASSED** |
| **AC-16** | 🟢 `[TAMBAH v1.7]` Eksekusi SPK Produksi Konveksi & HPP Komposit. | SPK 20 Pcs Sprei L memotong 50m kain katun secara FIFO, menambahkan ongkos jahit Rp 15rb & aksesoris Rp 5rb, menerbitkan batch baru dengan HPP komposit Rp 70.000/pcs. | **PASSED** |
| **AC-17** | 🟢 `[TAMBAH v1.7]` Pembelian Kredit Net 30 & Pelunasan Cicilan Hutang. | Pembelian termin Net 30 tercatat dengan status `not_paid` dan due date +30 hari. Input cicilan di `purchase_payments` meng-update sisa hutang dan status menjadi `partially_paid` atau `paid`. | **PASSED** |
| **AC-18** | 🟢 `[TAMBAH v1.7]` Checkout Kasir Split Multi-Payment. | Transaksi total Rp 500.000 dibayar CASH Rp 200.000 dan TRANSFER Rp 300.000 berhasil disimpan dengan `is_split = true` dan terekam 2 baris jurnal di `transaction_payments`. | **PASSED** |
