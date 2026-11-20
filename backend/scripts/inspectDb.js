const { Client } = require('pg');

async function main() {
  const connectionString = 'postgresql://postgres:j5xuHFP2l01cmqoc@db.ezmzwdewurflhavtpihg.supabase.co:5432/postgres';
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL successfully.');

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('Existing tables in public schema:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Error connecting to Supabase:', err.message);
  } finally {
    await client.end();
  }
}

main();

