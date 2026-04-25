import { getDb } from './client';
import {
  CREATE_MIGRATIONS_TABLE,
  CREATE_USERS_TABLE,
  CREATE_PLACES_TABLE,
  CREATE_TRIPS_TABLE,
  CREATE_TRANSACTIONS_TABLE,
  CREATE_MERCHANTS_TABLE,
  CREATE_REVIEWS_TABLE,
  CREATE_INDEXES,
} from './schema';

interface Migration {
  version: number;
  up: string;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    up: [
      CREATE_USERS_TABLE,
      CREATE_PLACES_TABLE,
      CREATE_TRIPS_TABLE,
      CREATE_TRANSACTIONS_TABLE,
      CREATE_MERCHANTS_TABLE,
      CREATE_REVIEWS_TABLE,
      ...CREATE_INDEXES,
    ].join(';\n'),
  },
];

export async function runMigrations(): Promise<void> {
  const db = await getDb();

  await db.execAsync(CREATE_MIGRATIONS_TABLE);

  const row = await db.getFirstAsync<{ max_version: number | null }>(
    'SELECT MAX(version) as max_version FROM _migrations'
  );
  const currentVersion = row?.max_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) continue;
    await db.execAsync(migration.up);
    await db.runAsync(
      'INSERT INTO _migrations (version, run_at) VALUES (?, ?)',
      migration.version,
      Date.now()
    );
    console.log(`[db] Migration v${migration.version} applied`);
  }
}
