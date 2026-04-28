# DOKUMENTASI TEKNIS LENGKAP: KASIRKU UMKM
**Versi:** 1.0.0
**Penulis:** AI Assistant (Build Mode)
**Tanggal:** 16 April 2026
**Status:** Final / Produksi

---

## BAB 1: PENDAHULUAN

### 1.1 Deskripsi Proyek
**KasirKu UMKM** adalah aplikasi Point of Sale (POS) berbasis web yang dirancang untuk membantu UMKM mengelola operasional toko secara digital. Aplikasi ini mencakup manajemen inventaris, manajemen pegawai, sistem loyalitas pelanggan (member), dan pencatatan transaksi yang terintegrasi dengan laporan ekspor Excel.

### 1.2 Masalah & Solusi
*   **Masalah:** Stok barang sering tidak akurat karena penjualan di kasir tidak langsung memotong stok di database pusat.
*   **Solusi:** Implementasi **Auto-Stock Refresh** setiap 8 detik pada antarmuka kasir dan penggunaan **Prisma Transaction** untuk memastikan atomisitas data (stok berkurang hanya jika transaksi berhasil).

---

## BAB 2: TEKNOLOGI & DEPENDENSI

### 2.1 Core Tech Stack
*   **Framework:** Astro 4.x (Hybrid Rendering).
*   **UI Library:** React 18.x (untuk komponen interaktif).
*   **Language:** TypeScript (Type-safe development).
*   **Database:** MongoDB (NoSQL).
*   **ORM:** Prisma (Object-Relational Mapping).
*   **Styling:** Tailwind CSS.

### 2.2 Daftar Package Utama (package.json)
| Package | Kegunaan |
| :--- | :--- |
| `lucide-react` | Library ikon vektor. |
| `xlsx` | Pembuatan file spreadsheet Excel. |
| `file-saver` | Trigger download file di browser. |
| `sonner` | Toast notifications (notifikasi melayang). |
| `prisma` | Database toolkit. |
| `jose` | Library untuk JWT (JSON Web Token) di lingkungan Edge/Astro. |
| `bcryptjs` | Hashing password untuk keamanan. |
| `clsx` & `tailwind-merge` | Utilitas penggabungan class Tailwind. |

---

## BAB 3: ARSITEKTUR SISTEM & STRUKTUR KODE

### 3.1 Struktur Folder
```text
C:.
├── prisma/
│   └── schema.prisma         # Definisi tabel/model database
├── src/
│   ├── components/
│   │   ├── auth/             # Komponen login & registrasi
│   │   ├── dashboard/        # Komponen manajemen (User, Produk, History)
│   │   ├── pos/              # Komponen utama mesin kasir
│   │   └── ui/               # Komponen dasar shadcn/ui
│   ├── layouts/              # Template halaman (Dashboard & Main)
│   ├── lib/                  # Singleton & Utilitas (Prisma, Auth, Utils)
│   ├── middleware.ts         # Proteksi rute & validasi session
│   └── pages/
│       ├── api/              # Backend API Routes (Serverless)
│       └── dashboard/        # Halaman-halaman panel kontrol
```

### 3.2 Alur Autentikasi (middleware.ts)
Sistem menggunakan **Middleware** untuk mencegat setiap permintaan ke rute `/dashboard`.
1.  Mengambil token dari cookie `auth_token`.
2.  Memverifikasi token menggunakan `jose`.
3.  Jika valid, data user disimpan di `Astro.locals.user`.
4.  Jika tidak valid, user diarahkan kembali ke `/auth/login`.

---

## BAB 4: SKEMA DATABASE (Prisma)

### 4.1 Model Utama
*   **Store:** Entitas toko. Satu toko memiliki banyak User, Product, dan Transaction.
*   **User:** Pengguna sistem dengan role `ADMIN`, `MANAGER`, atau `STAFF`.
*   **Product:** Inventaris barang. Memiliki field `image` (Base64) dan `stock`.
*   **Customer:** Data member. Diidentifikasi unik berdasarkan `phone` + `storeId`.
*   **Transaction:** Rekam jejak penjualan. Menyimpan `items` dalam format JSON untuk fleksibilitas.

---

## BAB 5: DETAIL FUNGSI KOMPONEN & HALAMAN

