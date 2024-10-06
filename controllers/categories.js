const prisma = require('../utils/prismaClient');

const createCategory = async (req, res) => {
  const { name } = req.body;

  try {
    // Validate input
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (name.length < 3) {
      return res.status(400).json({ error: 'Name must be at least 3 characters long' });
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name,
      },
    });

    res.status(201).json({ category });
  } catch (error) {
    console.error(error);

    if (error.code === 'P2002') {
      // Prisma unique constraint violation
      return res.status(409).json({ error: 'Category name already exists' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name },
    });

    res.status(200).json({ category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).json({ message: 'Category deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCategoryById = async (req, res) => {
  const catId = parseInt(req.params.id);
  try {
    const category = await prisma.category.findUnique({
      where: { id: catId },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(200).json({ category });
  } catch (error) {
    console.error('Error get category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllCategories = async (req, res) => {
  try {
    // Fetch all categories with their associated categories and images
    const categories = await prisma.category.findMany();

    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
  getAllCategories,
};
