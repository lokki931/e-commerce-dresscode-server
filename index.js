const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: 'http://localhost:3000', // Adjust the origin as per your needs
  }),
);
app.get('/api/v1', (req, res) => {
  res.json({
    hi: 'Hello Dear!',
    mainRoute: 'http://localhost:5544/api/v1',
    products: 'http://localhost:5544/api/v1/products',
    categories: 'http://localhost:5544/api/v1/categories',
    orders: 'http://localhost:5544/api/v1/orders',
    users: 'http://localhost:5544/api/v1/users',
  });
});

app.use('/static', express.static(path.join(__dirname, 'uploads')));

app.use('/api/v1/users', require('./routes/users'));

app.use('/api/v1/products', require('./routes/products'));

app.use('/api/v1/categories', require('./routes/categories'));

app.use('/api/v1/orders', require('./routes/orders'));

app.listen(5544, () => {
  console.log('Server is running on http://localhost:5544');
});
