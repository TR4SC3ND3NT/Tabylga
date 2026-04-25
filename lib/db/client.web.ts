import type { AppDatabase, DbStatement } from './client';

const mockStatement: DbStatement = {
  executeAsync: async () => ({ changes: 0, lastInsertRowId: 0 }),
  finalizeAsync: async () => {},
};

export async function getDb(): Promise<AppDatabase> {
  return {
    execAsync: async () => {},
    runAsync: async () => ({ changes: 0, lastInsertRowId: 0 }),
    getFirstAsync: async () => null,
    getAllAsync: async () => [],
    prepareAsync: async () => mockStatement,
  };
}

export type { AppDatabase, DbStatement } from './client';
