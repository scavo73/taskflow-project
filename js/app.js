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
// STATE
// =====================================================


let tasks = [];
let nextId = 1;
let isListLayout = false;
let editingTaskId = null;
let categories = [];
let editingCategoryKey = null;
let sortableTasks = null;
let filtersState = getDefaultFiltersState();

// =====================================================
// HELPERS
// =====================================================

// gets the default filters state
function getDefaultFiltersState() {
  return {
    status: 'all',
    priorities: [],
    categories: [],
    search: ''
  };
}

// gets the default form preferences
function getDefaultFormPrefs() {
  return {
    category: '',
    priority: 'Media'
  };
}

// reads a value from localStorage
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// writes a value to localStorage
function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// normalizes text
function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// normalizes priority
function normalizePriority(value) {
  const v = String(value || '').toLowerCase().trim();

  if (v === 'alta' || v === 'high') return 'high';
  if (v === 'media' || v === 'med' || v === 'medium') return 'med';
  if (v === 'baja' || v === 'low') return 'low';

  return 'med';
}

// Escapes untrusted user-provided data before interpolating into HTML templates.
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

// converts a priority value to a label
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

// returns the category input element for a given category key
function getCategoryInputEl(container, categoryKey) {
  return (
    [...container.querySelectorAll('[data-category-input]')].find(
      (el) => el.dataset.categoryInput === String(categoryKey)
    ) || null
  );
}

// checks if a category exists
function categoryExists(label, excludeKey = '') {
  const nextKey = getCategoryKey(label);

  return categories.some((item) => {
    const itemKey = getCategoryKey(item);
    if (excludeKey && itemKey === excludeKey) return false;
    return itemKey === nextKey;
  });
}

// gets the status links
function getStatusLinks() {
  return [...document.querySelectorAll('[data-status-nav]')];
}

// gets the active status from the DOM
function getStatusFromDOM() {
  return document.querySelector('[data-status-nav].is-active')?.dataset.statusValue || 'all';
}

// refreshes the icons
function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
  
// syncs the global tasks
function syncGlobalTasks() {
  window.tasks = tasks;
}

function showFieldError(message, input) {
  alert(message);
  input?.focus();
  input?.select?.();
}

// checks if the default task view is active, meaning no filters are applied
function isDefaultTaskView() {
  return (
    filtersState.status === 'all' &&
    filtersState.priorities.length === 0 &&
    filtersState.categories.length === 0 &&
    filtersState.search === ''
  );
}

// saves the task form preferences
function saveTaskFormPrefs() {
  writeStorage(LS_FORM_PREFS_KEY, {
    category: dom.taskCategory?.value || categories[0] || 'Personal',
    priority: dom.taskPriority?.value || 'Media'
  });
}

// loads the task form preferences, if no preferences are found, uses the default preferences
function loadTaskFormPrefs() {
  const saved = readStorage(LS_FORM_PREFS_KEY, getDefaultFormPrefs());
  const savedCategory = String(saved.category || '').trim();
  const savedPriority = String(saved.priority || '').trim();
  const allowedPriorities = ['Alta', 'Media', 'Baja'];

  if (dom.taskCategory) {
    const fallbackCategory = categories[0] || 'Personal';
    dom.taskCategory.value = categories.includes(savedCategory)
      ? savedCategory
      : fallbackCategory;
  }

  if (dom.taskPriority) {
    dom.taskPriority.value = allowedPriorities.includes(savedPriority)
      ? savedPriority
      : 'Media';
  }

  saveTaskFormPrefs();
}

// commits the changes to the storage
// saves the tasks, categories, filters, layout, renders the categories and refreshes the UI
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
// STORAGE
// =====================================================

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

// =====================================================
// FILTER STATE <-> DOM
// =====================================================

// resets the filters state
// saves the filters state to the storage
// applies the filters to the DOM
function resetFiltersState({ persist = true, preserveStatus = false } = {}) {
  const nextStatus = preserveStatus ? filtersState.status : 'all';

  filtersState = getDefaultFiltersState();
  filtersState.status = nextStatus;

  if (persist) {
    saveFiltersState();
  }

  applyFiltersToDOM();
}

// gets the filters from the DOM
function getFiltersFromDOM() {
  return {
    status: getStatusFromDOM(),
    priorities: [...dom.priorityInputs]
      .filter((input) => input.checked)
      .map((input) => input.value),
    categories: getCategoryInputs()
      .filter((input) => input.checked)
      .map((input) => normalizeText(input.value)),
    search: normalizeText(dom.taskSearch?.value || '')
  };
}

