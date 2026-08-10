/**
 * Database seed — loads the exercise library from seed.sql.
 *
 * Wired to the `prisma.seed` hook already declared in package.json, which
 * pointed at this file even though it did not exist (finding L9), so
 * `npx prisma db seed` failed. The API integration tests need a seeded
 * Exercise table, so it exists now.
 *
 *   DATABASE_URL=postgresql://... npx prisma db seed
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL is not set');
    }

    const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

    const client = new Client({ connectionString });
    await client.connect();
    try {
        await client.query(sql);
        const { rows } = await client.query('SELECT count(*)::int AS count FROM "Exercise"');
        console.log(`Seeded ${rows[0].count} exercises.`);
    } finally {
        await client.end();
    }
}

main().catch((error) => {
    console.error('Seed failed:', error.message);
    process.exit(1);
});
