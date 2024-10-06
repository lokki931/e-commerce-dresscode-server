const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../utils/verifyToken');
const {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
  getAllCategories,
} = require('../controllers/categories');

router.post('/', authenticateToken, createCategory);
router.put('/:id', authenticateToken, updateCategory);
router.delete('/:id', authenticateToken, deleteCategory);
router.get('/:id', getCategoryById);
router.get('/', getAllCategories);

module.exports = router;
