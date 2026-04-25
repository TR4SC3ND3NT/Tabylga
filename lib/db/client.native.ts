import * as SQLite from 'expo-sqlite';
import type { AppDatabase } from './client';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<AppDatabase> {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync('tabylga.db');
    await _db.execAsync('PRAGMA journal_mode = WAL');
  }
  return _db as unknown as AppDatabase;
}

export type { AppDatabase, DbStatement } from './client';
