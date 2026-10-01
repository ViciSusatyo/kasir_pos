/* =============================================================
   KASIR POS — TOKO RETAIL MAKMUR
   File logika: chasier.js
   -------------------------------------------------------------
   Daftar fungsi:
   - formatRupiah(value)      : mengubah angka menjadi format Rupiah
   - searchProduct()          : mencari barang dan menampilkan hasil
   - addToCart(id)            : menambah barang ke keranjang
   - renderCart()             : menampilkan isi keranjang ke tabel
   - changeQty(id, amount)    : menambah/mengurangi qty dengan tombol − / +
   - updateQty(id, qty)       : mengubah qty dari input angka manual
   - removeItem(id)           : menghapus satu barang dari keranjang
   - calculateTotal()         : menghitung subtotal, diskon, pajak, dan total akhir
   - calculateChange()        : menghitung kembalian / status uang kurang
   - getGrandTotal()          : mengambil nilai total akhir
   - selectPayment(button)    : memilih metode pembayaran
   - holdTransaction()        : menahan transaksi untuk dibayar nanti
   - processPayment()         : memproses pembayaran dan mencetak struk
   - cancelTransaction()      : membatalkan transaksi
   - generateTrxNumber()      : membuat nomor transaksi TRX-YYYYMMDD-001
   - updateDateTime()         : menampilkan tanggal dan jam saat ini
   ============================================================= */

/* -------------------------------------------------------------
   1. DATA PRODUK
   Pada aplikasi nyata, data ini diambil dari database.
   Fields: id, code (kode barang), barcode, name, price (harga)
   ------------------------------------------------------------- */
const products = [
    { id: 1, code: "BRG001", barcode: "899123456001", name: "Indomie Goreng",       price: 3500  },
    { id: 2, code: "BRG002", barcode: "899123456002", name: "Aqua 600ml",           price: 4000  },
    { id: 3, code: "BRG003", barcode: "899123456003", name: "Teh Botol Sosro",      price: 5000  },
    { id: 4, code: "BRG004", barcode: "899123456004", name: "Beras 5 Kg",           price: 75000 },
    { id: 5, code: "BRG005", barcode: "899123456005", name: "Minyak Goreng 1 Liter", price: 18000 },
    { id: 6, code: "BRG006", barcode: "899123456006", name: "Gula Pasir 1 Kg",      price: 17000 }
];

/* -------------------------------------------------------------
   2. VARIABEL GLOBAL
   cart  : isi keranjang, format { id, qty }
   grandTotal : nilai total akhir hasil perhitungan
   trxCounter : nomor urut transaksi hari ini
   ------------------------------------------------------------- */
let cart = [];
let grandTotal = 0;
let trxCounter = 1;

/* =============================================================
   3. FUNGSI UTILITAS
   ============================================================= */

/**
 * Mengubah angka menjadi format mata uang Rupiah, contoh: 3500 -> "Rp 3.500"
 * Menggunakan Intl.NumberFormat dengan locale id-ID dan tanpa desimal.
 */
function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

/**
 * Membuat nomor transaksi dengan format TRX-YYYYMMDD-001
 * Angka 001 adalah nomor urut transaksi pada hari tersebut.
 */
function generateTrxNumber() {
    const sekarang = new Date();
    const tahun = sekarang.getFullYear();
    const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
    const tanggal = String(sekarang.getDate()).padStart(2, "0");
    const urut = String(trxCounter).padStart(3, "0");

    return `TRX-${tahun}${bulan}${tanggal}-${urut}`;
}

/**
 * Menampilkan tanggal dan jam saat ini ke header, format Indonesia.
 */
function updateDateTime() {
    document.getElementById("trxDate").textContent = new Date().toLocaleString("id-ID");
}

/* =============================================================
   4. PENCARIAN BARANG
   ============================================================= */

/**
 * Mencari barang berdasarkan nama, kode, atau barcode.
 * Dipanggil setiap kali mengetik (real-time) dan saat menekan tombol Cari.
 * Hasil pencarian ditampilkan di dalam dropdown .product-results.
 */
