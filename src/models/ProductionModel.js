const db = require('../config/database');

class ProductionModel {
  static async create(data, trx = null) {
    const query = trx ? trx('productions') : db('productions');
    const [id] = await query.insert({
      production_number: data.productionNumber,
      production_date: data.productionDate,
      raw_item_id: data.rawItemId,
      product_unit_id: data.productUnitId,
      quantity_produced: data.quantityProduced,
      base_quantity_used: data.baseQuantityUsed,
      labor_cost_per_unit: data.laborCostPerUnit || 0,
      accessory_cost_per_unit: data.accessoryCostPerUnit || 0,
      raw_material_cost: data.rawMaterialCost,
      total_cost: data.totalCost,
      unit_cost: data.unitCost,
      tailor_name: data.tailorName || null,
      status: data.status || 'done',
      notes: data.notes || null,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });
    return id;
  }

  static async findAll() {
    return db('productions')
      .join('items', 'productions.raw_item_id', 'items.id')
      .join('product_units', 'productions.product_unit_id', 'product_units.id')
      .select(
        'productions.*',
        'items.name as raw_item_name',
        'items.base_unit as raw_base_unit',
        'product_units.unit_name as variant_name',
        'product_units.conversion_factor',
        'product_units.selling_price'
      )
      .orderBy('productions.production_date', 'desc')
      .orderBy('productions.id', 'desc');
  }

  static async findById(id) {
    return db('productions')
      .join('items', 'productions.raw_item_id', 'items.id')
      .join('product_units', 'productions.product_unit_id', 'product_units.id')
      .select(
        'productions.*',
        'items.name as raw_item_name',
        'items.base_unit as raw_base_unit',
        'product_units.unit_name as variant_name',
        'product_units.conversion_factor',
        'product_units.selling_price'
      )
      .where('productions.id', id)
      .first();
  }
}

module.exports = ProductionModel;
