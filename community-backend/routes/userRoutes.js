const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, userController.getAllUsers);
router.post('/', protect, userController.createUser);
router.get('/me', protect, userController.getMyProfile);
router.put('/me', protect, userController.updateMyProfile);
router.put('/me/password', protect, userController.changePassword);
router.get('/guards', protect, userController.getGuards);
router.get('/directory', protect, userController.getResidentDirectory);
router.put('/:id', protect, userController.updateUser);
router.delete('/:id', protect, userController.deleteUser);

module.exports = router;