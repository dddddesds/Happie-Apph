/**
 * Simple Order History System
 * Directly syncs paid orders from checkout to history
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

class SimpleOrderHistory {
    constructor() {
        this.orders = [];
        this.init();
    }

    init() {
        console.log('=== INITIALIZING SIMPLE ORDER HISTORY ===');
        this.loadOrders();
        this.setupEventListeners();
        this.displayOrders();
        this.updateStatistics();
        this.setupAuthListener();
        
        // Test notification to verify slide animation and close button work
        setTimeout(() => {
            this.showNotification('History page loaded successfully!', 'success');
        }, 1000);

        // Cart badge functionality
        this.updateCartBadge();
        setInterval(() => this.updateCartBadge(), 2000);
        
        console.log('=== SIMPLE ORDER HISTORY INITIALIZED ===');
    }

    setupEventListeners() {
        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.displayOrders();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshOrders());
        }

        // Auth system integration
        this.setupAuthEventListeners();

        // Notification close button
        const notificationClose = document.querySelector('.notificationClose');
        if (notificationClose) {
            notificationClose.addEventListener('click', () => this.hideNotification());
        }

        // Modal close buttons
        const closeModalBtns = document.querySelectorAll('.closeModal');
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeOrderModal());
        });

        // Close modal when clicking outside
        const orderModal = document.getElementById('orderModal');
        if (orderModal) {
            orderModal.addEventListener('click', (e) => {
                if (e.target === orderModal) {
                    this.closeOrderModal();
                }
            });
        }
    }

    setupAuthEventListeners() {
        // Use the centralized auth system instead of custom auth
        // The auth.js file handles all authentication
        console.log('Auth system integration - using centralized auth.js');
    }

    setupAuthListener() {
        // Listen for authentication state changes
        window.addEventListener('storage', (e) => {
            if (e.key === 'currentUser') {
                console.log('Auth state changed in history, updating display...');
                setTimeout(() => {
                    this.loadOrders();
                    this.displayOrders();
                }, 100);
            }
        });

        // Also check periodically for auth state changes
        setInterval(() => {
            const currentUser = localStorage.getItem('currentUser');
            const userEmail = currentUser ? JSON.parse(currentUser).email : null;
            
            // Check if auth state has changed
            if (this.lastAuthState !== !!userEmail) {
                console.log('Auth state change detected, updating history display...');
                this.lastAuthState = !!userEmail;
                this.loadOrders();
                this.displayOrders();
            }
        }, 2000);
    }

    loadOrders() {
        try {
            // Use centralized auth system to get current user
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const userEmail = currentUser.email;
            
            if (userEmail) {
                // Load user-specific orders
                const userOrdersKey = `paidOrders_${userEmail}`;
                const ordersData = localStorage.getItem(userOrdersKey);
                if (ordersData) {
                    this.orders = JSON.parse(ordersData);
                    console.log('Loaded user orders for:', userEmail, this.orders);
                } else {
                    this.orders = [];
                    console.log('No orders found for user:', userEmail);
                }
            } else {
                // No user logged in, show empty orders
                this.orders = [];
                console.log('No user logged in, showing empty orders');
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            this.orders = [];
        }
    }

    saveOrders() {
        try {
            // Use centralized auth system to get current user
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const userEmail = currentUser.email;
            
            if (userEmail) {
                // Save to user-specific storage
                const userOrdersKey = `paidOrders_${userEmail}`;
                localStorage.setItem(userOrdersKey, JSON.stringify(this.orders));
                console.log('Saved user orders for:', userEmail, this.orders);
            } else {
                // Fallback to general storage if no user
                localStorage.setItem('paidOrders', JSON.stringify(this.orders));
                console.log('Saved orders to general storage:', this.orders);
            }
        } catch (error) {
            console.error('Error saving orders:', error);
        }
    }

    addPaidOrder(orderData) {
        const order = {
            id: 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            orderNumber: orderData.orderNumber || 'ORD-' + Date.now(),
            items: orderData.items || [],
            total: orderData.total || 0,
            shippingAddress: orderData.shippingAddress || 'Address not available',
            paymentMethod: orderData.paymentMethod || 'Payment method not specified',
            status: 'processing',
            paymentStatus: 'paid',
            createdAt: new Date().toISOString(),
            timeline: [
                {
                    status: 'pending',
                    title: 'Order Placed',
                    date: new Date().toISOString(),
                    completed: true
                },
                {
                    status: 'processing',
                    title: 'Payment Completed',
                    date: new Date().toISOString(),
                    completed: true
                }
            ]
        };

        this.orders.unshift(order); // Add to beginning
        this.saveOrders();
        this.displayOrders();
        this.updateStatistics();
        
        console.log('Added paid order:', order);
        this.showNotification(`Order #${order.orderNumber} added to history!`, 'success');
    }

    displayOrders() {
        const ordersContainer = document.getElementById('ordersContainer');
        const emptyHistoryMessage = document.getElementById('emptyHistoryMessage');
        const historyStatus = document.getElementById('historyStatus');

        if (!ordersContainer) return;

        // Check if user is logged in
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userEmail = currentUser.email;

        if (!userEmail) {
            // User is not logged in - show sign in message
            ordersContainer.innerHTML = `
                <div class="signInMessage" style="text-align: center; padding: 60px 20px; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
                    <div style="font-size: 48px; margin-bottom: 20px;">🔐</div>
                    <h3 style="color: #2d2d2d; margin: 0 0 15px 0; font-size: 1.5rem;">Sign In to Check History</h3>
                    <p style="color: #666; margin: 0 0 25px 0; line-height: 1.6;">Please sign in to view your order history and track your purchases.</p>
                    <button onclick="window.authSystem.showAuthModal()" style="background: #8a5a8a; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 500; cursor: pointer; transition: background-color 0.3s ease;">Sign In</button>
                </div>
            `;
            if (emptyHistoryMessage) emptyHistoryMessage.style.display = 'none';
            if (historyStatus) historyStatus.textContent = 'Please sign in to view history';
            return;
        }

        const statusFilter = document.getElementById('statusFilter');
        const currentFilter = statusFilter ? statusFilter.value : 'all';

        // Filter orders
        let filteredOrders = this.orders;
        if (currentFilter !== 'all') {
            filteredOrders = this.orders.filter(order => order.status === currentFilter);
        }

        if (filteredOrders.length === 0) {
            // Show empty message
            ordersContainer.innerHTML = '';
            if (emptyHistoryMessage) emptyHistoryMessage.style.display = 'block';
            
            if (this.orders.length === 0) {
                if (historyStatus) historyStatus.textContent = 'No orders found';
            } else {
                if (historyStatus) historyStatus.textContent = `No ${currentFilter} orders found`;
            }
        } else {
            // Show orders
            if (emptyHistoryMessage) emptyHistoryMessage.style.display = 'none';
            if (historyStatus) historyStatus.textContent = `${filteredOrders.length} order(s) found`;

            this.renderOrders(ordersContainer, filteredOrders);
        }
    }

    renderOrders(container, orders) {
        container.innerHTML = '';

        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'orderCard';
            orderCard.innerHTML = `
                <button class="cancelOrderBtn" onclick="simpleOrderHistory.cancelOrder('${order.id}')" title="Remove Order">×</button>
                <div class="orderHeader">
                    <div>
                        <div class="orderNumber">${order.orderNumber}</div>
                        <div class="orderDate">${this.formatDate(order.createdAt)}</div>
                    </div>
                    <span class="orderStatus ${order.status}">${order.status}</span>
                </div>
                <div class="orderItems">
                    ${order.items.map(item => `
                        <div class="orderItem">
                            <img src="${item.image}" alt="${item.name}" class="orderItemImage" onerror="this.style.display='none'">
                            <span>${item.name} (${item.quantity})</span>
                        </div>
                    `).join('')}
                </div>
                <div class="orderTotal">Total: ₦${order.total.toLocaleString()}</div>
                <div class="orderActions">
                    <button class="orderActionBtn" onclick="simpleOrderHistory.viewOrderDetails('${order.id}')">View Details</button>
                </div>
            `;
            container.appendChild(orderCard);
        });
    }

    viewOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const orderDetailsContent = document.getElementById('orderDetailsContent');
        if (!orderDetailsContent) return;

        orderDetailsContent.innerHTML = `
            <div class="orderDetailsHeader">
                <div>
                    <h3>${order.orderNumber}</h3>
                    <p>Placed on ${this.formatDate(order.createdAt)}</p>
                </div>
                <span class="orderStatus ${order.status}">${order.status}</span>
            </div>
            
            <div class="orderDetailsInfo">
                <div class="infoGroup">
                    <h4>Payment Method</h4>
                    <p>${order.paymentMethod}</p>
                </div>
                <div class="infoGroup">
                    <h4>Payment Status</h4>
                    <p><span class="paymentStatus ${order.paymentStatus}">${order.paymentStatus}</span></p>
                </div>
            </div>
            
            <div class="orderItemsList">
                <h4>Order Items</h4>
                ${order.items.map(item => `
                    <div class="orderItemDetail">
                        <img src="${item.image}" alt="${item.name}" class="orderItemDetailImage" onerror="this.style.display='none'">
                        <div class="orderItemDetailInfo">
                            <div class="orderItemDetailName">${item.name}</div>
                            <div class="orderItemDetailPrice">₦${item.price.toLocaleString()} each</div>
                            <div class="orderItemDetailQuantity">Quantity: ${item.quantity}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="orderTimeline">
                <h4>Order Timeline</h4>
                ${order.timeline.map(item => `
                    <div class="timelineItem ${item.completed ? 'completed' : 'pending'}">
                        <div class="timelineContent">
                            <div class="timelineTitle">${item.title}</div>
                            <div class="timelineDate">${this.formatDate(item.date)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.openOrderModal();
    }



    cancelOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        // Remove order from array
        this.orders = this.orders.filter(o => o.id !== orderId);
        
        // Save updated orders
        this.saveOrders();
        
        // Refresh display
        this.displayOrders();
        
        // Show success notification
        this.showNotification(`Order #${order.orderNumber} has been removed`, 'success');
    }

    refreshOrders() {
        this.showNotification('Refreshing orders...', 'success');
        setTimeout(() => {
            this.loadOrders();
            this.displayOrders();
            this.updateStatistics();
            this.showNotification('Orders refreshed successfully!', 'success');
        }, 1000);
    }





    updateStatistics() {
        // Statistics elements removed - no longer needed
        console.log('Statistics update called - elements removed from UI');
    }

    updateCartBadge() {
        const cartBadge = document.getElementById('cartBadge');
        if (!cartBadge) return;

        // Get cart items from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userEmail = currentUser.email;
        
        let cartItems = [];
        if (userEmail) {
            // User is logged in - get user-specific cart
            const userCart = localStorage.getItem(`cart_${userEmail}`);
            cartItems = userCart ? JSON.parse(userCart) : [];
        } else {
            // Guest user - get guest cart
            const guestCart = localStorage.getItem('guestCart');
            cartItems = guestCart ? JSON.parse(guestCart) : [];
        }

        const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
        
        if (totalItems > 0) {
            cartBadge.textContent = totalItems;
            cartBadge.style.display = 'flex';
        } else {
            cartBadge.style.display = 'none';
        }
    }

    openOrderModal() {
        const orderModal = document.getElementById('orderModal');
        if (orderModal) {
            orderModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    closeOrderModal() {
        const orderModal = document.getElementById('orderModal');
        if (orderModal) {
            orderModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

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

    hideNotification() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.classList.remove('show');
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Auth integration - using centralized auth system
    // All auth methods are handled by auth.js

    // Static method to add paid order from checkout
    static addPaidOrderFromCheckout(orderData) {
        if (window.simpleOrderHistory) {
            window.simpleOrderHistory.addPaidOrder(orderData);
        } else {
            // Fallback: save to user-specific localStorage using centralized auth
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const userEmail = currentUser.email;
            const userOrdersKey = userEmail ? `paidOrders_${userEmail}` : 'paidOrders';
            
            const orders = JSON.parse(localStorage.getItem(userOrdersKey) || '[]');
            const order = {
                id: 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                orderNumber: orderData.orderNumber || 'ORD-' + Date.now(),
                items: orderData.items || [],
                total: orderData.total || 0,
                shippingAddress: orderData.shippingAddress || 'Address not available',
                paymentMethod: orderData.paymentMethod || 'Payment method not specified',
                status: 'processing',
                paymentStatus: 'paid',
                createdAt: new Date().toISOString(),
                timeline: [
                    {
                        status: 'pending',
                        title: 'Order Placed',
                        date: new Date().toISOString(),
                        completed: true
                    },
                    {
                        status: 'processing',
                        title: 'Payment Completed',
                        date: new Date().toISOString(),
                        completed: true
                    }
                ]
            };
            orders.unshift(order);
            localStorage.setItem(userOrdersKey, JSON.stringify(orders));
            console.log('Fallback: Added paid order to user storage:', userEmail, order);
        }
    }
}

// Initialize simple order history when DOM is loaded
let simpleOrderHistory;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing simple order history...');
    simpleOrderHistory = new SimpleOrderHistory();
    
    // Make simpleOrderHistory globally accessible
    window.simpleOrderHistory = simpleOrderHistory;
    
    console.log('Simple order history initialized');
});

// Export for module use (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleOrderHistory;
}

