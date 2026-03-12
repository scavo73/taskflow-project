const taskTitle = document.getElementById('taskTitle');
const taskList = document.getElementById('taskList');
const taskCategory = document.getElementById('taskCategory');
const taskPriority = document.getElementById('taskPriority');
const selectedFiltersList = document.getElementById('selectedFiltersList');
const taskSearch = document.getElementById('taskSearch');
const btnClearFilters = document.getElementById('btnClearFilters');

const btnToggleLayout = document.getElementById('btnToggleLayout');
const btnCompleteAllTasks = document.getElementById('btnCompleteAllTasks');
const btnDeleteAllTasks = document.getElementById('btnDeleteAllTasks');
const taskGrid = document.querySelector('.task-grid');
const filterPanel = document.querySelector('.filter-panel');

const taskCount = document.querySelectorAll('.task-count');
const priorityInputs = document.querySelectorAll('input[name="priority"]');
const statusInputs = document.querySelectorAll('input[name="status"]');

const btnNewCategory = document.getElementById('btnNewCategory');
const newCategoryEditor = document.getElementById('newCategoryEditor');
const newCategoryInput = document.getElementById('newCategoryInput');
const btnSaveNewCategory = document.getElementById('btnSaveNewCategory');
const btnCancelNewCategory = document.getElementById('btnCancelNewCategory');
const categoryFiltersGroup = document.getElementById('categoryFiltersGroup');
const categoryManagerList = document.getElementById('categoryManagerList');
const categoryPanel = document.querySelector('.category-panel');
const desktopCategoryField = document.getElementById('desktopCategoryField');
const desktopCategorySelectRow = document.getElementById('desktopCategorySelectRow');
const btnToggleCategoryManage = document.getElementById('btnToggleCategoryManage');

const LS_KEY = 'taskflow_tasks';
const LS_CATEGORIES_KEY = 'taskflow_categories';
const LS_FILTERS_STATE_KEY = 'taskflow_filters_state';
const LS_LAYOUT_KEY = 'taskflow_layout_mode';

const DEFAULT_CATEGORIES = ['Trabajo', 'Estudio', 'Personal', 'Salud'];

const demoTasks = [
  { id: 1, title: 'Comprar pan', category: 'Personal', priority: 'Media', done: false },
  { id: 2, title: 'Estudiar JavaScript', category: 'Estudio', priority: 'Alta', done: false },
  { id: 3, title: 'Ir al gimnasio', category: 'Salud', priority: 'Baja', done: true },
  { id: 4, title: 'Enviar propuesta al cliente', category: 'Trabajo', priority: 'Alta', done: false },
  { id: 5, title: 'Preparar apuntes de CSS', category: 'Estudio', priority: 'Media', done: true },
  { id: 6, title: 'Pedir cita médica', category: 'Salud', priority: 'Alta', done: false }
];

let tasks = [];
let nextId = 1;
let isListLayout = false;
let editingTaskId = null;
let categories = [];
let editingCategoryKey = null;
let isManagingCategories = false;

let filtersState = {
  status: 'all',
  priorities: [],
  categories: [],
  search: ''
};

