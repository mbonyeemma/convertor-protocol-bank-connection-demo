#!/bin/bash
# Quick setup script for MySQL database

DB_NAME=${DB_NAME:-bankdemo}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}

echo "Creating database: $DB_NAME"
if [ -z "$DB_PASSWORD" ]; then
  mysql -u $DB_USER -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null || echo "Database $DB_NAME already exists or mysql command failed"
else
  mysql -u $DB_USER -p$DB_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null || echo "Database $DB_NAME already exists or mysql command failed"
fi

echo "✅ Database setup complete!"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
