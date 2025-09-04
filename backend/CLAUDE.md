# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Server Management
- **Start development server**: `python start.ps1` or `python -m uvicorn app.main:app --host 127.0.0.1 --port 8008 --reload --log-level debug`
- **Debug server**: `python debug.py` (includes breakpoint support)
- **Server URL**: http://127.0.0.1:8008

### Testing
- **Run all tests**: `.venv/Scripts/python.exe -m pytest tests/ -v`
- **Run unit tests only**: `.venv/Scripts/python.exe -m pytest tests/ -m unit -v`
- **Run integration tests**: `.venv/Scripts/python.exe -m pytest tests/ -m integration -v`
- **Run specific test**: `.venv/Scripts/python.exe -m pytest tests/test_main.py::test_health_check -v`

### Code Quality
- **Lint code**: `ruff check`
- **Lint with fix**: `ruff check --fix`

### Environment Setup
- **Activate virtual environment**: `.venv/Scripts/activate`
- **Install dependencies**: `.venv/Scripts/python.exe -m pip install -r requirements.txt`

## Architecture Overview

This is a FastAPI backend that serves as a gateway to the AVEVA Data Hub (ADH) service for ML model management and data operations.

### Core Components

**app/main.py**: Main FastAPI application with CORS middleware configured for React frontend (localhost:3000). Contains all API endpoints for ADH operations including types, streams, assets, asset types, and ML models.

**app/client.py**: ADH client singleton management with environment variable validation. Handles authentication and connection to AVEVA Data Hub using the `adh_sample_library_preview` library.

**app/model.py**: ML model and asset type creation utilities. Defines structures for forecasting models with metadata like model_type, sampling_rate, training_horizon, etc. Creates ADH streams and asset types for ML workflows.

### Key Dependencies

- **FastAPI**: Web framework with automatic OpenAPI documentation
- **adh_sample_library_preview**: AVEVA Data Hub SDK for data operations
- **python-dotenv**: Environment variable management from .env file
- **uvicorn**: ASGI server for FastAPI

### Environment Configuration

Required environment variables in .env:
- API_VERSION, NAMESPACE_ID, CLIENT_ID, TENANT_ID, CLIENT_SECRET, RESOURCE

### API Endpoints

The application provides REST endpoints for:
- Health checks and status
- ADH types, streams, assets, and asset types management  
- ML model CRUD operations with metadata
- Time series data retrieval (interpolated and sampled values)

### Testing Structure

Tests are organized by component (test_main.py, test_client.py, test_model.py) with fixtures for FastAPI TestClient and ADH client. Uses pytest markers for unit/integration test separation.