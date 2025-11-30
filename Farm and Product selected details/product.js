function updateSubtotal() {
    let subtotal = 0;
    for (let i = 2; i <= 5; i++) {
        const quantityInput = document.getElementById(`cardQuantity${i}`);
        if (quantityInput) {
            const quantity = parseInt(quantityInput.value) || 0;
            const card = quantityInput.closest('.sideProductCard');
            const priceBox = card.querySelector('.sidePrice');
            const pricePerUnit = parseInt(priceBox.getAttribute('data-unit-price'), 10) || 0;
            subtotal += pricePerUnit * quantity;
        }
    }
    const subTotalBox = document.querySelector('.subTotalBox');
    if (subTotalBox) {
        if (subtotal > 0) {
            subTotalBox.textContent = `Sub-total = ₦${subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            subTotalBox.style.marginLeft = '-80px';
        } else {
            subTotalBox.textContent = 'Sub-total ';
            subTotalBox.style.marginLeft = '0';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const descBox = document.querySelector('.productDescriptionDemo p');
    const originalDescription = descBox ? descBox.textContent : '';
    updateSubtotal();
    
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
	
	// Cart badge functionality
	function updateCartBadge() {
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

	// Update cart badge on page load
	updateCartBadge();

	// Listen for storage changes to update cart badge
	window.addEventListener('storage', (e) => {
		if (e.key === 'guestCart' || e.key.startsWith('cart_')) {
			updateCartBadge();
		}
	});

	// Update cart badge periodically
	setInterval(updateCartBadge, 2000);

	const searchInput = document.querySelector('.searchBar');
	const searchButton = document.querySelector('.searchButton');
	if (!searchInput || !searchButton) return;

	const KEY = 'recentSearch';
	const LIMIT = 30;
	const truncate = v => v && v.length > LIMIT ? v.slice(0, LIMIT) + '…' : v;

	try {
		const last = localStorage.getItem(KEY);
		if (last && !searchInput.value) searchInput.placeholder = truncate(last) || searchInput.placeholder;
	} catch {}

	const save = () => {
		const val = searchInput.value.trim();
		if (!val) return;
		try { localStorage.setItem(KEY, val); } catch {}
		searchInput.value = '';
		searchInput.placeholder = truncate(val) || searchInput.placeholder;
	};

	searchButton.addEventListener('click', save);
	searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { save(); e.preventDefault(); }});

	const containerImage = document.querySelector('.containerImage');
	if (containerImage) {
		containerImage.addEventListener('click', () => {
			containerImage.classList.toggle('expanded');
		});
	}
});

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function decreaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    let currentValue = parseInt(quantityInput.value);
    if (currentValue > 0) {
        quantityInput.value = currentValue - 1;
    }
}

function increaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    let currentValue = parseInt(quantityInput.value);
    if (currentValue < 50) {
        quantityInput.value = currentValue + 1;
    }
}

function addToCart() {
    const quantity = parseInt(document.getElementById('quantity').value);
    const product = {
        id: 'main-rice',
        name: 'Premium Rice',
        price: 2500,
        image: 'pageImages/rice.jpg',
        quantity: quantity
    };
    addProductToCart(product);
    showNotification(`${quantity} x ${product.name} added to cart!`);
}

function decreaseCardQuantity(cardId) {
    const quantityInput = document.getElementById(`cardQuantity${cardId}`);
    let currentValue = parseInt(quantityInput.value);
    if (currentValue > 0) {
        quantityInput.value = currentValue - 1;
        updateSideDisplayedPrice(cardId);
        updateSubtotal();
    }
}

function updateSideDisplayedPrice(cardId) {
    const card = document.getElementById(`cardQuantity${cardId}`)?.closest('.sideProductCard');
    if (!card) return;
    const priceBox = card.querySelector('.sidePrice');
    const priceText = priceBox?.getAttribute('data-unit-price') || '0';
    const pricePerUnit = parseInt(priceText, 10);
    const quantityInput = document.getElementById(`cardQuantity${cardId}`);
    if (quantityInput && priceBox) {
        const quantity = parseInt(quantityInput.value);
        const totalPrice = pricePerUnit * quantity;
        priceBox.textContent = `₦${totalPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
}

function increaseCardQuantity(cardId) {
    const quantityInput = document.getElementById(`cardQuantity${cardId}`);
    let currentValue = parseInt(quantityInput.value);
    if (currentValue < 50) {
        quantityInput.value = currentValue + 1;
        updateSideDisplayedPrice(cardId);
        updateSubtotal();
    } 
    for (let i = 2; i <= 5; i++) {
        const quantityInput = document.getElementById(`cardQuantity${i}`);
        if (quantityInput) quantityInput.addEventListener('input', updateSubtotal);
    }
    updateSubtotal();
}

function addCardToCart(cardId) {
    const quantity = parseInt(document.getElementById(`cardQuantity${cardId}`).value);
    const card = document.getElementById(`cardQuantity${cardId}`)?.closest('.sideProductCard');
    if (!card) return;
    const name = card.querySelector('.sideProductInfo h4')?.textContent?.trim() || '';
    const priceBox = card.querySelector('.sidePrice');
    const priceText = priceBox?.getAttribute('data-unit-price') || '0';
    const pricePerUnit = parseInt(priceText, 10);
    const price = pricePerUnit * quantity;
    const image = card.querySelector('.sideProductImage')?.getAttribute('src') || '';
    const product = {
        id: `side-${cardId}`,
        name,
        price,
        image,
        quantity
    };
    addProductToCart(product);
    showNotification(`${quantity} x ${name} added to cart!`);
}

function addProductToCart(product) {
    const existingProductIndex = cart.findIndex(item => item.id === product.id);
    if (existingProductIndex > -1) {
        cart[existingProductIndex].quantity += product.quantity;
    } else {
        cart.push(product);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartLinks = document.querySelectorAll('.iconLink');
    let cartLink = null;
    cartLinks.forEach(link => {
        const text = link.querySelector('.linkText');
        if (text && text.textContent.trim() === 'Cart') {
            cartLink = link;
        }
    });
    if (cartLink) {
        let badge = cartLink.querySelector('.cart-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cart-badge';
            badge.style.cssText = `
                position: absolute;
                top: -5px;
                right: -5px;
                background: #8a5a8a;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            `;
            cartLink.style.position = 'relative';
            cartLink.appendChild(badge);
        }
        if (totalItems > 0) {
            badge.textContent = totalItems;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function showNotification(message) {
    const notification = document.getElementById('cartNotification');
    const notificationText = document.getElementById('notificationText');
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();

    const activeCard = document.querySelector('.sideProductCard.active');
    if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const sideCards = document.querySelectorAll('.sideProductCard');
    sideCards.forEach(card => {
        card.addEventListener('click', () => {
            sideCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            const imgSrc = card.querySelector('.sideProductImage')?.getAttribute('src');
            const name = card.querySelector('.sideProductInfo h4')?.textContent?.trim() || '';
            const price = card.querySelector('.sidePriceDemo, .sidePrice')?.textContent?.trim() || '';

            const mainImg = document.querySelector('.productDetailImage');
            if (mainImg && imgSrc) {
                mainImg.setAttribute('src', imgSrc);
                mainImg.setAttribute('alt', name);
            }
            const descBox = document.querySelector('.productDescriptionDemo p');
            const customDesc = card.querySelector('.sideProductDescriptionDemo')?.textContent?.trim();
            if (descBox) {
                descBox.textContent = customDesc || '';
            }
            
            const priceBox = document.getElementById('mainProductPrice');
            const quantityInput = card.querySelector('input[type="number"]');
            const quantity = quantityInput ? parseInt(quantityInput.value) : 0;
            if (priceBox) {
                if (quantity > 0) {
                    priceBox.innerHTML = `${price} <span class='price-separator'></span><span style='margin-left:8px;'>${quantity}kg</span>`;
                } else {
                    priceBox.innerHTML = '';
                }
            }
        });
    
    const originalCard = document.querySelector('.sideProductCard.active');
    if (originalCard) {
        originalCard.classList.add('original-card');
    }
    });
});

function addToCartButtonNew() {
    console.log('=== ADD TO CART BUTTON CLICKED ===');
    
    // Test notification first
    showNotification('Testing notification...');
    
    let cartItems = [];
    let totalQuantity = 0;
    
    // Collect all selected items
    for (let i = 2; i <= 5; i++) {
        const quantityInput = document.getElementById(`cardQuantity${i}`);
        console.log(`Checking card ${i}, input found:`, !!quantityInput);
        
        if (quantityInput) {
            const quantity = parseInt(quantityInput.value) || 0;
            console.log(`Card ${i} quantity:`, quantity);
            
            if (quantity > 0) {
                const card = quantityInput.closest('.sideProductCard');
                const name = card.querySelector('.sideProductInfo h4').textContent.trim();
                const priceBox = card.querySelector('.sidePrice');
                const pricePerUnit = parseInt(priceBox.getAttribute('data-unit-price'), 10);
                const image = card.querySelector('.sideProductImage').getAttribute('src');
                
                cartItems.push({
                    id: `side-${i}`,
                    name,
                    price: pricePerUnit,
                    image,
                    quantity
                });
                
                totalQuantity += quantity;
                console.log(`Added item: ${name}, Quantity: ${quantity}, Price: ${pricePerUnit}`);
            }
        }
    }
    
    console.log('Total cart items to add:', cartItems);
    console.log('Total quantity:', totalQuantity);
    
    if (cartItems.length > 0) {
        // Simple direct save to localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        let cartKey = 'guestCart';
        
        if (currentUser) {
            cartKey = `cart_${currentUser.email}`;
        }
        
        console.log('Using cart key:', cartKey);
        
        const existingCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        console.log('Existing cart:', existingCart);
        
        // Add new items to cart
        cartItems.forEach(item => {
            const existingItem = existingCart.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                existingItem.quantity += item.quantity;
                console.log(`Updated existing item: ${item.name}, new quantity: ${existingItem.quantity}`);
            } else {
                existingCart.push(item);
                console.log(`Added new item: ${item.name}, quantity: ${item.quantity}`);
            }
        });
        
        localStorage.setItem(cartKey, JSON.stringify(existingCart));
        console.log('Items saved to cart:', cartKey);
        console.log('Final cart contents:', existingCart);
        
        // Update cart badge
        updateCartBadge();
        
        // Show success message
        showNotification(`Added ${totalQuantity} items to cart!`);
        
        console.log('Add to cart completed successfully');
    } else {
        showNotification('No products selected.');
        console.log('No items selected');
    }
    
    console.log('=== ADD TO CART FUNCTION ENDED ===');
}



function updateCartBadge() {
    // Get total items from cart
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    let totalItems = 0;
    
    if (currentUser) {
        const userCartKey = `cart_${currentUser.email}`;
        const userCart = JSON.parse(localStorage.getItem(userCartKey) || '[]');
        totalItems = userCart.reduce((sum, item) => sum + item.quantity, 0);
    } else {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        totalItems = guestCart.reduce((sum, item) => sum + item.quantity, 0);
    }
    
    // Find cart icon and update badge
    const cartLinks = document.querySelectorAll('.iconLink');
    cartLinks.forEach(link => {
        const text = link.querySelector('.linkText');
        if (text && text.textContent.trim() === 'Cart') {
            let badge = link.querySelector('.cart-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'cart-badge';
                badge.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #8a5a8a;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                `;
                link.style.position = 'relative';
                link.appendChild(badge);
            }
            
            if (totalItems > 0) {
                badge.textContent = totalItems;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    });
    
    console.log('Cart badge updated with', totalItems, 'items');
}

function buyNow() {
    // Calculate total price from all selected products
    let totalPrice = 0;
    let cartItems = [];
    
    console.log('Buy Now function called');
    
    for (let i = 2; i <= 5; i++) {
        const quantityInput = document.getElementById(`cardQuantity${i}`);
        if (quantityInput) {
            const quantity = parseInt(quantityInput.value);
            console.log(`Card ${i} quantity:`, quantity);
            
            if (quantity > 0) {
                const card = quantityInput.closest('.sideProductCard');
                const name = card.querySelector('.sideProductInfo h4').textContent.trim();
                const priceBox = card.querySelector('.sidePrice');
                const pricePerUnit = parseInt(priceBox.getAttribute('data-unit-price'), 10);
                const image = card.querySelector('.sideProductImage').getAttribute('src');
                const itemPrice = pricePerUnit * quantity;
                
                console.log(`Adding item: ${name}, Quantity: ${quantity}, Price: ${itemPrice}, Image: ${image}`);
                
                totalPrice += itemPrice;
                cartItems.push({
                    id: `side-${i}`,
                    name,
                    price: pricePerUnit, // Store unit price, not total
                    image,
                    quantity
                });
            }
        }
    }
    
    console.log('Final cart items:', cartItems);
    console.log('Final total price:', totalPrice);
    
    // Add items to cart first
    if (window.cart) {
        cartItems.forEach(item => window.cart.addItem(item));
    } else {
        // Fallback: store in localStorage
        const existingCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        cartItems.forEach(item => {
            const existingItem = existingCart.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                existingItem.quantity += item.quantity;
            } else {
                existingCart.push(item);
            }
        });
        localStorage.setItem('guestCart', JSON.stringify(existingCart));
    }
    
    // Store the cart data and total price in localStorage for checkout
    localStorage.setItem('checkoutCart', JSON.stringify(cartItems));
    localStorage.setItem('checkoutTotal', totalPrice.toString());
    
    console.log('Data stored in localStorage');
    console.log('checkoutCart:', localStorage.getItem('checkoutCart'));
    console.log('checkoutTotal:', localStorage.getItem('checkoutTotal'));
    
    // Show success message
    showNotification('Redirecting to checkout...', 'success');
    
    // Redirect to checkout page after a short delay to ensure data is saved
    setTimeout(() => {
        window.location.href = '../Checkout/checkout.html';
    }, 500);
}