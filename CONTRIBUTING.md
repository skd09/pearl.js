# Contributing to Pearl.js

Thank you for your interest in contributing!

## Setup
```bash
git clone https://github.com/skd09/pearl
cd pearl
pnpm install
pnpm build
```

## Development workflow
```bash
pnpm dev        # watch mode across all packages
pnpm typecheck  # type check all packages
pnpm test       # run all tests
pnpm lint       # lint all packages
```

## Branch strategy

- `main` — stable, released code only
- `dev` — active development, PRs target this branch
- `feat/your-feature` — feature branches off dev

## Commit style

We follow Conventional Commits:

- `feat: add queue retry logic`
- `fix: resolve circular dependency in container`
- `docs: update migration guide`
- `chore: bump fastify to 5.0`

## Pull Request checklist

- [ ] Types are strict — no `any`
- [ ] Tests pass (`pnpm test`)
- [ ] New features have tests
- [ ] SOLID principles followed
- [ ] No unnecessary boilerplate added
