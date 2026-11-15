const { body } = require('express-validator');
const ProductionService = require('../services/ProductionService');
const ProductionModel = require('../models/ProductionModel');

const ProductionController = {
  createValidation: [
    body('rawItemId').isInt({ min: 1 }).withMessage('Bahan baku mentah (rawItemId) wajib diisi.'),
    body('productUnitId').isInt({ min: 1 }).withMessage('Varian hasil produksi (productUnitId) wajib diisi.'),
    body('quantityProduced').isFloat({ gt: 0 }).withMessage('Jumlah produksi harus lebih dari 0.'),
    body('laborCostPerUnit').optional().isFloat({ min: 0 }).withMessage('Upah jahit tidak boleh negatif.'),
    body('accessoryCostPerUnit').optional().isFloat({ min: 0 }).withMessage('Biaya aksesoris tidak boleh negatif.')
  ],

  async estimate(req, res, next) {
    try {
      const result = await ProductionService.calculateEstimate({
        rawItemId: parseInt(req.body.rawItemId, 10),
        productUnitId: parseInt(req.body.productUnitId, 10),
        quantityProduced: parseFloat(req.body.quantityProduced),
        laborCostPerUnit: parseFloat(req.body.laborCostPerUnit || 0),
        accessoryCostPerUnit: parseFloat(req.body.accessoryCostPerUnit || 0)
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const result = await ProductionService.executeProduction({
        rawItemId: parseInt(req.body.rawItemId, 10),
        productUnitId: parseInt(req.body.productUnitId, 10),
        quantityProduced: parseFloat(req.body.quantityProduced),
        laborCostPerUnit: parseFloat(req.body.laborCostPerUnit || 0),
        accessoryCostPerUnit: parseFloat(req.body.accessoryCostPerUnit || 0),
        tailorName: req.body.tailorName,
        notes: req.body.notes
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async list(req, res, next) {
    try {
      const productions = await ProductionModel.findAll();
      res.json({ success: true, data: productions });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const production = await ProductionModel.findById(req.params.id);
      if (!production) {
        return res.status(404).json({ success: false, message: 'Data produksi tidak ditemukan.' });
      }
      res.json({ success: true, data: production });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = ProductionController;
