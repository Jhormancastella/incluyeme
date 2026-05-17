/**
 * theme.js - Dark/Light Mode Management
 * Gestión del modo de color con persistencia y preferencias del sistema
 */

import { Storage, DATA_KEYS } from './storage.js';

// ===== CONSTANTS =====
const THEME_KEY = 'theme';
const THEME_CLASSES = {
  DARK: 'dark',
  LIGHT: 'light'
};
const THEME_ICONS = {
  dark: { icon: 'fa-sun', label: 'Claro' },
  light: { icon: 'fa-moon', label: 'Oscuro' }
};

// ===== THEME MANAGER =====
export const Theme = {
  
  // Current theme
  current: null,
  initialized: false,
  
  // Initialize theme
  init() {
    if (this.initialized) {
      this.updateToggle();
      return this.current;
    }

    const saved = Storage.get(THEME_KEY);
    const config = Storage.get(DATA_KEYS.CONFIG, {});
    const defaultTheme = config.theme?.default || 'light';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Determine theme: saved > system preference > default
    if (saved === 'dark' || saved === 'light') {
      this.set(saved);
    } else if (defaultTheme === 'system') {
      this.set(prefersDark ? 'dark' : 'light');
    } else {
      this.set(defaultTheme);
    }
    
    // Listen for system preference changes
    if (defaultTheme === 'system') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        this.set(e.matches ? 'dark' : 'light');
        this.updateToggle();
      });
    }
    
    // Bind toggle button
    this.bindToggle();
    this.updateToggle();
    this.initialized = true;
    
    return this.current;
  },
  
  // Set theme
  set(theme) {
    if (!['dark', 'light'].includes(theme)) {
      console.warn(`Invalid theme: ${theme}`);
      return;
    }
    
    this.current = theme;
    
    // Update DOM
    if (theme === 'dark') {
      document.body.classList.add(THEME_CLASSES.DARK);
      document.body.classList.remove(THEME_CLASSES.LIGHT);
    } else {
      document.body.classList.remove(THEME_CLASSES.DARK);
      document.body.classList.add(THEME_CLASSES.LIGHT);
    }
    
    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(theme);
    
    // Save preference
    Storage.set(THEME_KEY, theme);
    
    // Dispatch event for other modules
    document.dispatchEvent(new CustomEvent('theme:changed', { detail: { theme } }));
  },
  
  // Toggle theme
  toggle() {
    const newTheme = this.current === 'dark' ? 'light' : 'dark';
    this.set(newTheme);
    this.updateToggle();
    return newTheme;
  },
  
  // Get current theme
  get() {
    return this.current;
  },
  
  // Check if dark mode
  isDark() {
    return this.current === 'dark';
  },
  
  // Update toggle button UI
  updateToggle() {
    const toggles = document.querySelectorAll('.theme-toggle');
    const config = Storage.get(DATA_KEYS.CONFIG, {});
    
    // Hide toggle if disabled in config
    if (config.theme?.allowToggle === false) {
      toggles.forEach(btn => btn.style.display = 'none');
      return;
    }
    
    const iconData = THEME_ICONS[this.current] || THEME_ICONS.light;
    
    toggles.forEach(btn => {
      const icon = btn.querySelector('i');
      const label = btn.querySelector('span');
      
      if (icon) {
        icon.className = `fas ${iconData.icon}`;
      }
      if (label) {
        label.textContent = iconData.label;
      }
      btn.setAttribute('aria-pressed', this.current === 'dark');
      btn.setAttribute('aria-label', `Cambiar a ${this.current === 'dark' ? 'claro' : 'oscuro'}`);
    });
  },
  
  // Bind toggle button events
  bindToggle() {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      if (btn.dataset.themeBound === 'true') return;
      btn.dataset.themeBound = 'true';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggle();
      });
    });
  },
  
  // Update meta theme-color
  updateMetaThemeColor(theme) {
    let meta = document.querySelector('meta[name="theme-color"]');
    
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    
    // Use CSS variable value or fallback
    const color = theme === 'dark' ? '#121212' : '#fafafa';
    meta.content = color;
  }
};

// ===== EXPORT FOR EXTERNAL USE =====
export default Theme;
