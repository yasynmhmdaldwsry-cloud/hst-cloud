const redis = require('../config/redis');

class UserModel {
  /**
   * Create or update a user
   * @param {string} username 
   * @param {object} userData 
   */
  static async saveUser(username, userData) {
    const key = `user:${username}`;
    await redis.hset(key, userData);
    await redis.sadd('users', username);
  }

  /**
   * Get user by username
   * @param {string} username 
   */
  static async getUser(username) {
    const key = `user:${username}`;
    const user = await redis.hgetall(key);
    return Object.keys(user).length > 0 ? user : null;
  }

  /**
   * Delete user
   * @param {string} username 
   */
  static async deleteUser(username) {
    await redis.del(`user:${username}`);
    await redis.srem('users', username);
  }

  /**
   * List all users
   */
  static async getAllUsers() {
    const usernames = await redis.smembers('users');
    const users = [];
    for (const username of usernames) {
      const user = await this.getUser(username);
      if (user) users.push({ username, ...user });
    }
    return users;
  }
}

module.exports = UserModel;
