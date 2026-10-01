const express = require('express');
const router = express.Router();
const {
  getPairs,
  createPair,
  updatePairRules,
  deletePair
} = require('../controllers/habitReplacementController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getPairs);
router.post('/', createPair);
router.patch('/:id/rules', updatePairRules);
router.delete('/:id', deletePair);

module.exports = router;