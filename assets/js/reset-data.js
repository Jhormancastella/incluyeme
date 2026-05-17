/**
 * reset-data.js - Utilidad para limpiar localStorage y restaurar datos por defecto
 * 
 * Uso: Abrir consola del navegador (F12) y pegar este código, o cargar como módulo:
 * <script type="module" src="assets/js/reset-data.js"></script>
 */

// ===== CONFIGURACIÓN =====
const KEYS_TO_CLEAR = [
  'inclusion_proyectos',
  'inclusion_recursos', 
  'inclusion_galeria',
  'inclusion_videos',
  'inclusion_content',
  'inclusion_config',
  'usuariosRegistrados',
  'adminSession',
  'theme' // Opcional: mantener preferencia de tema
];

// ===== FUNCIÓN PRINCIPAL =====
export const resetAllData = (keepTheme = true) => {
  console.log('🔄 Iniciando reset de datos...');
  
  const preserved = {};
  
  // Opcional: preservar tema
  if (keepTheme) {
    preserved.theme = localStorage.getItem('theme');
  }
  
  // Limpiar keys específicas
  let cleared = 0;
  KEYS_TO_CLEAR.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      cleared++;
      console.log(`✅ Eliminado: ${key}`);
    }
  });
  
  // Restaurar tema si se preservó
  if (keepTheme && preserved.theme) {
    localStorage.setItem('theme', preserved.theme);
    console.log(`🎨 Tema preservado: ${preserved.theme}`);
  }
  
  console.log(`\n✨ Reset completado: ${cleared} items eliminados`);
  console.log('📋 Próximos pasos:');
  console.log('   1. Recargar la página (F5 o Ctrl+R)');
  console.log('   2. Los datos por defecto con URLs reales se cargarán automáticamente');
  console.log('   3. Verificar consola: no debería haber errores 404 de imágenes');
  
  return {
    cleared,
    preserved: keepTheme ? { theme: preserved.theme } : {},
    message: 'Datos reseteados. Recargar página para aplicar cambios.'
  };
};

// ===== FUNCIÓN DE DIAGNÓSTICO =====
export const diagnoseStorage = () => {
  console.log('🔍 Diagnóstico de localStorage:');
  console.log('─'.repeat(50));
  
  const allKeys = Object.keys(localStorage);
  const ourKeys = allKeys.filter(k => k.includes('inclusion') || k === 'adminSession' || k === 'theme');
  
  console.log(`\n📦 Total keys en localStorage: ${allKeys.length}`);
  console.log(`🎯 Keys de Inclusión Conecta: ${ourKeys.length}`);
  
  ourKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      const parsed = JSON.parse(value);
      const size = new Blob([value]).size;
      console.log(`\n📄 ${key}`);
      console.log(`   Tipo: ${Array.isArray(parsed) ? 'Array' : typeof parsed}`);
      console.log(`   Items: ${Array.isArray(parsed) ? parsed.length : 'N/A'}`);
      console.log(`   Tamaño: ${(size / 1024).toFixed(2)} KB`);
      
      // Preview de imágenes/videos si aplica
      if (key.includes('galeria') && Array.isArray(parsed) && parsed[0]?.url) {
        console.log(`   🖼️  Primera imagen: ${parsed[0].url.substring(0, 60)}...`);
      }
      if (key.includes('videos') && Array.isArray(parsed) && parsed[0]?.videoUrl) {
        console.log(`   🎬 Primer video: ${parsed[0].videoUrl.substring(0, 60)}...`);
      }
    } catch (e) {
      console.log(`\n📄 ${key}: [No parseable - ${e.message}]`);
    }
  });
  
  console.log('\n' + '─'.repeat(50));
  console.log('💡 Tip: Para resetear, ejecutar: resetAllData()');
  
  return {
    totalKeys: allKeys.length,
    appKeys: ourKeys.length,
    keys: ourKeys
  };
};

// ===== FUNCIÓN DE VERIFICACIÓN DE IMÁGENES =====
export const checkImageUrls = async () => {
  console.log('🖼️  Verificando URLs de imágenes...');
  
  const galeria = JSON.parse(localStorage.getItem('inclusion_galeria') || '[]');
  const proyectos = JSON.parse(localStorage.getItem('inclusion_proyectos') || '[]');
  
  const urls = [
    ...galeria.map(g => ({ source: 'galeria', title: g.titulo, url: g.url })),
    ...proyectos.map(p => ({ source: 'proyectos', title: p.titulo, url: p.image }))
  ].filter(item => item.url);
  
  console.log(`\n📋 Total URLs a verificar: ${urls.length}`);
  
  const results = [];
  
  for (const item of urls) {
    try {
      const response = await fetch(item.url, { method: 'HEAD' });
      const status = response.ok ? '✅ OK' : `❌ ${response.status}`;
      console.log(`${status} [${item.source}] ${item.title}: ${item.url.substring(0, 50)}...`);
      results.push({ ...item, status: response.ok ? 'ok' : 'error', code: response.status });
    } catch (error) {
      console.log(`❌ [${item.source}] ${item.title}: Error de red - ${error.message}`);
      results.push({ ...item, status: 'error', code: 'network', error: error.message });
    }
  }
  
  const ok = results.filter(r => r.status === 'ok').length;
  const errors = results.filter(r => r.status === 'error').length;
  
  console.log(`\n📊 Resumen: ${ok} OK, ${errors} errores`);
  
  if (errors > 0) {
    console.log('\n⚠️  Algunas imágenes no cargan. Posibles causas:');
    console.log('   • URL externa con restricciones CORS');
    console.log('   • Archivo local no encontrado (verificar ruta)');
    console.log('   • Servidor de imagen caído temporalmente');
    console.log('\n💡 Solución: El sistema usará automáticamente un placeholder SVG si la imagen falla.');
  }
  
  return results;
};

// ===== EXPORTAR PARA USO EN CONSOLA =====
if (typeof window !== 'undefined') {
  window.resetAllData = resetAllData;
  window.diagnoseStorage = diagnoseStorage;
  window.checkImageUrls = checkImageUrls;
  
  console.log('🛠️  Herramientas de diagnóstico cargadas:');
  console.log('   • resetAllData(keepTheme=true)  → Limpia localStorage');
  console.log('   • diagnoseStorage()              → Muestra estado actual');
  console.log('   • checkImageUrls()               → Verifica URLs de imágenes (async)');
}

// ===== AUTO-EJECUCIÓN OPCIONAL =====
// Descomentar para ejecutar automáticamente al cargar:
// resetAllData();
