// =====================================================
// API CLIENT (TaskFlow)
// =====================================================

const TASKFLOW_API_BASE_URL = 'http://localhost:3000/api/v1/tasks';

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Error de red');
  }

  return data;
}

async function fetchTasksFromApi() {
  const data = await apiRequest(TASKFLOW_API_BASE_URL, {
    method: 'GET'
  });

  return Array.isArray(data) ? data : [];
}

async function createTaskInApi(payload) {
  return apiRequest(TASKFLOW_API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

async function patchTaskInApi(taskId, payload) {
  return apiRequest(`${TASKFLOW_API_BASE_URL}/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

async function deleteTaskInApi(taskId) {
  return apiRequest(`${TASKFLOW_API_BASE_URL}/${taskId}`, {
    method: 'DELETE'
  });
}

async function reorderTasksInApi(orderedIds) {
  return apiRequest(`${TASKFLOW_API_BASE_URL}/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ orderedIds })
  });
}

window.TaskFlowApi = {
  fetchTasksFromApi,
  createTaskInApi,
  patchTaskInApi,
  deleteTaskInApi,
  reorderTasksInApi
};