// applies the filters to the DOM
function applyFiltersToDOM() {
  getStatusLinks().forEach((link) => {
    const isActive = link.dataset.statusValue === filtersState.status;
    link.classList.toggle('is-active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  dom.priorityInputs.forEach((input) => {
    input.checked = filtersState.priorities.includes(input.value);
  });

  getCategoryInputs().forEach((input) => {
    input.checked = filtersState.categories.includes(normalizeText(input.value));
  });

  if (dom.taskSearch) {
    dom.taskSearch.value = filtersState.search || '';
  }
}

// syncs the filters state
function syncFiltersState() {
  filtersState = getFiltersFromDOM();
  saveFiltersState();
}

// =====================================================
// FILTER LOGIC
// =====================================================

// checks if there are active filters
function hasActiveFilters() {
  return (
    filtersState.priorities.length > 0 ||
    filtersState.categories.length > 0 ||
    filtersState.search !== ''
  );
}

// checks if there is an active task view
function hasActiveTaskView() {
  return filtersState.status !== 'all' || hasActiveFilters();
}

// clears all filters
function clearAllFilters() {
  resetFiltersState({ preserveStatus: true });
  refreshUI();
}

// checks if a task matches the filters
function taskMatchesFilters(task, filters) {
  const taskCategoryKey = normalizeText(task.category);
  const taskPriorityKey = normalizePriority(task.priority);
  const taskSearchText = normalizeText(`${task.title} ${task.category}`);

  const matchesStatus =
    filters.status === 'all' ||
    (filters.status === 'pending' && !task.done) ||
    (filters.status === 'done' && task.done);

  const matchesPriority =
    filters.priorities.length === 0 ||
    filters.priorities.includes(taskPriorityKey);

  const matchesCategory =
    filters.categories.length === 0 ||
    filters.categories.includes(taskCategoryKey);

  const matchesSearch =
    filters.search === '' ||
    taskSearchText.includes(filters.search);

  return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
}

// gets the filtered tasks
function getFilteredTasks() {
  return tasks.filter((task) => taskMatchesFilters(task, filtersState));
}

// =====================================================
// TASKS
// =====================================================

// creates a task data
function createTaskData({ title, category, priority }) {
  return {
    id: nextId++,
    title: String(title || '').trim(),
    category: String(category || categories[0] || 'Personal').trim(),
    priority: priority || 'Media',
    done: false
  };
}

// gets a task by its ID
function getTaskById(taskId) {
  return tasks.find((task) => task.id === taskId);
}

// adds a task from data
function addTaskFromData({ title, category, priority }) {
  const cleanTitle = String(title || '').trim();

  if (!cleanTitle) {
    return { ok: false, error: 'Título vacío' };
  }

  const task = createTaskData({
    title: cleanTitle,
    category,
    priority
  });

  tasks.unshift(task);
  commit({ saveTasks: true });

  return { ok: true, task };
}

// adds a task from the desktop form
function addTaskFromDesktopForm() {
  if (!dom.taskTitle) return;

  const result = addTaskFromData({
    title: dom.taskTitle.value,
    category: dom.taskCategory ? dom.taskCategory.value : categories[0] || 'Personal',
    priority: dom.taskPriority ? dom.taskPriority.value : 'Media'
  });

  if (!result.ok) {
    showFieldError('Por favor, ingresa un título para la tarea.', dom.taskTitle);
    return;
  }

  dom.taskTitle.value = '';
  saveTaskFormPrefs();
}

// starts a task edit
function startTaskEdit(taskId) {
  if (!getTaskById(taskId)) return;
  editingTaskId = taskId;
  refreshUI();
}

// cancels a task edit
function cancelTaskEdit() {
  if (editingTaskId === null) return;
  editingTaskId = null;
  refreshUI();
}

// updates a task title
function updateTaskTitle(taskId, rawTitle) {
  const task = getTaskById(taskId);
  if (!task) {
    return { ok: false, error: 'Tarea no encontrada' };
  }

  const cleanTitle = String(rawTitle || '').trim();

  if (!cleanTitle) {
    return { ok: false, error: 'Título vacío' };
  }

  task.title = cleanTitle;
  editingTaskId = null;
  commit({ saveTasks: true });

  return { ok: true, task };
}

// removes a task
function removeTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);

  if (editingTaskId === taskId) {
    editingTaskId = null;
  }

  saveTasks();

  if (tasks.length === 0) {
    resetFiltersState();
  }

  refreshUI();
}

// toggles a task
function toggleTask(taskId, isDone) {
  const task = getTaskById(taskId);
  if (!task) return;

  task.done = isDone;
  commit({ saveTasks: true });
}

// toggles the layout mode
function toggleLayoutMode() {
  isListLayout = !isListLayout;
  commit({ saveLayout: true });
}

// completes visible tasks
function completeVisibleTasks() {
  const visibleTasks = getFilteredTasks();

  if (visibleTasks.length === 0) return;

  const pendingVisibleTasks = visibleTasks.filter((task) => !task.done);
  const doneVisibleTasks = visibleTasks.filter((task) => task.done);
  const allVisibleCompleted = pendingVisibleTasks.length === 0;

  const affectedTasks = allVisibleCompleted ? doneVisibleTasks : pendingVisibleTasks;
  const affectedIds = new Set(affectedTasks.map((task) => task.id));
  const affectedCount = affectedTasks.length;

  if (affectedCount === 0) return;

  const message = allVisibleCompleted
    ? `¿Seguro que quieres desmarcar ${affectedCount} ${affectedCount === 1 ? 'tarea visible completada' : 'tareas visibles completadas'}?`
    : `¿Seguro que quieres completar ${affectedCount} ${affectedCount === 1 ? 'tarea visible pendiente' : 'tareas visibles pendientes'}?`;

  const userConfirmed = confirm(message);
  if (!userConfirmed) return;

  tasks = tasks.map((task) => {
    if (!affectedIds.has(task.id)) return task;

    return {
      ...task,
      done: !allVisibleCompleted
    };
  });

  commit({ saveTasks: true });
}

