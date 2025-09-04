# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React frontend application built with Create React App that serves as a dashboard interface for a FastAPI backend. The app features a sidebar navigation with multiple pages for data visualization including tiles, timeseries charts, model management, and object tables.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm start

# Build for production
npm run build

# Run tests
npm test

# Run tests in watch mode (for development)
npm test -- --watchAll=false

# Run a single test file
npm test -- --testNamePattern="ComponentName"
```

## Architecture & Structure

### Main Application Structure
- `src/App.js` - Main application component with sidebar navigation and page routing
- `src/index.js` - Application entry point with React.StrictMode
- `src/lib/api.js` - Axios-based API client for FastAPI backend communication

### Component Organization
- `src/components/` - Main application components
- `src/components/ui/` - Reusable UI components using shadcn/ui patterns
- `src/lib/` - Utility functions and API layer
- `src/utils/` - Application utilities

### Key Components
- **Sidebar.js** - Main navigation sidebar
- **TileLayout.js** - Dashboard tile view
- **Models.js** - Model management interface
- **ModelTimeSeries.js** - Time series visualization for models
- **Timeseries.js** - General time series charts
- **ObjectTable.js** - Data table configuration view
- **PageHeader.js** - Consistent page header component

### UI System
This project uses shadcn/ui components with:
- Tailwind CSS for styling with custom CSS variables for theming
- Radix UI primitives for accessibility
- Class Variance Authority (CVA) for component variants
- Lucide React for icons

### API Integration
The application connects to a FastAPI backend at `http://127.0.0.1:8008` by default (configurable via `REACT_APP_API_URL`).

Key API endpoints:
- `/connect/models` - Model CRUD operations
- `/connect/streams` - Stream data retrieval

### Visualization Libraries
- **ECharts** (`echarts-for-react`) - Primary charting library for timeseries
- **uPlot** - Alternative lightweight plotting library
- **react-grid-layout** - Grid layout system for tile views

### State Management
Currently uses React's built-in state management with `useState`. The main app state tracks the active sidebar item for page routing.

## Configuration Files

- `components.json` - shadcn/ui configuration with component aliases
- `jsconfig.json` - JavaScript project configuration with path aliases (@/* → ./src/*)
- `tailwind.config.js` - Tailwind CSS configuration with custom theme extensions
- `postcss.config.js` - PostCSS configuration for Tailwind processing
