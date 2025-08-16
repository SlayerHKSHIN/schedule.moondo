const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, '../data/users.json');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// Ensure data directory and users file exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({ users: {} }, null, 2));
}

// Simple encryption/decryption for tokens
function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(text) {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// Load users from file
function loadUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading users:', error);
    return { users: {} };
  }
}

// Save users to file
function saveUsers(data) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving users:', error);
    return false;
  }
}

// User management functions
const userStore = {
  // Create or update user
  saveUser(userData) {
    const data = loadUsers();
    const userId = userData.googleId || userData.id;
    
    // Encrypt sensitive data
    if (userData.refreshToken) {
      userData.refreshToken = encrypt(userData.refreshToken);
    }
    if (userData.accessToken) {
      userData.accessToken = encrypt(userData.accessToken);
    }
    
    data.users[userId] = {
      ...data.users[userId],
      ...userData,
      updatedAt: new Date().toISOString()
    };
    
    if (!data.users[userId].createdAt) {
      data.users[userId].createdAt = new Date().toISOString();
    }
    
    return saveUsers(data) ? data.users[userId] : null;
  },
  
  // Get user by ID
  getUser(userId) {
    const data = loadUsers();
    const user = data.users[userId];
    
    if (!user) return null;
    
    // Decrypt sensitive data
    if (user.refreshToken) {
      user.refreshToken = decrypt(user.refreshToken);
    }
    if (user.accessToken) {
      user.accessToken = decrypt(user.accessToken);
    }
    
    return user;
  },
  
  // Get user by email
  getUserByEmail(email) {
    const data = loadUsers();
    const userId = Object.keys(data.users).find(
      id => data.users[id].email === email
    );
    
    if (!userId) return null;
    
    return this.getUser(userId);
  },
  
  // Delete user
  deleteUser(userId) {
    const data = loadUsers();
    delete data.users[userId];
    return saveUsers(data);
  },
  
  // Get all users (without sensitive data)
  getAllUsers() {
    const data = loadUsers();
    const users = {};
    
    for (const userId in data.users) {
      const user = { ...data.users[userId] };
      delete user.refreshToken;
      delete user.accessToken;
      users[userId] = user;
    }
    
    return users;
  },
  
  // Update user tokens
  updateTokens(userId, tokens) {
    const user = this.getUser(userId);
    if (!user) return null;
    
    return this.saveUser({
      ...user,
      ...tokens,
      tokenUpdatedAt: new Date().toISOString()
    });
  }
};

module.exports = userStore;