function syncGlobalTasks() {
  window.tasks = tasks;
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

function getCategoryKey(label) {
  return normalizeText(label);
}

function getCategoryInputs() {
  return [...document.querySelectorAll('input[name="cat"]')];
}

function getCategoryLabel(categoryKey) {
  return categories.find((label) => getCategoryKey(label) === categoryKey) || categoryKey;
}

function categoryExists(label, excludeKey = '') {
  const nextKey = getCategoryKey(label);

  return categories.some((item) => {
    const itemKey = getCategoryKey(item);
    if (excludeKey && itemKey === excludeKey) return false;
    return itemKey === nextKey;
  });
}

function setPriorityLabel(value) {
  const normalized = normalizePriority(value);
  if (normalized === 'high') return 'Alta';
  if (normalized === 'low') return 'Baja';
  return 'Media';
}

function setStatusLabel(value) {
  if (value === 'pending') return 'Pendientes';
  if (value === 'done') return 'Completadas';
  return 'Todos';
}

function loadTasks() {
  try {
    tasks = JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch {
    tasks = [];
  }

  if (tasks.length === 0) {
    tasks = [...demoTasks];
    localStorage.setItem(LS_KEY, JSON.stringify(tasks));
  }

  nextId = tasks.length ? Math.max(...tasks.map((task) => task.id)) + 1 : 1;
  syncGlobalTasks();
}

function saveTasks() {
  localStorage.setItem(LS_KEY, JSON.stringify(tasks));
  syncGlobalTasks();
}

function updateDesktopCategoryFieldMode() {
  if (!desktopCategoryField || !desktopCategorySelectRow || !newCategoryEditor || !btnNewCategory) return;

  const isEditing = !newCategoryEditor.hidden;
  desktopCategoryField.classList.toggle('is-editing', isEditing);
  desktopCategorySelectRow.hidden = isEditing;
  btnNewCategory.setAttribute('aria-expanded', String(isEditing));
  btnNewCategory.classList.toggle('is-active', isEditing);
}

function updateCategoryManageMode() {
  if (!categoryFiltersGroup || !categoryManagerList || !btnToggleCategoryManage) return;

  categoryPanel?.classList.toggle('is-managing', isManagingCategories);
  categoryFiltersGroup.hidden = isManagingCategories;
  categoryManagerList.hidden = !isManagingCategories;
  categoryFiltersGroup.style.display = isManagingCategories ? 'none' : '';
  categoryManagerList.style.display = isManagingCategories ? 'grid' : 'none';
  btnToggleCategoryManage.setAttribute('aria-pressed', String(isManagingCategories));
  btnToggleCategoryManage.textContent = isManagingCategories ? 'Listo' : 'Editar';
}


function loadCategories() {
  let savedCategories = [];

  try {
    savedCategories = JSON.parse(localStorage.getItem(LS_CATEGORIES_KEY)) || [];
  } catch {
    savedCategories = [];
  }

  const merged = [...DEFAULT_CATEGORIES, ...savedCategories, ...tasks.map((task) => task.category)];
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

function saveCategories() {
  localStorage.setItem(LS_CATEGORIES_KEY, JSON.stringify(categories));
}

function saveLayoutMode() {
  localStorage.setItem(LS_LAYOUT_KEY, isListLayout ? 'list' : 'grid');
}

function loadLayoutMode() {
  isListLayout = localStorage.getItem(LS_LAYOUT_KEY) === 'list';
}

function getFiltersFromDOM() {
  return {
    status: document.querySelector('input[name="status"]:checked')?.value || 'all',
    priorities: [...priorityInputs]
      .filter((input) => input.checked)
      .map((input) => input.value),
    categories: getCategoryInputs()
      .filter((input) => input.checked)
      .map((input) => normalizeText(input.value)),
    search: normalizeText(taskSearch ? taskSearch.value : '')
  };
}

function applyFiltersToDOM() {
  statusInputs.forEach((input) => {
    input.checked = input.value === filtersState.status;
  });

  priorityInputs.forEach((input) => {
    input.checked = filtersState.priorities.includes(input.value);
  });

  getCategoryInputs().forEach((input) => {
    input.checked = filtersState.categories.includes(normalizeText(input.value));
  });

  if (taskSearch) {
    taskSearch.value = filtersState.search || '';
  }
}

function saveFiltersState() {
  localStorage.setItem(LS_FILTERS_STATE_KEY, JSON.stringify(filtersState));
}

function loadFiltersState() {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_FILTERS_STATE_KEY)) || {};

    filtersState = {
      status: saved.status || 'all',
      priorities: Array.isArray(saved.priorities) ? saved.priorities : [],
      categories: Array.isArray(saved.categories) ? saved.categories : [],
      search: String(saved.search || '')
    };
  } catch {
    filtersState = {
      status: 'all',
      priorities: [],
      categories: [],
      search: ''
    };
  }

  applyFiltersToDOM();
}

function syncFiltersState() {
  filtersState = getFiltersFromDOM();
  saveFiltersState();
}

function hasActiveFilters() {
  return (
    filtersState.status !== 'all' ||
    filtersState.priorities.length > 0 ||
    filtersState.categories.length > 0 ||
    filtersState.search !== ''
  );
}

function clearAllFilters() {
  filtersState = {
    status: 'all',
    priorities: [],
    categories: [],
    search: ''
  };

  saveFiltersState();
  applyFiltersToDOM();
  refreshUI();
}

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

function getFilteredTasks() {
  return tasks.filter((task) => taskMatchesFilters(task, filtersState));
}

