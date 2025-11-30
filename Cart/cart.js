/**
 * Shopping Cart System
 * Features: Add/remove products, quantity updates, price calculations, 
 * localStorage persistence, user authentication integration
 */

// Location Detection
document.addEventListener('DOMContentLoaded', () => {
	const locationElement = document.getElementById('userLocation');
	if (locationElement) {
		locationElement.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Locating...';
		locationElement.style.opacity = '0.7';
		
		const tryLocation = async () => {
			const apis = [
				'https://ipapi.co/json/',
				'https://ipinfo.io/json',
				'https://api.ipgeolocation.io/ipgeo?apiKey=free'
			];
			
			for (let api of apis) {
				try {
					console.log(`Trying: ${api}`);
					const response = await fetch(api, {
						method: 'GET',
						headers: {
							'Accept': 'application/json',
						},
						timeout: 5000
					});
					
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					
					const data = await response.json();
					console.log('Response:', data);
					
					let city = data.city || data.loc?.split(',')[0] || 'Your Location';
					if (city && city !== 'Your Location' && city.trim() !== '') {
						locationElement.textContent = city;
						locationElement.style.opacity = '1';
						return;
					}
				} catch (error) {
					console.log(`Failed ${api}:`, error);
					continue;
				}
			}
			
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					async function(position) {
						try {
							const { latitude, longitude } = position.coords;
							const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
							const data = await response.json();
							
							if (data.city) {
								locationElement.textContent = data.city;
							} else if (data.locality) {
								locationElement.textContent = data.locality;
							} else {
								locationElement.textContent = 'Location detected';
							}
							locationElement.style.opacity = '1';
						} catch (error) {
							locationElement.textContent = 'Location detected';
							locationElement.style.opacity = '1';
						}
					},
					function(error) {
						locationElement.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;unavailable';
						locationElement.style.opacity = '1';
					},
					{ timeout: 10000, enableHighAccuracy: false }
				);
			} else {
				locationElement.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;unavailable';
				locationElement.style.opacity = '1';
			}
		};
		
		tryLocation();
	}
});

// Cart Class - Main cart functionality
class ShoppingCart {
    constructor() {
        this.items = [];
        this.isUserLoggedIn = false;
        this.currentUser = null;
        this.taxRate = 0; // No tax
        this.shippingCost = 0; // Free shipping
        
        this.init();
    }

