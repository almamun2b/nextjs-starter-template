# Next.js Starter Template

A modern, highly-optimized Next.js starter template packed with **React 19**, **Tailwind CSS v4**, **shadcn/ui**, **Prettier**, and **Husky** for a seamless development experience.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com)

## 🚀 Features

- ⚡ **Next.js 16** with App Router
- ⚛️ **React 19** with latest features
- 🎨 **Tailwind CSS v4** with PostCSS
- 🧩 **shadcn/ui** component library
- 📝 **TypeScript** for type safety
- 🔍 **ESLint** for code quality
- 💅 **Prettier** with Tailwind plugin for formatting
- 🔐 **Husky** & **lint-staged** for pre-commit hooks
- 📋 **React Hook Form** for form management
- ✅ **Zod** for schema validation
- 📅 **date-fns** for date manipulation
- 🎬 **Sonner** for toast notifications
- 🎨 **Lucide React** for icons
- 🌙 **next-themes** for dark mode support
- 🔄 **Production-ready fetch utility** with TypeScript support

## 📋 Prerequisites

- **Node.js**: 18.17.0 or higher
- **pnpm**: 8.0.0 or higher (or npm/yarn/bun)

## 🛠️ Installation

### Clone the repository

```bash
git clone https://github.com/almamun2b/nextjs-starter-template.git
cd nextjs-starter-template
```

### Install dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or use npm
npm install

# Or use yarn
yarn install

# Or use bun
bun install
```

## 🧪 Development

### Start the development server

```bash
# Using pnpm (recommended)
pnpm dev

# Or use npm
npm run dev

# Or use yarn
yarn dev

# Or use bun
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

The page auto-updates as you edit files.

### Build for production

```bash
pnpm build
pnpm start
```

## 📚 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Run ESLint with auto-fix |
| `pnpm format` | Format code with Prettier |
| `pnpm typecheck` | Check TypeScript types |
| `pnpm prepare` | Setup Husky hooks |

> **Note:** Replace `pnpm` with `npm run`, `yarn`, or `bun` if you prefer a different package manager.

## 📦 Tech Stack

### Core Framework
- **Next.js** (16.2.9) - React framework for production
- **React** (19.2.4) - UI library
- **React DOM** (19.2.4) - React rendering for web

### Styling & UI
- **Tailwind CSS** (4) - Utility-first CSS framework
- **Tailwind CSS PostCSS** (4) - PostCSS plugin for Tailwind
- **shadcn/ui** (4.11.0) - High-quality React components
- **Lucide React** (1.21.0) - Beautiful SVG icons
- **next-themes** (0.4.6) - Theme management (dark mode)

### Forms & Validation
- **React Hook Form** (7.80.0) - Performant form management
- **@hookform/resolvers** (5.4.0) - Schema validation resolvers
- **Zod** (4.4.3) - TypeScript-first schema validation

### Utilities
- **date-fns** (4.4.0) - Modern date utility library
- **clsx** (2.1.1) - Utility for constructing className strings
- **tailwind-merge** (3.6.0) - Merge Tailwind classes
- **sonner** (2.0.7) - Toast notification library
- **set-cookie-parser** (3.1.2) - Parse Set-Cookie headers
- **class-variance-authority** (0.7.1) - CSS class composition
- **tw-animate-css** (1.4.0) - Animation utilities
- **radix-ui** (1.6.0) - Headless UI primitives

### Development Tools
- **TypeScript** (5) - Type-safe JavaScript
- **ESLint** (9) - JavaScript linter
- **Prettier** (3.8.3) - Code formatter
- **Prettier Plugin Tailwind CSS** (0.8.0) - Tailwind class sorting
- **Husky** (9.1.7) - Git hooks
- **lint-staged** (17.0.8) - Run linters on staged files
- **Babel Plugin React Compiler** (1.0.0) - React compilation

## 🎯 Project Structure

```
nextjs-starter-template/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── ...
├── components/            # Reusable React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities and helpers
│   ├── fetch/            # Type-safe fetch utility
│   ├── utils.ts          # Common utilities
│   └── ...
├── public/               # Static assets
├── package.json          # Project dependencies
├── pnpm-lock.yaml        # pnpm lock file
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── eslint.config.js      # ESLint configuration
└── README.md             # This file
```

