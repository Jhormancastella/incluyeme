/**
 * utils.js - Helper Functions & Utilities
 * Funciones reutilizables para todo el proyecto
 */

// ===== PLACEHOLDER IMAGES (Real URLs + Fallback SVG) =====
// URLs reales proporcionadas para evitar 404
export const REAL_IMAGE_URLS = [
  'https://www.isesinstituto.com/wp-content/smush-webp/2023/05/dpcddes-900x560.jpg',
  'https://www.cepal.org/sites/default/files/news/images/soci-education-imagen-de-portada.jpeg'
];

// Fallback inline SVG (if all external images fail)
export const PLACEHOLDER_IMAGE = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23e2e8f0' width='400' height='300'/%3E%3Cg fill='%2394a3b8'%3E%3Crect x='140' y='80' width='120' height='90' rx='8'/%3E%3Ccircle cx='170' cy='110' r='15'/%3E%3Cpolygon points='140,170 200,120 260,170'/%3E%3Crect x='160' y='185' width='80' height='8' rx='4'/%3E%3C/g%3E%3Ctext x='200' y='280' font-family='sans-serif' font-size='12' fill='%2364748b' text-anchor='middle'%3ESin imagen%3C/text%3E%3C/svg%3E`;

// Get a real image URL or fallback to SVG placeholder
export const getImageUrl = (url = null, index = 0) => {
  if (url && isValidUrl(url)) return url;
  if (REAL_IMAGE_URLS[index]) return REAL_IMAGE_URLS[index];
  return PLACEHOLDER_IMAGE;
};

// ===== ESCAPE HTML (XSS Prevention) =====
export const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

// ===== SANITIZE INPUT =====
export const sanitizeInput = (str) => {
  return str
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 1000); // Limit length
};

// ===== VALIDATE EMAIL =====
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ===== VALIDATE URL =====
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ===== FORMAT DATE =====
export const formatDate = (date, locale = 'es-CO') => {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ===== FORMAT DATE SHORT =====
export const formatDateShort = (date, locale = 'es-CO') => {
  return new Date(date).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// ===== DEBOUNCE =====
export const debounce = (func, wait = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// ===== THROTTLE =====
export const throttle = (func, limit = 200) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// ===== GENERATE ID =====
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// ===== GET YOUTUBE THUMBNAIL =====
export const getYouTubeThumbnail = (videoId, quality = 'hqdefault') => {
  const qualities = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    standard: 'sddefault',
    maxres: 'maxresdefault'
  };
  return `https://img.youtube.com/vi/${videoId}/${qualities[quality] || qualities.high}.jpg`;
};

// ===== EXTRACT YOUTUBE ID =====
export const extractYouTubeId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// ===== COPY TO CLIPBOARD =====
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
};

// ===== SHOW TOAST NOTIFICATION =====
export const showToast = (message, type = 'success', duration = 4000) => {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <i class="fas ${getToastIcon(type)}" aria-hidden="true"></i>
    <span>${escapeHtml(message)}</span>
  `;
  
  container.appendChild(toast);

  // Auto remove
  const removeToast = () => {
    toast.classList.add('closing');
    setTimeout(() => toast.remove(), 300);
  };

  setTimeout(removeToast, duration);

  // Remove on click
  toast.addEventListener('click', removeToast);
};

const getToastIcon = (type) => {
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-triangle',
    warning: 'fa-exclamation-circle',
    info: 'fa-info-circle'
  };
  return icons[type] || icons.info;
};

// ===== CONFIRM DIALOG =====
export const confirmDialog = (message, title = 'Confirmar') => {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'admin-modal active';
    modal.innerHTML = `
      <div class="admin-modal-content">
        <div class="admin-modal-header">
          <h3>${escapeHtml(title)}</h3>
          <button class="admin-modal-close" aria-label="Cerrar">&times;</button>
        </div>
        <div class="admin-modal-body">
          <p>${escapeHtml(message)}</p>
        </div>
        <div class="admin-modal-footer">
          <button class="btn btn-secondary" data-action="cancel">Cancelar</button>
          <button class="btn" data-action="confirm" style="background:var(--color-error)">Confirmar</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);

    const cleanup = () => {
      modal.remove();
      document.removeEventListener('keydown', handleKey);
    };

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        resolve(false);
        cleanup();
      }
    };

    modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
      resolve(true);
      cleanup();
    });
    modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
      resolve(false);
      cleanup();
    });
    modal.querySelector('.admin-modal-close').addEventListener('click', () => {
      resolve(false);
      cleanup();
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        resolve(false);
        cleanup();
      }
    });

    document.addEventListener('keydown', handleKey);
  });
};

// ===== EXPORT DATA AS JSON =====
export const exportAsJSON = (data, filename = 'export.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ===== IMPORT JSON FILE =====
export const importJSON = (accept = '.json') => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
    
    input.click();
  });
};

// ===== IS MOBILE DEVICE =====
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.innerWidth < 768;
};

// ===== IS TOUCH DEVICE =====
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};
