#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'mysql', // Connect to mysql system DB first
};

async function createDatabase() {
  try {
    const connection = await mysql.createConnection(config);
    const dbName = process.env.DB_NAME || 'bankdemo';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' created successfully!`);
    await connection.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ Failed to create database:', e.message);
    console.error('\n💡 Make sure MySQL is running and credentials are correct in .env');
    process.exit(1);
  }
}

createDatabase();
