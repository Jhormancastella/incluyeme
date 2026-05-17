/**
 * auth.js - Admin Authentication & Session Management
 * Autenticación segura con sesiones y validación
 */

import { Storage, DATA_KEYS } from './storage.js';
import { isValidEmail, showToast, escapeHtml } from './utils.js';

// ===== CONSTANTS =====
const SESSION_KEY = DATA_KEYS.ADMIN_SESSION;
const CONFIG_KEY = DATA_KEYS.CONFIG;
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour

// ===== AUTH MANAGER =====
export const Auth = {
  initialized: false,
  sessionCheckInterval: null,
  
  // Check if user is authenticated
  isAuthenticated() {
    const session = Storage.get(SESSION_KEY);
    
    if (!session) return false;
    
    // Check expiration
    if (Date.now() > session.expires) {
      this.logout();
      return false;
    }
    
    return true;
  },
  
  // Login with email and password
  async login(email, password) {
    // Validate input
    if (!email || !isValidEmail(email)) {
      showToast('Email inválido', 'error');
      return false;
    }
    
    if (!password || password.length < 8) {
      showToast('Contraseña debe tener al menos 8 caracteres', 'error');
      return false;
    }
    
    // Get admin config
    const config = Storage.get(CONFIG_KEY, {});
    const adminConfig = config.admin || {};
    const expectedEmail = adminConfig.email || 'admin@municipio.local';
    const expectedPassword = adminConfig.password || 'Admin2024!';
    
    // Validate credentials (SIMPLE - for demo only)
    // ⚠️ In production: Use proper hashing and server-side validation
    if (email !== expectedEmail || password !== expectedPassword) {
      showToast('Credenciales incorrectas', 'error');
      return false;
    }
    
    // Create session
    const session = {
      email: email,
      loginAt: Date.now(),
      expires: Date.now() + SESSION_TIMEOUT,
      token: this.generateToken(email)
    };
    
    Storage.set(SESSION_KEY, session);
    
    showToast('¡Bienvenido! Sesión iniciada');
    return true;
  },
  
  // Logout user
  logout() {
    Storage.remove(SESSION_KEY);
    showToast('Sesión cerrada');
    document.dispatchEvent(new CustomEvent('auth:logout'));
  },
  
  // Get current user info
  getUser() {
    const session = Storage.get(SESSION_KEY);
    if (!session) return null;
    
    return {
      email: session.email,
      loginAt: session.loginAt,
      expires: session.expires
    };
  },
  
  // Extend session
  extendSession() {
    const session = Storage.get(SESSION_KEY);
    if (!session) return false;
    
    session.expires = Date.now() + SESSION_TIMEOUT;
    Storage.set(SESSION_KEY, session);
    return true;
  },
  
  // Check and refresh session
  checkSession() {
    if (!this.isAuthenticated()) return false;
    
    // Extend if more than 30 min have passed
    const session = Storage.get(SESSION_KEY);
    if (Date.now() - session.loginAt > 30 * 60 * 1000) {
      this.extendSession();
    }
    
    return true;
  },
  
  // Generate simple token (for demo)
  generateToken(email) {
    // ⚠️ In production: Use proper JWT or server-side tokens
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2);
    return btoa(`${email}:${timestamp}:${random}`).substr(0, 32);
  },
  
  // Update admin credentials
  updateCredentials(newEmail, newPassword) {
    if (!this.isAuthenticated()) {
      showToast('Debes iniciar sesión primero', 'error');
      return false;
    }
    
    if (!isValidEmail(newEmail)) {
      showToast('Email inválido', 'error');
      return false;
    }
    
    if (newPassword && newPassword.length < 8) {
      showToast('Nueva contraseña debe tener al menos 8 caracteres', 'error');
      return false;
    }
    
    const config = Storage.get(CONFIG_KEY, {});
    config.admin = config.admin || {};
    
    if (newEmail) config.admin.email = newEmail;
    if (newPassword) config.admin.password = newPassword;
    
    Storage.set(CONFIG_KEY, config);
    
    // Update current session
    const session = Storage.get(SESSION_KEY);
    if (session) {
      session.email = newEmail || session.email;
      Storage.set(SESSION_KEY, session);
    }
    
    showToast('Credenciales actualizadas');
    return true;
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
                 placeholder="admin@municipio.local">
        </div>
        <div class="form-group">
          <label for="adminPassword">
            <i class="fas fa-lock" aria-hidden="true"></i>
            Contraseña <span class="required">*</span>
          </label>
          <input type="password" id="adminPassword" name="password" required 
                 autocomplete="current-password" minlength="8"
                 placeholder="••••••••">
        </div>
        <button type="submit" class="btn btn-full">
          <i class="fas fa-sign-in-alt"></i> Iniciar sesión
        </button>
        <div id="loginFeedback" class="form-message" role="status" aria-live="polite"></div>
      </form>
    `;
    
    // Bind form submission
    container.querySelector('#adminLoginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = container.querySelector('#adminEmail').value.trim();
      const password = container.querySelector('#adminPassword').value;
      const feedback = container.querySelector('#loginFeedback');
      
      feedback.textContent = '';
      feedback.className = 'form-message';
      
      const success = await this.login(email, password);
      
      if (success) {
        // Redirect or refresh admin panel
        document.dispatchEvent(new CustomEvent('auth:loginSuccess'));
      } else {
        feedback.textContent = 'Verifica tus credenciales e intenta nuevamente';
        feedback.classList.add('error');
      }
    });
  },
  
  // Render user info
  renderUserInfo(container) {
    if (!container) return;
    
    const user = this.getUser();
    if (!user) {
      this.renderLoginForm(container);
      return;
    }
    
    const initials = user.email.charAt(0).toUpperCase();
    const timeStr = new Date(user.loginAt).toLocaleTimeString('es-CO', { 
      hour: '2-digit', minute: '2-digit' 
    });
    
    container.innerHTML = `
      <div class="admin-user-info">
        <div class="admin-avatar" aria-hidden="true">${initials}</div>
        <div>
          <strong>${escapeHtml(user.email)}</strong>
          <div style="font-size:0.75rem;color:var(--color-text-muted)">
            Conectado desde ${timeStr}
          </div>
        </div>
        <button class="admin-logout" id="adminLogoutBtn" aria-label="Cerrar sesión">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    `;
    
    // Bind logout
    container.querySelector('#adminLogoutBtn').addEventListener('click', () => {
      this.logout();
      this.renderUserInfo(container);
    });
  },
  
  // Check auth and render appropriate UI
  init(containerSelector = '.admin-user-container') {
    if (this.initialized) return this;

    const container = document.querySelector(containerSelector);
    if (container) {
      this.renderUserInfo(container);
    }
    
    // Listen for auth events
    document.addEventListener('auth:loginSuccess', () => {
      const c = document.querySelector(containerSelector);
      if (c) this.renderUserInfo(c);
    });
    
    // Auto-check session periodically
    this.sessionCheckInterval = setInterval(() => this.checkSession(), 5 * 60 * 1000);
    this.initialized = true;
    
    return this;
  }
};

// ===== EXPORT =====
export default Auth;
