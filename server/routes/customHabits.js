const express = require('express');
const router  = express.Router();
const { getCustomHabits, createCustomHabit, deleteCustomHabit } = require('../controllers/customHabitsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/',     getCustomHabits);
router.post('/',    createCustomHabit);
router.delete('/:id', deleteCustomHabit);

module.exports = router;