import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase | any> {
  if (Platform.OS === 'web') {
    // Return a dummy db object for web to prevent crash.
    // expo-sqlite has no web implementation, so all DB ops are no-ops.
    const mockStatement = {
      executeAsync: async () => ({ changes: 0, lastInsertRowId: 0 }),
      finalizeAsync: async () => {},
    };
    return {
      execAsync: async () => {},
      runAsync: async () => ({ changes: 0, lastInsertRowId: 0 }),
      getFirstAsync: async () => null,
      getAllAsync: async () => [],
      prepareAsync: async () => mockStatement,
    };
  }

  if (!_db) {
    _db = await SQLite.openDatabaseAsync('tabylga.db');
    // WAL mode — faster writes, safe concurrent reads
    await _db.execAsync('PRAGMA journal_mode = WAL');
  }
  return _db;
}
