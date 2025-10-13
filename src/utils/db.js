import { openDB } from 'idb';

export const initDB = async () => {
  return openDB('SnapshotsDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('snapshots')) {
        db.createObjectStore('snapshots', { keyPath: 'id' });
      }
    },
  });
};

export const saveSnapshotToDB = async (snapshot) => {
  const db = await initDB();
  await db.put('snapshots', snapshot);
};

export const getSnapshotsFromDB = async () => {
  const db = await initDB();
  return db.getAll('snapshots');
};

export const deleteSnapshotFromDB = async (id) => {
    const db = await initDB();
    await db.delete('snapshots', id);
  };