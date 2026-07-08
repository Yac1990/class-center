---
  name: Missing /api/upload route in Class Center
  description: Multiple admin upload UIs called /api/upload but the route handler didn't exist; site had pre-existing empty public/uploads/<folder> dirs implying it existed before.
  ---

  When several independent frontend components across a codebase all call the same API endpoint and all fail the same way, check whether the route handler file actually exists under src/app/api/<name>/route.ts — do not assume it's a logic bug in each caller.

  **Why:** In this project, admin-dashboard, admin-flash-products, admin-documents, and documents-section all POST to /api/upload and all failed identically. middleware.ts even had upload-specific auth/validation comments describing intended folder-based MIME rules, but the route.ts file itself was missing (likely dropped during an earlier interrupted process). Evidence like existing (populated or empty) public/uploads/<folder> directories can be a strong hint the route used to exist.

  **How to apply:** When debugging "upload fails" or "X feature broken everywhere," grep for the endpoint's route file before assuming per-caller bugs. Reconstruct the route based on: middleware validation logic/comments (folder-based rules), existing upload directory structure, and shape of data the callers expect back (e.g. { url, name, size, type }).
  