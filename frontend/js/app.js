class ECommerceApp {
    constructor() {
        this.apiBase = 'http://localhost:5000/api';
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.loadFeaturedProducts();
        this.setupEventListeners();
        this.updateCartCount();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (token && user) {
            this.currentUser = user;
            this.updateAuthUI();
        }
    }

    updateAuthUI() {
        const authLinks = document.getElementById('auth-links');
        const userLinks = document.getElementById('user-links');
        const userName = document.getElementById('user-name');

        if (this.currentUser) {
            if (authLinks) authLinks.style.display = 'none';
            if (userLinks) userLinks.style.display = 'flex';
            if (userName) userName.textContent = this.currentUser.name;
        } else {
            if (authLinks) authLinks.style.display = 'flex';
            if (userLinks) userLinks.style.display = 'none';
        }

        this.updateCartCount();
    }

    async handleLogin(e) {
        e.preventDefault();
        console.log('🔄 Login attempt...');
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const messageDiv = document.getElementById('login-message');
        const loginBtn = document.getElementById('login-btn');

        // Disable button and show loading
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing In...';
        this.showLoading(true);

        try {
            console.log('📤 Sending login request...');
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log('📥 Login response:', data);

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                this.currentUser = data.user;
                
                this.showMessage('✅ Login successful! Redirecting...', 'success', messageDiv);
                console.log('✅ Login successful, redirecting...');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                this.showMessage(`❌ ${data.error}`, 'error', messageDiv);
                console.error('❌ Login failed:', data.error);
            }
        } catch (error) {
            console.error('❌ Network error:', error);
            this.showMessage('❌ Network error. Please try again.', 'error', messageDiv);
        } finally {
            // Re-enable button
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
            this.showLoading(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        console.log('🔄 Registration attempt...');
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const messageDiv = document.getElementById('register-message');
        const registerBtn = document.getElementById('register-btn');

        // Basic validation
        if (password !== confirmPassword) {
            this.showMessage('❌ Passwords do not match', 'error', messageDiv);
            return;
        }

        if (password.length < 6) {
            this.showMessage('❌ Password must be at least 6 characters', 'error', messageDiv);
            return;
        }

        // Disable button and show loading
        registerBtn.disabled = true;
        registerBtn.textContent = 'Creating Account...';
        this.showLoading(true);

        try {
            console.log('📤 Sending registration request...');
            const response = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();
            console.log('📥 Register response:', data);

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                this.currentUser = data.user;
                
                this.showMessage('✅ Registration successful! Redirecting...', 'success', messageDiv);
                console.log('✅ Registration successful, redirecting...');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                this.showMessage(`❌ ${data.error}`, 'error', messageDiv);
                console.error('❌ Registration failed:', data.error);
            }
        } catch (error) {
            console.error('❌ Network error:', error);
            this.showMessage('❌ Network error. Please try again.', 'error', messageDiv);
        } finally {
            // Re-enable button
            registerBtn.disabled = false;
            registerBtn.textContent = 'Create Account';
            this.showLoading(false);
        }
    }

    handleLogout() {
        console.log('🚪 Logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('cart');
        this.currentUser = null;
        this.updateAuthUI();
        window.location.href = 'index.html';
    }

    async loadFeaturedProducts() {
        try {
            console.log('📦 Loading featured products...');
            const response = await fetch(`${this.apiBase}/products/featured`);
            const data = await response.json();
            console.log('📥 Featured products:', data);
            
            if (data.success && data.data) {
                this.displayProducts(data.data, 'featured-products');
            } else {
                console.error('❌ No featured products found');
            }
        } catch (error) {
            console.error('❌ Error loading featured products:', error);
        }
    }

    displayProducts(products, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('❌ Container not found:', containerId);
            return;
        }

        if (!products || products.length === 0) {
            container.innerHTML = '<p class="no-products">No products found.</p>';
            return;
        }

        console.log('🎨 Displaying products:', products.length);

        container.innerHTML = products.map(product => `
            <div class="product-card">
                <img src="${product.image}" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.src='https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500'">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <p class="product-category"><strong>Category:</strong> ${product.category}</p>
                <p class="product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                    <strong>Stock:</strong> ${product.stock} available
                </p>
                <p class="product-description">${product.description.substring(0, 100)}...</p>
                <button class="btn btn-primary" onclick="app.addToCart(${product.id})"
                        ${product.stock === 0 ? 'disabled' : ''}>
                    ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        `).join('');
    }

    async addToCart(productId) {
        if (!this.currentUser) {
            alert('Please login to add items to cart');
            window.location.href = 'login.html';
            return;
        }

        try {
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            const existingItem = cart.find(item => item.product == productId);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                const response = await fetch(`${this.apiBase}/products/${productId}`);
                const data = await response.json();
                
                if (data.success) {
                    cart.push({
                        product: productId,
                        name: data.data.name,
                        price: data.data.price,
                        image: data.data.image,
                        quantity: 1
                    });
                }
            }

            localStorage.setItem('cart', JSON.stringify(cart));
            this.updateCartCount();
            this.showToast('✅ Product added to cart!', 'success');
        } catch (error) {
            console.error('❌ Error adding to cart:', error);
            this.showToast('❌ Error adding product to cart', 'error');
        }
    }

    updateCartCount() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'flex' : 'none';
        }
    }

    showMessage(message, type, container) {
        if (container) {
            container.innerHTML = `
                <div class="message ${type}">
                    ${message}
                </div>
            `;
            container.style.display = 'block';
            
            // Auto-hide success messages after redirect
            if (type === 'success') {
                setTimeout(() => {
                    container.style.display = 'none';
                }, 3000);
            }
        }
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Add styles
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            font-weight: bold;
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new ECommerceApp();
});