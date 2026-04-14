import { supabase } from "./supabase";

const TABLE_NAME = "bonos_taquilla";

/**
 * Fetch all records from Supabase
 */
export const getAllRecords = async () => {
  const { data, error } = await supabase.from(TABLE_NAME).select('*');
  if (error) {
    console.error('Error fetching records:', error);
    return [];
  }
  return data || [];
};

/**
 * Save all records array directly (Deprecated, kept for signature compatibility if needed)
 */
export const saveAllRecords = async (records) => {
  console.warn("saveAllRecords is deprecated. Supabase handles updates directly.");
};

/**
 * Check if a specific CC already exists in the database.
 */
export const checkDuplicateCC = async (cc) => {
  if (!cc) return null;
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('CC', String(cc).trim())
    .maybeSingle();

  if (error) {
    console.error('Error checking duplicate CC:', error);
  }
  return data || null;
};

/**
 * Add a single record.
 */
export const addRecord = async (record) => {
  const newRecord = {
    ...record,
    createdAt: new Date().toISOString()
  };
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([newRecord])
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error adding record:", error);
    throw error;
  }
  return data;
};

/**
 * Import a batch of records (e.g., from Excel) using bulk inserts.
 */
export const importMultipleRecords = async (newRecords) => {
  const recordsToInsert = newRecords.map(r => ({
    ...r,
    createdAt: new Date().toISOString()
  }));

  const { error } = await supabase
    .from(TABLE_NAME)
    .insert(recordsToInsert);

  if (error) {
    console.error("Error importing records:", error);
    throw error;
  }
  return recordsToInsert.length;
};

/**
 * Scan the database for any IDs that share the same CC.
 */
export const getDuplicatesGroups = async () => {
  const records = await getAllRecords();
  const groupsByCC = {};

  records.forEach(r => {
    const cc = String(r.CC || '').trim();
    if (!cc) return;

    if (!groupsByCC[cc]) {
      groupsByCC[cc] = [];
    }
    groupsByCC[cc].push(r);
  });

  const duplicates = Object.values(groupsByCC).filter(group => group.length > 1);
  return duplicates;
};

/**
 * Delete a specific record by its primary key id.
 */
export const deleteRecord = async (id) => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting record:", error);
    throw error;
  }
};

/**
 * Clear all DB (useful for debugging, normally not exposed).
 */
export const clearDb = async () => {
  console.warn("clearDb called! Not implemented for remote Supabase to prevent accidental data wipe.");
};
