// UI layer: owns the state, persists it to localStorage, and re-renders the list on every change.
(function () {
  'use strict';

  const STORAGE_KEY = 'todo-app.todos';
  const store = window.TodoStore;

  const form = document.getElementById('new-todo-form');
  const input = document.getElementById('new-todo-input');
  const list = document.getElementById('todo-list');
  const emptyMessage = document.getElementById('empty-message');
  const footer = document.getElementById('footer');
  const count = document.getElementById('count');
  const clearButton = document.getElementById('clear-completed');
  const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));

  const state = {
    todos: load(),
    filter: 'all',
    editingId: null,
  };

  function load() {
    try {
      return store.deserialize(localStorage.getItem(STORAGE_KEY));
    } catch {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, store.serialize(state.todos));
    } catch {
      // Storage can be unavailable (private mode, quota). The app still works for this session.
    }
  }

  function setTodos(todos) {
    state.todos = todos;
    save();
    render();
  }

  function render() {
    const visible = store.filterTodos(state.todos, state.filter);
    list.replaceChildren(...visible.map(renderItem));

    const hasTodos = state.todos.length > 0;
    footer.hidden = !hasTodos;
    emptyMessage.hidden = visible.length > 0;
    emptyMessage.textContent = hasTodos
      ? '該当するタスクはありません'
      : 'タスクはまだありません';

    count.textContent = `残り ${store.countActive(state.todos)} 件`;
    clearButton.hidden = store.countActive(state.todos) === state.todos.length;

    for (const button of filterButtons) {
      const selected = button.dataset.filter === state.filter;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    }

    const editor = list.querySelector('.edit');
    if (editor) {
      editor.focus();
      editor.setSelectionRange(editor.value.length, editor.value.length);
    }
  }

  function renderItem(todo) {
    const item = document.createElement('li');
    item.className = 'todo-item';
    item.classList.toggle('completed', todo.completed);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `「${todo.text}」を完了にする`);
    checkbox.addEventListener('change', () => {
      setTodos(store.toggleTodo(state.todos, todo.id));
    });
    item.append(checkbox);

    if (state.editingId === todo.id) {
      item.append(renderEditor(todo));
      return item;
    }

    const text = document.createElement('span');
    text.className = 'text';
    text.textContent = todo.text;
    text.addEventListener('dblclick', () => startEditing(todo.id));

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'icon-button';
    editButton.textContent = '編集';
    editButton.addEventListener('click', () => startEditing(todo.id));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'icon-button danger';
    deleteButton.textContent = '削除';
    deleteButton.addEventListener('click', () => {
      setTodos(store.removeTodo(state.todos, todo.id));
    });

    item.append(text, editButton, deleteButton);
    return item;
  }

  function renderEditor(todo) {
    const editor = document.createElement('input');
    editor.type = 'text';
    editor.className = 'edit';
    editor.value = todo.text;
    editor.setAttribute('aria-label', 'タスクを編集');

    // Re-rendering removes the editor, which fires blur; `finished` stops a second commit.
    let finished = false;
    const finish = (commit) => {
      if (finished) return;
      finished = true;
      state.editingId = null;
      if (commit) {
        setTodos(store.updateTodo(state.todos, todo.id, editor.value));
      } else {
        render();
      }
    };

    editor.addEventListener('keydown', (event) => {
      // Enter that only confirms an IME conversion must not commit the edit.
      if (event.isComposing || event.keyCode === 229) return;
      if (event.key === 'Enter') finish(true);
      if (event.key === 'Escape') finish(false);
    });
    editor.addEventListener('blur', () => finish(true));
    return editor;
  }

  function startEditing(id) {
    state.editingId = id;
    render();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const next = store.addTodo(state.todos, input.value);
    if (next === state.todos) return;
    input.value = '';
    setTodos(next);
  });

  for (const button of filterButtons) {
    button.addEventListener('click', () => {
      state.filter = button.dataset.filter;
      render();
    });
  }

  clearButton.addEventListener('click', () => {
    setTodos(store.clearCompleted(state.todos));
  });

  // Keep several open tabs in sync.
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    state.todos = load();
    render();
  });

  render();
})();
