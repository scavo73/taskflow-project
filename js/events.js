// =====================================================
// EVENTS + DRAG & DROP (TaskFlow)
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

// binds the desktop form events
function bindDesktopForm() {
  if (!dom.desktopForm) return;

  dom.desktopForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await addTaskFromDesktopForm();
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

  async function handleCardClick(event, card) {
    const checkbox = card.parentElement.querySelector('.task-item__toggle');
    if (!checkbox) return;
  
    checkbox.checked = !checkbox.checked;
    const taskId = Number(checkbox.id.replace('task-', ''));
    if (!taskId) return;
  
    const result = await toggleTask(taskId, checkbox.checked);
    if (!result.ok) {
      checkbox.checked = !checkbox.checked;
      alert(result.error || 'No se pudo actualizar la tarea.');
    }
  }

  function handleEditTask(event, editBtn) {
    event.preventDefault();
    event.stopPropagation();
    const taskId = Number(editBtn.dataset.taskId);
    if (taskId) startTaskEdit(taskId);
  }

  async function handleSaveTask(event, saveBtn) {
    event.preventDefault();
    event.stopPropagation();
  
    const taskId = Number(saveBtn.dataset.taskId);
    const input = dom.taskList.querySelector(`.task-card__input[data-task-id="${taskId}"]`);
    if (!taskId || !input) return;
  
    const result = await updateTaskTitle(taskId, input.value);
    if (!result.ok) {
      showFieldError(result.error || 'El título no es válido.', input);
    }
  }

  function handleCancelTask(event) {
    event.preventDefault();
    event.stopPropagation();
    cancelTaskEdit();
  }

  async function handleDeleteTask(event, deleteBtn) {
    event.preventDefault();
    event.stopPropagation();
  
    const taskId = Number(deleteBtn.dataset.taskId);
    if (!taskId) return;
  
    const result = await removeTask(taskId);
    if (!result.ok) {
      alert(result.error || 'No se pudo borrar la tarea.');
    }
  }

  dom.taskList.addEventListener('click', async (event) => {
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
      await handleCardClick(event, clickedCard);
      return;
    }
  
    const editBtn = event.target.closest('.task-card__edit');
    if (editBtn) {
      handleEditTask(event, editBtn);
      return;
    }
  
    const saveBtn = event.target.closest('.task-card__save');
    if (saveBtn) {
      await handleSaveTask(event, saveBtn);
      return;
    }
  
    const cancelBtn = event.target.closest('.task-card__cancel');
    if (cancelBtn) {
      handleCancelTask(event);
      return;
    }
  
    const deleteBtn = event.target.closest('.task-card__del');
    if (deleteBtn) {
      await handleDeleteTask(event, deleteBtn);
    }
  });

  dom.taskList.addEventListener('keydown', async (event) => {
    const input = event.target.closest('.task-card__input');
    if (!input) return;
  
    const taskId = Number(input.dataset.taskId);
    if (!taskId) return;
  
    if (event.key === 'Enter') {
      event.preventDefault();
      const result = await updateTaskTitle(taskId, input.value);
      if (!result.ok) {
        showFieldError(result.error || 'El título no puede estar vacío.', input);
      }
      return;
    }
  
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelTaskEdit();
    }
  });

  dom.taskList.addEventListener('change', async (event) => {
    const checkbox = event.target.closest('.task-item__toggle');
    if (!checkbox) return;
  
    const taskId = Number(checkbox.id.replace('task-', ''));
    if (!taskId) return;
  
    const result = await toggleTask(taskId, checkbox.checked);
    if (!result.ok) {
      checkbox.checked = !checkbox.checked;
      alert(result.error || 'No se pudo actualizar la tarea.');
    }
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
  dom.taskTitle?.addEventListener('input', saveTaskFormPrefs);
}

