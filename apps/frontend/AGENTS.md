# AGENTS.md - Frontend

- This app is using Sveltekit but build for CSR - SPA
- Use shadcn CLI to add missing shadcn components
- Do not modify the shadcn's components in lib/components/ui
- Always do and check the cross device responsive
- Before integrate API always check the packages/dto for the API contract
- Never use deprecated features and functions
- Use zod and packages/dto for validation
- Create custom validate error text below input, never use input auto-complete
- Use this cred for testing purpose: test@example.com / password123
- Use `@lucide/svelte` for icons

## TailwindCSS best practices

- For COMPLEX and long styles, use `cn` ultils or `@apply` to compact multiple classes to make the template code clean

