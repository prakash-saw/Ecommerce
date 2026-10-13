require('dotenv').config();
const connectDB = require('../config/db');
const seedDatabase = require('./seedData');

(async () => {
  await connectDB();
  await seedDatabase();
  console.log('Seed completed successfully. Exiting.');
  process.exit(0);
})();
