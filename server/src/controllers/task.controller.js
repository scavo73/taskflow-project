const taskService = require('../services/task.service');

const ALLOWED_PRIORITIES = ['Alta', 'Media', 'Baja'];

function isValidId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0;
}

function getCleanString(value) {
  return String(value ?? '').trim();
}

function getValidatedPriority(value) {
  const priority = getCleanString(value);
  return ALLOWED_PRIORITIES.includes(priority) ? priority : null;
}

function getAllTasks(req, res, next) {
  try {
    const tasks = taskService.obtenerTodas();
    return res.status(200).json(tasks);
  } catch (error) {
    return next(error);
  }
}

function createTask(req, res, next) {
  try {
    const title = getCleanString(req.body.title);
    const category = getCleanString(req.body.category);
    const priority = getValidatedPriority(req.body.priority);
    const done = req.body.done;

    if (title.length < 3) {
      return res.status(400).json({
        error: 'El título es obligatorio y debe tener al menos 3 caracteres.',
      });
    }

    if (!category) {
      return res.status(400).json({
        error: 'La categoría es obligatoria.',
      });
    }

    if (!priority) {
      return res.status(400).json({
        error: 'La prioridad debe ser Alta, Media o Baja.',
      });
    }

    if (done !== undefined && typeof done !== 'boolean') {
      return res.status(400).json({
        error: 'El campo done debe ser boolean.',
      });
    }

    const nuevaTarea = taskService.crearTarea({
      title,
      category,
      priority,
      done: done ?? false,
    });

    return res.status(201).json(nuevaTarea);
  } catch (error) {
    return next(error);
  }
}

function patchTask(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        error: 'El id debe ser un entero positivo.',
      });
    }

    const updates = {};
    const body = req.body ?? {};

    if (Object.keys(body).length === 0) {
      return res.status(400).json({
        error: 'Debes enviar al menos un campo para actualizar.',
      });
    }

    if (body.title !== undefined) {
      const title = getCleanString(body.title);

      if (title.length < 3) {
        return res.status(400).json({
          error: 'El título debe tener al menos 3 caracteres.',
        });
      }

      updates.title = title;
    }

    if (body.category !== undefined) {
      const category = getCleanString(body.category);

      if (!category) {
        return res.status(400).json({
          error: 'La categoría no puede estar vacía.',
        });
      }

      updates.category = category;
    }

    if (body.priority !== undefined) {
      const priority = getValidatedPriority(body.priority);

      if (!priority) {
        return res.status(400).json({
          error: 'La prioridad debe ser Alta, Media o Baja.',
        });
      }

      updates.priority = priority;
    }

    if (body.done !== undefined) {
      if (typeof body.done !== 'boolean') {
        return res.status(400).json({
          error: 'El campo done debe ser boolean.',
        });
      }

      updates.done = body.done;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No hay campos válidos para actualizar.',
      });
    }

    const updatedTask = taskService.actualizarTareaParcial(id, updates);
    return res.status(200).json(updatedTask);
  } catch (error) {
    return next(error);
  }
}

function deleteTask(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        error: 'El id debe ser un entero positivo.',
      });
    }

    taskService.eliminarTarea(id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAllTasks,
  createTask,
  patchTask,
  deleteTask,
};