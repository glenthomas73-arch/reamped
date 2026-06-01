// ReAmped DB Migration Runner
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    async function migrate() {
      console.log('Running ReAmped migrations...');
        try {
            const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
                await db.query(schema);
                    console.log('Migrations complete.');
                      } catch (err) {
                          console.error('Migration failed:', err.message);
                              process.exit(1);
                                } finally {
                                    await db.end();
                                      }
                                      }

                                      migrate();
