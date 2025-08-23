from typing import Optional, List, Literal
from pydantic import BaseModel
from datetime import datetime


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = None
    method: Literal["basic", "tuning", "rag", "websearch"] = "basic"
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    stream: bool = False


class ChatResponse(BaseModel):
    id: str
    role: Literal["assistant"]
    content: str
    timestamp: datetime
    method: Optional[str] = None
    model: Optional[str] = None
    tokens_per_second: Optional[float] = None


class ModelInfo(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    max_context: Optional[int] = None


class ModelsResponse(BaseModel):
    models: List[ModelInfo]
    count: int