    /**
     * Initialize the cart system
     */
    init() {
        console.log('=== INITIALIZING CART SYSTEM ===');
        this.loadCartFromStorage();
        this.setupEventListeners();
        this.updateCartDisplay();
        this.checkUserAuthStatus();
        this.updateCartBadge();
        
        // Force refresh auth status after a short delay to ensure global auth is loaded
        setTimeout(() => {
            this.checkUserAuthStatus();
        }, 500);
        
        console.log('=== CART SYSTEM INITIALIZED ===');
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Clear cart button
        const clearCartBtn = document.getElementById('clearCartBtn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => this.clearCart());
        }

        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.proceedToCheckout());
        }

        // Sign in button
        const signInBtn = document.getElementById('signInBtn');
        if (signInBtn) {
            signInBtn.addEventListener('click', () => this.openAuthModal());
        }

        // Account link
        const accountLink = document.getElementById('accountLink');
        if (accountLink) {
            accountLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openAuthModal();
            });
        }

        // Notification close button
        const notificationClose = document.querySelector('.notificationClose');
        if (notificationClose) {
            notificationClose.addEventListener('click', () => this.hideNotification());
        }

        // Modal close buttons
        const closeModalBtns = document.querySelectorAll('.closeModal');
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeAuthModal());
        });

        // Close modal when clicking outside
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) {
                    this.closeAuthModal();
                }
            });
        }

        // Auth form submission
        const authForm = document.getElementById('authForm');
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
        }

        // Toggle auth mode button
        const toggleAuthBtn = document.getElementById('toggleAuthBtn');
        if (toggleAuthBtn) {
            toggleAuthBtn.addEventListener('click', () => this.toggleAuthMode());
        }

        // Sign out button
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.signOut());
        }

        // Edit account button
        const editAccountBtn = document.getElementById('editAccountBtn');
        if (editAccountBtn) {
            editAccountBtn.addEventListener('click', () => this.editAccount());
        }
    }

    /**
     * Load cart data from localStorage
     */
    loadCartFromStorage() {
        try {
            // Check if user is logged in using currentUser (same as product page)
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            
            if (currentUser && currentUser.email) {
                // Load user-specific cart
                const userCartKey = `cart_${currentUser.email}`;
                const userCartData = localStorage.getItem(userCartKey);
                if (userCartData) {
                    this.items = JSON.parse(userCartData);
                    console.log('Loaded user cart:', this.items);
                } else {
                    console.log('No user cart data found for:', userCartKey);
                }
            } else {
                // Load guest cart
                const guestCartData = localStorage.getItem('guestCart');
                if (guestCartData) {
                    this.items = JSON.parse(guestCartData);
                    console.log('Loaded guest cart:', this.items);
                } else {
                    console.log('No guest cart data found');
                }
            }
            
            console.log('Final cart items after loading:', this.items);
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            this.items = [];
        }
    }

    /**
     * Save cart data to localStorage
     */
    saveCartToStorage() {
        try {
            const currentUser = localStorage.getItem('currentUser');
            
            if (currentUser) {
                try {
                    const userData = JSON.parse(currentUser);
                    // Save to user-specific storage
                    const userCartKey = `cart_${userData.email}`;
                    localStorage.setItem(userCartKey, JSON.stringify(this.items));
                    console.log(`Saved user cart (${userData.email}):`, this.items);
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    // Fallback to guest storage
                    localStorage.setItem('guestCart', JSON.stringify(this.items));
                    console.log('Saved to guest cart (fallback):', this.items);
                }
            } else {
                // Save to guest storage
                localStorage.setItem('guestCart', JSON.stringify(this.items));
                console.log('Saved guest cart:', this.items);
            }
        } catch (error) {
            console.error('Error saving cart to storage:', error);
        }
    }

    /**
     * Add item to cart
     */
    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += product.quantity;
        } else {
            this.items.push({
                ...product,
                addedAt: new Date().toISOString()
            });
        }

        this.saveCartToStorage();
        this.updateCartDisplay();
        this.updateCartBadge();
        this.showNotification(`${product.name} added to cart!`, 'success');
    }

    /**
     * Remove item from cart
     */
    removeItem(productId) {
        const itemIndex = this.items.findIndex(item => item.id === productId);
        if (itemIndex !== -1) {
            const removedItem = this.items[itemIndex];
            this.items.splice(itemIndex, 1);
            this.saveCartToStorage();
            this.updateCartDisplay();
            this.updateCartBadge();
            this.showNotification(`${removedItem.name} removed from cart`, 'success');
        }
    }

    /**
     * Update item quantity
     */
    updateQuantity(productId, newQuantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            if (newQuantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = newQuantity;
                this.saveCartToStorage();
                this.updateCartDisplay();
                this.updateCartBadge();
            }
        }
    }

    /**
     * Clear all items from cart
     */
    clearCart() {
        if (this.items.length === 0) return;

        this.items = [];
        this.saveCartToStorage();
        this.updateCartDisplay();
        this.updateCartBadge();
        this.showNotification('Cart cleared successfully', 'success');
    }

    /**
     * Calculate cart totals
     */
    calculateTotals() {
        const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = 0; // No tax
        const total = subtotal + tax; // No shipping

        return {
            subtotal,
            tax,
            total
        };
    }

    /**
     * Update cart display
     */
    updateCartDisplay() {
        const cartItemsContainer = document.getElementById('cartItemsContainer');
        const emptyCartMessage = document.getElementById('emptyCartMessage');
        const clearCartBtn = document.getElementById('clearCartBtn');
        const checkoutBtn = document.getElementById('checkoutBtn');
        const cartStatus = document.getElementById('cartStatus');

        if (!cartItemsContainer) return;

        if (this.items.length === 0) {
            // Show empty cart message
            cartItemsContainer.innerHTML = '';
            if (emptyCartMessage) emptyCartMessage.style.display = 'block';
            if (clearCartBtn) clearCartBtn.style.display = 'none';
            if (checkoutBtn) checkoutBtn.disabled = true;
            if (cartStatus) cartStatus.textContent = 'Your cart is empty';
        } else {
            // Show cart items
            if (emptyCartMessage) emptyCartMessage.style.display = 'none';
            if (clearCartBtn) clearCartBtn.style.display = 'block';
            if (checkoutBtn) checkoutBtn.disabled = false;
            if (cartStatus) cartStatus.textContent = `${this.items.length} item(s) in your cart`;

            this.renderCartItems(cartItemsContainer);
        }

        this.updatePriceDisplay();
    }

    /**
     * Render cart items
     */
    renderCartItems(container) {
        container.innerHTML = '';

        this.items.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cartItem';
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="itemImage" onerror="this.style.display='none'">
                <div class="itemDetails">
                    <h4 class="itemName">${item.name}</h4>
                    <p class="itemPrice">₦${(item.price * item.quantity).toLocaleString()}</p>
                    <p class="itemQuantity">₦${item.price.toLocaleString()} each</p>
                </div>
                <button class="removeBtn" onclick="cart.removeItem('${item.id}')">Remove</button>
                <div class="quantityControls">
                    <button class="quantityBtn" onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
                    <input type="number" class="quantityInput" value="${item.quantity}" min="1" max="99" onchange="cart.updateQuantity('${item.id}', parseInt(this.value))">
                    <button class="quantityBtn" onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})" ${item.quantity >= 99 ? 'disabled' : ''}>+</button>
                </div>
            `;
            container.appendChild(cartItem);
        });
    }

    /**
     * Update price display
     */
    updatePriceDisplay() {
        const totals = this.calculateTotals();
        
        const subtotalElement = document.getElementById('subtotal');
        const taxElement = document.getElementById('tax');
        const totalElement = document.getElementById('total');

        if (subtotalElement) subtotalElement.textContent = `₦${totals.subtotal.toLocaleString()}`;
        if (taxElement) taxElement.style.display = 'none'; // Hide tax line
        if (totalElement) totalElement.textContent = `₦${totals.total.toLocaleString()}`;
    }

    /**
     * Update cart badge
     */
    updateCartBadge() {
        const cartBadge = document.getElementById('cartBadge');
        if (cartBadge) {
            const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
            cartBadge.textContent = totalItems;
            cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }

    /**
     * Check user authentication status
     */
    checkUserAuthStatus() {
        // Use global auth system if available
        if (window.authSystem && window.authSystem.currentUser) {
            this.isUserLoggedIn = true;
            this.currentUser = window.authSystem.currentUser;
            this.updateUserStatus();
            this.migrateGuestCartToUser();
            console.log('User authenticated via global auth:', this.currentUser.name);
        } else {
            // Fallback to localStorage
            const currentUser = localStorage.getItem('currentUser');
            
            if (currentUser) {
                try {
                    const userData = JSON.parse(currentUser);
                    this.isUserLoggedIn = true;
                    this.currentUser = userData;
                    this.updateUserStatus();
                    this.migrateGuestCartToUser();
                    console.log('User authenticated via localStorage:', userData.name);
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    this.isUserLoggedIn = false;
                    this.currentUser = null;
                    this.updateUserStatus();
                }
            } else {
                this.isUserLoggedIn = false;
                this.currentUser = null;
                this.updateUserStatus();
                console.log('No user authenticated');
            }
        }
    }

    /**
     * Update user status display
     */
    updateUserStatus() {
        const userStatus = document.getElementById('userStatus');
        if (!userStatus) return;

        if (this.isUserLoggedIn && this.currentUser) {
            userStatus.innerHTML = `
                <div class="userMessage">
                    <p>✅ <strong>Signed in as ${this.currentUser.name}</strong></p>
                    <p>Your cart is saved and synced across devices</p>
                </div>
            `;
        } else {
            userStatus.innerHTML = `
                <div class="guestMessage">
                    <p>💡 <strong>Sign in</strong> to save your cart across devices</p>
                    <button id="signInBtn" class="signInBtn">Sign In</button>
                </div>
            `;
            
            // Re-attach event listeners
            const signInBtn = document.getElementById('signInBtn');
            if (signInBtn) {
                signInBtn.addEventListener('click', () => this.openAuthModal());
            }
        }
    }



    /**
     * Migrate guest cart to user cart when user signs in
     */
    migrateGuestCartToUser() {
        const guestCartData = localStorage.getItem('guestCart');
        if (guestCartData) {
            try {
                const guestItems = JSON.parse(guestCartData);
                if (guestItems.length > 0) {
                    // Merge guest items with user items
                    guestItems.forEach(guestItem => {
                        const existingItem = this.items.find(item => item.id === guestItem.id);
                        if (existingItem) {
                            existingItem.quantity += guestItem.quantity;
                        } else {
                            this.items.push(guestItem);
                        }
                    });
                    
                    // Save merged cart and remove guest cart
                    this.saveCartToStorage();
                    localStorage.removeItem('guestCart');
                    
                    this.updateCartDisplay();
                    this.updateCartBadge();
                    this.showNotification('Guest cart items merged with your account!', 'success');
                }
            } catch (error) {
                console.error('Error migrating guest cart:', error);
            }
        }
    }

    /**
     * Open authentication modal
     */
    openAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Close authentication modal
     */
    closeAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Handle authentication form submission
     */
    handleAuthSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const name = formData.get('name');
        const phone = formData.get('phone');
        const confirmPassword = formData.get('confirmPassword');

        // Simple validation
        if (!email || !password) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Check if it's sign up mode
        const isSignUp = document.getElementById('authTitle').textContent === 'Create Account';
        
        if (isSignUp) {
            if (!name || !phone || !confirmPassword) {
                this.showNotification('Please fill in all fields for sign up', 'error');
                return;
            }
            if (password !== confirmPassword) {
                this.showNotification('Passwords do not match', 'error');
                return;
            }
        }

        // Simulate authentication (replace with real auth)
        this.authenticateUser(email, password, name, phone, isSignUp);
    }

    /**
     * Authenticate user (simplified - replace with real auth)
     */
    authenticateUser(email, password, name, phone, isSignUp) {
        // Simulate API call delay
        setTimeout(() => {
            if (isSignUp) {
                // Simulate sign up
                localStorage.setItem('userEmail', email);
                localStorage.setItem('userName', name);
                localStorage.setItem('userPhone', phone);
                
                this.isUserLoggedIn = true;
                this.currentUser = { email, name, phone };
                
                this.closeAuthModal();
                this.updateUserStatus();
                this.migrateGuestCartToUser();
                this.showNotification('Account created successfully!', 'success');
            } else {
                // Simulate sign in
                localStorage.setItem('userEmail', email);
                localStorage.setItem('userName', name || 'User');
                
                this.isUserLoggedIn = true;
                this.currentUser = { email, name: name || 'User' };
                
                this.closeAuthModal();
                this.updateUserStatus();
                this.migrateGuestCartToUser();
                this.showNotification('Signed in successfully!', 'success');
            }
        }, 1000);
    }

    /**
     * Toggle authentication mode (sign in/sign up)
     */
    toggleAuthMode() {
        const authTitle = document.getElementById('authTitle');
        const authSubmitBtn = document.getElementById('authSubmitBtn');
        const toggleAuthBtn = document.getElementById('toggleAuthBtn');
        const nameGroup = document.getElementById('authNameGroup');
        const phoneGroup = document.getElementById('authPhoneGroup');
        const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');

        if (authTitle.textContent === 'Sign In') {
            // Switch to sign up
            authTitle.textContent = 'Create Account';
            authSubmitBtn.textContent = 'Create Account';
            toggleAuthBtn.textContent = 'Sign In';
            if (nameGroup) nameGroup.style.display = 'block';
            if (phoneGroup) phoneGroup.style.display = 'block';
            if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'block';
        } else {
            // Switch to sign in
            authTitle.textContent = 'Sign In';
            authSubmitBtn.textContent = 'Sign In';
            toggleAuthBtn.textContent = 'Create Account';
            if (nameGroup) nameGroup.style.display = 'none';
            if (phoneGroup) phoneGroup.style.display = 'none';
            if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'none';
        }
    }

    /**
     * Sign out user
     */
    signOut() {
        // Use global auth system if available
        if (window.authSystem) {
            window.authSystem.signOut();
        } else {
            // Fallback to local sign out
            localStorage.removeItem('currentUser');
        }
        
        this.isUserLoggedIn = false;
        this.currentUser = null;
        
        this.updateUserStatus();
        this.showNotification('Signed out successfully', 'success');
    }

    /**
     * Edit account (placeholder)
     */
    editAccount() {
        this.showNotification('Edit account feature coming soon!', 'success');
    }

    /**
     * Proceed to checkout
     */
    proceedToCheckout() {
        if (this.items.length === 0) {
            this.showNotification('Your cart is empty', 'error');
            return;
        }

        if (!this.isUserLoggedIn) {
            this.showNotification('Please sign in to proceed to checkout', 'error');
            this.openAuthModal();
            return;
        }

        // Save cart data for checkout page
        localStorage.setItem('checkoutCart', JSON.stringify(this.items));
        localStorage.setItem('checkoutTotal', this.calculateTotals().total.toString());
        
        // Redirect to checkout
        window.location.href = '../Checkout/checkout.html';
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        
        if (notification && notificationText) {
            notificationText.textContent = message;
            notification.className = `notification ${type}`;
            notification.classList.add('show');
            
            // Auto hide after 3 seconds
            setTimeout(() => {
                this.hideNotification();
            }, 3000);
        }
    }

    /**
     * Hide notification
     */
    hideNotification() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.classList.remove('show');
        }
    }

    /**
     * Get cart items (for external use)
     */
    getItems() {
        return this.items;
    }

    /**
     * Get cart total (for external use)
     */
    getTotal() {
        return this.calculateTotals().total;
    }
}

// Initialize cart when DOM is loaded
let cart;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing cart...');
    cart = new ShoppingCart();
    
    // Make cart globally accessible
    window.cart = cart;
    
    // Load any items from product page if redirected
    const checkoutCart = localStorage.getItem('checkoutCart');
    if (checkoutCart) {
        try {
            const items = JSON.parse(checkoutCart);
            items.forEach(item => cart.addItem(item));
            localStorage.removeItem('checkoutCart'); // Clear after loading
            console.log('Loaded items from checkout cart:', items);
        } catch (error) {
            console.error('Error loading checkout cart:', error);
        }
    }
    
    // Set up storage event listener to sync auth state across tabs/pages
    window.addEventListener('storage', function(e) {
        console.log('Storage event detected:', e.key, e.newValue);
        if (e.key === 'currentUser') {
            console.log('Auth state changed, updating cart...');
            setTimeout(() => {
                if (cart) {
                    cart.checkUserAuthStatus();
                    cart.loadCartFromStorage();
                    cart.updateCartDisplay();
                    cart.updateCartBadge();
                }
            }, 100);
        } else if (e.key && (e.key.startsWith('cart_') || e.key === 'guestCart')) {
            console.log('Cart data changed, refreshing cart...');
            setTimeout(() => {
                if (cart) {
                    cart.loadCartFromStorage();
                    cart.updateCartDisplay();
                    cart.updateCartBadge();
                }
            }, 100);
        }
    });
    
    // Also check periodically for auth state changes and cart updates
    setInterval(() => {
        const currentUser = localStorage.getItem('currentUser');
        if (cart) {
            // Check for auth state changes
            if (cart.currentUser === null && currentUser) {
                console.log('Detected auth state change, updating...');
                cart.checkUserAuthStatus();
                cart.loadCartFromStorage();
                cart.updateCartDisplay();
                cart.updateCartBadge();
            }
            
            // Check for cart data changes
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            let cartKey = 'guestCart';
            if (currentUser && currentUser.email) {
                cartKey = `cart_${currentUser.email}`;
            }
            
            const cartData = localStorage.getItem(cartKey);
            if (cartData && cart.items.length === 0) {
                console.log('Detected cart data but cart is empty, reloading...');
                cart.loadCartFromStorage();
                cart.updateCartDisplay();
                cart.updateCartBadge();
            }
        }
    }, 2000);
});



// Export for module use (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShoppingCart;
}

