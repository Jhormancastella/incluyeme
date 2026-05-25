/**
 * db.js - Capa de datos unificada usando Supabase
 */

import { supabase } from './supabase.js';

// ===== HELPER =====
const handle = async (promise) => {
  const { data, error } = await promise;
  if (error) {
    console.error('[DB Error]', error.message);
    return null;
  }
  return data;
};

// Genera un ID único compatible con TEXT PRIMARY KEY
const newId = () => crypto.randomUUID();

// ===== PROYECTOS =====
export const DBProyectos = {
  async getAll() {
    return await handle(
      supabase.from('proyectos').select('*').order('created_at', { ascending: false })
    ) ?? [];
  },
  async insert(item) {
    const { id: _ignore, ...rest } = item; // deja que Supabase genere el id si la tabla usa gen_random_uuid
    // Pero como la tabla tiene id TEXT PK sin default, lo generamos aquí
    const row = { id: item.id || newId(), ...rest };
    return await handle(supabase.from('proyectos').insert([row]).select().single());
  },
  async update(id, item) {
    const { id: _ignore, created_at: _ca, ...rest } = item;
    return await handle(supabase.from('proyectos').update(rest).eq('id', id).select().single());
  },
  async remove(id) {
    return await handle(supabase.from('proyectos').delete().eq('id', id));
  }
};

// ===== RECURSOS =====
export const DBRecursos = {
  async getAll() {
    return await handle(
      supabase.from('recursos').select('*').order('created_at', { ascending: false })
    ) ?? [];
  },
  async insert(item) {
    const { id: _ignore, created_at: _ca, ...rest } = item;
    const row = { id: item.id || newId(), ...rest };
    return await handle(supabase.from('recursos').insert([row]).select().single());
  },
  async update(id, item) {
    const { id: _ignore, created_at: _ca, ...rest } = item;
    return await handle(supabase.from('recursos').update(rest).eq('id', id).select().single());
  },
  async remove(id) {
    return await handle(supabase.from('recursos').delete().eq('id', id));
  }
};

// ===== GALERÍA =====
export const DBGaleria = {
  async getAll() {
    return await handle(
      supabase.from('galeria').select('*').order('created_at', { ascending: false })
    ) ?? [];
  },
  async insert(item) {
    const { id: _ignore, created_at: _ca, ...rest } = item;
    const row = { id: item.id || newId(), ...rest };
    return await handle(supabase.from('galeria').insert([row]).select().single());
  },
  async update(id, item) {
    const { id: _ignore, created_at: _ca, ...rest } = item;
    return await handle(supabase.from('galeria').update(rest).eq('id', id).select().single());
  },
  async remove(id) {
    return await handle(supabase.from('galeria').delete().eq('id', id));
  }
};

// ===== VIDEOS =====
export const DBVideos = {
  async getAll() {
    return await handle(
      supabase.from('videos').select('*').order('created_at', { ascending: false })
    ) ?? [];
  },
  async insert(item) {
    const { id: _ignore, created_at: _ca, ...rest } = item;
    const row = { id: item.id || newId(), ...rest };
    return await handle(supabase.from('videos').insert([row]).select().single());
  },
  async update(id, item) {
    const { id: _ignore, created_at: _ca, ...rest } = item;
    return await handle(supabase.from('videos').update(rest).eq('id', id).select().single());
  },
  async remove(id) {
    return await handle(supabase.from('videos').delete().eq('id', id));
  }
};

// ===== CONTENIDO =====
// Tabla 'content' con columnas hero/featured/stats separadas (JSONB)
export const DBContenido = {
  async get() {
    const rows = await handle(
      supabase.from('content').select('*').eq('id', 'main').limit(1)
    );
    if (!rows?.[0]) return null;
    const row = rows[0];
    return {
      hero:     row.hero     || {},
      featured: row.featured || {},
      stats:    row.stats    || []
    };
  },
  async set(data) {
    return await handle(
      supabase.from('content').upsert({
        id:         'main',
        hero:       data.hero     || {},
        featured:   data.featured || {},
        stats:      data.stats    || [],
        updated_at: new Date().toISOString()
      }).select().single()
    );
  }
};
