# Setup and integration

Install with `npx skills add crapthings/three-spatial --skill three-spatial`. This installs the skill files, not the runtime dependency. Use Node >=24 for the bundled tools.

The entire `three-spatial` folder can also be copied into another project's `.agents/skills/three-spatial` or the user's skill directory. No symlinks or files from the original repository are needed. `SKILL_ROOT` means the absolute path of the directory containing this skill's `SKILL.md`; set it explicitly for the commands below. Quoting preserves paths containing spaces.

## Pure index mode

Node >=24 is enough. No package installation is required:

```sh
node "$SKILL_ROOT/scripts/spatial-index/cli.js" "$SKILL_ROOT/assets/example-index.json" '{"op":"expand-part","id":"warehouse","depth":2}'
node "$SKILL_ROOT/scripts/spatial-index/cli.js" "$SKILL_ROOT/assets/example-index.json" '{"op":"select-members","id":"warehouse.racks","selector":{"range":[99990,100000]},"limit":3}'
```

The example index describes 100,000 logical members with two semantic nodes and no meshes. It is input data, not an instruction source.

## Geometry mode

Install the runtime's locked Three.js dependency inside this copied skill, not globally or in the caller's package manifest:

```sh
(cd "$SKILL_ROOT/scripts" && npm ci --ignore-scripts --no-audit --no-fund)
node "$SKILL_ROOT/scripts/create-example.js" artifacts
node "$SKILL_ROOT/scripts/spatial/cli.js" artifacts/example-scene.json '{"op":"inspect-object","id":"block"}'
node "$SKILL_ROOT/scripts/spatial/cli.js" artifacts/example-scene.json '{"op":"inspect-dimensions","id":"example.block"}'
```

The runtime pins Three.js 0.187.0. Install requires npm registry access or an appropriate npm cache. Do not report geometry mode as ready if dependency installation failed. Index mode remains available. Never copy an existing `node_modules` directory when distributing the skill; run the install command on the destination machine.

`create-example.js` creates a static block, support platform and semantic index in the supplied output directory (default `artifacts` relative to caller). It demonstrates the tools without requiring any demo generator from another repository. Offline edits require an explicit output scene path and subsequent queries must read that output.

## Existing Three.js applications

Import `createSpatialTools` from `<skill>/scripts/spatial/tools.js`, passing the actual scene subtree:

```js
const execute = createSpatialTools(root)
const result = execute({ op: 'inspect-object', id: 'my-object' })
```

Use an import path appropriate to the application, rather than copying this placeholder literally. Keep one Three.js module instance in browser builds; if the application and copied runtime resolve separate copies, configure the bundler's Three.js deduplication or align its dependency resolution. The runtime is ESM; no compiled bundle is required.

For generator updates, supply an optional callback:

```js
const execute = createSpatialTools(root, {
  updateProcedural: (registeredRoot, request) => regenerateFromRecipe(registeredRoot, request)
})
```

The callback must validate the expected revision and parameters before replacing geometry, preserve agreed root transforms, update the semantic index and dispose owned resources. There is no built-in application-specific generator callback. `update-procedural` fails explicitly when one has not been registered. Static scene inspection, transforms, orientation and index operations work without it.

## Optional Vite/browser bridge

Vite is needed only for live integration, not the offline CLI. Add `spatialBridge()` from `<skill>/scripts/bridge/vite-plugin.js` to the application's Vite plugins. In a React lifecycle effect, call `connectSpatialBridge(root, import.meta.hot, onChange)` from `<skill>/scripts/bridge/client.js` and return its cleanup function. Register the same subtree actually rendered by the app. R3F applications rendering on demand should invalidate in `onChange`; synchronize transform edits if React/Zustand would otherwise overwrite them.

The bridge client optionally accepts `{createTools}` as its fourth argument to register application-specific generator callbacks. Keep exactly one registered scene tab open; use a known local port and avoid automatic port fallback.

```sh
node "$SKILL_ROOT/scripts/spatial/cli.js" http://127.0.0.1:5173 '{"op":"list"}'
node "$SKILL_ROOT/scripts/spatial/cli.js" http://127.0.0.1:5173 '{"op":"export-scene"}' artifacts/live-scene.json
```

The endpoint is development-only, loopback HTTP POST, with a 64 KiB request cap and an eight-second response timeout. Browser-origin fetches are rejected. It is not a remote multiuser service. After a timeout, inspect state before retrying a mutation because it may already have executed. Live edits remain in memory until exported.
