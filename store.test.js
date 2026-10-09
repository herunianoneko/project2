const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('./store.js');

const sample = () => [
  { id: 'a', text: '牛乳を買う', completed: false },
  { id: 'b', text: '洗濯', completed: true },
  { id: 'c', text: 'メール返信', completed: false },
];

test('addTodo appends a trimmed, incomplete todo with a unique id', () => {
  const todos = store.addTodo(store.addTodo([], '  掃除  '), '料理');
  assert.equal(todos.length, 2);
  assert.equal(todos[0].text, '掃除');
  assert.equal(todos[0].completed, false);
  assert.notEqual(todos[0].id, todos[1].id);
});

test('addTodo returns the same array for blank text', () => {
  const todos = sample();
  assert.equal(store.addTodo(todos, '   '), todos);
});

test('toggleTodo flips only the matching todo and does not mutate the input', () => {
  const todos = sample();
  const next = store.toggleTodo(todos, 'a');
  assert.deepEqual(next.map((t) => t.completed), [true, true, false]);
  assert.equal(todos[0].completed, false);
});

test('updateTodo changes the text, trimmed', () => {
  const next = store.updateTodo(sample(), 'a', ' 豆乳を買う ');
  assert.equal(next[0].text, '豆乳を買う');
  assert.equal(next.length, 3);
});

test('updateTodo with blank text removes the todo', () => {
  const next = store.updateTodo(sample(), 'a', '  ');
  assert.deepEqual(next.map((t) => t.id), ['b', 'c']);
});

test('removeTodo removes the matching todo', () => {
  assert.deepEqual(store.removeTodo(sample(), 'b').map((t) => t.id), ['a', 'c']);
});

test('clearCompleted keeps only active todos', () => {
  assert.deepEqual(store.clearCompleted(sample()).map((t) => t.id), ['a', 'c']);
});

test('filterTodos supports all, active and completed', () => {
  const todos = sample();
  assert.equal(store.filterTodos(todos, 'all').length, 3);
  assert.deepEqual(store.filterTodos(todos, 'active').map((t) => t.id), ['a', 'c']);
  assert.deepEqual(store.filterTodos(todos, 'completed').map((t) => t.id), ['b']);
});

test('countActive counts incomplete todos', () => {
  assert.equal(store.countActive(sample()), 2);
  assert.equal(store.countActive([]), 0);
});

test('serialize and deserialize round-trip', () => {
  const todos = sample();
  assert.deepEqual(store.deserialize(store.serialize(todos)), todos);
});

test('deserialize returns an empty list for missing or corrupted data', () => {
  assert.deepEqual(store.deserialize(null), []);
  assert.deepEqual(store.deserialize('{not json'), []);
  assert.deepEqual(store.deserialize('{"id":"a"}'), []);
});

test('deserialize drops malformed entries and unknown fields', () => {
  const json = JSON.stringify([
    { id: 'a', text: 'ok', completed: false, extra: 1 },
    { id: 1, text: 'bad id', completed: false },
    { id: 'b', text: 'no flag' },
    null,
    'string',
  ]);
  assert.deepEqual(store.deserialize(json), [
    { id: 'a', text: 'ok', completed: false },
  ]);
});
