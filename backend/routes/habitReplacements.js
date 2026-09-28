const express = require('express');
const router  = express.Router();
const { getPairs, createPair, deletePair } = require('../controllers/habitReplacementController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/',      getPairs);
router.post('/',     createPair);
router.delete('/:id', deletePair);

module.exports = router;