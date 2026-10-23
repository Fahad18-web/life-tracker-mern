const express = require('express');
const router = express.Router();
const { getRitual, upsertRitual } = require('../controllers/ritualController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/:date', getRitual);
router.put('/:date', upsertRitual);

module.exports = router;