# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**directors-palette-v2** is a Next.js 15 application using React 19, TypeScript, and Tailwind CSS v4. The project uses Turbopack for faster builds and development.

## Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production with Turbopack
npm start            # Start production server
npm run lint         # Run ESLint
```

The dev server runs on `http://localhost:3000`.

## Architecture

### Tech Stack
- **Framework**: Next.js 15.5.4 with App Router
- **React**: 19.1.0 (latest)
- **Build Tool**: Turbopack (enabled via `--turbopack` flag)
- **TypeScript**: Strict mode enabled
- **Styling**: Tailwind CSS v4 with PostCSS
- **Linting**: ESLint 9 with Next.js TypeScript config

### Project Structure
- `src/app/` - App Router pages and layouts
  - `layout.tsx` - Root layout with Geist font configuration
  - `page.tsx` - Homepage component
  - `globals.css` - Global styles and Tailwind directives
- Path alias `@/*` maps to `./src/*`

### TypeScript Configuration
- Target: ES2017
- Strict mode: enabled
- Module resolution: bundler
- JSX: preserve (handled by Next.js)

### Styling
- Uses Geist and Geist Mono fonts from `next/font/google`
- Tailwind CSS utility classes for all styling
- CSS custom properties for font families (`--font-geist-sans`, `--font-geist-mono`)

## Notes
- All builds use Turbopack for faster compilation
- The project is a fresh Next.js setup - currently contains only the default starter template

# CRITICAL ARCHITECTURE REMINDERS

## Before ANY Code Changes:
1. ✅ **Check Feature Scope**: Does this need a new feature module in `src/features/`?
2. ✅ **Extract Business Logic**: Move logic to services, not components
3. ✅ **Use Custom Hooks**: React state management goes in hooks
4. ✅ **Keep Components Small**: <70 lines, UI-focused only

## Component Architecture Checklist:
- [ ] Types defined first with validation
- [ ] Service layer for business logic
- [ ] Custom hook for React state
- [ ] Component focuses on UI only
- [ ] Dependency injection used
- [ ] Follow `src/features/context-pack` pattern exactly

For API testing use cURL utility

## Feature Module Structure:
```
src/features/[feature-name]/
├── components/           # UI Components (clean & focused <70 lines)
├── hooks/               # Custom hooks for state management
├── services/            # Business logic & data access
└── types/               # Type definitions with validation
```

# Best Practices

1. Always use ES6+ features and syntax.
2. Use proper TypeScript throughout.
3. Use proper error handling.
4. Use proper performance optimization.
5. Use proper testing. - Use /tests folder for testing

Always write clean, readable, and maintainable code. Use new architecture described in Architecture Overview section.

# For testing
For UI testing use playwright mcp server and either use already created reusable test case from /tests folder or created new one as per your needs. Take also opportunity to improve test cases and make them more reusable for future.