/**
 * galeria.js - Image Gallery Management
 * CRUD de imágenes, filtros, lightbox y renderizado
 */

import { Storage, DATA_KEYS } from './storage.js';
import { 
  escapeHtml, 
  showToast, 
  generateId, 
  confirmDialog,
  getImageUrl
} from './utils.js';
import { DEFAULT_GALERIA, PLACEHOLDER_FALLBACK } from './data-defaults.js';

// ===== CONSTANTS =====
const CATEGORIES = ['Todas', 'Eventos', 'Infraestructura', 'Capacitación', 'Testimonios', 'Videos'];

// ===== GALLERY MANAGER =====
export const Galeria = {
  
  items: [],
  filteredItems: [],
  currentFilter: 'Todas',
  currentPage: 1,
  itemsPerPage: 12,
  lightboxIndex: 0,
  initialized: false,
  
  // Initialize gallery
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
    const stored = Storage.get(DATA_KEYS.GALERIA);
    this.items = stored && stored.length > 0 ? stored : [...DEFAULT_GALERIA];
    this.applyFilter();
  },
  
  // Save items to storage
  saveItems() {
    Storage.set(DATA_KEYS.GALERIA, this.items);
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
  
  // Render gallery grid
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
        </div>
      `;
      return;
    }
    
    container.innerHTML = items.map((item, index) => {
      const isVideo = item.type === 'video';
      const thumb = escapeHtml(getImageUrl(item.url, index));
      return `
        <article class="gallery-item${isVideo ? ' gallery-item--video' : ''}" 
                 data-id="${item.id}" 
                 data-index="${this.filteredItems.indexOf(item)}"
                 tabindex="0"
                 role="button"
                 aria-label="${isVideo ? 'Reproducir' : 'Ver'}: ${escapeHtml(item.titulo)}">
          <img src="${thumb}" 
               alt="${escapeHtml(item.titulo)}" 
               loading="lazy"
               data-fallback="true">
          ${isVideo ? '<div class="gallery-play-btn" aria-hidden="true"><i class="fas fa-play"></i></div>' : ''}
          ${item.destacado ? '<span class="gallery-item-badge">Destacado</span>' : ''}
          <div class="gallery-item-overlay">
            <h4>${escapeHtml(item.titulo)}</h4>
            <p>${escapeHtml(item.descripcion)}</p>
          </div>
        </article>
      `;
    }).join('');
    
    // Bind image fallback via JS (avoids onerror inline with data URI)
    container.querySelectorAll('img[data-fallback]').forEach(img => {
      img.addEventListener('error', () => {
        img.src = PLACEHOLDER_FALLBACK;
        img.removeEventListener('error', () => {});
      }, { once: true });
    });

    // Bind click events
    container.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', (e) => {
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
    
    // Render filters
    this.renderFilters();
    
    // Render pagination
    this.renderPagination();
  },
  
  // Render filter buttons
  renderFilters() {
    const filterContainer = document.getElementById('galeriaFilters');
    if (!filterContainer) return;
    
    filterContainer.innerHTML = CATEGORIES.map(cat => `
      <button class="filter-btn ${cat === this.currentFilter ? 'active' : ''}" 
              data-category="${cat}"
              aria-pressed="${cat === this.currentFilter}">
        ${escapeHtml(cat)}
      </button>
    `).join('');
    
    // Re-bind filter events
    this.bindFilters();
  },
  
  // Render pagination
  renderPagination() {
    const paginationContainer = document.getElementById('galeriaPagination');
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }
    
    let html = `
      <button class="pagination-btn" data-page="prev" ${this.currentPage === 1 ? 'disabled' : ''} aria-label="Página anterior">
        <i class="fas fa-chevron-left"></i>
      </button>
      <div class="pagination-numbers">
    `;
    
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
        html += `
          <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                  data-page="${i}"
                  aria-label="Página ${i}"
                  aria-current="${i === this.currentPage ? 'page' : 'false'}">
            ${i}
          </button>
        `;
      } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
        html += `<span class="pagination-ellipsis">...</span>`;
      }
    }
    
    html += `
      </div>
      <button class="pagination-btn" data-page="next" ${this.currentPage === totalPages ? 'disabled' : ''} aria-label="Página siguiente">
        <i class="fas fa-chevron-right"></i>
      </button>
    `;
    
    paginationContainer.innerHTML = html;
    
    // Bind pagination events
    paginationContainer.querySelectorAll('.pagination-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        if (page === 'prev' && this.currentPage > 1) {
          this.currentPage--;
        } else if (page === 'next' && this.currentPage < totalPages) {
          this.currentPage++;
        } else if (!isNaN(page)) {
          this.currentPage = parseInt(page);
        }
        this.render();
        // Scroll to gallery
        document.getElementById('galeriaList')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  },
  
  // Bind filter button events
  bindFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.applyFilter(btn.dataset.category);
      });
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
      const embedSrc = `https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fvideo%2F${item.videoId}%2F&show_text=false&width=640&height=360&appId`;
      mediaEl.innerHTML = `
        <iframe src="${embedSrc}"
                title="${escapeHtml(item.titulo)}"
                width="640" height="360"
                style="border:none;overflow:hidden;max-width:100%"
                scrolling="no"
                frameborder="0"
                allowfullscreen="true"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                loading="lazy">
        </iframe>
      `;
    } else {
      mediaEl.innerHTML = `
        <img src="${escapeHtml(getImageUrl(item.url))}" 
             alt="${escapeHtml(item.titulo)}">
      `;
      mediaEl.querySelector('img').addEventListener('error', (e) => {
        e.target.src = PLACEHOLDER_FALLBACK;
      }, { once: true });
    }

    lightbox.querySelector('.lightbox-caption h4').textContent = item.titulo;
    lightbox.querySelector('.lightbox-caption p').textContent = item.descripcion;
    
    // Show lightbox
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus close button
    lightbox.querySelector('.lightbox-close')?.focus();
    
    // Bind navigation
    this.bindLightboxNav();
  },
  
  closeLightbox() {
    const lightbox = document.getElementById('galleryLightbox');
    if (!lightbox) return;
    
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    
    // Clear media to stop any loading/playback
    lightbox.querySelector('.lightbox-media').innerHTML = '';
  },
  
  bindLightbox() {
    const lightbox = document.getElementById('galleryLightbox');
    if (!lightbox) return;
    
    // Close button
    lightbox.querySelector('.lightbox-close')?.addEventListener('click', () => {
      this.closeLightbox();
    });
    
    // Close on overlay click
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        this.closeLightbox();
      }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', this.handleLightboxKey.bind(this));
  },
  
  bindLightboxNav() {
    const lightbox = document.getElementById('galleryLightbox');
    if (!lightbox) return;
    
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    
    prevBtn?.addEventListener('click', () => {
      const newIndex = this.lightboxIndex > 0 
        ? this.lightboxIndex - 1 
        : this.filteredItems.length - 1;
      this.openLightbox(newIndex);
    });
    
    nextBtn?.addEventListener('click', () => {
      const newIndex = this.lightboxIndex < this.filteredItems.length - 1 
        ? this.lightboxIndex + 1 
        : 0;
      this.openLightbox(newIndex);
    });
  },
  
  handleLightboxKey(e) {
    const lightbox = document.getElementById('galleryLightbox');
    if (!lightbox?.classList.contains('active')) return;
    
    if (e.key === 'Escape') {
      this.closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const newIndex = this.lightboxIndex > 0 
        ? this.lightboxIndex - 1 
        : this.filteredItems.length - 1;
      this.openLightbox(newIndex);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const newIndex = this.lightboxIndex < this.filteredItems.length - 1 
        ? this.lightboxIndex + 1 
        : 0;
      this.openLightbox(newIndex);
    }
  },
  
  // ===== ADMIN ACTIONS =====
  bindAdminActions() {
    // Add image
    document.getElementById('adminAddImage')?.addEventListener('click', () => {
      this.openAdminModal('add');
    });
    
    // Edit image (delegated)
    document.addEventListener('click', (e) => {
      if (e.target.closest('.admin-edit-image')) {
        const id = e.target.closest('.admin-edit-image').dataset.id;
        this.openAdminModal('edit', id);
      }
      if (e.target.closest('.admin-delete-image')) {
        const id = e.target.closest('.admin-delete-image').dataset.id;
        this.deleteImage(id);
      }
    });
  },
  
  openAdminModal(mode, id = null) {
    const modal = document.getElementById('adminImageModal');
    if (!modal) return;
    
    const form = modal.querySelector('#adminImageForm');
    const title = modal.querySelector('.admin-modal-header h3');
    
    if (mode === 'add') {
      title.textContent = 'Agregar nueva imagen';
      form.reset();
      form.dataset.mode = 'add';
      delete form.dataset.id;
    } else if (mode === 'edit' && id) {
      title.textContent = 'Editar imagen';
      const item = this.items.find(i => i.id === id);
      if (item) {
        form.dataset.mode = 'edit';
        form.dataset.id = id;
        form.querySelector('#imgTitulo').value = item.titulo;
        form.querySelector('#imgDescripcion').value = item.descripcion;
        form.querySelector('#imgCategoria').value = item.categoria;
        form.querySelector('#imgUrl').value = item.url;
        form.querySelector('#imgDestacado').checked = item.destacado || false;
      }
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },
  
  closeAdminModal() {
    const modal = document.getElementById('adminImageModal');
    if (!modal) return;
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
  },
  
  // Save image from admin form
  async saveImage(formData) {
    const { titulo, descripcion, categoria, url, destacado } = formData;
    
    if (!titulo || !url) {
      showToast('Título y URL son requeridos', 'error');
      return false;
    }
    
    const imageData = {
      id: formData.id || generateId(),
      titulo: escapeHtml(titulo),
      descripcion: escapeHtml(descripcion),
      categoria,
      url: escapeHtml(url),
      destacado: !!destacado,
      fecha: formData.fecha || new Date().toISOString()
    };
    
    if (formData.id) {
      // Update existing
      const index = this.items.findIndex(i => i.id === formData.id);
      if (index !== -1) {
        this.items[index] = imageData;
        showToast('Imagen actualizada');
      }
    } else {
      // Add new
      this.items.unshift(imageData);
      showToast('Imagen agregada');
    }
    
    this.saveItems();
    this.applyFilter();
    return true;
  },
  
  // Delete image
  async deleteImage(id) {
    const confirmed = await confirmDialog('¿Eliminar esta imagen?', 'Confirmar eliminación');
    if (!confirmed) return;
    
    const index = this.items.findIndex(i => i.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.saveItems();
      this.applyFilter();
      showToast('Imagen eliminada');
    }
  },
  
  // Get featured images for homepage
  getFeatured(limit = 3) {
    return this.items
      .filter(item => item.destacado)
      .slice(0, limit);
  },
  
  // Search images
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
export default Galeria;
