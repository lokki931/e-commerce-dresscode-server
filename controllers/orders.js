const prisma = require('../utils/prismaClient');

const createOrder = async (req, res) => {
  const { userId, products, total } = req.body;

  try {
    const order = await prisma.order.create({
      data: {
        userId,
        total,
        products: {
          create: products.map((product) => ({
            productId: product.productId,
            quantity: product.quantity,
          })),
        },
      },
      include: {
        products: true,
      },
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order with products' });
  }
};

const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { total, products } = req.body;

  try {
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        total,
        products: {
          deleteMany: {}, // Deletes all old products for this order
          create: products.map((product) => ({
            productId: product.productId,
            quantity: product.quantity,
          })),
        },
      },
      include: { products: true },
    });
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order and products' });
  }
};

const deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedOrder = await prisma.order.delete({
      where: { id: parseInt(id) },
      include: { products: true },
    });
    res.json(deletedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order and products' });
  }
};

const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { products: { include: { product: true } } },
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { products: { include: { product: true } } }, // includes product info
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

module.exports = {
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderById,
  getAllOrders,
};
