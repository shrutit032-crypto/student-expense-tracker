const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/categories', authMiddleware, expenseController.getCategories);
router.post('/', authMiddleware, expenseController.addExpense);
router.get('/', authMiddleware, expenseController.getExpenses);
router.put('/:id', authMiddleware, expenseController.updateExpense);
router.delete('/:id', authMiddleware, expenseController.deleteExpense);

module.exports = router;
