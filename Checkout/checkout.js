document.addEventListener('DOMContentLoaded', function() {
    loadCartData();
    initializeAutofill();
    initializePaymentMethods();
function updateCartBadge() {
    const cartBadge = document.getElementById('cartBadge');
    if (!cartBadge) return;

    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userEmail = currentUser.email;
    
    let cartItems = [];
    if (userEmail) {
        
        const userCart = localStorage.getItem(`cart_${userEmail}`);
        cartItems = userCart ? JSON.parse(userCart) : [];
    } else {
        
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

updateCartBadge();
window.addEventListener('storage', (e) => {
    if (e.key === 'guestCart' || e.key.startsWith('cart_')) {
        updateCartBadge();
    }
});

setInterval(updateCartBadge, 2000);
    checkAndUpdateAuthStatus();
    initializeCheckout();
    setTimeout(() => { forceAuthSync(); }, 500);
    setTimeout(() => {
        if (!window.simpleOrderHistory) {
            window.simpleOrderHistory = {
                addPaidOrder: function(orderData) {
                    const orders = JSON.parse(localStorage.getItem('paidOrders') || '[]');
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
                    localStorage.setItem('paidOrders', JSON.stringify(orders));
                }
            };
        }
    }, 1000);
});

function forceAuthSync() {
    console.log('Forcing auth sync...');
    const currentUser = localStorage.getItem('currentUser');
    
    if (currentUser && window.authSystem) {
        try {
            const userData = JSON.parse(currentUser);
            window.authSystem.currentUser = userData;
            window.authSystem.updateUIForAuthenticatedUser();
            console.log('Force sync successful - User logged in:', userData.name);
        } catch (error) {
            console.error('Force sync error:', error);
        }
    } else if (window.authSystem) {
        window.authSystem.currentUser = null;
        window.authSystem.updateUIForUnauthenticatedUser();
        console.log('Force sync successful - No user logged in');
    }
}

function checkAndUpdateAuthStatus() {
    
    const checkAuthSystem = () => {
        if (window.authSystem) {
            
            const currentUser = localStorage.getItem('currentUser');
            
            if (currentUser) {
                try {
                    const userData = JSON.parse(currentUser);
                    
                    window.authSystem.currentUser = userData;
                    window.authSystem.updateUIForAuthenticatedUser();
                    console.log('User already logged in:', userData.name);
                    
                    updateAuthNotice(false);
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    updateAuthNotice(true);
                }
            } else {
                console.log('No user logged in');
                
                window.authSystem.updateUIForUnauthenticatedUser();
                
                updateAuthNotice(true);
            }
        } else {
            
            setTimeout(checkAuthSystem, 100);
        }
    };
    
    
    checkAuthSystem();
    
    
    window.addEventListener('storage', function(e) {
        if (e.key === 'currentUser') {
            console.log('Auth state changed, updating UI...');
            setTimeout(checkAndUpdateAuthStatus, 100);
        } else if (e.key === 'checkoutCart' || e.key === 'checkoutTotal') {
            console.log('Cart data changed, reloading cart data...');
            setTimeout(loadCartData, 100);
        }
    });
    
    
    setInterval(() => {
        const currentUser = localStorage.getItem('currentUser');
        if (window.authSystem && window.authSystem.currentUser === null && currentUser) {
            console.log('Detected auth state change, updating...');
            checkAndUpdateAuthStatus();
        }
    }, 2000);
}

function updateAuthNotice(show) {
    const authNotice = document.getElementById('authNotice');
    if (authNotice) {
        authNotice.style.display = show ? 'flex' : 'none';
    }
}

function loadCartData() {
    
    const cartData = localStorage.getItem('checkoutCart');
    const totalPrice = localStorage.getItem('checkoutTotal');
    
    console.log('Raw cart data from localStorage:', cartData);
    console.log('Raw total price from localStorage:', totalPrice);
    
    if (cartData && totalPrice) {
        try {
            const cartItems = JSON.parse(cartData);
            const total = parseInt(totalPrice);
            
            console.log('Parsed cart items:', cartItems);
            console.log('Parsed total price:', total);
            
            
            updateCartItemsDisplay(cartItems);
            
            
            updatePrices(total);
            
            
        } catch (error) {
            console.error('Error parsing cart data:', error);
        }
    } else {
        console.log('No cart data found, resetting prices to zero');
        
        updateCartItemsDisplay([]);
        
        updatePrices(0);
    }
}

function updateCartItemsDisplay(cartItems) {
    const cartItemsContainer = document.getElementById('cartItems');
    
    if (cartItemsContainer) {
        
        cartItemsContainer.innerHTML = '';
        
        if (cartItems && cartItems.length > 0) {
            cartItems.forEach(item => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cartItem';
                
                
                let imagePath = item.image;
                if (imagePath && !imagePath.startsWith('http') && !imagePath.startsWith('../')) {
                    imagePath = '../Farm and Product selected details/' + imagePath;
                }
                
                cartItem.innerHTML = `
                    <img src="${imagePath}" alt="${item.name}" class="itemImage" onerror="this.style.display='none'">
                    <div class="itemDetails">
                        <h4>${item.name}</h4>
                        <p class="itemQuantity">Quantity: ${item.quantity}</p>
                        <p class="itemPrice">₦${item.price.toLocaleString()}</p>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItem);
            });
        } else {
            
            cartItemsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No items selected</p>';
        }
    }
}

function updatePrices(total) {
    
    const subtotalElement = document.getElementById('subtotal');
    if (subtotalElement) {
        subtotalElement.textContent = `₦${total.toLocaleString()}`;
    }
    
    
    const shippingCost = total > 0 ? 500 : 0;
    const totalCost = total + shippingCost;
    
    
    const shippingCostElement = document.getElementById('shippingCost');
    if (shippingCostElement) {
        shippingCostElement.textContent = `₦${shippingCost.toLocaleString()}`;
    }
    
    const totalCostElement = document.getElementById('totalCost');
    if (totalCostElement) {
        totalCostElement.textContent = `₦${totalCost.toLocaleString()}`;
    }
    
    
    const qrAmountElement = document.getElementById('qrAmount');
    if (qrAmountElement) {
        qrAmountElement.textContent = `₦${totalCost.toLocaleString()}`;
    }
}

function initializeCheckout() {
    initializeFormValidation();
    initializeShippingUpdates();
    initializeCardFormatting();
    initializePlaceOrder();
    initializeModal();
    initializeCountryStateMapping();
}

function initializeFormValidation() {
    const forms = ['shippingForm'];
    
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll('input, select');
            
            inputs.forEach(input => {
                input.addEventListener('blur', validateField);
                input.addEventListener('input', clearFieldError);
            });
        }
    });
}

function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    const fieldName = field.name;
    
    clearFieldError(event);
    
    let isValid = true;
    let errorMessage = '';
    
    switch (fieldName) {
        case 'firstName':
        case 'lastName':
            if (value.length < 2) {
                isValid = false;
                errorMessage = 'Name must be at least 2 characters long';
            }
            break;
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
            break;
        case 'phone':
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
            break;
        case 'address':
            if (value.length < 10) {
                isValid = false;
                errorMessage = 'Address must be at least 10 characters long';
            }
            break;
        case 'city':
        case 'state':
            if (value.length < 2) {
                isValid = false;
                errorMessage = 'This field is required';
            }
            break;
        case 'zipCode':
            if (value.length < 3) {
                isValid = false;
                errorMessage = 'Please enter a valid ZIP code';
            }
            break;
        case 'country':
            if (!value) {
                isValid = false;
                errorMessage = 'Please select a country';
            }
            break;
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    field.classList.add('error');
    
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = '#8a5a8a';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(event) {
    const field = event.target;
    field.classList.remove('error');
    
    const errorMessage = field.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

function initializePaymentMethods() {
    const paymentOptions = document.querySelectorAll('input[name="payment"]');
    const cardForm = document.getElementById('cardForm');
    const submitPaymentBtn = document.getElementById('submitPaymentBtn');
    
    
    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    if (selectedPayment && submitPaymentBtn) {
        submitPaymentBtn.style.display = 'block';
        console.log('Default payment option detected:', selectedPayment.value, 'Submit button shown');
        
        
        if (selectedPayment.value === 'card') {
            cardForm.style.display = 'block';
            console.log('Card form shown on page load');
        }
    }
    
    paymentOptions.forEach(option => {
        option.addEventListener('change', function() {
            
            if (submitPaymentBtn) {
                submitPaymentBtn.style.display = 'block';
                console.log('Submit button should now be visible for:', this.value);
            }
            
            if (this.value === 'card') {
                cardForm.style.display = 'block';
                document.getElementById('hapipayQR').style.display = 'none';
            } else if (this.value === 'hapipay') {
                console.log('HapiPay selected - generating QR code');
                cardForm.style.display = 'none';
                document.getElementById('hapipayQR').style.display = 'block';
                generateHapiPayQR();
            } else {
                cardForm.style.display = 'none';
                document.getElementById('hapipayQR').style.display = 'none';
            }
            
            console.log('Payment option selected:', this.value, 'Submit button should be visible');
        });
    });
    
    
    const refreshQRBtn = document.getElementById('refreshQRBtn');
    if (refreshQRBtn) {
        refreshQRBtn.addEventListener('click', function() {
            generateHapiPayQR();
        });
    }
    
    
    if (submitPaymentBtn) {
        submitPaymentBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handlePaymentSubmission();
        });
        console.log('Submit button initialized');
    } else {
        console.log('Submit button not found');
    }
}

function handlePaymentSubmission() {
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.email) {
        showNotification('Please sign in to make a payment.', 'error');
        
        if (window.authSystem) {
            window.authSystem.showAuthModal();
        }
        return;
    }
    
    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    
    if (!selectedPayment) {
        showNotification('Please select a payment method.', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submitPaymentBtn');
    const originalText = submitBtn.textContent;
    
    
    submitBtn.textContent = 'Processing Payment...';
    submitBtn.disabled = true;
    
    
    setTimeout(() => {
        if (selectedPayment.value === 'card') {
            
            const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
            const expiry = document.getElementById('expiry').value;
            const cvv = document.getElementById('cvv').value;
            
            if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
                showNotification('Please enter a valid card number.', 'error');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            if (!expiry || expiry.length !== 5) {
                showNotification('Please enter a valid expiry date (MM/YY).', 'error');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            if (!cvv || cvv.length < 3 || cvv.length > 4) {
                showNotification('Please enter a valid CVV.', 'error');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            showNotification('Card payment processed successfully!', 'success');
        } else if (selectedPayment.value === 'paypal') {
            showNotification('PayPal payment processed successfully!', 'success');
        } else if (selectedPayment.value === 'hapipay') {
            showNotification('HapiPay payment processed successfully!', 'success');
        }
        
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        
        handlePlaceOrder();
    }, 2000);
}


function generateHapiPayQR() {
    const canvas = document.getElementById('qrCanvas');
    const ctx = canvas.getContext('2d');
    const totalAmount = document.getElementById('totalCost').textContent;
    
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    
    const transactionId = 'HAPI' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    
    const qrData = {
        merchant: 'Deyplay Store',
        amount: totalAmount,
        transactionId: transactionId,
        timestamp: new Date().toISOString(),
        type: 'payment'
    };
    
    
    const qrString = JSON.stringify(qrData);
    
    
    generateSimpleQRCode(ctx, qrString, canvas.width, canvas.height);
    
    
    document.getElementById('qrAmount').textContent = totalAmount;
    
    console.log('HapiPay QR Code generated:', qrData);
}


function generateSimpleQRCode(ctx, data, width, height) {
    const cellSize = 4;
    const margin = 20;
    const dataLength = data.length;
    
    
    const pattern = [];
    for (let i = 0; i < dataLength; i++) {
        const charCode = data.charCodeAt(i);
        pattern.push(charCode % 2 === 0);
    }
    
    
    const cellsX = Math.floor((width - 2 * margin) / cellSize);
    const cellsY = Math.floor((height - 2 * margin) / cellSize);
    
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    
    ctx.fillStyle = '#000000';
    let patternIndex = 0;
    
    for (let y = 0; y < cellsY; y++) {
        for (let x = 0; x < cellsX; x++) {
            const shouldFill = pattern[patternIndex % pattern.length];
            if (shouldFill) {
                ctx.fillRect(
                    margin + x * cellSize,
                    margin + y * cellSize,
                    cellSize,
                    cellSize
                );
            }
            patternIndex++;
        }
    }
    
    
    ctx.fillStyle = '#8a5a8a';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('HAPI', width / 2, height / 2 - 5);
    ctx.fillText('PAY', width / 2, height / 2 + 5);
}

function initializeShippingUpdates() {
    const shippingOptions = document.querySelectorAll('input[name="shipping"]');
    
    shippingOptions.forEach(option => {
        option.addEventListener('change', updateShippingCost);
    });
}

function updateShippingCost() {
    const selectedShipping = document.querySelector('input[name="shipping"]:checked');
    const shippingCostElement = document.getElementById('shippingCost');
    const totalCostElement = document.getElementById('totalCost');
    const qrAmountElement = document.getElementById('qrAmount');
    
    if (selectedShipping) {
        let shippingCost = 0;
        
        switch (selectedShipping.value) {
            case 'standard':
                shippingCost = 500;
                break;
            case 'express':
                shippingCost = 1200;
                break;
            case 'overnight':
                shippingCost = 2500;
                break;
        }
        
        shippingCostElement.textContent = `₦${shippingCost.toLocaleString()}`;
        
        
        const subtotalElement = document.getElementById('subtotal');
        const subtotalText = subtotalElement ? subtotalElement.textContent.replace('₦', '').replace(',', '') : '5000';
        const subtotal = parseInt(subtotalText) || 5000;
        
        const total = subtotal + shippingCost;
        totalCostElement.textContent = `₦${total.toLocaleString()}`;
        
        
        if (qrAmountElement) {
            qrAmountElement.textContent = `₦${total.toLocaleString()}`;
        }
    }
}

function initializeCardFormatting() {
    const cardNumber = document.getElementById('cardNumber');
    const expiry = document.getElementById('expiry');
    const cvv = document.getElementById('cvv');
    
    if (cardNumber) {
        cardNumber.addEventListener('input', formatCardNumber);
    }
    
    if (expiry) {
        expiry.addEventListener('input', formatExpiry);
    }
    
    if (cvv) {
        cvv.addEventListener('input', formatCVV);
    }
}

function formatCardNumber(event) {
    let value = event.target.value.replace(/\s/g, '').replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    event.target.value = value;
}

function formatExpiry(event) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    event.target.value = value;
}

function formatCVV(event) {
    let value = event.target.value.replace(/\D/g, '');
    event.target.value = value;
}

function initializePlaceOrder() {
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', handlePlaceOrder);
    }
}

function handlePlaceOrder() {
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.email) {
        showNotification('Please sign in to place an order.', 'error');
        
        if (window.authSystem) {
            window.authSystem.showAuthModal();
        }
        return;
    }
    
    if (!validateAllForms()) {
        showNotification('Please fill in all required fields correctly.', 'error');
        return;
    }
    
    if (!validatePaymentMethod()) {
        showNotification('Please complete your payment information.', 'error');
        return;
    }
    
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const originalText = placeOrderBtn.textContent;
    placeOrderBtn.textContent = 'Processing Order...';
    placeOrderBtn.disabled = true;
    
    
    setTimeout(() => {
        processOrder();
        
        placeOrderBtn.textContent = originalText;
        placeOrderBtn.disabled = false;
    }, 3000);
}

function validateAllForms() {
    const forms = ['shippingForm'];
    let isValid = true;
    
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll('input[required], select[required]');
            
            inputs.forEach(input => {
                if (!validateField({ target: input })) {
                    isValid = false;
                }
            });
        }
    });
    
    return isValid;
}

function validatePaymentMethod() {
    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    
    if (!selectedPayment) {
        return false;
    }
    
    if (selectedPayment.value === 'card') {
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const expiry = document.getElementById('expiry').value;
        const cvv = document.getElementById('cvv').value;
        
        if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
            return false;
        }
        
        if (!expiry || expiry.length !== 5) {
            return false;
        }
        
        if (!cvv || cvv.length < 3 || cvv.length > 4) {
            return false;
        }
    }
    
    return true;
}

function processOrder() {
    
    const orderNumber = 'ORD-' + Date.now();
    
    
    const cartData = localStorage.getItem('checkoutCart');
    const cartItems = cartData ? JSON.parse(cartData) : [];
    
    
    const totalElement = document.getElementById('totalCost');
    const total = totalElement ? parseFloat(totalElement.textContent.replace('₦', '').replace(',', '')) : 0;
    
    
    let paymentMethod = 'Payment method not specified';
    
    
    const cardRadio = document.getElementById('card');
    const paypalRadio = document.getElementById('paypal');
    const hapipayRadio = document.getElementById('hapipay');
    
    if (cardRadio && cardRadio.checked) {
        paymentMethod = 'Credit/Debit Card';
    } else if (paypalRadio && paypalRadio.checked) {
        paymentMethod = 'PayPal';
    } else if (hapipayRadio && hapipayRadio.checked) {
        paymentMethod = 'HapiPay';
    }
    
    
    const orderData = {
        orderNumber: orderNumber,
        items: cartItems,
        total: total,
        shippingAddress: 'Address details',
        paymentMethod: paymentMethod
    };
    
    
    setTimeout(() => {
        if (window.simpleOrderHistory) {
            window.simpleOrderHistory.addPaidOrder(orderData);
        } else {
            SimpleOrderHistory.addPaidOrderFromCheckout(orderData);
        }
    }, 100);
    
    
    localStorage.removeItem('checkoutCart');
    localStorage.removeItem('checkoutTotal');
    
    
    showOrderConfirmation({
        orderNumber: orderNumber,
        total: total
    });
}

function initializeModal() {
    const modal = document.getElementById('orderModal');
    const closeModal = document.querySelector('.closeModal');
    const viewOrdersBtn = document.getElementById('viewOrdersBtn');
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    if (viewOrdersBtn) {
        viewOrdersBtn.addEventListener('click', () => {
            window.location.href = '../History/history.html';
        });
    }
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function showOrderConfirmation(orderDetails) {
    const modal = document.getElementById('orderModal');
    const orderNumberElement = document.getElementById('orderNumber');
    const orderTotalElement = document.getElementById('orderTotal');
    
    if (orderNumberElement) {
        orderNumberElement.textContent = orderDetails.orderNumber;
    }
    
    if (orderTotalElement) {
        orderTotalElement.textContent = `₦${orderDetails.total.toLocaleString()}`;
    }
    
    modal.style.display = 'block';
    
    
    showNotification('Order placed successfully! Payment completed.', 'success');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1001;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    switch (type) {
        case 'error':
            notification.style.backgroundColor = '#8a5a8a';
            break;
        case 'success':
            notification.style.backgroundColor = '#8a5a8a';
            break;
        default:
            notification.style.backgroundColor = '#8a5a8a';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

function initializeLocation() {
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
}



function formatCurrency(amount) {
    return `₦${amount.toLocaleString()}`;
}

function generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
}

function initializeAutofill() {
    const autofillBtn = document.getElementById('autofillAddressBtn');
    console.log('Autofill button found:', autofillBtn);
        if (autofillBtn) {
        autofillBtn.addEventListener('click', autofillAddressFromLocation);
        console.log('Autofill click listener added');
    } else {
        console.log('Autofill button not found');
    }
    
    
    initializeHereAddressAutocomplete();
}

function initializeHereAddressAutocomplete() {
    const addressInput = document.getElementById('address');
    if (!addressInput) return;
    
    
    const autocompleteContainer = document.createElement('div');
    autocompleteContainer.id = 'addressAutocomplete';
    autocompleteContainer.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e0e0e0;
        border-top: none;
        border-radius: 0 0 8px 8px;
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
        display: none;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    `;
    
    addressInput.parentNode.style.position = 'relative';
    addressInput.parentNode.appendChild(autocompleteContainer);
    
    let currentRequest = null;
    
    addressInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query.length < 3) {
            autocompleteContainer.style.display = 'none';
            return;
        }
        
        
        if (currentRequest) {
            currentRequest.abort();
        }
        
        
        currentRequest = new AbortController();
        
        
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
        
        fetch(url, { signal: currentRequest.signal })
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    displayAutocompleteResults(data, autocompleteContainer, addressInput);
                } else {
                    autocompleteContainer.style.display = 'none';
                }
            })
            .catch(error => {
                if (error.name !== 'AbortError') {
                    console.log('Nominatim API error:', error);
                }
            });
    });
    
    
    document.addEventListener('click', function(e) {
        if (!addressInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
            autocompleteContainer.style.display = 'none';
        }
    });
}

