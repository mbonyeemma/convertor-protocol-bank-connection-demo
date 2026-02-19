import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config';
import { Account } from './entities/Account';
import { ConnectionToken } from './entities/ConnectionToken';
import { BankTransaction } from './entities/Transaction';
import { BankConfig } from './entities/Config';

// Enable synchronize if explicitly set via env var, or in development
const shouldSynchronize = process.env.DB_SYNCHRONIZE === 'true' || config.env === 'development';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.database,
  synchronize: shouldSynchronize,
  logging: false,
  entities: [Account, ConnectionToken, BankTransaction, BankConfig],
  migrations: [],
});
