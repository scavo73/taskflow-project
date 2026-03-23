// =====================================================
// API CLIENT (TaskFlow)
// =====================================================

const TASKFLOW_API_BASE_URL = 'http://localhost:3000/api/v1/tasks';

async function apiRequest(url, options = {}) {
  // UI network states (definidas en app-bootstrap.js)
  const canSetLoading = typeof setTaskflowLoadingVisible === 'function';
  const canSetErrorBanner = typeof setTaskflowErrorBanner === 'function';

  if (canSetLoading) setTaskflowLoadingVisible(true);

  try {
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
      const message = data?.error || 'Error de red';
      if (canSetErrorBanner) setTaskflowErrorBanner(message);
      throw new Error(message);
    }

    // success: we can clear previous error banner
    if (canSetErrorBanner) setTaskflowErrorBanner('');
    return data;
  } catch (err) {
    if (canSetErrorBanner) {
      setTaskflowErrorBanner(
        err?.message && err?.message !== 'Failed to fetch'
          ? err.message
          : 'No se pudo conectar al servidor.'
      );
    }
    throw err;
  } finally {
    if (canSetLoading) setTaskflowLoadingVisible(false);
  }
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

async function seedDemoTasksInApi() {
  return apiRequest(`${TASKFLOW_API_BASE_URL}/seed-demo`, {
    method: 'POST'
  });
}

window.TaskFlowApi = {
  fetchTasksFromApi,
  createTaskInApi,
  patchTaskInApi,
  deleteTaskInApi,
  reorderTasksInApi,
  seedDemoTasksInApi
};