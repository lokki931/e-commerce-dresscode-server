const express = require('express');
const router = express.Router();

const { register, login, getUsers, me } = require('../controllers/users');

const { authenticateToken } = require('../utils/verifyToken');

router.post('/register', register);
router.post('/signin', login);
router.get('/', authenticateToken, getUsers);
router.get('/me', authenticateToken, me);

module.exports = router;
