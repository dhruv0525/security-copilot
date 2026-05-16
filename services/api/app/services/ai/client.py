"""
Async OpenAI client wrapper.
Implemented in Phase 6.
"""
from __future__ import annotations
from openai import AsyncOpenAI
from app.config import get_settings


def get_openai_client() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=get_settings().openai_api_key)