function searchProduct() {
    const input = document.getElementById("searchInput");
    const container = document.getElementById("productResults");
    const keyword = input.value.trim().toLowerCase();

    // Kata kunci kosong: sembunyikan hasil pencarian
    if (keyword === "") {
        container.innerHTML = "";
        container.style.display = "none";
        return;
    }

    // Filter produk: cocok pada nama, kode, atau barcode
    const hasil = products.filter(function (produk) {
        return (
            produk.name.toLowerCase().includes(keyword) ||
            produk.code.toLowerCase().includes(keyword) ||
            produk.barcode.includes(keyword)
        );
    });

    // Tidak ada barang yang cocok
    if (hasil.length === 0) {
        container.innerHTML = `<div class="product-item">Barang tidak ditemukan</div>`;
        container.style.display = "block";
        return;
    }

    // Tampilkan hasil pencarian; klik hasil akan memanggil addToCart(id)
    container.innerHTML = hasil
        .map(function (produk) {
            return `
            <div class="product-item" onclick="addToCart(${produk.id})">
                <div>
                    <div class="p-name">${produk.name}</div>
                    <div class="p-code">${produk.code} &bull; ${produk.barcode}</div>
                </div>
                <div class="p-price">${formatRupiah(produk.price)}</div>
            </div>`;
        })
        .join("");

    container.style.display = "block";
}

/* =============================================================
   5. KERANJANG BELANJA
   ============================================================= */

/**
 * Menambah barang ke keranjang.
 * - Jika barang sudah ada, qty ditambah 1.
 * - Jika belum ada, ditambahkan dengan qty 1.
 * Setelah itu input pencarian dikosongkan dan hasil pencarian disembunyikan.
 */
function addToCart(id) {
    // Cari barang di dalam keranjang
    const item = cart.find(function (barang) {
        return barang.id === id;
    });

    if (item) {
        // Barang sudah ada: tambah qty saja
        item.qty += 1;
    } else {
        // Barang baru: masukkan ke keranjang dengan qty 1
        cart.push({ id: id, qty: 1 });
    }

    // Bersihkan area pencarian
    document.getElementById("searchInput").value = "";
    document.getElementById("productResults").innerHTML = "";
    document.getElementById("productResults").style.display = "none";

    renderCart();
    calculateTotal();
}

/**
 * Menampilkan isi keranjang ke dalam tabel.
 * Mengubah jumlah item di header, serta menampilkan atau menyembunyikan
 * pesan "keranjang kosong".
 */
function renderCart() {
    const tbody = document.getElementById("cartBody");
    const wrapper = document.getElementById("tableWrapper");
    const kosong = document.getElementById("emptyCart");
    const jumlahItem = document.getElementById("cartCount");

    // Jumlah item = jumlah seluruh qty, bukan jumlah baris
    const totalQty = cart.reduce(function (total, barang) {
        return total + barang.qty;
    }, 0);

    jumlahItem.textContent = totalQty + " Item";

    // Keranjang kosong: tampilkan pesan, sembunyikan tabel
    if (cart.length === 0) {
        tbody.innerHTML = "";
        wrapper.style.display = "none";
        kosong.style.display = "block";
        return;
    }

    // Keranjang berisi barang: tampilkan tabel
    kosong.style.display = "none";
    wrapper.style.display = "block";

    // Bangun baris tabel untuk setiap barang
    tbody.innerHTML = cart
        .map(function (barang, index) {
            // Cari data produk dari daftar products
            const produk = products.find(function (p) {
                return p.id === barang.id;
            });

            const subtotal = produk.price * barang.qty;

            return `
            <tr>
                <td class="row-number">${index + 1}</td>
                <td>
                    <div class="item-name">${produk.name}</div>
                    <div class="item-code">${produk.code}</div>
                </td>
                <td class="text-right">${formatRupiah(produk.price)}</td>
                <td>
                    <div class="qty-control">
                        <button type="button" class="qty-btn" onclick="changeQty(${barang.id}, -1)">&minus;</button>
                        <input type="number" value="${barang.qty}" min="1"
                               onchange="updateQty(${barang.id}, this.value)" />
                        <button type="button" class="qty-btn" onclick="changeQty(${barang.id}, 1)">+</button>
                    </div>
                </td>
                <td class="text-right">${formatRupiah(subtotal)}</td>
                <td class="text-right">
                    <button type="button" class="remove-btn" onclick="removeItem(${barang.id})">&times;</button>
                </td>
            </tr>`;
        })
        .join("");
}

/**
 * Mengubah qty menggunakan tombol − atau +.
 * @param {number} id     id barang
 * @param {number} amount nilai perubahan (+1 atau -1)
 * Qty yang sudah 0 akan menghapus barang dari keranjang.
 */
function changeQty(id, amount) {
    const barang = cart.find(function (item) {
        return item.id === id;
    });

    if (!barang) return;

    barang.qty += amount;

    // Qty <= 0 berarti barang dihapus dari keranjang
    if (barang.qty <= 0) {
        removeItem(id);
        return;
    }

    renderCart();
    calculateTotal();
}

/**
 * Mengubah qty melalui input angka manual.
 * Nilai minimal adalah 1; bila dikosongkan atau diisi 0, menjadi 1.
 */
