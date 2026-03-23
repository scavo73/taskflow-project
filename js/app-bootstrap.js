// =====================================================
// BOOTSTRAP + HELPERS (TaskFlow)
// =====================================================

// =====================================================
// DOM
// =====================================================
const dom = {
  taskTitle: document.getElementById('taskTitle'),
  taskList: document.getElementById('taskList'),
  taskCategory: document.getElementById('taskCategory'),
  taskPriority: document.getElementById('taskPriority'),
  selectedFiltersList: document.getElementById('selectedFiltersList'),
  taskSearch: document.getElementById('taskSearch'),
  btnClearFilters: document.getElementById('btnClearFilters'),

  btnToggleLayout: document.getElementById('btnToggleLayout'),
  btnCompleteAllTasks: document.getElementById('btnCompleteAllTasks'),
  btnDeleteAllTasks: document.getElementById('btnDeleteAllTasks'),

  taskGrid: document.querySelector('.task-grid'),
  filterPanel: document.querySelector('.filter-panel'),
  taskActions: document.querySelector('.task-actions'),
  statsPanel: document.querySelector('.stats'),
  aside: document.querySelector('aside'),

  taskCount: document.querySelectorAll('.task-count'),
  taskCountPending: document.querySelectorAll('.task-count-pending'),
  taskCountDone: document.querySelectorAll('.task-count-done'),

  priorityInputs: document.querySelectorAll('input[name="priority"]'),

  btnNewCategory: document.getElementById('btnNewCategory'),
  newCategoryEditor: document.getElementById('newCategoryEditor'),
  newCategoryInput: document.getElementById('newCategoryInput'),
  btnSaveNewCategory: document.getElementById('btnSaveNewCategory'),
  btnCancelNewCategory: document.getElementById('btnCancelNewCategory'),
  categoryFiltersGroup: document.getElementById('categoryFiltersGroup'),
  desktopCategoryField: document.getElementById('desktopCategoryField'),
  desktopCategorySelectRow: document.getElementById('desktopCategorySelectRow'),

  priorityField: document.querySelector('#taskPriority')?.closest('.field'),
  submitTaskBtn: document.querySelector('.task-form button[type="submit"]'),
  desktopForm: document.querySelector('.task-form')
};

// =====================================================
// CONFIG
// =====================================================
const LS_KEY = 'taskflow_tasks';
const LS_CATEGORIES_KEY = 'taskflow_categories';
const LS_FILTERS_STATE_KEY = 'taskflow_filters_state';
const LS_LAYOUT_KEY = 'taskflow_layout_mode';
const LS_FORM_PREFS_KEY = 'taskflow_form_prefs';

const DEFAULT_CATEGORIES = ['Trabajo', 'Estudio', 'Personal', 'Salud'];
const USE_DEMO_TASKS_ON_FIRST_LOAD = false;

const demoTasks = [
  { id: 1, title: 'Comprar pan', category: 'Personal', priority: 'Media', done: false },
  { id: 2, title: 'Estudiar JavaScript', category: 'Estudio', priority: 'Alta', done: false },
  { id: 3, title: 'Ir al gimnasio', category: 'Salud', priority: 'Baja', done: true },
  { id: 4, title: 'Enviar propuesta al cliente', category: 'Trabajo', priority: 'Alta', done: false },
  { id: 5, title: 'Preparar apuntes de CSS', category: 'Estudio', priority: 'Media', done: true },
  { id: 6, title: 'Pedir cita médica', category: 'Salud', priority: 'Alta', done: false }
];

// =====================================================
// HELPERS
// =====================================================

function getDefaultFormPrefs() {
  return {
    category: '',
    priority: 'Media',
    titleDraft: ''
  };
}

/**
 * Lee un valor JSON de `localStorage`.
 * @param {string} key
 * @param {any} fallback Valor si no existe la clave o falla la lectura.
 * @returns {any}
 */
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Escribe un valor serializado en `localStorage` (JSON).
 * @param {string} key
 * @param {any} value
 * @returns {void}
 */
function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizePriority(value) {
  const v = String(value || '').toLowerCase().trim();

  if (v === 'alta' || v === 'high') return 'high';
  if (v === 'media' || v === 'med' || v === 'medium') return 'med';
  if (v === 'baja' || v === 'low') return 'low';

  return 'med';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return ch;
    }
  });
}

function setPriorityLabel(value) {
  const normalized = normalizePriority(value);
  if (normalized === 'high') return 'Alta';
  if (normalized === 'low') return 'Baja';
  return 'Media';
}

function getCategoryKey(label) {
  return normalizeText(label);
}

function getCategoryInputs() {
  return [...document.querySelectorAll('input[name="cat"]')];
}

function getCategoryLabel(categoryKey) {
  return categories.find((label) => getCategoryKey(label) === categoryKey) || categoryKey;
}

function getCategoryInputEl(container, categoryKey) {
  return (
    [...container.querySelectorAll('[data-category-input]')].find(
      (el) => el.dataset.categoryInput === String(categoryKey)
    ) || null
  );
}

