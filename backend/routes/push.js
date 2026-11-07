const express = require('express');
const router = express.Router();
const {
  getVapidPublic,
  subscribe,
  unsubscribe,
  sendTest
} = require('../controllers/pushController');
const { protect } = require('../middleware/auth');

router.get('/vapid-public-key', getVapidPublic);
router.post('/subscribe', protect, subscribe);
router.post('/test', protect, sendTest);
router.delete('/subscribe', protect, unsubscribe);

module.exports = router;