/**
 * Auth JavaScript Module
 * Modern, minimalist authentication enhancements
 */

// Utility Functions
class AuthUtils {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }

    static validatePassword(password) {
        return {
            length: password.length >= 6,
            hasLowercase: /[a-z]/.test(password),
            hasUppercase: /[A-Z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
    }

    static calculatePasswordStrength(password) {
        const checks = this.validatePassword(password);
        let score = 0;
        
        if (checks.length) score++;
        if (checks.hasLowercase) score++;
        if (checks.hasUppercase) score++;
        if (checks.hasNumber) score++;
        if (checks.hasSpecial) score++;
        
        return { score, checks };
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Base Form Handler
class BaseAuthForm {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.submitBtn = this.form?.querySelector('button[type="submit"]');
        this.inputs = {};
        this.validators = {};
        
        if (this.form) {
            this.init();
        }
    }

    init() {
        this.setupInputs();
        this.setupEventListeners();
        this.setupFloatingLabels();
        this.setupKeyboardNavigation();
        this.hideMessagesAfterDelay();
    }

    setupInputs() {
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            this.inputs[input.name] = input;
        });
    }

    setupEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        Object.values(this.inputs).forEach(input => {
            input.addEventListener('input', () => this.handleInput(input));
            input.addEventListener('blur', () => this.handleBlur(input));
            input.addEventListener('focus', () => this.handleFocus(input));
        });
    }

    setupFloatingLabels() {
        // Standard label positioning - no floating needed
        Object.values(this.inputs).forEach(input => {
            // Handle autofill states
            if (input.value) {
                input.setAttribute('data-filled', 'true');
            }
            
            input.addEventListener('focus', () => {
                input.setAttribute('data-filled', 'true');
            });
            
            input.addEventListener('blur', () => {
                if (!input.value) {
                    input.removeAttribute('data-filled');
                }
            });
        });
    }

    setupKeyboardNavigation() {
        const inputArray = Object.values(this.inputs);
        
        inputArray.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (index < inputArray.length - 1) {
                        inputArray[index + 1].focus();
                    } else {
                        this.form.dispatchEvent(new Event('submit'));
                    }
                }
            });
        });
    }

    handleInput(input) {
        this.clearFieldError(input.name);
        
        // Real-time validation for specific fields
        if (input.name === 'password' && this.inputs.confirm_password?.value) {
            this.validateField('confirm_password');
        }
    }

    handleBlur(input) {
        this.validateField(input.name);
    }

    handleFocus(input) {
        this.clearFieldError(input.name);
    }

    validateField(fieldName) {
        const validator = this.validators[fieldName];
        if (validator) {
            return validator();
        }
        return true;
    }

    validateAllFields() {
        let isValid = true;
        Object.keys(this.validators).forEach(fieldName => {
            if (!this.validateField(fieldName)) {
                isValid = false;
            }
        });
        return isValid;
    }

    setFieldError(fieldName, message) {
        const input = this.inputs[fieldName];
        const fieldGroup = input?.closest('.form-group');
        if (fieldGroup) {
            fieldGroup.classList.remove('success');
            fieldGroup.classList.add('error');
        }
    }

    setFieldSuccess(fieldName) {
        const input = this.inputs[fieldName];
        const fieldGroup = input?.closest('.form-group');
        if (fieldGroup) {
            fieldGroup.classList.remove('error');
            fieldGroup.classList.add('success');
        }
    }

    clearFieldError(fieldName) {
        const input = this.inputs[fieldName];
        const fieldGroup = input?.closest('.form-group');
        if (fieldGroup) {
            fieldGroup.classList.remove('error', 'success');
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        
        if (this.validateAllFields()) {
            this.showLoading();
            // Add delay for better UX
            setTimeout(() => {
                this.form.submit();
            }, 500);
        }
    }

    showLoading() {
        if (this.submitBtn) {
            this.submitBtn.classList.add('loading');
            this.submitBtn.disabled = true;
            const btnText = this.submitBtn.querySelector('.btn-text');
            if (btnText) {
                btnText.textContent = this.getLoadingText();
            }
        }
    }

    hideLoading() {
        if (this.submitBtn) {
            this.submitBtn.classList.remove('loading');
            this.submitBtn.disabled = false;
            const btnText = this.submitBtn.querySelector('.btn-text');
            if (btnText) {
                btnText.textContent = this.getDefaultText();
            }
        }
    }

    getLoadingText() {
        return 'Memuat...';
    }

    getDefaultText() {
        return 'Kirim';
    }

    hideMessagesAfterDelay() {
        const messages = document.querySelectorAll('.error-message, .success-message');
        messages.forEach(message => {
            setTimeout(() => {
                message.style.animation = 'messageSlideOut 0.3s ease forwards';
                setTimeout(() => {
                    message.style.display = 'none';
                }, 300);
            }, 5000);
        });
    }
}

// Login Form Handler
class LoginForm extends BaseAuthForm {
    constructor() {
        super('loginForm');
        this.setupValidators();
    }

    setupValidators() {
        this.validators = {
            email: () => this.validateEmail(),
            password: () => this.validatePassword()
        };
    }