function displayAutocompleteResults(results, container, input) {
    container.innerHTML = '';
    
    if (results.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    results.forEach(result => {
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
            font-size: 14px;
            color: #2d2d2d;
            transition: background-color 0.2s ease;
        `;
        
        
        const address = result.address || {};
        const displayText = result.display_name || result.name || 'Address';
        
        item.textContent = displayText;
        
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8f4f8';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'white';
        });
        
        item.addEventListener('click', function() {
            input.value = displayText;
            container.style.display = 'none';
            
            
            fillAddressFieldsFromNominatim(result);
        });
        
        container.appendChild(item);
    });
    
    container.style.display = 'block';
}

function fillAddressFieldsFromNominatim(result) {
    const address = result.address || {};
    
    
    const cityInput = document.getElementById('city');
    if (cityInput) {
        const city = address.city || address.town || address.village || address.municipality || '';
        cityInput.value = city;
    }
    
    
    const stateInput = document.getElementById('state');
    if (stateInput) {
        const state = address.state || address.province || address.region || '';
        if (state) {
            const stateOptions = Array.from(stateInput.options);
            const matchingState = stateOptions.find(option => 
                option.value.toLowerCase() === state.toLowerCase() ||
                option.text.toLowerCase() === state.toLowerCase()
            );
            if (matchingState) {
                stateInput.value = matchingState.value;
            }
        }
    }
    
    
    const zipInput = document.getElementById('zipCode');
    if (zipInput) {
        const zipCode = address.postcode || address.postal_code || '';
        zipInput.value = zipCode;
    }
    
    
    const countrySelect = document.getElementById('country');
    if (countrySelect) {
        const country = address.country || '';
        if (country) {
            const countryOptions = Array.from(countrySelect.options);
            const matchingCountry = countryOptions.find(option => 
                option.value.toLowerCase() === country.toLowerCase() ||
                option.text.toLowerCase() === country.toLowerCase()
            );
            if (matchingCountry) {
                countrySelect.value = matchingCountry.value;
                
                updateStatesForCountry(countrySelect.value);
            }
        }
    }
    
    
}

function fillAddressFields(address) {
    
    const cityInput = document.getElementById('city');
    if (cityInput && address.City) {
        cityInput.value = address.City;
    }
    
    
    const stateInput = document.getElementById('state');
    if (stateInput && address.State) {
        const stateOptions = Array.from(stateInput.options);
        const matchingState = stateOptions.find(option => 
            option.value.toLowerCase() === address.State.toLowerCase() ||
            option.text.toLowerCase() === address.State.toLowerCase()
        );
        if (matchingState) {
            stateInput.value = matchingState.value;
        }
    }
    
    
    const zipInput = document.getElementById('zipCode');
    if (zipInput && address.PostalCode) {
        zipInput.value = address.PostalCode;
    }
    
    
    const countrySelect = document.getElementById('country');
    if (countrySelect && address.Country) {
        const countryOptions = Array.from(countrySelect.options);
        const matchingCountry = countryOptions.find(option => 
            option.value.toLowerCase() === address.Country.toLowerCase() ||
            option.text.toLowerCase() === address.Country.toLowerCase()
        );
        if (matchingCountry) {
            countrySelect.value = matchingCountry.value;
            
            updateStatesForCountry(countrySelect.value);
        }
    }
    
    
}

async function autofillAddressFromLocation() {
    console.log('Autofill function called');
    const autofillBtn = document.getElementById('autofillAddressBtn');
    const originalText = autofillBtn.innerHTML;
    
    
    autofillBtn.innerHTML = '<span>Detecting location...</span>';
    autofillBtn.disabled = true;
    
    try {
        const addressData = await getLocationAddress();
        
        if (addressData) {
            
            const addressInput = document.getElementById('address');
            const cityInput = document.getElementById('city');
            const stateInput = document.getElementById('state');
            const zipCodeInput = document.getElementById('zipCode');
            const countrySelect = document.getElementById('country');
            
            console.log('Form fields found:', {
                address: addressInput,
                city: cityInput,
                state: stateInput,
                zipCode: zipCodeInput,
                country: countrySelect
            });
            
            console.log('Address data to fill:', addressData);
            
                         
             if (addressInput) {
                 addressInput.value = addressData.street || '';
                 console.log('Set address to:', addressInput.value);
             }
             if (cityInput) {
                 cityInput.value = addressData.city || '';
                 console.log('Set city to:', cityInput.value);
             }
             
             
             if (stateInput && addressData.state) {
                 
                 const stateOptions = Array.from(stateInput.options);
                 const matchingState = stateOptions.find(option => 
                     option.value.toLowerCase() === addressData.state.toLowerCase() ||
                     option.text.toLowerCase() === addressData.state.toLowerCase()
                 );
                 
                 if (matchingState) {
                     stateInput.value = matchingState.value;
                     console.log('Set state to:', stateInput.value);
                 } else {
                     
                     const partialMatch = stateOptions.find(option => 
                         option.value.toLowerCase().includes(addressData.state.toLowerCase()) ||
                         addressData.state.toLowerCase().includes(option.value.toLowerCase())
                     );
                     if (partialMatch) {
                         stateInput.value = partialMatch.value;
                         console.log('Set state to (partial match):', stateInput.value);
                     }
                 }
             }
             
             if (zipCodeInput) {
                 zipCodeInput.value = addressData.zipCode || '';
                 console.log('Set zipCode to:', zipCodeInput.value);
             }
            
            
            if (countrySelect && addressData.country) {
                const countryName = addressData.country.toLowerCase();
                console.log('Looking for country:', countryName);
                
                const options = Array.from(countrySelect.options);
                console.log('Available country options:', options.map(opt => ({ value: opt.value, text: opt.text })));
                
                
                let matchingOption = options.find(option => 
                    option.value.toLowerCase() === countryName || 
                    option.text.toLowerCase() === countryName
                );
                
                
                if (!matchingOption) {
                    matchingOption = options.find(option => 
                        countryName.includes(option.value.toLowerCase()) ||
                        option.value.toLowerCase().includes(countryName) ||
                        countryName.includes(option.text.toLowerCase()) ||
                        option.text.toLowerCase().includes(countryName)
                    );
                }
                
                
                if (!matchingOption) {
                    const countryMappings = {
                        'nigeria': 'Nigeria',
                        'ghana': 'Ghana', 
                        'kenya': 'Kenya',
                        'south africa': 'South Africa',
                        'united states': 'Nigeria',
                        'usa': 'Nigeria',
                        'us': 'Nigeria'
                    };
                    
                    const mappedCountry = countryMappings[countryName];
                    if (mappedCountry) {
                        matchingOption = options.find(option => option.value === mappedCountry);
                    }
                }
                
                                                 if (matchingOption) {
                    countrySelect.value = matchingOption.value;
                    console.log('Set country to:', countrySelect.value);
                    
                    
                    updateStatesForCountry(countrySelect.value);
                } else {
                    console.log('No country match found for:', countryName);
                }
            }
            
            console.log('Final form values:', {
                street: addressInput?.value,
                city: cityInput?.value,
                state: stateInput?.value,
                zipCode: zipCodeInput?.value,
                country: countrySelect?.value
            });
            
            
        } else {
            showNotification('Could not detect your location. Please fill manually.', 'error');
        }
    } catch (error) {
        console.error('Autofill error:', error);
        showNotification('Location detection failed. Please fill manually.', 'error');
    } finally {
        
        autofillBtn.innerHTML = originalText;
        autofillBtn.disabled = false;
    }
}

async function getLocationAddress() {
    const apis = [
        'https://ipapi.co/json/',
        'https://ipinfo.io/json',
        'https://api.ipgeolocation.io/ipgeo?apiKey=free'
    ];
    
    for (let api of apis) {
        try {
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
            console.log('API Response:', data);
            

            let street = data.street || data.address || data.road || data.streetName || data.street_number || '';
            

            if (!street) {
                const parts = [];
                if (data.streetNumber) parts.push(data.streetNumber);
                if (data.road) parts.push(data.road);
                if (data.neighbourhood) parts.push(data.neighbourhood);
                if (data.suburb) parts.push(data.suburb);
                if (parts.length > 0) {
                    street = parts.join(', ');
                } else if (data.city) {
                    street = `Main Street, ${data.city}`;
                }
            }
            
            const addressData = {
                street: street,
                city: data.city || data.loc?.split(',')[0] || data.locality || data.town || data.municipality || '',
                state: data.region || data.state || data.regionName || data.principalSubdivision || data.admin1 || data.province || '',
                zipCode: data.postal || data.zip || data.postcode || data.postalCode || data.postal_code || '',
                country: data.country || data.countryName || data.countryCode || data.country_name || ''
            };
            
            console.log('Raw API data:', data);
            console.log('Extracted address data:', addressData);
            

            if (addressData.city || addressData.state || addressData.country) {
                console.log('Extracted address data:', addressData);
                return addressData;
            }
        } catch (error) {
            console.log(`Failed ${api}:`, error);
            continue;
        }
    }
    
    
    if (navigator.geolocation) {
        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                async function(position) {
                    try {
                        const { latitude, longitude } = position.coords;
                        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                        const data = await response.json();
                        console.log('Geolocation API Response:', data);
                        
                        let street = data.street || data.road || data.streetName || '';
                        
                        
                        if (!street) {
                            const parts = [];
                            if (data.streetNumber) parts.push(data.streetNumber);
                            if (data.road) parts.push(data.road);
                            if (data.neighbourhood) parts.push(data.neighbourhood);
                            if (data.suburb) parts.push(data.suburb);
                            if (parts.length > 0) {
                                street = parts.join(', ');
                            } else if (data.city) {
                                street = `Main Street, ${data.city}`;
                            }
                        }
                        
                        const addressData = {
                            street: street,
                            city: data.city || data.locality || data.town || '',
                            state: data.principalSubdivision || data.state || data.admin1 || '',
                            zipCode: data.postcode || data.postalCode || '',
                            country: data.countryName || data.country || data.countryCode || ''
                        };
                        
                        console.log('Geolocation extracted address data:', addressData);
                        resolve(addressData);
                    } catch (error) {
                        console.log('Geolocation error:', error);
                        resolve(null);
                    }
                },
                function(error) {
                    console.log('Geolocation permission error:', error);
                    resolve(null);
                },
                { timeout: 10000, enableHighAccuracy: false }
            );
        });
    }
    
    return null;
}

function initializeCountryStateMapping() {
    const countrySelect = document.getElementById('country');
    const stateSelect = document.getElementById('state');
    
    if (countrySelect && stateSelect) {
        
        countrySelect.addEventListener('change', function() {
            updateStatesForCountry(this.value);
        });
        console.log('Country-state restriction enabled - states will be filtered by country');
    }
}



function updateStatesForCountry(country) {
    const stateSelect = document.getElementById('state');
    if (!stateSelect) return;
    
    
    stateSelect.innerHTML = '<option value="">Select State</option>';
    
    const states = getStatesForCountry(country);
    if (states && states.length > 0) {
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelect.appendChild(option);
        });
        stateSelect.disabled = false;
    } else {
        stateSelect.disabled = true;
    }
}


function showHapiPayQR() {
    const modal = document.getElementById('qrCodeModal');
    const canvas = document.getElementById('qrCodeCanvas');
    
    if (!modal || !canvas) {
        console.error('QR modal or canvas not found');
        return;
    }
    
    
    const totalAmount = document.getElementById('totalCost').textContent;
    const randomOrderId = 'HAPI-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const timestamp = new Date().toISOString();
    
    
    const paymentData = {
        merchant: 'Happie Store',
        amount: totalAmount,
        orderId: randomOrderId,
        currency: 'NGN',
        timestamp: timestamp,
        paymentMethod: 'hapipay',
        security: 'secure-payment-' + Math.random().toString(36).substr(2, 6)
    };
    
    
    const qrData = JSON.stringify(paymentData);
    
    
    document.getElementById('qrAmount').textContent = totalAmount;
    document.getElementById('qrOrderId').textContent = randomOrderId;
    
    console.log('Generating scannable QR code for:', qrData);
    
    
    modal.style.display = 'block';
    
    
    generateScannableQRCode(canvas, qrData);
    
    
    setupQRModalListeners(modal);
}


function generateScannableQRCode(canvas, data) {
    console.log('Attempting to generate QR code with qrcode-generator...');
    
    
    function tryGenerateQR() {
        try {
            
            if (typeof qrcode === 'undefined') {
                console.log('qrcode-generator library not ready, retrying in 1 second...');
                setTimeout(tryGenerateQR, 1000);
                return;
            }
            
            console.log('qrcode-generator library found, generating QR code...');
            
            
            const qr = qrcode(0, 'M');
            qr.addData(data);
            qr.make();
            
            
            const svg = qr.createSvgTag({
                cellSize: 8,
                margin: 4,
                scalable: true
            });
            
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = svg;
            const svgElement = tempDiv.firstChild;
            
            
            canvas.style.display = 'none';
            const canvasContainer = canvas.parentElement;
            canvasContainer.appendChild(svgElement);
            
            console.log('✅ QR code generated successfully using qrcode-generator');
            
        } catch (error) {
            console.error('QR Code generation error:', error);
            showPaymentDataFallback(canvas, data);
        }
    }
    
    
    tryGenerateQR();
}


function showPaymentDataFallback(canvas, data) {
    canvas.style.display = 'none';
    const fallbackDiv = document.createElement('div');
    fallbackDiv.innerHTML = `
        <div style="padding: 20px; background: white; border-radius: 8px; border: 1px solid #e0e0e0; text-align: center;">
            <h5 style="margin: 0 0 15px 0; color: #2d2d2d;">Payment Data for HapiPay</h5>
            <p style="margin: 5px 0; color: #666;">Copy this data to your HapiPay app:</p>
            <textarea style="width: 100%; height: 100px; margin-top: 10px; padding: 10px; border: 1px solid #e0e0e0; border-radius: 4px; font-family: monospace; font-size: 12px;" readonly>${data}</textarea>
            <button onclick="navigator.clipboard.writeText('${data}').then(() => alert('Payment data copied!')).catch(() => alert('Copy failed'))" style="margin-top: 10px; padding: 8px 16px; background: #8a5a8a; color: white; border: none; border-radius: 4px; cursor: pointer;">Copy Data</button>
        </div>
    `;
    canvas.parentNode.appendChild(fallbackDiv);
}


function setupQRModalListeners(modal) {
    const closeModal = modal.querySelector('.closeModal');
    const refreshBtn = document.getElementById('refreshQRBtn');
    const copyBtn = document.getElementById('copyPaymentLinkBtn');
    
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            showHapiPayQR();
        });
    }
    
    
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const totalAmount = document.getElementById('totalCost').textContent;
            const orderId = document.getElementById('qrOrderId').textContent;
            const paymentLink = `hapipay://pay?amount=${totalAmount}&orderId=${orderId}`;
            
            navigator.clipboard.writeText(paymentLink).then(() => {
                showNotification('Payment link copied to clipboard', 'success');
            }).catch(() => {
                showNotification('Failed to copy payment link', 'error');
            });
        });
    }
}



