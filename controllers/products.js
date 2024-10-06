const prisma = require('../utils/prismaClient');
const fs = require('fs');
const path = require('path');

const createProduct = async (req, res) => {
  const { name, description, price, stock, categories, discount, hit } = req.body;
  const imageFiles = req.files;

  try {
    // Validate input
    if (!name || !description || !price || !stock || !categories || !imageFiles) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert categories from comma-separated string to array
    const categoryArray = categories.split(',').map((id) => parseInt(id.trim()));

    // Ensure categories is a non-empty array
    if (!Array.isArray(categoryArray) || categoryArray.length === 0) {
      return res.status(400).json({ error: 'Categories must be a non-empty array' });
    }

    console.log(categoryArray); // Log the parsed category IDs

    // Check if categories exist
    const existingCategories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryArray,
        },
      },
    });

    if (existingCategories.length !== categoryArray.length) {
      return res.status(400).json({ error: 'Some categories do not exist.' });
    }

    // Additional validation
    if (isNaN(price) || isNaN(stock) || price <= 0 || stock < 0) {
      return res
        .status(400)
        .json({ error: 'Price must be a positive number and stock cannot be negative' });
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        discount: discount === 'true' || discount === true,
        hit: hit === 'true' || hit === true,
        categories: {
          connect: categoryArray.map((id) => ({ id })),
        },
      },
    });

    // Create images
    const images = await Promise.all(
      imageFiles.map((file) =>
        prisma.image.create({
          data: {
            url: `/uploads/${file.filename}`,
            productId: product.id,
          },
        }),
      ),
    );

    res.status(201).json({ product, images });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params; // Assuming the product ID comes from the URL params
  const { name, description, price, stock, categories, discount, hit } = req.body;
  const imageFiles = req.files;

  try {
    // Check if the product exists
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Validate input (optional fields like name, description, etc. should only be validated if provided)
    if (price && (isNaN(price) || price <= 0)) {
      return res.status(400).json({ error: 'Price must be a positive number' });
    }

    if (stock && (isNaN(stock) || stock < 0)) {
      return res.status(400).json({ error: 'Stock cannot be negative' });
    }

    // Update categories if provided
    let categoryArray;
    if (categories) {
      categoryArray = categories.split(',').map((id) => parseInt(id.trim()));
      if (!Array.isArray(categoryArray) || categoryArray.length === 0) {
        return res.status(400).json({ error: 'Categories must be a non-empty array' });
      }

      // Check if categories exist
      const existingCategories = await prisma.category.findMany({
        where: {
          id: {
            in: categoryArray,
          },
        },
      });

      if (existingCategories.length !== categoryArray.length) {
        return res.status(400).json({ error: 'Some categories do not exist.' });
      }
    }

    // Update product data
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name: name || product.name, // Keep original value if not provided
        description: description || product.description, // Keep original value if not provided
        price: price ? parseFloat(price) : product.price, // Update only if price is provided
        stock: stock ? parseInt(stock) : product.stock, // Update only if stock is provided
        discount:
          discount !== undefined ? discount === 'true' || discount === true : product.discount, // Update if provided
        hit: hit !== undefined ? hit === 'true' || hit === true : product.hit, // Update if provided
        ...(categories && {
          categories: {
            set: categoryArray.map((id) => ({ id })), // Reset and connect new categories
          },
        }),
      },
    });

    // Update images if provided
    let images;
    if (imageFiles && imageFiles.length > 0) {
      // Optionally, you can delete old images before adding new ones
      await prisma.image.deleteMany({
        where: {
          productId: updatedProduct.id,
        },
      });

      // Create new images
      images = await Promise.all(
        imageFiles.map((file) =>
          prisma.image.create({
            data: {
              url: `/uploads/${file.filename}`,
              productId: updatedProduct.id,
            },
          }),
        ),
      );
    }

    res.status(200).json({ product: updatedProduct, images });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteProduct = async (req, res) => {
  const productId = parseInt(req.params.id);

  try {
    // Find images associated with the product
    const images = await prisma.image.findMany({
      where: { productId },
    });

    // Delete images from disk
    images.forEach((image) => {
      const filePath = path.join(__dirname, 'uploads', image.url.split('/uploads/')[1]);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Failed to delete image file: ${filePath}`, err);
        }
      });
    });

    // Delete images from database
    await prisma.image.deleteMany({
      where: { productId },
    });

    // Delete product from database
    await prisma.product.delete({
      where: { id: productId },
    });

    res.status(200).json({ message: 'Product and associated images deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProductById = async (req, res) => {
  const productId = parseInt(req.params.id);
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        categories: true, // Include associated categories
        images: true, // Include associated images
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json({ product });
  } catch (error) {
    console.error('Error get product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllProducts = async (req, res) => {
  try {
    // Fetch all products with their associated categories and images
    const products = await prisma.product.findMany({
      include: {
        categories: true, // Include associated categories
        images: true, // Include associated images
      },
    });

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getAllProducts,
};
