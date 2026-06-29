const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const { protect } = require('../middleware/authMiddleware');

router.get('/all', protect, visitorController.getAllVisitors);
router.post('/entry', protect, visitorController.logEntry);
router.get('/active', protect, visitorController.getActiveVisitors);
router.get('/my-history', protect, visitorController.getResidentVisitorHistory);
router.put('/exit/:id', protect, visitorController.logExit);

module.exports = router;