# Deploying Bank Demo on Railway

Railway is perfect for deploying the bank demo. It handles Docker builds, provides MySQL, and manages environment variables/secrets.

## Quick Deploy

### 1. Prepare Your Repository

Make sure you have:
- ✅ `Dockerfile` (already included)
- ✅ `.env.example` (for reference)
- ✅ Code committed to git

### 2. Deploy on Railway

1. **Create New Project** on Railway
2. **Connect Repository** (GitHub/GitLab) or **Deploy from Dockerfile**
3. **Add MySQL Service**:
   - Click "New" → "Database" → "MySQL"
   - Railway will provide connection details automatically

### 3. Set Environment Variables

In Railway project settings, add these **Variables**:

**Required:**
```
BANK_CODE=DEMO
BANK_NAME=Demo Bank
NODE_ENV=production
PORT=5000
```

**Database (from MySQL service):**
Railway automatically provides these when you add MySQL:
```
DB_HOST=<from MySQL service>
DB_PORT=3306
DB_USER=<from MySQL service>
DB_PASSWORD=<from MySQL service>
DB_NAME=<from MySQL service>
```

**Keys (set as Railway Secrets):**

1. **Generate bank keys** locally:
   ```bash
   node scripts/generate-keys.js
   cat keys/bank_private.pem
   ```

2. **Add as Railway Secret:**
   - Variable: `BANK_PRIVATE_KEY`
   - Value: Paste the entire PEM content (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)

3. **Get Convertor's public key** and add:
   - Variable: `CONVERTOR_PUBLIC_KEY`
   - Value: Paste Convertor's operational public key PEM

**Optional:**
```
CONVERTOR_API_URL=https://api.convertor.net
```

### 4. Deploy

Railway will:
- Build from `Dockerfile`
- Start the service
- Connect to MySQL automatically
- Expose on a public URL (e.g. `https://bank-demo-production.up.railway.app`)

### 5. Register Bank in Convertor

Once deployed, get your Railway URL (e.g. `https://bank-demo-production.up.railway.app`) and:

1. Get your bank's public key:
   ```bash
   cat keys/bank_public.pem
   ```

2. Register in Convertor Back Office:
   ```bash
   curl -X POST https://api.convertor.net/admin/banks \
     -H "X-Admin-Api-Key: $ADMIN_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "code": "DEMO",
       "name": "Demo Bank",
       "baseUrl": "https://bank-demo-production.up.railway.app",
       "publicKeyPem": "<paste bank_public.pem content>"
     }'
   ```

3. Activate:
   ```bash
   curl -X POST https://api.convertor.net/admin/banks/<BANK_UUID>/activate \
     -H "X-Admin-Api-Key: $ADMIN_API_KEY"
   ```

## Replicating for Another Bank

1. **Fork/clone** the bank-demo repo
2. **Change** `BANK_CODE` and `BANK_NAME` in Railway variables
3. **Generate new keys** (`node scripts/generate-keys.js`)
4. **Set** `BANK_PRIVATE_KEY` secret with new private key
5. **Submit** new `bank_public.pem` to Convertor Back Office
6. **Set** `baseUrl` in Convertor to new Railway URL
7. **Deploy** — Railway builds and runs automatically

## Railway Advantages

- ✅ **No docker-compose needed** — Railway handles MySQL separately
- ✅ **Automatic HTTPS** — Railway provides SSL certificates
- ✅ **Secrets management** — Keys stored securely as Railway secrets
- ✅ **Auto-scaling** — Railway handles traffic
- ✅ **Easy replication** — Deploy same code with different env vars

## Troubleshooting

**Database connection fails:**
- Check MySQL service is running in Railway
- Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` are set correctly (Railway auto-provides these)

**Signature verification fails:**
- Ensure `BANK_PRIVATE_KEY` and `CONVERTOR_PUBLIC_KEY` are set as Railway secrets
- Check PEM format (must include headers/footers, use `\n` for newlines in Railway)

**Bank endpoints not accessible:**
- Check Railway URL is correct
- Verify `baseUrl` in Convertor matches Railway URL
- Check Railway logs for errors
