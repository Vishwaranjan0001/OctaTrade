# OctaTrade Learning Notes

## Phase 1: Developer foundations

### Concepts learned

- Git tracks versions locally; GitHub can host a remote copy of a Git repository.
- The Git flow is working directory, staging area, local repository, then remote repository.
- A commit creates a local snapshot. A push sends commits to a remote repository.
- Node.js runs JavaScript outside the browser.
- npm manages Node packages and project scripts through `package.json`.
- JavaScript variables can store strings, numbers, functions, and objects.
- HTTP communication uses a client request and a server response.

### Important syntax and commands

- `const name = "value";` creates a binding that cannot be reassigned.
- `console.log(value);` prints a value.
- `git status` shows working-directory and staging-area state.
- `git add <file>` stages a file's current content.
- `git commit -m "message"` creates a local commit.
- `git diff --staged` shows what the next commit will contain.
- `node index.js` runs a JavaScript file with Node.
- `npm start` runs the `start` script from `package.json`.

### Common mistakes

- Saving, staging, committing, and pushing are separate actions.
- Editing a staged file does not automatically update its staged version.
- Variable names and string capitalization must match exactly.
- Node executes the saved file on disk, not unsaved text in the editor.

### Revise

- Explain the four Git areas in your own words.
- Explain the difference between `const`, a variable name, and its stored value.
- Explain why `package.json` exists.

## Phase 2: First Express server

### Concepts learned

- Express adds routing and middleware conventions on top of Node's HTTP capabilities.
- `express()` creates an Express application object.
- `app.get(path, callback)` registers a handler for an HTTP GET request.
- `req` represents the incoming request; `res` builds and sends the response.
- HTTP status `200` reports a successful request.
- `app.listen` opens a network listener and keeps Node's event loop active.

### Request flow

```text
Browser -> GET /health -> Express route -> JSON response -> Browser
```

### Common mistakes

- `express()` creates the application, while `app.listen()` starts network listening.
- npm's package and script lines are npm output; application logs come from the JavaScript code.
- A server waiting for requests keeps the terminal occupied until it is stopped.

### Revise

- Explain every part of `app.get("/health", (req, res) => { ... })`.
- Explain why Express is useful even though Node has built-in HTTP tools.
- Explain what happens from entering a URL to receiving JSON.
