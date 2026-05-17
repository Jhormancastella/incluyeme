/**
 * storage.js - LocalStorage Wrapper & Data Persistence
 * Gestión centralizada de datos con fallback y validación
 */

// ===== CONFIG =====
const STORAGE_PREFIX = 'inclusion_';
const STORAGE_VERSION = '2.0';

// ===== STORAGE CLASS =====
export const Storage = {
  
  // Get item with fallback
  get(key, fallback = null) {
    try {
      const fullKey = STORAGE_PREFIX + key;
      const item = localStorage.getItem(fullKey);
      
      if (item === null) return fallback;
      
      const parsed = JSON.parse(item);
      
      // Check version compatibility if needed
      if (parsed && parsed._version && parsed._version !== STORAGE_VERSION) {
        console.warn(`Storage version mismatch for ${key}: expected ${STORAGE_VERSION}, got ${parsed._version}`);
        // Could implement migration logic here
      }
      
      return parsed._data !== undefined ? parsed._data : parsed;
    } catch (error) {
      console.error(`Storage.get error for ${key}:`, error);
      return fallback;
    }
  },

  // Set item with metadata
  set(key, value) {
    try {
      const fullKey = STORAGE_PREFIX + key;
      const wrapped = {
        _data: value,
        _version: STORAGE_VERSION,
        _timestamp: Date.now()
      };
      localStorage.setItem(fullKey, JSON.stringify(wrapped));
      return true;
    } catch (error) {
      console.error(`Storage.set error for ${key}:`, error);
      
      // Handle quota exceeded
      if (error.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded. Consider clearing old data.');
      }
      return false;
    }
  },

  // Remove item
  remove(key) {
    try {
      const fullKey = STORAGE_PREFIX + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error(`Storage.remove error for ${key}:`, error);
      return false;
    }
  },

  // Check if key exists
  has(key) {
    try {
      const fullKey = STORAGE_PREFIX + key;
      return localStorage.getItem(fullKey) !== null;
    } catch {
      return false;
    }
  },

  // Clear all app data
  clear() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Storage.clear error:', error);
      return false;
    }
  },

  // Get all app keys
  keys() {
    try {
      return Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_PREFIX))
        .map(key => key.replace(STORAGE_PREFIX, ''));
    } catch {
      return [];
    }
  },

  // Get storage info
  getInfo() {
    try {
      const keys = this.keys();
      let totalSize = 0;
      const items = {};
      
      keys.forEach(key => {
        const value = localStorage.getItem(STORAGE_PREFIX + key);
        if (value) {
          const size = new Blob([value]).size;
          totalSize += size;
          items[key] = { size, sizeKB: (size / 1024).toFixed(2) };
        }
      });
      
      return {
        keys: keys.length,
        totalSizeKB: (totalSize / 1024).toFixed(2),
        items: items,
        quota: this.getQuotaInfo()
      };
    } catch {
      return null;
    }
  },

  // Estimate quota usage
  getQuotaInfo() {
    if (navigator.storage && navigator.storage.estimate) {
      return navigator.storage.estimate().then(estimate => ({
        usage: (estimate.usage / 1024 / 1024).toFixed(2) + ' MB',
        quota: (estimate.quota / 1024 / 1024).toFixed(2) + ' MB',
        usagePercent: ((estimate.usage / estimate.quota) * 100).toFixed(1) + '%'
      }));
    }
    return Promise.resolve({ usage: 'Unknown', quota: 'Unknown' });
  },

  // Export all data
  exportData() {
    const data = {};
    this.keys().forEach(key => {
      data[key] = this.get(key);
    });
    return {
      version: STORAGE_VERSION,
      exportedAt: new Date().toISOString(),
      data: data
    };
  },

  // Import data (merge mode)
  importData(imported, merge = true) {
    try {
      if (!imported || !imported.data) {
        throw new Error('Invalid import format');
      }
      
      if (imported.version !== STORAGE_VERSION) {
        console.warn(`Import version mismatch: expected ${STORAGE_VERSION}, got ${imported.version}`);
        // Could implement migration here
      }
      
      Object.entries(imported.data).forEach(([key, value]) => {
        if (merge || !this.has(key)) {
          this.set(key, value);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Storage.importData error:', error);
      return false;
    }
  }
};

// ===== SESSION STORAGE WRAPPER =====
export const SessionStorage = {
  get(key, fallback = null) {
    try {
      const item = sessionStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },
  
  set(key, value) {
    try {
      sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  
  remove(key) {
    try {
      sessionStorage.removeItem(STORAGE_PREFIX + key);
      return true;
    } catch {
      return false;
    }
  },
  
  clear() {
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          sessionStorage.removeItem(key);
        }
      });
      return true;
    } catch {
      return false;
    }
  }
};

// ===== DEFAULT DATA KEYS =====
export const DATA_KEYS = {
  PROYECTOS: 'proyectos',
  RECURSOS: 'recursos',
  GALERIA: 'galeria',
  VIDEOS: 'videos',
  CONFIG: 'config',
  CONTENT: 'content',
  USERS: 'usuarios',
  ADMIN_SESSION: 'adminSession'
};

// ===== INITIALIZATION =====
export const initStorage = () => {
  // Ensure default structure exists
  if (!Storage.has(DATA_KEYS.PROYECTOS)) {
    Storage.set(DATA_KEYS.PROYECTOS, []);
  }
  if (!Storage.has(DATA_KEYS.RECURSOS)) {
    Storage.set(DATA_KEYS.RECURSOS, []);
  }
  if (!Storage.has(DATA_KEYS.GALERIA)) {
    Storage.set(DATA_KEYS.GALERIA, []);
  }
  if (!Storage.has(DATA_KEYS.VIDEOS)) {
    Storage.set(DATA_KEYS.VIDEOS, []);
  }
  if (!Storage.has(DATA_KEYS.CONTENT)) {
    Storage.set(DATA_KEYS.CONTENT, getDefaultContent());
  }
  if (!Storage.has(DATA_KEYS.CONFIG)) {
    Storage.set(DATA_KEYS.CONFIG, getDefaultConfig());
  }
};

// ===== DEFAULT CONTENT =====
const getDefaultContent = () => ({
  hero: {
    title: 'Construyendo un municipio más inclusivo',
    subtitle: 'Plataforma oficial para acceder a información, servicios y proyectos para personas con discapacidad.',
    cta: 'Explorar proyectos',
    ctaLink: '#proyectos'
  },
  featured: {
    enabled: true,
    type: 'image', // 'image' | 'video'
    url: '',
    title: 'Destacado del mes',
    description: 'Contenido destacado sobre inclusión y accesibilidad.'
  },
  stats: [
    { icon: 'fa-clipboard-list', value: '12+', label: 'Proyectos activos', description: 'Iniciativas en ejecución' },
    { icon: 'fa-hand-holding-heart', value: '20+', label: 'Recursos', description: 'Servicios disponibles' },
    { icon: 'fa-bell', value: '∞', label: 'Alertas', description: 'Notificaciones personalizadas' }
  ]
});

// ===== DEFAULT CONFIG =====
const getDefaultConfig = () => ({
  admin: {
    email: 'admin@municipio.local',
    // Password is hashed/validated separately
    sessionTimeout: 3600000 // 1 hour in ms
  },
  gallery: {
    itemsPerPage: 12,
    allowUpload: true,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  videos: {
    itemsPerPage: 12,
    allowedProviders: ['youtube', 'vimeo']
  },
  theme: {
    default: 'light', // 'light' | 'dark' | 'system'
    allowToggle: true
  }
});
