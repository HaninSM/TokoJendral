/**
 * POS (Point of Sale) checkout component.
 * Handles product browsing, cart management, and payment processing.
 */
const POSComponent = {
  cart: [],
  products: [],
  stockData: [],
  paymentMethod: 'CASH',

  async render() {
    const content = document.getElementById('contentArea');
    content.innerHTML = '<p>Memuat produk...</p>';

    try {
      const [prodRes, stockRes] = await Promise.all([
        API.get('/api/products'),
        API.get('/api/products/stock')
      ]);
      this.products = prodRes.data;
      this.stockData = stockRes.data;
      this.renderPOS();
    } catch (err) {
      content.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }
  },

  getStockForProduct(product) {
    const item = this.stockData.find(s => s.itemName === product.item_name || s.itemId === product.item_id);
    if (!item) return 0;
    const unit = item.productUnits.find(u => u.id === product.id);
    return unit ? unit.available : 0;
  },

  renderPOS() {
    const content = document.getElementById('contentArea');
    content.innerHTML = `
      <div class="pos-layout">
        <div class="pos-products">
          <div class="toolbar">
            <div class="search-box">
              <input type="text" id="productSearch" placeholder="Cari produk..." oninput="POSComponent.filterProducts()">
            </div>
          </div>
          <div class="product-grid" id="productGrid"></div>
        </div>
        <div class="pos-cart">
          <div class="cart-header">🛒 Keranjang (<span id="cartCount">0</span>)</div>
          <div class="cart-items" id="cartItems">
            <div class="empty-state"><div class="icon">🛒</div><p>Keranjang kosong</p></div>
          </div>
          <div class="cart-footer">
            <div class="cart-total">
              <span>Total</span>
              <span id="cartTotal">${Format.currency(0)}</span>
            </div>
            <div class="payment-section">
              <label>Metode Pembayaran</label>
              <div class="payment-methods">
                <button class="payment-method-btn active" onclick="POSComponent.setPayment('CASH')">CASH</button>
                <button class="payment-method-btn" onclick="POSComponent.setPayment('TRANSFER')">TRANSFER</button>
                <button class="payment-method-btn" onclick="POSComponent.setPayment('QRIS')">QRIS</button>
                <button class="payment-method-btn" onclick="POSComponent.setPayment('SPLIT')">⚡ SPLIT</button>
              </div>
            </div>
            <div class="cash-input visible" id="cashInput">
              <label>Uang Dibayar</label>
              <input type="number" id="amountPaid" placeholder="0" oninput="POSComponent.calcChange()">
            </div>
            <div class="split-input" id="splitInput" style="display:none; margin-top:10px; background:#f8fafc; padding:10px; border-radius:8px; border:1px solid #e2e8f0;">
              <div style="font-size:12px; font-weight:600; color:#334155; margin-bottom:8px;">Alokasi Multi-Payment (Split):</div>
              <div style="margin-bottom:6px;">
                <label style="font-size:11px; display:flex; justify-content:space-between;">
                  <span>💵 Tunai / Cash (CSH1)</span>
                  <span style="color:#64748b;">(Bayar / Uang Diterima)</span>
                </label>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                  <input type="number" id="splitCashAmount" placeholder="Nominal Bayar" oninput="POSComponent.calcSplit()" style="font-size:12px; padding:4px 6px;">
                  <input type="number" id="splitCashTendered" placeholder="Uang Diterima" oninput="POSComponent.calcSplit()" style="font-size:12px; padding:4px 6px;">
                </div>
              </div>
              <div style="margin-bottom:6px;">
                <label style="font-size:11px;">📱 QRIS & EDC (QRIS1)</label>
                <input type="number" id="splitQrisAmount" placeholder="Nominal QRIS" oninput="POSComponent.calcSplit()" style="font-size:12px; padding:4px 6px;">
              </div>
              <div style="margin-bottom:6px;">
                <label style="font-size:11px;">🏦 Transfer Bank (BNK1)</label>
                <input type="number" id="splitTransferAmount" placeholder="Nominal Transfer" oninput="POSComponent.calcSplit()" style="font-size:12px; padding:4px 6px;">
              </div>
              <div id="splitStatusBox" style="font-size:12px; margin-top:6px; padding:6px; border-radius:4px; font-weight:600;"></div>
            </div>
            <div class="change-display" id="changeDisplay">Kembalian: ${Format.currency(0)}</div>
            <div style="margin-bottom:10px;">
              <label style="font-size:12px; font-weight:600; color:var(--gray-600); display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span>📅 Tanggal Transaksi</span>
                <span style="font-size:11px; color:var(--primary); cursor:pointer; text-decoration:underline;" onclick="POSComponent.setNowDate()">Sekarang</span>
              </label>
              <input type="datetime-local" id="txDate" style="font-size:13px; padding:6px 10px; width:100%;">
            </div>
            <input type="text" id="customerName" placeholder="Nama Pelanggan (opsional)" style="margin-bottom:12px">
            <button class="btn btn-success btn-full" onclick="POSComponent.checkout()">💳 Bayar</button>
          </div>
        </div>
      </div>
    `;
    this.setNowDate();
    this.renderProducts();
  },

  renderProducts(filter = '') {
    const grid = document.getElementById('productGrid');
    const filtered = this.products.filter(p =>
      !filter || p.item_name.toLowerCase().includes(filter) || p.unit_name.toLowerCase().includes(filter)
    );

    grid.innerHTML = filtered.length === 0
      ? '<div class="empty-state"><p>Tidak ada produk ditemukan.</p></div>'
      : filtered.map(p => {
        const stock = this.getStockForProduct(p);
        const isBundle = !!p.is_bundle;
        const isAllocated = p.stock_mode === 'allocated';
        return `<div class="product-card" onclick="POSComponent.addToCart(${p.id})" ${stock <= 0 ? 'style="opacity:0.5;pointer-events:none"' : ''}>
          <div class="product-name">
            ${isBundle ? '🧺 ' : ''}${p.item_name}
            ${isBundle ? '<span class="badge badge-info" style="font-size:10px; margin-left:4px;">BUNDLE</span>' : ''}
            ${isAllocated ? '<span class="badge badge-warning" style="font-size:10px; margin-left:4px;">ALOKASI</span>' : ''}
          </div>
          <div class="product-unit">${p.unit_name}</div>
          <div class="product-price">${Format.currency(p.selling_price)}</div>
          <div class="product-stock">Stok: ${Format.number(stock, 0)} ${p.unit_name}</div>
        </div>`;
      }).join('');
  },

  filterProducts() {
    const search = document.getElementById('productSearch').value.toLowerCase();
    this.renderProducts(search);
  },

  addToCart(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const existing = this.cart.find(c => c.productUnitId === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.push({
        productUnitId: productId,
        name: `${product.item_name} - ${product.unit_name}`,
        price: parseFloat(product.selling_price),
        quantity: 1
      });
    }
    this.renderCart();
  },

  updateQty(index, delta) {
    this.cart[index].quantity += delta;
    if (this.cart[index].quantity <= 0) this.cart.splice(index, 1);
    this.renderCart();
  },

  removeFromCart(index) {
    this.cart.splice(index, 1);
    this.renderCart();
  },

  renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');

    const total = this.cart.reduce((s, c) => s + c.price * c.quantity, 0);
    cartCount.textContent = this.cart.length;
    cartTotal.textContent = Format.currency(total);

    if (this.cart.length === 0) {
      cartItems.innerHTML = '<div class="empty-state"><div class="icon">🛒</div><p>Keranjang kosong</p></div>';
      return;
    }

    cartItems.innerHTML = this.cart.map((item, i) => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${Format.currency(item.price)} / pcs</div>
        </div>
        <div class="cart-item-qty">
          <button onclick="POSComponent.updateQty(${i}, -1)">-</button>
          <input type="number" value="${item.quantity}" min="0.01" step="any" onchange="POSComponent.setQty(${i}, this.value)" style="width:55px; text-align:center; padding:2px 4px; font-weight:600; border:1px solid var(--gray-300); border-radius:4px;">
          <button onclick="POSComponent.updateQty(${i}, 1)">+</button>
        </div>
        <div class="cart-item-subtotal">${Format.currency(item.price * item.quantity)}</div>
        <button class="cart-item-remove" onclick="POSComponent.removeFromCart(${i})">✕</button>
      </div>
    `).join('');

    this.calcChange();
  },

  setQty(index, val) {
    const q = parseFloat(val);
    if (isNaN(q) || q <= 0) {
      this.cart.splice(index, 1);
    } else {
      this.cart[index].quantity = q;
    }
    this.renderCart();
  },

  setPayment(method) {
    this.paymentMethod = method;
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.includes(method));
    });
    const cashInput = document.getElementById('cashInput');
    const splitInput = document.getElementById('splitInput');
    const changeDisplay = document.getElementById('changeDisplay');

    if (method === 'CASH') {
      cashInput.style.display = 'block';
      splitInput.style.display = 'none';
      this.calcChange();
    } else if (method === 'SPLIT') {
      cashInput.style.display = 'none';
      splitInput.style.display = 'block';
      changeDisplay.classList.remove('visible');
      this.calcSplit();
    } else {
      cashInput.style.display = 'none';
      splitInput.style.display = 'none';
      changeDisplay.classList.remove('visible');
    }
  },

  calcSplit() {
    if (this.paymentMethod !== 'SPLIT') return;
    const total = this.cart.reduce((s, c) => s + c.price * c.quantity, 0);

    const cashPay = parseFloat(document.getElementById('splitCashAmount')?.value) || 0;
    const cashTender = parseFloat(document.getElementById('splitCashTendered')?.value) || cashPay;
    const qrisPay = parseFloat(document.getElementById('splitQrisAmount')?.value) || 0;
    const transferPay = parseFloat(document.getElementById('splitTransferAmount')?.value) || 0;

    const totalCovered = cashPay + qrisPay + transferPay;
    const remaining = total - totalCovered;
    const cashChange = cashTender > cashPay ? (cashTender - cashPay) : 0;

    const statusBox = document.getElementById('splitStatusBox');
    if (!statusBox) return;

    if (total === 0) {
      statusBox.innerHTML = '<span style="color:#94a3b8;">Keranjang belanja masih kosong.</span>';
      return;
    }

    if (remaining <= 0) {
      statusBox.style.background = '#dcfce7';
      statusBox.style.color = '#15803d';
      statusBox.innerHTML = `✅ Tagihan LUNAS! ${cashChange > 0 ? `| Kembalian Tunai: <strong>${Format.currency(cashChange)}</strong>` : ''}`;
    } else {
      statusBox.style.background = '#fee2e2';
      statusBox.style.color = '#b91c1c';
      statusBox.innerHTML = `⚠️ Kurang <strong>${Format.currency(remaining)}</strong> dari total ${Format.currency(total)}`;
    }
  },

  calcChange() {
    if (this.paymentMethod !== 'CASH') return;
    const total = this.cart.reduce((s, c) => s + c.price * c.quantity, 0);
    const paid = parseFloat(document.getElementById('amountPaid').value) || 0;
    const change = paid - total;
    const display = document.getElementById('changeDisplay');
    if (paid > 0) {
      display.classList.add('visible');
      display.textContent = change >= 0 ? `Kembalian: ${Format.currency(change)}` : `Kurang: ${Format.currency(Math.abs(change))}`;
      display.style.background = change >= 0 ? 'var(--success-light)' : 'var(--danger-light)';
      display.style.color = change >= 0 ? 'var(--success)' : 'var(--danger)';
    } else {
      display.classList.remove('visible');
    }
  },

  setNowDate() {
    const el = document.getElementById('txDate');
    if (!el) return;
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    el.value = localIso;
  },

  async checkout() {
    if (this.cart.length === 0) {
      App.toast('Keranjang kosong!', 'error');
      return;
    }

    const total = this.cart.reduce((s, c) => s + c.price * c.quantity, 0);
    const txDateVal = document.getElementById('txDate')?.value;
    const transactionDate = txDateVal ? new Date(txDateVal).toISOString() : undefined;
    const customerName = document.getElementById('customerName')?.value || null;

    let payload = {
      items: this.cart.map(c => ({ productUnitId: c.productUnitId, quantity: c.quantity })),
      customerName,
      transactionDate
    };

    if (this.paymentMethod === 'SPLIT') {
      const cashPay = parseFloat(document.getElementById('splitCashAmount')?.value) || 0;
      const cashTender = parseFloat(document.getElementById('splitCashTendered')?.value) || cashPay;
      const qrisPay = parseFloat(document.getElementById('splitQrisAmount')?.value) || 0;
      const transferPay = parseFloat(document.getElementById('splitTransferAmount')?.value) || 0;

      const totalCovered = cashPay + qrisPay + transferPay;
      if (totalCovered < total) {
        App.toast(`Pembayaran kurang! Butuh ${Format.currency(total)}, baru teralokasi ${Format.currency(totalCovered)}`, 'error');
        return;
      }

      const payments = [];
      if (cashPay > 0) payments.push({ method: 'CASH', amount: cashPay, tenderedAmount: cashTender });
      if (qrisPay > 0) payments.push({ method: 'QRIS', amount: qrisPay, tenderedAmount: qrisPay });
      if (transferPay > 0) payments.push({ method: 'TRANSFER', amount: transferPay, tenderedAmount: transferPay });

      payload.paymentMethod = 'SPLIT';
      payload.payments = payments;
    } else {
      const amountPaid = this.paymentMethod === 'CASH'
        ? parseFloat(document.getElementById('amountPaid').value) || 0
        : total;

      if (this.paymentMethod === 'CASH' && amountPaid < total) {
        App.toast('Pembayaran kurang!', 'error');
        return;
      }

      payload.paymentMethod = this.paymentMethod;
      payload.amountPaid = amountPaid;
    }

    try {
      const res = await API.post('/api/transactions/checkout', payload);

      if (res.success) {
        const data = res.data;
        const changeText = data.changeAmount > 0 ? `\nKembalian: ${Format.currency(data.changeAmount)}` : '';
        App.toast(`Transaksi #${data.transactionId} berhasil! (${data.paymentMethod}) Total: ${Format.currency(data.totalAmount)}${changeText}`, 'success');

        // Reset cart
        this.cart = [];
        this.render();
      }
    } catch (err) {
      App.toast(err.message, 'error');
    }
  }
};
