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

const getAllUsersOrders = async (req, res) => {
  const { userId } = req.body;
  try {
    const orders = await prisma.order.findMany({
      where: { userId: parseInt(userId) },
      include: { products: { include: { product: true } } }, // includes product info
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
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
  deleteOrder,
  getOrderById,
  getAllUsersOrders,
  getAllOrders,
};
