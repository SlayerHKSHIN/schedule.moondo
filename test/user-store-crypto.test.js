const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const usersFile = path.join(__dirname, '..', 'data', 'users.json');

test('stores OAuth tokens encrypted and restores them on Node.js 22+', (t) => {
  const usersFileExisted = fs.existsSync(usersFile);
  const originalUsersFile = usersFileExisted ? fs.readFileSync(usersFile) : null;

  t.after(() => {
    if (usersFileExisted) {
      fs.writeFileSync(usersFile, originalUsersFile);
    } else if (fs.existsSync(usersFile)) {
      fs.unlinkSync(usersFile);
    }
  });

  process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  const userStore = require('../utils/userStore');
  const googleId = 'oauth-encryption-test-user';
  const refreshToken = 'refresh-token-plaintext';
  const accessToken = 'access-token-plaintext';

  userStore.saveUser({ googleId, refreshToken, accessToken });

  const storedFile = fs.readFileSync(usersFile, 'utf8');
  assert.equal(storedFile.includes(refreshToken), false);
  assert.equal(storedFile.includes(accessToken), false);

  const storedUser = userStore.getUser(googleId);
  assert.equal(storedUser.refreshToken, refreshToken);
  assert.equal(storedUser.accessToken, accessToken);
});
