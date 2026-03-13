function initFiltersDrawer() {
  const mediaQuery = window.matchMedia('(max-width: 768px)');
  const sidebar = document.querySelector('.sidebar');
  const statsActions = document.querySelector('.stats__actions');

  if (!sidebar || !statsActions) return;

  const panel = sidebar.querySelector('.filter-panel');
  const title = sidebar.querySelector('.panel__title');

  if (!panel || !title) return;
  if (!sidebar.id) sidebar.id = 'mobileFiltersPanel';
  if (document.querySelector('.filters-btn')) return;

  const btnFilters = document.createElement('button');
  btnFilters.type = 'button';
  btnFilters.className = 'filters-btn';
  btnFilters.setAttribute('aria-controls', sidebar.id);
  btnFilters.setAttribute('aria-expanded', 'false');
  btnFilters.setAttribute('aria-label', 'Abrir filtros');
  btnFilters.innerHTML = '<i data-lucide="list-filter" aria-hidden="true"></i>';
  statsActions.appendChild(btnFilters);

  const backdrop = document.createElement('div');
  backdrop.className = 'filters-backdrop';
  backdrop.hidden = true;
  document.body.appendChild(backdrop);

  const handle = document.createElement('div');
  handle.className = 'filters-handle';
  handle.setAttribute('aria-hidden', 'true');

  const mobileHead = document.createElement('div');
  mobileHead.className = 'filters-head';

  const mobileTitle = document.createElement('h2');
  mobileTitle.className = 'sec-head__title';
  mobileTitle.textContent = title.textContent;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'filters-close';
  closeBtn.setAttribute('aria-label', 'Cerrar filtros');
  closeBtn.innerHTML = '<i data-lucide="x" aria-hidden="true"></i>';

  mobileHead.append(mobileTitle, closeBtn);
  panel.insertBefore(handle, panel.firstChild);
  panel.insertBefore(mobileHead, handle.nextSibling);

  const footer = document.createElement('div');
  footer.className = 'filters-footer';

  const btnCancel = document.createElement('button');
  btnCancel.type = 'button';
  btnCancel.className = 'filters-cancel';
  btnCancel.textContent = 'Cancelar';

  const btnApply = document.createElement('button');
  btnApply.type = 'button';
  btnApply.className = 'filters-apply';
  btnApply.textContent = 'Ver resultados';

  footer.append(btnCancel, btnApply);
  panel.appendChild(footer);

  let lastActive = null;
  let firstSnapshot = null;

  function isMobile() {
    return mediaQuery.matches;
  }

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function hideButton() {
    btnFilters.classList.add('is-hidden');
  }

  function showButton() {
    if (!isMobile()) return;
    btnFilters.classList.remove('is-hidden');
  }

  function getStatusInputs() {
    return [...sidebar.querySelectorAll('input[name="status"]')];
  }

  function getPriorityInputs() {
    return [...sidebar.querySelectorAll('input[name="priority"]')];
  }

  function getCategoryInputs() {
    return [...sidebar.querySelectorAll('input[name="cat"]')];
  }

  function readCurrentState() {
    const status = sidebar.querySelector('input[name="status"]:checked')?.value || 'all';

    const priorities = getPriorityInputs()
      .filter((input) => input.checked)
      .map((input) => input.value);

    const categories = getCategoryInputs()
      .filter((input) => input.checked)
      .map((input) => input.value.toLowerCase());

    return { status, priorities, categories };
  }

  function saveSnapshot() {
    firstSnapshot = readCurrentState();
  }

  function syncAppWithInputs() {
    const selectedStatus = sidebar.querySelector('input[name="status"]:checked');

    if (selectedStatus) {
      selectedStatus.dispatchEvent(new Event('change', { bubbles: true }));
    }

    getPriorityInputs().forEach((input) => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    getCategoryInputs().forEach((input) => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    if (typeof window.TaskFlowApp?.refreshUI === 'function') {
      window.TaskFlowApp.refreshUI();
    }
  }

  function restoreSnapshot() {
    if (!firstSnapshot) return;

    getStatusInputs().forEach((input) => {
      input.checked = input.value === firstSnapshot.status;
    });

    getPriorityInputs().forEach((input) => {
      input.checked = firstSnapshot.priorities.includes(input.value);
    });

    getCategoryInputs().forEach((input) => {
      input.checked = firstSnapshot.categories.includes(input.value.toLowerCase());
    });

    syncAppWithInputs();
  }

  function updateResultsButton() {
    const currentState = readCurrentState();
    let total = null;

    if (typeof window.TaskFlowApp?.getFilteredCountByState === 'function') {
      total = window.TaskFlowApp.getFilteredCountByState(currentState);
    }

    if (total === null) {
      total = document.querySelectorAll('#taskList .task-list__item').length;
    }

    btnApply.textContent = total === 1 ? 'Ver 1 resultado' : `Ver ${total} resultados`;
  }

  function openDrawer() {
    if (!isMobile()) return;

    lastActive = document.activeElement;
    saveSnapshot();
    updateResultsButton();

    sidebar.classList.add('is-open');
    backdrop.hidden = false;
    backdrop.classList.add('is-visible');
    document.body.classList.add('filters-open');

    btnFilters.setAttribute('aria-expanded', 'true');
    hideButton();
    closeBtn.focus();
  }

  function closeDrawer({ restore = false } = {}) {
    if (restore) {
      restoreSnapshot();
    }

    sidebar.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    backdrop.hidden = true;
    document.body.classList.remove('filters-open');

    btnFilters.setAttribute('aria-expanded', 'false');
    showButton();

    if (lastActive && typeof lastActive.focus === 'function') {
      lastActive.focus();
    } else {
      btnFilters.focus();
    }
  }

  function applyChanges() {
    syncAppWithInputs();
    closeDrawer({ restore: false });
  }

  function cancelChanges() {
    closeDrawer({ restore: true });
  }

  function toggleDrawer() {
    if (sidebar.classList.contains('is-open')) {
      cancelChanges();
    } else {
      openDrawer();
    }
  }

  function updateMode() {
    if (isMobile()) {
      btnFilters.hidden = false;
      sidebar.setAttribute('aria-modal', 'true');
      sidebar.setAttribute('role', 'dialog');

      if (!sidebar.classList.contains('is-open')) {
        showButton();
      }
    } else {
      sidebar.classList.remove('is-open');
      backdrop.classList.remove('is-visible');
      backdrop.hidden = true;
      document.body.classList.remove('filters-open');

      btnFilters.hidden = true;
      btnFilters.classList.remove('is-hidden');
      btnFilters.setAttribute('aria-expanded', 'false');

      sidebar.removeAttribute('aria-modal');
      sidebar.removeAttribute('role');
    }
  }

  btnFilters.addEventListener('click', toggleDrawer);
  closeBtn.addEventListener('click', cancelChanges);
  btnCancel.addEventListener('click', cancelChanges);
  btnApply.addEventListener('click', applyChanges);
  backdrop.addEventListener('click', cancelChanges);

  sidebar.addEventListener('change', () => {
    if (!sidebar.classList.contains('is-open')) return;
    updateResultsButton();
  });

  sidebar.addEventListener('input', () => {
    if (!sidebar.classList.contains('is-open')) return;
    updateResultsButton();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sidebar.classList.contains('is-open')) {
      cancelChanges();
    }
  });

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', updateMode);
  } else {
    mediaQuery.addListener(updateMode);
  }

  updateMode();
  refreshIcons();
}

window.initFiltersDrawer = initFiltersDrawer;
