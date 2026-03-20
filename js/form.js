// =====================================================
// FORM + DOMAIN ACTIONS (TaskFlow)
// =====================================================

/**
 * Persiste las preferencias del formulario de tarea (categoría y prioridad) en `localStorage`.
 * Usado principalmente por el formulario de escritorio.
 */
function saveTaskFormPrefs() {
  writeStorage(LS_FORM_PREFS_KEY, {
    category: dom.taskCategory?.value || categories[0] || 'Personal',
    priority: dom.taskPriority?.value || 'Media'
  });
}

/**
 * Carga las preferencias guardadas del formulario (categoría/prioridad) y aplica valores por defecto si no existen.
 * @returns {void}
 */
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

// =====================================================
// TASKS (domain mutations)
// =====================================================

/**
 * Crea un objeto tarea con formato interno del app.
 * @param {{title:string, category:string, priority:string}} param0
 * @returns {{id:number,title:string,category:string,priority:string,done:boolean}}
 */
function createTaskData({ title, category, priority }) {
  return {
    id: nextId++,
    title: String(title || '').trim(),
    category: String(category || categories[0] || 'Personal').trim(),
    priority: priority || 'Media',
    done: false
  };
}

/**
 * Obtiene una tarea por id (si existe).
 * @param {number} taskId
 * @returns {object|undefined}
 */
function getTaskById(taskId) {
  return tasks.find((task) => task.id === taskId);
}

/**
 * Añade una tarea validando el título.
 * @param {{title:string, category:string, priority:string}} param0
 * @returns {{ok:true,task:object}|{ok:false,error:string}}
 */
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

/**
 * Añade una tarea usando valores del formulario de escritorio.
 * (Incluye validación del título a través de `addTaskFromData`).
 * @returns {void}
 */
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

/**
 * Pone una tarea en modo edición y refresca la UI.
 * @param {number} taskId
 */
function startTaskEdit(taskId) {
  if (!getTaskById(taskId)) return;
  editingTaskId = taskId;
  refreshUI();
}

/**
 * Cancela la edición actual y refresca la UI.
 * @returns {void}
 */
function cancelTaskEdit() {
  if (editingTaskId === null) return;
  editingTaskId = null;
  refreshUI();
}

/**
 * Actualiza el título de una tarea validando que no sea vacío.
 * @param {number} taskId
 * @param {string} rawTitle
 * @returns {{ok:true,task:object}|{ok:false,error:string}}
 */
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

/**
 * Elimina una tarea por id, re-aplica filtros si quedan cero tareas y refresca la UI.
 * @param {number} taskId
 */
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

/**
 * Marca/desmarca una tarea como completada y persiste el cambio.
 * @param {number} taskId
 * @param {boolean} isDone
 */
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

  const pendingTasks = visibleTasks.filter((task) => !task.done);
  const completedTasks = visibleTasks.filter((task) => task.done);

  const areAllVisibleCompleted = pendingTasks.length === 0;
  const tasksToToggle = areAllVisibleCompleted ? completedTasks : pendingTasks;

  if (tasksToToggle.length === 0) return;

  const taskCount = tasksToToggle.length;
  const confirmToggleMessage = getConfirmationMessage(areAllVisibleCompleted, taskCount);
  if (!confirm(confirmToggleMessage)) return;

  const idsToToggle = new Set(tasksToToggle.map((task) => task.id));
  tasks = tasks.map((task) =>
    idsToToggle.has(task.id) ? { ...task, done: !areAllVisibleCompleted } : task
  );

  commit({ saveTasks: true });

  // ----- Helpers -----
  function getConfirmationMessage(allCompleted, count) {
    if (allCompleted) {
      return `¿Seguro que quieres desmarcar ${count} ${
        count === 1 ? 'tarea visible completada' : 'tareas visibles completadas'
      }?`;
    }
    return `¿Seguro que quieres completar ${count} ${
      count === 1 ? 'tarea visible pendiente' : 'tareas visibles pendientes'
    }?`;
  }
}

// removes visible tasks
function removeVisibleTasks() {
  const visibleTasks = getFilteredTasks();
  if (visibleTasks.length === 0) return;

  const visibleIds = new Set(visibleTasks.map((task) => task.id));
  const visibleCount = visibleTasks.length;

  const message = isDefaultTaskView()
    ? `¿Seguro que quieres borrar ${visibleCount} ${visibleCount === 1 ? 'tarea' : 'tareas'}? Esta acción no se puede deshacer.`
    : `¿Seguro que quieres borrar ${visibleCount} ${
      visibleCount === 1 ? 'tarea visible' : 'tareas visibles'
    }? Esta acción no se puede deshacer.`;

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
// CATEGORIES (domain mutations + editor UI state)
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

