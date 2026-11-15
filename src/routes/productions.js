const express = require('express');
const router = express.Router();
const ProductionController = require('../controllers/ProductionController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { handleValidationErrors } = require('../middleware/validate');

router.use(authenticate, authorize('owner'));

router.get('/', ProductionController.list);
router.get('/:id', ProductionController.getById);
router.post('/estimate', ProductionController.createValidation, handleValidationErrors, ProductionController.estimate);
router.post('/', ProductionController.createValidation, handleValidationErrors, ProductionController.create);

module.exports = router;
