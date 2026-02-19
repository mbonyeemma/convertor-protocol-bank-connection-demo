# Bank Demo - Environment Variables Setup

## Quick Start

1. **Copy `.env.example` to `.env`:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your values** (see sections below)

3. **Generate bank keys** (if you don't have them):
   ```bash
   npm run generate-keys
   ```

## Required Variables

### 1. Application Settings
```env
NODE_ENV=development
PORT=5001
BANK_CODE=DFC
BANK_NAME=DFC Bank
```

### 2. Database (MySQL)
**Local Development:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=bankdemo
```

**Railway MySQL:**
```env
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=3306
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
```

### 3. Convertor Protocol API
**Production:**
```env
CONVERTOR_API_URL=https://convertor-protocol-production.up.railway.app
```

**Local Development:**
```env
CONVERTOR_API_URL=http://localhost:4000
```

### 4. Bank Private Key (REQUIRED)
**Option A: File Path (Local Dev)**
```env
BANK_PRIVATE_KEY_PATH=./keys/bank_private.pem
```

**Option B: Direct PEM (Railway)**
```env
BANK_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIGTMBAGByqGSM49AgEGBSuBBAAjBHkwdwIBAQQg...
-----END PRIVATE KEY-----
```

### 5. Convertor Public Key (REQUIRED)
**Option A: File Path (Local Dev)**
```env
CONVERTOR_PUBLIC_KEY_PATH=./keys/convertor_public.pem
```

**Option B: Direct PEM (Railway)**
```env
CONVERTOR_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA...
-----END PUBLIC KEY-----
```

## Generating Keys

### Generate Bank Keys
```bash
# Generate private key
openssl genpkey -algorithm Ed25519 -out keys/bank_private.pem

# Extract public key
openssl pkey -in keys/bank_private.pem -pubout -out keys/bank_public.pem
```

Or use the script:
```bash
npm run generate-keys
```

### Get Convertor Public Key
Contact Convertor protocol admin or get it from:
- Protocol documentation
- Admin API endpoint (if available)
- Convertor protocol repository

## Bank Registration Flow

### Step 1: Generate Keys
```bash
npm run generate-keys
```

### Step 2: Register Bank with Protocol
```bash
curl -X POST https://convertor-protocol-production.up.railway.app/api/banks/register \
  -H "Content-Type: application/json" \
  -d '{
    "code": "DFC",
    "name": "DFC Bank",
    "publicKeyPem": "'"$(cat keys/bank_public.pem | tr '\n' '\\n')"'",
    "keyId": "dfc_bank_key_2024",
    "baseUrl": "https://your-bank-demo.up.railway.app"
  }'
```

### Step 3: Admin Activates Bank
(Admin uses admin API to activate)

### Step 4: Bank Updates Webhook (After Activation)
```bash
# Bank signs request and updates webhook URL
# See BANK_REGISTRATION_API.md for signature details
```

## Railway Deployment

For Railway deployment, set these as **secrets**:

### Required Secrets:
- `BANK_PRIVATE_KEY` - Full PEM content (multi-line)
- `CONVERTOR_PUBLIC_KEY` - Full PEM content (multi-line)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - From MySQL service
- `CONVERTOR_API_URL` - Protocol URL

### Example Railway Variables:
```
NODE_ENV=production
PORT=5001
BANK_CODE=DFC
BANK_NAME=DFC Bank
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=3306
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
CONVERTOR_API_URL=https://convertor-protocol-production.up.railway.app
BANK_PRIVATE_KEY=<paste full PEM>
CONVERTOR_PUBLIC_KEY=<paste full PEM>
```

## Verification

After setting up `.env`, verify:

1. **Database connection:**
   ```bash
   npm run create-db  # Creates database if needed
   npm run dev        # Should connect successfully
   ```

2. **Keys are loaded:**
   - Check logs for key loading errors
   - Test signature generation

3. **Protocol connection:**
   - Bank should be able to communicate with protocol
   - Test registration endpoint

## Troubleshooting

**Database connection failed:**
- Verify MySQL is running
- Check DB credentials
- Ensure database exists (`npm run create-db`)

**Key loading failed:**
- Verify key files exist at specified paths
- Or set `BANK_PRIVATE_KEY` / `CONVERTOR_PUBLIC_KEY` directly
- Check PEM format (must include BEGIN/END lines)

**Protocol connection failed:**
- Verify `CONVERTOR_API_URL` is correct
- Check network connectivity
- Verify protocol is running and accessible
