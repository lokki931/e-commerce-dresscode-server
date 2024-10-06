const express = require('express');
const router = express.Router();

const {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getAllProducts,
} = require('../controllers/products');
const { authenticateToken } = require('../utils/verifyToken');
const upload = require('../utils/multer');

router.post('/', authenticateToken, upload, createProduct);
router.put('/:id', authenticateToken, upload, updateProduct);
router.delete('/:id', authenticateToken, deleteProduct);
router.get('/:id', getProductById);
router.get('/', getAllProducts);

module.exports = router;
