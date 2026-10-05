"""FastAPI reference backend for 译灵.

Production notes:
- Replace the small built-in dictionaries with CC-CEDICT + WordNet + Kaikki.
- Keep DeepSeek API keys server-side only; never expose them to the client.
- Add Redis caching and PostgreSQL persistence as the service grows.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Literal

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.db import get_session, init_db
from app.dictionary import lookup_entry


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="译灵 API", version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

Lang = Literal["auto", "en", "zh"]


class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    source_lang: Lang = "auto"
    target_lang: Literal["en", "zh"] = "zh"


class LookupRequest(BaseModel):
    word: str = Field(min_length=1, max_length=64)


MINI_EN = {
    "hello": "你好；问候",
    "world": "世界；地球",
    "translate": "翻译",
    "dictionary": "词典；字典",
    "intelligent": "智能的；聪明的",
    "artificial": "人工的；人造的",
    "language": "语言",
    "meaning": "意思；含义",
}

MINI_ZH = {
    "你好": "hello",
    "世界": "world",
    "翻译": "translate",
    "词典": "dictionary",
    "字典": "dictionary",
    "智能": "intelligent",
    "人工": "artificial",
    "语言": "language",
    "意思": "meaning",
}


def detect_lang(text: str) -> str:
    return "zh" if any("\u4e00" <= ch <= "\u9fff" for ch in text) else "en"


def builtin_translate(text: str, source: str, target: str) -> str | None:
    key = text.strip().lower()
    if source == "en" and target == "zh":
        return MINI_EN.get(key)
    if source == "zh" and target == "en":
        return MINI_ZH.get(text.strip())
    return None


async def deepseek_translate(text: str, source: str, target: str) -> str:
    api_key = os.getenv("DEEPSEEK_API_KEY", "").strip()
    base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/")
    model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    if not api_key:
        raise RuntimeError("DEEPSEEK_API_KEY is not configured")

    from_name = "中文" if source == "zh" else "英语"
    to_name = "中文" if target == "zh" else "英语"
    prompt = (
        f"你是专业的英中翻译。请把下面的{from_name}翻译成自然、地道的{to_name}，"
        f"只返回译文本身，不要解释：\n\n{text}"
    )
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{base_url}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": "You are a professional translator."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
            },
        )
        response.raise_for_status()
        data = response.json()
    return data["choices"][0]["message"]["content"].strip()


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/translate")
async def translate(payload: TranslateRequest) -> dict[str, str]:
    text = payload.text.strip()
    source = detect_lang(text) if payload.source_lang == "auto" else payload.source_lang
    target = payload.target_lang
    if source == target:
        return {"translation": text, "engine": "identity"}

    builtin = builtin_translate(text, source, target)
    if builtin:
        return {"translation": builtin, "engine": "builtin"}

    try:
        translation = await deepseek_translate(text, source, target)
        return {"translation": translation, "engine": "deepseek"}
    except RuntimeError:
        return {
            "translation": "",
            "engine": "unconfigured",
            "detail": "Set DEEPSEEK_API_KEY to enable AI translation.",
        }
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"DeepSeek request failed: {exc}") from exc


@app.post("/lookup")
async def lookup(payload: LookupRequest) -> dict[str, object]:
    word = payload.word.strip()
    source = detect_lang(word)
    session = get_session()
    try:
        entry = lookup_entry(session, word, lang=source)
    finally:
        session.close()

    if entry:
        return entry

    if source == "en":
        meaning = MINI_EN.get(word.lower(), "")
        return {"word": word, "language": "en", "meaning": meaning, "source": "builtin"}
    meaning = MINI_ZH.get(word, "")
    return {"word": word, "language": "zh", "meaning": meaning, "source": "builtin"}
