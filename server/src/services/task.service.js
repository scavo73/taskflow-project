let tasks = [];
let nextId = 1;

const DEMO_TASKS = [
  { title: 'Comprar pan', category: 'Personal', priority: 'Media', done: false },
  { title: 'Estudiar JavaScript', category: 'Estudio', priority: 'Alta', done: false },
  { title: 'Ir al gimnasio', category: 'Salud', priority: 'Baja', done: true },
  { title: 'Enviar propuesta al cliente', category: 'Trabajo', priority: 'Alta', done: false },
  { title: 'Preparar apuntes de CSS', category: 'Estudio', priority: 'Media', done: true },
  { title: 'Pedir cita médica', category: 'Salud', priority: 'Alta', done: false }
];

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

function cargarDemoTareas() {
  tasks = DEMO_TASKS.map((task, index) => ({
    id: index + 1,
    title: task.title,
    category: task.category,
    priority: task.priority,
    done: task.done,
    position: index + 1
  }));

  nextId = tasks.length + 1;
  return obtenerTodas();
}

module.exports = {
  obtenerTodas,
  crearTarea,
  actualizarTareaParcial,
  eliminarTarea,
  reordenarTareas,
  cargarDemoTareas
};