// removes visible tasks
function removeVisibleTasks() {
  const visibleTasks = getFilteredTasks();

  if (visibleTasks.length === 0) return;

  const visibleIds = new Set(visibleTasks.map((task) => task.id));
  const visibleCount = visibleTasks.length;

  const message = isDefaultTaskView()
    ? `¿Seguro que quieres borrar ${visibleCount} ${visibleCount === 1 ? 'tarea' : 'tareas'}? Esta acción no se puede deshacer.`
    : `¿Seguro que quieres borrar ${visibleCount} ${visibleCount === 1 ? 'tarea visible' : 'tareas visibles'}? Esta acción no se puede deshacer.`;

  const userConfirmed = confirm(message);
  if (!userConfirmed) return;

  tasks = tasks.filter((task) => !visibleIds.has(task.id));

  if (editingTaskId !== null && visibleIds.has(editingTaskId)) {
    editingTaskId = null;
  }

  saveTasks();

  if (tasks.length === 0) {
    resetFiltersState();
  }

  refreshUI();
}

// opens the task creator
function openTaskCreator() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const mobileBtn = document.querySelector('.mobile-add-btn');

  if (isMobile && mobileBtn) {
    mobileBtn.click();
    return;
  }

  dom.desktopForm?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });

  dom.taskTitle?.focus();
}

// loads demo tasks
function loadDemoTasks() {
  tasks = demoTasks.map((task) => ({ ...task }));
  editingTaskId = null;
  nextId = tasks.length ? Math.max(...tasks.map((task) => task.id)) + 1 : 1;

  resetFiltersState({ persist: false });
  saveTasks();
  loadCategories();
  refreshCategoriesUI();
  loadTaskFormPrefs();
  saveFiltersState();
  refreshUI();
}

// =====================================================
// CATEGORIES
// =====================================================

// updates the desktop category field mode
function updateDesktopCategoryFieldMode() {
  if (!dom.desktopCategoryField || !dom.desktopCategorySelectRow || !dom.newCategoryEditor || !dom.btnNewCategory) return;

  const isEditing = !dom.newCategoryEditor.hidden;

  dom.desktopCategoryField.classList.toggle('is-editing', isEditing);
  dom.desktopCategorySelectRow.hidden = isEditing;
  dom.btnNewCategory.setAttribute('aria-expanded', String(isEditing));
  dom.btnNewCategory.classList.toggle('is-active', isEditing);

  if (dom.priorityField) dom.priorityField.hidden = isEditing;
  if (dom.submitTaskBtn) dom.submitTaskBtn.hidden = isEditing;
}

// renders a category select
function renderCategorySelect(selectElement, selectedValue = '') {
  if (!selectElement) return;

  const fallback = categories[0] || '';
  const nextValue = selectedValue && categories.includes(selectedValue)
    ? selectedValue
    : (categories.includes(selectElement.value) ? selectElement.value : fallback);

  // Avoid `innerHTML` for option rendering; category labels are user-provided and persisted.
  selectElement.innerHTML = '';
  const frag = document.createDocumentFragment();
  categories.forEach((label) => {
    const option = document.createElement('option');
    option.textContent = label;
    option.value = label;
    frag.appendChild(option);
  });
  selectElement.appendChild(frag);

  selectElement.value = nextValue;
}

