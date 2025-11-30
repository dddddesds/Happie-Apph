class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isSignUpMode = false;
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupAuthModal();
        this.setupHeaderAuth();
        this.hideExtraFields();
    }

    checkAuthStatus() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUIForAuthenticatedUser();
        } else {
            this.updateUIForUnauthenticatedUser();
        }
    }

    setupAuthModal() {
        const authModal = document.getElementById('authModal');
        if (!authModal) return;

        const authForm = document.getElementById('authForm');
        const toggleAuthBtn = document.getElementById('toggleAuthBtn');
        const authTitle = document.getElementById('authTitle');
        const authSubmitBtn = document.getElementById('authSubmitBtn');
        const closeModal = authModal.querySelector('.closeModal');

        if (authForm) {
            authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAuthSubmit();
            });
        }

        if (toggleAuthBtn) {
            toggleAuthBtn.addEventListener('click', () => {
                this.toggleAuthMode();
            });
        }

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.hideAuthModal();
            });
        }

        window.addEventListener('click', (event) => {
            if (event.target === authModal) {
                this.hideAuthModal();
            }
        });
    }

    setupHeaderAuth() {
        const accountLink = document.querySelector('.iconLink .linkText');
        if (accountLink) {
            const accountContainer = accountLink.closest('a');
            if (accountContainer) {
                accountContainer.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (this.currentUser) {
                        this.showUserProfile();
                    } else {
                        this.showAuthModal();
                    }
                });
            }
        }
    }

    toggleAuthMode() {
        this.isSignUpMode = !this.isSignUpMode;
        
        const authTitle = document.getElementById('authTitle');
        const authSubmitBtn = document.getElementById('authSubmitBtn');
        const toggleAuthBtn = document.getElementById('toggleAuthBtn');
        const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
        const authNameGroup = document.getElementById('authNameGroup');
        const authPhoneGroup = document.getElementById('authPhoneGroup');

        console.log('Toggle Auth Mode - isSignUpMode:', this.isSignUpMode);
        console.log('Elements found:', {
            confirmPasswordGroup: !!confirmPasswordGroup,
            authNameGroup: !!authNameGroup,
            authPhoneGroup: !!authPhoneGroup
        });

        if (this.isSignUpMode) {
            authTitle.textContent = 'Create Account';
            authSubmitBtn.textContent = 'Sign Up';
            toggleAuthBtn.textContent = 'Already have an account?';
            if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'block';
            if (authNameGroup) authNameGroup.style.display = 'block';
            if (authPhoneGroup) authPhoneGroup.style.display = 'block';
            console.log('Showing all fields');
        } else {
            authTitle.textContent = 'Sign In';
            authSubmitBtn.textContent = 'Sign In';
            toggleAuthBtn.textContent = 'Create Account';
            if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'none';
            if (authNameGroup) authNameGroup.style.display = 'none';
            if (authPhoneGroup) authPhoneGroup.style.display = 'none';
            console.log('Hiding extra fields');
        }
    }

    handleAuthSubmit() {
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;

        if (this.isSignUpMode) {
            const confirmPassword = document.getElementById('authConfirmPassword').value;
            const name = document.getElementById('authName').value;
            const phone = document.getElementById('authPhone').value;

            if (password !== confirmPassword) {
                this.showNotification('Passwords do not match', 'error');
                return;
            }

            if (!name || !phone) {
                this.showNotification('Please fill in all required fields', 'error');
                return;
            }

            this.signUp(email, password, name, phone);
        } else {
            this.signIn(email, password);
        }
    }

    signUp(email, password, name, phone) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        if (users.find(user => user.email === email)) {
            this.showNotification('Email already registered', 'error');
            return;
        }

        const newUser = {
            id: Date.now().toString(),
            email,
            password,
            name,
            phone,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        this.currentUser = { ...newUser };
        delete this.currentUser.password;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        this.showNotification('Account created successfully!', 'success');
        this.hideAuthModal();
        this.updateUIForAuthenticatedUser();
    }

    signIn(email, password) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            this.showNotification('Invalid email or password', 'error');
            return;
        }

        this.currentUser = { ...user };
        delete this.currentUser.password;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        this.showNotification('Signed in successfully!', 'success');
        this.hideAuthModal();
        this.updateUIForAuthenticatedUser();
    }

    signOut() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showNotification('Signed out successfully', 'info');
        this.updateUIForUnauthenticatedUser();
        
        if (window.location.pathname.includes('checkout.html')) {
            window.location.href = '../Home/home.html';
        }
    }

    showAuthModal() {
        const authModal = document.getElementById('authModal');
        const authFormContainer = document.getElementById('authFormContainer');
        const userInfo = document.getElementById('userInfo');
        
        if (authModal) {
            authModal.style.display = 'block';
            
            if (this.currentUser) {
                authFormContainer.style.display = 'none';
                userInfo.style.display = 'block';
                
                const authTitle = document.getElementById('authTitle');
                if (authTitle) authTitle.textContent = 'My Account';
                
                this.updateUIForAuthenticatedUser();
            } else {
                authFormContainer.style.display = 'block';
                userInfo.style.display = 'none';
                
                const authTitle = document.getElementById('authTitle');
                if (authTitle) authTitle.textContent = 'Sign In';
                
                this.isSignUpMode = false;
                this.toggleAuthMode();
            }
        }
    }

    hideAuthModal() {
        const authModal = document.getElementById('authModal');
        const authFormContainer = document.getElementById('authFormContainer');
        const userInfo = document.getElementById('userInfo');
        
        if (authModal) {
            authModal.style.display = 'none';
            
            const authForm = document.getElementById('authForm');
            if (authForm) authForm.reset();
            
            authFormContainer.style.display = 'block';
            userInfo.style.display = 'none';
        }
    }

    updateUIForAuthenticatedUser() {
        const accountLink = document.querySelector('.iconLink .linkText');
        if (accountLink) {
            accountLink.textContent = this.currentUser.name || 'My Account';
        }

        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');
            const userPhone = document.getElementById('userPhone');
            const editAccountBtn = document.getElementById('editAccountBtn');
            const signOutBtn = document.getElementById('signOutBtn');

            if (userName) userName.textContent = this.currentUser.name;
            if (userEmail) userEmail.textContent = this.currentUser.email;
            if (userPhone) userPhone.textContent = this.currentUser.phone;

            if (editAccountBtn) {
                editAccountBtn.addEventListener('click', () => {
                    this.showEditAccountModal();
                });
            }

            if (signOutBtn) {
                signOutBtn.addEventListener('click', () => {
                    this.signOut();
                });
            }
        }
    }

    updateUIForUnauthenticatedUser() {
        const accountLink = document.querySelector('.iconLink .linkText');
        if (accountLink) {
            accountLink.textContent = 'My Account';
        }

        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');
            const userPhone = document.getElementById('userPhone');

            if (userName) userName.textContent = 'Not signed in';
            if (userEmail) userEmail.textContent = 'Not signed in';
            if (userPhone) userPhone.textContent = 'Not signed in';
        }
    }

    showUserProfile() {
        const authModal = document.getElementById('authModal');
        const authFormContainer = document.getElementById('authFormContainer');
        const userInfo = document.getElementById('userInfo');
        
        if (authModal) {
            authModal.style.display = 'block';
            
            if (this.currentUser) {
                authFormContainer.style.display = 'none';
                userInfo.style.display = 'block';
                
                const authTitle = document.getElementById('authTitle');
                if (authTitle) authTitle.textContent = 'My Account';
                
                this.updateUIForAuthenticatedUser();
            } else {
                authFormContainer.style.display = 'block';
                userInfo.style.display = 'none';
                
                const authTitle = document.getElementById('authTitle');
                if (authTitle) authTitle.textContent = 'Sign In';
            }
        }
    }

    showEditAccountModal() {
        this.showAuthModal();
        this.isSignUpMode = true;
        this.toggleAuthMode();
        
        const authEmail = document.getElementById('authEmail');
        const authName = document.getElementById('authName');
        const authPhone = document.getElementById('authPhone');
        
        if (authEmail) authEmail.value = this.currentUser.email;
        if (authName) authName.value = this.currentUser.name;
        if (authPhone) authPhone.value = this.currentUser.phone;
    }

    showNotification(message, type = 'info') {
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
            background-color: #8a5a8a;
            box-shadow: 0 4px 12px rgba(138, 90, 138, 0.3);
        `;
        
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

    requireAuth() {
        if (!this.currentUser) {
            this.showAuthModal();
            return false;
        }
        return true;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // Test function to manually show all fields
    testShowAllFields() {
        const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
        const authNameGroup = document.getElementById('authNameGroup');
        const authPhoneGroup = document.getElementById('authPhoneGroup');
        
        if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'block';
        if (authNameGroup) authNameGroup.style.display = 'block';
        if (authPhoneGroup) authPhoneGroup.style.display = 'block';
        
        console.log('Manually showing all fields');
    }

    hideExtraFields() {
        const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
        const authNameGroup = document.getElementById('authNameGroup');
        const authPhoneGroup = document.getElementById('authPhoneGroup');

        if (confirmPasswordGroup) confirmPasswordGroup.style.display = 'none';
        if (authNameGroup) authNameGroup.style.display = 'none';
        if (authPhoneGroup) authPhoneGroup.style.display = 'none';
    }
}

window.authSystem = new AuthSystem();
