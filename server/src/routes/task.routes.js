const express = require('express');
const taskController = require('../controllers/task.controller');

const router = express.Router();

router.get('/', taskController.getAllTasks);
router.post('/', taskController.createTask);
router.post('/seed-demo', taskController.seedDemoTasks);
router.patch('/reorder', taskController.reorderTasks);
router.patch('/:id', taskController.patchTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;