const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');

// router.get('/', (req, res) => {
//     res.status(200).json([]);
//   });
  

router.get('/', taskController.getAllTasks);
router.post('/', taskController.createTask);
router.patch('/:id', taskController.patchTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;