// =====================================================
// FILTERS (TaskFlow)
// =====================================================
// Sobrescribe funciones existentes moviendolas a un módulo real.

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

