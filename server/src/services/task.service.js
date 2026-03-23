let tasks = [];
let nextId = 1;

function sortByPosition(list) {
  return [...list].sort((a, b) => a.position - b.position);
}

function normalizePositions() {
  tasks = sortByPosition(tasks).map((task, index) => ({
    ...task,
    position: index + 1
  }));
}

function obtenerTodas() {
  return sortByPosition(tasks);
}

function crearTarea(data) {
  const currentMaxPosition = tasks.length
    ? Math.max(...tasks.map((task) => Number(task.position) || 0))
    : 0;

  const nuevaTarea = {
    id: nextId++,
    title: data.title,
    category: data.category,
    priority: data.priority,
    done: Boolean(data.done ?? false),
    position: currentMaxPosition + 1
  };

  tasks.push(nuevaTarea);
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
    ...changes
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
  normalizePositions();
}

function reordenarTareas(orderedIds) {
  if (!Array.isArray(orderedIds) || orderedIds.length !== tasks.length) {
    throw new Error('INVALID_ORDER');
  }

  const uniqueIds = new Set(orderedIds);
  if (uniqueIds.size !== orderedIds.length) {
    throw new Error('INVALID_ORDER');
  }

  const currentIds = new Set(tasks.map((task) => task.id));
  const allIdsExist = orderedIds.every((id) => currentIds.has(Number(id)));

  if (!allIdsExist) {
    throw new Error('INVALID_ORDER');
  }

  const taskMap = new Map(tasks.map((task) => [task.id, task]));

  tasks = orderedIds.map((id, index) => ({
    ...taskMap.get(Number(id)),
    position: index + 1
  }));

  return obtenerTodas();
}

module.exports = {
  obtenerTodas,
  crearTarea,
  actualizarTareaParcial,
  eliminarTarea,
  reordenarTareas
};