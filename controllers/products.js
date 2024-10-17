const prisma = require('../utils/prismaClient');
const fs = require('fs');
const path = require('path');
const createProduct = async (req, res) => {
  const { name, description, price, stock, categories, discount, hit } = req.body;
  const imageFiles = req.files;

  try {
    // Validate input fields
    if (
      !name ||
      !description ||
      !price ||
      !stock ||
      !categories ||
      !imageFiles ||
      imageFiles.length === 0
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure categories is an array
    const categoryArray = Array.isArray(categories) ? categories : [categories];

    // Validate that categories exist in the database
    const existingCategories = await prisma.category.findMany({
      where: {
        id: { in: categoryArray.map((id) => parseInt(id, 10)) },
      },
    });

    if (existingCategories.length !== categoryArray.length) {
      return res.status(400).json({ error: 'Some categories do not exist.' });
    }

    // Create the product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        discount: discount === 'true' || discount === true,
        hit: hit === 'true' || hit === true,
        categories: {
          connect: categoryArray.map((id) => ({ id: parseInt(id, 10) })),
        },
      },
    });

    // Create associated image records
    const images = await Promise.all(
      imageFiles.map((file) => {
        const fileExists = fs.existsSync(file.path);
        if (!fileExists) {
          throw new Error(`File ${file.originalname} does not exist.`);
        }

        return prisma.image.create({
          data: {
            url: `http://localhost:5544/static/${file.filename}`,
            productId: product.id,
          },
        });
      }),
    );

    // Respond with the created product and images
    res.status(201).json({ product, images });
  } catch (error) {
    console.error('Error creating product:', error.message);
    console.error(error.stack); // Log the stack trace for more context
    res.status(500).json({ error: 'Internal server error' });
  }
};
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, categories, discount, hit } = req.body;
  const imageFiles = req.files;

  try {
    // Validate ID
    const productId = parseInt(id);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // Check if the product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Validate price if provided
    if (price !== undefined && (isNaN(price) || price <= 0)) {
      return res.status(400).json({ error: 'Price must be a positive number' });
    }

    // Validate stock if provided
    if (stock !== undefined && (isNaN(stock) || stock < 0)) {
      return res.status(400).json({ error: 'Stock cannot be negative' });
    }

    // Update categories if provided
    let categoryArray;
    if (categories) {
      // Check if categories is an array
      if (Array.isArray(categories)) {
        categoryArray = categories.map((id) => parseInt(id)); // Map directly if it's an array
      } else if (typeof categories === 'string') {
        categoryArray = categories.split(',').map((id) => parseInt(id.trim())); // Split if it's a string
      } else {
        return res
          .status(400)
          .json({ error: 'Categories must be a non-empty array or a comma-separated string' });
      }

      if (categoryArray.length === 0) {
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

    // Fetch old images before updating
    const oldImages = await prisma.image.findMany({
      where: {
        productId: productId,
      },
    });

    // Update product data
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name: name || product.name,
        description: description || product.description,
        price: price !== undefined ? parseFloat(price) : product.price,
        stock: stock !== undefined ? parseInt(stock) : product.stock,
        discount:
          discount !== undefined ? discount === 'true' || discount === true : product.discount,
        hit: hit !== undefined ? hit === 'true' || hit === true : product.hit,
        ...(categories && {
          categories: {
            set: categoryArray.map((id) => ({ id })),
          },
        }),
      },
    });

    // Update images if provided
    let images;
    if (imageFiles && imageFiles.length > 0) {
      // Delete old image records
      await prisma.image.deleteMany({
        where: {
          productId: updatedProduct.id,
        },
      });

      // Delete old image files from the uploads folder
      oldImages.forEach((image) => {
        const imagePath = path.join(
          __dirname,
          '../uploads',
          image.url.split('http://localhost:5544/static/')[1],
        );
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error(`Failed to delete image: ${image.url}`, err);
          }
        });
      });

      // Create new images
      images = await Promise.all(
        imageFiles.map((file) =>
          prisma.image.create({
            data: {
              url: `http://localhost:5544/static/${file.filename}`,
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

    if (images.length === 0) {
      return res.status(404).json({ error: 'No images found for this product' });
    }

    // Create an array of promises for deleting images from disk
    const deleteImagePromises = images.map(async (image) => {
      const filename = image.url.split('http://localhost:5544/static/')[1];

      if (!filename) {
        console.error(`Failed to extract filename from URL: ${image.url}`);
        return Promise.resolve(); // Skip to avoid errors
      }

      const filePath = path.join(__dirname, '../uploads', filename);
      console.log(`Attempting to delete file at: ${filePath}`);

      // Check if file exists before attempting to delete it
      if (fs.existsSync(filePath)) {
        return new Promise((resolve) => {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Failed to delete image file: ${filePath}`, err.message);
            } else {
              console.log(`Successfully deleted file: ${filePath}`);
            }
            resolve(); // Resolve regardless of success or failure
          });
        });
      } else {
        console.error(`File does not exist: ${filePath}`);
        return Promise.resolve(); // Resolve to continue the process
      }
    });

    // Wait for all file deletions to complete
    await Promise.all(deleteImagePromises);

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
    console.error('Error deleting product:', error);
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
