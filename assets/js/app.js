/**
 * app.js - Main Application Entry Point
 */

import { Theme } from './theme.js';
import { Navigation } from './navigation.js';
import { Auth } from './auth.js';
import { Galeria } from './galeria.js';
import { Videos } from './videos.js';
import { Registry } from './registry.js';
import { DBProyectos, DBRecursos, DBContenido } from './db.js';
import { showToast, escapeHtml } from './utils.js';
import { PLACEHOLDER_FALLBACK } from './data-defaults.js';

class App {
  constructor() {
    this.initialized = false;
    this._proyectos  = [];
    this._recursos   = [];
  }

  async init() {
    if (this.initialized) return;

    Theme.init();
    Navigation.init();
    await Auth.init();

    // Cargar datos base una sola vez
    [this._proyectos, this._recursos] = await Promise.all([
      DBProyectos.getAll(),
      DBRecursos.getAll()
    ]);

    // Módulos de galería y videos (cargan sus propios datos)
    await Promise.all([Galeria.init(), Videos.init()]);
    Registry.init();

    // Renderizar todo
    await this.renderHomepage();
    this.renderProyectosSection();
    this.renderRecursosSection();

    this.bindGlobalEvents();
    this.initialized = true;
    document.dispatchEvent(new CustomEvent('app:ready'));
    return this;
  }

  // ===== HOMEPAGE =====
  async renderHomepage() {
    const content = await DBContenido.get();

    if (content?.hero) {
      const heroTitle    = document.querySelector('#inicio .hero h2');
      const heroSubtitle = document.querySelector('#inicio .hero p');
      if (heroTitle)    heroTitle.textContent    = content.hero.title    || '';
      if (heroSubtitle) heroSubtitle.textContent = content.hero.subtitle || '';
    }

    if (content?.stats?.length) {
      const statCards = document.querySelectorAll('#inicio .stat-card');
      content.stats.forEach((stat, i) => {
        const card = statCards[i];
        if (!card) return;
        const icon  = card.querySelector('.stat-icon i');
        const value = card.querySelector('.stat-content h3');
        const label = card.querySelector('.stat-content p');
        if (icon)  icon.className   = `fas ${stat.icon}`;
        if (value) value.innerHTML  = `${escapeHtml(stat.value)} ${escapeHtml(stat.label)}`;
        if (label) label.textContent = stat.description;
      });
    }

    if (content?.featured?.enabled) {
      this.renderFeaturedBanner(content.featured);
    }

    this.renderFeaturedProjects();
    this.renderFeaturedResources();
    this.renderGalleryPreview();
  }

  renderFeaturedBanner(featured) {
    const container = document.getElementById('featuredBanner');
    if (!container) return;

    if (featured.type === 'video' && featured.url) {
      const videoId = featured.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      if (videoId) {
        container.innerHTML = `
          <div class="featured-banner">
            <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}"
                    title="${escapeHtml(featured.title || '')}"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen style="border:0;width:100%;height:100%"></iframe>
            <div class="featured-banner-content">
              <h3>${escapeHtml(featured.title || '')}</h3>
              <p>${escapeHtml(featured.description || '')}</p>
            </div>
          </div>`;
        return;
      }
    }

    const imgSrc = featured.url || 'assets/images/featured/default.jpg';
    container.innerHTML = `
      <div class="featured-banner">
        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(featured.title || '')}"
             onerror="this.src='assets/images/placeholder.jpg'">
        <div class="featured-banner-content">
          <h3>${escapeHtml(featured.title || '')}</h3>
          <p>${escapeHtml(featured.description || '')}</p>
        </div>
      </div>`;
  }

