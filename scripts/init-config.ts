import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from '../src/data-source';
import * as ConfigModel from '../src/models/ConfigModel';

async function initConfig(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Set default config values (only if not already set)
    const defaults = [
      { key: 'bank_code', value: process.env.BANK_CODE || 'DFC', description: 'Bank code identifier' },
      { key: 'bank_name', value: process.env.BANK_NAME || 'DFC Bank', description: 'Bank display name' },
      { key: 'convertor_api_url', value: process.env.CONVERTOR_API_URL || 'http://localhost:4000', description: 'Convertor protocol API URL' },
    ];

    for (const item of defaults) {
      const existing = await ConfigModel.getConfig(item.key);
      if (!existing) {
        await ConfigModel.setConfig(item.key, item.value, item.description);
        console.log(`✅ Set config: ${item.key} = ${item.value}`);
      } else {
        console.log(`⏭️  Config already exists: ${item.key}`);
      }
    }

    console.log('\n✅ Configuration initialized');
    await AppDataSource.destroy();
  } catch (e) {
    console.error('❌ Failed to initialize config:', e);
    process.exit(1);
  }
}

initConfig();
