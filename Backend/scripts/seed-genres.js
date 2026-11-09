const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
require('dotenv').config();

async function seedGenres() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  const genres = [
    'Hành động', 'Hài hước', 'Tình cảm', 'Phiêu lưu', 'Kinh dị',
    'Kỳ ảo', 'Khoa học viễn tưởng', 'Xuyên không', 'Đời thường', 'Học đường',
    'Trinh thám', 'Lịch sử', 'Thể thao', 'Harem', 'Mecha'
  ];

  try {
    await client.connect();
    console.log('Seeding genres...');
    for (const genre of genres) {
      await client.query(
        'INSERT INTO "Genre" ("id", "name") VALUES ($1, $2) ON CONFLICT ("name") DO NOTHING',
        [randomUUID(), genre],
      );
      console.log(`+ Added genre: ${genre}`);
    }
    console.log('Genres seeded successfully.');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

seedGenres();
