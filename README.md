# 🌐 Inclusión Conecta v2.0

> Plataforma municipal modular para personas con discapacidad · Accesible · Responsive · Profesional

![Estado](https://img.shields.io/badge/estado-producci%C3%B3n-success)
![Accesibilidad](https://img.shields.io/badge/accesibilidad-WCAG_2.1_AA-blue)
![Responsive](https://img.shields.io/badge/responsive-mobile--first-green)

---

## 📋 Tabla de Contenidos

- [✨ Características](#-características)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)
- [🚀 Instalación y Uso](#-instalación-y-uso)
- [🔐 Panel de Administración](#-panel-de-administración)
- [🎨 Personalización](#-personalización)
- [♿ Accesibilidad](#-accesibilidad)
- [📱 Responsive Design](#-responsive-design)
- [🛠️ Desarrollo](#-desarrollo)
- [🔧 Troubleshooting](#-troubleshooting)
- [📄 Licencia](#-licencia)

---

## ✨ Características

### 🏠 Página de Inicio
- Hero section con título y subtítulo editables
- Banner destacado para imágenes o videos
- Estadísticas dinámicas con iconos
- Previews de proyectos, recursos y galería destacados

### 📸 Galería de Imágenes
- Grid responsive (2→3→4 columnas)
- Filtros por categoría: Eventos, Infraestructura, Capacitación, Testimonios
- Lightbox con navegación y captions
- Lazy loading para optimización
- Gestión CRUD desde admin

### 🎬 Galería de Videos
- Soporte para YouTube y Vimeo
- Miniaturas automáticas desde YouTube
- Modal lightbox para visualización inmersiva
- Categorías: Tutoriales, Eventos, Testimonios, Institucional
- Reproducción segura con iframe sandbox

### 🔐 Panel de Administración
```
📧 Login: admin@municipio.local
🔑 Password: Admin2024! (cambiar en producción)
⏱️ Sesión: 1 hora de timeout
```

**Funcionalidades del Admin:**
- ✅ Editor de contenido principal (Hero, banner, stats)
- ✅ Gestor de imágenes: agregar, editar, eliminar, destacar
- ✅ Gestor de videos: agregar, editar, eliminar, destacar
- ✅ Configuración de credenciales de admin
- ✅ Exportación/Importación de datos JSON
- ✅ Restauración a valores por defecto

### 🎨 Diseño Profesional
- Paleta de colores neutrales (gris profesional)
- Modo claro/oscuro con persistencia
- Transiciones suaves y micro-interacciones
- Tipografía Inter optimizada para lectura

### ♿ Accesibilidad WCAG 2.1 AA
- Skip link para navegación rápida
- Roles ARIA en elementos dinámicos
- Focus visible personalizado
- Contraste mínimo 4.5:1
- Labels asociados a todos los inputs
- Navegación completa por teclado
- Soporte para lectores de pantalla
- Preferencia `prefers-reduced-motion`

### 📱 Responsive Total
```
📱 Mobile (<640px): Menú hamburguesa, 1 columna, touch targets 44px
📟 Tablet (640-1023px): 2 columnas, navegación optimizada  
💻 Desktop (≥1024px): 3-4 columnas, navegación completa
```

---

## 📁 Estructura del Proyecto

```
InclusionConecta/
├── 📄 index.html              ← HTML principal + imports
├── 📄 README.md               ← Este archivo
│
├── 📂 assets/
│   ├── 📂 css/
│   │   ├── 01-variables.css   ← Design tokens, colores, spacing
│   │   ├── 02-reset.css       ← Reset, base styles, accesibilidad
│   │   ├── 03-layout.css      ← Header, nav, containers, footer
│   │   ├── 04-components.css  ← Cards, buttons, badges, hero
│   │   ├── 05-forms.css       ← Inputs, labels, validation
│   │   ├── 06-gallery.css     ← Grid galería, lightbox, filtros
│   │   ├── 07-admin.css       ← Panel admin, modales, tablas
│   │   ├── 08-animations.css  ← Transiciones, keyframes, toast
│   │   └── 09-responsive.css  ← Media queries, utilities
│   │
│   ├── 📂 js/
│   │   ├── app.js             ← Entry point, orquestación
│   │   ├── storage.js         ← LocalStorage wrapper
│   │   ├── utils.js           ← Helpers: escapeHtml, showToast, etc.
│   │   ├── theme.js           ← Modo claro/oscuro
│   │   ├── navigation.js      ← Tabs, menú móvil, teclado
│   │   ├── auth.js            ← Login, sesión, permisos
│   │   ├── data-defaults.js   ← Datos iniciales
│   │   ├── galeria.js         ← CRUD imágenes + lightbox
│   │   ├── videos.js          ← CRUD videos + embeds
│   │   ├── registry.js        ← Formulario registro usuarios
│   │   └── admin.js           ← Panel administrativo completo
│   │
│   ├── 📂 images/
│   │   ├── 📂 featured/       ← Imágenes para banner destacado
│   │   ├── 📂 gallery/        ← Imágenes de la galería
│   │   └── 📂 projects/       ← Imágenes de proyectos
│   │
│   └── 📂 videos/             ← Videos locales (opcional)
│
└── 📂 docs/
    └── 📄 arquitectura.md     ← Diagrama técnico (próximamente)
```

---

## 🚀 Instalación y Uso

### Requisitos
- ✅ Navegador moderno con soporte ES6 Modules (Chrome 87+, Firefox 78+, Safari 14+, Edge 87+)
- ✅ Conexión a internet para cargar fuentes e iconos (o descargar localmente)
- ❌ No requiere servidor ni build step (funciona abriendo el HTML directamente)

### Pasos
1. **Descargar/Clonar** el proyecto
2. **Abrir** `index.html` en tu navegador:
   ```
   Doble clic en: C:\Users\Public\Desktop\InclusionConecta\index.html
   ```
3. **¡Listo!** La aplicación carga automáticamente

### Acceder al Panel Admin
1. Ir a pestaña **"Admin"**
2. Ingresar credenciales:
   ```
   Email: admin@municipio.local
   Password: Admin2024!
   ```
3. Click en **"Iniciar sesión"**

> ⚠️ **Importante**: Las credenciales por defecto son para demostración. Cámbialas en el panel de configuración antes de usar en producción.

---

## 🔐 Panel de Administración

### Contenido Principal
```
✏️ Editar título/subtítulo del Hero
🖼️ Configurar banner destacado (imagen/video)
📊 Modificar estadísticas y métricas
```

### Gestión Multimedia
```
📸 Imágenes:
   • Agregar con URL local o externa
   • Editar título, descripción, categoría
   • Marcar como destacado para homepage
   • Eliminar con confirmación

🎬 Videos:
   • Pegar URL de YouTube/Vimeo (auto-extract ID)
   • Vista previa automática de miniatura
   • Agregar duración y categoría
   • Destacar para mostrar en homepage
```

### Configuración
```
🔑 Credenciales:
   • Cambiar email de admin
   • Actualizar contraseña (mín. 8 caracteres)

💾 Datos:
   • Exportar todo a JSON (backup)
   • Importar desde JSON (restore)
   • Restaurar valores por defecto (⚠️ irreversible)
```

---

## 🎨 Personalización

### Cambiar Colores
Editar `assets/css/01-variables.css`:
```css
:root {
  --color-primary: #TU_COLOR;        /* Ej: #2563eb para azul */
  --color-primary-hover: #COLOR_OSCURO;
  --color-primary-light: #COLOR_CLARO;
}
```

### Actualizar Branding
En `index.html`, buscar y reemplazar:
```html
<div class="logo-text">
  <h1>[Tu Municipio]</h1>
  <p>[Tu Eslogan]</p>
</div>
```

### Agregar Imágenes Locales
1. Colocar archivos en `assets/images/gallery/`
2. Usar rutas relativas en el admin:
   ```
   assets/images/gallery/mi-foto.jpg
   ```

### Imágenes por Defecto (Evitar 404)
El proyecto incluye URLs de imágenes reales por defecto para evitar errores de carga:

```javascript
// assets/js/data-defaults.js
const IMG_ISES = 'https://www.isesinstituto.com/wp-content/smush-webp/2023/05/dpcddes-900x560.jpg';
const IMG_CEPAL = 'https://www.cepal.org/sites/default/files/news/images/soci-education-imagen-de-portada.jpeg';
```

**Fallback automático:** Si una imagen externa falla al cargar, el sistema muestra automáticamente un placeholder SVG inline (sin archivos externos) para mantener la experiencia de usuario sin errores 404 en consola.

```javascript
// utils.js - Fallback SVG inline
export const PLACEHOLDER_IMAGE = `data:image/svg+xml,...`;
export const getImageUrl = (url, index) => {
  if (url && isValidUrl(url)) return url;
  // Retorna URL real o fallback SVG
  return REAL_IMAGE_URLS[index] || PLACEHOLDER_IMAGE;
};
```

### Configurar Videos
- **YouTube**: Pegar URL completa del video
  ```
  https://youtube.com/watch?v=ABC123xyz
  ```
- **Vimeo**: Pegar URL completa
  ```
  https://vimeo.com/123456789
  ```

### Traducciones
El proyecto está en español. Para otros idiomas:
1. Editar textos directamente en `index.html`
2. O crear sistema de i18n cargando JSON de traducciones

---

## ♿ Accesibilidad

### Checklist Implementado
- [x] Skip link visible al enfocar con teclado
- [x] Roles ARIA en tabs (`role="tablist"`, `aria-selected`)
- [x] `aria-live` para notificaciones toast
- [x] Focus ring visible y personalizado
- [x] Contraste mínimo 4.5:1 en texto
- [x] Labels con `for`/`id` en todos los inputs
- [x] `aria-required` en campos obligatorios
- [x] Navegación por teclado completa (Tab/Shift+Tab/Esc/Flechas)
- [x] Soporte para `prefers-reduced-motion`
- [x] Textos alternativos en imágenes
- [x] `inputmode` correcto en inputs móviles

### Testing Recomendado
```bash
# Herramientas automáticas
• WAVE: https://wave.webaim.org/
• axe DevTools: Chrome Extension
• Lighthouse: Chrome DevTools → Audit

# Testing manual
• Navegar solo con teclado (Tab, Enter, Esc)
• Usar lector de pantalla (NVDA, VoiceOver)
• Verificar contraste con Color Contrast Analyzer
• Probar zoom 200% sin pérdida de contenido
```

---

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First */
@media (max-width: 639px) { /* Mobile */ }
@media (min-width: 640px) and (max-width: 1023px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1440px) { /* Large Desktop */ }
```

### Optimizaciones Móviles
```css
✅ font-size: 1rem en inputs (evita zoom en iOS Safari)
✅ inputmode="email/tel/numeric" para teclado correcto
✅ -webkit-overflow-scrolling: touch (scroll suave)
✅ env(safe-area-inset-*) para iPhone X+ notch
✅ Touch targets mín. 44×44px
✅ Menú overlay con bloqueo de scroll
✅ Imágenes con loading="lazy"
```

### Testing en Dispositivos
```
Chrome DevTools:
1. F12 → Ctrl+Shift+M (Device Toolbar)
2. Seleccionar: iPhone SE, Pixel 5, iPad
3. Probar: menú hamburguesa, forms, lightbox

Dispositivos reales:
• Verificar touch targets con dedo (no mouse)
• Probar modo oscuro/claro en exteriores
• Validar que no haya zoom involuntario en inputs
```

---

## 🛠️ Desarrollo

### Estructura de Módulos JS
Cada módulo sigue el patrón:
```javascript
// module.js
export const Module = {
  init() { /* setup */ },
  // métodos públicos...
};

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  Module.init();
});

export default Module;
```

### Agregar Nueva Funcionalidad
1. Crear archivo en `assets/js/nuevo-modulo.js`
2. Exportar objeto con métodos
3. Importar en `app.js`
4. Llamar `init()` en el ciclo de vida de la app

### Estilos CSS
- Los archivos CSS se cargan en orden numérico para cascada correcta
- Usar variables CSS (`var(--color-primary)`) para consistencia
- Seguir metodología BEM para clases: `.block__element--modifier`

### Depuración
```javascript
// Habilitar logs de desarrollo
console.log('🔧 Modo desarrollo');

// Ver estado de almacenamiento
Storage.getInfo().then(info => console.log(info));

// Resetear datos para testing
Storage.clear();
location.reload();
```

---

## 🔧 Troubleshooting

### ❌ La página no carga / se ve en blanco
```
Posibles causas:
• Navegador muy antiguo sin soporte ES6 Modules
• Archivo abierto con protocolo file:// sin permisos
• Error de sintaxis en algún módulo JS

Soluciones:
1. Actualizar navegador a versión reciente
2. Usar servidor local simple:
   • Python: python -m http.server 8000
   • Node: npx serve .
3. Revisar consola del navegador (F12 → Console)
```

### ❌ El menú hamburguesa no funciona
```
Verificar:
• JavaScript está habilitado en el navegador
• No hay errores en consola (F12 → Console)
• El archivo navigation.js se cargó correctamente

Debug:
console.log(Navigation); // Debería mostrar el objeto
```

### ❌ El modo oscuro no persiste
```
Causa común: localStorage bloqueado o limpiado

Verificar:
• Configuración de privacidad del navegador
• Modo incógnito (localStorage se limpia al cerrar)
• Extensiones que bloquean almacenamiento

Solución:
Navegador → Configuración → Privacidad → Permitir localStorage
```

### ❌ Imágenes no se muestran / Errores 404 en consola
```
Posible causa: Datos antiguos en localStorage con rutas locales que no existen.

Solución rápida (resetear datos):
1. Abrir consola del navegador: F12 → Console
2. Cargar utilidad de reset:
   ```javascript
   // Opción A: Cargar módulo externo
   import('./assets/js/reset-data.js').then(m => m.resetAllData());
   
   // Opción B: Pegar código directamente (ver assets/js/reset-data.js)
   ```
3. Ejecutar:
   ```javascript
   resetAllData();  // Limpia localStorage y restaura datos con URLs reales
   ```
4. Recargar página: F5

Verificar que las imágenes cargan:
```javascript
// Diagnóstico completo
diagnoseStorage();        // Muestra estado del localStorage
checkImageUrls();         // Verifica URLs de imágenes (async)
```

Nota: Si una imagen externa falla, el sistema muestra automáticamente 
un placeholder SVG inline para mantener la experiencia sin errores 404.
```

### ❌ Login de admin no funciona
```
Credenciales por defecto:
Email: admin@municipio.local
Password: Admin2024!

Si no funciona:
1. Verificar que no haya espacios extra al copiar
2. Revisar consola para mensajes de error
3. Resetear datos: Storage.clear() en consola y recargar
```

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. 

```
Copyright (c) 2024 Municipio [Nombre]

Se permite el uso, copia, modificación y distribución, 
sujeto a los términos de la licencia MIT.
```

### Atribución
- Fuentes: [Inter](https://fonts.google.com/specimen/Inter) - SIL Open Font License
- Iconos: [Font Awesome](https://fontawesome.com) - CC BY 4.0 (free tier)

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! 

1. Fork el repositorio
2. Crear rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'feat: agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abrir Pull Request

### Convenciones de Commits
```
feat:     Nueva funcionalidad
fix:      Corrección de bug
docs:     Cambios en documentación
style:    Cambios de formato/estilo (sin cambios de lógica)
refactor: Refactorización de código (sin cambios de comportamiento)
chore:    Tareas de mantenimiento
```

---

## 📞 Soporte

```
📁 Ubicación: C:\Users\Public\Desktop\InclusionConecta\
📄 Documentación: README.md (este archivo)
🖼️ Guía multimedia: assets/README.md

💡 Tip: El proyecto funciona 100% offline una vez cargado.
   Puedes copiar la carpeta completa a una USB y usarla 
   en cualquier computadora sin conexión a internet.

🐛 Reportar bugs: Crear issue con:
   • Descripción del problema
   • Pasos para reproducir
   • Comportamiento esperado vs. real
   • Navegador y versión
   • Capturas de pantalla si aplica
```

---

> ✨ **Inclusión Conecta v2.0** · Construyendo un municipio más accesible, una línea de código a la vez.

**¿Preguntas o sugerencias?** ¡Estamos aquí para ayudar! 🛠️🤝
