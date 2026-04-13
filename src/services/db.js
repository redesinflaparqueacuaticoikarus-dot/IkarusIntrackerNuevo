import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';

localforage.config({
  name: 'IkarusDB',
  storeName: 'bonos_taquilla',
  description: 'Local database for Ikarus 2x1 Bonus System'
});

const STORE_KEY = 'ikarus_records';

/**
 * Helper to fetch all records. Returns empty array if none.
 */
export const getAllRecords = async () => {
  try {
    const data = await localforage.getItem(STORE_KEY);
    return data || [];
  } catch (err) {
    console.error('Error fetching records:', err);
    return [];
  }
};

/**
 * Save all records array directly.
 */
export const saveAllRecords = async (records) => {
  try {
    await localforage.setItem(STORE_KEY, records);
  } catch (err) {
    console.error('Error saving records:', err);
  }
};

/**
 * Check if a specific CC already exists in the local database.
 * Returns the existing record or null.
 */
export const checkDuplicateCC = async (cc) => {
  if (!cc) return null;
  const records = await getAllRecords();
  return records.find(r => String(r.CC).trim() === String(cc).trim()) || null;
};

/**
 * Add a single record. Automatically injects standard format and ID.
 */
export const addRecord = async (record) => {
  const records = await getAllRecords();
  const newRecord = {
    ...record,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  records.push(newRecord);
  await saveAllRecords(records);
  return newRecord;
};

/**
 * Import a batch of records (e.g., from Excel).
 * We inject IDs for all them. We don't block duplicates here, 
 * they will be visible in the Duplicates scanner.
 */
export const importMultipleRecords = async (newRecords) => {
  const records = await getAllRecords();
  const recordsWithId = newRecords.map(r => ({
    ...r,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  }));
  const updatedRecords = [...records, ...recordsWithId];
  await saveAllRecords(updatedRecords);
  return recordsWithId.length;
};

/**
 * Scan the database for any IDs that share the same CC.
 * Returns an array of groups, e.g. [ [record1, record2], [record3, record4] ]
 */
export const getDuplicatesGroups = async () => {
  const records = await getAllRecords();
  const groupsByCC = {};

  records.forEach(r => {
    const cc = String(r.CC || '').trim();
    if (!cc) return; // Skip empty CCs for this logic

    if (!groupsByCC[cc]) {
      groupsByCC[cc] = [];
    }
    groupsByCC[cc].push(r);
  });

  // Filter only groups with more than 1 entry
  const duplicates = Object.values(groupsByCC).filter(group => group.length > 1);
  return duplicates;
};

/**
 * Delete a specific record by its UUID.
 */
export const deleteRecord = async (id) => {
  const records = await getAllRecords();
  const updatedRecords = records.filter(r => r.id !== id);
  await saveAllRecords(updatedRecords);
};

/**
 * Clear all DB (useful for debugging, normally not exposed).
 */
export const clearDb = async () => {
  await localforage.removeItem(STORE_KEY);
};
