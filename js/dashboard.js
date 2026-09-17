/**
 * STACKLY Government Services — Dashboard Engine
 * Pure Vanilla JavaScript (No frameworks)
 */

(function () {
  'use strict';

  const AUTH_KEY = 'stackly_current_user';

  // Retrieve current authenticated session
  function getActiveUser(defaultRole = 'User') {
    try {
      const data = localStorage.getItem(AUTH_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Could not read user session', e);
    }

    // Default mock user if not logged in
    return {
      name: defaultRole === 'Admin' ? 'Administrator Eleanor Vance' : 'Citizen Alex Mercer',
      email: defaultRole === 'Admin' ? 'admin@stackly.gov' : 'citizen@gmail.com', // EXACT email address preserved!
      role: defaultRole,
      phone: '+1 (800) 555-0192',
      nationalId: 'STK-8829-4102',
      address: '742 Evergreen Terrace, Capital District'
    };
  }

  // Save updated user data
  function saveActiveUser(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  }

  // Populate user data across top bar, sidebar, and profile inputs
  function syncUserProfile(user) {
    // Exact email address must be displayed everywhere (do NOT remove anything after @)
    const emailEls = document.querySelectorAll('[data-user-email]');
    emailEls.forEach(el => {
      el.textContent = user.email;
    });

    const nameEls = document.querySelectorAll('[data-user-name]');
    nameEls.forEach(el => {
      el.textContent = user.name;
    });

    const roleEls = document.querySelectorAll('[data-user-role]');
    roleEls.forEach(el => {
      el.textContent = user.role;
    });

    // Populate profile form inputs if present
    const profileNameInput = document.getElementById('profile-name');
    if (profileNameInput) profileNameInput.value = user.name || '';

    const profileEmailInput = document.getElementById('profile-email');
    if (profileEmailInput) profileEmailInput.value = user.email || '';

    const profilePhoneInput = document.getElementById('profile-phone');
    if (profilePhoneInput) profilePhoneInput.value = user.phone || '+1 (800) 555-0192';

    const profileAddressInput = document.getElementById('profile-address');
    if (profileAddressInput) profileAddressInput.value = user.address || '742 Evergreen Terrace, Capital District';

    const profileIdInput = document.getElementById('profile-id');
    if (profileIdInput) profileIdInput.value = user.nationalId || 'STK-8829-4102';
  }

  // Handle tab switching in dashboard
  function initDashboardNavigation() {
    const navLinks = document.querySelectorAll('[data-dash-nav]');
    const sections = document.querySelectorAll('[data-dash-section]');

    if (!navLinks.length || !sections.length) return;

    function switchTab(targetTabId) {
      // Deactivate all links
      navLinks.forEach(link => {
        if (link.getAttribute('data-dash-nav') === targetTabId) {
          link.classList.add('is-active');
        } else {
          link.classList.remove('is-active');
        }
      });

      // Show matching section, hide others
      let found = false;
      sections.forEach(sec => {
        if (sec.getAttribute('data-dash-section') === targetTabId) {
          sec.style.display = 'block';
          sec.classList.add('is-active-section');
          found = true;
        } else {
          sec.style.display = 'none';
          sec.classList.remove('is-active-section');
        }
      });

      // Close mobile sidebar if open
      const sidebar = document.querySelector('[data-dashboard-sidebar]');
      const activeOverlay = document.querySelector('[data-sidebar-overlay]');
      if (sidebar && sidebar.classList.contains('is-open')) {
        sidebar.classList.remove('is-open');
        document.body.classList.remove('sidebar-open');
        if (activeOverlay) activeOverlay.classList.remove('is-open');
      }

      // Reset the scroll position so every pane opens at its own top.
      // The vertical scroll container is .dashboard-main-area (the sticky
      // topbar / sidebar stay pinned while the pane content scrolls).
      const dashMain = document.querySelector('.dashboard-main-area');
      if (dashMain) {
        dashMain.scrollTop = 0;
        dashMain.scrollLeft = 0;
      }
    }

    navLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const targetTab = this.getAttribute('data-dash-nav');
        if (targetTab === 'logout') {
          handleLogout();
          return;
        }
        switchTab(targetTab);
        window.location.hash = targetTab;
      });
    });

    // Check hash on page load
    const hash = window.location.hash.replace('#', '');
    if (hash && document.querySelector(`[data-dash-section="${hash}"]`)) {
      switchTab(hash);
    } else {
      const defaultNav = navLinks[0]?.getAttribute('data-dash-nav') || 'overview';
      switchTab(defaultNav);
    }
  }

  // Handle logout: Clears only session data and redirects
  function handleLogout() {
    if (confirm('Are you sure you wish to sign out of your secure government portal?')) {
      localStorage.removeItem(AUTH_KEY);
      window.location.href = './login.html';
    }
  }

  // Mobile sidebar drawer
  function initMobileSidebar() {
    const toggleBtn = document.querySelector('[data-dashboard-menu]');
    const sidebar = document.querySelector('[data-dashboard-sidebar]');
    const overlay = document.querySelector('[data-sidebar-overlay]');

    if (!toggleBtn || !sidebar) return;

    toggleBtn.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('is-open');
      document.body.classList.toggle('sidebar-open', isOpen);
      if (overlay) overlay.classList.toggle('is-open', isOpen);
    });

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('is-open');
        document.body.classList.remove('sidebar-open');
        overlay.classList.remove('is-open');
      });
    }
  }

  // Table search and filtering
  function initTableFilters() {
    const searchInputs = document.querySelectorAll('[data-table-search]');
    searchInputs.forEach(input => {
      const targetTableId = input.getAttribute('data-table-search');
      const table = document.getElementById(targetTableId);
      if (!table) return;

      input.addEventListener('input', function () {
        const query = this.value.toLowerCase().trim();
        const rows = table.querySelectorAll('tbody tr');

        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          if (text.includes(query)) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        });
      });
    });

    // Status filter buttons
    const filterButtons = document.querySelectorAll('[data-status-filter]');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        const filterVal = this.getAttribute('data-status-filter').toLowerCase();
        const parent = this.closest('.filter-group') || document;
        parent.querySelectorAll('[data-status-filter]').forEach(b => b.classList.remove('is-active'));
        this.classList.add('is-active');

        const table = document.querySelector(this.getAttribute('data-target-table') || 'table');
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          if (filterVal === 'all') {
            row.style.display = '';
          } else {
            const statusCell = row.querySelector('.status-badge') || row.querySelector('td:last-child');
            const statusText = statusCell ? statusCell.textContent.toLowerCase() : '';
            if (statusText.includes(filterVal)) {
              row.style.display = '';
            } else {
              row.style.display = 'none';
            }
          }
        });
      });
    });
  }

  // Profile Form Submission
  function initProfileForm(currentUser) {
    const form = document.getElementById('profile-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const nameVal = document.getElementById('profile-name')?.value.trim();
      const emailVal = document.getElementById('profile-email')?.value.trim();
      const phoneVal = document.getElementById('profile-phone')?.value.trim();
      const addressVal = document.getElementById('profile-address')?.value.trim();
      const msgEl = document.getElementById('profile-save-message');

      if (!nameVal || !emailVal) {
        if (msgEl) {
          msgEl.textContent = 'Name and official email are required.';
          msgEl.style.color = '#C9A227';
        }
        return;
      }

      currentUser.name = nameVal;
      currentUser.email = emailVal; // Preserves exact email
      currentUser.phone = phoneVal;
      currentUser.address = addressVal;

      saveActiveUser(currentUser);
      syncUserProfile(currentUser);

      if (msgEl) {
        msgEl.textContent = 'Profile changes saved successfully.';
        msgEl.style.color = '#1B365D';
        setTimeout(() => {
          msgEl.textContent = '';
        }, 3000);
      }
    });
  }

  // Interactive Approval Actions for Admin Dashboard
  function initAdminApprovalActions() {
    const approveButtons = document.querySelectorAll('[data-action-approve]');
    const reviewButtons = document.querySelectorAll('[data-action-review]');

    approveButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        const row = this.closest('tr');
        if (!row) return;
        const badge = row.querySelector('.status-badge');
        if (badge) {
          badge.className = 'status-badge status-approved';
          badge.innerHTML = '<span class="material-symbols-outlined">verified</span> Approved';
        }
        this.disabled = true;
        this.style.opacity = '0.5';
      });
    });

    reviewButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        const row = this.closest('tr');
        if (!row) return;
        const badge = row.querySelector('.status-badge');
        if (badge) {
          badge.className = 'status-badge status-review';
          badge.innerHTML = '<span class="material-symbols-outlined">schedule</span> Under Review';
        }
      });
    });
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    const isAdmin = document.body.classList.contains('admin-page');
    const currentUser = getActiveUser(isAdmin ? 'Admin' : 'User');

    syncUserProfile(currentUser);
    initDashboardNavigation();
    initMobileSidebar();
    initTableFilters();
    initProfileForm(currentUser);
    initAdminApprovalActions();

    // Attach logout buttons
    document.querySelectorAll('[data-logout]').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        handleLogout();
      });
    });
  });
})();