function updateQty(id, qty) {
    const barang = cart.find(function (item) {
        return item.id === id;
    });

    if (!barang) return;

    let jumlah = parseInt(qty, 10);

    // Nilai tidak valid (NaN, kosong, atau di bawah 1) menjadi 1
    if (isNaN(jumlah) || jumlah < 1) {
        jumlah = 1;
    }

    barang.qty = jumlah;

    renderCart();
    calculateTotal();
}

/**
 * Menghapus satu barang dari keranjang.
 */
function removeItem(id) {
    cart = cart.filter(function (barang) {
        return barang.id !== id;
    });

    renderCart();
    calculateTotal();
}

/* =============================================================
   6. PERHITUNGAN DAN PEMBAYARAN
   ============================================================= */

/**
 * Menghitung total item, subtotal, diskon, pajak, biaya lain,
 * dan TOTAL AKHIR, lalu memperbarui tampilan.
 *
 * Rumus total akhir:
 * total = subtotal - diskon persen - diskon nominal + pajak + biaya lain
 * Total akhir tidak boleh kurang dari 0.
 */
function calculateTotal() {
    // Subtotal = jumlah (harga x qty) seluruh barang
    const subtotal = cart.reduce(function (total, barang) {
        const produk = products.find(function (p) {
            return p.id === barang.id;
        });
        return total + produk.price * barang.qty;
    }, 0);

    // Total item = jumlah seluruh qty
    const totalItem = cart.reduce(function (total, barang) {
        return total + barang.qty;
    }, 0);

    // Ambil nilai dari input diskon, pajak, dan biaya lain
    const persenDiskon = parseFloat(document.getElementById("discountPercent").value) || 0;
    const nominalDiskon = parseFloat(document.getElementById("discountAmount").value) || 0;
    const pajak = parseFloat(document.getElementById("taxAmount").value) || 0;
    const biayaLain = parseFloat(document.getElementById("otherAmount").value) || 0;

    // Diskon persen dihitung dari subtotal
    const potonganDiskon = (subtotal * persenDiskon) / 100;

    // Total akhir minimal 0 (tidak boleh minus)
    grandTotal = subtotal - potonganDiskon - nominalDiskon + pajak + biayaLain;
    if (grandTotal < 0) {
        grandTotal = 0;
    }

    // Tampilkan ke layar
    document.getElementById("totalItem").textContent = totalItem;
    document.getElementById("subtotal").textContent = formatRupiah(subtotal);
    document.getElementById("grandTotal").textContent = formatRupiah(grandTotal);

    // Kembalian ikut dihitung karena total akhir berubah
    calculateChange();
}

/**
 * Menghitung kembalian dari uang yang dibayar dikurangi total akhir.
 * - Uang cukup  : label "KEMBALIAN" dan kotak berwarna hijau.
 * - Uang kurang : label "UANG KURANG" dan kotak berwarna merah (short-payment).
 */
function calculateChange() {
    const uangDibayar = parseFloat(document.getElementById("paidAmount").value) || 0;
    const kembalian = uangDibayar - grandTotal;
    const box = document.getElementById("changeBox");
    const label = box.querySelector("span:first-child");
    const nilai = document.getElementById("changeAmount");

    if (kembalian < 0) {
        // Uang dibayar kurang dari total akhir
        box.classList.add("short-payment");
        label.textContent = "UANG KURANG";
        nilai.textContent = formatRupiah(Math.abs(kembalian));
    } else {
        // Uang dibayar cukup
        box.classList.remove("short-payment");
        label.textContent = "KEMBALIAN";
        nilai.textContent = formatRupiah(kembalian);
    }
}

/**
 * Mengambil nilai total akhir hasil perhitungan.
 * Dipanggil oleh processPayment() saat membuat struk.
 */
function getGrandTotal() {
    return grandTotal;
}

/**
 * Memilih metode pembayaran.
 * Hanya satu tombol yang boleh aktif; secara default "Tunai".
 * @param {HTMLElement} button tombol metode yang diklik
 */
function selectPayment(button) {
    const semuaTombol = document.querySelectorAll("#paymentMethod .method-btn");

    // Hapus status aktif dari semua tombol
    semuaTombol.forEach(function (tombol) {
        tombol.classList.remove("active");
    });

    // Jadikan tombol yang diklik sebagai aktif
    button.classList.add("active");
}

/* =============================================================
   7. TRANSAKASI
   ============================================================= */

/**
 * Menahan transaksi: menyimpan keranjang untuk dibayar di lain waktu.
 */
function holdTransaction() {
    // Keranjang tidak boleh kosong
    if (cart.length === 0) {
        alert("Keranjang masih kosong. Tidak ada transaksi untuk ditahan.");
        return;
    }

    const totalItem = cart.reduce(function (total, barang) {
        return total + barang.qty;
    }, 0);

    alert(
        "Transaksi berhasil ditahan.\n\n" +
        "No. Transaksi : " + generateTrxNumber() + "\n" +
        "Total Item   : " + totalItem + "\n" +
        "Total        : " + formatRupiah(getGrandTotal()) + "\n\n" +
        "Silakan lanjutkan pembayaran melalui menu Transaksi Ditahan."
    );
}

