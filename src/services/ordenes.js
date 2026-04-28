import { supabase } from './supabase';

export const ordenesService = {
  // Utility to generate random code IK-YYYYMMDD-XXXX
  generateCodigo() {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `IK-${yyyy}${mm}${dd}-${randomDigits}`;
  },

  async createOrden(ordenData, itemsData) {
    let codigo = this.generateCodigo();
    
    // First try insert
    let { data: header, error: headerError } = await supabase
      .from('ordenes')
      .insert([{ ...ordenData, codigo }])
      .select()
      .single();

    // Retry once if code collision
    if (headerError && headerError.code === '23505') {
      codigo = this.generateCodigo();
      const retry = await supabase
        .from('ordenes')
        .insert([{ ...ordenData, codigo }])
        .select()
        .single();
      header = retry.data;
      headerError = retry.error;
    }

    if (headerError) throw headerError;

    // Attach order ID to items
    const itemsToInsert = itemsData.map(item => ({
      ...item,
      orden_id: header.id
    }));

    // Insert items
    const { error: itemsError } = await supabase
      .from('orden_items')
      .insert(itemsToInsert);

    if (itemsError) {
      // Manual rollback
      await supabase.from('ordenes').delete().eq('id', header.id);
      throw itemsError;
    }

    return header;
  },

  async getOrdenes() {
    const { data, error } = await supabase
      .from('ordenes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getOrdenCompleta(queryData) {
    // queryData can be { id: 'uuid' } or { codigo: 'IK-...' }
    let query = supabase.from('ordenes').select('*, orden_items(*)');
    
    if (queryData.id) {
      query = query.eq('id', queryData.id);
    } else if (queryData.codigo) {
      query = query.eq('codigo', queryData.codigo);
    }

    const { data, error } = await query.single();
    if (error) throw error;
    return data;
  },

  async updateFechaVisita(id, newDate) {
    const { data, error } = await supabase
      .from('ordenes')
      .update({ fecha_visita: newDate, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async cancelarOrden(id) {
    const { data, error } = await supabase
      .from('ordenes')
      .update({ estado: 'cancelada', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async consumirItems(orden_id, itemIds, operario) {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('orden_items')
      .update({ estado: 'used', usado_at: now, usado_por: operario })
      .in('id', itemIds);

    if (error) throw error;
    
    // Fetch the updated order to log
    const { data: orden } = await supabase.from('ordenes').select('codigo').eq('id', orden_id).single();

    // Log the scan
    await this.logEscaneo({
      orden_id,
      orden_codigo: orden?.codigo,
      resultado: 'allowed',
      items_usados_ids: itemIds,
      escaneado_por: operario,
      notas: `Consumidos ${itemIds.length} items`
    });

    return true;
  },

  async logEscaneo(logData) {
    const { error } = await supabase.from('escaneo_log').insert([logData]);
    if (error) console.error("Failed to log escaneo:", error);
  },

  async markEmailSent(id) {
    await supabase.from('ordenes').update({ email_enviado: true, email_enviado_at: new Date().toISOString() }).eq('id', id);
  }
};
