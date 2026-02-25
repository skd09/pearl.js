<p align="center">
  <h1 align="center">Pearl.js</h1>
  <p align="center">The TypeScript framework that does it right.</p>
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/@pearl/core?style=flat-square" alt="npm version" />
  <img src="https://img.shields.io/github/license/yourusername/pearl?style=flat-square" alt="license" />
  <img src="https://img.shields.io/github/actions/workflow/status/yourusername/pearl/ci.yml?style=flat-square" alt="CI" />
</p>

---

Pearl is a batteries-included, opinionated TypeScript framework for building production-grade APIs and full-stack applications — with the structure of Laravel and the performance of the modern Node.js ecosystem.

## Features

- IoC container with full dependency injection
- Decorator-based routing (`@Controller`, `@Get`, `@Post`...)
- Model + Migration separation (no Prisma schema lock-in)
- FormRequest validation with Zod
- ApiResource response transformers
- Auth with JWT and session guards + RBAC
- Queue jobs via BullMQ
- Event/Listener system
- Mailing with driver support
- Full CLI with generators (`pearl make:controller`, `pearl make:model`...)

## Quick Start
```bash
npx pearl new my-app
cd my-app
pearl serve
```

## Documentation

Coming soon at pearljs.dev

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)
  
## License

MIT
