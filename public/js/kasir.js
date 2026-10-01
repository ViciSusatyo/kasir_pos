/* ============================================
   0. SAMPLE PRODUCT DATA
============================================ */
const products = [
    { id: 1, code: "BRG001", barcode: "899123456001", name: "Indomie Goreng",        price: 3500 },
    { id: 2, code: "BRG002", barcode: "899123456002", name: "Aqua 600ml",            price: 4000 },
    { id: 3, code: "BRG003", barcode: "899123456003", name: "Teh Botol Sosro",       price: 5000 },
    { id: 4, code: "BRG004", barcode: "899123456004", name: "Beras 5 Kg",            price: 75000 },
    { id: 5, code: "BRG005", barcode: "899123456005", name: "Minyak Goreng 1 Liter", price: 18000 },
    { id: 6, code: "BRG006", barcode: "899123456006", name: "Gula Pasir 1 Kg",       price: 17000 },
];

let cart = [];

/* ============================================
   1. FORMAT RUPIAH
============================================ */
function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
}

/* ============================================
   2. SEARCH PRODUCT
============================================ */
const searchInput = document.getElementById("searchProduct");
searchInput.addEventListener("input", searchProduct);

function searchProduct() {
    const keyword = searchInput.value.toLowerCase().trim();
    const resultBox = document.getElementById("productResults");

    if (!keyword) {
        resultBox.style.display = "none";
        return;
    }

    const results = products.filter(
        (p) =>
            p.name.toLowerCase().includes(keyword) ||
            p.code.toLowerCase().includes(keyword) ||
            p.barcode.includes(keyword),
    );

    if (results.length === 0) {
        resultBox.innerHTML = `<div class="product-item">Barang tidak ditemukan</div>`;
    } else {
        resultBox.innerHTML = results
            .map(
                (p) => `
                <div class="product-item" onclick="addToCart(${p.id})">
                    <div>
                        <div class="product-name">${p.name}</div>
                        <div class="product-code">${p.code} - ${p.barcode}</div>
                    </div>
                    <div class="product-price">${formatRupiah(p.price)}</div>
                </div>`,
            )
            .join("");
    }
    resultBox.style.display = "block";
}

// Enter = scanner/barcode: exact barcode or code match is added directly
searchInput.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    const keyword = searchInput.value.trim().toLowerCase();
    const match = products.find(
        (p) => p.barcode === keyword || p.code.toLowerCase() === keyword,
    );
    if (match) addToCart(match.id);
});

/* ============================================
   3. CART
============================================ */
function addToCart(productId) {
    const product = products.find((p) => p.id === productId);
    const existing = cart.find((item) => item.id === productId);

    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    searchInput.value = "";
    document.getElementById("productResults").style.display = "none";
    searchInput.focus();
    renderCart();
}

function renderCart() {
    const body = document.getElementById("cartBody");

    if (cart.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="6" class="empty-cart">
                    Keranjang masih kosong.<br>Silakan cari atau scan barang.
                </td>
            </tr>`;
        calculateTotal();
        return;
    }

    body.innerHTML = cart
        .map(
            (item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <strong>${item.name}</strong>
                    <div style="font-size:11px; color:#6c757d">${item.code}</div>
                </td>
                <td>${formatRupiah(item.price)}</td>
                <td>
                    <div class="qty-control">
                        <button onclick="changeQty(${item.id}, -1)">−</button>
                        <input type="number" value="${item.qty}" min="1"
                               onchange="updateQty(${item.id}, this.value)">
                        <button onclick="changeQty(${item.id}, 1)">+</button>
                    </div>
                </td>
                <td class="text-right"><strong>${formatRupiah(item.price * item.qty)}</strong></td>
                <td class="text-center">
                    <button class="remove-btn" onclick="removeItem(${item.id})">×</button>
                </td>
            </tr>`,
        )
        .join("");

    calculateTotal();
}

function changeQty(id, amount) {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    item.qty += amount;
    if (item.qty <= 0) {
        removeItem(id);
        return;
    }
    renderCart();
}

function updateQty(id, qty) {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    item.qty = Math.max(1, parseInt(qty) || 1);
    renderCart();
}

