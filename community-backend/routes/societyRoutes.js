const express = require('express');
const { deleteSociety } = require('../controllers/societyController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const router = express.Router();

router.delete('/', protect, adminOnly, deleteSociety);
module.exports = router;