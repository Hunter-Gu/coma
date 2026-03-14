# Coma

## React

## drizzle & D1

Install:

```sh
pnpm add drizzle-orm
pnpm add -D drizzle-kit
```

If db is not used:
- remove `packages/app/src/db`
- remove `packages/app/src/utils/with-db.ts`

## Clerk

Install:

```sh
pnpm add @clerk/clerk-react @clerk/backend
```

```sh
pnpm add @clerk/astro
```

update astro config:

```diff
import { defineConfig } from 'astro/config'
+ import clerk from '@clerk/astro'

export default defineConfig({
	...,

+  integrations: [clerk()],
})
```

If auth is not used:
- remove `packages/app/src/utils/verify-user.ts`
- remove `packages/app/src/middleware.ts`
