const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/verifyToken');
const {
  createOrder,
  deleteOrder,
  getOrderById,
  getAllOrders,
  getAllUsersOrders,
} = require('../controllers/orders');

router.post('/', authenticateToken, createOrder);
router.delete('/:id', authenticateToken, deleteOrder);
router.get('/:id', authenticateToken, getOrderById);
router.get('/users/:userId', authenticateToken, getAllUsersOrders);
router.get('/', authenticateToken, getAllOrders);

module.exports = router;