function getStatesForCountry(country) {
    const stateData = {
        'Nigeria': [
            'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 
            'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Federal Capital Territory', 
            'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 
            'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 
            'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
        ],
        'Ghana': [
            'Ashanti', 'Bono', 'Central', 'Eastern', 'Greater Accra', 'Northern', 'Savannah', 
            'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'
        ],
        'Kenya': [
            'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo Marakwet', 'Embu', 'Garissa', 
            'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 
            'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 
            'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a', 
            'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 
            'Siaya', 'Taita Taveta', 'Tana River', 'Tharaka Nithi', 'Trans Nzoia', 'Turkana', 
            'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
        ],
        'South Africa': [
            'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 
            'Northern Cape', 'North West', 'Western Cape'
        ],
        'United States': [
            'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
            'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
            'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
            'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
            'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
            'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
            'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
            'Wisconsin', 'Wyoming'
        ],
        'Canada': [
            'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 
            'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 
            'Quebec', 'Saskatchewan', 'Yukon'
        ],
        'United Kingdom': [
            'England', 'Scotland', 'Wales', 'Northern Ireland'
        ],
        'Australia': [
            'Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland', 
            'South Australia', 'Tasmania', 'Victoria', 'Western Australia'
        ],
        'India': [
            'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 
            'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 
            'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 
            'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 
            'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
        ],
        'Germany': [
            'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 
            'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 
            'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 
            'Thuringia'
        ],
        'France': [
            'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Bretagne', 'Centre-Val de Loire', 
            'Corse', 'Grand Est', 'Hauts-de-France', 'Île-de-France', 'Normandie', 'Nouvelle-Aquitaine', 
            'Occitanie', 'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur'
        ],
        'Brazil': [
            'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal', 
            'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul', 
            'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro', 
            'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 'Roraima', 'Santa Catarina', 
            'São Paulo', 'Sergipe', 'Tocantins'
        ],
        'Mexico': [
            'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 
            'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 
            'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 
            'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 
            'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
        ],
        'Morocco': [
            'Agadir-Ida-Ou-Tanane', 'Al Haouz', 'Al Hoceima', 'Aousserd', 'Assa-Zag', 'Azilal', 
            'Béni Mellal', 'Béni Mellal-Khénifra', 'Berkane', 'Berrechid', 'Boujdour', 'Boulemane', 
            'Casablanca', 'Casablanca-Settat', 'Chefchaouen', 'Chichaoua', 'Chtouka-Ait Baha', 
            'Dakhla-Oued Ed-Dahab', 'Drâa-Tafilalet', 'El Hajeb', 'El Jadida', 'El Kelâa des Sraghna', 
            'Errachidia', 'Essaouira', 'Fahs-Anjra', 'Fès', 'Fès-Meknès', 'Figuig', 'Fquih Ben Salah', 
            'Guelmim', 'Guelmim-Oued Noun', 'Ifrane', 'Inezgane-Ait Melloul', 'Jerada', 'Kénitra', 
            'Kénitra-Salé', 'Khemisset', 'Khenifra', 'Khouribga', 'Laâyoune', 'Laâyoune-Sakia El Hamra', 
            'Larache', 'Marrakech', 'Marrakech-Safi', 'Médiouna', 'Meknès', 'Midelt', 'Mohammedia', 
            'Moulay Yacoub', 'Nador', 'Nouaceur', 'Ouarzazate', 'Oued Ed-Dahab', 'Ouezzane', 'Oujda-Angad', 
            'Rabat', 'Rabat-Salé-Kénitra', 'Rehamna', 'Safi', 'Salé', 'Sefrou', 'Settat', 'Sidi Bennour', 
            'Sidi Ifni', 'Sidi Kacem', 'Sidi Slimane', 'Skhirate-Témara', 'Tanger', 'Tanger-Tétouan-Al Hoceima', 
            'Tan-Tan', 'Taounate', 'Taourirt', 'Tarfaya', 'Taroudant', 'Tata', 'Taza', 'Tétouan', 
            'Tiflet', 'Tinghir', 'Tiznit', 'Youssoufia', 'Zagora'
        ]
    };
    
    return stateData[country] || [];
}



window.checkoutUtils = {
    validateField,
    showNotification,
    formatCurrency,
    generateOrderNumber
};