## 🔄 Fetch Utility

This template includes a **production-ready, type-safe fetch utility** in `lib/fetch/`. Features:

- ✅ Full TypeScript support with generic types
- ✅ Automatic request/response serialization
- ✅ Lifecycle hooks (`onRequest`, `onResponse`, `onSuccess`, `onError`)
- ✅ Query parameters & body serialization
- ✅ Error handling with `FetchError`
- ✅ React hook for client components (`useFetch`)
- ✅ Next.js caching support (`next.revalidate`, `next.tags`)
- ✅ HttpOnly cookie authentication support
- ✅ Server-side and client-side ready

### Quick Example

```ts
import { $fetch } from '@/lib/fetch'
import type { TUserResponse } from '@/types/user.types'

// Direct usage
const { data, ok } = await $fetch<TUserResponse>('/users', {
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
})

// Or create a preconfigured instance
import { createFetch } from '@/lib/fetch'

export const api = createFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  headers: { Accept: 'application/json' },
})

const { data } = await api.get<TUserResponse>('/users')
```

For detailed documentation, see [`lib/fetch/README.md`](./lib/fetch/README.md).

## 🎨 Styling

### Tailwind CSS

This project uses **Tailwind CSS v4** with PostCSS. Customize your theme in `tailwind.config.ts`:

```ts
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
      },
    },
  },
}
```

### Using shadcn/ui

Add components using the CLI:

```bash
pnpm exec shadcn-ui@latest add button
pnpm exec shadcn-ui@latest add input
```

Or with npm:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
```

## 🌙 Dark Mode

Dark mode is configured with `next-themes`. Update your root layout:

```tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

## ✅ Code Quality

### ESLint

```bash
pnpm lint        # Check for issues
pnpm lint:fix    # Auto-fix issues
```

### Prettier

```bash
pnpm format      # Format all TypeScript files
```

### Type Checking

```bash
pnpm typecheck   # Verify TypeScript types
```

### Husky & lint-staged

Git hooks are automatically installed. Pre-commit hooks will:
- Run ESLint on staged files
- Format code with Prettier
- Check TypeScript types

## 📦 Deployment

### Vercel (Recommended)

The easiest way to deploy is using [Vercel Platform](https://vercel.com):

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/new)
3. Import your repository
4. Vercel auto-detects Next.js and configures the build settings
5. Click Deploy

**Vercel automatically detects pnpm** and uses it if `pnpm-lock.yaml` is present.

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
RUN corepack enable pnpm
COPY pnpm-lock.yaml ./
RUN pnpm fetch

FROM base AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY pnpm-lock.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM base AS runner
WORKDIR /app
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Other Platforms

- [AWS Amplify](https://docs.amplify.aws/nextjs/)
- [Netlify](https://www.netlify.com/blog/2020/11/30/how-to-deploy-next.js-sites-to-netlify/)
- [Railway](https://railway.app/)
- [Render](https://render.com/)

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [pnpm Documentation](https://pnpm.io/)

## 🐛 Troubleshooting

### Port 3000 is already in use

```bash
# On macOS/Linux
lsof -i :3000
kill -9 <PID>

# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Or use a different port:

```bash
pnpm dev -- -p 3001
```

### Node modules issues

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript errors

```bash
pnpm typecheck
```

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Md Abdullah Al Mamun**
- Email: [almamun2b@gmail.com](mailto:almamun2b@gmail.com)
- Portfolio: [portfolio-mamun.vercel.app](https://portfolio-mamun.vercel.app)
- GitHub: [@almamun2b](https://github.com/almamun2b)

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🆘 Support

If you have any questions or need help, please:

- Open an [issue](https://github.com/almamun2b/nextjs-starter-template/issues)
- Check existing [discussions](https://github.com/almamun2b/nextjs-starter-template/discussions)
- Email: [almamun2b@gmail.com](mailto:almamun2b@gmail.com)

## 🎉 Acknowledgments

This template is built with awesome open-source projects:
- [Next.js](https://nextjs.org)
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [pnpm](https://pnpm.io/)
- And many more...

---

**Happy coding!** 🚀