function categoryExists(label, excludeKey = '') {
  const nextKey = getCategoryKey(label);

  return categories.some((item) => {
    const itemKey = getCategoryKey(item);
    if (excludeKey && itemKey === excludeKey) return false;
    return itemKey === nextKey;
  });
}

function getStatusLinks() {
  return [...document.querySelectorAll('[data-status-nav]')];
}

function getStatusFromDOM() {
  return document.querySelector('[data-status-nav].is-active')?.dataset.statusValue || 'all';
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function syncGlobalTasks() {
  window.tasks = tasks;
}

function showFieldError(message, input) {
  alert(message);
  input?.focus();
  input?.select?.();
}

function isDefaultTaskView() {
  return (
    filtersState.status === 'all' &&
    filtersState.priorities.length === 0 &&
    filtersState.categories.length === 0 &&
    filtersState.search === ''
  );
}

// =====================================================
// STORAGE COMMIT
// =====================================================
/**
 * Orquesta una acción atómica del dominio: persiste (tasks/categories/filters/layout) y opcionalmente refresca categorías/UI.
 * @param {object} param0
 * @returns {void}
 */
function commit({
  saveTasks: shouldSaveTasks = false,
  saveCategories: shouldSaveCategories = false,
  saveFilters: shouldSaveFilters = false,
  saveLayout: shouldSaveLayout = false,
  renderCategories: shouldRenderCategories = false,
  render = true
} = {}) {
  if (shouldSaveTasks) saveTasks();
  if (shouldSaveCategories) saveCategories();
  if (shouldSaveFilters) saveFiltersState();
  if (shouldSaveLayout) saveLayoutMode();
  if (shouldRenderCategories) refreshCategoriesUI();
  if (render) refreshUI();
}

// =====================================================
// UI ORCHESTRATION
// =====================================================
/**
 * Renderiza toda la UI actual (vacío/no-results/lista + botones + stats) y ajusta drag&drop si aplica.
 * @returns {void}
 */
function refreshUI() {
  renderEmptyLayoutVisibility();
  renderTasksList();
  renderActionButtons();
  renderStats();
  refreshIcons();

  if (sortableTasks) {
    sortableTasks.option('disabled', editingTaskId !== null || tasks.length === 0);
  }
}

// =====================================================
// INIT
// =====================================================
/**
 * Bootstrap principal: carga estado desde storage, engancha listeners y pinta la UI inicial.
 * @returns {void}
 */

async function hydrateTasksFromApi() {
  const api = window.TaskFlowApi;

  if (!api || typeof api.fetchTasksFromApi !== 'function') {
    throw new Error('API client no disponible');
  }

  const remoteTasks = await api.fetchTasksFromApi();

  tasks = Array.isArray(remoteTasks) ? remoteTasks : [];
  syncGlobalTasks();
  nextId = tasks.length ? Math.max(...tasks.map((task) => Number(task.id) || 0)) + 1 : 1;
}

async function init() {
  try {
    await hydrateTasksFromApi();
  } catch (error) {
    console.error('No se pudieron cargar las tareas desde la API:', error);
    tasks = [];
    syncGlobalTasks();
    nextId = 1;
    alert('No se pudieron cargar las tareas desde el servidor.');
  }

  loadCategories();
  refreshCategoriesUI();
  loadTaskFormPrefs();
  loadFiltersState();

  if (tasks.length === 0) {
    resetFiltersState();
  }

  loadLayoutMode();

  bindDesktopForm();
  bindListEvents();
  bindSearchEvents();
  bindStatusNavEvents();
  bindFilterEvents();
  bindCategoryEvents();
  bindTaskActionEvents();
  bindTaskFormPreferenceEvents();

  refreshUI();
  initTaskSorting();

  if (typeof window.initFiltersDrawer === 'function') {
    window.initFiltersDrawer();
  }
}

// =====================================================
// PUBLIC API
// =====================================================
window.TaskFlowApp = {
  addTaskFromData: (...args) => window.addTaskFromData?.(...args),
  addCategory: (...args) => window.addCategory?.(...args),
  openTaskCreator: (...args) => window.openTaskCreator?.(...args),
  //loadDemoTasks: (...args) => window.loadDemoTasks?.(...args),

  getCategories() {
    return [...categories];
  },

  getDesktopDefaults() {
    return {
      category: dom.taskCategory ? dom.taskCategory.value : categories[0] || 'Personal',
      priority: dom.taskPriority ? dom.taskPriority.value : 'Media'
    };
  },

  getFilteredCountByState({
    status = 'all',
    priorities = [],
    categories: inputCategories = [],
    search = ''
  } = {}) {
    const tempFilters = {
      status,
      priorities,
      categories: inputCategories.map((item) => normalizeText(item)),
      search: normalizeText(search)
    };

    return tasks.filter((task) => taskMatchesFilters(task, tempFilters)).length;
  },

  refreshUI: (...args) => window.refreshUI?.(...args),
  refreshCategoriesUI: (...args) => window.refreshCategoriesUI?.(...args)
};

document.addEventListener('DOMContentLoaded', init);

