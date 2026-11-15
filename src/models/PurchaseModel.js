const db = require('../config/database');

class PurchaseModel {
  static async create({ supplierId, userId, purchaseDate, totalCost, notes, paymentTerm = 'cash', dueDate = null, paymentStatus = 'paid', amountPaid = 0 }, trx = null) {
    const query = trx ? trx('purchases') : db('purchases');
    const [id] = await query.insert({
      supplier_id: supplierId,
      user_id: userId,
      purchase_date: purchaseDate,
      total_cost: totalCost,
      notes,
      payment_term: paymentTerm,
      due_date: dueDate || purchaseDate,
      payment_status: paymentStatus,
      amount_paid: amountPaid
    });
    return id;
  }

  static async findAll() {
    return db('purchases')
      .join('suppliers', 'purchases.supplier_id', 'suppliers.id')
      .join('users', 'purchases.user_id', 'users.id')
      .select(
        'purchases.*',
        'suppliers.name as supplier_name',
        'users.name as created_by'
      )
      .orderBy('purchases.purchase_date', 'desc')
      .orderBy('purchases.id', 'desc');
  }

  static async findById(id) {
    return db('purchases')
      .join('suppliers', 'purchases.supplier_id', 'suppliers.id')
      .select('purchases.*', 'suppliers.name as supplier_name')
      .where('purchases.id', id)
      .first();
  }

  /**
   * Record a payment against an unpaid or partially paid purchase invoice
   */
  static async recordPayment({ purchaseId, userId, paymentDate, amount, paymentMethod = 'BANK', notes }) {
    return db.transaction(async (trx) => {
      const purchase = await trx('purchases').where({ id: purchaseId }).first();
      if (!purchase) throw new Error('Nota pembelian tidak ditemukan.');

      const payAmount = parseFloat(amount);
      if (!payAmount || payAmount <= 0) throw new Error('Nominal pembayaran harus lebih dari 0.');

      const currentPaid = parseFloat(purchase.amount_paid) || 0;
      const totalCost = parseFloat(purchase.total_cost);
      const remaining = totalCost - currentPaid;

      if (payAmount > remaining) {
        throw new Error(`Nominal pembayaran melebihi sisa hutang! Sisa hutang: Rp ${remaining.toLocaleString('id-ID')}`);
      }

      const newPaid = currentPaid + payAmount;
      const newStatus = newPaid >= totalCost ? 'paid' : 'partially_paid';

      // Record payment ledger entry
      const [paymentId] = await trx('purchase_payments').insert({
        purchase_id: purchaseId,
        user_id: userId || null,
        payment_date: paymentDate || new Date().toISOString().slice(0, 10),
        amount: payAmount,
        payment_method: paymentMethod,
        notes: notes ? notes.trim() : null
      });

      // Update purchase debt status
      await trx('purchases').where({ id: purchaseId }).update({
        amount_paid: newPaid,
        payment_status: newStatus
      });

      return {
        paymentId,
        purchaseId,
        amount: payAmount,
        totalPaid: newPaid,
        remainingBalance: totalCost - newPaid,
        paymentStatus: newStatus
      };
    });
  }

  /**
   * Get all installment payments for a specific purchase
   */
  static async getPayments(purchaseId) {
    return db('purchase_payments')
      .leftJoin('users', 'purchase_payments.user_id', 'users.id')
      .select(
        'purchase_payments.*',
        'users.name as created_by'
      )
      .where('purchase_payments.purchase_id', purchaseId)
      .orderBy('purchase_payments.payment_date', 'asc')
      .orderBy('purchase_payments.id', 'asc');
  }
}

module.exports = PurchaseModel;
