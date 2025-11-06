const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const sampleProducts = [
  {
    name: "Wireless Bluetooth Headphones",
    description: "High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.",
    price: 99.99,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    stock: 50,
    featured: true
  },
  {
    name: "Smartphone Pro Max",
    description: "Latest smartphone with advanced camera system, 5G connectivity, and powerful processor.",
    price: 699.99,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
    stock: 30,
    featured: true
  },
  {
    name: "Casual T-Shirt",
    description: "Comfortable cotton t-shirt available in multiple colors. Perfect for everyday wear.",
    price: 19.99,
    category: "clothing",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
    stock: 100,
    featured: false
  },
  {
    name: "Programming Book Bundle",
    description: "Complete guide to web development including HTML, CSS, JavaScript, and Node.js.",
    price: 49.99,
    category: "books",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500",
    stock: 25,
    featured: true
  },
  {
    name: "Coffee Maker",
    description: "Automatic coffee maker with programmable features and thermal carafe.",
    price: 79.99,
    category: "home",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500",
    stock: 15,
    featured: false
  },
  {
    name: "Laptop Backpack",
    description: "Durable backpack with laptop compartment and multiple pockets for organization.",
    price: 39.99,
    category: "accessories",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
    stock: 40,
    featured: true
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('Connected to database');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    await Product.insertMany(sampleProducts);
    console.log('Sample products inserted successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();