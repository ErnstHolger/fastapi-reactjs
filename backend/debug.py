#!/usr/bin/env python3
"""Debug server for FastAPI application with breakpoint support."""

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8008,
        reload=True,
        log_level="debug"
    )