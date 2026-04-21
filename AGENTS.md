# Toggle Agent Guide

## Project Context

Toggle is a fullstack repository with separate frontend and backend applications.

- Frontend: `apps/frontend` using `React 19`, `Vite 7`, `react-router-dom`, `CSS Modules`, `npm`
- Backend: `apps/backend` using `Spring Boot 3.3`, `Java 21`, `Spring Security`, `JPA`, `JWT`, `Gradle`
- Existing delivery artifacts: `handoff/`, `daily-log/`, `.agents/`

This repository uses `superpowers` as the default development methodology.

Mandatory feature workflow order:

1. `brainstorming`
2. `using-git-worktrees`
3. `writing-plans`
4. `subagent-driven-development` by default, `executing-plans` only when subagents are not appropriate
5. `test-driven-development`
6. `requesting-code-review`
7. `finishing-a-development-branch`

## Hard Rules

- No feature code before brainstorming is complete and a design/checkpoint is approved.
- No implementation before a written plan exists.
- No production code before a failing test first, unless the change is configuration-only or documentation-only.
- No task is done without explicit verification results.
- No feature branch is finished without review and branch disposition.
- Main Agent is the default orchestrator, not the default specialist implementer.
- Main Agent must not bypass default delegation for meaningful specialist work by rationalizing speed or convenience. If specialist work must stay local, declare the exception first and record the reason in `daily-log/YYYY-MM-DD.md`.
- Keep changes aligned with existing `handoff/` and `daily-log/` conventions.

## Operational Commands

Use commands from the app directory that owns the change.

- Frontend install: `cd apps/frontend && npm install`
- Frontend dev: `cd apps/frontend && npm run dev`
- Frontend lint: `cd apps/frontend && npm run lint`
- Frontend build: `cd apps/frontend && npm run build`
- Backend dev: `cd apps/backend && ./gradlew bootRun`
- Backend test: `cd apps/backend && ./gradlew test`
- Backend build: `cd apps/backend && ./gradlew build`

Proposed, not yet implemented:

- Frontend unit tests: `cd apps/frontend && npm run test`
- Suggested toolchain: `Vitest + React Testing Library`

## Workflow Routing

- Main repo workflow and role orchestration: `./.agents/agents.md`
- Main Agent orchestration contract: `./.agents/workflows/main-agent-orchestration.md`
- Main Agent runtime dispatch: `./.agents/workflows/main-agent-runtime-dispatch.md`
- Fullstack feature router: `./.agents/workflows/build-fullstack-feature.md`
- Brainstorming gate: `./.agents/workflows/01-brainstorming.md`
- Planning gate: `./.agents/workflows/02-planning.md`
- TDD execution gate: `./.agents/workflows/03-tdd-execution.md`
- Code review gate: `./.agents/workflows/04-code-review.md`
- Finish branch gate: `./.agents/workflows/05-finish-branch.md`
- Human-readable operating guide: `./docs/development-workflow.md`

## Context Map

- Frontend application work: `./apps/frontend/AGENTS.md`
- Frontend API/session helpers: `./apps/frontend/src/lib/AGENTS.md`
- Backend application work: `./apps/backend/AGENTS.md`
- Backend security layer: `./apps/backend/src/main/java/com/toggle/global/security/AGENTS.md`
- Product and architecture docs: `./docs`
- Role-based handoff artifacts: `./handoff`

## Repository Notes

- This repo already has project-specific role rules under `.agents/rules/`; keep them unless a new rule explicitly supersedes them.
- `handoff/` is the durable artifact store for PM, design, engineering, QA, and release notes.
- `daily-log/YYYY-MM-DD.md` is part of the definition of done for substantive work.
- when `Main Agent` delegates meaningful work to a real subagent, leave an auditable routing trail in `daily-log/YYYY-MM-DD.md` using the repository templates as needed.
- for meaningful role-specific work, delegation is the default. If Main Agent keeps specialist work local, that should be a documented exception.
