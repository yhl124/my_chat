"""
vLLM Client Service

Provides interface to vLLM server for chat completions and model management.
Supports both streaming and non-streaming responses with proper error handling.

Key Features:
- OpenAI-compatible API integration
- Real-time streaming responses
- Model management and health checking
- Robust error handling with retries
- Connection pooling and timeout management

Usage:
    client = VLLMClient()
    models = await client.get_models()
    response = await client.chat_completion(messages, model)
    # Or for streaming:
    async for chunk in client.chat_completion_stream(messages, model):
        process_chunk(chunk)
"""

import httpx
from typing import List, Optional, Dict, Any, AsyncGenerator
import logging
import json
from ..config.settings import settings
from ..models.chat import ModelInfo, ChatMessage

logger = logging.getLogger(__name__)


class VLLMClient:
    """
    Client for interacting with vLLM server using OpenAI-compatible API.
    
    This client provides methods for:
    - Getting available models
    - Non-streaming chat completions
    - Streaming chat completions with real-time responses
    """
    def __init__(self):
        self.base_url = settings.vllm_base_url
        self.timeout = settings.api_timeout
        self.client = httpx.AsyncClient(timeout=self.timeout)
    
    async def get_models(self) -> List[ModelInfo]:
        try:
            response = await self.client.get(f"{self.base_url}/v1/models")
            response.raise_for_status()
            
            data = response.json()
            models = []
            
            for model_data in data.get("data", []):
                model_info = ModelInfo(
                    id=model_data["id"],
                    name=model_data.get("id", model_data["id"]),
                    description=model_data.get("description"),
                    max_context=model_data.get("max_model_len")
                )
                models.append(model_info)
            
            return models
            
        except httpx.RequestError as e:
            logger.error(f"Failed to connect to vLLM server: {e}")
            raise Exception(f"Failed to connect to vLLM server at {self.base_url}")
        except Exception as e:
            logger.error(f"Error getting models: {e}")
            raise
    
    async def chat_completion(
        self,
        messages: List[ChatMessage],
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = 0.7,
        stream: bool = False
    ) -> Dict[str, Any]:
        try:
            # Get available models if no model specified
            if not model:
                models = await self.get_models()
                if not models:
                    raise Exception("No models available")
                model = models[0].id
            
            # Convert messages to OpenAI format
            openai_messages = [
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ]
            
            payload = {
                "model": model,
                "messages": openai_messages,
                "max_tokens": max_tokens or settings.max_tokens,
                "temperature": temperature,
                "stream": stream
            }
            
            logger.info(f"Sending request to vLLM: {self.base_url}/v1/chat/completions")
            logger.debug(f"Request payload: {payload}")
            
            response = await self.client.post(
                f"{self.base_url}/v1/chat/completions",
                json=payload
            )
            
            logger.info(f"vLLM response status: {response.status_code}")
            logger.debug(f"vLLM response headers: {dict(response.headers)}")
            
            response.raise_for_status()
            
            response_text = response.text
            logger.debug(f"vLLM response text length: {len(response_text)}")
            
            if not response_text.strip():
                logger.error("Empty response from vLLM server")
                raise Exception("Empty response from vLLM server")
            
            try:
                response_json = response.json()
                logger.info("Successfully parsed vLLM response")
                return response_json
            except Exception as parse_error:
                logger.error(f"Failed to parse vLLM response: {parse_error}")
                logger.error(f"Response content: {response_text[:500]}...")
                raise Exception(f"Invalid JSON response from vLLM: {parse_error}")
            
        except httpx.RequestError as e:
            logger.error(f"Failed to send chat request: {e}")
            logger.error(f"Request details - URL: {self.base_url}/v1/chat/completions")
            logger.error(f"Request payload: {payload}")
            raise Exception(f"Failed to communicate with vLLM server: {str(e)}")
        except Exception as e:
            logger.error(f"Error in chat completion: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Request payload: {payload}")
            raise Exception(f"Chat completion error: {str(e)}")
    
    async def chat_completion_stream(
        self,
        messages: List[ChatMessage],
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = 0.7
    ) -> AsyncGenerator[Dict[str, Any], None]:
        try:
            # Get available models if no model specified
            if not model:
                models = await self.get_models()
                if not models:
                    raise Exception("No models available")
                model = models[0].id
            
            # Convert messages to OpenAI format
            openai_messages = [
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ]
            
            payload = {
                "model": model,
                "messages": openai_messages,
                "max_tokens": max_tokens or settings.max_tokens,
                "temperature": temperature,
                "stream": True
            }
            
            logger.info(f"Sending streaming request to vLLM: {self.base_url}/v1/chat/completions")
            logger.debug(f"Streaming payload: {payload}")
            
            async with self.client.stream(
                "POST",
                f"{self.base_url}/v1/chat/completions",
                json=payload
            ) as response:
                logger.info(f"vLLM streaming response status: {response.status_code}")
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data.strip() == "[DONE]":
                            logger.info("Streaming completed (received [DONE])")
                            break
                        try:
                            chunk = json.loads(data)
                            logger.debug(f"Streaming chunk: {chunk}")
                            yield chunk
                        except json.JSONDecodeError as e:
                            logger.warning(f"Failed to parse streaming chunk: {e}, data: {data}")
                            continue
                            
        except httpx.RequestError as e:
            logger.error(f"Failed to send streaming request: {e}")
            raise Exception(f"Failed to communicate with vLLM server")
        except Exception as e:
            logger.error(f"Error in streaming completion: {e}")
            raise
    
    async def close(self):
        await self.client.aclose()


vllm_client = VLLMClient()