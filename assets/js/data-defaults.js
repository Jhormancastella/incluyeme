/**
 * data-defaults.js - Default Data for Projects, Resources, Gallery, Videos
 * Datos iniciales para inicializar la aplicación
 */

// ===== REAL IMAGE URLs (to avoid 404 errors) =====
// Proporcionadas por el usuario para reemplazar placeholders
const IMG_ISES = 'https://www.isesinstituto.com/wp-content/smush-webp/2023/05/dpcddes-900x560.jpg';
const IMG_CEPAL = 'https://www.cepal.org/sites/default/files/news/images/soci-education-imagen-de-portada.jpeg';

// Fallback placeholder inline SVG (if external images fail)
export const PLACEHOLDER_FALLBACK = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23e2e8f0' width='400' height='300'/%3E%3Cg fill='%2394a3b8'%3E%3Crect x='140' y='80' width='120' height='90' rx='8'/%3E%3Ccircle cx='170' cy='110' r='15'/%3E%3Cpolygon points='140,170 200,120 260,170'/%3E%3Crect x='160' y='185' width='80' height='8' rx='4'/%3E%3C/g%3E%3Ctext x='200' y='280' font-family='sans-serif' font-size='12' fill='%2364748b' text-anchor='middle'%3ESin imagen%3C/text%3E%3C/svg%3E`;

// ===== DEFAULT PROYECTOS =====
export const DEFAULT_PROYECTOS = [
  {
    id: 'proj_001',
    titulo: '♿ Remodelación de paradas accesibles',
    descripcion: 'Instalación de rampas y pavimento podotáctil en 15 paradas de transporte público del centro.',
    tag: 'En ejecución',
    image: IMG_ISES,
    fecha: '2024-01-15',
    destacado: true
  },
  {
    id: 'proj_002',
    titulo: '📱 App de rutas accesibles',
    descripcion: 'Desarrollo colaborativo de aplicación móvil con personas con discapacidad visual para navegación urbana.',
    tag: 'Buscando voluntarios',
    image: IMG_CEPAL,
    fecha: '2024-02-01',
    destacado: false
  },
  {
    id: 'proj_003',
    titulo: '🎓 Becas formación laboral',
    descripcion: 'Programa de capacitación en competencias digitales para personas con discapacidad intelectual.',
    tag: 'Inscripciones abiertas',
    image: IMG_ISES,
    fecha: '2024-02-15',
    destacado: true
  }
];

// ===== DEFAULT RECURSOS =====
export const DEFAULT_RECURSOS = [
  {
    id: 'res_001',
    titulo: 'Centro de Rehabilitación Integral',
    descripcion: 'Servicios de terapia física, ocupacional y auditiva. Atención con cita previa.',
    tag: 'Público',
    direccion: 'Calle 123 #45-67',
    telefono: '+57 601 123 4567',
    horario: 'Lun-Vie 8:00-17:00'
  },
  {
    id: 'res_002',
    titulo: 'Unidad Municipal de Discapacidad',
    descripcion: 'Trámites de credencial, asesoría legal y orientación. Lunes a viernes, 8am-4pm.',
    tag: 'Atención presencial',
    direccion: 'Carrera 10 #20-30',
    telefono: '+57 601 987 6543',
    horario: 'Lun-Vie 8:00-16:00'
  },
  {
    id: 'res_003',
    titulo: 'Transporte Adaptado "Sin Barreras"',
    descripcion: 'Servicio de transporte puerta a puerta. Reserva con 24h de anticipación vía WhatsApp.',
    tag: 'Gratuito',
    direccion: 'Cobertura municipal',
    telefono: '+57 300 123 4567',
    horario: 'Lun-Dom 6:00-22:00'
  }
];

// ===== DEFAULT GALERÍA =====
export const DEFAULT_GALERIA = [
  {
    id: 'img_001',
    titulo: 'Inauguración centro inclusivo',
    descripcion: 'Ceremonia de apertura del nuevo centro de atención integral.',
    categoria: 'Eventos',
    url: IMG_ISES,
    fecha: '2024-03-01',
    destacado: true
  },
  {
    id: 'img_002',
    titulo: 'Taller de accesibilidad web',
    descripcion: 'Capacitación para desarrolladores sobre estándares WCAG.',
    categoria: 'Capacitación',
    url: IMG_CEPAL,
    fecha: '2024-03-10',
    destacado: false
  },
  {
    id: 'img_003',
    titulo: 'Nueva señalización táctil',
    descripcion: 'Instalación de señales podotáctiles en edificios públicos.',
    categoria: 'Infraestructura',
    url: IMG_ISES,
    fecha: '2024-03-15',
    destacado: true
  },
  {
    id: 'img_004',
    titulo: 'Testimonio: María González',
    descripcion: 'Historia de superación y participación comunitaria.',
    categoria: 'Testimonios',
    url: IMG_CEPAL,
    fecha: '2024-03-20',
    destacado: false
  },
  {
    id: 'vid_fb_001',
    titulo: 'Día Internacional de Personas con Discapacidad',
    descripcion: 'Compartimos un encuentro lleno de inclusión, participación y comunidad en conmemoración del 3 de diciembre.',
    categoria: 'Eventos',
    type: 'video',
    provider: 'facebook',
    videoId: '735031825699360',
    videoUrl: 'https://www.facebook.com/Richar.Claro.Tibu/videos/735031825699360/',
    url: IMG_ISES,
    fecha: '2024-12-03',
    destacado: true
  }
];

