const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const UserController = require('../controllers/userController');

// MikroTik Auth Routes
router.get('/hotspot/login', AuthController.login);
router.post('/hotspot/update', AuthController.update);
router.post('/hotspot/logout', AuthController.logout);

// Admin User Management Routes (Should be protected by API Key)
const adminAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === process.env.API_KEY) {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized' });
  }
};

router.post('/users', adminAuth, UserController.create);
router.get('/users', adminAuth, UserController.list);
router.get('/users/:username', adminAuth, UserController.get);
router.put('/users/:username', adminAuth, UserController.update);
router.delete('/users/:username', adminAuth, UserController.delete);
router.get('/sessions/active', adminAuth, UserController.getActiveSessions);

module.exports = router;
