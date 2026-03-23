// =====================================================
// STATE (TaskFlow)
// =====================================================
// Este archivo define el "estado global" para poder separar
// lógica de filtros/storage sin romper el resto del app.

function getDefaultFiltersState() {
  return {
    status: 'all',
    priorities: [],
    categories: [],
    search: ''
  };
}

let tasks = [];
let nextId = 1;
let isListLayout = false;
let editingTaskId = null;
let categories = [];
let editingCategoryKey = null;
let sortableTasks = null;
let filtersState = getDefaultFiltersState();
let networkCriticalError = null;
let isTasksLoading = false;