    validateEmail() {
        const email = this.inputs.email?.value.trim();
        
        if (!email) {
            this.setFieldError('email', 'Email is required');
            return false;
        } else if (!AuthUtils.validateEmail(email)) {
            this.setFieldError('email', 'Please enter a valid email');
            return false;
        } else {
            this.setFieldSuccess('email');
            return true;
        }
    }

    validatePassword() {
        const password = this.inputs.password?.value;
        
        if (!password) {
            this.setFieldError('password', 'Password is required');
            return false;
        } else if (password.length < 6) {
            this.setFieldError('password', 'Password must be at least 6 characters');
            return false;
        } else {
            this.setFieldSuccess('password');
            return true;
        }
    }

    getLoadingText() {
        return 'Sedang Masuk...';
    }

    getDefaultText() {
        return 'Masuk';
    }
}

// Register Form Handler
class RegisterForm extends BaseAuthForm {
    constructor() {
        super('registerForm');
        this.passwordStrength = document.getElementById('passwordStrength');
        this.passwordStrengthBar = document.getElementById('passwordStrengthBar');
        this.setupValidators();
        this.setupPasswordStrength();
    }

    setupValidators() {
        this.validators = {
            username: () => this.validateUsername(),
            email: () => this.validateEmail(),
            password: () => this.validatePassword(),
            confirm_password: () => this.validateConfirmPassword()
        };
    }

    setupPasswordStrength() {
        if (this.inputs.password) {
            this.inputs.password.addEventListener('input', () => {
                this.updatePasswordStrength();
            });
        }
    }

    validateUsername() {
        const username = this.inputs.username?.value.trim();
        
        if (!username) {
            this.setFieldError('username', 'Nama pengguna wajib diisi');
            return false;
        } else if (username.length < 3) {
            this.setFieldError('username', 'Nama pengguna minimal 3 karakter');
            return false;
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            this.setFieldError('username', 'Nama pengguna hanya boleh berisi huruf, angka, dan garis bawah');
            return false;
        } else {
            this.setFieldSuccess('username');
            return true;
        }
    }

    validateEmail() {
        const email = this.inputs.email?.value.trim();
        
        if (!email) {
            this.setFieldError('email', 'Email is required');
            return false;
        } else if (!AuthUtils.validateEmail(email)) {
            this.setFieldError('email', 'Please enter a valid email');
            return false;
        } else {
            this.setFieldSuccess('email');
            return true;
        }
    }

    validatePassword() {
        const password = this.inputs.password?.value;
        
        if (!password) {
            this.setFieldError('password', 'Password is required');
            return false;
        } else if (password.length < 6) {
            this.setFieldError('password', 'Password must be at least 6 characters');
            return false;
        } else {
            this.setFieldSuccess('password');
            return true;
        }
    }

    validateConfirmPassword() {
        const password = this.inputs.password?.value;
        const confirmPassword = this.inputs.confirm_password?.value;
        
        if (!confirmPassword) {
            this.setFieldError('confirm_password', 'Silakan konfirmasi password Anda');
            return false;
        } else if (password !== confirmPassword) {
            this.setFieldError('confirm_password', 'Password tidak cocok');
            return false;
        } else {
            this.setFieldSuccess('confirm_password');
            return true;
        }
    }

    updatePasswordStrength() {
        const password = this.inputs.password?.value || '';
        
        if (!this.passwordStrength || !this.passwordStrengthBar) return;
        
        if (password.length > 0) {
            const strength = AuthUtils.calculatePasswordStrength(password);
            this.passwordStrength.classList.add('show');
            
            let strengthClass = '';
            let width = '0%';
            
            if (strength.score <= 2) {
                strengthClass = 'password-strength-weak';
                width = '33%';
            } else if (strength.score <= 3) {
                strengthClass = 'password-strength-medium';
                width = '66%';
            } else {
                strengthClass = 'password-strength-strong';
                width = '100%';
            }
            
            this.passwordStrengthBar.className = `password-strength-bar ${strengthClass}`;
            this.passwordStrengthBar.style.width = width;
        } else {
            this.passwordStrength.classList.remove('show');
        }
    }

    handleInput(input) {
        super.handleInput(input);
        
        // Update password strength in real-time
        if (input.name === 'password') {
            this.updatePasswordStrength();
        }
    }

    getLoadingText() {
        return 'Membuat Akun...';
    }

    getDefaultText() {
        return 'Buat Akun';
    }
}

// Page Transitions
class PageTransitions {
    constructor() {
        this.init();
    }

    init() {
        // Fade in animation
        document.body.style.opacity = '0';
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.body.style.transition = 'opacity 0.6s ease';
                document.body.style.opacity = '1';
            }, 100);
        });

        // Handle link clicks for smooth transitions
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && link.hostname === window.location.hostname) {
                e.preventDefault();
                this.transitionTo(link.href);
            }
        });
    }

    transitionTo(url) {
        document.body.style.transition = 'opacity 0.3s ease';
        document.body.style.opacity = '0';
        
        setTimeout(() => {
            window.location.href = url;
        }, 300);
    }
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize page transitions
    new PageTransitions();
    
    // Initialize appropriate form handler
    if (document.getElementById('loginForm')) {
        new LoginForm();
    } else if (document.getElementById('registerForm')) {
        new RegisterForm();
    }
});