  renderFeaturedProjects() {
    const container = document.getElementById('featuredProjects');
    if (!container) return;
    const featured = this._proyectos.filter(p => p.destacado).slice(0, 3);
    if (!featured.length) {
      container.innerHTML = '<p class="text-muted">No hay proyectos destacados.</p>';
      return;
    }
    container.innerHTML = featured.map(p => `
      <article class="card">
        ${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.titulo)}" class="card-image" onerror="this.style.display='none'">` : ''}
        <div class="card-header">
          <div class="card-icon"><i class="fas fa-rocket"></i></div>
          <span class="card-badge">${escapeHtml(p.tag || '')}</span>
        </div>
        <h3>${escapeHtml(p.titulo)}</h3>
        <p>${escapeHtml(p.descripcion || '')}</p>
      </article>`).join('');
  }

  renderFeaturedResources() {
    const container = document.getElementById('featuredResources');
    if (!container) return;
    const items = this._recursos.slice(0, 3);
    if (!items.length) {
      container.innerHTML = '<p class="text-muted">No hay recursos disponibles.</p>';
      return;
    }
    container.innerHTML = items.map(r => `
      <article class="card">
        <div class="card-header">
          <div class="card-icon"><i class="fas fa-building"></i></div>
          <span class="card-badge">${escapeHtml(r.tag || '')}</span>
        </div>
        <h3>${escapeHtml(r.titulo)}</h3>
        <p>${escapeHtml(r.descripcion || '')}</p>
      </article>`).join('');
  }

  renderGalleryPreview() {
    const container = document.getElementById('galeriaPreview');
    if (!container) return;
    const featured = Galeria.getFeatured(4);
    if (!featured.length) {
      container.innerHTML = '<p class="text-muted">No hay imágenes destacadas.</p>';
      return;
    }
    container.innerHTML = `
      <div class="grid-2">
        ${featured.map((item, i) => `
          <div class="gallery-item" style="aspect-ratio:1" data-preview-index="${i}">
            <img src="${escapeHtml(item.url || PLACEHOLDER_FALLBACK)}" alt="${escapeHtml(item.titulo)}"
                 loading="lazy" onerror="this.src='assets/images/placeholder.jpg'">
            <div class="gallery-item-overlay"><h4>${escapeHtml(item.titulo)}</h4></div>
          </div>`).join('')}
      </div>
      <div style="text-align:center;margin-top:1rem">
        <a href="#galeria" class="btn btn-secondary btn-sm" data-tab-trigger="galeria">
          Ver toda la galería <i class="fas fa-arrow-right"></i>
        </a>
      </div>`;

    container.querySelectorAll('.gallery-item[data-preview-index]').forEach(el => {
      el.addEventListener('click', () => {
        Navigation.activateTab('galeria');
        setTimeout(() => Galeria.openLightbox(parseInt(el.dataset.previewIndex)), 300);
      });
    });
  }

  // ===== SECCIONES PÚBLICAS =====
  renderProyectosSection() {
    const container = document.getElementById('proyectosList');
    if (!container) return;

    if (!this._proyectos.length) {
      container.innerHTML = '<p class="text-muted">No hay proyectos disponibles.</p>';
      return;
    }

    container.innerHTML = this._proyectos.map(p => `
      <article class="card" role="listitem">
        ${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.titulo)}" class="card-image" onerror="this.style.display='none'">` : ''}
        <div class="card-header">
          <div class="card-icon"><i class="fas fa-rocket"></i></div>
          <span class="card-badge">${escapeHtml(p.tag || '')}</span>
        </div>
        <h3>${escapeHtml(p.titulo)}</h3>
        <p>${escapeHtml(p.descripcion || '')}</p>
        ${p.fecha ? `<small class="text-muted"><i class="fas fa-calendar"></i> ${new Date(p.fecha).toLocaleDateString('es-CO')}</small>` : ''}
      </article>`).join('');
  }

  renderRecursosSection() {
    const container = document.getElementById('recursosList');
    if (!container) return;

    if (!this._recursos.length) {
      container.innerHTML = '<p class="text-muted">No hay recursos disponibles.</p>';
      return;
    }

    container.innerHTML = this._recursos.map(r => `
      <article class="card" role="listitem">
        <div class="card-header">
          <div class="card-icon"><i class="fas fa-building"></i></div>
          <span class="card-badge">${escapeHtml(r.tag || '')}</span>
        </div>
        <h3>${escapeHtml(r.titulo)}</h3>
        <p>${escapeHtml(r.descripcion || '')}</p>
        <div style="margin-top:.75rem;display:flex;flex-direction:column;gap:.25rem;font-size:.85rem;color:var(--color-text-muted)">
          ${r.direccion ? `<span><i class="fas fa-location-dot"></i> ${escapeHtml(r.direccion)}</span>` : ''}
          ${r.telefono  ? `<span><i class="fas fa-phone"></i> ${escapeHtml(r.telefono)}</span>`  : ''}
          ${r.horario   ? `<span><i class="fas fa-clock"></i> ${escapeHtml(r.horario)}</span>`   : ''}
        </div>
      </article>`).join('');
  }

  // ===== EVENTOS GLOBALES =====
  bindGlobalEvents() {
    document.addEventListener('click', e => {
      const trigger = e.target.closest('[data-tab-trigger]');
      if (trigger) { e.preventDefault(); Navigation.activateTab(trigger.dataset.tabTrigger); }
    });

    // Cuando el admin actualiza contenido, re-renderizar homepage
    document.addEventListener('content:updated', () => this.renderHomepage());
  }
}

const app = new App();

document.addEventListener('DOMContentLoaded', () => {
  app.init().catch(err => {
    console.error('Error al iniciar la aplicación:', err);
    showToast('Error al cargar la aplicación', 'error');
  });
});

export default app;
export { App, Theme, Navigation, Auth, Galeria, Videos, Registry };
