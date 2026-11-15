/**
 * Migration 006: Add transaction_payments table for Split Multi-Payment & Multi-Journal Tracking
 */
exports.up = async function (knex) {
  // 1. Add is_split column to transactions
  await knex.schema.table('transactions', (table) => {
    table.boolean('is_split').defaultTo(false);
  });

  // 2. Create transaction_payments table
  await knex.schema.createTable('transaction_payments', (table) => {
    table.increments('id').primary();
    table.integer('transaction_id').unsigned().notNullable()
      .references('id').inTable('transactions').onDelete('CASCADE');
    table.string('payment_method').notNullable(); // CASH, TRANSFER, QRIS
    table.string('journal_code').notNullable();  // CSH1, BNK1, QRIS1
    table.decimal('amount', 15, 2).notNullable(); // Net portion paid
    table.decimal('tendered_amount', 15, 2).defaultTo(0); // Tendered amount (for cash)
    table.decimal('change_amount', 15, 2).defaultTo(0);   // Change (for cash)
    table.string('reference'); // Reference / Trace ID / Bank account
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('transaction_id');
    table.index('payment_method');
    table.index('journal_code');
  });

  // Populate transaction_payments for existing transactions
  const existingTxs = await knex('transactions').select('id', 'payment_method', 'total_amount', 'amount_paid', 'change_amount', 'created_at');
  for (const tx of existingTxs) {
    const method = tx.payment_method || 'CASH';
    const journal = method === 'QRIS' ? 'QRIS1' : (method === 'TRANSFER' ? 'BNK1' : 'CSH1');
    await knex('transaction_payments').insert({
      transaction_id: tx.id,
      payment_method: method,
      journal_code: journal,
      amount: tx.total_amount,
      tendered_amount: tx.amount_paid || tx.total_amount,
      change_amount: tx.change_amount || 0,
      created_at: tx.created_at || knex.fn.now()
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('transaction_payments');
  await knex.schema.table('transactions', (table) => {
    table.dropColumn('is_split');
  });
};