function createTaskData({ title, category, priority }) {
  return {
    id: nextId++,
    title: String(title || '').trim(),
    category: String(category || categories[0] || 'Personal').trim(),
    priority: priority || 'Media',
    done: false
  };
}

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

  tasks.push(task);
  saveTasks();
  refreshUI();

  return { ok: true, task };
}

function addTaskFromDesktopForm() {
  if (!taskTitle) return;

  const result = addTaskFromData({
    title: taskTitle.value,
    category: taskCategory ? taskCategory.value : categories[0] || 'Personal',
    priority: taskPriority ? taskPriority.value : 'Media'
  });

  if (!result.ok) {
    alert('Por favor, ingresa un título para la tarea.');
    taskTitle.focus();
    return;
  }

  taskTitle.value = '';
}

function getTaskById(taskId) {
  return tasks.find((task) => task.id === taskId);
}

function startTaskEdit(taskId) {
  const task = getTaskById(taskId);
  if (!task) return;

  editingTaskId = taskId;
  refreshUI();
}

function cancelTaskEdit() {
  if (editingTaskId === null) return;

  editingTaskId = null;
  refreshUI();
}

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
  saveTasks();
  refreshUI();

  return { ok: true, task };
}

function removeTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);

  if (editingTaskId === taskId) {
    editingTaskId = null;
  }

  saveTasks();
  refreshUI();
}

function toggleTask(taskId, isDone) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  task.done = isDone;
  saveTasks();
  refreshUI();
}

function toggleLayoutMode() {
  isListLayout = !isListLayout;
  saveLayoutMode();
  refreshUI();
}

function completeAllTasks() {
  if (tasks.length === 0) return;

  const areAllCompleted = tasks.every((task) => task.done);

  tasks = tasks.map((task) => ({
    ...task,
    done: !areAllCompleted
  }));

  saveTasks();
  refreshUI();
}

function removeAllTasks() {
  if (tasks.length === 0) return;

  const userConfirmed = confirm('¿Seguro que quieres borrar todas las tareas? Esta acción no se puede deshacer.');
  if (!userConfirmed) return;

  tasks = [];
  editingTaskId = null;
  saveTasks();
  refreshUI();
}

function renderCategorySelect(selectElement, selectedValue = '') {
  if (!selectElement) return;

  const fallback = categories[0] || '';
  const nextValue = selectedValue && categories.includes(selectedValue)
    ? selectedValue
    : (categories.includes(selectElement.value) ? selectElement.value : fallback);

  selectElement.innerHTML = categories
    .map((label) => `<option>${label}</option>`)
    .join('');

  selectElement.value = nextValue;
}

function renderCategoryFilters() {
  if (!categoryFiltersGroup) return;

  categoryFiltersGroup.innerHTML = categories
    .map((label) => {
      const key = getCategoryKey(label);

      return `
        <label class="choice">
          <input type="checkbox" name="cat" value="${key}" />
          <span class="choice__mark" aria-hidden="true"></span>
          <span class="choice__text">${label}</span>
        </label>
      `;
    })
    .join('');
}

