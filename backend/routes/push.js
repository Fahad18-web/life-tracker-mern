const express = require('express');
const router = express.Router();
const {
  getVapidPublic,
  subscribe,
  unsubscribe
} = require('../controllers/pushController');
const { protect } = require('../middleware/auth');

router.get('/vapid-public-key', getVapidPublic);
router.post('/subscribe', protect, subscribe);
router.delete('/subscribe', protect, unsubscribe);

module.exports = router;