#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const keysDir = path.join(__dirname, '../keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.writeFileSync(path.join(keysDir, 'bank_private.pem'), privateKey);
fs.writeFileSync(path.join(keysDir, 'bank_public.pem'), publicKey);

console.log('✅ Bank keys generated!');
console.log(`   Private key: ${path.join(keysDir, 'bank_private.pem')}`);
console.log(`   Public key:  ${path.join(keysDir, 'bank_public.pem')}`);
console.log('\n📋 Next steps:');
console.log('   1. Submit bank_public.pem to Convertor Back Office');
console.log('   2. Copy Convertor\'s public key to keys/convertor_public.pem');
console.log('   3. Set CONVERTOR_PUBLIC_KEY_PATH in .env');
