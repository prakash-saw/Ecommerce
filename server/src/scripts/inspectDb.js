require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

async function inspect() {
  await connectDB();
  const db = mongoose.connection.db;
  const dbName = db.databaseName;
  const host = mongoose.connection.host;
  const port = mongoose.connection.port;

  console.log('--- DATABASE INSPECTION REPORT ---');
  console.log(`Database Name: ${dbName}`);
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`Ready State: ${mongoose.connection.readyState}`);

  const collections = await db.listCollections().toArray();
  console.log(`Found ${collections.length} collections:`);

  const summary = {};
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    summary[col.name] = count;
    console.log(` - ${col.name}: ${count} documents`);
  }

  await mongoose.disconnect();
  return { dbName, host, port, summary };
}

if (require.main === module) {
  inspect()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Inspection failed:', err);
      process.exit(1);
    });
}

module.exports = inspect;
