const UserModel = require('../models/userModel');

class UserController {
  static async create(req, res) {
    const { username, password, profile, data_limit, time_limit, device_limit, speed_limit, expiry_date } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
      const existing = await UserModel.getUser(username);
      if (existing) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const userData = {
        password,
        profile: profile || 'default',
        data_limit: data_limit || 0, // 0 = unlimited
        time_limit: time_limit || 0, // 0 = unlimited
        device_limit: device_limit || 1,
        speed_limit: speed_limit || '1M/1M',
        expiry_date: expiry_date || '',
        used_data: 0,
        used_time: 0,
        status: 'active',
        created_at: new Date().toISOString()
      };

      await UserModel.saveUser(username, userData);
      res.status(201).json({ message: 'User created successfully', user: { username, ...userData } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async get(req, res) {
    try {
      const user = await UserModel.getUser(req.params.username);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ username: req.params.username, ...user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    const { username } = req.params;
    try {
      const user = await UserModel.getUser(username);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const updatedData = { ...user, ...req.body };
      await UserModel.saveUser(username, updatedData);
      res.json({ message: 'User updated successfully', user: { username, ...updatedData } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      await UserModel.deleteUser(req.params.username);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async list(req, res) {
    try {
      const users = await UserModel.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getActiveSessions(req, res) {
    try {
      const redis = require('../config/redis');
      const sessionIds = await redis.smembers('active_sessions');
      const sessions = [];
      for (const id of sessionIds) {
        const session = await redis.hgetall(`session:${id}`);
        if (Object.keys(session).length > 0) {
          sessions.push({ sessionId: id, ...session });
        }
      }
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = UserController;
