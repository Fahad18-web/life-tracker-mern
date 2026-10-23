const express = require('express');
const router = express.Router();
const {
  getFocus,
  setFocus,
  toggleFocusItem
} = require('../controllers/focusController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/:date', getFocus);
router.put('/:date', setFocus);
router.patch('/:date/items/:itemId', toggleFocusItem);

module.exports = router;