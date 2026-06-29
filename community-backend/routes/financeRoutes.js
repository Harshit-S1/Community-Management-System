const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, financeController.generateMonthlyDues);
router.get('/report', protect, financeController.getFinancialReport);
router.get('/my-dues', protect, financeController.getMyDues);
router.get('/dues-status', protect, financeController.getMonthlyDuesStatus);
router.post('/pay/verify', protect, financeController.verifyPayment);
router.get('/payment-settings',protect,financeController.getPaymentSettings);
router.put('/payment-settings',protect,financeController.updatePaymentSetting);
router.post('/pay/order/:dueId', protect, financeController.createOrder);

module.exports = router;