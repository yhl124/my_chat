#!/usr/bin/env python3
import uvicorn
import os
from src.config.settings import settings

if __name__ == "__main__":
    # Use environment PORT if available, otherwise use settings port
    port = int(os.environ.get("PORT", settings.port))
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=port,
        reload=settings.debug,
        log_level="info" if not settings.debug else "debug"
    )