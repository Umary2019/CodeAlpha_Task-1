const http = require('http');
const url = require('url');
const querystring = require('querystring');

// Simple in-memory database
let products = [
  {
    id: 1,
    name: "Wireless Bluetooth Headphones",
    description: "High-quality wireless headphones with noise cancellation and 30-hour battery life",
    price: 99.99,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    stock: 50,
    featured: true
  },
  {
    id: 2,
    name: "Smartphone Pro Max",
    description: "Latest smartphone with advanced camera system, 5G connectivity",
    price: 699.99,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
    stock: 30,
    featured: true
  },
  {
    id: 3,
    name: "Casual T-Shirt",
    description: "Comfortable cotton t-shirt available in multiple colors",
    price: 19.99,
    category: "clothing",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
    stock: 100,
    featured: false
  },
  {
    id: 4,
    name: "Programming Book Bundle",
    description: "Complete guide to web development including HTML, CSS, JavaScript",
    price: 49.99,
    category: "books",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500",
    stock: 25,
    featured: true
  },
  {
    id: 5,
    name: "Coffee Maker",
    description: "Automatic coffee maker with programmable features",
    price: 79.99,
    category: "home",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500",
    stock: 15,
    featured: false
  },
  {
    id: 6,
    name: "Laptop Backpack",
    description: "Durable backpack with laptop compartment",
    price: 39.99,
    category: "accessories",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
    stock: 40,
    featured: true
  }
];

