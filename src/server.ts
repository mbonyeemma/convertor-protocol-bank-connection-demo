import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import path from 'path';
import app from './application';
import bankRoutes from './routes/bank';
import adminRoutes from './routes/admin';
import { AppDataSource } from './data-source';
import { config } from './config';

app.use('/api', bankRoutes);
app.use('/admin', adminRoutes);
app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (_req, res) => {
  const bankName = config.getBankName();
  res.json({ status: 'ok', bank: bankName });
});

const port = config.port;

async function start(): Promise<void> {
  try {
    await AppDataSource.initialize();
    const synchronizeEnabled = AppDataSource.options.synchronize;
    console.log('✅ Database initialized' + (synchronizeEnabled ? ' (synchronize enabled - tables auto-created)' : ''));
    
    // Load config from database and cache it
    try {
      const ConfigModel = await import('./models/ConfigModel');
      const dbConfig = await ConfigModel.getAllConfig();
      const { setDbConfigCache } = await import('./config');
      setDbConfigCache(dbConfig);
    } catch (e) {
      console.warn('[config] Could not load config from database, using env vars');
    }
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : String(e);
    if (error.includes('Unknown database')) {
      console.error(`❌ Database '${config.db.database}' does not exist`);
      console.error('\n💡 Create it with:');
      const passwordPart = config.db.password ? `-p${config.db.password}` : '';
      console.error(`   mysql -u ${config.db.user} ${passwordPart} -e "CREATE DATABASE IF NOT EXISTS ${config.db.database};"`);
      console.error('\n   Or use docker compose up -d (includes MySQL)');
    } else if (error.includes('ECONNREFUSED') || error.includes('ENOTFOUND')) {
      console.error('❌ Cannot connect to MySQL server');
      console.error(`   Host: ${config.db.host}:${config.db.port}`);
      console.error('\n💡 Make sure MySQL is running:');
      console.error('   - Local: brew services start mysql (macOS) or start MySQL service');
      console.error('   - Docker: docker compose up -d');
      console.error('   - Railway: Check MySQL service is running and DB_HOST is set correctly');
    } else {
      console.error('❌ Database connection failed:', error);
    }
    process.exit(1);
  }
  app.listen(port, '0.0.0.0', () => {
    const bankName = config.getBankName();
    const bankCode = config.getBankCode();
    console.log(`\n🏦 ${bankName} (${bankCode}) listening on port ${port}`);
    console.log(`   Bank endpoints: http://localhost:${port}/api/*`);
    console.log(`   Admin UI:       http://localhost:${port}/`);
    console.log(`   Admin API:     http://localhost:${port}/admin/*\n`);
  });
}

process.on('SIGTERM', async () => {
  await AppDataSource.destroy();
  process.exit(0);
});

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
