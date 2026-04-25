export interface DbStatement {
  executeAsync(params?: Record<string, unknown>): Promise<unknown>;
  finalizeAsync(): Promise<void>;
}

export interface AppDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: unknown[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getFirstAsync<T>(source: string, ...params: unknown[]): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]>;
  prepareAsync(source: string): Promise<DbStatement>;
}

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
