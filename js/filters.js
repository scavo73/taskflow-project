// =====================================================
// FILTERS (TaskFlow)
// =====================================================
// Sobrescribe funciones existentes moviendolas a un módulo real.

/**
 * Resetea el estado de filtros al valor por defecto y (opcionalmente) persiste y aplica a la UI.
 * @param {{persist?:boolean, preserveStatus?:boolean}} param0
 * @returns {void}
 */
function resetFiltersState({ persist = true, preserveStatus = false } = {}) {
  const nextStatus = preserveStatus ? filtersState.status : 'all';

  filtersState = getDefaultFiltersState();
  filtersState.status = nextStatus;

  if (persist) {
    saveFiltersState();
  }

  applyFiltersToDOM();
}

/**
 * Lee filtros desde el DOM (nav de estado, checkboxes de prioridad/categoría y buscador) y devuelve un modelo normalizado.
 * @returns {{status:string,priorities:string[],categories:string[],search:string}}
 */
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

/**
 * Aplica `filtersState` sobre el DOM: activa nav, marca inputs y sincroniza el buscador.
 * @returns {void}
 */
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

/**
 * Sincroniza el `filtersState` leyendo el DOM y persistiendo el nuevo estado.
 * @returns {void}
 */
function syncFiltersState() {
  filtersState = getFiltersFromDOM();
  saveFiltersState();
}

/**
 * @returns {boolean} `true` si hay filtros activos (prioridad/categoría/búsqueda).
 */
function hasActiveFilters() {
  return (
    filtersState.priorities.length > 0 ||
    filtersState.categories.length > 0 ||
    filtersState.search !== ''
  );
}

/**
 * @returns {boolean} `true` si la vista actual no es la vista por defecto.
 */
function hasActiveTaskView() {
  return filtersState.status !== 'all' || hasActiveFilters();
}

/**
 * Borra todos los filtros preservando el estado de status (pending/done) y refresca la UI.
 * @returns {void}
 */
function clearAllFilters() {
  resetFiltersState({ preserveStatus: true });
  refreshUI();
}

/**
 * Función pura de match: determina si una tarea cumple un set de filtros.
 * @param {{title:string,category:string,priority:string,done:boolean}} task
 * @param {{status:string,priorities:string[],categories:string[],search:string}} filters
 * @returns {boolean}
 */
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

/**
 * Obtiene las tareas visibles según `filtersState`.
 * @returns {object[]}
 */
function getFilteredTasks() {
  return tasks.filter((task) => taskMatchesFilters(task, filtersState));
}

