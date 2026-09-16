/**
 * STACKLY Government Services — Authentication Engine
 * Pure Vanilla JavaScript (No frameworks)
 */

(function () {
  'use strict';

  // Local storage key for active session
  const AUTH_KEY = 'stackly_current_user';
  const ACCOUNTS_KEY = 'stackly_registered_accounts';

  // Helper: Get current session
  function getCurrentUser() {
    try {
      const data = localStorage.getItem(AUTH_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  // Helper: Set session (preserves exact email including domain)
  function setCurrentUser(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  }

  // Helper: Clear session without wiping unrelated localStorage data
  function clearSession() {
    localStorage.removeItem(AUTH_KEY);
  }

  // Password visibility toggle helper
  function initPasswordToggles() {
    const toggleButtons = document.querySelectorAll('[data-password-toggle]');
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        const targetId = this.getAttribute('data-target');
        const input = targetId ? document.getElementById(targetId) : this.closest('.password-field')?.querySelector('input');
        if (!input) return;

        const icon = this.querySelector('.material-symbols-outlined');
        if (input.type === 'password') {
          input.type = 'text';
          if (icon) icon.textContent = 'visibility_off';
          this.setAttribute('aria-label', 'Hide password');
        } else {
          input.type = 'password';
          if (icon) icon.textContent = 'visibility';
          this.setAttribute('aria-label', 'Show password');
        }
      });
    });
  }

  // Field validation helpers
  function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).trim());
  }

  function validatePhone(phone) {
    const cleaned = String(phone).replace(/\D/g, '');
    return cleaned.length >= 7;
  }

  function setFieldError(input, errorElement, message) {
    if (!input) return;
    const formGroup = input.closest('.form-group') || input.parentElement;
    if (message) {
      formGroup.classList.add('has-error');
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
      }
    } else {
      formGroup.classList.remove('has-error');
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      }
    }
  }

  // Initialize Login Page
  function initLoginForm() {
    const form = document.querySelector('[data-login-form]');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      let isValid = true;
      const roleSelect = form.querySelector('[name="role"]');
      const emailInput = form.querySelector('[name="email"]');
      const passwordInput = form.querySelector('[name="password"]');
      const rememberCheckbox = form.querySelector('[name="remember"]');
      const formMessage = form.querySelector('[data-form-message]');

      const roleError = form.querySelector('[data-error="role"]');
      const emailError = form.querySelector('[data-error="email"]');
      const passwordError = form.querySelector('[data-error="password"]');

      // Reset errors
      setFieldError(roleSelect, roleError, '');
      setFieldError(emailInput, emailError, '');
      setFieldError(passwordInput, passwordError, '');
      if (formMessage) formMessage.textContent = '';

      // Validate role
      const role = roleSelect ? roleSelect.value.trim() : 'User';
      if (!role) {
        setFieldError(roleSelect, roleError, 'Please select your role');
        isValid = false;
      }

      // Validate email
      const rawEmail = emailInput ? emailInput.value.trim() : '';
      if (!rawEmail) {
        setFieldError(emailInput, emailError, 'Official email address is required');
        isValid = false;
      } else if (!validateEmail(rawEmail)) {
        setFieldError(emailInput, emailError, 'Enter a valid email address (e.g. name@domain.com)');
        isValid = false;
      }

      // Validate password
      const password = passwordInput ? passwordInput.value : '';
      if (!password) {
        setFieldError(passwordInput, passwordError, 'Password is required');
        isValid = false;
      } else if (password.length < 4) {
        setFieldError(passwordInput, passwordError, 'Password must be at least 4 characters');
        isValid = false;
      }

      if (!isValid) return;

      // Extract citizen name from email if not already set
      const emailNamePart = rawEmail.split('@')[0];
      const displayName = role.toLowerCase() === 'admin' 
        ? 'Government Administrator' 
        : (emailNamePart.charAt(0).toUpperCase() + emailNamePart.slice(1).replace(/[._]/g, ' '));

      // Authenticate & Store Exact Email
      const userObj = {
        name: displayName,
        email: rawEmail, // EXACT email address preserved!
        role: role.toLowerCase() === 'admin' ? 'Admin' : 'User',
        loginTime: new Date().toISOString(),
        remember: rememberCheckbox ? rememberCheckbox.checked : false
      };

      setCurrentUser(userObj);

      if (formMessage) {
        formMessage.className = 'form-message form-message-success';
        formMessage.textContent = 'Verification successful. Redirecting to your secure portal...';
      }

      setTimeout(() => {
        if (userObj.role === 'Admin') {
          window.location.href = './admin-dashboard.html';
        } else {
          window.location.href = './user-dashboard.html';
        }
      }, 700);
    });
  }

  // Initialize Register Page
  function initRegisterForm() {
    const form = document.querySelector('[data-register-form]');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      let isValid = true;
      const roleSelect = form.querySelector('[name="role"]');
      const nameInput = form.querySelector('[name="name"]');
      const emailInput = form.querySelector('[name="email"]');
      const phoneInput = form.querySelector('[name="phone"]');
      const passwordInput = form.querySelector('[name="password"]');
      const confirmInput = form.querySelector('[name="confirm_password"]');
      const formMessage = form.querySelector('[data-form-message]');

      const roleError = form.querySelector('[data-error="role"]');
      const nameError = form.querySelector('[data-error="name"]');
      const emailError = form.querySelector('[data-error="email"]');
      const phoneError = form.querySelector('[data-error="phone"]');
      const passwordError = form.querySelector('[data-error="password"]');
      const confirmError = form.querySelector('[data-error="confirm_password"]');

      // Clear previous errors
      setFieldError(roleSelect, roleError, '');
      setFieldError(nameInput, nameError, '');
      setFieldError(emailInput, emailError, '');
      setFieldError(phoneInput, phoneError, '');
      setFieldError(passwordInput, passwordError, '');
      setFieldError(confirmInput, confirmError, '');
      if (formMessage) formMessage.textContent = '';

      // Validate role
      const role = roleSelect ? roleSelect.value.trim() : 'User';
      if (!role) {
        setFieldError(roleSelect, roleError, 'Please select account role');
        isValid = false;
      }

      // Validate name
      const name = nameInput ? nameInput.value.trim() : '';
      if (!name || name.length < 2) {
        setFieldError(nameInput, nameError, 'Full legal name is required (minimum 2 characters)');
        isValid = false;
      }

      // Validate email
      const rawEmail = emailInput ? emailInput.value.trim() : '';
      if (!rawEmail || !validateEmail(rawEmail)) {
        setFieldError(emailInput, emailError, 'Enter a valid email address (e.g. name@domain.com)');
        isValid = false;
      }

      // Validate phone
      const phone = phoneInput ? phoneInput.value.trim() : '';
      if (!phone || !validatePhone(phone)) {
        setFieldError(phoneInput, phoneError, 'Enter a valid phone number (minimum 7 digits)');
        isValid = false;
      }

      // Validate password
      const password = passwordInput ? passwordInput.value : '';
      if (!password || password.length < 6) {
        setFieldError(passwordInput, passwordError, 'Password must be at least 6 characters');
        isValid = false;
      }

      // Validate confirm password
      const confirmPass = confirmInput ? confirmInput.value : '';
      if (password !== confirmPass) {
        setFieldError(confirmInput, confirmError, 'Passwords do not match');
        isValid = false;
      }

      if (!isValid) return;

      // Save user profile with exact email
      const newUser = {
        name: name,
        email: rawEmail, // EXACT email address preserved!
        phone: phone,
        role: role.toLowerCase() === 'admin' ? 'Admin' : 'User',
        registeredAt: new Date().toISOString()
      };

      // Save to registered accounts list in localStorage
      try {
        const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
        accounts.push(newUser);
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      } catch (e) {
        // Continue gracefully
      }

      // Set active session
      setCurrentUser(newUser);

      if (formMessage) {
        formMessage.className = 'form-message form-message-success';
        formMessage.textContent = 'Account created successfully! Connecting your portal...';
      }

      setTimeout(() => {
        if (newUser.role === 'Admin') {
          window.location.href = './admin-dashboard.html';
        } else {
          window.location.href = './user-dashboard.html';
        }
      }, 700);
    });
  }

  // Global Auth Export
  window.StacklyAuth = {
    getCurrentUser,
    setCurrentUser,
    clearSession,
    initPasswordToggles,
    initLoginForm,
    initRegisterForm
  };

  document.addEventListener('DOMContentLoaded', () => {
    initPasswordToggles();
    initLoginForm();
    initRegisterForm();
  });
})();
