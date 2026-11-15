/**
 * Purchases component - manage inbound stock (restock) from suppliers.
 * Owner creates purchases which automatically generate FIFO inventory batches.
 * Integrated with Payment Terms (Net 30, Net 15, COD), Due Dates, and Debt Installments.
 */
const PurchasesComponent = {
  masterItems: [],

  async render() {
    const content = document.getElementById('contentArea');
    document.getElementById('headerActions').innerHTML = `
      <button class="btn btn-primary" onclick="PurchasesComponent.showForm()">➕ Pembelian Baru</button>`;

    content.innerHTML = '<p>Memuat data pembelian...</p>';

    try {
      const res = await API.get('/api/purchases');
      const purchases = res.data;

      const totalHutang = purchases
        .filter(p => p.payment_status !== 'paid')
        .reduce((sum, p) => sum + (parseFloat(p.total_cost) - (parseFloat(p.amount_paid) || 0)), 0);

      content.innerHTML = `
        <div class="stats-grid" style="margin-bottom: 20px;">
          <div class="stat-card">
            <div class="stat-icon blue">📦</div>
            <div class="stat-info">
              <h4>${purchases.length} Nota</h4>
              <p>Total Transaksi Pembelian</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon red">⏳</div>
            <div class="stat-info">
              <h4>${Format.currency(totalHutang)}</h4>
              <p>Total Hutang Supplier Berjalan</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>No. PO</th>
                  <th>Supplier</th>
                  <th>Tgl Beli</th>
                  <th>Jatuh Tempo</th>
                  <th>Termin</th>
                  <th>Total Biaya</th>
                  <th>Dibayar</th>
                  <th>Status Pembayaran</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${purchases.length === 0 ? '<tr><td colspan="9" class="empty-state">Belum ada pembelian tercatat.</td></tr>' :
                  purchases.map(p => {
                    const totalCost = parseFloat(p.total_cost);
                    const amountPaid = parseFloat(p.amount_paid) || 0;
                    const remaining = totalCost - amountPaid;

                    let statusBadge = '<span class="badge badge-success">Lunas</span>';
                    if (p.payment_status === 'not_paid') {
                      statusBadge = '<span class="badge badge-danger">Hutang (Tempo)</span>';
                    } else if (p.payment_status === 'partially_paid') {
                      statusBadge = `<span class="badge badge-warning">Sebagian (Sisa: ${Format.currency(remaining)})</span>`;
                    }

                    const termLabel = {
                      cash: 'Tunai / COD',
                      net_15: 'Net 15 Hari',
                      net_30: 'Net 30 Hari',
                      net_60: 'Net 60 Hari',
                      custom: 'Tempo Khusus'
                    }[p.payment_term] || p.payment_term || 'Tunai';

                    return `<tr>
                      <td><strong>#${p.id}</strong></td>
                      <td><strong>${p.supplier_name}</strong></td>
                      <td>${Format.date(p.purchase_date)}</td>
                      <td>${p.due_date ? Format.date(p.due_date) : '-'}</td>
                      <td><small style="color:#64748b;">${termLabel}</small></td>
                      <td><strong>${Format.currency(p.total_cost)}</strong></td>
                      <td>${Format.currency(amountPaid)}</td>
                      <td>${statusBadge}</td>
                      <td>
                        ${remaining > 0 ? `
                          <button class="btn btn-sm btn-primary" onclick="PurchasesComponent.showPayModal(${p.id}, '${p.supplier_name}', ${totalCost}, ${amountPaid})" title="Bayar Tagihan Supplier">
                            💳 Bayar
                          </button>
                        ` : `
                          <button class="btn btn-sm btn-secondary" onclick="PurchasesComponent.showHistoryModal(${p.id})" title="Lihat Riwayat Pembayaran">
                            📜 Riwayat
                          </button>
                        `}
                      </td>
                    </tr>`;
                  }).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    } catch (err) {
      content.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }
  },

  async showForm() {
    let suppliers = [];
    try {
      const [suppRes, itemsRes] = await Promise.all([
        API.get('/api/suppliers'),
        API.get('/api/items')
      ]);
      suppliers = suppRes.data;
      this.masterItems = itemsRes.data || [];
    } catch (e) { /* ignore */ }

    if (suppliers.length === 0) {
      App.toast('Tambahkan supplier terlebih dahulu!', 'error');
      return;
    }

    const today = Format.localDate();
    const d30 = new Date();
    d30.setDate(d30.getDate() + 30);
    const date30Str = d30.toISOString().slice(0, 10);

    const body = `
      <form id="purchaseForm">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label>Supplier / Pemasok*</label>
            <select id="pSupplierId" class="form-control" required>
              ${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Tanggal Pembelian*</label>
            <input type="date" id="pDate" class="form-control" value="${today}" onchange="PurchasesComponent.onTermChange()" required>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-top:8px;">
          <div class="form-group">
            <label>Syarat Pembayaran (Termin)*</label>
            <select id="pPaymentTerm" class="form-control" onchange="PurchasesComponent.onTermChange()">
              <option value="net_30" selected>Tempo Net 30 Hari</option>
              <option value="net_15">Tempo Net 15 Hari</option>
              <option value="net_60">Tempo Net 60 Hari</option>
              <option value="custom">Tempo Khusus (Custom)</option>
              <option value="cash">Tunai / COD (Lunas di Muka)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Tanggal Jatuh Tempo</label>
            <input type="date" id="pDueDate" class="form-control" value="${date30Str}">
          </div>
          <div class="form-group">
            <label>Uang Muka / DP Dibayar (Rp)</label>
            <input type="number" id="pAmountPaid" class="form-control" value="0" min="0" step="1000">
          </div>
        </div>

        <div class="form-group" style="margin-top:8px;">
          <label>Catatan Pembelian</label>
          <textarea id="pNotes" class="form-control" placeholder="Catatan PO / faktur supplier (opsional)" style="min-height:50px;"></textarea>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin:16px 0 8px;">
          <h4 style="margin:0;">Item Barang yang Dibeli</h4>
          <button type="button" class="btn btn-secondary btn-sm" onclick="PurchasesComponent.addItemRow()">➕ Tambah Baris Item</button>
        </div>

        <datalist id="registeredItemsDatalist">
          ${this.masterItems.map(it => `<option value="${it.name}">${it.name} (Satuan Dasar: ${it.base_unit})</option>`).join('')}
        </datalist>

        <div id="purchaseItems"></div>

        <div style="margin-top:16px; padding:12px; background:var(--gray-50); border-radius:var(--radius); border:1px solid var(--gray-200); display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:600;">Total Biaya Pembelian:</span>
          <span id="pTotalCostDisplay" style="font-size:18px; font-weight:700; color:var(--primary);">${Format.currency(0)}</span>
        </div>
      </form>`;

    const footer = `
      <button class="btn btn-secondary" onclick="App.closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="PurchasesComponent.submitPurchase()">Simpan Pembelian</button>`;

    App.showModal('Pembelian Baru / Restock Gudang', body, footer, 'modal-lg');
    this.itemIndex = 0;
    this.addItemRow();
  },

  onTermChange() {
    const term = document.getElementById('pPaymentTerm')?.value;
    const pDateVal = document.getElementById('pDate')?.value;
    const dueDateInput = document.getElementById('pDueDate');
    const amountPaidInput = document.getElementById('pAmountPaid');
    if (!dueDateInput || !pDateVal) return;

    const pDate = new Date(pDateVal);
    if (term === 'net_15') {
      pDate.setDate(pDate.getDate() + 15);
      dueDateInput.value = pDate.toISOString().slice(0, 10);
      dueDateInput.disabled = false;
      if (amountPaidInput) amountPaidInput.value = 0;
    } else if (term === 'net_30') {
      pDate.setDate(pDate.getDate() + 30);
      dueDateInput.value = pDate.toISOString().slice(0, 10);
      dueDateInput.disabled = false;
      if (amountPaidInput) amountPaidInput.value = 0;
    } else if (term === 'net_60') {
      pDate.setDate(pDate.getDate() + 60);
      dueDateInput.value = pDate.toISOString().slice(0, 10);
      dueDateInput.disabled = false;
      if (amountPaidInput) amountPaidInput.value = 0;
    } else if (term === 'cash') {
      dueDateInput.value = pDateVal;
      dueDateInput.disabled = true;
      // Auto-fill full cost
      const totalDisplay = document.getElementById('pTotalCostDisplay')?.textContent || '0';
      const cleanNum = parseFloat(totalDisplay.replace(/[^0-9]/g, '')) || 0;
      if (amountPaidInput) amountPaidInput.value = cleanNum;
    } else {
      dueDateInput.disabled = false;
    }
  },

  itemIndex: 0,
  addItemRow() {
    const container = document.getElementById('purchaseItems');
    if (!container) return;

    const i = this.itemIndex++;
    const row = document.createElement('div');
    row.id = `pItemRow_${i}`;
    row.className = 'card';
    row.style.padding = '14px';
    row.style.marginBottom = '12px';
    row.style.background = 'var(--white)';
    row.style.border = '1px solid var(--gray-300)';

    row.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-weight:600; font-size:13px; color:var(--primary);">Item #${i + 1}</span>
        <button type="button" class="btn btn-sm btn-danger" onclick="PurchasesComponent.removeItemRow(${i})" style="padding:2px 8px;">✕ Hapus</button>
      </div>
      <div style="display:grid; grid-template-columns: 2fr 1fr 1.5fr 1.5fr; gap:10px;">
        <div class="form-group" style="margin-bottom:0">
          <label style="font-size:12px;">Nama Barang</label>
          <input type="text" id="piName_${i}" list="registeredItemsDatalist" required placeholder="Mis: XXX" oninput="PurchasesComponent.onItemNameTyped(${i})">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label style="font-size:12px;">Jumlah Satuan Beli</label>
          <input type="number" id="piQty_${i}" step="0.01" min="0.01" required placeholder="Mis: 1 (Kodi)" oninput="PurchasesComponent.recalcTotal()">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label style="font-size:12px;">Harga Beli per Satuan</label>
          <input type="number" id="piCost_${i}" step="100" min="1" required placeholder="Mis: 1200000" oninput="PurchasesComponent.recalcTotal()">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label style="font-size:12px;">Konversi ke <span id="piUnitLbl_${i}">Meter</span></label>
          <input type="number" id="piConv_${i}" step="0.01" min="0.01" required placeholder="Mis: 60 (meter/kodi)" oninput="PurchasesComponent.recalcTotal()">
        </div>
      </div>
      <div id="piSubtotal_${i}" style="font-size:12px; margin-top:6px; color:var(--gray-600); text-align:right;"></div>
    `;

    container.appendChild(row);
    this.recalcTotal();
  },

  removeItemRow(i) {
    const row = document.getElementById(`pItemRow_${i}`);
    if (row) row.remove();
    this.recalcTotal();
  },

  onItemNameTyped(i) {
    const val = document.getElementById(`piName_${i}`)?.value.trim().toLowerCase();
    const match = this.masterItems.find(it => it.name.toLowerCase() === val);
    const unitLbl = document.getElementById(`piUnitLbl_${i}`);
    if (unitLbl) {
      unitLbl.textContent = match ? match.base_unit : 'Meter';
    }
  },

  recalcTotal() {
    let grandTotal = 0;
    const container = document.getElementById('purchaseItems');
    if (!container) return;

    const rows = container.querySelectorAll('[id^="pItemRow_"]');
    rows.forEach(row => {
      const idx = row.id.split('_')[1];
      const qty = parseFloat(document.getElementById(`piQty_${idx}`)?.value) || 0;
      const cost = parseFloat(document.getElementById(`piCost_${idx}`)?.value) || 0;
      const conv = parseFloat(document.getElementById(`piConv_${idx}`)?.value) || 0;
      const subtotal = qty * cost;
      grandTotal += subtotal;

      const subtotalDiv = document.getElementById(`piSubtotal_${idx}`);
      if (subtotalDiv && (qty > 0 || cost > 0)) {
        const totalBase = qty * conv;
        const hppPerBase = totalBase > 0 ? (subtotal / totalBase) : 0;
        const unitLbl = document.getElementById(`piUnitLbl_${idx}`)?.textContent || 'Meter';
        subtotalDiv.innerHTML = `Subtotal: <strong>${Format.currency(subtotal)}</strong> | Total: <strong>${Format.number(totalBase, 1)} ${unitLbl}</strong> | HPP Dasar: <strong>${Format.currency(hppPerBase)} / ${unitLbl}</strong>`;
      }
    });

    const display = document.getElementById('pTotalCostDisplay');
    if (display) display.textContent = Format.currency(grandTotal);

    // If cash is selected, update amountPaid
    const term = document.getElementById('pPaymentTerm')?.value;
    const amountPaidInput = document.getElementById('pAmountPaid');
    if (term === 'cash' && amountPaidInput) {
      amountPaidInput.value = grandTotal;
    }
  },

  async submitPurchase() {
    const items = [];
    const container = document.getElementById('purchaseItems');
    const rows = container ? container.querySelectorAll('[id^="pItemRow_"]') : [];

    if (rows.length === 0) {
      App.toast('Tambahkan minimal 1 item pembelian!', 'error');
      return;
    }

    for (const row of rows) {
      const idx = row.id.split('_')[1];
      const name = document.getElementById(`piName_${idx}`)?.value.trim();
      const qty = parseFloat(document.getElementById(`piQty_${idx}`)?.value);
      const cost = parseFloat(document.getElementById(`piCost_${idx}`)?.value);
      const conv = parseFloat(document.getElementById(`piConv_${idx}`)?.value);

      if (!name || isNaN(qty) || qty <= 0 || isNaN(cost) || cost <= 0 || isNaN(conv) || conv <= 0) {
        App.toast('Mohon lengkapi semua baris item dengan nilai yang valid!', 'error');
        return;
      }

      items.push({
        itemName: name,
        quantity: qty,
        costPerUnit: cost,
        baseUnitConversion: conv
      });
    }

    try {
      const paymentTerm = document.getElementById('pPaymentTerm').value;
      const dueDate = document.getElementById('pDueDate').value;
      const amountPaid = parseFloat(document.getElementById('pAmountPaid').value) || 0;

      const res = await API.post('/api/purchases', {
        supplierId: parseInt(document.getElementById('pSupplierId').value),
        purchaseDate: document.getElementById('pDate').value,
        paymentTerm,
        dueDate,
        amountPaid,
        notes: document.getElementById('pNotes').value,
        items
      });

      App.closeModal();
      App.toast('Pembelian berhasil dicatat dan stok masuk ke gudang!', 'success');
      this.itemIndex = 0;
      this.render();
    } catch (err) {
      App.toast(err.message, 'error');
    }
  },

  showPayModal(purchaseId, supplierName, totalCost, amountPaid) {
    const remaining = totalCost - amountPaid;
    const today = Format.localDate();

    const body = `
      <form id="payDebtForm" onsubmit="event.preventDefault(); PurchasesComponent.submitPayment(${purchaseId});">
        <div style="background:#f8fafc; padding:12px; border-radius:8px; margin-bottom:14px; font-size:13px;">
          <div>Supplier: <strong>${supplierName}</strong> (PO #${purchaseId})</div>
          <div>Total Tagihan: <strong>${Format.currency(totalCost)}</strong></div>
          <div>Sudah Dibayar: <strong>${Format.currency(amountPaid)}</strong></div>
          <div style="color:#ef4444; font-size:15px; margin-top:4px;">Sisa Hutang: <strong>${Format.currency(remaining)}</strong></div>
        </div>

        <div class="form-group">
          <label>Tanggal Pembayaran*</label>
          <input type="date" id="debtPayDate" class="form-control" value="${today}" required>
        </div>
        <div class="form-group">
          <label>Jumlah yang Dibayar (Rp)*</label>
          <input type="number" id="debtPayAmount" class="form-control" value="${remaining}" max="${remaining}" min="1" step="1000" required>
        </div>
        <div class="form-group">
          <label>Metode Pembayaran</label>
          <select id="debtPayMethod" class="form-control">
            <option value="BANK" selected>Transfer Bank Bisnis</option>
            <option value="CASH">Kas Tunai Toko</option>
          </select>
        </div>
        <div class="form-group">
          <label>Catatan Pembayaran</label>
          <input type="text" id="debtPayNotes" class="form-control" placeholder="Contoh: Pelunasan termin Net 30 transfer BCA">
        </div>

        <div class="modal-footer" style="margin-top:20px; display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>
          <button type="submit" class="btn btn-primary" id="btnSubmitDebtPay">💳 Konfirmasi Pembayaran</button>
        </div>
      </form>
    `;

    App.showModal('Pembayaran Hutang Supplier', body);
  },

  async submitPayment(purchaseId) {
    const btn = document.getElementById('btnSubmitDebtPay');
    btn.disabled = true;
    btn.textContent = 'Memproses...';

    try {
      const paymentDate = document.getElementById('debtPayDate').value;
      const amount = parseFloat(document.getElementById('debtPayAmount').value);
      const paymentMethod = document.getElementById('debtPayMethod').value;
      const notes = document.getElementById('debtPayNotes').value;

      await API.post(`/api/purchases/${purchaseId}/payments`, {
        paymentDate,
        amount,
        paymentMethod,
        notes
      });

      App.closeModal();
      App.toast('Pembayaran hutang berhasil dicatat!', 'success');
      this.render();
    } catch (err) {
      App.toast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = '💳 Konfirmasi Pembayaran';
    }
  },

  async showHistoryModal(purchaseId) {
    try {
      const res = await API.get(`/api/purchases/${purchaseId}/payments`);
      const payments = res.data || [];

      const body = `
        <div style="margin-bottom:12px;">Riwayat Pembayaran PO #${purchaseId}:</div>
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="border-bottom:2px solid #e2e8f0; text-align:left;">
              <th style="padding:6px;">Tanggal</th>
              <th style="padding:6px;">Nominal</th>
              <th style="padding:6px;">Metode</th>
              <th style="padding:6px;">Dicatat Oleh</th>
              <th style="padding:6px;">Catatan</th>
            </tr>
          </thead>
          <tbody>
            ${payments.length === 0 ? '<tr><td colspan="5" style="padding:15px; text-align:center; color:#94a3b8;">Belum ada riwayat pembayaran tercatat.</td></tr>' :
              payments.map(p => `
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:6px;">${Format.date(p.payment_date)}</td>
                  <td style="padding:6px; font-weight:600; color:#10b981;">${Format.currency(p.amount)}</td>
                  <td style="padding:6px;"><span class="badge badge-info">${p.payment_method}</span></td>
                  <td style="padding:6px;">${p.created_by || '-'}</td>
                  <td style="padding:6px;">${p.notes || '-'}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
        <div style="margin-top:20px; text-align:right;">
          <button class="btn btn-secondary" onclick="App.closeModal()">Tutup</button>
        </div>
      `;

      App.showModal(`Riwayat Pembayaran Tagihan PO #${purchaseId}`, body);
    } catch (err) {
      App.toast(err.message, 'error');
    }
  }
};
