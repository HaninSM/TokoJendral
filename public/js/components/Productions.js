/**
 * Productions component - Manage Make-to-Stock / SPK Jahit Konveksi & Composite HPP
 */
const ProductionsComponent = {
  rawItems: [],
  productUnits: [],

  async render() {
    const content = document.getElementById('contentArea');
    document.getElementById('headerActions').innerHTML = `
      <button class="btn btn-primary" onclick="ProductionsComponent.showCreateModal()">✂️ Buat SPK Produksi Baru</button>`;

    content.innerHTML = '<p class="loading">Memuat riwayat perintah produksi / SPK...</p>';

    try {
      const [prodRes, itemsRes, unitsRes] = await Promise.all([
        API.get('/api/productions'),
        API.get('/api/items'),
        API.get('/api/products')
      ]);

      const productions = prodRes.data || [];
      this.rawItems = itemsRes.data || [];
      this.productUnits = unitsRes.data || [];

      const totalPcs = productions.reduce((sum, p) => sum + parseFloat(p.quantity_produced || 0), 0);
      const totalCost = productions.reduce((sum, p) => sum + parseFloat(p.total_cost || 0), 0);

      content.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon blue">✂️</div>
            <div class="stat-info">
              <h4>${productions.length} SPK</h4>
              <p>Total Surat Perintah Kerja</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">📦</div>
            <div class="stat-info">
              <h4>${totalPcs.toLocaleString('id-ID')} Pcs</h4>
              <p>Total Produk Jadi di Rak</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon purple">💰</div>
            <div class="stat-info">
              <h4>${Format.currency(totalCost)}</h4>
              <p>Akumulasi Biaya Produksi</p>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top: 20px;">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3>Daftar SPK Jahit & Alokasi Rak Kasir</h3>
            <span class="badge badge-info">${productions.length} Record</span>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>No. SPK</th>
                  <th>Tanggal</th>
                  <th>Produk Jadi</th>
                  <th>Bahan Terpakai (FIFO)</th>
                  <th>Penjahit</th>
                  <th>Total Biaya</th>
                  <th>HPP Komposit / Pcs</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${productions.length === 0 ? `
                  <tr>
                    <td colspan="8" class="empty-state" style="text-align: center; padding: 40px;">
                      <div style="font-size: 32px; margin-bottom: 10px;">✂️</div>
                      <p>Belum ada SPK produksi jahit yang diterbitkan.</p>
                      <button class="btn btn-sm btn-primary" onclick="ProductionsComponent.showCreateModal()" style="margin-top: 10px;">Mulai Buat SPK Pertama</button>
                    </td>
                  </tr>` :
                  productions.map(p => `
                    <tr>
                      <td><strong>${p.production_number}</strong></td>
                      <td>${Format.date(p.production_date)}</td>
                      <td>
                        <div style="font-weight: 600;">${p.variant_name}</div>
                        <small style="color: #64748b;">+${parseFloat(p.quantity_produced).toLocaleString('id-ID')} Pcs ke Rak</small>
                      </td>
                      <td>
                        <div>${p.raw_item_name}</div>
                        <small style="color: #64748b;">${parseFloat(p.base_quantity_used).toLocaleString('id-ID')} ${p.raw_base_unit} (@ ${Format.currency(p.raw_material_cost)})</small>
                      </td>
                      <td>${p.tailor_name || '<span style="color:#94a3b8;">-</span>'}</td>
                      <td>${Format.currency(p.total_cost)}</td>
                      <td>
                        <span class="badge badge-success" style="font-size: 13px; font-weight: 700;">
                          ${Format.currency(p.unit_cost)}
                        </span>
                      </td>
                      <td>
                        <span class="badge badge-primary">Selesai (Rak)</span>
                      </td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }
  },

  async showCreateModal() {
    const rawOptions = this.rawItems.map(item => `
      <option value="${item.id}">${item.name} (${item.base_unit})</option>
    `).join('');

    const unitOptions = this.productUnits.map(unit => `
      <option value="${unit.id}" data-item-id="${unit.item_id}" data-factor="${unit.conversion_factor}" data-price="${unit.selling_price}">
        ${unit.master_item_name || unit.item_name} — ${unit.unit_name} (Butuh ${unit.conversion_factor} ${unit.master_base_unit || 'Unit'})
      </option>
    `).join('');

    const modalBody = `
      <form id="productionForm" onsubmit="event.preventDefault(); ProductionsComponent.submit();">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label>Bahan Mentah Kain (FIFO)*</label>
            <select id="spkRawItemId" class="form-control" onchange="ProductionsComponent.onRawItemChange()" required>
              <option value="">-- Pilih Bahan Baku --</option>
              ${rawOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Varian Sprei / Produk Jadi*</label>
            <select id="spkUnitId" class="form-control" onchange="ProductionsComponent.updateLiveCalculation()" required>
              <option value="">-- Pilih Varian Produk Jadi --</option>
              ${unitOptions}
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 12px;">
          <div class="form-group">
            <label>Jumlah Jadi (Pcs)*</label>
            <input type="number" id="spkQty" class="form-control" value="10" min="1" step="1" oninput="ProductionsComponent.updateLiveCalculation()" required>
          </div>
          <div class="form-group">
            <label>Upah Jahit Borongan / Pcs (Rp)</label>
            <input type="number" id="spkLabor" class="form-control" value="10000" min="0" step="500" oninput="ProductionsComponent.updateLiveCalculation()">
          </div>
          <div class="form-group">
            <label>Biaya Aksesoris / Pcs (Rp)</label>
            <input type="number" id="spkAcc" class="form-control" value="5000" min="0" step="500" oninput="ProductionsComponent.updateLiveCalculation()">
          </div>
        </div>

        <div class="form-group" style="margin-top: 12px;">
          <label>Nama Mitra Penjahit</label>
          <input type="text" id="spkTailor" class="form-control" placeholder="Contoh: Pak Supri (Konveksi 1)">
        </div>

        <!-- Live Estimate Card -->
        <div id="spkLivePreview" style="margin-top: 16px; padding: 16px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0;">
          <div style="font-weight: 600; color: #1e293b; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
            <span>⚡</span> Kalkulasi HPP Komposit Real-Time (Odoo Enterprise Formula)
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
            <div>Kebutuhan Bahan Mentah: <strong id="estBaseQty">-</strong></div>
            <div>Biaya Bahan Baku (FIFO): <strong id="estRawCost">-</strong></div>
            <div>Total Upah Jahit Borongan: <strong id="estLaborCost">-</strong></div>
            <div>Total Biaya Aksesoris/Packing: <strong id="estAccCost">-</strong></div>
            <div style="grid-column: span 2; border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 4px;">
              <div style="display: flex; justify-content: space-between; font-size: 15px;">
                <span>Total Biaya SPK: <strong id="estTotalCost" style="color: #1e293b;">-</strong></span>
                <span>HPP Komposit / Pcs: <strong id="estUnitCost" style="color: #2563eb; font-size: 16px;">-</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer" style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>
          <button type="submit" class="btn btn-primary" id="btnSubmitSPK">✂️ Eksekusi Jahit & Masuk Rak</button>
        </div>
      </form>
    `;

    App.showModal('Surat Perintah Kerja (SPK) Konveksi & HPP Komposit', modalBody, '', 'modal-lg');

    // Auto-select first item if available
    if (this.rawItems.length > 0) {
      document.getElementById('spkRawItemId').value = this.rawItems[0].id;
      this.onRawItemChange();
    }
  },

  onRawItemChange() {
    const rawId = parseInt(document.getElementById('spkRawItemId').value, 10);
    const unitSelect = document.getElementById('spkUnitId');
    const options = unitSelect.querySelectorAll('option');

    let firstMatch = null;
    options.forEach(opt => {
      if (!opt.value) return;
      const itemId = parseInt(opt.getAttribute('data-item-id'), 10);
      if (rawId && itemId === rawId) {
        opt.style.display = '';
        if (!firstMatch) firstMatch = opt.value;
      } else {
        opt.style.display = 'none';
      }
    });

    if (firstMatch) {
      unitSelect.value = firstMatch;
    }
    this.updateLiveCalculation();
  },

  async updateLiveCalculation() {
    const rawItemId = parseInt(document.getElementById('spkRawItemId')?.value, 10);
    const productUnitId = parseInt(document.getElementById('spkUnitId')?.value, 10);
    const qty = parseFloat(document.getElementById('spkQty')?.value) || 0;
    const labor = parseFloat(document.getElementById('spkLabor')?.value) || 0;
    const acc = parseFloat(document.getElementById('spkAcc')?.value) || 0;

    if (!rawItemId || !productUnitId || qty <= 0) return;

    try {
      const res = await API.post('/api/productions/estimate', {
        rawItemId,
        productUnitId,
        quantityProduced: qty,
        laborCostPerUnit: labor,
        accessoryCostPerUnit: acc
      });

      const est = res.data;
      document.getElementById('estBaseQty').textContent = `${est.baseQtyNeeded.toLocaleString('id-ID')} Unit`;
      document.getElementById('estRawCost').textContent = Format.currency(est.rawMaterialCost);
      document.getElementById('estLaborCost').textContent = Format.currency(est.totalLabor);
      document.getElementById('estAccCost').textContent = Format.currency(est.totalAccessory);
      document.getElementById('estTotalCost').textContent = Format.currency(est.totalCost);
      document.getElementById('estUnitCost').textContent = Format.currency(est.unitCost);
      document.getElementById('btnSubmitSPK').disabled = false;
    } catch (err) {
      document.getElementById('estUnitCost').textContent = `⚠️ ${err.message}`;
      document.getElementById('btnSubmitSPK').disabled = true;
    }
  },

  async submit() {
    const rawItemId = parseInt(document.getElementById('spkRawItemId').value, 10);
    const productUnitId = parseInt(document.getElementById('spkUnitId').value, 10);
    const qty = parseFloat(document.getElementById('spkQty').value);
    const labor = parseFloat(document.getElementById('spkLabor').value) || 0;
    const acc = parseFloat(document.getElementById('spkAcc').value) || 0;
    const tailorName = document.getElementById('spkTailor').value;

    const btn = document.getElementById('btnSubmitSPK');
    btn.disabled = true;
    btn.textContent = 'Memproses Potong & Jahit...';

    try {
      const res = await API.post('/api/productions', {
        rawItemId,
        productUnitId,
        quantityProduced: qty,
        laborCostPerUnit: labor,
        accessoryCostPerUnit: acc,
        tailorName
      });

      App.closeModal();
      App.toast(`SPK ${res.data.productionNumber} berhasil diproses! Stok fisik rak bertambah ${qty} pcs.`, 'success');
      this.render();
    } catch (err) {
      App.toast(err.message, 'danger');
      btn.disabled = false;
      btn.textContent = '✂️ Eksekusi Jahit & Masuk Rak';
    }
  }
};
