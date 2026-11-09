const { Client } = require('pg');
require('dotenv').config();

async function check() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    const result = await client.query(
      'SELECT id, username, email, role FROM "User" ORDER BY "createdAt" DESC LIMIT 5',
    );
    console.log("Users in DB:");
    console.table(result.rows);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

check();
