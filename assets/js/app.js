/**
 * app.js - Main Application Entry Point
 * Inicialización y orquestación de todos los módulos
 */

// Import all modules
import { Storage, DATA_KEYS, initStorage } from './storage.js';
import { Theme } from './theme.js';
import { Navigation } from './navigation.js';
import { Auth } from './auth.js';
import { Galeria } from './galeria.js';
import { Videos } from './videos.js';
import { Registry } from './registry.js';
import { ensureDefaults } from './data-defaults.js';
import { showToast, escapeHtml } from './utils.js';

// ===== APPLICATION CLASS =====
class App {
  
  constructor() {
    this.initialized = false;
    this.modules = {};
  }
  
  // Initialize the application
  async init() {
    if (this.initialized) return;
    
    // 1. Initialize storage with defaults
    initStorage();
    ensureDefaults(Storage, DATA_KEYS);
    
    // 2. Initialize core modules
    Theme.init();
    Navigation.init();
    Auth.init();
    
    // 3. Initialize feature modules
    this.modules.galeria = await Galeria.init();
    this.modules.videos = await Videos.init();
    this.modules.registry = Registry.init();
    
    // 4. Render dynamic content on homepage
    this.renderHomepage();
    
    // 6. Bind global events
    this.bindGlobalEvents();
    
    this.initialized = true;
    
    document.dispatchEvent(new CustomEvent('app:ready'));
    return this;
  }
  
  // Render dynamic content on homepage
  renderHomepage() {
    // Update hero content
    const content = Storage.get(DATA_KEYS.CONTENT);
    if (content?.hero) {
      const heroTitle = document.querySelector('#inicio .hero h2');
      const heroSubtitle = document.querySelector('#inicio .hero p');
      if (heroTitle) heroTitle.textContent = escapeHtml(content.hero.title);
      if (heroSubtitle) heroSubtitle.textContent = escapeHtml(content.hero.subtitle);
    }
    
    // Update stats
    if (content?.stats) {
      const statCards = document.querySelectorAll('#inicio .stat-card');
      content.stats.forEach((stat, index) => {
        const card = statCards[index];
        if (card) {
          const icon = card.querySelector('.stat-icon i');
          const value = card.querySelector('.stat-content h3');
          const label = card.querySelector('.stat-content p');
          
          if (icon) icon.className = `fas ${stat.icon}`;
          if (value) value.innerHTML = `${escapeHtml(stat.value)} ${escapeHtml(stat.label)}`;
          if (label) label.textContent = stat.description;
        }
      });
    }
    
    // Render featured banner if enabled
    if (content?.featured?.enabled) {
      this.renderFeaturedBanner(content.featured);
    }
    
    // Render featured projects preview
    this.renderFeaturedProjects();
    
    // Render featured resources preview
    this.renderFeaturedResources();
    
    // Render gallery preview
    this.renderGalleryPreview();
  }
  
  // Render featured banner
  renderFeaturedBanner(featured) {
    const container = document.getElementById('featuredBanner');
    if (!container) return;
    
    if (featured.type === 'video' && featured.url) {
      const videoId = featured.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      if (videoId) {
        container.innerHTML = `
          <div class="featured-banner">
            <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}" 
                    title="${escapeHtml(featured.title)}"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    style="border:0;width:100%;height:100%">
            </iframe>
            <div class="featured-banner-content">
              <h3>${escapeHtml(featured.title)}</h3>
              <p>${escapeHtml(featured.description)}</p>
            </div>
          </div>
        `;
        return;
      }
    }
    
    // Default: image banner
    const img = document.createElement('img');
    img.src = escapeHtml(featured.url || 'assets/images/featured/default.jpg');
    img.alt = escapeHtml(featured.title);
    img.addEventListener('error', () => { img.src = 'assets/images/placeholder.jpg'; }, { once: true });

    container.innerHTML = `
      <div class="featured-banner">
        <div class="featured-banner-content">
          <h3>${escapeHtml(featured.title)}</h3>
          <p>${escapeHtml(featured.description)}</p>
        </div>
      </div>
    `;
    container.querySelector('.featured-banner').prepend(img);
  }
  
