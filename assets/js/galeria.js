/**
 * galeria.js - Galería de imágenes — datos desde Supabase
 */

import { DBGaleria } from './db.js';
import { escapeHtml, showToast, generateId, confirmDialog, getImageUrl } from './utils.js';
import { PLACEHOLDER_FALLBACK } from './data-defaults.js';

const CATEGORIES = ['Todas', 'Eventos', 'Infraestructura', 'Capacitación', 'Testimonios'];

export const Galeria = {
  items: [],
  filteredItems: [],
  currentFilter: 'Todas',
  currentPage: 1,
  itemsPerPage: 12,
  lightboxIndex: 0,
  initialized: false,

  async init() {
    await this.loadItems();
    if (!this.initialized) {
      this.bindFilters();
      this.bindLightbox();
      this.initialized = true;
    }
    this.render();
    return this;
  },

  async loadItems() {
    this.items = await DBGaleria.getAll();
    this.applyFilter();
  },

  applyFilter(category = this.currentFilter) {
    this.currentFilter = category;
    this.filteredItems = category === 'Todas'
      ? [...this.items]
      : this.items.filter(i => i.categoria === category);
    this.currentPage = 1;
    this.render();
  },

  getPaginatedItems() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredItems.slice(start, start + this.itemsPerPage);
  },

  render() {
    const container = document.getElementById('galeriaList');
    if (!container) return;

    const items = this.getPaginatedItems();

    if (items.length === 0) {
      container.innerHTML = `
        <div class="gallery-empty">
          <i class="fas fa-images" aria-hidden="true"></i>
          <h4>No hay imágenes</h4>
          <p>Agrega imágenes desde el panel de administración.</p>
        </div>`;
      this.renderFilters();
      this.renderPagination();
      return;
    }

    container.innerHTML = items.map(item => {
      const isVideo = item.type === 'video';
      const thumb = escapeHtml(item.url || PLACEHOLDER_FALLBACK);
      const idx = this.filteredItems.indexOf(item);
      return `
        <article class="gallery-item${isVideo ? ' gallery-item--video' : ''}"
                 data-id="${item.id}" data-index="${idx}"
                 tabindex="0" role="button"
                 aria-label="${isVideo ? 'Reproducir' : 'Ver'}: ${escapeHtml(item.titulo)}">
          <img src="${thumb}" alt="${escapeHtml(item.titulo)}" loading="lazy" data-fallback="true">
          ${isVideo ? '<div class="gallery-play-btn" aria-hidden="true"><i class="fas fa-play"></i></div>' : ''}
          ${item.destacado ? '<span class="gallery-item-badge">Destacado</span>' : ''}
          <div class="gallery-item-overlay">
            <h4>${escapeHtml(item.titulo)}</h4>
            <p>${escapeHtml(item.descripcion || '')}</p>
          </div>
        </article>`;
    }).join('');

    container.querySelectorAll('img[data-fallback]').forEach(img => {
      img.addEventListener('error', () => { img.src = PLACEHOLDER_FALLBACK; }, { once: true });
    });

    container.querySelectorAll('.gallery-item').forEach(el => {
      el.addEventListener('click', () => this.openLightbox(parseInt(el.dataset.index)));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openLightbox(parseInt(el.dataset.index));
        }
      });
    });

    this.renderFilters();
    this.renderPagination();
  },

  renderFilters() {
    const fc = document.getElementById('galeriaFilters');
    if (!fc) return;
    fc.innerHTML = CATEGORIES.map(cat => `
      <button class="filter-btn ${cat === this.currentFilter ? 'active' : ''}"
              data-category="${cat}" aria-pressed="${cat === this.currentFilter}">
        ${escapeHtml(cat)}
      </button>`).join('');
    this.bindFilters();
  },

  renderPagination() {
    const pc = document.getElementById('galeriaPagination');
    if (!pc) return;
    const total = Math.ceil(this.filteredItems.length / this.itemsPerPage);
    if (total <= 1) { pc.innerHTML = ''; return; }

    let html = `<button class="pagination-btn" data-page="prev" ${this.currentPage === 1 ? 'disabled' : ''} aria-label="Anterior"><i class="fas fa-chevron-left"></i></button><div class="pagination-numbers">`;
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
        html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}" aria-label="Página ${i}">${i}</button>`;
      } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
        html += `<span class="pagination-ellipsis">...</span>`;
      }
    }
    html += `</div><button class="pagination-btn" data-page="next" ${this.currentPage === total ? 'disabled' : ''} aria-label="Siguiente"><i class="fas fa-chevron-right"></i></button>`;
    pc.innerHTML = html;

    pc.querySelectorAll('.pagination-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.dataset.page;
        if (p === 'prev' && this.currentPage > 1) this.currentPage--;
        else if (p === 'next' && this.currentPage < total) this.currentPage++;
        else if (!isNaN(p)) this.currentPage = parseInt(p);
        this.render();
        document.getElementById('galeriaList')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  },

  bindFilters() {
    document.querySelectorAll('#galeriaFilters .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => this.applyFilter(btn.dataset.category));
    });
  },

  // ===== LIGHTBOX =====
  openLightbox(index) {
    this.lightboxIndex = index;
    const lightbox = document.getElementById('galleryLightbox');
    if (!lightbox) return;
    const item = this.filteredItems[index];
    if (!item) return;

    const mediaEl = lightbox.querySelector('.lightbox-media');
    if (item.type === 'video' && item.provider === 'facebook') {
      const src = `https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fvideo%2F${item.video_id || item.videoId}%2F&show_text=false&width=640&height=360&appId`;
      mediaEl.innerHTML = `<iframe src="${src}" title="${escapeHtml(item.titulo)}" width="640" height="360" style="border:none;overflow:hidden;max-width:100%" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" loading="lazy"></iframe>`;
    } else {
      mediaEl.innerHTML = `<img src="${escapeHtml(item.url || PLACEHOLDER_FALLBACK)}" alt="${escapeHtml(item.titulo)}">`;
      mediaEl.querySelector('img').addEventListener('error', e => { e.target.src = PLACEHOLDER_FALLBACK; }, { once: true });
    }

    lightbox.querySelector('.lightbox-caption h4').textContent = item.titulo;
    lightbox.querySelector('.lightbox-caption p').textContent = item.descripcion || '';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('.lightbox-close')?.focus();
    this.bindLightboxNav();
  },

  closeLightbox() {
    const lightbox = document.getElementById('galleryLightbox');
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    lightbox.querySelector('.lightbox-media').innerHTML = '';
  },

  bindLightbox() {
    const lightbox = document.getElementById('galleryLightbox');
    if (!lightbox) return;
    lightbox.querySelector('.lightbox-close')?.addEventListener('click', () => this.closeLightbox());
    lightbox.addEventListener('click', e => { if (e.target === lightbox) this.closeLightbox(); });
    document.addEventListener('keydown', this.handleLightboxKey.bind(this));
  },

  bindLightboxNav() {
    const lightbox = document.getElementById('galleryLightbox');
    if (!lightbox) return;
    const prev = lightbox.querySelector('.lightbox-prev');
    const next = lightbox.querySelector('.lightbox-next');
    // Clone to remove old listeners
    prev?.replaceWith(prev.cloneNode(true));
    next?.replaceWith(next.cloneNode(true));
    lightbox.querySelector('.lightbox-prev')?.addEventListener('click', () => {
      const ni = this.lightboxIndex > 0 ? this.lightboxIndex - 1 : this.filteredItems.length - 1;
      this.openLightbox(ni);
    });
    lightbox.querySelector('.lightbox-next')?.addEventListener('click', () => {
      const ni = this.lightboxIndex < this.filteredItems.length - 1 ? this.lightboxIndex + 1 : 0;
      this.openLightbox(ni);
    });
  },

  handleLightboxKey(e) {
    const lightbox = document.getElementById('galleryLightbox');
    if (!lightbox?.classList.contains('active')) return;
    if (e.key === 'Escape') this.closeLightbox();
    else if (e.key === 'ArrowLeft') { e.preventDefault(); this.openLightbox(this.lightboxIndex > 0 ? this.lightboxIndex - 1 : this.filteredItems.length - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); this.openLightbox(this.lightboxIndex < this.filteredItems.length - 1 ? this.lightboxIndex + 1 : 0); }
  },

  // ===== CRUD (usado por admin-panel) =====
  async saveItem(formData) {
    const { titulo, descripcion, categoria, url, destacado, id } = formData;
    if (!titulo || !url) { showToast('Título y URL son requeridos', 'error'); return false; }

    const payload = {
      titulo: titulo.trim(),
      descripcion: (descripcion || '').trim(),
      categoria: categoria || 'Eventos',
      url: url.trim(),
      destacado: !!destacado,
      fecha: formData.fecha || new Date().toISOString().slice(0, 10),
      type: formData.type || 'image',
      provider: formData.provider || null,
      video_id: formData.videoId || formData.video_id || null,
      video_url: formData.videoUrl || formData.video_url || null
    };

    let result;
    if (id) {
      result = await DBGaleria.update(id, payload);
      if (result) showToast('Imagen actualizada');
    } else {
      result = await DBGaleria.insert(payload);
      if (result) showToast('Imagen agregada');
    }

    if (!result) { showToast('Error al guardar', 'error'); return false; }
    await this.loadItems();
    return true;
  },

  async deleteItem(id) {
    const ok = await confirmDialog('¿Eliminar esta imagen?', 'Confirmar eliminación');
    if (!ok) return;
    await DBGaleria.remove(id);
    showToast('Imagen eliminada');
    await this.loadItems();
  },

  getFeatured(limit = 4) {
    return this.items.filter(i => i.destacado).slice(0, limit);
  }
};

export default Galeria;
