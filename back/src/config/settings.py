from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "AI Chat Backend"
    debug: bool = False
    
    # Server configuration
    host: str = "localhost"
    port: int = 3001
    
    # Frontend URL for CORS
    frontend_url: str = "http://localhost:3000"
    
    # vLLM server configuration
    vllm_host: str = "localhost"
    vllm_port: int = 8000
    vllm_base_url: str = Field(default="", description="Computed from host and port")
    
    # Cloudflare tunnel support
    cloudflare_tunnel_url: str = ""
    use_tunnel: bool = False
    
    # API configuration
    api_timeout: int = 120  # Increased timeout for LLM responses
    max_tokens: int = 2048
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False
    }
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.vllm_base_url:
            self.vllm_base_url = f"http://{self.vllm_host}:{self.vllm_port}"


settings = Settings()