const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, budgetController.setBudget);
router.get('/', authMiddleware, budgetController.getBudgets);
router.delete('/:id', authMiddleware, budgetController.deleteBudget);

module.exports = router;
