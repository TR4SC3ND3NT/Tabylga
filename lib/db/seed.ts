import { getDb } from './client';

interface Place {
  id: string;
  osm_id: number;
  name: string;
  name_en: string;
  name_ky: string;
  lat: number;
  lon: number;
  category: string;
  region: string;
  tags: string;
  photo_url: string | null;
}

export const SEED_PLACES: Place[] = [
  // ── Bishkek ───────────────────────────────────────────────
  {
    id: 'place_001', osm_id: 1001,
    name: 'Hyatt Regency Bishkek', name_en: 'Hyatt Regency Bishkek', name_ky: 'Хайат Ридженси Бишкек',
    lat: 42.8694, lon: 74.5945, category: 'hotel', region: 'bishkek',
    tags: JSON.stringify({ stars: 5, amenities: ['pool', 'gym', 'restaurant', 'spa'], price_usd: 180 }),
    photo_url: null,
  },
  {
    id: 'place_002', osm_id: 1002,
    name: 'Golden Tulip Garden Hotel', name_en: 'Golden Tulip Garden Hotel', name_ky: 'Голден Тюлип',
    lat: 42.8753, lon: 74.6122, category: 'hotel', region: 'bishkek',
    tags: JSON.stringify({ stars: 4, amenities: ['restaurant', 'parking', 'wifi'], price_usd: 95 }),
    photo_url: null,
  },
  {
    id: 'place_003', osm_id: 1003,
    name: 'Navigator Guesthouse', name_en: 'Navigator Guesthouse', name_ky: 'Навигатор',
    lat: 42.8711, lon: 74.5883, category: 'hostel', region: 'bishkek',
    tags: JSON.stringify({ stars: 0, amenities: ['shared_kitchen', 'wifi', 'lockers'], price_usd: 12 }),
    photo_url: null,
  },
  {
    id: 'place_004', osm_id: 1004,
    name: 'Arzu Restaurant', name_en: 'Arzu Restaurant', name_ky: 'Арзу',
    lat: 42.8738, lon: 74.6015, category: 'restaurant', region: 'bishkek',
    tags: JSON.stringify({ cuisine: 'kyrgyz', price_range: '$$', open_hours: '10:00-23:00' }),
    photo_url: null,
  },
  {
    id: 'place_005', osm_id: 1005,
    name: 'Coffee House Bishkek', name_en: 'Coffee House', name_ky: 'Кофе Хауз',
    lat: 42.8762, lon: 74.5998, category: 'cafe', region: 'bishkek',
    tags: JSON.stringify({ cuisine: 'cafe', price_range: '$', open_hours: '08:00-22:00' }),
    photo_url: null,
  },
  {
    id: 'place_006', osm_id: 1006,
    name: 'Osh Bazaar', name_en: 'Osh Bazaar Bishkek', name_ky: 'Ош базары',
    lat: 42.8668, lon: 74.5769, category: 'market', region: 'bishkek',
    tags: JSON.stringify({ type: 'market', products: ['produce', 'spices', 'crafts'], free_entry: true }),
    photo_url: null,
  },
  // ── Ala-Archa ─────────────────────────────────────────────
  {
    id: 'place_007', osm_id: 2001,
    name: 'Ala-Archa National Park', name_en: 'Ala-Archa National Park', name_ky: 'Ала-Арча улуттук паркы',
    lat: 42.5561, lon: 74.4822, category: 'nature', region: 'ala-archa',
    tags: JSON.stringify({ entry_fee_usd: 3, difficulty: 'moderate', elevation_m: 2200, hiking: true }),
    photo_url: null,
  },
  {
    id: 'place_008', osm_id: 2002,
    name: 'Ak-Sai Glacier', name_en: 'Ak-Sai Glacier', name_ky: 'Ак-Сай мөңгүсү',
    lat: 42.4833, lon: 74.4667, category: 'nature', region: 'ala-archa',
    tags: JSON.stringify({ difficulty: 'hard', elevation_m: 3800, guide_required: true }),
    photo_url: null,
  },
  {
    id: 'place_009', osm_id: 2003,
    name: 'Alpinist Alplager Base Camp', name_en: 'Alpinist Base Camp', name_ky: 'Альпинист лагери',
    lat: 42.5389, lon: 74.4756, category: 'activity', region: 'ala-archa',
    tags: JSON.stringify({ type: 'base_camp', elevation_m: 2000, services: ['guide', 'rental'] }),
    photo_url: null,
  },
  // ── Issyk-Kul ─────────────────────────────────────────────
  {
    id: 'place_010', osm_id: 3001,
    name: 'Cholpon-Ata Beach', name_en: 'Cholpon-Ata Beach', name_ky: 'Чолпон-Ата жээги',
    lat: 42.6500, lon: 77.0833, category: 'nature', region: 'issyk-kul',
    tags: JSON.stringify({ water_temp_c: 22, beach_type: 'public', season: 'jun-sep' }),
    photo_url: null,
  },
  {
    id: 'place_011', osm_id: 3002,
    name: 'Raduga Resort', name_en: 'Raduga Resort', name_ky: 'Радуга',
    lat: 42.6444, lon: 77.0722, category: 'hotel', region: 'issyk-kul',
    tags: JSON.stringify({ stars: 3, amenities: ['beach', 'pool', 'restaurant'], price_usd: 65 }),
    photo_url: null,
  },
  {
    id: 'place_012', osm_id: 3003,
    name: 'Jeti-Ögüz Canyon & Sanatorium', name_en: 'Jeti-Oguz', name_ky: 'Жети-Өгүз',
    lat: 42.3672, lon: 78.2361, category: 'nature', region: 'issyk-kul',
    tags: JSON.stringify({ landmark: 'red_rocks', hiking: true, accommodation: true }),
    photo_url: null,
  },
  {
    id: 'place_013', osm_id: 3004,
    name: 'Bosteri Beach Resort Zone', name_en: 'Bosteri', name_ky: 'Бостери',
    lat: 42.7000, lon: 77.2000, category: 'nature', region: 'issyk-kul',
    tags: JSON.stringify({ beach_type: 'resort', water_sports: true, season: 'jun-sep' }),
    photo_url: null,
  },
  {
    id: 'place_014', osm_id: 3005,
    name: 'Tamga Yurt Camp', name_en: 'Tamga Yurt Camp', name_ky: 'Тамга юрт лагери',
    lat: 42.1622, lon: 77.5833, category: 'yurt', region: 'issyk-kul',
    tags: JSON.stringify({ yurts: 8, meals_included: true, price_usd: 35, offline_pay: true }),
    photo_url: null,
  },
  {
    id: 'place_015', osm_id: 3006,
    name: 'Kyzyl-Suu Gorge', name_en: 'Kyzyl-Suu Gorge', name_ky: 'Кызыл-Суу капчыгайы',
    lat: 42.2833, lon: 78.0667, category: 'nature', region: 'issyk-kul',
    tags: JSON.stringify({ difficulty: 'easy', hike_hours: 3, highlights: ['waterfall', 'canyon'] }),
    photo_url: null,
  },
  // ── Song-Kul ──────────────────────────────────────────────
  {
    id: 'place_016', osm_id: 4001,
    name: 'Song-Kul Lake', name_en: 'Song-Kul Lake', name_ky: 'Сон-Күл',
    lat: 41.8500, lon: 75.1333, category: 'nature', region: 'song-kul',
    tags: JSON.stringify({ elevation_m: 3016, area_km2: 270, best_season: 'jun-sep', no_signal: true }),
    photo_url: null,
  },
  {
    id: 'place_017', osm_id: 4002,
    name: "Shepherd's Life Yurt Camp", name_en: "Shepherd's Life", name_ky: 'Чабандын жашоосу',
    lat: 41.8611, lon: 75.1500, category: 'yurt', region: 'song-kul',
    tags: JSON.stringify({ yurts: 12, meals_included: true, price_usd: 45, offline_pay: true, horse_riding: true }),
    photo_url: null,
  },
  {
    id: 'place_018', osm_id: 4003,
    name: 'Nomad Camp Song-Kul', name_en: 'Nomad Camp', name_ky: 'Кочмондор лагери',
    lat: 41.8389, lon: 75.1167, category: 'yurt', region: 'song-kul',
    tags: JSON.stringify({ yurts: 6, meals_included: true, price_usd: 40, offline_pay: true }),
    photo_url: null,
  },
  {
    id: 'place_019', osm_id: 4004,
    name: 'Song-Kul Horse Trek Route', name_en: 'Horse Trek Song-Kul', name_ky: 'Ат тур',
    lat: 41.8450, lon: 75.1400, category: 'activity', region: 'song-kul',
    tags: JSON.stringify({ duration_hours: 6, price_usd: 30, guide_included: true, offline_pay: true }),
    photo_url: null,
  },
  // ── Karakol ───────────────────────────────────────────────
  {
    id: 'place_020', osm_id: 5001,
    name: 'Karakol Animal Market', name_en: 'Karakol Animal Market', name_ky: 'Каракол мал базары',
    lat: 42.4667, lon: 78.3833, category: 'market', region: 'karakol',
    tags: JSON.stringify({ days: ['sunday'], free_entry: true, type: 'livestock_market' }),
    photo_url: null,
  },
  {
    id: 'place_021', osm_id: 5002,
    name: 'Dungan Mosque Karakol', name_en: 'Dungan Mosque', name_ky: 'Дүнгөн мечити',
    lat: 42.4892, lon: 78.3892, category: 'attraction', region: 'karakol',
    tags: JSON.stringify({ built: 1910, style: 'chinese', free_entry: true }),
    photo_url: null,
  },
  {
    id: 'place_022', osm_id: 5003,
    name: 'Karakol Ski Base', name_en: 'Karakol Ski Base', name_ky: 'Каракол ски базасы',
    lat: 42.3833, lon: 78.3333, category: 'activity', region: 'karakol',
    tags: JSON.stringify({ season: 'nov-apr', runs: 12, rental_available: true, price_usd: 25 }),
    photo_url: null,
  },
  {
    id: 'place_023', osm_id: 5004,
    name: 'Trekking Union Guesthouse', name_en: 'Trekking Union', name_ky: 'Тректинг Юнион',
    lat: 42.4900, lon: 78.3900, category: 'hostel', region: 'karakol',
    tags: JSON.stringify({ dorm_usd: 10, private_usd: 25, trek_tours: true }),
    photo_url: null,
  },
  {
    id: 'place_024', osm_id: 5005,
    name: 'Jyrgalan Valley', name_en: 'Jyrgalan Valley', name_ky: 'Жыргалан өрөөнү',
    lat: 42.3667, lon: 78.7833, category: 'nature', region: 'karakol',
    tags: JSON.stringify({ hiking: true, mountain_biking: true, difficulty: 'moderate', homestay: true }),
    photo_url: null,
  },
  // ── Osh ───────────────────────────────────────────────────
  {
    id: 'place_025', osm_id: 6001,
    name: 'Sulayman Too', name_en: 'Sulayman Too', name_ky: 'Сулайман-Тоо',
    lat: 40.5131, lon: 72.8136, category: 'attraction', region: 'osh',
    tags: JSON.stringify({ unesco: true, entry_fee_usd: 1, views: true, sacred: true }),
    photo_url: null,
  },
  {
    id: 'place_026', osm_id: 6002,
    name: 'Osh Bazaar', name_en: 'Osh Bazaar', name_ky: 'Ош базары',
    lat: 40.5233, lon: 72.7994, category: 'market', region: 'osh',
    tags: JSON.stringify({ type: 'market', products: ['spices', 'dried_fruit', 'crafts'], free_entry: true }),
    photo_url: null,
  },
  {
    id: 'place_027', osm_id: 6003,
    name: 'Navat Restaurant Osh', name_en: 'Navat Restaurant', name_ky: 'Нават',
    lat: 40.5200, lon: 72.8100, category: 'restaurant', region: 'osh',
    tags: JSON.stringify({ cuisine: 'central_asian', price_range: '$$', open_hours: '09:00-23:00' }),
    photo_url: null,
  },
  // ── Naryn / Remote ────────────────────────────────────────
  {
    id: 'place_028', osm_id: 7001,
    name: 'Sary-Chelek Nature Reserve', name_en: 'Sary-Chelek Reserve', name_ky: 'Сары-Челек заказниги',
    lat: 41.8333, lon: 71.9500, category: 'nature', region: 'naryn',
    tags: JSON.stringify({ entry_fee_usd: 5, lake: true, walnut_forest: true, no_signal: true }),
    photo_url: null,
  },
  {
    id: 'place_029', osm_id: 7002,
    name: 'Arslanbob Walnut Forest', name_en: 'Arslanbob', name_ky: 'Арсланбоб',
    lat: 41.3333, lon: 72.9333, category: 'nature', region: 'naryn',
    tags: JSON.stringify({ largest_walnut_forest: true, homestay: true, hiking: true, price_usd: 20 }),
    photo_url: null,
  },
  {
    id: 'place_030', osm_id: 7003,
    name: 'Tash Rabat Caravanserai', name_en: 'Tash Rabat', name_ky: 'Таш-Рабат',
    lat: 40.8278, lon: 75.2653, category: 'attraction', region: 'naryn',
    tags: JSON.stringify({ built: '15th_century', entry_fee_usd: 2, silk_road: true, yurt_nearby: true }),
    photo_url: null,
  },
];

export async function seedDevData(): Promise<void> {
  const db = await getDb();

  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM places'
  );
  if ((row?.count ?? 0) > 0) return;

  const stmt = await db.prepareAsync(
    `INSERT INTO places (id, osm_id, name, name_en, name_ky, lat, lon, category, region, tags, photo_url)
     VALUES ($id, $osm_id, $name, $name_en, $name_ky, $lat, $lon, $category, $region, $tags, $photo_url)`
  );

  try {
    for (const place of SEED_PLACES) {
      await stmt.executeAsync({
        $id: place.id, $osm_id: place.osm_id,
        $name: place.name, $name_en: place.name_en, $name_ky: place.name_ky,
        $lat: place.lat, $lon: place.lon,
        $category: place.category, $region: place.region,
        $tags: place.tags, $photo_url: place.photo_url,
      });
    }
  } finally {
    await stmt.finalizeAsync();
  }

  console.log(`[db] Seeded ${SEED_PLACES.length} dev places`);
}
