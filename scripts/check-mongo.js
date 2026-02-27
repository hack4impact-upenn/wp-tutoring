const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://abansal1_db_user:rfn0VV5TrNgave6u@westphilly.vw2page.mongodb.net/?appName=WestPhilly';

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!\n');

    const dbList = await client.db().admin().listDatabases();
    console.log('📦 Available databases:');
    dbList.databases.forEach(db => console.log(`  - ${db.name}`));
    console.log();

    for (const { name } of dbList.databases) {
      if (['admin', 'local', 'config'].includes(name)) continue;
      const db = client.db(name);
      const collections = await db.listCollections().toArray();
      console.log(`📂 Database: "${name}"`);
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`   📄 ${col.name} — ${count} document(s)`);
        if (count > 0) {
          const sample = await db.collection(col.name).findOne();
          console.log(`      Keys: ${Object.keys(sample).join(', ')}`);
        }
      }
      console.log();
    }
  } finally {
    await client.close();
    console.log('🔌 Connection closed.');
  }
}

main().catch(err => {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
});
