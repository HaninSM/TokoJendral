/**
 * Migration 004: Create productions table for Make-to-Stock / SPK Jahit Konveksi & Composite HPP
 */
exports.up = async function (knex) {
  await knex.schema.createTable('productions', (table) => {
    table.increments('id').primary();
    table.string('production_number').notNullable().unique(); // e.g. "PRD-202611-0001"
    table.date('production_date').notNullable();
    table.integer('raw_item_id').unsigned().notNullable()
      .references('id').inTable('items').onDelete('RESTRICT');
    table.integer('product_unit_id').unsigned().notNullable()
      .references('id').inTable('product_units').onDelete('RESTRICT');
    table.decimal('quantity_produced', 15, 4).notNullable();
    table.decimal('base_quantity_used', 15, 4).notNullable();
    table.decimal('labor_cost_per_unit', 15, 2).defaultTo(0);
    table.decimal('accessory_cost_per_unit', 15, 2).defaultTo(0);
    table.decimal('raw_material_cost', 15, 2).notNullable();
    table.decimal('total_cost', 15, 2).notNullable();
    table.decimal('unit_cost', 15, 2).notNullable(); // HPP Komposit
    table.string('tailor_name'); // Nama Mitra Penjahit
    table.enu('status', ['draft', 'done', 'cancelled']).defaultTo('draft');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('production_date');
    table.index('raw_item_id');
    table.index('product_unit_id');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('productions');
};