function removeItem(id) {
    cart = cart.filter((item) => item.id !== id);
    renderCart();
}

/* ============================================
   4. CALCULATIONS
============================================ */
function getGrandTotal() {
    let subtotal = 0;
    cart.forEach((item) => (subtotal += item.price * item.qty));

    const discountPercent = parseFloat(document.getElementById("discountPercent").value) || 0;
    const discountAmount  = parseFloat(document.getElementById("discountAmount").value) || 0;
    const tax      = parseFloat(document.getElementById("tax").value) || 0;
    const otherFee = parseFloat(document.getElementById("otherFee").value) || 0;

    const discount = (subtotal * discountPercent) / 100 + discountAmount;
    return Math.max(0, subtotal - discount + tax + otherFee);
}

function calculateTotal() {
    let totalQty = 0;
    let subtotal = 0;
    cart.forEach((item) => {
        totalQty += item.qty;
        subtotal += item.price * item.qty;
    });

    document.getElementById("totalQty").innerText = totalQty;
    document.getElementById("itemCount").innerText = totalQty + " Item";
    document.getElementById("subtotal").innerText = formatRupiah(subtotal);
    document.getElementById("grandTotal").innerText = formatRupiah(getGrandTotal());

    calculateChange();
}

function calculateChange() {
    const grandTotal = getGrandTotal();
    const payment = parseFloat(document.getElementById("payment").value) || 0;
    const change = payment - grandTotal;

    const changeBox = document.getElementById("changeBox");
    const changeElement = document.getElementById("change");
    const label = document.querySelector(".change-label");

    if (change >= 0) {
        changeBox.classList.remove("short-payment");
        changeElement.innerText = formatRupiah(change);
        label.innerText = "KEMBALIAN";
    } else {
        changeBox.classList.add("short-payment");
        changeElement.innerText = formatRupiah(Math.abs(change));
        label.innerText = "UANG KURANG";
    }
}

/* ============================================
   5. PAYMENT METHOD
============================================ */
function selectPayment(button) {
    document
        .querySelectorAll(".payment-method button")
        .forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
}

/* ============================================
   6. ACTIONS: HOLD / PAY / CANCEL
============================================ */
function holdTransaction() {
    if (cart.length === 0) {
        alert("Tidak ada transaksi untuk ditahan.");
        return;
    }
    alert("Transaksi berhasil ditahan.");
}

function processPayment() {
    if (cart.length === 0) {
        alert("Keranjang masih kosong.");
        return;
    }

    const total = getGrandTotal();
    const payment = parseFloat(document.getElementById("payment").value) || 0;

    if (payment < total) {
        alert("Uang pembayaran masih kurang.");
        return;
    }

    const change = payment - total;
    alert(
        "Pembayaran berhasil!\n\n" +
            "Total   : " + formatRupiah(total) + "\n" +
            "Bayar   : " + formatRupiah(payment) + "\n" +
            "Kembali : " + formatRupiah(change),
    );

    // Later: save to the database, then redirect to the receipt page
    // window.location.href = "/transaksi/" + transactionId + "/print";
}

function cancelTransaction() {
    if (!confirm("Batalkan transaksi ini?")) return;

    cart = [];
    document.getElementById("payment").value = "";
    document.getElementById("discountPercent").value = 0;
    document.getElementById("discountAmount").value = 0;
    document.getElementById("tax").value = 0;
    document.getElementById("otherFee").value = 0;
    renderCart();
}

/* ============================================
   7. DATE
============================================ */
document.getElementById("currentDate").innerText = new Date().toLocaleString("id-ID");

/* ============================================
   8. KEYBOARD SHORTCUTS
============================================ */
document.addEventListener("keydown", function (event) {
    if (event.key === "F2") {
        event.preventDefault();
        searchInput.focus();
    }
    if (event.key === "F4") {
        event.preventDefault();
        document.getElementById("payment").focus();
    }
    if (event.key === "Escape" && cart.length > 0) {
        cancelTransaction();
    }
});

/* ============================================
   9. INITIAL
============================================ */
renderCart();