  // Render featured projects preview
  renderFeaturedProjects() {
    const container = document.getElementById('featuredProjects');
    if (!container) return;
    
    const proyectos = Storage.get(DATA_KEYS.PROYECTOS, []);
    const featured = proyectos.filter(p => p.destacado).slice(0, 3);
    
    if (featured.length === 0) {
      container.innerHTML = '<p class="text-muted">No hay proyectos destacados.</p>';
      return;
    }
    
    container.innerHTML = featured.map(p => `
      <article class="card">
        ${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.titulo)}" class="card-image" data-fallback="true">` : ''}
        <div class="card-header">
          <div class="card-icon"><i class="fas fa-rocket"></i></div>
          <span class="card-badge">${escapeHtml(p.tag)}</span>
        </div>
        <h3>${escapeHtml(p.titulo)}</h3>
        <p>${escapeHtml(p.descripcion)}</p>
      </article>
    `).join('');

    container.querySelectorAll('img[data-fallback]').forEach(img => {
      img.addEventListener('error', () => { img.style.display = 'none'; }, { once: true });
    });
  }
  
  // Render featured resources preview
  renderFeaturedResources() {
    const container = document.getElementById('featuredResources');
    if (!container) return;
    
    const recursos = Storage.get(DATA_KEYS.RECURSOS, []);
    const items = recursos.slice(0, 3);
    
    if (items.length === 0) {
      container.innerHTML = '<p class="text-muted">No hay recursos disponibles.</p>';
      return;
    }
    
    container.innerHTML = items.map(r => `
      <article class="card">
        <div class="card-header">
          <div class="card-icon"><i class="fas fa-building"></i></div>
          <span class="card-badge">${escapeHtml(r.tag)}</span>
        </div>
        <h3>${escapeHtml(r.titulo)}</h3>
        <p>${escapeHtml(r.descripcion)}</p>
      </article>
    `).join('');
  }
  
  // Render gallery preview on homepage
  renderGalleryPreview() {
    const container = document.getElementById('galeriaPreview');
    if (!container) return;
    
    const galeria = Storage.get(DATA_KEYS.GALERIA, []);
    const featured = galeria.filter(g => g.destacado).slice(0, 4);
    
    if (featured.length === 0) {
      container.innerHTML = '<p class="text-muted">No hay imágenes destacadas.</p>';
      return;
    }
    
    container.innerHTML = `
      <div class="grid-2">
        ${featured.map(item => `
          <div class="gallery-item" style="aspect-ratio:1">
            <img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.titulo)}" loading="lazy" data-fallback="true">
            <div class="gallery-item-overlay">
              <h4>${escapeHtml(item.titulo)}</h4>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="text-align:center;margin-top:1rem">
        <a href="#galeria" class="btn btn-secondary btn-sm" data-tab-trigger="galeria">
          Ver toda la galería <i class="fas fa-arrow-right"></i>
        </a>
      </div>
    `;

    // Bind image fallback via JS
    container.querySelectorAll('img[data-fallback]').forEach(img => {
      img.addEventListener('error', () => { img.src = 'assets/images/placeholder.jpg'; }, { once: true });
    });
    
    // Bind preview click to navigate
    container.querySelectorAll('.gallery-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        Navigation.activateTab('galeria');
        setTimeout(() => {
          Galeria.openLightbox(index);
        }, 300);
      });
    });
  }
  
  // Bind global events
  bindGlobalEvents() {
    // Handle tab triggers from preview links
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-tab-trigger]');
      if (trigger) {
        e.preventDefault();
        Navigation.activateTab(trigger.dataset.tabTrigger);
      }
    });
    
    // Handle content updates from admin
    document.addEventListener('content:updated', () => {
      this.renderHomepage();
    });
    
    // Handle theme changes
    document.addEventListener('theme:changed', () => {
      // Could trigger analytics, etc.
    });
    
    // Handle navigation changes
    document.addEventListener('nav:tabChanged', () => {
      // Could trigger analytics, etc.
    });
    
    // Visibility change - extend session if active
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && Auth.isAuthenticated()) {
        Auth.extendSession();
      }
    });
    
    // Before unload - save any pending changes
    window.addEventListener('beforeunload', (e) => {
      // Could warn about unsaved changes in admin forms
    });
  }
  
  // Get module by name
  getModule(name) {
    return this.modules[name];
  }
  
  // Destroy application (for testing/HMR)
  destroy() {
    this.initialized = false;
    this.modules = {};
    document.dispatchEvent(new CustomEvent('app:destroy'));
  }
}

// ===== SINGLETON INSTANCE =====
const app = new App();

// ===== AUTO-INIT ON DOM READY =====
document.addEventListener('DOMContentLoaded', () => {
  app.init().catch(error => {
    console.error('❌ Error al iniciar la aplicación:', error);
    showToast('Error al cargar la aplicación', 'error');
  });
});

// ===== EXPORT FOR EXTERNAL USE =====
export default app;
export { App, Storage, DATA_KEYS, Theme, Navigation, Auth, Galeria, Videos, Registry };