function renderCategoryManager() {
  if (!categoryManagerList) return;

  if (categories.length === 0) {
    categoryManagerList.innerHTML = '<p class="category-manager__empty">No hay categorías.</p>';
    return;
  }

  categoryManagerList.innerHTML = categories
    .map((label) => {
      const key = getCategoryKey(label);
      const isEditing = editingCategoryKey === key;

      if (isEditing) {
        return `
          <div class="category-row is-editing" data-category-key="${key}">
            <div class="category-row__edit">
              <input
                type="text"
                class="input category-row__input"
                value="${label}"
                data-category-input="${key}"
              />

              <div class="category-row__actions category-row__actions--edit">
                <button
                  type="button"
                  class="chip category-action category-action--save"
                  data-category-save="${key}"
                >
                  <i data-lucide="check" aria-hidden="true"></i>
                  <span>Guardar</span>
                </button>

                <button
                  type="button"
                  class="chip category-action"
                  data-category-cancel="${key}"
                >
                  <i data-lucide="x" aria-hidden="true"></i>
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="category-row" data-category-key="${key}">
          <span class="category-row__label">${label}</span>

          <div class="category-row__actions">
            <button
              type="button"
              class="chip category-row__btn"
              data-category-edit="${key}"
              aria-label="Editar categoría ${label}"
            >
              <i data-lucide="pencil" aria-hidden="true"></i>
            </button>

            <button
              type="button"
              class="chip category-row__btn category-row__btn--danger"
              data-category-delete="${key}"
              aria-label="Borrar categoría ${label}"
            >
              <i data-lucide="trash-2" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      `;
    })
    .join('');
}

function refreshCategoriesUI() {
  const currentDesktopCategory = taskCategory ? taskCategory.value : '';

  renderCategorySelect(taskCategory, currentDesktopCategory);
  renderCategoryFilters();
  renderCategoryManager();
  applyFiltersToDOM();
  updateDesktopCategoryFieldMode();
  updateCategoryManageMode();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function openNewCategoryEditor() {
  if (!newCategoryEditor || !newCategoryInput) return;

  newCategoryEditor.hidden = false;
  newCategoryInput.value = '';
  updateDesktopCategoryFieldMode();
  newCategoryInput.focus();
}

function closeNewCategoryEditor() {
  if (!newCategoryEditor || !newCategoryInput) return;

  newCategoryEditor.hidden = true;
  newCategoryInput.value = '';
  updateDesktopCategoryFieldMode();
}

function addCategory(rawLabel) {
  const cleanLabel = String(rawLabel || '').trim();

  if (!cleanLabel) {
    return { ok: false, error: 'empty' };
  }

  if (categoryExists(cleanLabel)) {
    return { ok: false, error: 'duplicate' };
  }

  categories.push(cleanLabel);
  saveCategories();
  refreshCategoriesUI();

  return { ok: true, category: cleanLabel };
}

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

  if (taskCategory && getCategoryKey(taskCategory.value) === categoryKey) {
    taskCategory.value = cleanLabel;
  }

  editingCategoryKey = null;
  saveCategories();
  saveTasks();
  saveFiltersState();
  refreshCategoriesUI();
  refreshUI();

  return { ok: true, category: cleanLabel };
}

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

  if (taskCategory && getCategoryKey(taskCategory.value) === categoryKey) {
    taskCategory.value = categories[0] || '';
  }

  editingCategoryKey = null;
  saveCategories();
  saveFiltersState();
  refreshCategoriesUI();
  refreshUI();

  return { ok: true };
}

