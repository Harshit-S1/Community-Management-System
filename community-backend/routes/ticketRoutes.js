const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, ticketController.createTicket);
router.get('/', protect, ticketController.getAllTickets);
router.post('/:id/comments', protect, ticketController.addComment);
router.post('/:id/agree', protect, ticketController.agreeTicket);
router.put('/:id/resolve', protect, ticketController.resolveTicket);

module.exports = router;