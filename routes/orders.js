const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/verifyToken');
const {
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderById,
  getAllOrders,
} = require('../controllers/orders');

router.post('/', authenticateToken, createOrder);
router.put('/:id', authenticateToken, updateOrder);
router.delete('/:id', authenticateToken, deleteOrder);
router.get('/:id', getOrderById);
router.get('/', getAllOrders);

module.exports = router;
