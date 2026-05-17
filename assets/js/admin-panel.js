/**
 * admin-panel.js - Panel de Administración Dedicado
 * LocalStorage como capa de datos (migrable a Supabase)
 * Bugs corregidos: validaciones, filtros, extracción de IDs, destacado en recursos
 */

import { Storage, DATA_KEYS } from './storage.js';
import { Auth } from './auth.js';
import { Theme } from './theme.js';
import {
  escapeHtml, showToast, generateId, confirmDialog,
  extractYouTubeId, getYouTubeThumbnail,
  isValidEmail, isValidUrl, exportAsJSON, importJSON, PLACEHOLDER_IMAGE
} from './utils.js';
import { getDefaultData } from './data-defaults.js';

// ===== DATA LAYER (swap this for Supabase later) =====
const DB = {
  get:    (key, fb = []) => Storage.get(key, fb),
  set:    (key, val)     => Storage.set(key, val),
  remove: (key)          => Storage.remove(key),
};

// ===== HELPERS =====
const $  = (id) => document.getElementById(id);
const qs = (sel, ctx = document) => ctx.querySelector(sel);

const PROVIDER_LABELS = { youtube: 'YouTube', vimeo: 'Vimeo', facebook: 'Facebook' };
const PROVIDER_COLORS = { youtube: 'ap-badge-rose', vimeo: 'ap-badge-blue', facebook: 'ap-badge-blue' };

const GALERIA_CATS = ['Eventos', 'Infraestructura', 'Capacitación', 'Testimonios', 'Videos'];
const VIDEO_CATS   = ['Tutoriales', 'Eventos', 'Testimonios', 'Institucional'];
const PROJ_TAGS    = ['En ejecución', 'Buscando voluntarios', 'Inscripciones abiertas', 'Finalizado', 'Planificación'];
const REC_TAGS     = ['Público', 'Privado', 'Gratuito', 'Atención presencial', 'Virtual'];

function imgFallback(img) {
  img.addEventListener('error', () => { img.src = PLACEHOLDER_IMAGE; }, { once: true });
}
function thumb(src) {
  if (!src || src === 'undefined') {
    return `<div class="ap-thumb-empty" title="Sin imagen"><i class="fas fa-image"></i></div>`;
  }
  // Escape src for both the img and the CSS custom property (used for hover preview)
  const safeSrc = src.replace(/'/g, '%27').replace(/"/g, '%22');
  return `<div class="ap-thumb-wrap" style="--thumb-preview:url('${safeSrc}')">
    <img src="${escapeHtml(src)}" class="ap-table-thumb" alt="" loading="lazy">
  </div>`;
}
// Call after inserting thumb HTML to bind error handlers
function bindThumbFallbacks(container) {
  container.querySelectorAll('.ap-table-thumb').forEach(img => {
    imgFallback(img);
    // Also update the CSS var if image fails
    img.addEventListener('error', () => {
      const wrap = img.closest('.ap-thumb-wrap');
      if (wrap) wrap.style.setProperty('--thumb-preview', 'none');
    }, { once: true });
  });
}
function badge(text, cls = 'ap-badge-gray') {
  return `<span class="ap-badge ${cls}">${escapeHtml(String(text || ''))}</span>`;
}
function starBtn(id, on, entity) {
  return `<button class="ap-action-btn star${on ? ' on' : ''}" data-id="${id}" data-entity="${entity}" data-action="star" title="${on ? 'Quitar destacado' : 'Destacar'}"><i class="fas fa-star"></i></button>`;
}
function editBtn(id, entity) {
  return `<button class="ap-action-btn edit" data-id="${id}" data-entity="${entity}" data-action="edit" title="Editar"><i class="fas fa-pen"></i></button>`;
}
function delBtn(id, entity) {
  return `<button class="ap-action-btn delete" data-id="${id}" data-entity="${entity}" data-action="delete" title="Eliminar"><i class="fas fa-trash"></i></button>`;
}

// Extrae ID de video según plataforma
function extractVideoId(url, provider) {
  if (!url) return '';
  if (provider === 'youtube') return extractYouTubeId(url) || '';
  if (provider === 'vimeo')   { const m = url.match(/vimeo\.com\/(\d+)/); return m ? m[1] : ''; }
  if (provider === 'facebook'){ const m = url.match(/\/(\d{10,})\/?/);   return m ? m[1] : ''; }
  return '';
}

// ===== MODAL =====
const Modal = {
  _resolve: null,
  open(title, bodyHtml, { confirmText = 'Guardar', cancelText = 'Cancelar', wide = false } = {}) {
    $('apModalTitle').textContent = title;
    $('apModalBody').innerHTML = bodyHtml;
    $('apModalConfirm').textContent = confirmText;
    $('apModalCancel').textContent = cancelText;
    $('apModal').hidden = false;
    $('apModalBox').classList.toggle('ap-modal-box--wide', wide);
    document.body.style.overflow = 'hidden';
    $('apModalBody').querySelectorAll('img').forEach(imgFallback);
    setTimeout(() => {
      const first = $('apModalBody').querySelector('input:not([type=checkbox]),select,textarea');
      if (first) first.focus();
    }, 60);
    return new Promise(resolve => { this._resolve = resolve; });
  },
  close(result = false) {
    $('apModal').hidden = true;
    document.body.style.overflow = '';
    if (this._resolve) { this._resolve(result); this._resolve = null; }
  },
  init() {
    $('apModalClose').addEventListener('click',   () => this.close(false));
    $('apModalCancel').addEventListener('click',  () => this.close(false));
    $('apModalConfirm').addEventListener('click', () => this.close(true));
    $('apModal').addEventListener('click', e => { if (e.target === $('apModal')) this.close(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('apModal').hidden) this.close(false); });
  }
};

// ===== NAVIGATION =====
const Nav = {
  current: 'dashboard',
  sections: ['dashboard','contenido','proyectos','recursos','galeria','videos','configuracion'],
  titles: {
    dashboard:'Dashboard', contenido:'Contenido principal',
    proyectos:'Proyectos', recursos:'Recursos',
    galeria:'Galería',     videos:'Videos', configuracion:'Configuración'
  },
  go(id) {
    if (!this.sections.includes(id)) return;
    // Reset filters when switching sections
    if (Sections[this.current]?._filter !== undefined) Sections[this.current]._filter = '';
    if (Sections[this.current]?._cat    !== undefined) Sections[this.current]._cat    = '';
    this.current = id;
    this.sections.forEach(s => {
      const sec = $(`sec-${s}`);
      if (sec) sec.classList.toggle('active', s === id);
    });
    document.querySelectorAll('.ap-nav-item').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.section === id));
    $('apTopbarTitle').textContent = this.titles[id] || id;
    Sections[id]?.render?.();
  },
  init() {
    document.querySelectorAll('.ap-nav-item').forEach(btn =>
      btn.addEventListener('click', () => { this.go(btn.dataset.section); if (window.innerWidth < 768) Sidebar.close(); }));
    document.querySelectorAll('[data-goto]').forEach(btn =>
      btn.addEventListener('click', () => this.go(btn.dataset.goto)));
  }
};

