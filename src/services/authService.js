const UserModel = require('../models/userModel');
const redis = require('../config/redis');

class AuthService {
  /**
   * Authenticate user and check limits
   * @param {string} username 
   * @param {string} password 
   */
  static async authenticate(username, password) {
    const user = await UserModel.getUser(username);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Invalid password' };
    }

    if (user.status === 'disabled') {
      return { success: false, message: 'Account disabled' };
    }

    // Check expiration date
    if (user.expiry_date && new Date(user.expiry_date) < new Date()) {
      return { success: false, message: 'Account expired' };
    }

    // Check data limit
    if (user.data_limit && parseInt(user.used_data) >= parseInt(user.data_limit)) {
      return { success: false, message: 'Data limit reached' };
    }

    // Check time limit
    if (user.time_limit && parseInt(user.used_time) >= parseInt(user.time_limit)) {
      return { success: false, message: 'Time limit reached' };
    }

    // Check device limit (simultaneous sessions)
    const activeSessions = await redis.scard(`user_sessions:${username}`);
    if (user.device_limit && activeSessions >= parseInt(user.device_limit)) {
      return { success: false, message: 'Maximum device limit reached' };
    }

    return { success: true, user };
  }

  /**
   * Start a session
   */
  static async startSession(username, sessionId, ip, mac) {
    const sessionKey = `session:${sessionId}`;
    const sessionData = {
      username,
      ip,
      mac,
      startTime: Date.now(),
      lastUpdate: Date.now(),
      upload: 0,
      download: 0
    };

    await redis.hset(sessionKey, sessionData);
    await redis.sadd(`user_sessions:${username}`, sessionId);
    await redis.sadd('active_sessions', sessionId);
    
    return sessionData;
  }

  /**
   * Update session data usage
   */
  static async updateSession(sessionId, upload, download) {
    const sessionKey = `session:${sessionId}`;
    const session = await redis.hgetall(sessionKey);
    
    if (Object.keys(session).length === 0) return null;

    const diffUpload = upload - (parseInt(session.upload) || 0);
    const diffDownload = download - (parseInt(session.download) || 0);
    const now = Date.now();
    const diffTime = Math.floor((now - parseInt(session.lastUpdate)) / 1000);

    await redis.hset(sessionKey, {
      upload,
      download,
      lastUpdate: now
    });

    // Update user's total usage
    const username = session.username;
    await redis.hincrby(`user:${username}`, 'used_data', diffUpload + diffDownload);
    await redis.hincrby(`user:${username}`, 'used_time', diffTime);

    return { username, diffUpload, diffDownload, diffTime };
  }

  /**
   * End a session
   */
  static async endSession(sessionId) {
    const sessionKey = `session:${sessionId}`;
    const session = await redis.hgetall(sessionKey);
    
    if (Object.keys(session).length > 0) {
      await redis.srem(`user_sessions:${session.username}`, sessionId);
    }
    
    await redis.del(sessionKey);
    await redis.srem('active_sessions', sessionId);
  }
}

module.exports = AuthService;