/**
 * Memproses pembayaran: validasi keranjang dan nominal, lalu menampilkan
 * ringkasan pembayaran sebagai struk.
 */
function processPayment() {
    // Syarat 1: keranjang harus berisi barang
    if (cart.length === 0) {
        alert("Keranjang masih kosong. Silakan cari atau scan barang terlebih dahulu.");
        return;
    }

    // Syarat 2: uang yang dibayar harus cukup
    const uangDibayar = parseFloat(document.getElementById("paidAmount").value) || 0;
    if (uangDibayar < grandTotal) {
        alert(
            "Uang yang dibayar kurang!\n\n" +
            "Total Akhir : " + formatRupiah(grandTotal) + "\n" +
            "Uang Dibayar: " + formatRupiah(uangDibayar) + "\n" +
            "Kurang      : " + formatRupiah(grandTotal - uangDibayar)
        );
        return;
    }

    // Ambil metode pembayaran yang sedang aktif
    const metode = document.querySelector("#paymentMethod .method-btn.active").innerText;

    // Pembayaran berhasil
    alert(
        "Pembayaran Berhasil!\n\n" +
        "No. Transaksi : " + generateTrxNumber() + "\n" +
        "Metode        : " + metode + "\n" +
        "Total         : " + formatRupiah(grandTotal) + "\n" +
        "Uang Dibayar  : " + formatRupiah(uangDibayar) + "\n" +
        "Kembalian     : " + formatRupiah(uangDibayar - grandTotal)
    );

    /*
    ------------------------------------------------------------
    TAHAP PENGEMBANGAN MENJADI LARAVEL:
    Simpan transaksi ke database, kurangi stok, lalu arahkan
    kasir ke halaman struk untuk dicetak.

    window.location.href = "/struk/" + nomorTransaksi;
    ------------------------------------------------------------
    */

    // Nomor transaksi berikutnya untuk transaksi selanjutnya
    trxCounter++;
    document.getElementById("trxNumber").textContent = generateTrxNumber();

    // Mulai transaksi baru dengan keranjang kosong
    cart = [];
    renderCart();
    calculateTotal();
    document.getElementById("paidAmount").value = 0;
}

/**
 * Membatalkan transaksi: mengosongkan keranjang, uang dibayar, dan diskon.
 */
function cancelTransaction() {
    // Konfirmasi dulu supaya tidak salah batal
    if (!confirm("Batalkan transaksi saat ini?")) {
        return;
    }

    cart = [];

    // Kembalikan seluruh input ke nilai awal
    document.getElementById("paidAmount").value = 0;
    document.getElementById("discountPercent").value = 0;
    document.getElementById("discountAmount").value = 0;
    document.getElementById("taxAmount").value = 0;
    document.getElementById("otherAmount").value = 0;

    renderCart();
    calculateTotal();
}

/* =============================================================
   8. SHORTCUT KEYBOARD
   F2 : fokus ke kolom pencarian barang
   F4 : fokus ke kolom uang dibayar
   ESC: membatalkan transaksi
   ============================================================= */
document.addEventListener("keydown", function (event) {
    // F2 — fokus ke pencarian barang
    if (event.key === "F2") {
        event.preventDefault();
        document.getElementById("searchInput").focus();
    }

    // F4 — fokus ke kolom uang dibayar
    if (event.key === "F4") {
        event.preventDefault();
        document.getElementById("paidAmount").focus();
    }

    // ESC — batalkan transaksi
    if (event.key === "Escape") {
        event.preventDefault();
        cancelTransaction();
    }
});

/* =============================================================
   9. INISIALISASI SAAT HALAMAN DIMUAT
   ============================================================= */
document.addEventListener("DOMContentLoaded", function () {
    // Nomor transaksi dan tanggal/jam pada header
    document.getElementById("trxNumber").textContent = generateTrxNumber();
    updateDateTime();

    // Pencarian barang secara real-time saat mengetik
    document.getElementById("searchInput").addEventListener("input", searchProduct);

    // Hitung ulang total whenever ada input diskon, pajak, atau biaya lain
    const inputHitungUlang = [
        "discountPercent",
        "discountAmount",
        "taxAmount",
        "otherAmount"
    ];

    inputHitungUlang.forEach(function (id) {
        document.getElementById(id).addEventListener("input", calculateTotal);
    });

    // Tampilkan kondisi awal
    renderCart();
    calculateTotal();
});