// ===== SIDEBAR =====
const Sidebar = {
  open()  { $('apSidebar').classList.add('open');    $('apOverlay').classList.add('active');    $('apMenuBtn').setAttribute('aria-expanded','true');  },
  close() { $('apSidebar').classList.remove('open'); $('apOverlay').classList.remove('active'); $('apMenuBtn').setAttribute('aria-expanded','false'); },
  init()  {
    $('apMenuBtn').addEventListener('click',    () => this.open());
    $('apSidebarClose').addEventListener('click',() => this.close());
    $('apOverlay').addEventListener('click',    () => this.close());
  }
};

// ===== SECTIONS =====
const Sections = {

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  dashboard: {
    render() {
      const p = DB.get(DATA_KEYS.PROYECTOS, []);
      const r = DB.get(DATA_KEYS.RECURSOS,  []);
      const g = DB.get(DATA_KEYS.GALERIA,   []);
      const v = DB.get(DATA_KEYS.VIDEOS,    []);

      $('apStatsGrid').innerHTML = [
        { icon:'fa-rocket',           label:'Proyectos', val:p.length, cls:'blue',   sec:'proyectos' },
        { icon:'fa-map-location-dot', label:'Recursos',  val:r.length, cls:'green',  sec:'recursos'  },
        { icon:'fa-images',           label:'Galería',   val:g.length, cls:'amber',  sec:'galeria'   },
        { icon:'fa-video',            label:'Videos',    val:v.length, cls:'purple', sec:'videos'    },
      ].map(s => `
        <div class="ap-stat" data-goto="${s.sec}" role="button" tabindex="0" aria-label="Ir a ${s.label}">
          <div class="ap-stat-icon ${s.cls}"><i class="fas ${s.icon}"></i></div>
          <div><div class="ap-stat-value">${s.val}</div><div class="ap-stat-label">${s.label}</div></div>
        </div>`).join('');

      document.querySelectorAll('.ap-stat[data-goto]').forEach(el => {
        el.addEventListener('click',   () => Nav.go(el.dataset.goto));
        el.addEventListener('keydown', e => { if (e.key === 'Enter') Nav.go(el.dataset.goto); });
      });

      this._mini('dashProyectos', p.slice(0,5), i =>
        `<div class="ap-mini-row">${thumb(i.image)}<div class="ap-mini-info"><strong>${escapeHtml(i.titulo)}</strong>${badge(i.tag,'ap-badge-blue')}</div></div>`);
      this._mini('dashGaleria', g.slice(0,5), i =>
        `<div class="ap-mini-row">${thumb(i.url)}<div class="ap-mini-info"><strong>${escapeHtml(i.titulo)}</strong>${badge(i.categoria,'ap-badge-amber')}</div></div>`);
      this._mini('dashVideos', v.slice(0,5), i =>
        `<div class="ap-mini-row">${thumb(i.thumbnail)}<div class="ap-mini-info"><strong>${escapeHtml(i.titulo)}</strong>${badge(PROVIDER_LABELS[i.provider]||'Video', PROVIDER_COLORS[i.provider]||'ap-badge-gray')}</div></div>`);
      this._mini('dashRecursos', r.slice(0,5), i =>
        `<div class="ap-mini-row"><div class="ap-mini-icon"><i class="fas fa-building"></i></div><div class="ap-mini-info"><strong>${escapeHtml(i.titulo)}</strong>${badge(i.tag,'ap-badge-green')}</div></div>`);

      document.querySelectorAll('#sec-dashboard .ap-table-thumb').forEach(img => imgFallback(img));
    },
    _mini(id, items, fn) {
      const el = $(id); if (!el) return;
      el.innerHTML = items.length
        ? `<div class="ap-mini-list">${items.map(fn).join('')}</div>`
        : `<p class="ap-empty" style="padding:1.5rem"><i class="fas fa-inbox"></i> Sin datos</p>`;
      el.querySelectorAll('img').forEach(img => imgFallback(img));
    }
  },

  // ── CONTENIDO ──────────────────────────────────────────────────────────────
  contenido: {
    render() {
      const c = DB.get(DATA_KEYS.CONTENT, getDefaultData().content);
      $('heroTitle').value    = c.hero?.title    || '';
      $('heroSubtitle').value = c.hero?.subtitle || '';
      $('featuredType').value    = c.featured?.type    || 'image';
      $('featuredEnabled').value = String(c.featured?.enabled !== false);
      $('featuredUrl').value     = c.featured?.url     || '';
      $('featuredTitle').value   = c.featured?.title   || '';
      $('featuredDesc').value    = c.featured?.description || '';
      this._renderStats(c.stats || []);
    },
    _renderStats(stats) {
      $('statsEditor').innerHTML = stats.map((s, i) => `
        <div class="ap-stat-editor-item">
          <div class="form-group">
            <label>Icono FA</label>
            <input type="text" name="stat_icon_${i}" value="${escapeHtml(s.icon||'')}" placeholder="fa-rocket">
          </div>
          <div class="form-group">
            <label>Valor <span style="color:var(--color-error)">*</span></label>
            <input type="text" name="stat_value_${i}" value="${escapeHtml(s.value||'')}" placeholder="12+">
          </div>
          <div class="form-group">
            <label>Etiqueta <span style="color:var(--color-error)">*</span></label>
            <input type="text" name="stat_label_${i}" value="${escapeHtml(s.label||'')}" placeholder="Proyectos">
          </div>
          <div class="form-group">
            <label>Descripción</label>
            <input type="text" name="stat_desc_${i}" value="${escapeHtml(s.description||'')}" placeholder="Iniciativas activas">
          </div>
        </div>`).join('');
    },
    bindForms() {
      $('formHero').addEventListener('submit', e => {
        e.preventDefault();
        const c = DB.get(DATA_KEYS.CONTENT, getDefaultData().content);
        const title    = $('heroTitle').value.trim();
        const subtitle = $('heroSubtitle').value.trim();
        if (!title) { showToast('El título del hero es obligatorio', 'error'); return; }
        c.hero = { ...c.hero, title, subtitle };
        DB.set(DATA_KEYS.CONTENT, c);
        showToast('Hero guardado ✓');
        document.dispatchEvent(new CustomEvent('content:updated'));
      });

      $('formFeatured').addEventListener('submit', e => {
        e.preventDefault();
        const url = $('featuredUrl').value.trim();
        if (url && !isValidUrl(url)) { showToast('La URL del banner no es válida', 'error'); return; }
        const c = DB.get(DATA_KEYS.CONTENT, getDefaultData().content);
        c.featured = {
          ...c.featured,
          type:        $('featuredType').value,
          enabled:     $('featuredEnabled').value === 'true',
          url,
          title:       $('featuredTitle').value.trim(),
          description: $('featuredDesc').value.trim()
        };
        DB.set(DATA_KEYS.CONTENT, c);
        showToast('Banner guardado ✓');
        document.dispatchEvent(new CustomEvent('content:updated'));
      });

      $('formStats').addEventListener('submit', e => {
        e.preventDefault();
        const c = DB.get(DATA_KEYS.CONTENT, getDefaultData().content);
        let valid = true;
        const updated = c.stats.map((s, i) => {
          const value = (document.querySelector(`[name="stat_value_${i}"]`)?.value || '').trim();
          const label = (document.querySelector(`[name="stat_label_${i}"]`)?.value || '').trim();
          if (!value || !label) { valid = false; }
          return {
            ...s,
            icon:        (document.querySelector(`[name="stat_icon_${i}"]`)?.value  || s.icon).trim(),
            value,
            label,
            description: (document.querySelector(`[name="stat_desc_${i}"]`)?.value  || s.description).trim(),
          };
        });
        if (!valid) { showToast('Valor y etiqueta son obligatorios en cada estadística', 'error'); return; }
        c.stats = updated;
        DB.set(DATA_KEYS.CONTENT, c);
        showToast('Estadísticas guardadas ✓');
        document.dispatchEvent(new CustomEvent('content:updated'));
      });
    }
  },

  // ── PROYECTOS ──────────────────────────────────────────────────────────────
  proyectos: {
    _filter: '',
    render() {
      const items = DB.get(DATA_KEYS.PROYECTOS, []);
      const q = this._filter.toLowerCase();
      const list = q ? items.filter(i =>
        i.titulo.toLowerCase().includes(q) || (i.tag||'').toLowerCase().includes(q) || (i.descripcion||'').toLowerCase().includes(q)
      ) : items;
      const tbody = $('tbodyProyectos');
      if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="ap-empty"><i class="fas fa-rocket"></i>${q ? 'Sin resultados' : 'Sin proyectos. Crea el primero.'}</div></td></tr>`;
        return;
      }
      tbody.innerHTML = list.map(item => `
        <tr>
          <td>${thumb(item.image)}</td>
          <td>
            <strong>${escapeHtml(item.titulo)}</strong>
            <br><small style="color:var(--color-text-muted)">${escapeHtml((item.descripcion||'').slice(0,70))}${item.descripcion?.length>70?'…':''}</small>
          </td>
          <td>${badge(item.tag,'ap-badge-blue')}</td>
          <td>${item.fecha ? new Date(item.fecha).toLocaleDateString('es-CO') : '—'}</td>
          <td>${starBtn(item.id, item.destacado, 'proyectos')}</td>
          <td><div class="ap-table-actions">${editBtn(item.id,'proyectos')}${delBtn(item.id,'proyectos')}</div></td>
        </tr>`).join('');
      bindThumbFallbacks(tbody);
    },
    async openForm(id = null) {
      const items = DB.get(DATA_KEYS.PROYECTOS, []);
      const item  = id ? items.find(i => i.id === id) : null;
      const tagsOpts = PROJ_TAGS.map(t => `<option value="${t}"${item?.tag===t?' selected':''}>${t}</option>`).join('');
      const body = `
        <div class="ap-form-grid">
          <div class="form-group full-width">
            <label>Título <span style="color:var(--color-error)">*</span></label>
            <input type="text" id="mTitulo" value="${escapeHtml(item?.titulo||'')}" placeholder="Nombre del proyecto" maxlength="120">
          </div>
          <div class="form-group full-width">
            <label>Descripción</label>
            <textarea id="mDesc" rows="3" placeholder="Descripción del proyecto..." maxlength="500">${escapeHtml(item?.descripcion||'')}</textarea>
          </div>
          <div class="form-group">
            <label>Etiqueta / Estado</label>
            <select id="mTag">${tagsOpts}</select>
          </div>
          <div class="form-group">
            <label>Fecha de inicio</label>
            <input type="date" id="mFecha" value="${item?.fecha?.slice(0,10)||''}">
          </div>
          <div class="form-group full-width">
            <label>URL de imagen</label>
            <input type="url" id="mImage" value="${escapeHtml(item?.image||'')}" placeholder="https://... o assets/images/proyectos/foto.jpg">
          </div>
          <div class="form-group full-width">
            <label style="cursor:pointer"><input type="checkbox" id="mDestacado"${item?.destacado?' checked':''}> Mostrar en inicio como destacado</label>
          </div>
        </div>`;
      const ok = await Modal.open(id ? 'Editar proyecto' : 'Nuevo proyecto', body, { wide: true });
      if (!ok) return;
      const titulo = $('mTitulo').value.trim();
      if (!titulo) { showToast('El título es obligatorio', 'error'); return; }
      const imageUrl = $('mImage').value.trim();
      if (imageUrl && !isValidUrl(imageUrl)) { showToast('La URL de imagen no es válida', 'error'); return; }
      const data = {
        id:          id || generateId(),
        titulo,
        descripcion: $('mDesc').value.trim(),
        tag:         $('mTag').value,
        fecha:       $('mFecha').value || new Date().toISOString().slice(0,10),
        image:       imageUrl,
        destacado:   $('mDestacado').checked
      };
      if (id) { const idx = items.findIndex(i => i.id === id); if (idx !== -1) items[idx] = data; }
      else items.unshift(data);
      DB.set(DATA_KEYS.PROYECTOS, items);
      showToast(id ? 'Proyecto actualizado ✓' : 'Proyecto creado ✓');
      this.render();
    },
    async delete(id) {
      const item = DB.get(DATA_KEYS.PROYECTOS,[]).find(i => i.id === id);
      const ok = await confirmDialog(`¿Eliminar "${item?.titulo || 'este proyecto'}"? Esta acción no se puede deshacer.`, 'Eliminar proyecto');
      if (!ok) return;
      DB.set(DATA_KEYS.PROYECTOS, DB.get(DATA_KEYS.PROYECTOS,[]).filter(i => i.id !== id));
      showToast('Proyecto eliminado');
      this.render();
    },
    toggleStar(id) {
      const items = DB.get(DATA_KEYS.PROYECTOS, []);
      const item  = items.find(i => i.id === id);
      if (!item) return;
      item.destacado = !item.destacado;
      DB.set(DATA_KEYS.PROYECTOS, items);
      showToast(item.destacado ? 'Marcado como destacado ⭐' : 'Quitado de destacados');
      this.render();
    },
    bindSearch() {
      $('searchProyectos').addEventListener('input', e => { this._filter = e.target.value; this.render(); });
      $('btnNuevoProyecto').addEventListener('click', () => this.openForm());
    }
  },

  // ── RECURSOS ───────────────────────────────────────────────────────────────
  recursos: {
    _filter: '',
    render() {
      const items = DB.get(DATA_KEYS.RECURSOS, []);
      const q = this._filter.toLowerCase();
      const list = q ? items.filter(i =>
        i.titulo.toLowerCase().includes(q) || (i.descripcion||'').toLowerCase().includes(q) || (i.tag||'').toLowerCase().includes(q)
      ) : items;
      const tbody = $('tbodyRecursos');
      if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="ap-empty"><i class="fas fa-map-location-dot"></i>${q ? 'Sin resultados' : 'Sin recursos. Crea el primero.'}</div></td></tr>`;
        return;
      }
      tbody.innerHTML = list.map(item => `
        <tr>
          <td>
            <strong>${escapeHtml(item.titulo)}</strong>
            <br><small style="color:var(--color-text-muted)">${escapeHtml((item.descripcion||'').slice(0,60))}${item.descripcion?.length>60?'…':''}</small>
          </td>
          <td>${badge(item.tag,'ap-badge-green')}</td>
          <td>${escapeHtml(item.direccion||'—')}</td>
          <td>${escapeHtml(item.telefono||'—')}</td>
          <td>${escapeHtml(item.horario||'—')}</td>
          <td>${starBtn(item.id, item.destacado, 'recursos')}</td>
          <td><div class="ap-table-actions">${editBtn(item.id,'recursos')}${delBtn(item.id,'recursos')}</div></td>
        </tr>`).join('');
    },
    async openForm(id = null) {
      const items = DB.get(DATA_KEYS.RECURSOS, []);
      const item  = id ? items.find(i => i.id === id) : null;
      const tagsOpts = REC_TAGS.map(t => `<option value="${t}"${item?.tag===t?' selected':''}>${t}</option>`).join('');
      const body = `
        <div class="ap-form-grid">
          <div class="form-group full-width">
            <label>Nombre del recurso <span style="color:var(--color-error)">*</span></label>
            <input type="text" id="mTitulo" value="${escapeHtml(item?.titulo||'')}" placeholder="Centro de Rehabilitación..." maxlength="120">
          </div>
          <div class="form-group full-width">
            <label>Descripción</label>
            <textarea id="mDesc" rows="3" placeholder="Servicios que ofrece..." maxlength="500">${escapeHtml(item?.descripcion||'')}</textarea>
          </div>
          <div class="form-group">
            <label>Tipo de servicio</label>
            <select id="mTag">${tagsOpts}</select>
          </div>
          <div class="form-group">
            <label>Dirección</label>
            <input type="text" id="mDir" value="${escapeHtml(item?.direccion||'')}" placeholder="Calle 123 #45-67">
          </div>
          <div class="form-group">
            <label>Teléfono</label>
            <input type="tel" id="mTel" value="${escapeHtml(item?.telefono||'')}" placeholder="+57 601 123 4567">
          </div>
          <div class="form-group">
            <label>Horario de atención</label>
            <input type="text" id="mHorario" value="${escapeHtml(item?.horario||'')}" placeholder="Lun-Vie 8:00-17:00">
          </div>
          <div class="form-group full-width">
            <label style="cursor:pointer"><input type="checkbox" id="mDestacado"${item?.destacado?' checked':''}> Mostrar en inicio como destacado</label>
          </div>
        </div>`;
      const ok = await Modal.open(id ? 'Editar recurso' : 'Nuevo recurso', body, { wide: true });
      if (!ok) return;
      const titulo = $('mTitulo').value.trim();
      if (!titulo) { showToast('El nombre es obligatorio', 'error'); return; }
      const data = {
        id:          id || generateId(),
        titulo,
        descripcion: $('mDesc').value.trim(),
        tag:         $('mTag').value,
        direccion:   $('mDir').value.trim(),
        telefono:    $('mTel').value.trim(),
        horario:     $('mHorario').value.trim(),
        destacado:   $('mDestacado').checked
      };
      if (id) { const idx = items.findIndex(i => i.id === id); if (idx !== -1) items[idx] = data; }
      else items.unshift(data);
      DB.set(DATA_KEYS.RECURSOS, items);
      showToast(id ? 'Recurso actualizado ✓' : 'Recurso creado ✓');
      this.render();
    },
    async delete(id) {
      const item = DB.get(DATA_KEYS.RECURSOS,[]).find(i => i.id === id);
      const ok = await confirmDialog(`¿Eliminar "${item?.titulo || 'este recurso'}"?`, 'Eliminar recurso');
      if (!ok) return;
      DB.set(DATA_KEYS.RECURSOS, DB.get(DATA_KEYS.RECURSOS,[]).filter(i => i.id !== id));
      showToast('Recurso eliminado');
      this.render();
    },
    toggleStar(id) {
      const items = DB.get(DATA_KEYS.RECURSOS, []);
      const item  = items.find(i => i.id === id);
      if (!item) return;
      item.destacado = !item.destacado;
      DB.set(DATA_KEYS.RECURSOS, items);
      showToast(item.destacado ? 'Marcado como destacado ⭐' : 'Quitado de destacados');
      this.render();
    },
    bindSearch() {
      $('searchRecursos').addEventListener('input', e => { this._filter = e.target.value; this.render(); });
      $('btnNuevoRecurso').addEventListener('click', () => this.openForm());
    }
  },

  // ── GALERÍA ────────────────────────────────────────────────────────────────
  galeria: {
    _filter: '', _cat: '',
    render() {
      const items = DB.get(DATA_KEYS.GALERIA, []);
      const q = this._filter.toLowerCase();
      const list = items.filter(i =>
        (!q || i.titulo.toLowerCase().includes(q) || (i.descripcion||'').toLowerCase().includes(q)) &&
        (!this._cat || i.categoria === this._cat)
      );
      // Sync search/filter UI
      const si = $('searchGaleria'); if (si && si.value !== this._filter) si.value = this._filter;
      const fi = $('filterGaleria'); if (fi && fi.value !== this._cat)    fi.value = this._cat;

      const tbody = $('tbodyGaleria');
      if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="ap-empty"><i class="fas fa-images"></i>${q||this._cat ? 'Sin resultados' : 'Sin imágenes. Agrega la primera.'}</div></td></tr>`;
        return;
      }
      tbody.innerHTML = list.map(item => {
        const isVid = item.type === 'video';
        return `
          <tr>
            <td style="position:relative">
              ${thumb(item.url)}
              ${isVid ? '<span style="position:absolute;top:4px;left:4px;background:rgba(0,0,0,.6);color:#fff;border-radius:4px;padding:1px 5px;font-size:.65rem"><i class="fas fa-play"></i></span>' : ''}
            </td>
            <td>
              <strong>${escapeHtml(item.titulo)}</strong>
              <br><small style="color:var(--color-text-muted)">${escapeHtml((item.descripcion||'').slice(0,55))}${item.descripcion?.length>55?'…':''}</small>
            </td>
            <td>${badge(item.categoria,'ap-badge-amber')}</td>
            <td>${isVid ? badge(PROVIDER_LABELS[item.provider]||'Video','ap-badge-purple') : badge('Imagen','ap-badge-gray')}</td>
            <td>${item.fecha ? new Date(item.fecha).toLocaleDateString('es-CO') : '—'}</td>
            <td>${starBtn(item.id, item.destacado, 'galeria')}</td>
            <td><div class="ap-table-actions">${editBtn(item.id,'galeria')}${delBtn(item.id,'galeria')}</div></td>
          </tr>`;
      }).join('');
      bindThumbFallbacks(tbody);
    },
    async openForm(id = null) {
      const items = DB.get(DATA_KEYS.GALERIA, []);
      const item  = id ? items.find(i => i.id === id) : null;
      const catOpts = GALERIA_CATS.map(c => `<option value="${c}"${item?.categoria===c?' selected':''}>${c}</option>`).join('');
      const isVid = item?.type === 'video';
      const body = `
        <div class="ap-form-grid">
          <div class="form-group full-width">
            <label>Título <span style="color:var(--color-error)">*</span></label>
            <input type="text" id="mTitulo" value="${escapeHtml(item?.titulo||'')}" placeholder="Título de la imagen" maxlength="120">
          </div>
          <div class="form-group full-width">
            <label>Descripción</label>
            <textarea id="mDesc" rows="2" maxlength="300">${escapeHtml(item?.descripcion||'')}</textarea>
          </div>
          <div class="form-group">
            <label>Categoría</label>
            <select id="mCat">${catOpts}</select>
          </div>
          <div class="form-group">
            <label>Fecha</label>
            <input type="date" id="mFecha" value="${item?.fecha?.slice(0,10)||''}">
          </div>
          <div class="form-group full-width">
            <label>URL de imagen / thumbnail <span style="color:var(--color-error)">*</span></label>
            <input type="url" id="mUrl" value="${escapeHtml(item?.url||'')}" placeholder="https://... o assets/images/gallery/foto.jpg">
          </div>
          <div class="form-group full-width">
            <label style="cursor:pointer;font-weight:600">
              <input type="checkbox" id="mIsVideo"${isVid?' checked':''}> Este item es un video (muestra botón play)
            </label>
          </div>
          <div id="mVideoFields" style="${isVid?'':'display:none'};grid-column:1/-1">
            <div class="ap-form-grid" style="background:var(--color-bg-surface-alt);padding:.75rem;border-radius:var(--radius);gap:.75rem">
              <div class="form-group">
                <label>Plataforma</label>
                <select id="mProvider">
                  <option value="youtube"${item?.provider==='youtube'?' selected':''}>YouTube</option>
                  <option value="vimeo"${item?.provider==='vimeo'?' selected':''}>Vimeo</option>
                  <option value="facebook"${item?.provider==='facebook'?' selected':''}>Facebook</option>
                </select>
              </div>
              <div class="form-group">
                <label>URL completa del video <span style="color:var(--color-error)">*</span></label>
                <input type="url" id="mVideoUrl" value="${escapeHtml(item?.videoUrl||item?.videoId||'')}" placeholder="https://youtube.com/watch?v=...">
                <small style="color:var(--color-text-muted)">Pega la URL completa — el ID se extrae automáticamente</small>
              </div>
            </div>
          </div>
          <div class="form-group full-width">
            <label style="cursor:pointer"><input type="checkbox" id="mDestacado"${item?.destacado?' checked':''}> Mostrar en inicio como destacado</label>
          </div>
        </div>`;
      const ok = await Modal.open(id ? 'Editar imagen' : 'Nueva imagen / video', body, { wide: true });
      if (!ok) return;

      const titulo = $('mTitulo').value.trim();
      if (!titulo) { showToast('El título es obligatorio', 'error'); return; }

      const urlVal = $('mUrl').value.trim();
      if (!urlVal) { showToast('La URL de imagen/thumbnail es obligatoria', 'error'); return; }
      if (!isValidUrl(urlVal) && !urlVal.startsWith('assets/')) {
        showToast('La URL de imagen no parece válida', 'error'); return;
      }

      const isVideoNow = $('mIsVideo').checked;
      let videoId = '', videoUrl = '';
      if (isVideoNow) {
        const provider = $('mProvider').value;
        videoUrl = $('mVideoUrl').value.trim();
        if (!videoUrl) { showToast('La URL del video es obligatoria', 'error'); return; }
        videoId = extractVideoId(videoUrl, provider);
        if (!videoId) { showToast('No se pudo extraer el ID del video. Verifica la URL.', 'error'); return; }
      }

      const data = {
        id:          id || generateId(),
        titulo,
        descripcion: $('mDesc').value.trim(),
        categoria:   $('mCat').value,
        fecha:       $('mFecha').value || new Date().toISOString().slice(0,10),
        url:         urlVal,
        destacado:   $('mDestacado').checked,
        ...(isVideoNow
          ? { type: 'video', provider: $('mProvider').value, videoId, videoUrl }
          : { type: null,    provider: null,                 videoId: null, videoUrl: null })
      };
      if (id) { const idx = items.findIndex(i => i.id === id); if (idx !== -1) items[idx] = data; }
      else items.unshift(data);
      DB.set(DATA_KEYS.GALERIA, items);
      showToast(id ? 'Imagen actualizada ✓' : 'Imagen agregada ✓');
      this.render();
    },
    async delete(id) {
      const item = DB.get(DATA_KEYS.GALERIA,[]).find(i => i.id === id);
      const ok = await confirmDialog(`¿Eliminar "${item?.titulo || 'esta imagen'}"?`, 'Eliminar imagen');
      if (!ok) return;
      DB.set(DATA_KEYS.GALERIA, DB.get(DATA_KEYS.GALERIA,[]).filter(i => i.id !== id));
      showToast('Imagen eliminada');
      this.render();
    },
    toggleStar(id) {
      const items = DB.get(DATA_KEYS.GALERIA, []);
      const item  = items.find(i => i.id === id);
      if (!item) return;
      item.destacado = !item.destacado;
      DB.set(DATA_KEYS.GALERIA, items);
      showToast(item.destacado ? 'Marcado como destacado ⭐' : 'Quitado de destacados');
      this.render();
    },
    bindSearch() {
      $('searchGaleria').addEventListener('input',  e => { this._filter = e.target.value; this.render(); });
      $('filterGaleria').addEventListener('change', e => { this._cat   = e.target.value; this.render(); });
      $('btnNuevaImagen').addEventListener('click', () => this.openForm());
      // Toggle video fields inside modal
      document.addEventListener('change', e => {
        if (e.target.id === 'mIsVideo') {
          const vf = $('mVideoFields');
          if (vf) vf.style.display = e.target.checked ? '' : 'none';
        }
      });
    }
  },

  // ── VIDEOS ─────────────────────────────────────────────────────────────────
  videos: {
    _filter: '', _cat: '',
    render() {
      const items = DB.get(DATA_KEYS.VIDEOS, []);
      const q = this._filter.toLowerCase();
      const list = items.filter(i =>
        (!q || i.titulo.toLowerCase().includes(q) || (i.descripcion||'').toLowerCase().includes(q)) &&
        (!this._cat || i.categoria === this._cat)
      );
      const si = $('searchVideos'); if (si && si.value !== this._filter) si.value = this._filter;
      const fi = $('filterVideos'); if (fi && fi.value !== this._cat)    fi.value = this._cat;

      const tbody = $('tbodyVideos');
      if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="ap-empty"><i class="fas fa-video"></i>${q||this._cat ? 'Sin resultados' : 'Sin videos. Agrega el primero.'}</div></td></tr>`;
        return;
      }
      tbody.innerHTML = list.map(item => `
        <tr>
          <td>${thumb(item.thumbnail)}</td>
          <td>
            <strong>${escapeHtml(item.titulo)}</strong>
            <br><small style="color:var(--color-text-muted)">${escapeHtml((item.descripcion||'').slice(0,55))}${item.descripcion?.length>55?'…':''}</small>
          </td>
          <td>${badge(PROVIDER_LABELS[item.provider]||item.provider||'—', PROVIDER_COLORS[item.provider]||'ap-badge-gray')}</td>
          <td>${badge(item.categoria,'ap-badge-amber')}</td>
          <td>${item.fecha ? new Date(item.fecha).toLocaleDateString('es-CO') : '—'}</td>
          <td>${starBtn(item.id, item.destacado, 'videos')}</td>
          <td><div class="ap-table-actions">${editBtn(item.id,'videos')}${delBtn(item.id,'videos')}</div></td>
        </tr>`).join('');
      bindThumbFallbacks(tbody);
    },
    async openForm(id = null) {
      const items = DB.get(DATA_KEYS.VIDEOS, []);
      const item  = id ? items.find(i => i.id === id) : null;
      const catOpts = VIDEO_CATS.map(c => `<option value="${c}"${item?.categoria===c?' selected':''}>${c}</option>`).join('');
      const body = `
        <div class="ap-form-grid">
          <div class="form-group full-width">
            <label>Título <span style="color:var(--color-error)">*</span></label>
            <input type="text" id="mTitulo" value="${escapeHtml(item?.titulo||'')}" placeholder="Título del video" maxlength="120">
          </div>
          <div class="form-group full-width">
            <label>Descripción</label>
            <textarea id="mDesc" rows="2" maxlength="300">${escapeHtml(item?.descripcion||'')}</textarea>
          </div>
          <div class="form-group">
            <label>Plataforma <span style="color:var(--color-error)">*</span></label>
            <select id="mProvider">
              <option value="youtube"${item?.provider==='youtube'?' selected':''}>YouTube</option>
              <option value="vimeo"${item?.provider==='vimeo'?' selected':''}>Vimeo</option>
              <option value="facebook"${item?.provider==='facebook'?' selected':''}>Facebook</option>
            </select>
          </div>
          <div class="form-group">
            <label>Categoría</label>
            <select id="mCat">${catOpts}</select>
          </div>
          <div class="form-group full-width">
            <label>URL del video <span style="color:var(--color-error)">*</span></label>
            <input type="url" id="mVideoUrl" value="${escapeHtml(item?.videoUrl||'')}" placeholder="https://youtube.com/watch?v=... · https://vimeo.com/... · URL de Facebook">
            <small style="color:var(--color-text-muted)">Pega la URL completa — el ID se extrae automáticamente</small>
          </div>
          <div class="form-group full-width">
            <label>URL de miniatura (thumbnail)</label>
            <input type="url" id="mThumb" value="${escapeHtml(item?.thumbnail||'')}" placeholder="Opcional — se genera automáticamente para YouTube">
          </div>
          <div class="form-group">
            <label>Duración (ej: 5:32)</label>
            <input type="text" id="mDuration" value="${escapeHtml(item?.duration||'')}" placeholder="5:32" maxlength="10">
          </div>
          <div class="form-group">
            <label>Fecha</label>
            <input type="date" id="mFecha" value="${item?.fecha?.slice(0,10)||''}">
          </div>
          <div class="form-group full-width">
            <label style="cursor:pointer"><input type="checkbox" id="mDestacado"${item?.destacado?' checked':''}> Mostrar en galería como destacado</label>
          </div>
        </div>`;
      const ok = await Modal.open(id ? 'Editar video' : 'Nuevo video', body, { wide: true });
      if (!ok) return;

      const titulo   = $('mTitulo').value.trim();
      const videoUrl = $('mVideoUrl').value.trim();
      if (!titulo)   { showToast('El título es obligatorio', 'error'); return; }
      if (!videoUrl) { showToast('La URL del video es obligatoria', 'error'); return; }

      const provider = $('mProvider').value;
      const videoId  = extractVideoId(videoUrl, provider);
      if (!videoId)  { showToast('No se pudo extraer el ID del video. Verifica la URL.', 'error'); return; }

      const thumbVal = $('mThumb').value.trim();
      const thumbnail = thumbVal || (provider === 'youtube' ? getYouTubeThumbnail(videoId) : '');

      const data = {
        id:          id || generateId(),
        titulo,
        descripcion: $('mDesc').value.trim(),
        categoria:   $('mCat').value,
        provider,
        videoId,
        videoUrl,
        thumbnail,
        duration:    $('mDuration').value.trim(),
        fecha:       $('mFecha').value || new Date().toISOString().slice(0,10),
        destacado:   $('mDestacado').checked
      };
      if (id) { const idx = items.findIndex(i => i.id === id); if (idx !== -1) items[idx] = data; }
      else items.unshift(data);
      DB.set(DATA_KEYS.VIDEOS, items);
      showToast(id ? 'Video actualizado ✓' : 'Video agregado ✓');
      this.render();
    },
    async delete(id) {
      const item = DB.get(DATA_KEYS.VIDEOS,[]).find(i => i.id === id);
      const ok = await confirmDialog(`¿Eliminar "${item?.titulo || 'este video'}"?`, 'Eliminar video');
      if (!ok) return;
      DB.set(DATA_KEYS.VIDEOS, DB.get(DATA_KEYS.VIDEOS,[]).filter(i => i.id !== id));
      showToast('Video eliminado');
      this.render();
    },
    toggleStar(id) {
      const items = DB.get(DATA_KEYS.VIDEOS, []);
      const item  = items.find(i => i.id === id);
      if (!item) return;
      item.destacado = !item.destacado;
      DB.set(DATA_KEYS.VIDEOS, items);
      showToast(item.destacado ? 'Marcado como destacado ⭐' : 'Quitado de destacados');
      this.render();
    },
    bindSearch() {
      $('searchVideos').addEventListener('input',  e => { this._filter = e.target.value; this.render(); });
      $('filterVideos').addEventListener('change', e => { this._cat   = e.target.value; this.render(); });
      $('btnNuevoVideo').addEventListener('click', () => this.openForm());
    }
  },

  // ── CONFIGURACIÓN ──────────────────────────────────────────────────────────
  configuracion: {
    render() {
      // Mostrar email actual
      const cfg = DB.get(DATA_KEYS.CONFIG, {});
      const email = cfg.admin?.email || 'admin@municipio.local';
      const hint = $('cfgCurrentEmail');
      if (hint) hint.textContent = `Email actual: ${email}`;
    },
    bindForms() {
      $('formCredenciales').addEventListener('submit', async e => {
        e.preventDefault();
        const email   = $('cfgEmail').value.trim();
        const pass    = $('cfgPass').value;
        const confirm = $('cfgPassConfirm').value;
        if (!email && !pass) { showToast('Ingresa al menos un campo para actualizar', 'warning'); return; }
        if (email && !isValidEmail(email)) { showToast('Email inválido', 'error'); return; }
        if (pass && pass.length < 8) { showToast('La contraseña debe tener al menos 8 caracteres', 'error'); return; }
        if (pass && pass !== confirm) { showToast('Las contraseñas no coinciden', 'error'); return; }
        // Update config in storage
        const cfg = DB.get(DATA_KEYS.CONFIG, {});
        if (!cfg.admin) cfg.admin = {};
        if (email) cfg.admin.email    = email;
        if (pass)  cfg.admin.password = pass;
        DB.set(DATA_KEYS.CONFIG, cfg);
        showToast('Credenciales actualizadas ✓ — cierra sesión para aplicar');
        $('formCredenciales').reset();
        this.render();
      });

      $('btnExport').addEventListener('click', () => {
        const data = {
          exportedAt: new Date().toISOString(),
          proyectos:  DB.get(DATA_KEYS.PROYECTOS, []),
          recursos:   DB.get(DATA_KEYS.RECURSOS,  []),
          galeria:    DB.get(DATA_KEYS.GALERIA,   []),
          videos:     DB.get(DATA_KEYS.VIDEOS,    []),
          content:    DB.get(DATA_KEYS.CONTENT,   {}),
          config:     DB.get(DATA_KEYS.CONFIG,    {})
        };
        exportAsJSON(data, `incluyeme-backup-${new Date().toISOString().slice(0,10)}.json`);
        showToast('Backup exportado ✓');
      });

      $('btnImport').addEventListener('click', async () => {
        try {
          const imported = await importJSON();
          if (!imported || typeof imported !== 'object') throw new Error('Archivo inválido');
          // Support both raw and wrapped format
          const d = imported.data || imported;
          if (d.proyectos) DB.set(DATA_KEYS.PROYECTOS, d.proyectos);
          if (d.recursos)  DB.set(DATA_KEYS.RECURSOS,  d.recursos);
          if (d.galeria)   DB.set(DATA_KEYS.GALERIA,   d.galeria);
          if (d.videos)    DB.set(DATA_KEYS.VIDEOS,    d.videos);
          if (d.content)   DB.set(DATA_KEYS.CONTENT,   d.content);
          if (d.config)    DB.set(DATA_KEYS.CONFIG,    d.config);
          showToast('Datos importados ✓ — recargando...');
          setTimeout(() => location.reload(), 1500);
        } catch (err) {
          showToast('Error al importar: ' + err.message, 'error');
        }
      });

      $('btnReset').addEventListener('click', async () => {
        const ok = await confirmDialog(
          'Esto borrará TODOS los cambios y restaurará los datos de ejemplo. Esta acción no se puede deshacer.',
          '⚠️ Restaurar datos por defecto'
        );
        if (!ok) return;
        const d = getDefaultData();
        DB.set(DATA_KEYS.PROYECTOS, d.proyectos);
        DB.set(DATA_KEYS.RECURSOS,  d.recursos);
        DB.set(DATA_KEYS.GALERIA,   d.galeria);
        DB.set(DATA_KEYS.VIDEOS,    d.videos);
        DB.set(DATA_KEYS.CONTENT,   d.content);
        showToast('Datos restaurados ✓ — recargando...');
        setTimeout(() => location.reload(), 1500);
      });
    }
  }
};

