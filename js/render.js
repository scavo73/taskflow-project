// =====================================================
// RENDER (TaskFlow)
// =====================================================

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

/**
 * Renderiza una tarea como elemento DOM (`<li>`).
 * Si la tarea está en edición (`editingTaskId`), muestra un `<input>` para el título.
 * @param {{id:number,title:string,category:string,priority:string,done:boolean}} task
 * @returns {HTMLLIElement}
 */
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

/**
 * Estado "sin resultados" cuando hay filtros activos pero no hay coincidencias.
 * @returns {HTMLLIElement}
 */
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

/**
 * Estado inicial cuando no hay ninguna tarea creada.
 * @returns {HTMLLIElement}
 */
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

/**
 * Crea un chip visual para los filtros seleccionados.
 * @param {{label:string,ariaLabel:string,dataName:string,dataValue:string}} param0
 * @returns {HTMLLIElement}
 */
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

/**
 * Renderiza los chips de filtros activos en la barra `selectedFiltersList`.
 * @returns {void}
 */
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

/**
 * Muestra/oculta el botón "Limpiar filtros" según existan filtros activos.
 * @returns {void}
 */
function renderClearFiltersButton() {
  if (!dom.btnClearFilters) return;
  dom.btnClearFilters.hidden = !hasActiveFilters();
}

/**
 * Oculta/mostra la zona lateral, acciones y stats cuando no hay tareas.
 * @returns {void}
 */
function renderEmptyLayoutVisibility() {
  const hasTasks = tasks.length > 0;

  if (dom.filterPanel) dom.aside.hidden = !hasTasks;
  if (dom.statsPanel) dom.statsPanel.hidden = !hasTasks;
  if (dom.taskActions) dom.taskActions.hidden = !hasTasks;

  document.body.classList.toggle('has-no-tasks', !hasTasks);
}

/**
 * Actualiza labels/disabled de los botones de acciones basándose en tareas visibles y filtros.
 * @returns {void}
 */
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

/**
 * Render principal de la lista: decide entre (1) primera tarea, (2) no-results,
 * o (3) lista de tareas filtradas.
 * @returns {void}
 */
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

/**
 * Renderiza los contadores y la barra de progreso.
 * @returns {void}
 */
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

