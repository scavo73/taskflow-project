// app.js
(() => {
  const tituloTarea = document.getElementById('tituloTarea');
  const listContainer = document.getElementById('listContainer');
  const categoriaTarea = document.getElementById('categoria-tarea');
  const prioridadTarea = document.getElementById('prioridad-tarea');
  const listaFiltrosElegidos = document.getElementById('listaFiltrosElegidos');

  const contadorTareas = document.querySelectorAll('.contador-tareas');
  const nombresCategorias = document.querySelectorAll('input[name="cat"]');
  const inputsPrioridad = document.querySelectorAll('input[name="prioridad"]');

  const LS_KEY = 'taskflow_tasks';
  const LS_FILTERS_KEY = 'taskflow_selected_categories';
  const LS_PRIORITY_KEY = 'taskflow_selected_priority';

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

  function syncGlobalTasks() {
    window.tasks = tasks;
  }

  function normalizePriority(value) {
    const v = String(value || '').toLowerCase().trim();

    if (v === 'alta' || v === 'high') return 'high';
    if (v === 'media' || v === 'med' || v === 'medium') return 'med';
    if (v === 'baja' || v === 'low') return 'low';

    return 'med';
  }

  function getPriorityLabel(value) {
    const normalized = normalizePriority(value);

    if (normalized === 'high') return 'Alta';
    if (normalized === 'low') return 'Baja';
    return 'Media';
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
      console.log('debug mode, cuando se borran todas las tareas se crean demo');
    }

    nextId = tasks.length ? Math.max(...tasks.map(task => task.id)) + 1 : 1;
    syncGlobalTasks();
  }

  function saveTasks() {
    localStorage.setItem(LS_KEY, JSON.stringify(tasks));
    syncGlobalTasks();
  }

  function getSelectedCategories() {
    return [...nombresCategorias]
      .filter(input => input.checked)
      .map(input => input.value.toLowerCase());
  }

  function getSelectedPriority() {
    return document.querySelector('input[name="prioridad"]:checked')?.value || 'all';
  }

  function saveSelectedFilters() {
    localStorage.setItem(LS_FILTERS_KEY, JSON.stringify(getSelectedCategories()));
  }

  function loadSelectedFilters() {
    let savedCategories = [];

    try {
      savedCategories = JSON.parse(localStorage.getItem(LS_FILTERS_KEY)) || [];
    } catch {
      savedCategories = [];
    }

    nombresCategorias.forEach(input => {
      input.checked = savedCategories.includes(input.value.toLowerCase());
    });
  }

  function saveSelectedPriority() {
    localStorage.setItem(LS_PRIORITY_KEY, getSelectedPriority());
  }

  function loadSelectedPriority() {
    const savedPriority = localStorage.getItem(LS_PRIORITY_KEY) || 'all';

    inputsPrioridad.forEach(input => {
      input.checked = input.value === savedPriority;
    });
  }

  function getFilteredTasks() {
    const categoriasSeleccionadas = getSelectedCategories();
    const prioridadSeleccionada = getSelectedPriority();

    return tasks.filter(task => {
      const taskCategory = String(task.category || '').toLowerCase().trim();
      const taskPriority = normalizePriority(task.priority);

      const matchesCategory =
        categoriasSeleccionadas.length === 0 ||
        categoriasSeleccionadas.includes(taskCategory);

      const matchesPriority =
        prioridadSeleccionada === 'all' ||
        taskPriority === prioridadSeleccionada;

      return matchesCategory && matchesPriority;
    });
  }

  function renderTask(task) {
    const li = document.createElement('li');
    li.className = 'lista-tareas__item';

    const normalizedPriority = normalizePriority(task.priority);

    li.innerHTML = `
      <div class="tarea-item">
        <input
          class="tarea-item__toggle"
          type="checkbox"
          id="task-${task.id}"
          ${task.done ? 'checked' : ''}
        />

        <label class="tarea tarea--content" for="task-${task.id}">
          <div class="tarea__up">
            <div class="tarea__check">
              <span class="tarea__titulo"></span>
            </div>

            <span class="badge-prioridad badge-prioridad--${normalizedPriority}"></span>
          </div>

          <div class="tarea__down">
            <div class="tarea__categorias">
              <span class="tarea__categoria"></span>
            </div>

            <button
              class="badge tarea__borrar"
              type="button"
              data-task-id="${task.id}"
              aria-label="Borrar tarea ${task.title}"
            >
              <i data-lucide="trash-2" aria-hidden="true"></i>
            </button>
          </div>
        </label>
      </div>
    `;

    li.querySelector('.tarea__titulo').textContent = task.title;
    li.querySelector('.tarea__categoria').textContent = task.category || 'Personal';
    li.querySelector('.badge-prioridad').textContent = getPriorityLabel(task.priority);

    return li;
  }

  function renderSelectedFilters() {
    if (!listaFiltrosElegidos) return;

    listaFiltrosElegidos.innerHTML = '';

    const categoriasSeleccionadas = getSelectedCategories();
    const prioridadSeleccionada = getSelectedPriority();

    if (prioridadSeleccionada !== 'all') {
      const li = document.createElement('li');
      li.className = 'filtro__elegido-item';

      li.innerHTML = `
        <button
          type="button"
          class="badge filtro__badge cerrar__filtro"
          data-prioridad="${prioridadSeleccionada}"
          aria-label="Quitar filtro de prioridad ${prioridadSeleccionada}"
        >
          <span>Prioridad: ${getPriorityLabel(prioridadSeleccionada)}</span>
          <i data-lucide="x" aria-hidden="true"></i>
        </button>
      `;

      listaFiltrosElegidos.appendChild(li);
    }

    categoriasSeleccionadas.forEach(categoria => {
      const li = document.createElement('li');
      li.className = 'filtro__elegido-item';

      li.innerHTML = `
        <button
          type="button"
          class="badge filtro__badge cerrar__filtro"
          data-categoria="${categoria}"
          aria-label="Quitar filtro ${categoria}"
        >
          <span>${categoria}</span>
          <i data-lucide="x" aria-hidden="true"></i>
        </button>
      `;

      listaFiltrosElegidos.appendChild(li);
    });
  }

  function renderTasksList() {
    if (!listContainer) return;

    const filteredTasks = getFilteredTasks();
    listContainer.innerHTML = '';

    [...filteredTasks].reverse().forEach(task => {
      listContainer.appendChild(renderTask(task));
    });

    renderSelectedFilters();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function updateTaskCounter() {
    const total = tasks.length;

    contadorTareas.forEach(contador => {
      contador.textContent = total;
    });
  }

  function doneTasksCount() {
    const tareasHechas = tasks.filter(task => task.done).length;
    const contadorHechos = document.querySelector('.progreso__hechos');
    const porcentajeBarra = document.querySelector('.progreso__relleno');

    if (contadorHechos) {
      contadorHechos.textContent = tareasHechas;
    }

    if (porcentajeBarra) {
      const porcentaje = tasks.length === 0 ? 0 : Math.round((tareasHechas / tasks.length) * 100);
      porcentajeBarra.style.width = `${porcentaje}%`;
    }
  }

  function refreshUI() {
    renderTasksList();
    updateTaskCounter();
    doneTasksCount();
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
    if (!tituloTarea) return;

    const result = addTaskFromData({
      title: tituloTarea.value,
      category: categoriaTarea ? categoriaTarea.value : 'Personal',
      priority: prioridadTarea ? prioridadTarea.value : 'Media'
    });

    if (!result.ok) {
      alert('Por favor, ingresa un título para la tarea.');
      tituloTarea.focus();
      return;
    }

    tituloTarea.value = '';
  }

  function removeTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    refreshUI();
  }

  function toggleTask(taskId, isDone) {
    const task = tasks.find(task => task.id === taskId);
    if (!task) return;

    task.done = isDone;
    saveTasks();
    updateTaskCounter();
    doneTasksCount();
  }

  function bindDesktopForm() {
    const desktopForm = document.querySelector('.tarea.tarea-nueva');
    if (!desktopForm) return;

    desktopForm.addEventListener('submit', (event) => {
      event.preventDefault();
      addTaskFromDesktopForm();
    });
  }

  function bindListEvents() {
    if (!listContainer) return;

    listContainer.addEventListener('click', (event) => {
      const deleteBtn = event.target.closest('.tarea__borrar');
      if (!deleteBtn) return;

      event.preventDefault();
      event.stopPropagation();

      const taskId = Number(deleteBtn.dataset.taskId);
      if (!taskId) return;

      removeTask(taskId);
    });

    listContainer.addEventListener('change', (event) => {
      const checkbox = event.target.closest('.tarea-item__toggle');
      if (!checkbox) return;

      const rawId = checkbox.id.replace('task-', '');
      const taskId = Number(rawId);

      if (!taskId) return;
      toggleTask(taskId, checkbox.checked);
    });
  }

  function bindFilterEvents() {
    nombresCategorias.forEach(input => {
      input.addEventListener('change', () => {
        saveSelectedFilters();
        refreshUI();
      });
    });

    inputsPrioridad.forEach(input => {
      input.addEventListener('change', () => {
        saveSelectedPriority();
        refreshUI();
      });
    });

    if (!listaFiltrosElegidos) return;

    listaFiltrosElegidos.addEventListener('click', (event) => {
      const btnCerrar = event.target.closest('.cerrar__filtro');
      if (!btnCerrar) return;

      const categoria = btnCerrar.dataset.categoria;
      const prioridad = btnCerrar.dataset.prioridad;

      if (categoria) {
        const inputCategoria = [...nombresCategorias].find(input =>
          input.value.toLowerCase() === categoria.toLowerCase()
        );

        if (inputCategoria) {
          inputCategoria.checked = false;
        }

        saveSelectedFilters();
      }

      if (prioridad) {
        const radioTodas = document.querySelector('input[name="prioridad"][value="all"]');
        if (radioTodas) {
          radioTodas.checked = true;
        }

        saveSelectedPriority();
      }

      refreshUI();
    });
  }

  function init() {
    loadTasks();
    loadSelectedFilters();
    loadSelectedPriority();
    bindDesktopForm();
    bindListEvents();
    bindFilterEvents();
    refreshUI();

    if (typeof window.inicializarDrawerFiltrosMovil === 'function') {
      window.inicializarDrawerFiltrosMovil();
    }
  }

  window.TaskFlowApp = {
    addTaskFromData,
    getDesktopDefaults() {
      return {
        category: categoriaTarea ? categoriaTarea.value : 'Trabajo',
        priority: prioridadTarea ? prioridadTarea.value : 'Media'
      };
    },
    getFilteredCountByState({ prioridad = 'all', categorias = [] } = {}) {
      return tasks.filter(task => {
        const taskPriority = normalizePriority(task.priority);
        const taskCategory = String(task.category || '').toLowerCase().trim();

        const matchesPriority =
          prioridad === 'all' || taskPriority === prioridad;

        const matchesCategory =
          categorias.length === 0 || categorias.includes(taskCategory);

        return matchesPriority && matchesCategory;
      }).length;
    },
    refreshUI
  };

  window.addTask = addTaskFromDesktopForm;
  window.filtrarPorCategorias = refreshUI;
  window.filtrarPorPrioridad = refreshUI;
  window.anadirFiltros = renderSelectedFilters;
  window.actualizarResumenTareas = refreshUI;

  document.addEventListener('DOMContentLoaded', init);
})();