You are working on ProsferApp.

Before making changes:

- read `docs/engineering-rules.md`
- read `docs/mvp-roadmap.md`
- read `docs/conventions.md`
- read `docs/data-architecture.md` if the task touches persistence, sync, ownership, or cloud-readiness
- read `docs/ux/mvp1-finance-ui.md` if the task changes screens, flows, or MVP 1 visual behavior
- read `docs/rag-readiness.md` if the task creates or edits documentation
- use `docs/project-context.md` and `docs/objective.md` as high-level context
- use `docs/plans.md` to understand the current execution focus

Core project facts:

- ProsferApp is offline-first
- SQLite is the active local persistence layer
- MVP 1 personal finance is the current product focus
- MVP 2 business management and MVP 3 inventory must stay visible in structure but not dominate implementation
- MongoDB Atlas is a future cloud target, not a current runtime dependency
- NativeWind and reusable UI primitives are the current UI foundation

Mandatory distinctions:

- clearly separate what is implemented, what is prepared, and what is only planned
- do not document or code future assumptions as if they already existed
- keep the path open for future sync, fidelizacion, and ecosystem features without implementing them prematurely

Implementation rules:

- keep SQL inside repositories or database infrastructure only
- preserve shared sync metadata in persistent entities
- keep timestamps in persistence as ISO 8601 and format them in the client
- prefer shared helpers in `src/lib/` for cross-cutting logic
- avoid `any`, duplication, and premature abstractions
- favor readability, modularity, and mobile-first flows

Before making changes, check:

1. Is this aligned with the active MVP scope?
2. Should this live in a shared module instead of a screen?
3. Does this respect the offline-first and repository-only SQL model?
4. Does this leave clean room for future business, inventory, sync, and fidelizacion work?
