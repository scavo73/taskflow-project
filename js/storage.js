// =====================================================
// STORAGE (TaskFlow)
// =====================================================
// Sobrescribe funciones existentes moviendolas a un módulo real.

// saves the tasks to the storage
function saveTasks() {
  writeStorage(LS_KEY, tasks);
  syncGlobalTasks();
}

// loads the tasks from the storage
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

// saves the categories to the storage
function saveCategories() {
  writeStorage(LS_CATEGORIES_KEY, categories);
}

// loads the categories from the storage
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

function saveLayoutMode() {
  localStorage.setItem(LS_LAYOUT_KEY, isListLayout ? 'list' : 'grid');
}

function loadLayoutMode() {
  isListLayout = localStorage.getItem(LS_LAYOUT_KEY) === 'list';
}

function saveFiltersState() {
  writeStorage(LS_FILTERS_STATE_KEY, filtersState);
}

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

