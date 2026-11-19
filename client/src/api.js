const API_ROOT = "/api";

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || "The request could not be completed.");
  }

  return body;
}

export const api = {
  register: (details) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(details),
    }),
  login: (details) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(details),
    }),
  getTasks: (token) => request("/tasks", { token }),
  createTask: (token, title) =>
    request("/tasks", {
      token,
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  updateTask: (token, taskId, completed) =>
    request(`/tasks/${taskId}`, {
      token,
      method: "PATCH",
      body: JSON.stringify({ completed }),
    }),
  deleteTask: (token, taskId) =>
    request(`/tasks/${taskId}`, { token, method: "DELETE" }),
};
