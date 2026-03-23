let tasks = [];
let nextId = 1;

function obtenerTodas() {
  return [...tasks];
}

function crearTarea(data) {
  const nuevaTarea = {
    id: nextId++,
    title: data.title.trim(),
    category: data.category || 'Personal',
    priority: data.priority || 'Media',
    done: Boolean(data.done ?? false),
  };

  tasks.unshift(nuevaTarea);
  return nuevaTarea;
}

function actualizarTareaParcial(id, changes) {
  const numericId = Number(id);
  const index = tasks.findIndex((task) => task.id === numericId);

  if (index === -1) {
    throw new Error('NOT_FOUND');
  }

  const updatedTask = {
    ...tasks[index],
    ...changes,
  };

  tasks[index] = updatedTask;
  return updatedTask;
}

function eliminarTarea(id) {
  const numericId = Number(id);
  const index = tasks.findIndex((task) => task.id === numericId);

  if (index === -1) {
    throw new Error('NOT_FOUND');
  }

  tasks.splice(index, 1);
}

module.exports = {
  obtenerTodas,
  crearTarea,
  actualizarTareaParcial,
  eliminarTarea,
};