// ===== DELEGATED TABLE ACTIONS =====
function bindTableActions() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id, entity } = btn.dataset;
    if (!id || !entity) return;
    const sec = Sections[entity];
    if (!sec) return;
    if (action === 'edit')   sec.openForm?.(id);
    if (action === 'delete') sec.delete?.(id);
    if (action === 'star')   sec.toggleStar?.(id);
  });
}

// ===== AUTH UI =====
function renderUserInfo() {
  const user  = Auth.getUser?.() || null;
  const email = user?.email || '—';
  $('apUserInfo').innerHTML = `
    <div class="ap-user-info">
      <div class="ap-user-avatar">${escapeHtml(email[0]?.toUpperCase() || 'A')}</div>
      <div class="ap-user-email" title="${escapeHtml(email)}">${escapeHtml(email)}</div>
    </div>`;
}

// ===== THEME TOGGLE =====
function bindTheme() {
  const btn = $('apThemeToggle');
  const update = () => {
    const dark = document.body.classList.contains('dark');
    btn.innerHTML = `<i class="fas fa-${dark ? 'sun' : 'moon'}"></i>`;
    btn.setAttribute('aria-label', dark ? 'Modo claro' : 'Modo oscuro');
  };
  btn.addEventListener('click', () => { Theme.toggle?.(); update(); });
  update();
}

