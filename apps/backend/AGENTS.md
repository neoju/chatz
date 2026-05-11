# AGENTS.md

### DTOs and shared types

- `@chatz/dto` — Zod schemas (using `zod/v4` import path) **and** their inferred types. The single source of truth for request/response contracts shared between backend and frontend. Any new endpoint defines its schemas here, not inline in the router.
- `@chatz/shared` — runtime constants and enums shared across apps (e.g. `UserStatus`).


### Mongoose patterns

`User` schema uses `timestamps: true` (auto `createdAt`/`updatedAt`). The `UserStatus` enum is sourced from `@chatz/shared` and applied via `enum: Object.values(UserStatus)`. New schemas should follow the same `IFoo` interface + `mongoose.model<IFoo>('Foo', schema)` pattern, and import enums from `@chatz/shared` rather than defining them locally.

## Coding rules

- Use Model.id instead of `_id.toString()` to get the string version of _id
- Do not manually cast strings to `ObjectId` in queries unless the API requires it; let Mongoose cast when possible
- Never use magic numbers or magic string. Create constant in shared/constants.ts
