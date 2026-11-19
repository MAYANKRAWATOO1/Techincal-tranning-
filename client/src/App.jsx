import { useEffect, useState } from "react";
import { api } from "./api.js";

const SESSION_KEY = "daybook-session";

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState(readSession);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(Boolean(session));
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    api
      .getTasks(session.token)
      .then((data) => {
        if (active) setTasks(data.tasks);
      })
      .catch((error) => {
        if (!active) return;
        if (error.message === "Invalid or expired token.") {
          signOut();
          setNotice("Your session expired. Please sign in again.");
        } else {
          setNotice(error.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session?.token]);

  function signIn(data) {
    const nextSession = { token: data.token, user: data.user };
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    setNotice("");
  }

  function signOut() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setTasks([]);
  }

  async function addTask(title) {
    const { task } = await api.createTask(session.token, title);
    setTasks((current) => [task, ...current]);
  }

  async function toggleTask(task) {
    const { task: updated } = await api.updateTask(
      session.token,
      task._id,
      !task.completed,
    );
    setTasks((current) =>
      current.map((item) => (item._id === updated._id ? updated : item)),
    );
  }

  async function removeTask(taskId) {
    await api.deleteTask(session.token, taskId);
    setTasks((current) => current.filter((task) => task._id !== taskId));
  }

  if (!session) {
    return (
      <AuthPage
        onSuccess={signIn}
        notice={notice}
        onClearNotice={() => setNotice("")}
      />
    );
  }

  const completedCount = tasks.filter((task) => task.completed).length;

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Daybook home">
          <span className="brand-mark">d</span>
          <span>daybook</span>
        </a>
        <button className="text-button" onClick={signOut}>
          Sign out
        </button>
      </header>

      <section className="dashboard">
        <div className="welcome-row">
          <div>
            <p className="eyebrow">YOUR SPACE</p>
            <h1>Good work starts with a clear day.</h1>
            <p className="subheading">
              Welcome back, {session.user.name}. Here's what's on your list.
            </p>
          </div>
          <div className="progress-card">
            <span className="progress-number">
              {completedCount}
              <span> / {tasks.length}</span>
            </span>
            <span className="progress-label">tasks completed</span>
          </div>
        </div>

        {notice && (
          <p className="notice" role="alert">
            {notice}
          </p>
        )}

        <TaskForm
          onAdd={addTask}
          onError={(error) => setNotice(error.message)}
        />

        <section className="task-section" aria-labelledby="task-heading">
          <div className="section-heading">
            <h2 id="task-heading">Your tasks</h2>
            <span className="task-count">{tasks.length}</span>
          </div>

          {loading ? (
            <p className="empty-state">Loading your tasks…</p>
          ) : tasks.length === 0 ? (
            <p className="empty-state">
              Nothing on the list yet. Add a task above to get started.
            </p>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => (
                <li className="task-item" key={task._id}>
                  <label className="task-label">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() =>
                        toggleTask(task).catch((error) => setNotice(error.message))
                      }
                    />
                    <span className={task.completed ? "task-title done" : "task-title"}>
                      {task.title}
                    </span>
                  </label>
                  <button
                    className="delete-button"
                    aria-label={`Delete ${task.title}`}
                    onClick={() =>
                      removeTask(task._id).catch((error) => setNotice(error.message))
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <footer className="dashboard-footer">
          Your tasks are private to your account.
        </footer>
      </section>
    </main>
  );
}

function AuthPage({ onSuccess, notice, onClearNotice }) {
  const [mode, setMode] = useState("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isRegistering = mode === "register";

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const details = {
      email: formData.get("email"),
      password: formData.get("password"),
    };
    if (isRegistering) details.name = formData.get("name");

    try {
      const result = isRegistering
        ? await api.register(details)
        : await api.login(details);
      onSuccess(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-intro">
        <a className="brand" href="/">
          <span className="brand-mark">d</span>
          <span>daybook</span>
        </a>
        <div className="intro-copy">
          <p className="eyebrow">A LITTLE MORE FOCUS</p>
          <h1>Make room for what matters.</h1>
          <p>One calm place to keep track of the things you want to get done.</p>
        </div>
        <p className="intro-note">A simple day, thoughtfully organized.</p>
      </div>

      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">{isRegistering ? "GET STARTED" : "WELCOME BACK"}</p>
          <h2>{isRegistering ? "Create your account" : "Sign in to Daybook"}</h2>
          <p className="auth-description">
            {isRegistering
              ? "Your personal task list is just a moment away."
              : "Pick up right where you left off."}
          </p>

          {notice && (
            <p className="notice" role="status">
              {notice}
              <button
                className="notice-dismiss"
                aria-label="Dismiss message"
                onClick={onClearNotice}
              >
                ×
              </button>
            </p>
          )}
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegistering && (
              <label>
                Your name
                <input
                  name="name"
                  type="text"
                  placeholder="Alex Morgan"
                  autoComplete="name"
                  minLength="2"
                  maxLength="60"
                  required
                />
              </label>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                placeholder="At least 8 characters"
                autoComplete={isRegistering ? "new-password" : "current-password"}
                minLength="8"
                required
              />
            </label>
            <button className="primary-button" disabled={busy}>
              {busy
                ? "Please wait…"
                : isRegistering
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="switch-mode">
            {isRegistering ? "Already have an account?" : "New to Daybook?"}{" "}
            <button
              className="link-button"
              onClick={() => {
                setMode(isRegistering ? "login" : "register");
                setError("");
              }}
            >
              {isRegistering ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

function TaskForm({ onAdd, onError }) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    setBusy(true);
    try {
      await onAdd(cleanTitle);
      setTitle("");
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="add-task-form" onSubmit={handleSubmit}>
      <input
        aria-label="New task"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="What would you like to get done?"
        maxLength="160"
        required
      />
      <button className="primary-button" disabled={busy || !title.trim()}>
        {busy ? "Adding…" : "Add task"}
      </button>
    </form>
  );
}