// ===== INJECT MINI-LIST STYLES =====
function injectStyles() {
  if ($('apExtraStyles')) return;
  const s = document.createElement('style');
  s.id = 'apExtraStyles';
  s.textContent = `
    .ap-mini-list { display:flex; flex-direction:column; }
    .ap-mini-row  { display:flex; align-items:center; gap:.75rem; padding:.6rem 1.25rem; border-bottom:1px solid var(--color-border); }
    .ap-mini-row:last-child { border-bottom:none; }
    .ap-mini-icon { width:34px;height:34px;border-radius:var(--radius-xs);background:var(--color-bg-surface-alt);display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);flex-shrink:0; }
    .ap-mini-info { flex:1;min-width:0; }
    .ap-mini-info strong { display:block;font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .ap-modal-box--wide { max-width:720px; }
    #tbodyRecursos td:nth-child(6) { text-align:center; }
  `;
  document.head.appendChild(s);
}

// ===== INIT =====
async function init() {
  Theme.init();
  injectStyles();
  Modal.init();
  Sidebar.init();
  bindTheme();
  bindTableActions();

  // Ensure default data exists in storage
  const { ensureDefaults } = await import('./data-defaults.js');
  const { initStorage } = await import('./storage.js');
  initStorage();
  ensureDefaults(Storage, DATA_KEYS);

  // Bind static forms
  Sections.contenido.bindForms();
  Sections.configuracion.bindForms();
  Sections.proyectos.bindSearch();
  Sections.recursos.bindSearch();
  Sections.galeria.bindSearch();
  Sections.videos.bindSearch();

  // Logout
  $('apLogoutBtn').addEventListener('click', async () => {
    const ok = await confirmDialog('¿Cerrar sesión?', 'Cerrar sesión');
    if (!ok) return;
    Auth.logout();
    window.location.href = 'index.html';
  });

  // Auth check
  if (Auth.isAuthenticated()) {
    $('apLoginWrap').hidden = true;
    $('apContent').hidden   = false;
    renderUserInfo();
    Nav.init();
    Nav.go('dashboard');
  } else {
    $('apLoginWrap').hidden = false;
    $('apContent').hidden   = true;
    $('apLogoutBtn').style.display = 'none';

    $('apLoginForm').addEventListener('submit', async e => {
      e.preventDefault();
      const email = $('apEmail').value.trim();
      const pass  = $('apPassword').value;
      const errEl = $('apLoginError');
      const btn   = $('apLoginSubmit');
      errEl.textContent = '';
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
      const ok = await Auth.login(email, pass);
      if (ok) {
        btn.innerHTML = '<i class="fas fa-check"></i> Acceso concedido';
        setTimeout(() => {
          $('apLoginWrap').hidden = false; // keep hidden by CSS
          $('apLoginWrap').hidden = true;
          $('apContent').hidden   = false;
          $('apLogoutBtn').style.display = '';
          renderUserInfo();
          Nav.init();
          Nav.go('dashboard');
        }, 400);
      } else {
        errEl.textContent = 'Email o contraseña incorrectos.';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-right-to-bracket"></i> Iniciar sesión';
      }
    });

    $('apEyeBtn').addEventListener('click', () => {
      const inp  = $('apPassword');
      const icon = $('apEyeBtn').querySelector('i');
      if (inp.type === 'password') { inp.type = 'text';     icon.className = 'fas fa-eye-slash'; }
      else                         { inp.type = 'password'; icon.className = 'fas fa-eye'; }
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
