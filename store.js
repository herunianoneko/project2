// Pure todo-list logic. No DOM or storage access here so it can run under Node for tests.
// Every function returns a new array and never mutates its input.
(function (root) {
  'use strict';

  const FILTERS = ['all', 'active', 'completed'];

  function createId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  function addTodo(todos, text) {
    const trimmed = String(text).trim();
    if (!trimmed) return todos;
    return [...todos, { id: createId(), text: trimmed, completed: false }];
  }

  function toggleTodo(todos, id) {
    return todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
  }

  // Editing a todo down to an empty string deletes it.
  function updateTodo(todos, id, text) {
    const trimmed = String(text).trim();
    if (!trimmed) return removeTodo(todos, id);
    return todos.map((todo) =>
      todo.id === id ? { ...todo, text: trimmed } : todo
    );
  }

  function removeTodo(todos, id) {
    return todos.filter((todo) => todo.id !== id);
  }

  function clearCompleted(todos) {
    return todos.filter((todo) => !todo.completed);
  }

  function filterTodos(todos, filter) {
    if (filter === 'active') return todos.filter((todo) => !todo.completed);
    if (filter === 'completed') return todos.filter((todo) => todo.completed);
    return todos;
  }

  function countActive(todos) {
    return todos.filter((todo) => !todo.completed).length;
  }

  function serialize(todos) {
    return JSON.stringify(todos);
  }

  // Stored data may be missing, corrupted, or hand-edited: keep only well-formed entries.
  function deserialize(json) {
    let data;
    try {
      data = JSON.parse(json);
    } catch {
      return [];
    }
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (item) =>
          item !== null &&
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          typeof item.text === 'string' &&
          typeof item.completed === 'boolean'
      )
      .map(({ id, text, completed }) => ({ id, text, completed }));
  }

  const api = {
    FILTERS,
    addTodo,
    toggleTodo,
    updateTodo,
    removeTodo,
    clearCompleted,
    filterTodos,
    countActive,
    serialize,
    deserialize,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.TodoStore = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
