const express = require('express');
const router  = express.Router();
const { getEntries, getEntryByDate, saveEntry, deleteEntry } = require('../controllers/entriesController');
const { protect } = require('../middleware/auth');

router.use(protect);  // All entry routes require auth

router.get('/',       getEntries);
router.get('/:date',  getEntryByDate);
router.post('/',      saveEntry);
router.delete('/:id', deleteEntry);

module.exports = router;