// renders the category filters
function renderCategoryFilters() {
  if (!dom.categoryFiltersGroup) return;

  if (categories.length === 0) {
    dom.categoryFiltersGroup.innerHTML = `
      <p class="category-manager__empty">No hay categorías.</p>
    `;
    return;
  }

  dom.categoryFiltersGroup.innerHTML = categories
    .map((label) => {
      const key = getCategoryKey(label);
      const isEditing = editingCategoryKey === key;
      const escapedLabel = escapeHtml(label);
      const escapedKey = escapeHtml(key);

      if (isEditing) {
        return `
          <div class="category-row is-editing" data-category-key="${escapedKey}">
            <div class="category-row__edit">
              <input
                type="text"
                class="input category-row__input"
                value="${escapedLabel}"
                data-category-input="${escapedKey}"
                aria-label="Editar categoría ${escapedLabel}"
              />

              <div class="category-row__actions category-row__actions--edit">
                <button
                  type="button"
                  class="chip category-action category-action--save"
                  data-category-save="${escapedKey}"
                  aria-label="Guardar categoría ${escapedLabel}"
                >
                  <i data-lucide="check" aria-hidden="true"></i>
                </button>

                <button
                  type="button"
                  class="chip category-action"
                  data-category-cancel="${escapedKey}"
                  aria-label="Cancelar edición de ${escapedLabel}"
                >
                  <i data-lucide="x" aria-hidden="true"></i>
                </button>

                <button
                  type="button"
                  class="chip category-row__btn category-row__btn--danger"
                  data-category-delete="${escapedKey}"
                  aria-label="Borrar categoría ${escapedLabel}"
                >
                  <i data-lucide="trash-2" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="category-row filter-bg" data-category-key="${escapedKey}">
          <label class="choice category-row__filter">
            <input type="checkbox" name="cat" value="${escapedKey}" />
            <span class="choice__mark" aria-hidden="true"></span>
            <span class="choice__text">${escapedLabel}</span>
          </label>

          <div class="category-row__actions">
            <button
              type="button"
              class="chip category-row__btn"
              data-category-edit="${escapedKey}"
              aria-label="Editar categoría ${escapedLabel}"
            >
              <i data-lucide="square-pen" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      `;
    })
    .join('');
}

// refreshes the categories UI when editing or creating a category
function refreshCategoriesUI() {
  const currentDesktopCategory = dom.taskCategory ? dom.taskCategory.value : '';
  renderCategorySelect(dom.taskCategory, currentDesktopCategory);
  renderCategoryFilters();
  applyFiltersToDOM();
  updateDesktopCategoryFieldMode();
  refreshIcons();
}

// opens the new category editor
function openNewCategoryEditor() {
  if (!dom.newCategoryEditor || !dom.newCategoryInput) return;

  dom.newCategoryEditor.hidden = false;
  dom.newCategoryInput.value = '';
  updateDesktopCategoryFieldMode();
  dom.newCategoryInput.focus();
}

// closes the new category editor
function closeNewCategoryEditor() {
  if (!dom.newCategoryEditor || !dom.newCategoryInput) return;

  dom.newCategoryEditor.hidden = true;
  dom.newCategoryInput.value = '';
  updateDesktopCategoryFieldMode();
}

// adds a category
function addCategory(rawLabel) {
  const cleanLabel = String(rawLabel || '').trim();

  if (!cleanLabel) {
    return { ok: false, error: 'empty' };
  }

  if (categoryExists(cleanLabel)) {
    return { ok: false, error: 'duplicate' };
  }

  categories.push(cleanLabel);
  commit({ saveCategories: true, renderCategories: true, render: false });

  return { ok: true, category: cleanLabel };
}

// renames a category
function renameCategory(categoryKey, rawLabel) {
  const cleanLabel = String(rawLabel || '').trim();

  if (!cleanLabel) {
    return { ok: false, error: 'empty' };
  }

  if (categoryExists(cleanLabel, categoryKey)) {
    return { ok: false, error: 'duplicate' };
  }

  const currentLabel = getCategoryLabel(categoryKey);
  if (!currentLabel) {
    return { ok: false, error: 'not-found' };
  }

  categories = categories.map((label) =>
    getCategoryKey(label) === categoryKey ? cleanLabel : label
  );

  tasks = tasks.map((task) =>
    getCategoryKey(task.category) === categoryKey
      ? { ...task, category: cleanLabel }
      : task
  );

  filtersState.categories = filtersState.categories.map((key) =>
    key === categoryKey ? getCategoryKey(cleanLabel) : key
  );

  if (dom.taskCategory && getCategoryKey(dom.taskCategory.value) === categoryKey) {
    dom.taskCategory.value = cleanLabel;
  }

  editingCategoryKey = null;
  saveTaskFormPrefs();

  commit({
    saveCategories: true,
    saveTasks: true,
    saveFilters: true,
    renderCategories: true
  });

  return { ok: true, category: cleanLabel };
}

// removes a category
function removeCategory(categoryKey) {
  if (categories.length <= 1) {
    return { ok: false, error: 'last-category' };
  }

  const inUse = tasks.some((task) => getCategoryKey(task.category) === categoryKey);
  if (inUse) {
    return { ok: false, error: 'in-use' };
  }

  categories = categories.filter((label) => getCategoryKey(label) !== categoryKey);
  filtersState.categories = filtersState.categories.filter((key) => key !== categoryKey);

  if (dom.taskCategory && getCategoryKey(dom.taskCategory.value) === categoryKey) {
    dom.taskCategory.value = categories[0] || '';
  }

  editingCategoryKey = null;
  saveTaskFormPrefs();

  commit({
    saveCategories: true,
    saveFilters: true,
    renderCategories: true
  });

  return { ok: true };
}

// gets the category error message
function getCategoryErrorMessage(error) {
  if (error === 'duplicate') return 'Esa categoría ya existe.';
  if (error === 'empty') return 'Escribe un nombre de categoría válido.';
  if (error === 'in-use') return 'No puedes borrar esa categoría porque está asignada a tareas.';
  if (error === 'last-category') return 'Debe quedar al menos una categoría.';
  return 'No se pudo completar la acción.';
}

// =====================================================
// RENDER TASKS + EMPTY STATES
// =====================================================

// renders a task
function renderTask(task) {
  // Helpers para construir trozos de HTML
  function getTaskHeaderHTML() {
    if (isEditing) {
      return `
        <input
          class="task-card__input"
          type="text"
          data-task-id="${task.id}"
          aria-label="Editar título"
        />
      `;
    }
    return `<h3 class="task-card__title"></h3>`;
  }

  function getDragHandleHTML() {
    if (isEditing) return '';
    return `
      <button
        class="chip task-card__drag-handle"
        type="button"
        aria-label="Reordenar tarea ${escapedTaskTitle}"
        title="Arrastrar para reordenar"
      >
        <i data-lucide="grip-vertical" aria-hidden="true"></i>
      </button>
    `;
  }

  function getEditButtonsHTML() {
    if (!isEditing) {
      return `
        <button
          class="chip task-card__edit"
          type="button"
          data-task-id="${task.id}"
          aria-label="Editar tarea"
        >
          <i data-lucide="pencil" aria-hidden="true"></i>
        </button>

        <button
          class="chip task-card__del"
          type="button"
          data-task-id="${task.id}"
          aria-label="Borrar tarea ${escapedTaskTitle}"
        >
          <i data-lucide="trash-2" aria-hidden="true"></i>
        </button>
      `;
    }
    return `
      <button
        class="chip task-card__save"
        type="button"
        data-task-id="${task.id}"
        aria-label="Guardar título"
      >
        <i data-lucide="check" aria-hidden="true"></i>
      </button>
      <button
        class="chip task-card__cancel"
        type="button"
        data-task-id="${task.id}"
        aria-label="Cancelar edición"
      >
        <i data-lucide="x" aria-hidden="true"></i>
      </button>
    `;
  }

  // Variables descriptivas
  const li = document.createElement('li');
  li.className = 'task-list__item';
  li.dataset.taskId = String(task.id);

  const normalizedPriority = normalizePriority(task.priority);
  const isEditing = editingTaskId === task.id;
  const mainTag = isEditing ? 'div' : 'label';
  const escapedTaskTitle = escapeHtml(task.title);

  // Renderizado HTML principal
  li.innerHTML = `
    <div class="task-item">
      <input
        class="task-item__toggle"
        type="checkbox"
        id="task-${task.id}"
        ${task.done ? 'checked' : ''}
      />
      <div class="task-card">
        <${mainTag}
          class="task-card__main"
          ${!isEditing ? `for="task-${task.id}"` : ''}
        >
          <div class="task-card__top">
            ${getTaskHeaderHTML()}
            <span class="prio prio--${normalizedPriority}"></span>
          </div>
        </${mainTag}>
        <div class="task-card__footer">
          <span class="task-card__cat"></span>
          <div class="task-card__actions">
            ${getDragHandleHTML()}
            ${getEditButtonsHTML()}
          </div>
        </div>
      </div>
    </div>
  `;

  // Seteo de valores dinámicos
  const titleElement = li.querySelector('.task-card__title');
  if (titleElement) {
    titleElement.textContent = task.title;
  }

  const inputElement = li.querySelector('.task-card__input');
  if (inputElement) {
    inputElement.value = task.title;
  }

  const categoryElement = li.querySelector('.task-card__cat');
  if (categoryElement) {
    categoryElement.textContent = task.category || categories[0] || 'Personal';
  }

  const prioElement = li.querySelector('.prio');
  if (prioElement) {
    prioElement.textContent = setPriorityLabel(task.priority);
  }

  return li;
}

// renders the empty state
function renderEmptyState() {
  const li = document.createElement('li');
  li.className = 'task-list__empty';
  li.innerHTML = `
    <p class="task-empty__title">No hay resultados</p>
    <div class="task-empty" aria-live="polite">
      <span class="eyes task-empty__eyes" aria-hidden="true"></span>
    </div>
  `;
  return li;
}

// renders the no tasks state
function renderNoTasksState() {
  const li = document.createElement('li');
  li.className = 'task-list__empty task-list__empty--first-task';

  li.innerHTML = `
    <div class="task-empty task-empty--first-task" aria-live="polite">
      <p class="task-empty__eyebrow">Crear nueva tarea</p>
      <h3 class="task-empty__title">Todavía no hay tareas</h3>
      <p class="task-empty__text">
        Empieza creando la primera. En cuanto añadas una, tus tarjetas aparecerán por aquí.
        <a href="#" class="task-empty__demo-link">Usa el demo</a>
      </p>

      <button type="button" class="btn btn--primary task-empty__cta">
        Añadir tarea
      </button>

      <div class="task-empty__visual" aria-hidden="true">
        <div class="loader">
          <span><span></span><span></span><span></span><span></span></span>
          <div class="base">
            <span></span>
            <div class="face"></div>
          </div>
        </div>

        <div class="longfazers">
          <span></span><span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;

  return li;
}

// =====================================================
// RENDER FILTERS + ACTIONS + STATS
// =====================================================

// creates a filter chip
function createFilterChip({ label, ariaLabel, dataName, dataValue }) {
  const li = document.createElement('li');

  const escapedLabel = escapeHtml(label);
  const escapedAriaLabel = escapeHtml(ariaLabel);
  const escapedDataValue = escapeHtml(dataValue);

  li.innerHTML = `
    <button
      type="button"
      class="chip filter-chip remove-filter"
      ${dataName}="${escapedDataValue}"
      aria-label="${escapedAriaLabel}"
    >
      <span>${escapedLabel}</span>
      <i data-lucide="x" aria-hidden="true"></i>
    </button>
  `;

  return li;
}

// renders the selected filters
function renderSelectedFilters() {
  if (!dom.selectedFiltersList) return;

  dom.selectedFiltersList.innerHTML = '';

  filtersState.priorities.forEach((priority) => {
    const label = setPriorityLabel(priority);

    dom.selectedFiltersList.appendChild(
      createFilterChip({
        label,
        ariaLabel: `Quitar filtro de prioridad ${label}`,
        dataName: 'data-priority',
        dataValue: priority
      })
    );
  });

  filtersState.categories.forEach((categoryKey) => {
    const label = getCategoryLabel(categoryKey);

    dom.selectedFiltersList.appendChild(
      createFilterChip({
        label,
        ariaLabel: `Quitar filtro ${label}`,
        dataName: 'data-category',
        dataValue: categoryKey
      })
    );
  });

  if (hasActiveFilters()) {
    const li = document.createElement('li');
    li.innerHTML = `
      <button
        type="button"
        class="chip filter-chip filter-chip--clear clear-all-filters"
        aria-label="Limpiar todos los filtros"
      >
        <span>Limpiar filtros</span>
      </button>
    `;
    dom.selectedFiltersList.appendChild(li);
  }
}

// renders the clear filters button
function renderClearFiltersButton() {
  if (!dom.btnClearFilters) return;
  dom.btnClearFilters.hidden = !hasActiveFilters();
}

// renders the empty layout visibility
function renderEmptyLayoutVisibility() {
  const hasTasks = tasks.length > 0;

  if (dom.filterPanel) dom.aside.hidden = !hasTasks;
  if (dom.statsPanel) dom.statsPanel.hidden = !hasTasks;
  if (dom.taskActions) dom.taskActions.hidden = !hasTasks;

  document.body.classList.toggle('has-no-tasks', !hasTasks);
}

// renders the action buttons
function renderActionButtons() {
  const visibleTasks = getFilteredTasks();
  const visibleDoneCount = visibleTasks.filter((task) => task.done).length;
  const visiblePendingCount = visibleTasks.length - visibleDoneCount;
  const allVisibleCompleted = visibleTasks.length > 0 && visiblePendingCount === 0;

  if (dom.btnToggleLayout) {
    dom.btnToggleLayout.setAttribute('aria-pressed', String(isListLayout));

    const icon = dom.btnToggleLayout.querySelector('i');
    const text = dom.btnToggleLayout.querySelector('span');

    if (icon) {
      icon.setAttribute('data-lucide', isListLayout ? 'layout-grid' : 'rows-3');
    }

    if (text) {
      text.textContent = isListLayout ? 'Vista grid' : 'Vista lista';
    }
  }

  if (dom.btnCompleteAllTasks) {
    const icon = dom.btnCompleteAllTasks.querySelector('i');
    const text = dom.btnCompleteAllTasks.querySelector('span');

    dom.btnCompleteAllTasks.disabled = visibleTasks.length === 0;

    if (icon) {
      icon.setAttribute('data-lucide', allVisibleCompleted ? 'rotate-ccw' : 'check-check');
    }

    if (text) {
      if (visibleTasks.length === 0) {
        text.textContent = 'Completar visibles';
      } else if (allVisibleCompleted) {
        if (isDefaultTaskView()) {
          text.textContent = 'Desmarcar todas';
        } else if (filtersState.status === 'done') {
          text.textContent = 'Desmarcar completadas';
        } else {
          text.textContent = 'Desmarcar visibles';
        }
      } else {
        if (isDefaultTaskView()) {
          text.textContent = 'Completar todas';
        } else if (filtersState.status === 'pending') {
          text.textContent = 'Completar pendientes';
        } else {
          text.textContent = 'Completar visibles';
        }
      }
    }
  }

  if (dom.btnDeleteAllTasks) {
    const text = dom.btnDeleteAllTasks.querySelector('span');

    dom.btnDeleteAllTasks.disabled = visibleTasks.length === 0;

    if (text) {
      if (isDefaultTaskView()) {
        text.textContent = 'Borrar todas';
      } else if (filtersState.status === 'done' && visibleTasks.length > 0) {
        text.textContent = 'Borrar completadas';
      } else if (filtersState.status === 'pending' && visibleTasks.length > 0) {
        text.textContent = 'Borrar pendientes';
      } else {
        text.textContent = 'Borrar visibles';
      }
    }
  }

  if (dom.taskGrid) {
    dom.taskGrid.classList.toggle('is-list', isListLayout);
  }
}

// renders the tasks list
function renderTasksList() {
  if (!dom.taskList) return;

  const filteredTasks = getFilteredTasks();
  const hasNoTasks = tasks.length === 0;
  const shouldShowNoResults = !hasNoTasks && hasActiveTaskView() && filteredTasks.length === 0;

  dom.taskList.innerHTML = '';

  if (dom.taskGrid) {
    dom.taskGrid.classList.toggle('task-grid--empty', hasNoTasks || shouldShowNoResults);
    dom.taskGrid.classList.toggle('task-grid--no-tasks', hasNoTasks);
  }

  if (hasNoTasks) {
    dom.taskList.appendChild(renderNoTasksState());
  } else if (shouldShowNoResults) {
    dom.taskList.appendChild(renderEmptyState());
  } else {
    filteredTasks.forEach((task) => {
      dom.taskList.appendChild(renderTask(task));
    });
  }

  renderSelectedFilters();
  renderClearFiltersButton();

  if (editingTaskId !== null) {
    const input = dom.taskList.querySelector(`.task-card__input[data-task-id="${editingTaskId}"]`);
    if (input) {
      input.focus();
      input.select();
    }
  }
}

// renders the stats
function renderStats() {
  const total = tasks.length;
  const done = tasks.filter((task) => task.done).length;
  const pending = total - done;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  dom.taskCount.forEach((node) => {
    node.textContent = total;
  });

  dom.taskCountPending.forEach((node) => {
    node.textContent = pending;
  });

  dom.taskCountDone.forEach((node) => {
    node.textContent = done;
  });

  const fill = document.querySelector('.stats__fill');
  const progressBar = document.querySelector('.stats__bar');
  const doneCounter = document.querySelector('.stats__done');

  if (doneCounter) doneCounter.textContent = done;
  if (fill) fill.style.width = `${percent}%`;
  if (progressBar) progressBar.setAttribute('aria-valuenow', String(percent));
}

// =====================================================
// DRAG & DROP
// =====================================================

// reorders tasks from visible IDs
function reorderTasksFromVisibleIds(visibleIds) {
  if (!Array.isArray(visibleIds) || visibleIds.length === 0) return;

  const visibleIdSet = new Set(visibleIds);
  const reorderedVisibleTasks = visibleIds
    .map((taskId) => getTaskById(taskId))
    .filter(Boolean);

  if (reorderedVisibleTasks.length !== visibleIds.length) return;

  let visibleIndex = 0;

  tasks = tasks.map((task) => {
    if (!visibleIdSet.has(task.id)) {
      return task;
    }

    const nextTask = reorderedVisibleTasks[visibleIndex];
    visibleIndex += 1;
    return nextTask;
  });

  commit({ saveTasks: true });
}

// initializes task sorting
function initTaskSorting() {
  if (!dom.taskList || typeof window.Sortable === 'undefined') return;

  if (sortableTasks) {
    sortableTasks.destroy();
  }

  sortableTasks = window.Sortable.create(dom.taskList, {
    animation: 180,
    handle: '.task-card__drag-handle',
    draggable: '.task-list__item',
    ghostClass: 'task-list__item--ghost',
    chosenClass: 'task-list__item--chosen',
    dragClass: 'task-list__item--dragging',
    delay: 120,
    delayOnTouchOnly: true,
    forceFallback: false,
    onEnd(evt) {
      if (evt.oldIndex === evt.newIndex) return;

      const visibleIds = [...dom.taskList.querySelectorAll('.task-list__item')]
        .map((item) => Number(item.dataset.taskId))
        .filter(Boolean);

      reorderTasksFromVisibleIds(visibleIds);
    }
  });
}

// =====================================================
// UI ORCHESTRATION
// =====================================================

// refreshes the UI
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
// EVENTS
// =====================================================

// binds the desktop form events
function bindDesktopForm() {
  if (!dom.desktopForm) return;

  dom.desktopForm.addEventListener('submit', (event) => {
    event.preventDefault();
    addTaskFromDesktopForm();
  });
}

// binds the list events
function bindListEvents() {
  if (!dom.taskList) return;

  function handleEmptyStateClick(event) {
    event.preventDefault();
    openTaskCreator();
  }

  function handleDemoLinkClick(event) {
    event.preventDefault();
    loadDemoTasks();
  }

  function handleCardClick(event, card) {
    const checkbox = card.parentElement.querySelector('.task-item__toggle');
    if (!checkbox) return;

    checkbox.checked = !checkbox.checked;
    const taskId = Number(checkbox.id.replace('task-', ''));
    if (taskId) toggleTask(taskId, checkbox.checked);
  }

  function handleEditTask(event, editBtn) {
    event.preventDefault();
    event.stopPropagation();
    const taskId = Number(editBtn.dataset.taskId);
    if (taskId) startTaskEdit(taskId);
  }

  function handleSaveTask(event, saveBtn) {
    event.preventDefault();
    event.stopPropagation();
    const taskId = Number(saveBtn.dataset.taskId);
    const input = dom.taskList.querySelector(`.task-card__input[data-task-id="${taskId}"]`);
    if (!taskId || !input) return;
    const result = updateTaskTitle(taskId, input.value);
    if (!result.ok) showFieldError('El título no puede estar vacío.', input);
  }

  function handleCancelTask(event) {
    event.preventDefault();
    event.stopPropagation();
    cancelTaskEdit();
  }

  function handleDeleteTask(event, deleteBtn) {
    event.preventDefault();
    event.stopPropagation();
    const taskId = Number(deleteBtn.dataset.taskId);
    if (taskId) removeTask(taskId);
  }

  dom.taskList.addEventListener('click', (event) => {
    const emptyStateBtn = event.target.closest('.task-empty__cta');
    if (emptyStateBtn) {
      handleEmptyStateClick(event);
      return;
    }

    const demoLink = event.target.closest('.task-empty__demo-link');
    if (demoLink) {
      handleDemoLinkClick(event);
      return;
    }

    const clickedButton = event.target.closest('button');
    const clickedInput = event.target.closest('.task-card__input');
    const clickedCard = event.target.closest('.task-card');

    if (clickedCard && !clickedButton && !clickedInput) {
      handleCardClick(event, clickedCard);
      return;
    }

    const editBtn = event.target.closest('.task-card__edit');
    if (editBtn) {
      handleEditTask(event, editBtn);
      return;
    }

    const saveBtn = event.target.closest('.task-card__save');
    if (saveBtn) {
      handleSaveTask(event, saveBtn);
      return;
    }

    const cancelBtn = event.target.closest('.task-card__cancel');
    if (cancelBtn) {
      handleCancelTask(event);
      return;
    }

    const deleteBtn = event.target.closest('.task-card__del');
    if (deleteBtn) {
      handleDeleteTask(event, deleteBtn);
    }
  });

  dom.taskList.addEventListener('keydown', (event) => {
    const input = event.target.closest('.task-card__input');
    if (!input) return;

    const taskId = Number(input.dataset.taskId);
    if (!taskId) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      const result = updateTaskTitle(taskId, input.value);
      if (!result.ok) showFieldError('El título no puede estar vacío.', input);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelTaskEdit();
    }
  });

  dom.taskList.addEventListener('change', (event) => {
    const checkbox = event.target.closest('.task-item__toggle');
    if (!checkbox) return;

    const taskId = Number(checkbox.id.replace('task-', ''));
    if (!taskId) return;

    toggleTask(taskId, checkbox.checked);
  });
}

// binds the search events
function bindSearchEvents() {
  if (!dom.taskSearch) return;

  const handleSearch = () => {
    syncFiltersState();
    refreshUI();
  };

  dom.taskSearch.addEventListener('input', handleSearch);
  dom.taskSearch.addEventListener('search', handleSearch);
}

// binds the status nav events
    function bindStatusNavEvents() {
  getStatusLinks().forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();

      const nextStatus = link.dataset.statusValue || 'all';
      if (!['all', 'pending', 'done'].includes(nextStatus)) return;
      if (filtersState.status === nextStatus) return;

      filtersState.status = nextStatus;
      saveFiltersState();
      applyFiltersToDOM();
      refreshUI();
    });
  });
}

// binds the filter events
function bindFilterEvents() {
  if (dom.filterPanel) {
    dom.filterPanel.addEventListener('change', (event) => {
      const target = event.target;

      if (!target.matches('input[name="priority"], input[name="cat"]')) {
        return;
      }

      syncFiltersState();
      refreshUI();
    });
  }

  if (dom.btnClearFilters) {
    dom.btnClearFilters.addEventListener('click', clearAllFilters);
  }

  if (!dom.selectedFiltersList) return;

  dom.selectedFiltersList.addEventListener('click', (event) => {
    const btnClearAll = event.target.closest('.clear-all-filters');
    if (btnClearAll) {
      clearAllFilters();
      return;
    }

    const removeBtn = event.target.closest('.remove-filter');
    if (!removeBtn) return;

    const category = removeBtn.dataset.category;
    const priority = removeBtn.dataset.priority;

    if (category) {
      filtersState.categories = filtersState.categories.filter((item) => item !== category);
    }

    if (priority) {
      filtersState.priorities = filtersState.priorities.filter((item) => item !== priority);
    }

    saveFiltersState();
    applyFiltersToDOM();
    refreshUI();
  });
}

// binds the category events
function bindCategoryEvents() {
  function toggleNewCategoryEditor() {
    if (!dom.newCategoryEditor) return;
    if (dom.newCategoryEditor.hidden) {
      openNewCategoryEditor();
    } else {
      closeNewCategoryEditor();
    }
  }

  function handleSaveNewCategory() {
    const result = addCategory(dom.newCategoryInput?.value);

    if (!result.ok) {
      showFieldError(getCategoryErrorMessage(result.error), dom.newCategoryInput);
      return;
    }

    if (dom.taskCategory) {
      dom.taskCategory.value = result.category;
    }

    saveTaskFormPrefs();
    closeNewCategoryEditor();
    refreshUI();
  }

  function handleNewCategoryInputKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      dom.btnSaveNewCategory?.click();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeNewCategoryEditor();
    }
  }

  function handleCategoryGroupClick(event) {
    const editBtn = event.target.closest('[data-category-edit]');
    if (editBtn) {
      editingCategoryKey = editBtn.dataset.categoryEdit;
      refreshCategoriesUI();
      const input = getCategoryInputEl(dom.categoryFiltersGroup, editingCategoryKey);
      if (input) {
        input.focus();
        input.select();
      }
      return;
    }

    const cancelBtn = event.target.closest('[data-category-cancel]');
    if (cancelBtn) {
      editingCategoryKey = null;
      refreshCategoriesUI();
      return;
    }

    const saveBtn = event.target.closest('[data-category-save]');
    if (saveBtn) {
      const key = saveBtn.dataset.categorySave;
      const input = getCategoryInputEl(dom.categoryFiltersGroup, key);
      const result = renameCategory(key, input?.value || '');
      if (!result.ok) {
        showFieldError(getCategoryErrorMessage(result.error), input);
      }
      return;
    }

    const deleteBtn = event.target.closest('[data-category-delete]');
    if (deleteBtn) {
      const key = deleteBtn.dataset.categoryDelete;
      const result = removeCategory(key);
      if (!result.ok) {
        alert(getCategoryErrorMessage(result.error));
      }
    }
  }

  function handleCategoryGroupKeydown(event) {
    const input = event.target.closest('.category-row__input');
    if (!input) return;

    const key = input.dataset.categoryInput;

    if (event.key === 'Enter') {
      event.preventDefault();
      const result = renameCategory(key, input.value);
      if (!result.ok) {
        showFieldError(getCategoryErrorMessage(result.error), input);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      editingCategoryKey = null;
      refreshCategoriesUI();
    }
  }

  if (dom.btnNewCategory) {
    dom.btnNewCategory.addEventListener('click', toggleNewCategoryEditor);
  }

  if (dom.btnCancelNewCategory) {
    dom.btnCancelNewCategory.addEventListener('click', closeNewCategoryEditor);
  }

  if (dom.btnSaveNewCategory) {
    dom.btnSaveNewCategory.addEventListener('click', handleSaveNewCategory);
  }

  if (dom.newCategoryInput) {
    dom.newCategoryInput.addEventListener('keydown', handleNewCategoryInputKeydown);
  }

  if (!dom.categoryFiltersGroup) return;

  dom.categoryFiltersGroup.addEventListener('click', handleCategoryGroupClick);
  dom.categoryFiltersGroup.addEventListener('keydown', handleCategoryGroupKeydown);
}

// binds the task action events
function bindTaskActionEvents() {
  dom.btnToggleLayout?.addEventListener('click', toggleLayoutMode);
  dom.btnCompleteAllTasks?.addEventListener('click', completeVisibleTasks);
  dom.btnDeleteAllTasks?.addEventListener('click', removeVisibleTasks);
}

// binds the task form preference events
function bindTaskFormPreferenceEvents() {
  dom.taskCategory?.addEventListener('change', saveTaskFormPrefs);
  dom.taskPriority?.addEventListener('change', saveTaskFormPrefs);
}

// =====================================================
// INIT
// =====================================================

// initializes the app
function init() {
  loadTasks();
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

// public API
window.TaskFlowApp = {
  // adds a task from data
  addTaskFromData,
  // adds a category
  addCategory,
  // opens the task creator
  openTaskCreator,
  // loads demo tasks
  loadDemoTasks,
  // gets the categories
  getCategories() {
    return [...categories];
  },
  // gets the desktop defaults
  getDesktopDefaults() {
    return {
      category: dom.taskCategory ? dom.taskCategory.value : categories[0] || 'Personal',
      priority: dom.taskPriority ? dom.taskPriority.value : 'Media'
    };
  },
  // gets the filtered count by state
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
  // refreshes the UI
  refreshUI,
  // refreshes the categories UI
  refreshCategoriesUI
};

// =====================================================
// START
// =====================================================

document.addEventListener('DOMContentLoaded', init);