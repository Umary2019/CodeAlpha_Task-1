class CartManager {
    constructor() {
        this.apiBase = 'http://localhost:5000/api';
        this.cart = [];
        this.init();
    }

    init() {
        this.loadCart();
        this.setupEventListeners();
        this.updateCartCount();
    }

    setupEventListeners() {
        // Checkout button
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.showCheckoutModal());
        }

        // Checkout form
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => this.handleCheckout(e));
        }

        // Modal close
        const closeModal = document.querySelector('.close');
        const cancelCheckout = document.getElementById('cancel-checkout');
        const modal = document.getElementById('checkout-modal');

        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideCheckoutModal());
        }

        if (cancelCheckout) {
            cancelCheckout.addEventListener('click', () => this.hideCheckoutModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideCheckoutModal();
                }
            });
        }
    }

    loadCart() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.displayCart();
    }

    displayCart() {
        const emptyCart = document.getElementById('empty-cart');
        const cartContent = document.getElementById('cart-content');
        const cartItemsList = document.getElementById('cart-items-list');

        if (!emptyCart || !cartContent || !cartItemsList) return;

        if (this.cart.length === 0) {
            emptyCart.style.display = 'block';
            cartContent.style.display = 'none';
            return;
        }

        emptyCart.style.display = 'none';
        cartContent.style.display = 'grid';

        // Display cart items
        cartItemsList.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" 
                     alt="${item.name}" 
                     class="cart-item-image"
                     onerror="this.src='https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500'">
                <div class="cart-item-details">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="cartManager.updateQuantity('${item.product}', ${item.quantity - 1})">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="cartManager.updateQuantity('${item.product}', ${item.quantity + 1})">+</button>
                </div>
                <button class="remove-btn" onclick="cartManager.removeItem('${item.product}')">
                    Remove
                </button>
            </div>
        `).join('');

        this.updateCartSummary();
    }

    updateQuantity(productId, newQuantity) {
        if (newQuantity < 1) {
            this.removeItem(productId);
            return;
        }

        const item = this.cart.find(item => item.product === productId);
        if (item) {
            item.quantity = newQuantity;
            this.saveCart();
            this.displayCart();
            this.updateCartCount();
        }
    }

    removeItem(productId) {
        this.cart = this.cart.filter(item => item.product !== productId);
        this.saveCart();
        this.displayCart();
        this.updateCartCount();
        this.showToast('Item removed from cart', 'success');
    }

    updateCartSummary() {
        const subtotalElement = document.getElementById('subtotal');
        const shippingElement = document.getElementById('shipping');
        const totalElement = document.getElementById('total');

        if (!subtotalElement || !shippingElement || !totalElement) return;

        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
        const total = subtotal + shipping;

        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        shippingElement.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
        totalElement.textContent = `$${total.toFixed(2)}`;
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    updateCartCount() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }

    showCheckoutModal() {
        if (!this.isAuthenticated()) {
            alert('Please login to checkout');
            window.location.href = 'login.html';
            return;
        }

        if (this.cart.length === 0) {
            alert('Your cart is empty');
            return;
        }

        const modal = document.getElementById('checkout-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideCheckoutModal() {
        const modal = document.getElementById('checkout-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async handleCheckout(e) {
        e.preventDefault();
        
        const shippingAddress = {
            name: document.getElementById('shipping-name').value,
            address: document.getElementById('shipping-address').value,
            city: document.getElementById('shipping-city').value,
            postalCode: document.getElementById('shipping-postalCode').value,
            country: document.getElementById('shipping-country').value
        };

        const items = this.cart.map(item => ({
            product: item.product,
            quantity: item.quantity
        }));

        this.showLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    items,
                    shippingAddress
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Clear cart
                this.cart = [];
                this.saveCart();
                this.updateCartCount();
                
                this.hideCheckoutModal();
                this.showToast('Order placed successfully!', 'success');
                
                // Redirect to home after a delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                this.showToast(data.error || 'Checkout failed', 'error');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            this.showLoading(false);
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

// Initialize cart manager
const cartManager = new CartManager();