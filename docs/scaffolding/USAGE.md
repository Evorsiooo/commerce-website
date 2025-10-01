# Page Scaffolder Usage

The scaffolder enforces the Phase 2.5 workflow by generating the boilerplate, manifest stub, and documentation placeholder for new routes.

```bash
npm run scaffold:page -- --template <landing|directory|detail|form|utility> --route <path> [--title "Page Title"]
```

## What gets generated

1. `app/(public)/<route>/page.tsx` — imports the appropriate template and includes a TODO for any missing implementation details.
2. `config/pages/<route-with-dashes>.json` — manifest stub for copy and metadata. Fill this in immediately before wiring up data.
3. `docs/templates/<route-with-dashes>.md` — documentation stub. Describe the data contract, shared components, and QA steps as you build the page.

## Required follow-up

- Update the manifest stub with real copy.
- Replace the stub implementation with the correct components.
- Add or update tests.
- Document the route in the template markdown file.
- Run `npm run lint`, `npm run typecheck`, and `npm test` before committing.

Refer back to `docs/AI_DEVELOPMENT_BIBLE.md` for the complete checklist.
