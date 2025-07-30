# Ollama VRAM Calculator - Technical Documentation

## Project Overview
A Next.js-based web application designed to help users calculate and manage VRAM requirements for Ollama AI models. Built with TypeScript and modern React patterns, this tool provides VRAM calculations, benchmarking capabilities, and model management features.

## Tech Stack
- **Framework**: Next.js 14.2.16
- **Language**: TypeScript 5
- **UI Framework**: React 18
- **Styling**: TailwindCSS 3.4
- **Component Library**: Custom components built with Radix UI primitives
- **State Management**: React Query (TanStack Query)
- **Form Handling**: React Hook Form with Zod validation
- **Theming**: next-themes for dark/light mode support

## Core Components

### VRAM Calculator
Located in `lib/vram-calculator.ts`, the VRAM calculation engine implements sophisticated algorithms to estimate memory requirements:
- Supports multiple precision types (fp32, fp16, int8, int4)
- Calculates base model VRAM requirements
- Estimates context buffer based on model architecture
- Accounts for framework overhead
- Dynamic layer estimation based on model size

### API Integration
REST API endpoints under `app/api/ollama/`:
- `/benchmark`: Model performance testing
- `/chat`: Chat interface integration
- `/models`: Model management
- `/stress-test`: System load testing
- `/test-connection`: Server connectivity checks

### Key Features
1. **Model Management** (`components/model-list.tsx`)
   - List and manage Ollama models
   - Model status monitoring

2. **Benchmarking** (`components/model-benchmark.tsx`)
   - Performance metrics collection
   - Comparative analysis

3. **Server Connection** (`components/server-connection.tsx`)
   - Server status monitoring
   - Connection management

4. **System Prompt Management** (`components/system-prompt-manager.tsx`)
   - Custom prompt configuration
   - Template management

5. **Stress Testing** (`components/stress-test.tsx`)
   - System load analysis
   - Performance boundary testing

## UI Components
Extensive set of reusable UI components in `components/ui/`:
- Form elements (inputs, selectors, buttons)
- Navigation components
- Modal dialogs
- Data display components
- Interactive elements

## Custom Hooks
- `use-mobile.tsx`: Responsive design utilities
- `use-toast.ts`: Toast notification system

## Project Architecture
- `/app`: Next.js app router structure
- `/components`: React components
- `/lib`: Core utilities and types
- `/public`: Static assets
- `/styles`: Global styling

## Build & Development
```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
