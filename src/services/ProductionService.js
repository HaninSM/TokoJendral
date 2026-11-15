const db = require('../config/database');
const InventoryBatchModel = require('../models/InventoryBatchModel');
const ProductUnitModel = require('../models/ProductUnitModel');
const ProductionModel = require('../models/ProductionModel');

class ProductionService {
  /**
   * Preview HPP komposit sebelum dieksekusi
   */
  static async calculateEstimate({ rawItemId, productUnitId, quantityProduced, laborCostPerUnit = 0, accessoryCostPerUnit = 0 }) {
    const unit = await ProductUnitModel.findById(productUnitId);
    if (!unit) throw new Error('Varian produk tidak ditemukan.');

    const qty = parseFloat(quantityProduced);
    if (!qty || qty <= 0) throw new Error('Jumlah produksi harus lebih dari 0.');

    const conversionFactor = parseFloat(unit.conversion_factor) || 1.0;
    const baseQtyNeeded = qty * conversionFactor;

    // Ambil batch FIFO aktif tertua
    const activeBatches = await InventoryBatchModel.getActiveBatchesByItem(rawItemId);
    const totalAvail = activeBatches.reduce((acc, b) => acc + parseFloat(b.remaining_quantity), 0);
    if (baseQtyNeeded > totalAvail) {
      throw new Error(`Stok bahan baku tidak mencukupi! Butuh ${baseQtyNeeded} ${unit.master_base_unit || ''}, tersedia ${totalAvail}`);
    }

    // Hitung estimasi biaya bahan baku berdasarkan urutan FIFO
    let remainingToCalculate = baseQtyNeeded;
    let rawMaterialCost = 0;
    for (const batch of activeBatches) {
      if (remainingToCalculate <= 0) break;
      const rem = parseFloat(batch.remaining_quantity);
      const cost = parseFloat(batch.base_cost_price);
      const used = Math.min(rem, remainingToCalculate);
      rawMaterialCost += used * cost;
      remainingToCalculate -= used;
    }

    const laborPerUnit = parseFloat(laborCostPerUnit) || 0;
    const accPerUnit = parseFloat(accessoryCostPerUnit) || 0;

    const totalLabor = qty * laborPerUnit;
    const totalAccessory = qty * accPerUnit;
    const totalCost = rawMaterialCost + totalLabor + totalAccessory;
    const unitCost = totalCost / qty;

    let suggestedPrice = parseFloat(unit.selling_price);
    if (unit.pricing_method === 'percentage_margin' && unit.margin_percentage) {
      suggestedPrice = unitCost * (1 + parseFloat(unit.margin_percentage) / 100);
    }

    return {
      rawItemId,
      productUnitId,
      quantityProduced: qty,
      baseQtyNeeded,
      rawMaterialCost,
      laborCostPerUnit: laborPerUnit,
      totalLabor,
      accessoryCostPerUnit: accPerUnit,
      totalAccessory,
      totalCost,
      unitCost,
      currentSellingPrice: parseFloat(unit.selling_price),
      suggestedPrice: Math.round(suggestedPrice)
    };
  }

  /**
   * Eksekusi Perintah Produksi (SPK) Selesai secara Atomik
   */
  static async executeProduction({ rawItemId, productUnitId, quantityProduced, laborCostPerUnit = 0, accessoryCostPerUnit = 0, tailorName, notes }) {
    return db.transaction(async (trx) => {
      const unit = await trx('product_units').where({ id: productUnitId }).first();
      if (!unit) throw new Error('Varian produk tidak ditemukan.');

      const qty = parseFloat(quantityProduced);
      if (!qty || qty <= 0) throw new Error('Jumlah produksi harus lebih dari 0.');

      const conversionFactor = parseFloat(unit.conversion_factor) || 1.0;
      const baseQtyNeeded = qty * conversionFactor;

      // 1. Validasi & Ambil Batch FIFO
      const batches = await trx('inventory_batches')
        .where('item_id', rawItemId)
        .where('remaining_quantity', '>', 0)
        .orderBy('received_date', 'asc')
        .orderBy('id', 'asc');

      const totalAvail = batches.reduce((sum, b) => sum + parseFloat(b.remaining_quantity), 0);
      if (baseQtyNeeded > totalAvail) {
        throw new Error(`Stok kain/bahan tidak mencukupi! Butuh ${baseQtyNeeded}, tersedia ${totalAvail}`);
      }

      // 2. Potong Stok FIFO
      let remainingToDeduct = baseQtyNeeded;
      let totalRawCost = 0;

      for (const batch of batches) {
        if (remainingToDeduct <= 0) break;
        const currentQty = parseFloat(batch.remaining_quantity);
        const costPrice = parseFloat(batch.base_cost_price);

        const deduct = Math.min(currentQty, remainingToDeduct);
        totalRawCost += deduct * costPrice;

        await trx('inventory_batches')
          .where({ id: batch.id })
          .update({
            remaining_quantity: currentQty - deduct
          });

        remainingToDeduct -= deduct;
      }

      // 3. Hitung Biaya Akhir & HPP Komposit
      const laborPerUnit = parseFloat(laborCostPerUnit) || 0;
      const accPerUnit = parseFloat(accessoryCostPerUnit) || 0;
      const totalLabor = qty * laborPerUnit;
      const totalAccessory = qty * accPerUnit;
      const totalCost = totalRawCost + totalLabor + totalAccessory;
      const unitCost = totalCost / qty;

      // 4. Update Stok Rak Kasir (Physical Allocation) & Update Harga jika Margin %
      const newAllocated = (parseFloat(unit.allocated_stock) || 0) + qty;
      const updateUnitData = {
        stock_mode: 'allocated',
        allocated_stock: newAllocated,
        updated_at: trx.fn.now()
      };

      if (unit.pricing_method === 'percentage_margin' && unit.margin_percentage) {
        updateUnitData.selling_price = Math.round(unitCost * (1 + parseFloat(unit.margin_percentage) / 100));
      }

      await trx('product_units').where({ id: unit.id }).update(updateUnitData);

      // 5. Generate Nomor SPK & Simpan Dokumen
      const countResult = await trx('productions').count('id as cnt');
      const nextNum = (countResult[0]?.cnt || 0) + 1;
      const todayStr = new Date().toISOString().slice(0, 10);
      const monthPrefix = todayStr.slice(0, 7).replace('-', '');
      const productionNumber = `PRD-${monthPrefix}-${String(nextNum).padStart(4, '0')}`;

      const [prodId] = await trx('productions').insert({
        production_number: productionNumber,
        production_date: todayStr,
        raw_item_id: rawItemId,
        product_unit_id: productUnitId,
        quantity_produced: qty,
        base_quantity_used: baseQtyNeeded,
        labor_cost_per_unit: laborPerUnit,
        accessory_cost_per_unit: accPerUnit,
        raw_material_cost: totalRawCost,
        total_cost: totalCost,
        unit_cost: unitCost,
        tailor_name: tailorName ? tailorName.trim() : null,
        status: 'done',
        notes: notes ? notes.trim() : null,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });

      return {
        id: prodId,
        productionNumber,
        productionDate: todayStr,
        quantityProduced: qty,
        baseQuantityUsed: baseQtyNeeded,
        rawMaterialCost: totalRawCost,
        totalCost,
        unitCost,
        newAllocatedStock: newAllocated,
        sellingPrice: updateUnitData.selling_price || parseFloat(unit.selling_price)
      };
    });
  }
}

module.exports = ProductionService;