### 5.1 POSInterface.tsx (Mesin Kasir)
Ini adalah komponen paling kompleks dalam aplikasi.
*   **State Management:**
    *   `step`: Mengontrol alur (`SELECTION` -> `CONFIRMATION` -> `RECEIPT`).
    *   `quantities`: Objek key-value untuk menyimpan jumlah beli per ID produk.
*   **Fungsi Utama:**
    *   `fetchLatestProducts()`: Mengambil data stok terbaru dari API `/api/products`. Dijalankan otomatis setiap 8 detik.
    *   `checkMember()`: Fungsi *side-effect* yang berjalan saat nomor HP diinput. Mencari data member di database.
    *   `updateQuantity()`: Menambah/mengurangi jumlah beli dengan validasi agar tidak melebihi stok fisik.
    *   `handleCheckout()`: Mengirim data transaksi ke API, termasuk poin yang digunakan dan detail pembayaran.

### 5.2 TransactionHistory.tsx (Riwayat & Laporan)
*   **Fungsi `handleExport()`**:
    1.  Memetakan data transaksi yang difilter ke format JSON datar.
    2.  Menggunakan `XLSX.utils.json_to_sheet` untuk membuat worksheet.
    3.  Menambahkan *header* laporan dan melakukan *merge cells* untuk judul.
    4.  Mengatur lebar kolom (`!cols`) agar data tidak terpotong.
    5.  Mengunduh file menggunakan `fileSaver.saveAs`.

### 5.3 ProductForm.tsx (Manajemen Produk)
*   **Image Handling**: Menggunakan `FileReader` untuk membaca file gambar dari input lokal dan mengubahnya menjadi string **Base64**. Hal ini memungkinkan gambar disimpan langsung di MongoDB tanpa perlu layanan penyimpanan eksternal (S3/Cloudinary).

---

## BAB 6: REFERENSI API (Backend)

### 6.1 /api/transactions/create.ts
API ini menggunakan **Prisma Transaction** (`prisma.$transaction`) untuk menjamin integritas data:
1.  **Create Transaction**: Mencatat detail belanja.
2.  **Update Stock**: Mengurangi stok produk satu per satu berdasarkan item yang dibeli.
3.  **Member Logic**: 
    *   Jika member baru: Membuat data customer baru.
    *   Jika member lama: Menambah poin (1% dari total) dan mengurangi poin jika digunakan.

### 6.2 /api/customers/check.ts
Menerima parameter `phone`. Digunakan oleh POS untuk validasi member secara *real-time* saat kasir mengetik nomor telepon pelanggan.

---

## BAB 7: PANDUAN PENGGUNA (PRACTICAL GUIDE)

### 7.1 Cara Menambah Pegawai
1.  Login sebagai **ADMIN**.
2.  Buka menu **Pegawai**.
3.  Klik **Tambah Pegawai**.
4.  Pilih Role: `MANAGER` (bisa kelola produk) atau `STAFF` (hanya kasir).

### 7.2 Cara Melakukan Transaksi Member
1.  Buka **Mesin Kasir**.
2.  Pilih produk dan klik **Lanjut Bayar**.
3.  Pilih tipe **Member**.
4.  Masukkan nomor HP. Jika sudah terdaftar, nama dan poin akan muncul otomatis.
5.  Masukkan jumlah poin yang ingin digunakan (jika ada).
6.  Masukkan jumlah uang tunai dan klik **Bayar Sekarang**.

---

## BAB 8: INSTRUKSI INSTALASI

1.  **Clone & Install**:
    ```bash
    npm install
    ```
2.  **Environment Setup**: Buat file `.env` dan isi:
    ```env
    DATABASE_URL="mongodb+srv://..."
    JWT_SECRET="rahasia_super_kuat"
    ```
3.  **Database Sync**:
    ```bash
    npx prisma generate
    npx prisma db push
    ```
4.  **Run Development**:
    ```bash
    npm run dev
    ```

---

## BAB 9: PENUTUP
Dokumentasi ini mencakup seluruh aspek teknis dari aplikasi KasirKu UMKM. Dengan struktur kode yang modular dan penggunaan teknologi modern, aplikasi ini siap untuk dikembangkan lebih lanjut, seperti penambahan fitur laporan grafik atau integrasi pembayaran digital (QRIS) (BERLANGSUNG).

**— Akhir Dokumen —**
