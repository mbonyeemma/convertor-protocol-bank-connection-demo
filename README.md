# Bank Demo - Convertor Integration

A **reference implementation** of a bank that integrates with the Convertor protocol. This demonstrates how banks implement the 7 required endpoints and can be deployed/replicated.

## What This Does

- ✅ Implements all **7 Convertor bank endpoints** (connection-request, auth-challenge-response, account-balance, debit-request, credit-request, transaction-status, reversal-request)
- ✅ Verifies **Convertor's signatures** on all incoming requests
- ✅ Signs all responses with **bank's Ed25519 private key**
- ✅ Simple **admin UI** to register users (like "Emma"), create accounts, view transactions
- ✅ Can be **deployed anywhere** and replicated

## Quick Start

### Local Development

1. **Generate Bank Keys**
   ```bash
   cd bank-demo
   node scripts/generate-keys.js
   # Creates keys/bank_private.pem and keys/bank_public.pem
   ```

2. **Get Convertor's Public Key**
   Copy Convertor's operational public key to `keys/convertor_public.pem`

3. **Configure**
   ```bash
   cp .env.example .env
   # Edit .env: BANK_CODE, BANK_NAME, DB credentials
   ```

4. **Setup Database**
   ```bash
   # Option A: Docker (includes MySQL)
   docker compose up -d
   
   # Option B: Local MySQL
   mysql -u root -e "CREATE DATABASE IF NOT EXISTS bankdemo;"
   ```

5. **Run**
   ```bash
   npm install
   npm run dev
   # Visit http://localhost:5000
   ```

### Railway Deployment

See **[RAILWAY.md](./RAILWAY.md)** for complete Railway deployment guide.

**Quick steps:**
1. Push to GitHub/GitLab
2. Create Railway project → Connect repo
3. Add MySQL service (Railway provides DB env vars)
4. Set Railway secrets: `BANK_PRIVATE_KEY`, `CONVERTOR_PUBLIC_KEY`
5. Set variables: `BANK_CODE`, `BANK_NAME`, `NODE_ENV=production`
6. Deploy → Railway builds from Dockerfile automatically

## Using the Admin UI

1. **Create Account**: Register a user (e.g., userId: `emma`, userName: `Emma Wilson`, accountNumber: `ACC001`)
2. **View Accounts**: See all accounts and balances
3. **View Transactions**: See incoming Convertor requests (LOCK, DEBIT, CREDIT, REVERSAL)

## Bank Endpoints (for Convertor)

All endpoints require **signed requests** from Convertor:

- `POST /api/connection-request` - User connects account
- `POST /api/auth-challenge-response` - User completes OTP, returns token
- `GET /api/account-balance` - Returns balance
- `POST /api/debit-request` - Lock then debit funds
- `POST /api/credit-request` - Credit beneficiary
- `POST /api/transaction-status` - Query by reference ID
- `POST /api/reversal-request` - Reverse a debit

## Admin Endpoints

- `GET /admin/accounts` - List accounts
- `POST /admin/accounts` - Create account
- `GET /admin/transactions` - List transactions

## Docker

```bash
docker build -t bank-demo .
docker run -p 5000:5000 \
  -e BANK_CODE=DEMO \
  -e BANK_NAME="Demo Bank" \
  -v $(pwd)/keys:/app/keys \
  bank-demo
```

## Replicating

To deploy this as a different bank:

1. **Change** `BANK_CODE` and `BANK_NAME` in `.env`
2. **Generate new keys** (each bank has its own Ed25519 keypair)
3. **Submit public key** to Convertor Back Office (`POST /admin/banks` with `publicKeyPem`)
4. **Set** `baseUrl` in Convertor (where this bank is deployed, e.g. `https://bank-demo.example.com`)
5. **Deploy** anywhere (same code, different config)

## Testing with Convertor

1. Start Convertor protocol API (`convetor/protocol`)
2. Start this bank demo (`bank-demo`)
3. Register bank in Convertor Back Office with this bank's public key and baseUrl
4. Create accounts in bank demo UI
5. Initiate transfers from Convertor client → bank demo processes them
