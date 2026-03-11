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

const taskCount = document.querySelectorAll('.task-count');
const categoryInputs = document.querySelectorAll('input[name="cat"]');
const priorityInputs = document.querySelectorAll('input[name="priority"]');
const statusInputs = document.querySelectorAll('input[name="status"]');

const LS_KEY = 'taskflow_tasks';
const LS_FILTERS_KEY = 'taskflow_selected_categories';
const LS_PRIORITY_KEY = 'taskflow_selected_priority';
const LS_STATUS_KEY = 'taskflow_selected_status';
const LS_SEARCH_KEY = 'taskflow_search_text';
const LS_LAYOUT_KEY = 'taskflow_layout_mode';

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

function syncGlobalTasks() {
  window.tasks = tasks;
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function normalizePriority(value) {
  const v = String(value || '').toLowerCase().trim();

  if (v === 'alta' || v === 'high') return 'high';
  if (v === 'media' || v === 'med' || v === 'medium') return 'med';
  if (v === 'baja' || v === 'low') return 'low';

  return 'med';
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

function setCategoryLabel(value) {
  if (value === 'trabajo') return 'Trabajo';
  if (value === 'estudio') return 'Estudio';
  if (value === 'personal') return 'Personal';
  return 'Salud';
}

function getSelectedCategories() {
  return [...categoryInputs]
    .filter((input) => input.checked)
    .map((input) => input.value.toLowerCase());
}

function getSelectedPriorities() {
  return [...priorityInputs]
    .filter((input) => input.checked)
    .map((input) => input.value);
}

function getSelectedStatus() {
  return document.querySelector('input[name="status"]:checked')?.value || 'all';
}

function getSearchTerm() {
  return taskSearch ? taskSearch.value.trim() : '';
}

function hasActiveFilters() {
  return (
    getSelectedStatus() !== 'all' ||
    getSelectedPriorities().length > 0 ||
    getSelectedCategories().length > 0
  );
}

function clearAllFilters() {
  statusInputs.forEach((input) => {
    input.checked = input.value === 'all';
  });

  priorityInputs.forEach((input) => {
    input.checked = false;
  });

  categoryInputs.forEach((input) => {
    input.checked = false;
  });

  saveSelectedStatus();
  saveSelectedPriority();
  saveSelectedFilters();
  refreshUI();
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

function loadSelectedFilters() {
  let savedCategories = [];

  try {
    savedCategories = JSON.parse(localStorage.getItem(LS_FILTERS_KEY)) || [];
  } catch {
    savedCategories = [];
  }

  categoryInputs.forEach((input) => {
    input.checked = savedCategories.includes(input.value.toLowerCase());
  });
}

function saveSelectedFilters() {
  localStorage.setItem(LS_FILTERS_KEY, JSON.stringify(getSelectedCategories()));
}

function saveSelectedPriority() {
  localStorage.setItem(LS_PRIORITY_KEY, JSON.stringify(getSelectedPriorities()));
}

function loadSelectedPriority() {
  let savedPriorities = [];

  try {
    savedPriorities = JSON.parse(localStorage.getItem(LS_PRIORITY_KEY)) || [];
  } catch {
    savedPriorities = [];
  }

  priorityInputs.forEach((input) => {
    input.checked = savedPriorities.includes(input.value);
  });
}

function saveSelectedStatus() {
  localStorage.setItem(LS_STATUS_KEY, getSelectedStatus());
}

function loadSelectedStatus() {
  const savedStatus = localStorage.getItem(LS_STATUS_KEY) || 'all';

  statusInputs.forEach((input) => {
    input.checked = input.value === savedStatus;
  });
}

function saveSearchTerm() {
  if (!taskSearch) return;
  localStorage.setItem(LS_SEARCH_KEY, taskSearch.value.trim());
}

function loadSearchTerm() {
  if (!taskSearch) return;
  taskSearch.value = localStorage.getItem(LS_SEARCH_KEY) || '';
}

function saveLayoutMode() {
  localStorage.setItem(LS_LAYOUT_KEY, isListLayout ? 'list' : 'grid');
}

function loadLayoutMode() {
  isListLayout = localStorage.getItem(LS_LAYOUT_KEY) === 'list';
}

function getFilteredTasks() {
  const selectedCategories = getSelectedCategories();
  const selectedPriorities = getSelectedPriorities();
  const selectedStatus = getSelectedStatus();
  const searchText = normalizeText(getSearchTerm());

  return tasks.filter((task) => {
    const taskCat = String(task.category || '').toLowerCase().trim();
    const taskPrio = normalizePriority(task.priority);
    const searchableText = normalizeText(`${task.title} ${task.category}`);

    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(taskCat);

    const matchesPriority =
      selectedPriorities.length === 0 || selectedPriorities.includes(taskPrio);

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'pending' && !task.done) ||
      (selectedStatus === 'done' && task.done);

    const matchesSearch =
      searchText === '' || searchableText.includes(searchText);

    return matchesCategory && matchesPriority && matchesStatus && matchesSearch;
  });
}

function createTaskData({ title, category, priority }) {
  return {
    id: nextId++,
    title: title.trim(),
    category: category || 'Personal',
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
    category: taskCategory ? taskCategory.value : 'Personal',
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

          <div class="task-card__bottom">
            <span class="task-card__cat"></span>
          </div>
        </${mainTag}>

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
  `;

  const titleEl = li.querySelector('.task-card__title');
  const inputEl = li.querySelector('.task-card__input');
  const catEl = li.querySelector('.task-card__cat');
  const prioEl = li.querySelector('.prio');

  if (titleEl) titleEl.textContent = task.title;
  if (inputEl) inputEl.value = task.title;
  if (catEl) catEl.textContent = task.category || 'Personal';
  if (prioEl) prioEl.textContent = setPriorityLabel(task.priority);

  return li;
}

function renderSelectedFilters() {
  if (!selectedFiltersList) return;

  selectedFiltersList.innerHTML = '';

  const selectedCategories = getSelectedCategories();
  const selectedPriorities = getSelectedPriorities();
  const selectedStatus = getSelectedStatus();

  if (selectedStatus !== 'all') {
    const li = document.createElement('li');
    li.innerHTML = `
      <button
        type="button"
        class="chip filter-chip remove-filter"
        data-status="${selectedStatus}"
        aria-label="Quitar filtro de estado ${setStatusLabel(selectedStatus)}"
      >
        <span>${setStatusLabel(selectedStatus)}</span>
        <i data-lucide="x" aria-hidden="true"></i>
      </button>
    `;
    selectedFiltersList.appendChild(li);
  }

  selectedPriorities.forEach((priority) => {
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

  selectedCategories.forEach((category) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <button
        type="button"
        class="chip filter-chip remove-filter"
        data-category="${category}"
        aria-label="Quitar filtro ${category}"
      >
        <span>${setCategoryLabel(category)}</span>
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
  taskList.addEventListener('click', (event) => {
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
    saveSearchTerm();
    refreshUI();
  });

  taskSearch.addEventListener('search', () => {
    saveSearchTerm();
    refreshUI();
  });
}

function bindFilterEvents() {
  categoryInputs.forEach((input) => {
    input.addEventListener('change', () => {
      saveSelectedFilters();
      refreshUI();
    });
  });

  priorityInputs.forEach((input) => {
    input.addEventListener('change', () => {
      saveSelectedPriority();
      refreshUI();
    });
  });

  statusInputs.forEach((input) => {
    input.addEventListener('change', () => {
      saveSelectedStatus();
      refreshUI();
    });
  });

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
      const inputCategory = [...categoryInputs].find((input) => input.value.toLowerCase() === category.toLowerCase());
      if (inputCategory) inputCategory.checked = false;
      saveSelectedFilters();
    }

    if (priority) {
      const inputPriority = [...priorityInputs].find((input) => input.value === priority);
      if (inputPriority) inputPriority.checked = false;
      saveSelectedPriority();
    }

    if (status) {
      const allStatus = document.querySelector('input[name="status"][value="all"]');
      if (allStatus) allStatus.checked = true;
      saveSelectedStatus();
    }

    refreshUI();
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
  loadSelectedFilters();
  loadSelectedPriority();
  loadSelectedStatus();
  loadSearchTerm();
  loadLayoutMode();
  bindDesktopForm();
  bindListEvents();
  bindSearchEvents();
  bindFilterEvents();
  bindTaskActionEvents();
  refreshUI();

  if (typeof window.initFiltersDrawer === 'function') {
    window.initFiltersDrawer();
  }
}

window.TaskFlowApp = {
  addTaskFromData,

  getDesktopDefaults() {
    return {
      category: taskCategory ? taskCategory.value : 'Personal',
      priority: taskPriority ? taskPriority.value : 'Media'
    };
  },

  getFilteredCountByState({ status = 'all', priorities = [], categories = [], search = '' } = {}) {
    const searchText = normalizeText(search);

    return tasks.filter((task) => {
      const taskPriority = normalizePriority(task.priority);
      const taskCategory = String(task.category || '').toLowerCase().trim();
      const searchableText = normalizeText(`${task.title} ${task.category}`);

      const matchesStatus =
        status === 'all' ||
        (status === 'pending' && !task.done) ||
        (status === 'done' && task.done);

      const matchesPriority = priorities.length === 0 || priorities.includes(taskPriority);
      const matchesCategory = categories.length === 0 || categories.includes(taskCategory);
      const matchesSearch = searchText === '' || searchableText.includes(searchText);

      return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
    }).length;
  },

  refreshUI
};

document.addEventListener('DOMContentLoaded', init);