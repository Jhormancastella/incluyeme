/**
 * videos.js - Galería de videos — datos desde Supabase
 */

import { DBVideos } from './db.js';
import { escapeHtml, showToast, generateId, confirmDialog, getImageUrl, extractYouTubeId, getYouTubeThumbnail } from './utils.js';
import { PLACEHOLDER_FALLBACK } from './data-defaults.js';

const CATEGORIES = ['Todas', 'Tutoriales', 'Eventos', 'Testimonios', 'Institucional'];

const PROVIDERS = {
  youtube: {
    embed: id => `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
    thumbnail: id => `https://img.youtube.com/vi/${id}/hqdefault.jpg`
  },
  vimeo: {
    embed: id => `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`,
    thumbnail: id => `https://vumbnail.com/${id}.jpg`
  },
  facebook: {
    embed: id => `https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fvideo%2F${id}%2F&show_text=false&width=640&height=360&appId`,
    thumbnail: () => null
  }
};

export const Videos = {
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
    const rows = await DBVideos.getAll();
    this.items = rows.map(v => ({
      ...v,
      // Normaliza: la columna en Supabase es video_id
      videoId:   v.video_id   || '',
      videoUrl:  v.video_url  || '',
      thumbnail: v.thumbnail  || (v.provider === 'youtube' && v.video_id
        ? getYouTubeThumbnail(v.video_id)
        : PLACEHOLDER_FALLBACK)
    }));
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
    const container = document.getElementById('videosList');
    if (!container) return;

    const items = this.getPaginatedItems();

    if (items.length === 0) {
      container.innerHTML = `
        <div class="gallery-empty">
          <i class="fas fa-video" aria-hidden="true"></i>
          <h4>No hay videos</h4>
          <p>Agrega videos desde el panel de administración.</p>
        </div>`;
      this.renderFilters();
      this.renderPagination();
      return;
    }

    container.innerHTML = items.map(item => {
      const thumb = item.thumbnail || PLACEHOLDER_FALLBACK;
      const idx = this.filteredItems.indexOf(item);
      return `
        <article class="video-item" data-id="${item.id}" data-index="${idx}"
                 tabindex="0" role="button" aria-label="Reproducir: ${escapeHtml(item.titulo)}">
          <img src="${escapeHtml(thumb)}" alt="${escapeHtml(item.titulo)}" loading="lazy" data-fallback="true">
          <div class="video-play-btn" aria-hidden="true"><i class="fas fa-play"></i></div>
          ${item.destacado ? '<span class="gallery-item-badge">Destacado</span>' : ''}
          <span class="video-duration">${escapeHtml(item.duration || '')}</span>
          <div class="video-item-info">
            <h4>${escapeHtml(item.titulo)}</h4>
            <p>${escapeHtml(item.descripcion || '')}</p>
          </div>
        </article>`;
    }).join('');

    container.querySelectorAll('img[data-fallback]').forEach(img => {
      img.addEventListener('error', () => { img.src = PLACEHOLDER_FALLBACK; }, { once: true });
    });

    container.querySelectorAll('.video-item').forEach(el => {
      el.addEventListener('click', () => this.openLightbox(parseInt(el.dataset.index)));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.openLightbox(parseInt(el.dataset.index)); }
      });
    });

    this.renderFilters();
    this.renderPagination();
  },

  renderFilters() {
    const fc = document.getElementById('videosFilters');
    if (!fc) return;
    fc.innerHTML = CATEGORIES.map(cat => `
      <button class="filter-btn ${cat === this.currentFilter ? 'active' : ''}"
              data-category="${cat}" aria-pressed="${cat === this.currentFilter}">
        ${escapeHtml(cat)}
      </button>`).join('');
    this.bindFilters();
  },

  renderPagination() {
    const pc = document.getElementById('videosPagination');
    if (!pc) return;
    const total = Math.ceil(this.filteredItems.length / this.itemsPerPage);
    if (total <= 1) { pc.innerHTML = ''; return; }

    let html = `<button class="pagination-btn" data-page="prev" ${this.currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button><div class="pagination-numbers">`;
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
        html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
      } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
        html += `<span class="pagination-ellipsis">...</span>`;
      }
    }
    html += `</div><button class="pagination-btn" data-page="next" ${this.currentPage === total ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
    pc.innerHTML = html;

    pc.querySelectorAll('.pagination-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.dataset.page;
        if (p === 'prev' && this.currentPage > 1) this.currentPage--;
        else if (p === 'next' && this.currentPage < total) this.currentPage++;
        else if (!isNaN(p)) this.currentPage = parseInt(p);
        this.render();
        document.getElementById('videosList')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  },

  bindFilters() {
    document.querySelectorAll('#videosFilters .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => this.applyFilter(btn.dataset.category));
    });
  },

  // ===== LIGHTBOX =====
  openLightbox(index) {
    this.lightboxIndex = index;
    const lightbox = document.getElementById('videoLightbox');
    if (!lightbox) return;
    const item = this.filteredItems[index];
    if (!item) return;

    const provider = PROVIDERS[item.provider] || PROVIDERS.youtube;
    const videoId = item.video_id || item.videoId;
    const embedUrl = provider.embed(videoId);
    const isFacebook = item.provider === 'facebook';

    const iframeAttrs = isFacebook
      ? `src="${embedUrl}" title="${escapeHtml(item.titulo)}" width="640" height="360" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" loading="lazy"`
      : `src="${embedUrl}" title="${escapeHtml(item.titulo)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"`;

    lightbox.querySelector('.lightbox-media').innerHTML = `<iframe ${iframeAttrs}></iframe>`;
    lightbox.querySelector('.lightbox-caption h4').textContent = item.titulo;
    lightbox.querySelector('.lightbox-caption p').textContent = item.descripcion || '';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('.lightbox-close')?.focus();
    this.bindLightboxNav();
  },

  closeLightbox() {
    const lightbox = document.getElementById('videoLightbox');
    if (!lightbox) return;
    lightbox.querySelector('.lightbox-media').innerHTML = '';
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  },

  bindLightbox() {
    const lightbox = document.getElementById('videoLightbox');
    if (!lightbox) return;
    lightbox.querySelector('.lightbox-close')?.addEventListener('click', () => this.closeLightbox());
    lightbox.addEventListener('click', e => { if (e.target === lightbox) this.closeLightbox(); });
    document.addEventListener('keydown', this.handleLightboxKey.bind(this));
  },

  bindLightboxNav() {
    const lightbox = document.getElementById('videoLightbox');
    if (!lightbox) return;
    const prev = lightbox.querySelector('.lightbox-prev');
    const next = lightbox.querySelector('.lightbox-next');
    prev?.replaceWith(prev.cloneNode(true));
    next?.replaceWith(next.cloneNode(true));
    lightbox.querySelector('.lightbox-prev')?.addEventListener('click', () => {
      this.openLightbox(this.lightboxIndex > 0 ? this.lightboxIndex - 1 : this.filteredItems.length - 1);
    });
    lightbox.querySelector('.lightbox-next')?.addEventListener('click', () => {
      this.openLightbox(this.lightboxIndex < this.filteredItems.length - 1 ? this.lightboxIndex + 1 : 0);
    });
  },

  handleLightboxKey(e) {
    const lightbox = document.getElementById('videoLightbox');
    if (!lightbox?.classList.contains('active')) return;
    if (e.key === 'Escape') this.closeLightbox();
    else if (e.key === 'ArrowLeft') { e.preventDefault(); this.openLightbox(this.lightboxIndex > 0 ? this.lightboxIndex - 1 : this.filteredItems.length - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); this.openLightbox(this.lightboxIndex < this.filteredItems.length - 1 ? this.lightboxIndex + 1 : 0); }
  },

  // ===== CRUD (usado por admin-panel) =====
  async saveItem(formData) {
    const { titulo, descripcion, categoria, provider, videoUrl, duration, destacado, id } = formData;
    if (!titulo || !videoUrl) { showToast('Título y URL son requeridos', 'error'); return false; }

    const videoId = extractYouTubeId(videoUrl) || formData.videoId || formData.video_id || '';
    const thumbnail = formData.thumbnail || (provider === 'youtube' && videoId ? getYouTubeThumbnail(videoId) : '');

    const payload = {
      titulo: titulo.trim(),
      descripcion: (descripcion || '').trim(),
      categoria: categoria || 'Eventos',
      provider: provider || 'youtube',
      video_url: videoUrl.trim(),
      video_id: videoId,
      thumbnail: thumbnail,
      duration: duration || '',
      destacado: !!destacado,
      fecha: formData.fecha || new Date().toISOString().slice(0, 10)
    };

    let result;
    if (id) {
      result = await DBVideos.update(id, payload);
      if (result) showToast('Video actualizado');
    } else {
      result = await DBVideos.insert(payload);
      if (result) showToast('Video agregado');
    }

    if (!result) { showToast('Error al guardar', 'error'); return false; }
    await this.loadItems();
    return true;
  },

  async deleteItem(id) {
    const ok = await confirmDialog('¿Eliminar este video?', 'Confirmar eliminación');
    if (!ok) return;
    await DBVideos.remove(id);
    showToast('Video eliminado');
    await this.loadItems();
  },

  getFeatured(limit = 3) {
    return this.items.filter(i => i.destacado).slice(0, limit);
  }
};

export default Videos;
