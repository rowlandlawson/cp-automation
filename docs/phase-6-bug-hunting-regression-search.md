# Phase 6 Bug Hunting And Regression Search

This phase turns bug discovery into a repeatable release workflow instead of a
last-minute manual sweep.

## Goals

- search intentionally for defects outside the happy path
- convert every meaningful bug into a regression guard
- keep a visible backlog with severity, owner, and reproduction details

## Bug Hunt Lanes

| Lane                   | What To Stress                                                         | Primary Method                                 | Regression Target           |
| ---------------------- | ---------------------------------------------------------------------- | ---------------------------------------------- | --------------------------- |
| Auth and session       | expired tokens, stale local storage, forced logout, password rotation  | Playwright + route-level API tests             | automated test              |
| Public fallback        | partial API outages, malformed content, missing singleton responses    | Playwright mocked API failures                 | automated test              |
| Publish and save flows | double submits, delayed responses, stale UI after save                 | Playwright with throttled or delayed responses | automated test or checklist |
| Media lifecycle        | replacement cleanup, orphaned assets, missing upload config            | smoke suite + API route tests                  | smoke test + route test     |
| Deploy and routing     | SPA rewrites, runtime config, CORS, cache headers                      | staging verification + manual checklist        | release checklist           |
| Seed and env drift     | scoped seed dependencies, staging-only secrets, production-only config | seed verification scripts + staging workflow   | automated script            |

## Suggested Session Charters

Run short focused bug-hunt sessions instead of one large unstructured pass.

1. Auth and session charter
   - restore an old session
   - trigger a `401` on a protected request
   - confirm logout messaging, storage cleanup, and redirect behavior
2. Public fallback charter
   - fail one public endpoint at a time
   - verify the page keeps usable fallback content without exposing drafts
3. Save and publish charter
   - save with slow responses
   - save twice quickly
   - publish and refresh immediately
4. Media charter
   - replace assets repeatedly
   - delete content after replacement
   - verify old asset cleanup behavior
5. Deploy charter
   - verify rewritten public routes
   - verify runtime config points at the expected API
   - verify CORS and cache behavior on staging

## Current Regression Coverage

| Bug Class                    | Current Guard                         |
| ---------------------------- | ------------------------------------- |
| Session expiry after restore | Playwright admin auth regression      |
| Partial public API outage    | Playwright public fallback regression |
| Full public API outage       | Playwright public fallback regression |
| Rewritten public routes      | Playwright static-server regression   |
| Upload replacement cleanup   | API smoke suite                       |
| Seed dependency drift        | scoped seed verification script       |

## Bug Log Template

Use this structure for every bug that survives first triage.

| ID      | Severity | Environment                  | Layer                              | Summary | Status | Regression Guard |
| ------- | -------- | ---------------------------- | ---------------------------------- | ------- | ------ | ---------------- |
| PH6-001 |          | local / staging / production | UI / API / data / deploy / content |         | open   | pending          |

Detailed capture:

```md
Environment:

- local / staging / production

Severity:

- critical / high / medium / low

Suspected layer:

- UI / API / data / deploy / content

Repro steps:

1.
2.
3.

Expected result:

Actual result:

Evidence:

- screenshot path, console output, network trace, or log snippet

Regression guard to add:

- smoke test / automated test / release checklist item
```

## Triage Rules

- critical: blocks login, publishing, deploy, or public rendering
- high: major feature broken but workaround exists
- medium: validation, content, or workflow issue with limited blast radius
- low: polish or low-risk inconsistency

- critical and high bugs must be closed before release
- medium bugs must be triaged with an owner and target phase
- low bugs can ship only if documented and accepted explicitly

## Exit Criteria

- critical and high bugs are closed
- each resolved bug has a permanent regression guard
- staging bug-hunt notes are linked from the release sign-off