// ===== DEFAULT VIDEOS =====
export const DEFAULT_VIDEOS = [
  {
    id: 'vid_001',
    titulo: 'Día Internacional de Personas con Discapacidad',
    descripcion: 'Compartimos un encuentro lleno de inclusión, participación y comunidad en conmemoración del 3 de diciembre.',
    categoria: 'Eventos',
    provider: 'facebook',
    videoId: '735031825699360',
    videoUrl: 'https://www.facebook.com/Richar.Claro.Tibu/videos/735031825699360/',
    thumbnail: 'https://www.isesinstituto.com/wp-content/smush-webp/2023/05/dpcddes-900x560.jpg',
    duration: '',
    fecha: '2024-12-03',
    destacado: true
  },
  {
    id: 'vid_002',
    titulo: 'Convención ONU sobre Derechos de Personas con Discapacidad',
    descripcion: 'Explicación accesible sobre los principios de la CDPD y su aplicación en Colombia.',
    categoria: 'Institucional',
    provider: 'youtube',
    videoId: 'Hc8GkB_pGHo',
    videoUrl: 'https://www.youtube.com/watch?v=Hc8GkB_pGHo',
    thumbnail: '',
    duration: '',
    fecha: '2024-02-15',
    destacado: false
  },
  {
    id: 'vid_003',
    titulo: 'Inclusión laboral: experiencias reales',
    descripcion: 'Testimonios de personas con discapacidad sobre su experiencia en el mercado laboral colombiano.',
    categoria: 'Testimonios',
    provider: 'youtube',
    videoId: 'ZRNBiMFMgSM',
    videoUrl: 'https://www.youtube.com/watch?v=ZRNBiMFMgSM',
    thumbnail: '',
    duration: '',
    fecha: '2024-03-01',
    destacado: true
  }
];

// ===== DEFAULT CONTENT (Hero, Stats, Featured) =====
export const DEFAULT_CONTENT = {
  hero: {
    title: 'Construyendo un municipio más inclusivo',
    subtitle: 'Plataforma oficial para acceder a información, servicios y proyectos para personas con discapacidad.',
    cta: 'Explorar proyectos',
    ctaLink: '#proyectos'
  },
  featured: {
    enabled: true,
    type: 'image',
    url: IMG_ISES,
    videoUrl: '',
    title: 'Destacado del mes',
    description: 'Contenido destacado sobre inclusión y accesibilidad en nuestro municipio.'
  },
  stats: [
    { 
      icon: 'fa-clipboard-list', 
      value: '12+', 
      label: 'Proyectos activos', 
      description: 'Iniciativas en ejecución' 
    },
    { 
      icon: 'fa-hand-holding-heart', 
      value: '20+', 
      label: 'Recursos', 
      description: 'Servicios disponibles' 
    },
    { 
      icon: 'fa-bell', 
      value: '∞', 
      label: 'Alertas', 
      description: 'Notificaciones personalizadas' 
    }
  ]
};

// ===== DEFAULT CONFIG =====
export const DEFAULT_CONFIG = {
  admin: {
    email: 'admin@municipio.local',
    password: 'Admin2024!',
    sessionTimeout: 3600000
  },
  gallery: {
    itemsPerPage: 12,
    allowUpload: true,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeMB: 5
  },
  videos: {
    itemsPerPage: 12,
    allowedProviders: ['youtube', 'vimeo']
  },
  theme: {
    default: 'light',
    allowToggle: true
  },
  features: {
    enableGallery: true,
    enableVideos: true,
    enableRegistration: true,
    enableAdmin: true
  }
};

// ===== EXPORT ALL =====
export const getDefaultData = () => ({
  proyectos: DEFAULT_PROYECTOS,
  recursos: DEFAULT_RECURSOS,
  galeria: DEFAULT_GALERIA,
  videos: DEFAULT_VIDEOS,
  content: DEFAULT_CONTENT,
  config: DEFAULT_CONFIG,
  placeholderFallback: PLACEHOLDER_FALLBACK
});

// ===== INITIALIZATION HELPER =====
export const ensureDefaults = (Storage, DATA_KEYS) => {
  const defaults = getDefaultData();
  
  if (!Storage.has(DATA_KEYS.PROYECTOS)) {
    Storage.set(DATA_KEYS.PROYECTOS, defaults.proyectos);
  }
  if (!Storage.has(DATA_KEYS.RECURSOS)) {
    Storage.set(DATA_KEYS.RECURSOS, defaults.recursos);
  }
  if (!Storage.has(DATA_KEYS.GALERIA)) {
    Storage.set(DATA_KEYS.GALERIA, defaults.galeria);
  }
  if (!Storage.has(DATA_KEYS.VIDEOS)) {
    Storage.set(DATA_KEYS.VIDEOS, defaults.videos);
  }
  if (!Storage.has(DATA_KEYS.CONTENT)) {
    Storage.set(DATA_KEYS.CONTENT, defaults.content);
  }
  if (!Storage.has(DATA_KEYS.CONFIG)) {
    Storage.set(DATA_KEYS.CONFIG, defaults.config);
  }
};
