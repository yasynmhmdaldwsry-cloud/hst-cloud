const AuthService = require('../services/authService');

class AuthController {
  /**
   * Login endpoint for MikroTik
   * Expected query params: user, password, ip, mac, sessionid
   */
  static async login(req, res) {
    const { user, password, ip, mac, sessionid } = req.query;

    if (!user || !password) {
      return res.status(400).json({ status: 'error', message: 'Missing credentials' });
    }

    try {
      const result = await AuthService.authenticate(user, password);

      if (result.success) {
        await AuthService.startSession(user, sessionid || mac, ip, mac);
        
        // Return success in a format MikroTik can parse if needed, 
        // or just JSON for the middleware/script.
        return res.json({
          status: 'success',
          message: 'Authenticated',
          profile: result.user.profile || 'default',
          speed_limit: result.user.speed_limit || '1M/1M'
        });
      } else {
        return res.status(401).json({
          status: 'error',
          message: result.message
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Status/Update endpoint to sync usage
   */
  static async update(req, res) {
    const { sessionid, upload, download } = req.body;

    if (!sessionid) {
      return res.status(400).json({ status: 'error', message: 'Missing sessionid' });
    }

    try {
      await AuthService.updateSession(sessionid, parseInt(upload), parseInt(download));
      res.json({ status: 'success' });
    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }

  /**
   * Logout endpoint
   */
  static async logout(req, res) {
    const { sessionid } = req.body;

    if (!sessionid) {
      return res.status(400).json({ status: 'error', message: 'Missing sessionid' });
    }

    try {
      await AuthService.endSession(sessionid);
      res.json({ status: 'success' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  }
}

module.exports = AuthController;
