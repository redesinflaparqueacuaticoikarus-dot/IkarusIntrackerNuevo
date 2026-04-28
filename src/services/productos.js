import { supabase } from './supabase';

export const productosService = {
  async getTodos(mostrarInactivos = false) {
    let query = supabase.from('productos').select('*').order('created_at', { ascending: false });
    if (!mostrarInactivos) {
      query = query.eq('activo', true);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getConsumibles(mostrarInactivos = false) {
    let query = supabase.from('productos').select('*').eq('tipo', 'consumible').order('created_at', { ascending: false });
    if (!mostrarInactivos) {
      query = query.eq('activo', true);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getPaquetes(mostrarInactivos = false) {
    let query = supabase.from('productos').select('*').eq('tipo', 'paquete').order('created_at', { ascending: false });
    if (!mostrarInactivos) {
      query = query.eq('activo', true);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async create(producto) {
    const { data, error } = await supabase.from('productos').insert([producto]).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase.from('productos').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    // Soft delete
    const { data, error } = await supabase.from('productos').update({ activo: false }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async restore(id) {
    const { data, error } = await supabase.from('productos').update({ activo: true }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
};
