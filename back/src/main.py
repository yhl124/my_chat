from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from logging.handlers import RotatingFileHandler
import os
from contextlib import asynccontextmanager

from .config.settings import settings
from .api.chat import router as chat_router
from .services.vllm_client import vllm_client


# Setup logging with both console and file output
def setup_logging():
    log_level = logging.DEBUG if settings.debug else logging.INFO
    
    # Create logs directory
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    # Create formatter
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # Setup root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # File handler with rotation
    file_handler = RotatingFileHandler(
        os.path.join(log_dir, 'backend.log'),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)
    
    # Separate error log
    error_handler = RotatingFileHandler(
        os.path.join(log_dir, 'backend_error.log'),
        maxBytes=10*1024*1024,
        backupCount=3
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    root_logger.addHandler(error_handler)

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.app_name}")
    logger.info(f"vLLM server: {settings.vllm_base_url}")
    
    # Test connection to vLLM on startup
    try:
        models = await vllm_client.get_models()
        logger.info(f"Connected to vLLM server. Available models: {[m.id for m in models]}")
    except Exception as e:
        logger.warning(f"Could not connect to vLLM server: {e}")
    
    yield
    
    # Cleanup
    await vllm_client.close()
    logger.info("Application shutdown complete")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        description="FastAPI backend for AI chat application",
        version="1.0.0",
        debug=settings.debug,
        lifespan=lifespan
    )
    
    # CORS configuration
    allowed_origins = [settings.frontend_url]
    if settings.cloudflare_tunnel_url:
        allowed_origins.append(settings.cloudflare_tunnel_url)
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(chat_router)
    
    # Health check endpoint
    @app.get("/health")
    async def health_check():
        try:
            # Test vLLM connection
            models = await vllm_client.get_models()
            return {
                "status": "healthy",
                "vllm_connected": True,
                "available_models": len(models),
                "settings": {
                    "vllm_url": settings.vllm_base_url,
                    "frontend_url": settings.frontend_url,
                    "use_tunnel": settings.use_tunnel
                }
            }
        except Exception as e:
            return JSONResponse(
                status_code=503,
                content={
                    "status": "unhealthy",
                    "vllm_connected": False,
                    "error": str(e)
                }
            )
    
    # Root endpoint
    @app.get("/")
    async def root():
        return {
            "message": f"Welcome to {settings.app_name}",
            "docs": "/docs",
            "health": "/health"
        }
    
    return app


app = create_app()