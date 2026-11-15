/**
 * Migration 005: Add Payment Terms (Net 30 Days) and Aged Payables Tracking
 */
exports.up = async function (knex) {
  // 1. Add payment term and debt status columns to purchases table
  await knex.schema.table('purchases', (table) => {
    table.string('payment_term').defaultTo('cash'); // 'cash', 'net_15', 'net_30', 'net_60', 'custom'
    table.date('due_date');
    table.string('payment_status').defaultTo('paid'); // 'paid', 'not_paid', 'partially_paid'
    table.decimal('amount_paid', 15, 2).defaultTo(0);

    table.index('due_date');
    table.index('payment_status');
  });

  // Set existing purchase rows to paid
  await knex('purchases').update({
    payment_status: 'paid',
    payment_term: 'cash'
  });
  await knex.raw('UPDATE purchases SET amount_paid = total_cost WHERE amount_paid = 0');
  await knex.raw('UPDATE purchases SET due_date = purchase_date WHERE due_date IS NULL');

  // 2. Create purchase_payments table for supplier debt installment tracking
  await knex.schema.createTable('purchase_payments', (table) => {
    table.increments('id').primary();
    table.integer('purchase_id').unsigned().notNullable()
      .references('id').inTable('purchases').onDelete('CASCADE');
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.date('payment_date').notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.string('payment_method').defaultTo('BANK'); // 'CASH', 'BANK'
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('purchase_id');
    table.index('payment_date');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('purchase_payments');
  await knex.schema.table('purchases', (table) => {
    table.dropIndex('payment_status');
    table.dropIndex('due_date');
    table.dropColumn('amount_paid');
    table.dropColumn('payment_status');
    table.dropColumn('due_date');
    table.dropColumn('payment_term');
  });
};