function renderTask(task) {
  const li = document.createElement('li');
  li.className = 'task-list__item';

  const normalizedPriority = normalizePriority(task.priority);
  const isEditing = editingTaskId === task.id;
  const mainTag = isEditing ? 'div' : 'label';

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
          ${isEditing
      ? `
              <input
                class="task-card__input"
                type="text"
                data-task-id="${task.id}"
                aria-label="Editar título"
              />
            `
      : `
              <h3 class="task-card__title"></h3>
            `
    }

          <span class="prio prio--${normalizedPriority}"></span>
        </div>
      </${mainTag}>

      <div class="task-card__footer">
        <span class="task-card__cat"></span>

        <div class="task-card__actions">
          ${isEditing
      ? `
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
            `
      : `
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
                aria-label="Borrar tarea ${task.title}"
              >
                <i data-lucide="trash-2" aria-hidden="true"></i>
              </button>
            `
    }
        </div>
      </div>
    </div>
  </div>
`;

  const titleEl = li.querySelector('.task-card__title');
  const inputEl = li.querySelector('.task-card__input');
  const catEl = li.querySelector('.task-card__cat');
  const prioEl = li.querySelector('.prio');

  if (titleEl) titleEl.textContent = task.title;
  if (inputEl) inputEl.value = task.title;
  if (catEl) catEl.textContent = task.category || categories[0] || 'Personal';
  if (prioEl) prioEl.textContent = setPriorityLabel(task.priority);

  return li;
}

function renderSelectedFilters() {
  if (!selectedFiltersList) return;

  selectedFiltersList.innerHTML = '';

  if (filtersState.status !== 'all') {
    const li = document.createElement('li');
    li.innerHTML = `
      <button
        type="button"
        class="chip filter-chip remove-filter"
        data-status="${filtersState.status}"
        aria-label="Quitar filtro de estado ${setStatusLabel(filtersState.status)}"
      >
        <span>${setStatusLabel(filtersState.status)}</span>
        <i data-lucide="x" aria-hidden="true"></i>
      </button>
    `;
    selectedFiltersList.appendChild(li);
  }

  filtersState.priorities.forEach((priority) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <button
        type="button"
        class="chip filter-chip remove-filter"
        data-priority="${priority}"
        aria-label="Quitar filtro de prioridad ${setPriorityLabel(priority)}"
      >
        <span>${setPriorityLabel(priority)}</span>
        <i data-lucide="x" aria-hidden="true"></i>
      </button>
    `;
    selectedFiltersList.appendChild(li);
  });

  filtersState.categories.forEach((categoryKey) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <button
        type="button"
        class="chip filter-chip remove-filter"
        data-category="${categoryKey}"
        aria-label="Quitar filtro ${getCategoryLabel(categoryKey)}"
      >
        <span>${getCategoryLabel(categoryKey)}</span>
        <i data-lucide="x" aria-hidden="true"></i>
      </button>
    `;
    selectedFiltersList.appendChild(li);
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
    selectedFiltersList.appendChild(li);
  }
}

function renderClearFiltersButton() {
  if (!btnClearFilters) return;
  btnClearFilters.hidden = !hasActiveFilters();
}

function renderActionButtons() {
  if (btnToggleLayout) {
    btnToggleLayout.setAttribute('aria-pressed', String(isListLayout));

    const icon = btnToggleLayout.querySelector('i');
    const text = btnToggleLayout.querySelector('span');

    if (icon) {
      icon.setAttribute('data-lucide', isListLayout ? 'layout-grid' : 'rows-3');
    }

    if (text) {
      text.textContent = isListLayout ? 'Vista grid' : 'Vista lista';
    }
  }

  if (btnCompleteAllTasks) {
    const icon = btnCompleteAllTasks.querySelector('i');
    const text = btnCompleteAllTasks.querySelector('span');
    const areAllCompleted = tasks.length > 0 && tasks.every((task) => task.done);

    if (icon) {
      icon.setAttribute('data-lucide', areAllCompleted ? 'rotate-ccw' : 'check-check');
    }

    if (text) {
      text.textContent = areAllCompleted ? 'Desmarcar todas' : 'Completar todas';
    }
  }

  if (taskGrid) {
    taskGrid.classList.toggle('is-list', isListLayout);
  }
}

function renderTasksList() {
  if (!taskList) return;

  const filteredTasks = getFilteredTasks();
  taskList.innerHTML = '';

  [...filteredTasks].reverse().forEach((task) => {
    taskList.appendChild(renderTask(task));
  });

  renderSelectedFilters();
  renderClearFiltersButton();

  if (window.lucide) {
    window.lucide.createIcons();
  }

  if (editingTaskId !== null) {
    const input = taskList.querySelector(`.task-card__input[data-task-id="${editingTaskId}"]`);

    if (input) {
      input.focus();
      input.select();
    }
  }
}

function updateTaskCounter() {
  const total = tasks.length;
  taskCount.forEach((node) => {
    node.textContent = total;
  });
}

function doneTasksCount() {
  const done = tasks.filter((task) => task.done).length;
  const doneCounter = document.querySelector('.stats__done');
  const fill = document.querySelector('.stats__fill');
  const progressBar = document.querySelector('.stats__bar');
  const percent = tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100);

  if (doneCounter) doneCounter.textContent = done;
  if (fill) fill.style.width = `${percent}%`;
  if (progressBar) progressBar.setAttribute('aria-valuenow', String(percent));
}

function refreshUI() {
  renderTasksList();
  renderActionButtons();
  updateTaskCounter();
  doneTasksCount();
}

function bindDesktopForm() {
  const desktopForm = document.querySelector('.task-form');
  if (!desktopForm) return;

  desktopForm.addEventListener('submit', (event) => {
    event.preventDefault();
    addTaskFromDesktopForm();
  });
}

function bindListEvents() {
  if (!taskList) return;

  taskList.addEventListener('click', (event) => {
    const clickedButton = event.target.closest('button');
    const clickedInput = event.target.closest('.task-card__input');
    const clickedCard = event.target.closest('.task-card');

    if (clickedCard && !clickedButton && !clickedInput) {
      const checkbox = clickedCard.parentElement.querySelector('.task-item__toggle');

      if (checkbox) {
        checkbox.checked = !checkbox.checked;

        const rawId = checkbox.id.replace('task-', '');
        const taskId = Number(rawId);

        if (taskId) {
          toggleTask(taskId, checkbox.checked);
        }
      }

      return;
    }

    const editBtn = event.target.closest('.task-card__edit');
    if (editBtn) {
      event.preventDefault();
      event.stopPropagation();

      const taskId = Number(editBtn.dataset.taskId);
      if (!taskId) return;

      startTaskEdit(taskId);
      return;
    }

    const saveBtn = event.target.closest('.task-card__save');
    if (saveBtn) {
      event.preventDefault();
      event.stopPropagation();

      const taskId = Number(saveBtn.dataset.taskId);
      const input = taskList.querySelector(`.task-card__input[data-task-id="${taskId}"]`);

      if (!taskId || !input) return;

      const result = updateTaskTitle(taskId, input.value);

      if (!result.ok) {
        alert('El título no puede estar vacío.');
        input.focus();
        input.select();
      }

      return;
    }

    const cancelBtn = event.target.closest('.task-card__cancel');
    if (cancelBtn) {
      event.preventDefault();
      event.stopPropagation();
      cancelTaskEdit();
      return;
    }

    const deleteBtn = event.target.closest('.task-card__del');
    if (deleteBtn) {
      event.preventDefault();
      event.stopPropagation();

      const taskId = Number(deleteBtn.dataset.taskId);
      if (!taskId) return;

      removeTask(taskId);
      return;
    }
  });

  taskList.addEventListener('keydown', (event) => {
    const input = event.target.closest('.task-card__input');
    if (!input) return;

    const taskId = Number(input.dataset.taskId);
    if (!taskId) return;

    if (event.key === 'Enter') {
      event.preventDefault();

      const result = updateTaskTitle(taskId, input.value);

      if (!result.ok) {
        alert('El título no puede estar vacío.');
        input.focus();
        input.select();
      }
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelTaskEdit();
    }
  });

  taskList.addEventListener('change', (event) => {
    const checkbox = event.target.closest('.task-item__toggle');
    if (!checkbox) return;

    const rawId = checkbox.id.replace('task-', '');
    const taskId = Number(rawId);
    if (!taskId) return;

    toggleTask(taskId, checkbox.checked);
  });
}

function bindSearchEvents() {
  if (!taskSearch) return;

  taskSearch.addEventListener('input', () => {
    syncFiltersState();
    refreshUI();
  });

  taskSearch.addEventListener('search', () => {
    syncFiltersState();
    refreshUI();
  });
}

function bindFilterEvents() {
  if (filterPanel) {
    filterPanel.addEventListener('change', (event) => {
      const target = event.target;

      if (!target.matches('input[name="status"], input[name="priority"], input[name="cat"]')) {
        return;
      }

      syncFiltersState();
      refreshUI();
    });
  }

  if (btnClearFilters) {
    btnClearFilters.addEventListener('click', clearAllFilters);
  }

  if (!selectedFiltersList) return;

  selectedFiltersList.addEventListener('click', (event) => {
    const btnClearAll = event.target.closest('.clear-all-filters');
    if (btnClearAll) {
      clearAllFilters();
      return;
    }

    const removeBtn = event.target.closest('.remove-filter');
    if (!removeBtn) return;

    const category = removeBtn.dataset.category;
    const priority = removeBtn.dataset.priority;
    const status = removeBtn.dataset.status;

    if (category) {
      filtersState.categories = filtersState.categories.filter((item) => item !== category);
    }

    if (priority) {
      filtersState.priorities = filtersState.priorities.filter((item) => item !== priority);
    }

    if (status) {
      filtersState.status = 'all';
    }

    saveFiltersState();
    applyFiltersToDOM();
    refreshUI();
  });
}

function bindCategoryEvents() {
  if (btnNewCategory) {
    btnNewCategory.addEventListener('click', () => {
      if (!newCategoryEditor) return;

      if (newCategoryEditor.hidden) {
        openNewCategoryEditor();
      } else {
        closeNewCategoryEditor();
      }
    });
  }

  if (btnToggleCategoryManage) {
    btnToggleCategoryManage.addEventListener('click', () => {
      isManagingCategories = !isManagingCategories;
      editingCategoryKey = null;
      updateCategoryManageMode();
      renderCategoryManager();

      if (window.lucide) {
        window.lucide.createIcons();
      }
    });
  }

  if (btnCancelNewCategory) {
    btnCancelNewCategory.addEventListener('click', closeNewCategoryEditor);
  }

  if (btnSaveNewCategory) {
    btnSaveNewCategory.addEventListener('click', () => {
      const result = addCategory(newCategoryInput?.value);

      if (!result.ok) {
        if (result.error === 'duplicate') {
          alert('Esa categoría ya existe.');
        } else {
          alert('Escribe un nombre de categoría válido.');
        }

        newCategoryInput?.focus();
        return;
      }

      if (taskCategory) {
        taskCategory.value = result.category;
      }

      closeNewCategoryEditor();
      refreshUI();
    });
  }

  if (newCategoryInput) {
    newCategoryInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        btnSaveNewCategory?.click();
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        closeNewCategoryEditor();
      }
    });
  }

  if (!categoryManagerList) return;

  categoryManagerList.addEventListener('click', (event) => {
    const editBtn = event.target.closest('[data-category-edit]');
    if (editBtn) {
      editingCategoryKey = editBtn.dataset.categoryEdit;
      renderCategoryManager();

      const input = categoryManagerList.querySelector(`[data-category-input="${editingCategoryKey}"]`);
      if (input) {
        input.focus();
        input.select();
      }

      if (window.lucide) {
        window.lucide.createIcons();
      }
      return;
    }

    const cancelBtn = event.target.closest('[data-category-cancel]');
    if (cancelBtn) {
      editingCategoryKey = null;
      renderCategoryManager();

      if (window.lucide) {
        window.lucide.createIcons();
      }
      return;
    }

    const saveBtn = event.target.closest('[data-category-save]');
    if (saveBtn) {
      const key = saveBtn.dataset.categorySave;
      const input = categoryManagerList.querySelector(`[data-category-input="${key}"]`);
      const result = renameCategory(key, input?.value || '');

      if (!result.ok) {
        if (result.error === 'duplicate') {
          alert('Esa categoría ya existe.');
        } else {
          alert('No se pudo guardar la categoría.');
        }

        input?.focus();
        input?.select();
      }

      return;
    }

    const deleteBtn = event.target.closest('[data-category-delete]');
    if (deleteBtn) {
      const key = deleteBtn.dataset.categoryDelete;
      const result = removeCategory(key);

      if (!result.ok) {
        if (result.error === 'in-use') {
          alert('No puedes borrar esa categoría porque está asignada a tareas.');
          return;
        }

        if (result.error === 'last-category') {
          alert('Debe quedar al menos una categoría.');
          return;
        }

        alert('No se pudo borrar la categoría.');
      }
    }
  });

  categoryManagerList.addEventListener('keydown', (event) => {
    const input = event.target.closest('.category-row__input');
    if (!input) return;

    const key = input.dataset.categoryInput;

    if (event.key === 'Enter') {
      event.preventDefault();
      const result = renameCategory(key, input.value);

      if (!result.ok) {
        if (result.error === 'duplicate') {
          alert('Esa categoría ya existe.');
        } else {
          alert('No se pudo guardar la categoría.');
        }

        input.focus();
        input.select();
      }
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      editingCategoryKey = null;
      renderCategoryManager();

      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  });
}

function bindTaskActionEvents() {
  if (btnToggleLayout) {
    btnToggleLayout.addEventListener('click', toggleLayoutMode);
  }

  if (btnCompleteAllTasks) {
    btnCompleteAllTasks.addEventListener('click', completeAllTasks);
  }

  if (btnDeleteAllTasks) {
    btnDeleteAllTasks.addEventListener('click', removeAllTasks);
  }
}

function init() {
  loadTasks();
  loadCategories();
  refreshCategoriesUI();
  loadFiltersState();
  loadLayoutMode();
  bindDesktopForm();
  bindListEvents();
  bindSearchEvents();
  bindFilterEvents();
  bindCategoryEvents();
  bindTaskActionEvents();
  refreshUI();

  if (typeof window.initFiltersDrawer === 'function') {
    window.initFiltersDrawer();
  }
}

window.TaskFlowApp = {
  addTaskFromData,
  addCategory,
  getCategories() {
    return [...categories];
  },
  getDesktopDefaults() {
    return {
      category: taskCategory ? taskCategory.value : categories[0] || 'Personal',
      priority: taskPriority ? taskPriority.value : 'Media'
    };
  },
  getFilteredCountByState({ status = 'all', priorities = [], categories: inputCategories = [], search = '' } = {}) {
    const tempFilters = {
      status,
      priorities,
      categories: inputCategories.map((item) => normalizeText(item)),
      search: normalizeText(search)
    };

    return tasks.filter((task) => taskMatchesFilters(task, tempFilters)).length;
  },
  refreshUI,
  refreshCategoriesUI
};

document.addEventListener('DOMContentLoaded', init);
