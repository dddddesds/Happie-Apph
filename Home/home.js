
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

    const searchInput = document.querySelector('.searchBar');
    const searchButton = document.querySelector('.searchButton');
    
    if (!searchInput || !searchButton) {
        console.log('Search elements not found');
        return;
    }

    const KEY = 'recentSearch';
    const LIMIT = 30;
    const truncate = v => v && v.length > LIMIT ? v.slice(0, LIMIT) + '…' : v;

    try {
        const last = localStorage.getItem(KEY);
        if (last && !searchInput.value) {
            searchInput.placeholder = truncate(last) || searchInput.placeholder;
        }
    } catch (error) {
        console.log('Error loading last search:', error);
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

    const saveSearch = () => {
        const val = searchInput.value.trim();
        if (!val) {
            searchInput.focus();
            return;
        }
        
        try {
            localStorage.setItem(KEY, val);
            console.log('Search saved:', val);
            
            searchInput.value = '';
            searchInput.placeholder = truncate(val) || searchInput.placeholder;
            
            searchInput.style.borderColor = '#4caf50';
            setTimeout(() => {
                searchInput.style.borderColor = '#8a5a8a';
            }, 1000);
            
        } catch (error) {
            console.log('Error saving search:', error);
        }
    };

    searchButton.addEventListener('click', saveSearch);
    searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            saveSearch();
            e.preventDefault();
        }
    });

    searchButton.addEventListener('mouseenter', () => {
        searchButton.style.transform = 'scale(1.05)';
    });
    
    searchButton.addEventListener('mouseleave', () => {
        searchButton.style.transform = 'scale(1)';
    });

    searchInput.addEventListener('focus', () => {
        searchInput.style.boxShadow = '0 0 8px rgba(138, 90, 138, 0.3)';
    });
    
    searchInput.addEventListener('blur', () => {
        searchInput.style.boxShadow = 'none';
    });
});

