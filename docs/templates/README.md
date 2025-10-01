# Template Library Overview

This directory collects usage notes for each page that is generated with the shared template system. When you scaffold a new route with `npm run scaffold:page`, a stub markdown file is created here. Fill it in while implementing the route:

- Document the data contract (what manifest fields are required).
- Call out the shared UI components consumed.
- List any follow-up work or TODOs left in the stub.

Existing template types:

| Template | Purpose |
| --- | --- |
| `landing` | Marketing-style hero with feature grid and optional footer. |
| `directory` | Filterable lists of items (businesses, properties, etc.). |
| `detail` | Entity detail views with sidebar information (coming soon). |
| `form` | Flows that introduce and render a form inside a shared card. |
| `utility` | Small pages (status, confirmation, account linking) that need compact layout.

> Keep every template entry up to date so future contributors can learn from the documented examples.
