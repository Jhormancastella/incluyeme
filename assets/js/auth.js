/**
 * auth.js - Admin Authentication via Supabase
 */

import { supabase } from './supabase.js';
import { isValidEmail, showToast, escapeHtml } from './utils.js';

// ===== AUTH MANAGER =====
export const Auth = {
  initialized: false,
  _session: null,

  // Check if user is authenticated (uses cached session)
  isAuthenticated() {
    return !!this._session?.user;
  },

  // Load session from Supabase (call on app start)
  async loadSession() {
    const { data } = await supabase.auth.getSession();
    this._session = data.session;

    // Keep in sync when session changes (refresh, logout from another tab)
    supabase.auth.onAuthStateChange((_event, session) => {
      this._session = session;
      if (!session) {
        document.dispatchEvent(new CustomEvent('auth:logout'));
      }
    });

    return !!this._session;
  },

  // Login with email and password via Supabase
  async login(email, password) {
    if (!email || !isValidEmail(email)) {
      showToast('Email inválido', 'error');
      return false;
    }
    if (!password || password.length < 6) {
      showToast('Contraseña muy corta', 'error');
      return false;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      showToast('Credenciales incorrectas', 'error');
      return false;
    }

    this._session = data.session;
    showToast('¡Bienvenido!');
    return true;
  },

  // Logout
  async logout() {
    await supabase.auth.signOut();
    this._session = null;
    showToast('Sesión cerrada');
    document.dispatchEvent(new CustomEvent('auth:logout'));
  },

  // Get current user info
  getUser() {
    const user = this._session?.user;
    if (!user) return null;
    return {
      email: user.email,
      id: user.id,
      loginAt: new Date(this._session.created_at || Date.now()).getTime()
    };
  },

  // Render user info in a container
  renderUserInfo(container) {
    if (!container) return;

    const user = this.getUser();
    if (!user) {
      this.renderLoginForm(container);
      return;
    }

    const initials = user.email.charAt(0).toUpperCase();
    container.innerHTML = `
      <div class="admin-user-info">
        <div class="admin-avatar" aria-hidden="true">${initials}</div>
        <div>
          <strong>${escapeHtml(user.email)}</strong>
        </div>
        <button class="admin-logout" id="adminLogoutBtn" aria-label="Cerrar sesión">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    `;

    container.querySelector('#adminLogoutBtn').addEventListener('click', async () => {
      await this.logout();
      this.renderUserInfo(container);
    });
  },

  // Render login form
  renderLoginForm(container) {
    if (!container) return;

    container.innerHTML = `
      <form id="adminLoginForm" class="admin-login-form" novalidate>
        <div class="form-group">
          <label for="adminEmail">
            <i class="fas fa-envelope" aria-hidden="true"></i>
            Correo electrónico <span class="required">*</span>
          </label>
          <input type="email" id="adminEmail" name="email" required
                 autocomplete="username" inputmode="email"
                 placeholder="admin@ejemplo.com">
        </div>
        <div class="form-group">
          <label for="adminPassword">
            <i class="fas fa-lock" aria-hidden="true"></i>
            Contraseña <span class="required">*</span>
          </label>
          <input type="password" id="adminPassword" name="password" required
                 autocomplete="current-password" minlength="6"
                 placeholder="••••••••">
        </div>
        <button type="submit" class="btn btn-full">
          <i class="fas fa-sign-in-alt"></i> Iniciar sesión
        </button>
        <div id="loginFeedback" class="form-message" role="status" aria-live="polite"></div>
      </form>
    `;

    container.querySelector('#adminLoginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email    = container.querySelector('#adminEmail').value.trim();
      const password = container.querySelector('#adminPassword').value;
      const feedback = container.querySelector('#loginFeedback');

      feedback.textContent = '';
      feedback.className   = 'form-message';

      const success = await this.login(email, password);

      if (success) {
        document.dispatchEvent(new CustomEvent('auth:loginSuccess'));
      } else {
        feedback.textContent = 'Verifica tus credenciales e intenta nuevamente';
        feedback.classList.add('error');
      }
    });
  },

  // Initialize auth module
  async init(containerSelector = '.admin-user-container') {
    if (this.initialized) return this;

    await this.loadSession();

    const container = document.querySelector(containerSelector);
    if (container) this.renderUserInfo(container);

    document.addEventListener('auth:loginSuccess', () => {
      const c = document.querySelector(containerSelector);
      if (c) this.renderUserInfo(c);
    });

    this.initialized = true;
    return this;
  }
};

export default Auth;
