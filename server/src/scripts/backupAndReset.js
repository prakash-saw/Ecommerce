require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const connectDB = require('../config/db');

// List of MongoDB Collections strictly belonging to this BLANC ATELIER E-Commerce Application
const APPLICATION_COLLECTIONS = [
  'users',
  'products',
  'productvariants',
  'collections',
  'inventorymovements',
  'orders',
  'payments',
  'carts',
  'wishlists',
  'customdesigns',
  'designassets',
  'podjobs',
  'drops',
  'coupons',
  'reviews',
  'supporttickets',
  'rewardaccounts',
  'rewardconfigs',
  'otptokens',
  'adminauditlogs',
  'storesettings',
  'webhookevents'
];

async function runBackupAndReset(options = { dryRun: true }) {
  console.log('====================================================');
  console.log('   BLANC ATELIER — DATABASE BACKUP & DATA RESET');
  console.log('====================================================');

  await connectDB();
  const db = mongoose.connection.db;
  const dbName = db.databaseName;
  const host = mongoose.connection.host;
  const port = mongoose.connection.port;

  console.log(`Connected to Database: "${dbName}" at ${host}:${port}`);

  // Safeguard 1: Prohibit execution in production environment
  if (process.env.NODE_ENV === 'production') {
    console.error('[CRITICAL SAFEGUARD] Aborting! Database reset script cannot be executed in production environment.');
    process.exit(1);
  }

  // Safeguard 2: Require local host strictly
  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(host);
  if (!isLocalHost) {
    console.error(`[CRITICAL SAFEGUARD] Aborting! Connected host "${host}" is remote. Data reset is strictly prohibited on non-local databases.`);
    process.exit(1);
  }

  // Safeguard 3: Prohibit live/production database names
  const prohibitedNames = ['production', 'prod', 'live', 'primary'];
  if (prohibitedNames.includes(dbName.toLowerCase())) {
    console.error(`[CRITICAL SAFEGUARD] Aborting! Database name "${dbName}" indicates a production database.`);
    process.exit(1);
  }

  // Identify application collections present in this database
  const allExistingCollections = (await db.listCollections().toArray()).map(c => c.name);
  const targetCollections = APPLICATION_COLLECTIONS.filter(name => allExistingCollections.includes(name));

  console.log(`\nFound ${targetCollections.length} application collections to process out of ${allExistingCollections.length} total collections in database.`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, `../../backups/backup_${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  // 1. BACKUP PHASE
  console.log(`\n--- STEP 1: CREATING VERIFIED BACKUP IN ${backupDir} ---`);
  const manifest = {
    timestamp: new Date().toISOString(),
    databaseName: dbName,
    host: host,
    collections: {},
    totalDocuments: 0,
    uploadFiles: []
  };

  for (const colName of targetCollections) {
    const col = db.collection(colName);
    const count = await col.countDocuments();
    const docs = await col.find({}).toArray();

    const filePath = path.join(backupDir, `${colName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');

    const fileHash = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');

    manifest.collections[colName] = {
      count,
      filePath: path.relative(path.join(__dirname, '../../'), filePath),
      sha256: fileHash
    };
    manifest.totalDocuments += count;
    console.log(`  ✓ Backed up "${colName}": ${count} records exported`);
  }

  // Backup uploaded artwork files if present
  const uploadsArtworkDir = path.join(__dirname, '../../uploads/artwork');
  if (fs.existsSync(uploadsArtworkDir)) {
    const backupUploadsDir = path.join(backupDir, 'uploads_artwork');
    fs.mkdirSync(backupUploadsDir, { recursive: true });

    const files = fs.readdirSync(uploadsArtworkDir);
    for (const file of files) {
      const srcPath = path.join(uploadsArtworkDir, file);
      if (fs.statSync(srcPath).isFile()) {
        const destPath = path.join(backupUploadsDir, file);
        fs.copyFileSync(srcPath, destPath);
        manifest.uploadFiles.push(file);
      }
    }
    console.log(`  ✓ Backed up ${manifest.uploadFiles.length} user-generated artwork files.`);
  }

  const manifestPath = path.join(backupDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`  ✓ Manifest generated: ${manifestPath}`);

  // 2. BACKUP INTEGRITY VERIFICATION PHASE
  console.log('\n--- STEP 2: VERIFYING BACKUP INTEGRITY ---');
  let verificationPassed = true;

  for (const [colName, meta] of Object.entries(manifest.collections)) {
    const filePath = path.join(backupDir, `${colName}.json`);
    if (!fs.existsSync(filePath)) {
      console.error(`  ✗ Missing backup file: ${filePath}`);
      verificationPassed = false;
      break;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    if (parsed.length !== meta.count) {
      console.error(`  ✗ Count mismatch for ${colName}: expected ${meta.count}, found ${parsed.length}`);
      verificationPassed = false;
      break;
    }
  }

  if (!verificationPassed) {
    console.error('\n[CRITICAL ERROR] Backup verification failed! Aborting data reset.');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`  ✓ Backup verified successfully! ${manifest.totalDocuments} total documents safely archived across ${Object.keys(manifest.collections).length} collections.`);

  // 3. RESET PHASE (DRY-RUN VS EXECUTE)
  if (options.dryRun) {
    console.log('\n--- STEP 3: DRY-RUN SIMULATION (NO DATA MODIFIED) ---');
    console.log('The following application records would be cleared:');
    for (const [colName, meta] of Object.entries(manifest.collections)) {
      console.log(`  - [SIMULATED CLEAR] ${colName}: ${meta.count} records`);
    }
    console.log(`  - [SIMULATED CLEAR] uploads/artwork: ${manifest.uploadFiles.length} files`);
    console.log('\n[INFO] To perform actual deletion, you must specify: node src/scripts/backupAndReset.js --execute --confirm-reset with ALLOW_DB_RESET=true');
  } else {
    // Explicit confirmation check
    if (!options.confirmed || process.env.ALLOW_DB_RESET !== 'true') {
      console.error('\n[CRITICAL SAFEGUARD] Execution aborted!');
      console.error('Data reset requires BOTH explicit CLI flag: --confirm-reset');
      console.error('AND environment variable: ALLOW_DB_RESET=true');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('\n--- STEP 3: EXECUTING DATABASE DATA RESET ---');

    for (const colName of targetCollections) {
      const col = db.collection(colName);
      const deleteResult = await col.deleteMany({});
      console.log(`  ✓ Cleared collection "${colName}": ${deleteResult.deletedCount} documents removed.`);
    }

    // Clean user uploaded artwork files (preserving folder structure)
    if (fs.existsSync(uploadsArtworkDir)) {
      const files = fs.readdirSync(uploadsArtworkDir);
      let removedFilesCount = 0;
      for (const file of files) {
        const filePath = path.join(uploadsArtworkDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
          removedFilesCount++;
        }
      }
      console.log(`  ✓ Cleared ${removedFilesCount} files from uploads/artwork.`);
    }

    // Clean previews folder if any
    const uploadsPreviewsDir = path.join(__dirname, '../../uploads/previews');
    if (fs.existsSync(uploadsPreviewsDir)) {
      const files = fs.readdirSync(uploadsPreviewsDir);
      for (const file of files) {
        const filePath = path.join(uploadsPreviewsDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // 4. POST-RESET VERIFICATION
    console.log('\n--- STEP 4: POST-RESET DATABASE VERIFICATION ---');
    let allZero = true;
    for (const colName of targetCollections) {
      const col = db.collection(colName);
      const remainingCount = await col.countDocuments();
      if (remainingCount !== 0) {
        console.error(`  ✗ Collection "${colName}" still has ${remainingCount} documents!`);
        allZero = false;
      } else {
        console.log(`  ✓ "${colName}": 0 documents (CLEAN)`);
      }
    }

    if (allZero) {
      console.log('\n✦ ALL 22 APPLICATION COLLECTIONS ARE CONFIRMED 100% EMPTY!');
    } else {
      console.error('\n✗ Post-reset check detected remaining documents!');
    }
  }

  await mongoose.disconnect();
  return { manifest, backupDir };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');
  const isConfirmed = args.includes('--confirm-reset');
  runBackupAndReset({ dryRun: !isExecute, confirmed: isConfirmed })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal execution error:', err);
      process.exit(1);
    });
}

module.exports = runBackupAndReset;
