# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A to-do list web app written in plain HTML, CSS and JavaScript. There is no build step, no package.json and no dependencies. The UI text is Japanese.

## Commands

- Run the app: open `index.html` in a browser (`start index.html` from PowerShell). It must keep working from a `file://` URL.
- Run all tests: `node --test`
- Run one test by name: `node --test --test-name-pattern "deserialize"`
- Syntax-check the UI script (it has no tests): `node --check app.js`

## Architecture

The code is split into two classic scripts, loaded in this order by `index.html`:

- `store.js` holds the pure list logic (add, toggle, update, remove, filter, serialize, deserialize). It has no DOM or storage access. Every function returns a new array and never mutates its input; `addTodo` returns the same array instance when the text is blank, and `app.js` relies on that identity check to detect a rejected add.
- `app.js` owns the `state` object (`todos`, `filter`, `editingId`), reads and writes `localStorage` under the key `todo-app.todos`, and rebuilds the whole list on every change through `setTodos()` then `render()`.

Constraints that follow from this design:

- Do not convert the scripts to ES modules. Browsers block module imports on `file://`, so the app would need a web server. `store.js` instead exports through `module.exports` under Node and through the `TodoStore` global in the browser.
- Put new list behaviour in `store.js` with a test in `store.test.js`; keep `app.js` to event wiring and rendering.
- Render user text with `textContent`, never `innerHTML`.
- `deserialize` validates stored data and drops malformed entries. When adding a field to a todo, update that validation or the field will be stripped on load.
- The edit field ignores Enter while an IME conversion is in progress (`event.isComposing`). Keep this check when touching keyboard handling, or Japanese input will commit prematurely.

## Environment

`git` is not on the PowerShell PATH on this machine. Use the Bash tool (Git Bash) for git commands.