let users = [];
let orders = [];
let carts = {};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  console.log(`${method} ${path}`);

  // Home route
  if (path === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'E-commerce API is running!',
      endpoints: {
        products: '/api/products',
        featured: '/api/products/featured',
        register: '/api/auth/register',
        login: '/api/auth/login',
        profile: '/api/auth/me'
      }
    }));
    return;
  }

  // Get all products
  if (path === '/api/products' && method === 'GET') {
    const category = parsedUrl.query.category;
    let filteredProducts = products;
    
    if (category && category !== 'all') {
      filteredProducts = products.filter(p => p.category === category);
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: filteredProducts
    }));
    return;
  }

  // Get featured products
  if (path === '/api/products/featured' && method === 'GET') {
    const featured = products.filter(p => p.featured);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: featured
    }));
    return;
  }

  // Get single product
  if (path.startsWith('/api/products/') && method === 'GET') {
    const productId = parseInt(path.split('/').pop());
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Product not found' }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: product }));
    return;
  }

  // User registration
  if (path === '/api/auth/register' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { name, email, password } = JSON.parse(body);
        
        if (!name || !email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'All fields are required' }));
          return;
        }
        
        if (password.length < 6) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Password must be at least 6 characters' }));
          return;
        }
        
        const userExists = users.find(u => u.email === email);
        if (userExists) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User already exists' }));
          return;
        }
        
        const user = {
          id: users.length + 1,
          name,
          email,
          password: Buffer.from(password).toString('base64'),
          createdAt: new Date().toISOString()
        };
        
        users.push(user);
        carts[user.id] = [];
        
        const token = `token-${user.id}-${Date.now()}`;
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          user: { id: user.id, name: user.name, email: user.email },
          token: token
        }));
        
        console.log(`✅ New user registered: ${email}`);
      } catch (error) {
        console.error('Registration error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON format' }));
      }
    });
    return;
  }

  // User login
  if (path === '/api/auth/login' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        
        if (!email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Email and password are required' }));
          return;
        }
        
        const user = users.find(u => u.email === email && u.password === Buffer.from(password).toString('base64'));
        
        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid email or password' }));
          return;
        }
        
        const token = `token-${user.id}-${Date.now()}`;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          user: { id: user.id, name: user.name, email: user.email },
          token: token
        }));
        
        console.log(`✅ User logged in: ${email}`);
      } catch (error) {
        console.error('Login error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON format' }));
      }
    });
    return;
  }

  // Get user profile (for auth check)
  if (path === '/api/auth/me' && method === 'GET') {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'No token provided' }));
      return;
    }
    
    const token = authHeader.split(' ')[1];
    const userId = token ? parseInt(token.split('-')[1]) : null;
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Invalid token' }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      user: { id: user.id, name: user.name, email: user.email }
    }));
    return;
  }

  // Update user cart
  if (path === '/api/auth/cart' && method === 'PUT') {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'No token provided' }));
      return;
    }
    
    const token = authHeader.split(' ')[1];
    const userId = token ? parseInt(token.split('-')[1]) : null;
    
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { cart } = JSON.parse(body);
        carts[userId] = cart || [];
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          user: { id: userId, cart: carts[userId] }
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Create order
  if (path === '/api/orders' && method === 'POST') {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'No token provided' }));
      return;
    }
    
    const token = authHeader.split(' ')[1];
    const userId = token ? parseInt(token.split('-')[1]) : null;
    
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { items, shippingAddress } = JSON.parse(body);
        
        if (!items || !Array.isArray(items) || items.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'No items in order' }));
          return;
        }
        
        if (!shippingAddress || !shippingAddress.name || !shippingAddress.address) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Shipping address is required' }));
          return;
        }
        
        // Calculate total and validate products
        let totalAmount = 0;
        const orderItems = [];
        
        for (const item of items) {
          const product = products.find(p => p.id == item.product);
          if (!product) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: `Product not found: ${item.product}` }));
            return;
          }
          
          if (product.stock < item.quantity) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: `Insufficient stock for ${product.name}` }));
            return;
          }
          
          totalAmount += product.price * item.quantity;
          orderItems.push({
            product: product.id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            image: product.image
          });
          
          // Update product stock
          product.stock -= item.quantity;
        }
        
        const order = {
          id: orders.length + 1,
          userId,
          items: orderItems,
          shippingAddress,
          totalAmount,
          status: 'processing',
          paymentStatus: 'completed',
          orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          createdAt: new Date().toISOString()
        };
        
        orders.push(order);
        
        // Clear user's cart after successful order
        carts[userId] = [];
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: order
        }));
        
        console.log(`✅ New order created: ${order.orderNumber}`);
      } catch (error) {
        console.error('Order creation error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON format' }));
      }
    });
    return;
  }

  // Get user orders
  if (path === '/api/orders/my-orders' && method === 'GET') {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'No token provided' }));
      return;
    }
    
    const token = authHeader.split(' ')[1];
    const userId = token ? parseInt(token.split('-')[1]) : null;
    const userOrders = orders.filter(o => o.userId === userId);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: userOrders
    }));
    return;
  }

  // Get single order
  if (path.startsWith('/api/orders/') && method === 'GET') {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'No token provided' }));
      return;
    }
    
    const token = authHeader.split(' ')[1];
    const userId = token ? parseInt(token.split('-')[1]) : null;
    const orderId = parseInt(path.split('/').pop());
    const order = orders.find(o => o.id === orderId && o.userId === userId);
    
    if (!order) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Order not found' }));
      return;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: order
    }));
    return;
  }

  // 404 handler
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: 'Route not found' }));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 E-commerce Server running on http://localhost:${PORT}`);
  console.log(`📦 ${products.length} products loaded`);
  console.log(`👤 ${users.length} users registered`);
  console.log(`📋 ${orders.length} orders created`);
  console.log('\n📚 Available Endpoints:');
  console.log('   GET  /api/products');
  console.log('   GET  /api/products/featured');
  console.log('   GET  /api/products/1');
  console.log('   POST /api/auth/register');
  console.log('   POST /api/auth/login');
  console.log('   GET  /api/auth/me');
  console.log('   PUT  /api/auth/cart');
  console.log('   POST /api/orders');
  console.log('   GET  /api/orders/my-orders');
  console.log('   GET  /api/orders/1');
  console.log('\n🔧 Debug: Open http://localhost:5000 in browser to test API');
});