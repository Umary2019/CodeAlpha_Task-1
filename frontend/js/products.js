class ProductsManager {
    constructor() {
        this.apiBase = 'http://localhost:5000/api';
        this.currentPage = 1;
        this.currentCategory = 'all';
        this.currentSort = 'createdAt';
        this.currentSearch = '';
        this.totalPages = 1;
        this.init();
    }

    init() {
        this.loadProducts();
        this.setupEventListeners();
        this.updateCartCount();
    }

    setupEventListeners() {
        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.currentPage = 1;
                this.loadProducts();
            });
        }

        // Sort filter
        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.currentPage = 1;
                this.loadProducts();
            });
        }

        // Search
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        
        if (searchInput && searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.currentSearch = searchInput.value;
                this.currentPage = 1;
                this.loadProducts();
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.currentSearch = searchInput.value;
                    this.currentPage = 1;
                    this.loadProducts();
                }
            });
        }
    }

    async loadProducts() {
        console.log('Loading products...');
        this.showLoading(true);

        try {
            let url = `${this.apiBase}/products`;
            
            // Add category filter if not 'all'
            if (this.currentCategory && this.currentCategory !== 'all') {
                url += `?category=${this.currentCategory}`;
            }

            console.log('Fetching from:', url);
            const response = await fetch(url);
            const data = await response.json();
            console.log('Products response:', data);
            
            if (data.success) {
                this.displayProducts(data.data);
            } else {
                console.error('No products found:', data.error);
                this.showNoProducts();
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showNoProducts();
        } finally {
            this.showLoading(false);
        }
    }

    displayProducts(products) {
        const container = document.getElementById('products-container');
        const noProducts = document.getElementById('no-products');

        if (!container) {
            console.error('Products container not found');
            return;
        }

        if (!products || products.length === 0) {
            console.log('No products to display');
            container.style.display = 'none';
            if (noProducts) noProducts.style.display = 'block';
            return;
        }

        console.log('Displaying products:', products.length);
        container.style.display = 'grid';
        if (noProducts) noProducts.style.display = 'none';

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
                <p class="product-description">${product.description}</p>
                <button class="btn btn-primary" onclick="productsManager.addToCart('${product.id}')"
                        ${product.stock === 0 ? 'disabled' : ''}>
                    ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        `).join('');
    }

    async addToCart(productId) {
        if (!this.isAuthenticated()) {
            alert('Please login to add items to cart');
            window.location.href = 'login.html';
            return;
        }

        try {
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            const existingItem = cart.find(item => item.product === productId);

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
            this.showToast('Product added to cart!', 'success');
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showToast('Error adding product to cart', 'error');
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

    isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'flex' : 'none';
        }
    }

    showNoProducts() {
        const container = document.getElementById('products-container');
        const noProducts = document.getElementById('no-products');
        
        if (container) container.style.display = 'none';
        if (noProducts) noProducts.style.display = 'block';
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
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
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize products manager
const productsManager = new ProductsManager();