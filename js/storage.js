// =====================================================
// STORAGE (TaskFlow)
// =====================================================
// Sobrescribe funciones existentes moviendolas a un módulo real.

/**
 * Persiste el array `tasks` en `localStorage` y actualiza el puente `window.tasks`.
 * @returns {void}
 */
function saveTasks() {
  writeStorage(LS_KEY, tasks);
  syncGlobalTasks();
}

/**
 * Carga `tasks` desde `localStorage` (con soporte de demo inicial) y ajusta `nextId`.
 * @returns {void}
 */
function loadTasks() {
  const rawTasks = localStorage.getItem(LS_KEY);

  if (rawTasks === null) {
    tasks = USE_DEMO_TASKS_ON_FIRST_LOAD ? [...demoTasks] : [];
  } else {
    tasks = readStorage(LS_KEY, USE_DEMO_TASKS_ON_FIRST_LOAD ? [...demoTasks] : []);
    if (!Array.isArray(tasks)) {
      tasks = USE_DEMO_TASKS_ON_FIRST_LOAD ? [...demoTasks] : [];
    }
  }

  saveTasks();
  nextId = tasks.length ? Math.max(...tasks.map((task) => task.id)) + 1 : 1;
}

/**
 * Persiste `categories` en `localStorage`.
 * @returns {void}
 */
function saveCategories() {
  writeStorage(LS_CATEGORIES_KEY, categories);
}

/**
 * Carga y normaliza categorías desde `localStorage`, fusionando las categorías por defecto
 * y las categorías presentes en las tareas.
 * @returns {void}
 */
function loadCategories() {
  const savedCategories = readStorage(LS_CATEGORIES_KEY, []);
  const merged = [
    ...DEFAULT_CATEGORIES,
    ...(Array.isArray(savedCategories) ? savedCategories : []),
    ...tasks.map((task) => task.category)
  ];

  const seen = new Set();

  categories = merged
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item) => {
      const key = getCategoryKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  saveCategories();
}

/**
 * Persiste el modo de layout (`list`/`grid`).
 * @returns {void}
 */
function saveLayoutMode() {
  localStorage.setItem(LS_LAYOUT_KEY, isListLayout ? 'list' : 'grid');
}

/**
 * Carga el modo de layout desde `localStorage`.
 * @returns {void}
 */
function loadLayoutMode() {
  isListLayout = localStorage.getItem(LS_LAYOUT_KEY) === 'list';
}

/**
 * Persiste el estado de filtros en `localStorage`.
 * @returns {void}
 */
function saveFiltersState() {
  writeStorage(LS_FILTERS_STATE_KEY, filtersState);
}

/**
 * Carga filtros desde `localStorage`, valida valores permitidos y aplica los filtros al DOM.
 * @returns {void}
 */
function loadFiltersState() {
  const saved = readStorage(LS_FILTERS_STATE_KEY, {});
  const allowedStatus = ['all', 'pending', 'done'];

  filtersState = {
    status: allowedStatus.includes(saved.status) ? saved.status : 'all',
    priorities: Array.isArray(saved.priorities) ? saved.priorities : [],
    categories: Array.isArray(saved.categories) ? saved.categories : [],
    search: String(saved.search || '')
  };

  applyFiltersToDOM();
}

