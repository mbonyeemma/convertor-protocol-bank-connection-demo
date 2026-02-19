import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './config';
import { Account } from './entities/Account';
import { ConnectionToken } from './entities/ConnectionToken';
import { BankTransaction } from './entities/Transaction';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.database,
  synchronize: config.env === 'development',
  logging: false,
  entities: [Account, ConnectionToken, BankTransaction],
  migrations: [],
});
