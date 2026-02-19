# Railway Deployment - Bank Demo

## Quick Setup

1. **Connect Repository** to Railway
2. **Set Environment Variables** (minimal - only 7 required):

```
# Database (from MySQL service)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=3306
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}

# Optional
NODE_ENV=production
PORT=5001
```

3. **Paste Keys in Settings UI** (after first deploy):
   - Go to admin UI → Settings
   - Paste Bank Private Key
   - Paste Convertor Public Key
   - Set Bank Code, Name, Convertor API URL

## Why No Keys in .env?

Keys can be pasted directly in the admin UI Settings page - no need to manage files or env vars!

## Railway Configuration

- `railway.json` - Ensures npm is used (not bun)
- `nixpacks.toml` - Build configuration
- `package-lock.json` - Lockfile for npm

## Build Process

Railway will:
1. Install dependencies: `npm ci`
2. Build: `npm run build`
3. Start: `npm start`

## First Run

After deployment:
1. Access admin UI
2. Go to Settings
3. Paste keys and configure
4. Done!
