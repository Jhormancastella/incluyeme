/**
 * videos.js - Video Gallery Management
 * CRUD de videos, embeds de YouTube/Vimeo, lightbox
 */

import { Storage, DATA_KEYS } from './storage.js';
import { 
  escapeHtml, 
  showToast, 
  generateId, 
  extractYouTubeId,
  getYouTubeThumbnail,
  isValidUrl,
  confirmDialog,
  getImageUrl
} from './utils.js';
import { DEFAULT_VIDEOS } from './data-defaults.js';

// ===== CONSTANTS =====
const CATEGORIES = ['Todas', 'Tutoriales', 'Eventos', 'Testimonios', 'Institucional'];
const PROVIDERS = {
  youtube: {
    name: 'YouTube',
    embed: (id) => `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
    thumbnail: (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`
  },
  vimeo: {
    name: 'Vimeo',
    embed: (id) => `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`,
    thumbnail: (id) => `https://vumbnail.com/${id}.jpg`
  },
  facebook: {
    name: 'Facebook',
    embed: (id) => `https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fvideo%2F${id}%2F&show_text=false&width=640&height=360&appId`,
    thumbnail: () => null // Facebook no expone thumbnails públicos sin API key
  }
};

// ===== VIDEOS MANAGER =====
export const Videos = {
  
  items: [],
  filteredItems: [],
  currentFilter: 'Todas',
  currentPage: 1,
  itemsPerPage: 12,
  lightboxIndex: 0,
  initialized: false,
  
  // Initialize videos
  async init() {
    if (this.initialized) {
      this.loadItems();
      this.render();
      return this;
    }

    this.loadItems();
    this.bindFilters();
    this.bindLightbox();
    this.bindAdminActions();
    this.render();
    this.initialized = true;
    
    return this;
  },
  
  // Load items from storage
  loadItems() {
    const stored = Storage.get(DATA_KEYS.VIDEOS);
    this.items = stored && stored.length > 0 ? stored : [...DEFAULT_VIDEOS];
    
    // Generate thumbnails for YouTube videos if missing
    this.items.forEach((item, index) => {
      if (item.provider === 'youtube' && !item.thumbnail && item.videoId) {
        item.thumbnail = getYouTubeThumbnail(item.videoId);
      }
      // Facebook: use stored thumbnail or fallback (no public API without key)
      if (item.provider === 'facebook' && !item.thumbnail) {
        item.thumbnail = getImageUrl(null, index);
      }
      // Ensure fallback for any missing thumbnail
      if (!item.thumbnail) {
        item.thumbnail = getImageUrl(null, index);
      }
    });
    
    this.applyFilter();
  },
  
  // Save items to storage
  saveItems() {
    Storage.set(DATA_KEYS.VIDEOS, this.items);
  },
  
  // Apply category filter
  applyFilter(category = this.currentFilter) {
    this.currentFilter = category;
    
    if (category === 'Todas') {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter(item => item.categoria === category);
    }
    
    this.currentPage = 1;
    this.render();
  },
  
  // Get paginated items
  getPaginatedItems() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredItems.slice(start, end);
  },
  
  // Render video grid
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
        </div>
      `;
      return;
    }
    
    container.innerHTML = items.map((item, index) => {
      const provider = PROVIDERS[item.provider] || PROVIDERS.youtube;
      const thumbnail = item.thumbnail || provider.thumbnail(item.videoId);
      
      return `
        <article class="video-item" 
                 data-id="${item.id}" 
                 data-index="${this.filteredItems.indexOf(item)}"
                 tabindex="0"
                 role="button"
                 aria-label="Reproducir: ${escapeHtml(item.titulo)}">
          <img src="${escapeHtml(thumbnail)}" 
               alt="${escapeHtml(item.titulo)}" 
               loading="lazy"
               data-fallback="true">
          <div class="video-play-btn" aria-hidden="true">
            <i class="fas fa-play"></i>
          </div>
          ${item.destacado ? '<span class="gallery-item-badge">Destacado</span>' : ''}
          <span class="video-duration">${escapeHtml(item.duration || '00:00')}</span>
          <div class="video-item-info">
            <h4>${escapeHtml(item.titulo)}</h4>
            <p>${escapeHtml(item.descripcion)}</p>
          </div>
        </article>
      `;
    }).join('');
    
    // Bind image fallback via JS
    container.querySelectorAll('img[data-fallback]').forEach(img => {
      img.addEventListener('error', () => {
        img.src = getImageUrl(null, 0);
      }, { once: true });
    });

    // Bind click events
    container.querySelectorAll('.video-item').forEach(item => {      item.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt(item.dataset.index);
        this.openLightbox(index);
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const index = parseInt(item.dataset.index);
          this.openLightbox(index);
        }
      });
    });
    
    // Render filters and pagination
    this.renderFilters();
    this.renderPagination();
  },
  
  // Render filter buttons
  renderFilters() {
    const filterContainer = document.getElementById('videosFilters');
    if (!filterContainer) return;
    
    filterContainer.innerHTML = CATEGORIES.map(cat => `
      <button class="filter-btn ${cat === this.currentFilter ? 'active' : ''}" 
              data-category="${cat}"
              aria-pressed="${cat === this.currentFilter}">
        ${escapeHtml(cat)}
      </button>
    `).join('');
    
    this.bindFilters();
  },
  
  // Render pagination
  renderPagination() {
    const paginationContainer = document.getElementById('videosPagination');
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }
    
    let html = `
      <button class="pagination-btn" data-page="prev" ${this.currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i>
      </button>
      <div class="pagination-numbers">
    `;
    
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
        html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
      } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
        html += `<span class="pagination-ellipsis">...</span>`;
      }
    }
    
    html += `
      </div>
      <button class="pagination-btn" data-page="next" ${this.currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-chevron-right"></i>
      </button>
    `;
    
    paginationContainer.innerHTML = html;
    
    paginationContainer.querySelectorAll('.pagination-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        if (page === 'prev' && this.currentPage > 1) this.currentPage--;
        else if (page === 'next' && this.currentPage < totalPages) this.currentPage++;
        else if (!isNaN(page)) this.currentPage = parseInt(page);
        this.render();
        document.getElementById('videosList')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  },
  
  bindFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
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
    const embedUrl = provider.embed(item.videoId);

    // Facebook requires different iframe attributes (no sandbox, specific allow)
    const isFacebook = item.provider === 'facebook';
    const iframeAttrs = isFacebook
      ? `src="${embedUrl}"
         title="${escapeHtml(item.titulo)}"
         width="640" height="360"
         style="border:none;overflow:hidden"
         scrolling="no"
         frameborder="0"
         allowfullscreen="true"
         allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
         loading="lazy"`
      : `src="${embedUrl}"
         title="${escapeHtml(item.titulo)}"
         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
         allowfullscreen
         loading="lazy"
         sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"`;

    // Update content
    lightbox.querySelector('.lightbox-media').innerHTML = `
      <iframe ${iframeAttrs}></iframe>
    `;
    lightbox.querySelector('.lightbox-caption h4').textContent = item.titulo;
    lightbox.querySelector('.lightbox-caption p').textContent = item.descripcion;
    
    // Show lightbox
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    lightbox.querySelector('.lightbox-close')?.focus();
    this.bindLightboxNav();
  },
  
  closeLightbox() {
    const lightbox = document.getElementById('videoLightbox');
    if (!lightbox) return;
    
    // Stop video by clearing iframe
    lightbox.querySelector('.lightbox-media').innerHTML = '';
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  },
  
  bindLightbox() {
    const lightbox = document.getElementById('videoLightbox');
    if (!lightbox) return;
    
    lightbox.querySelector('.lightbox-close')?.addEventListener('click', () => this.closeLightbox());
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) this.closeLightbox();
    });
    document.addEventListener('keydown', this.handleLightboxKey.bind(this));
  },
  
  bindLightboxNav() {
    const lightbox = document.getElementById('videoLightbox');
    if (!lightbox) return;
    
    lightbox.querySelector('.lightbox-prev')?.addEventListener('click', () => {
      const newIndex = this.lightboxIndex > 0 ? this.lightboxIndex - 1 : this.filteredItems.length - 1;
      this.openLightbox(newIndex);
    });
    lightbox.querySelector('.lightbox-next')?.addEventListener('click', () => {
      const newIndex = this.lightboxIndex < this.filteredItems.length - 1 ? this.lightboxIndex + 1 : 0;
      this.openLightbox(newIndex);
    });
  },
  
  handleLightboxKey(e) {
    const lightbox = document.getElementById('videoLightbox');
    if (!lightbox?.classList.contains('active')) return;
    
    if (e.key === 'Escape') {
      this.closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const newIndex = this.lightboxIndex > 0 ? this.lightboxIndex - 1 : this.filteredItems.length - 1;
      this.openLightbox(newIndex);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const newIndex = this.lightboxIndex < this.filteredItems.length - 1 ? this.lightboxIndex + 1 : 0;
      this.openLightbox(newIndex);
    }
  },
  
  // ===== ADMIN ACTIONS =====
  bindAdminActions() {
    document.getElementById('adminAddVideo')?.addEventListener('click', () => this.openAdminModal('add'));
    
    document.addEventListener('click', (e) => {
      if (e.target.closest('.admin-edit-video')) {
        this.openAdminModal('edit', e.target.closest('.admin-edit-video').dataset.id);
      }
      if (e.target.closest('.admin-delete-video')) {
        this.deleteVideo(e.target.closest('.admin-delete-video').dataset.id);
      }
    });
  },
  
  openAdminModal(mode, id = null) {
    const modal = document.getElementById('adminVideoModal');
    if (!modal) return;
    
    const form = modal.querySelector('#adminVideoForm');
    const title = modal.querySelector('.admin-modal-header h3');
    
    if (mode === 'add') {
      title.textContent = 'Agregar nuevo video';
      form.reset();
      form.dataset.mode = 'add';
      delete form.dataset.id;
    } else if (mode === 'edit' && id) {
      title.textContent = 'Editar video';
      const item = this.items.find(i => i.id === id);
      if (item) {
        form.dataset.mode = 'edit';
        form.dataset.id = id;
        form.querySelector('#vidTitulo').value = item.titulo;
        form.querySelector('#vidDescripcion').value = item.descripcion;
        form.querySelector('#vidCategoria').value = item.categoria;
        form.querySelector('#vidProvider').value = item.provider;
        form.querySelector('#vidUrl').value = item.videoUrl || '';
        form.querySelector('#vidDuration').value = item.duration || '';
        form.querySelector('#vidDestacado').checked = item.destacado || false;
      }
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Auto-extract video ID when URL changes
    form.querySelector('#vidUrl')?.addEventListener('blur', (e) => {
      const videoId = extractYouTubeId(e.target.value);
      if (videoId) {
        form.querySelector('#vidVideoId').value = videoId;
        // Auto-generate thumbnail preview
        const preview = form.querySelector('#vidThumbnailPreview');
        if (preview) {
          preview.src = getYouTubeThumbnail(videoId);
          preview.style.display = 'block';
        }
      }
    });
  },
  
  closeAdminModal() {
    const modal = document.getElementById('adminVideoModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  },
  
  // Save video from admin form
  async saveVideo(formData) {
    const { titulo, descripcion, categoria, provider, videoUrl, duration, destacado } = formData;
    
    if (!titulo || !videoUrl) {
      showToast('Título y URL del video son requeridos', 'error');
      return false;
    }
    
    const videoId = extractYouTubeId(videoUrl) || formData.videoId;
    if (!videoId && provider === 'youtube') {
      showToast('URL de YouTube inválida', 'error');
      return false;
    }
    
    const thumbnail = formData.thumbnail || 
      (provider === 'youtube' ? getYouTubeThumbnail(videoId) : '');
    
    const videoData = {
      id: formData.id || generateId(),
      titulo: escapeHtml(titulo),
      descripcion: escapeHtml(descripcion),
      categoria,
      provider: provider || 'youtube',
      videoUrl: escapeHtml(videoUrl),
      videoId: videoId,
      thumbnail: escapeHtml(thumbnail),
      duration: escapeHtml(duration || '00:00'),
      destacado: !!destacado,
      fecha: formData.fecha || new Date().toISOString()
    };
    
    if (formData.id) {
      const index = this.items.findIndex(i => i.id === formData.id);
      if (index !== -1) {
        this.items[index] = videoData;
        showToast('Video actualizado');
      }
    } else {
      this.items.unshift(videoData);
      showToast('Video agregado');
    }
    
    this.saveItems();
    this.applyFilter();
    return true;
  },
  
  // Delete video
  async deleteVideo(id) {
    const confirmed = await confirmDialog('¿Eliminar este video?', 'Confirmar eliminación');
    if (!confirmed) return;
    
    const index = this.items.findIndex(i => i.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.saveItems();
      this.applyFilter();
      showToast('Video eliminado');
    }
  },
  
  // Get featured videos for homepage
  getFeatured(limit = 3) {
    return this.items
      .filter(item => item.destacado)
      .slice(0, limit);
  },
  
  // Search videos
  search(query) {
    if (!query) {
      this.applyFilter();
      return;
    }
    const lowerQuery = query.toLowerCase();
    this.filteredItems = this.items.filter(item => 
      item.titulo.toLowerCase().includes(lowerQuery) ||
      item.descripcion.toLowerCase().includes(lowerQuery) ||
      item.categoria.toLowerCase().includes(lowerQuery)
    );
    this.currentPage = 1;
    this.render();
  }
};

// ===== EXPORT =====
export default Videos;
