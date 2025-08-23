from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import List, AsyncGenerator
import uuid
from datetime import datetime
import time
import logging
import json

from ..models.chat import ChatRequest, ChatResponse, ChatMessage, ModelsResponse
from ..services.vllm_client import vllm_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])


@router.get("/models", response_model=ModelsResponse)
async def get_models():
    try:
        models = await vllm_client.get_models()
        return ModelsResponse(models=models, count=len(models))
    except Exception as e:
        logger.error(f"Error getting models: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/basic", response_model=ChatResponse)
async def chat_basic(request: ChatRequest):
    if request.stream:
        return StreamingResponse(
            _stream_chat(request, "basic"),
            media_type="text/plain; charset=utf-8",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable nginx buffering
            }
        )
    return await _handle_chat(request, "basic")


@router.post("/chat/tuning", response_model=ChatResponse)
async def chat_tuning(request: ChatRequest):
    # 임시로 비활성화 - 개발 중
    raise HTTPException(status_code=501, detail="튜닝 모델은 현재 개발 중입니다. 곧 지원될 예정입니다.")


@router.post("/chat/rag", response_model=ChatResponse)
async def chat_rag(request: ChatRequest):
    # 임시로 비활성화 - 개발 중
    raise HTTPException(status_code=501, detail="RAG 모델은 현재 개발 중입니다. 곧 지원될 예정입니다.")


@router.post("/chat/websearch", response_model=ChatResponse)
async def chat_websearch(request: ChatRequest):
    # 임시로 비활성화 - 개발 중
    raise HTTPException(status_code=501, detail="웹검색 모델은 현재 개발 중입니다. 곧 지원될 예정입니다.")


async def _stream_chat(request: ChatRequest, method: str) -> AsyncGenerator[str, None]:
    try:
        start_time = time.time()
        response_id = str(uuid.uuid4())
        
        # Create message history for context
        messages = [
            ChatMessage(role="user", content=request.message)
        ]
        
        # Add method-specific system prompts if needed
        if method == "tuning":
            system_msg = ChatMessage(
                role="system", 
                content="You are a fine-tuned model optimized for specific tasks."
            )
            messages.insert(0, system_msg)
        elif method == "rag":
            system_msg = ChatMessage(
                role="system",
                content="You are a RAG-enabled assistant with access to additional context."
            )
            messages.insert(0, system_msg)
        elif method == "websearch":
            system_msg = ChatMessage(
                role="system",
                content="You are an assistant with web search capabilities."
            )
            messages.insert(0, system_msg)
        
        # Enable streaming in vLLM request
        stream_generator = vllm_client.chat_completion_stream(
            messages=messages,
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        
        # Stream the response
        full_content = ""
        chunk_count = 0
        async for chunk in stream_generator:
            chunk_count += 1
            logger.debug(f"Received chunk {chunk_count}: {chunk}")
            
            if chunk.get("choices") and len(chunk["choices"]) > 0:
                delta = chunk["choices"][0].get("delta", {})
                if "content" in delta and delta["content"]:
                    content_chunk = delta["content"]
                    full_content += content_chunk
                    logger.debug(f"Yielding content chunk: '{content_chunk}' (length: {len(content_chunk)}) (repr: {repr(content_chunk)})")
                    # Only yield the raw content without newlines to avoid duplication
                    yield content_chunk
        
        # Send final metadata
        end_time = time.time()
        time_taken = end_time - start_time
        
        yield f"[METADATA]{json.dumps({
            'id': response_id,
            'method': method if method != 'basic' else None,
            'timestamp': datetime.now().isoformat(),
            'time_taken': round(time_taken, 2),
            'total_chars': len(full_content)
        })}[/METADATA]"
        
    except Exception as e:
        logger.error(f"Error in stream chat {method}: {e}")
        yield f"[ERROR]스트리밍 중 오류가 발생했습니다: {str(e)}[/ERROR]"


async def _handle_chat(request: ChatRequest, method: str) -> ChatResponse:
    try:
        start_time = time.time()
        
        # Create message history for context
        messages = [
            ChatMessage(role="user", content=request.message)
        ]
        
        # Add method-specific system prompts if needed
        if method == "tuning":
            system_msg = ChatMessage(
                role="system", 
                content="You are a fine-tuned model optimized for specific tasks."
            )
            messages.insert(0, system_msg)
        elif method == "rag":
            system_msg = ChatMessage(
                role="system",
                content="You are a RAG-enabled assistant with access to additional context."
            )
            messages.insert(0, system_msg)
        elif method == "websearch":
            system_msg = ChatMessage(
                role="system",
                content="You are an assistant with web search capabilities."
            )
            messages.insert(0, system_msg)
        
        # Call vLLM
        response_data = await vllm_client.chat_completion(
            messages=messages,
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            stream=request.stream
        )
        
        # Extract response content
        content = response_data["choices"][0]["message"]["content"]
        end_time = time.time()
        
        # Calculate tokens per second (approximate)
        usage = response_data.get("usage", {})
        completion_tokens = usage.get("completion_tokens", 0)
        time_taken = end_time - start_time
        tokens_per_second = completion_tokens / time_taken if time_taken > 0 else 0
        
        return ChatResponse(
            id=str(uuid.uuid4()),
            role="assistant",
            content=content,
            timestamp=datetime.now(),
            method=method if method != "basic" else None,
            model=response_data.get("model"),
            tokens_per_second=round(tokens_per_second, 2)
        )
        
    except Exception as e:
        logger.error(f"Error in chat {method}: {e}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")