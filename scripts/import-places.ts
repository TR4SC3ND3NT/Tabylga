import type { PlacesImportDb, PlacesImportStatement } from '../lib/db/seed-full';

declare const require: (moduleName: string) => unknown;
declare const process: {
  cwd: () => string;
  env: Record<string, string | undefined>;
  exitCode?: number;
};

interface FileSystem {
  existsSync: (filePath: string) => boolean;
  readFileSync: (filePath: string, encoding: 'utf8') => string;
}

interface PathModule {
  resolve: (...paths: string[]) => string;
}

interface ConsoleWithError {
  error: (...args: unknown[]) => void;
}

interface SqliteStatementSync {
  get: () => unknown;
  run: (params?: Record<string, unknown>) => unknown;
}

interface SqliteDatabaseSync {
  close: () => void;
  exec: (sql: string) => void;
  prepare: (sql: string) => SqliteStatementSync;
}

interface SqliteModule {
  DatabaseSync: new (filename: string) => SqliteDatabaseSync;
}

const fs = require('node:fs') as FileSystem;
const path = require('node:path') as PathModule;
const console = globalThis.console as ConsoleWithError;

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function loadSqliteModule(): SqliteModule {
  try {
    return require('node:sqlite') as SqliteModule;
  } catch {
    throw new Error('scripts/import-places.ts requires Node with node:sqlite support');
  }
}

function createNodeDb(filename: string): { db: PlacesImportDb; close: () => void } {
  const sqlite = new (loadSqliteModule().DatabaseSync)(filename);

  return {
    db: {
      execAsync: async (sql: string) => {
        sqlite.exec(sql);
      },
      getFirstAsync: async <T>(sql: string) => sqlite.prepare(sql).get() as T | null,
      prepareAsync: async (sql: string): Promise<PlacesImportStatement> => {
        const statement = sqlite.prepare(sql);

        return {
          executeAsync: async (params: Record<string, unknown>) => statement.run(params),
          finalizeAsync: async () => {},
        };
      },
    },
    close: () => sqlite.close(),
  };
}

async function migrateNodeDb(db: PlacesImportDb): Promise<void> {
  const { CREATE_INDEXES, CREATE_PLACES_TABLE } = await import('../lib/db/schema');

  await db.execAsync(CREATE_PLACES_TABLE);

  for (const indexSql of CREATE_INDEXES.filter((sql) => sql.includes(' ON places'))) {
    await db.execAsync(indexSql);
  }
}

async function main(): Promise<void> {
  loadEnvFile(path.resolve(process.cwd(), '.env'));
  loadEnvFile(path.resolve(process.cwd(), '.env.local'));

  const databasePath = process.env.TABYLGA_SQLITE_PATH ?? path.resolve(process.cwd(), 'tabylga.db');
  const nodeDb = createNodeDb(databasePath);
  const { seedFullPlaces } = await import('../lib/db/seed-full');

  try {
    await seedFullPlaces({
      db: nodeDb.db,
      migrate: () => migrateNodeDb(nodeDb.db),
    });
  } finally {
    nodeDb.close();
  }
}

main().catch((error) => {
  console.error('[db] Full places import failed', error);
  process.exitCode = 1;
});

export {};
