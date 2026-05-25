/**
 * navigation.js - Tab Navigation & Mobile Menu
 * Gestión de pestañas y menú responsive
 */

// ===== CONSTANTS =====
const SELECTORS = {
  TABS: '.nav-btn',
  HEADER_TAB_ACTIONS: '.admin-action-btn',
  MOBILE_TABS: '.mobile-nav-btn',
  SECTIONS: '.section',
  MOBILE_MENU: '.mobile-menu-overlay',
  MENU_TOGGLE: '.menu-toggle',
  MENU_CLOSE: '.mobile-menu-close'
};

// ===== NAVIGATION MANAGER =====
export const Navigation = {
  
  currentTab: 'inicio',
  mobileMenuOpen: false,
  initialized: false,

  isTabSection(tabId) {
    return document.getElementById(tabId)?.classList.contains('section');
  },
  
  // Initialize navigation
  init() {
    if (this.initialized) return this;

    this.bindDesktopTabs();
    this.bindHeaderTabActions();
    this.bindMobileTabs();
    this.bindMobileMenu();
    this.bindKeyboardNav();
    
    // Set initial active tab from URL hash or default
    const hashTab = window.location.hash.replace('#', '');
    if (hashTab && this.isTabSection(hashTab)) {
      this.activateTab(hashTab);
    }
    
    // Handle hash changes
    window.addEventListener('hashchange', () => {
      const hashTab = window.location.hash.replace('#', '');
      if (hashTab && this.isTabSection(hashTab)) {
        this.activateTab(hashTab);
      }
    });

    this.initialized = true;
    
    return this;
  },
  
  // Activate a tab by ID
  activateTab(tabId) {
    if (!this.isTabSection(tabId)) {
      console.warn(`Tab not found: ${tabId}`);
      return;
    }
    
    this.currentTab = tabId;
    
    // Update desktop buttons
    document.querySelectorAll(SELECTORS.TABS).forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive);
    });

    document.querySelectorAll(SELECTORS.HEADER_TAB_ACTIONS).forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // Update mobile buttons
    document.querySelectorAll(SELECTORS.MOBILE_TABS).forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // Update sections
    document.querySelectorAll(SELECTORS.SECTIONS).forEach(section => {
      const isActive = section.id === tabId;
      section.classList.toggle('active-section', isActive);
      section.setAttribute('aria-hidden', !isActive);
      // inert prevents focus from entering hidden sections (fixes aria-hidden + focus warning)
      if (isActive) {
        section.removeAttribute('inert');
      } else {
        section.setAttribute('inert', '');
      }
    });
    
    // Update URL hash without scroll jump
    if (window.location.hash !== `#${tabId}`) {
      history.replaceState(null, null, `#${tabId}`);
    }
    
    // Close mobile menu if open
    this.closeMobileMenu();
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Dispatch event
    document.dispatchEvent(new CustomEvent('nav:tabChanged', { detail: { tabId } }));

    // Mover foco al encabezado de la sección activa para evitar
    // el warning de aria-hidden con foco retenido en sección oculta
    const activeSection = document.getElementById(tabId);
    if (activeSection) {
      const heading = activeSection.querySelector('h2, h3, [tabindex="-1"]');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }
  },
  
  // Get current tab
  getCurrentTab() {
    return this.currentTab;
  },
  
  // ===== DESKTOP TABS =====
  bindDesktopTabs() {
    document.querySelectorAll(SELECTORS.TABS).forEach(btn => {
      if (btn.dataset.navBound === 'true') return;
      btn.dataset.navBound = 'true';

      // Click handler
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.activateTab(btn.dataset.tab);
      });
      
      // Keyboard navigation
      btn.addEventListener('keydown', (e) => {
        const tabs = Array.from(document.querySelectorAll(SELECTORS.TABS));
        const currentIndex = tabs.indexOf(btn);
        
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const next = tabs[(currentIndex + 1) % tabs.length];
          next.focus();
          this.activateTab(next.dataset.tab);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prev = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
          prev.focus();
          this.activateTab(prev.dataset.tab);
        } else if (e.key === 'Home') {
          e.preventDefault();
          tabs[0].focus();
          this.activateTab(tabs[0].dataset.tab);
        } else if (e.key === 'End') {
          e.preventDefault();
          tabs[tabs.length - 1].focus();
          this.activateTab(tabs[tabs.length - 1].dataset.tab);
        }
      });
    });
  },

  bindHeaderTabActions() {
    document.querySelectorAll(SELECTORS.HEADER_TAB_ACTIONS).forEach(btn => {
      if (btn.dataset.navBound === 'true') return;
      btn.dataset.navBound = 'true';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.activateTab(btn.dataset.tab);
      });
    });
  },
  
  // ===== MOBILE TABS =====
  bindMobileTabs() {
    document.querySelectorAll(SELECTORS.MOBILE_TABS).forEach(btn => {
      if (btn.dataset.navBound === 'true') return;
      btn.dataset.navBound = 'true';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.activateTab(btn.dataset.tab);
      });
    });
  },
  
  // ===== MOBILE MENU =====
  bindMobileMenu() {
    const toggle = document.querySelector(SELECTORS.MENU_TOGGLE);
    const close = document.querySelector(SELECTORS.MENU_CLOSE);
    const overlay = document.querySelector(SELECTORS.MOBILE_MENU);
    
    if (!toggle || !overlay) return;

    if (toggle.dataset.menuBound === 'true') return;
    toggle.dataset.menuBound = 'true';
    
    // Open menu
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      this.openMobileMenu();
    });
    
    // Close menu
    if (close) {
      close.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeMobileMenu();
      });
    }
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeMobileMenu();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.mobileMenuOpen) {
        this.closeMobileMenu();
        toggle.focus();
      }
    });
    
    // Prevent scroll when menu is open
    const originalOverflow = document.body.style.overflow;
    const observer = new MutationObserver(() => {
      if (this.mobileMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = originalOverflow;
      }
    });
    observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
  },
  
  // Open mobile menu
  openMobileMenu() {
    const overlay = document.querySelector(SELECTORS.MOBILE_MENU);
    const toggle = document.querySelector(SELECTORS.MENU_TOGGLE);
    
    if (!overlay) return;
    
    overlay.classList.add('active');
    this.mobileMenuOpen = true;
    
    // Update toggle state
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Cerrar menú');
      toggle.innerHTML = '<i class="fas fa-times"></i>';
    }
    
    // Focus first nav item
    const firstNav = overlay.querySelector('.mobile-nav-btn, .mobile-nav-link');
    if (firstNav) {
      setTimeout(() => firstNav.focus(), 300);
    }
    
    document.dispatchEvent(new CustomEvent('nav:menuOpened'));
  },
  
  // Close mobile menu
  closeMobileMenu() {
    const overlay = document.querySelector(SELECTORS.MOBILE_MENU);
    const toggle = document.querySelector(SELECTORS.MENU_TOGGLE);
    
    if (!overlay) return;
    
    overlay.classList.remove('active');
    this.mobileMenuOpen = false;
    
    // Update toggle state
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú');
      toggle.innerHTML = '<i class="fas fa-bars"></i>';
    }
    
    document.dispatchEvent(new CustomEvent('nav:menuClosed'));
  },
  
  // Toggle mobile menu
  toggleMobileMenu() {
    if (this.mobileMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  },
  
  // ===== KEYBOARD NAVIGATION =====
  bindKeyboardNav() {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Skip if typing in input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      
      // Alt + [1-5] to navigate tabs
      if (e.altKey && /^[1-5]$/.test(e.key)) {
        e.preventDefault();
        const tabs = Array.from(document.querySelectorAll(SELECTORS.TABS));
        const index = parseInt(e.key) - 1;
        if (tabs[index]) {
          this.activateTab(tabs[index].dataset.tab);
        }
      }
    });
  }
};

// ===== EXPORT =====
export default Navigation;
