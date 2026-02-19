# Simplified Environment Variables

## What Changed?

We've reduced environment variables by storing non-sensitive configuration in the database.

## Required .env Variables (Only 7!)

### 1. Database Connection (5 variables - REQUIRED)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=bankdemo
```

### 2. Security Keys (2 variables - REQUIRED)
```env
BANK_PRIVATE_KEY_PATH=./keys/bank_private.pem
CONVERTOR_PUBLIC_KEY_PATH=./keys/convertor_public.pem
```

### 3. Application (Optional - has defaults)
```env
NODE_ENV=development
PORT=5001
```

## What's Now in Database?

These values are stored in the `bank_config` table and can be updated via admin UI:

- `bank_code` - Bank identifier (e.g., "DFC")
- `bank_name` - Bank display name (e.g., "DFC Bank")
- `convertor_api_url` - Protocol API URL

## Setup Steps

1. **Set minimal .env:**
   ```bash
   cp .env.example .env
   # Edit .env with your DB credentials and key paths
   ```

2. **Generate keys:**
   ```bash
   npm run generate-keys
   ```

3. **Create database:**
   ```bash
   npm run create-db
   ```

4. **Initialize config (sets defaults from .env or uses defaults):**
   ```bash
   npm run init-config
   ```

5. **Start server:**
   ```bash
   npm run dev
   ```

## Updating Config Values

### Via Admin UI
1. Go to admin UI
2. Navigate to Settings/Config
3. Update values

### Via API (if implemented)
```bash
PATCH /admin/config/bank_code
PATCH /admin/config/bank_name
PATCH /admin/config/convertor_api_url
```

### Via Database
```sql
UPDATE bank_config SET value = 'NEW_VALUE' WHERE key = 'bank_code';
```

## Benefits

✅ **Fewer env vars** - Only 7 required (down from 10+)  
✅ **Easier updates** - Change config without redeploying  
✅ **Admin-friendly** - Update via UI instead of env vars  
✅ **Secure** - Sensitive keys still in env vars/secrets  

## Railway Deployment

For Railway, you only need to set:

**Required Secrets:**
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (from MySQL service)
- `BANK_PRIVATE_KEY` (full PEM content)
- `CONVERTOR_PUBLIC_KEY` (full PEM content)

**Optional:**
- `PORT` (defaults to 5000)
- `NODE_ENV` (defaults to production)

Config values (`BANK_CODE`, `BANK_NAME`, `CONVERTOR_API_URL`) are stored in database and initialized on first run.
