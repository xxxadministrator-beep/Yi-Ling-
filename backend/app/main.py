"""FastAPI backend for 译灵.

Endpoints:
- ``/translate``  English <-> Chinese translation through DeepSeek.
- ``/lookup``     dictionary aggregation: local corpus (CC-CEDICT, WordNet,
                  Kaikki) merged with live WordNet, Wiktionary and Datamuse.
- ``/chat``       conversational assistant used by the client's AI 对话 sheet.

Production notes:
- Keep DeepSeek API keys server-side only; never expose them to the client.
- Run ``python -m scripts.import_all`` to fill PostgreSQL with local dictionary
  dumps; lookups still work without them because the online sources answer.
- Add Redis caching and rate limiting as the service grows.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import secrets
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.db import get_session, init_db
from app.dictionary import lookup_word
from app.models import AuthToken, User

# Load backend/.env so DEEPSEEK_API_KEY lives outside the codebase (the file is
# gitignored). Existing environment variables always win over the file.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="译灵 API", version="0.3.0", lifespan=lifespan)
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


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=40)


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=64)
    email: str = Field(min_length=3, max_length=128)
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=128)
    password: str = Field(min_length=1, max_length=128)


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

CHAT_SYSTEM_PROMPT = (
    "你是译灵翻译的 AI 助手，服务中文用户学习英语（也支持英语用户学习中文）。"
    "回答时用简体中文，必要时给出英文对应表达。解释单词时说明词性、常见搭配和例句；"
    "翻译时给出自然、地道的译文，并在需要时补充更口语或更正式的说法。回答保持简洁。"
)


def detect_lang(text: str) -> str:
    return "zh" if any("一" <= ch <= "鿿" for ch in text) else "en"


def builtin_translate(text: str, source: str, target: str) -> str | None:
    key = text.strip().lower()
    if source == "en" and target == "zh":
        return MINI_EN.get(key)
    if source == "zh" and target == "en":
        return MINI_ZH.get(text.strip())
    return None


# --------------------------------------------------------------------------- #
# accounts
# --------------------------------------------------------------------------- #

_PBKDF2_ITERATIONS = 120_000


def hash_password(password: str) -> str:
    """Hash a password with a per-user random salt (PBKDF2-HMAC-SHA256)."""
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), _PBKDF2_ITERATIONS
    ).hex()
    return f"{salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, digest = stored.split("$", 1)
    except ValueError:
        return False
    candidate = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), _PBKDF2_ITERATIONS
    ).hex()
    return secrets.compare_digest(candidate, digest)


def issue_token(session, user_id: int) -> str:
    token = secrets.token_hex(32)
    session.add(AuthToken(user_id=user_id, token=token, created_at=int(time.time())))
    return token


def public_user(user: User) -> dict[str, str]:
    return {"name": user.name, "email": user.email}


def deepseek_config() -> tuple[str, str, str]:
    api_key = os.getenv("DEEPSEEK_API_KEY", "").strip()
    base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/")
    model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    return api_key, base_url, model


async def deepseek_completion(
    messages: list[dict[str, str]], temperature: float = 0.2, timeout: float = 45.0
) -> str:
    api_key, base_url, model = deepseek_config()
    if not api_key:
        raise RuntimeError("DEEPSEEK_API_KEY is not configured")

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            f"{base_url}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={"model": model, "messages": messages, "temperature": temperature},
        )
        response.raise_for_status()
        data = response.json()
    return data["choices"][0]["message"]["content"].strip()


async def deepseek_translate(text: str, source: str, target: str, timeout: float = 45.0) -> str:
    from_name = "中文" if source == "zh" else "英语"
    to_name = "中文" if target == "zh" else "英语"
    prompt = (
        f"你是专业的英中翻译。请把下面的{from_name}翻译成自然、地道的{to_name}，"
        f"只返回译文本身，不要解释：\n\n{text}"
    )
    return await deepseek_completion(
        [
            {"role": "system", "content": "You are a professional translator."},
            {"role": "user", "content": prompt},
        ],
        timeout=timeout,
    )


DEF_ZH_TIMEOUT = 6.0
DEF_ZH_CAP = 12

# In-memory TTL cache for DeepSeek translations. Word definitions and zh<->en
# translations change rarely, so a repeat lookup of the same word should not pay
# for another API call; one process-wide cache is enough for a single-host
# deployment (Redis would replace this at scale).
_CACHE_TTL = 3600.0
_CACHE_MAX = 2000
_cache: dict[str, tuple[float, object]] = {}


def _cache_get(key: str) -> object | None:
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < _CACHE_TTL:
        return hit[1]
    return None


def _cache_set(key: str, value: object) -> None:
    _cache[key] = (time.time(), value)
    if len(_cache) > _CACHE_MAX:
        _cache.pop(min(_cache, key=lambda k: _cache[k][0]), None)


def _parse_json_array(text: str) -> list[str]:
    """Pull the first JSON array of strings out of a model reply, if present."""
    try:
        data = json.loads(text)
    except Exception:
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if not match:
            return []
        try:
            data = json.loads(match.group(0))
        except Exception:
            return []
    if isinstance(data, list):
        return [str(item).strip() for item in data if str(item).strip()]
    return []


async def translate_definitions_zh(word: str, senses: list[dict[str, object]]) -> None:
    """Translate English definitions into Chinese glosses via DeepSeek, in place.

    Best effort: when the model is unreachable or returns an unusable shape the
    entry keeps its English-only definitions, which the client already renders.
    The request is one flat, ordered round-trip, so the client never has to
    guess which gloss belongs to which definition. Translations are cached per
    word, so a repeat lookup does not call the API again.
    """
    cache_key = f"defzh:{word.lower()}"
    known = _cache_get(cache_key)
    if not isinstance(known, dict):
        known = {}

    pending: list[tuple[dict[str, object], str, str]] = []
    for sense in senses:
        pos = str(sense.get("pos") or "other")
        for definition in sense.get("definitions") or []:
            if not isinstance(definition, dict):
                continue
            en = (definition.get("en") or "").strip()
            zh = (definition.get("zh") or "").strip()
            if not en or zh:
                continue
            if en in known:
                definition["zh"] = known[en]
                continue
            pending.append((definition, pos, en))

    if not pending:
        return

    numbered = "\n".join(
        f"{i}. [{pos}] {en}" for i, (_definition, pos, en) in enumerate(pending, 1)
    )
    prompt = (
        "你是英汉词典编纂助手。请把下面这些英文词典释义逐条翻译成简明中文。\n"
        f"单词：{word}\n"
        "要求：按序号逐条翻译；每条给出 1-2 个简短中文说法，近义说法用“，”连接；"
        "方括号里的词性仅供参考，不要写进译文。\n"
        "只输出一个 JSON 数组，元素是各条释义对应的中文字符串，顺序与序号完全一致，"
        "不要输出任何解释或代码块标记。\n\n"
        f"{numbered}"
    )

    try:
        result = await deepseek_completion(
            [{"role": "user", "content": prompt}], temperature=0.1, timeout=DEF_ZH_TIMEOUT
        )
    except Exception:
        return

    for (definition, _pos, en), gloss in zip(pending, _parse_json_array(result)):
        definition["zh"] = gloss
        known[en] = gloss
    _cache_set(cache_key, known)


def _refresh_translations(entry: dict[str, object]) -> None:
    """Sync the top-level ``translations`` list with the translated glosses."""
    glosses: list[str] = []
    for sense in entry.get("senses") or []:
        if not isinstance(sense, dict):
            continue
        for definition in sense.get("definitions") or []:
            if not isinstance(definition, dict):
                continue
            zh = (definition.get("zh") or "").strip()
            if zh and zh not in glosses:
                glosses.append(zh)
    if not glosses:
        return
    existing = [t for t in (entry.get("translations") or []) if t and t not in glosses]
    entry["translations"] = (existing + glosses)[:DEF_ZH_CAP]


async def _lookup_chinese_via_english(word: str) -> dict[str, object] | None:
    """Look up a Chinese word by translating it to English first.

    CC-CEDICT is not imported and Wiktionary's Chinese section is thin, so a
    Chinese query usually has nothing to aggregate. DeepSeek's zh->en translation
    is far more reliable than the client-side MyMemory fallback (which can return
    pinyin fragments like "bang zhu"), so translate here, look up the English
    word, and present it as the Chinese word's entry.
    """
    cache_key = f"zh2en:{word}"
    cached = _cache_get(cache_key)
    english = cached if isinstance(cached, str) else ""
    if not english:
        try:
            english = (await deepseek_translate(word, "zh", "en", timeout=12.0)).strip()
        except Exception:
            return None
        if english:
            _cache_set(cache_key, english)

    first_word = english.split()[0].strip(".,;:()[]") if english.split() else ""
    if not first_word or not first_word.isascii():
        return None

    session = get_session()
    try:
        entry = await lookup_word(session, first_word, lang="en")
    finally:
        session.close()
    if not entry or not entry.get("senses"):
        return None

    entry["word"] = word
    entry["language"] = "zh"
    entry["phonetic_uk"] = ""
    entry["phonetic_us"] = ""
    entry["pinyin"] = ""
    entry["source"] = f"{entry.get('source', '')} · 由英文「{first_word}」推出".strip(" ·")
    entry["translations"] = [english] + [t for t in (entry.get("translations") or []) if t != english]
    return entry


def builtin_entry(word: str, source: str) -> dict[str, object]:
    """Shaped fallback so the client can always render something."""
    if source == "en":
        gloss = MINI_EN.get(word.lower(), "")
        definitions = [{"en": "", "zh": gloss, "ex": "", "source": "builtin"}] if gloss else []
        translations = [gloss] if gloss else []
    else:
        gloss = MINI_ZH.get(word, "")
        definitions = [{"en": gloss, "zh": "", "ex": "", "source": "builtin"}] if gloss else []
        translations = [gloss] if gloss else []
    return {
        "word": word,
        "language": source,
        "phonetic_uk": "",
        "phonetic_us": "",
        "pinyin": "",
        "senses": [{"pos": "other", "label": "其他", "short": "", "definitions": definitions}] if definitions else [],
        "synonyms": [],
        "antonyms": [],
        "hyponyms": [],
        "hypernyms": [],
        "forms": [],
        "translations": translations,
        "source": "builtin",
        "sources_used": ["builtin"] if definitions else [],
        "pos_count": 1 if definitions else 0,
    }


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
        entry = await lookup_word(session, word, lang=source)
    finally:
        session.close()

    if (not entry or not entry.get("senses")) and source == "zh":
        entry = await _lookup_chinese_via_english(word)

    if entry and entry.get("senses"):
        if entry.get("language") == "en":
            await translate_definitions_zh(word, entry["senses"])
            _refresh_translations(entry)
        return entry
    return builtin_entry(word, source)


@app.post("/chat")
async def chat(payload: ChatRequest) -> dict[str, str]:
    history = [message.model_dump() for message in payload.messages][-20:]
    messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}, *history]
    try:
        reply = await deepseek_completion(messages, temperature=0.6)
        return {"reply": reply, "engine": "deepseek"}
    except RuntimeError:
        return {
            "reply": "",
            "engine": "unconfigured",
            "detail": "Set DEEPSEEK_API_KEY to enable AI chat.",
        }
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"DeepSeek request failed: {exc}") from exc


@app.post("/auth/register")
async def register(payload: RegisterRequest) -> dict[str, object]:
    email = payload.email.strip().lower()
    name = payload.name.strip()
    session = get_session()
    try:
        existing = session.scalars(select(User).where(User.email == email)).first()
        if existing:
            raise HTTPException(status_code=409, detail="该邮箱已注册")
        user = User(
            name=name,
            email=email,
            password_hash=hash_password(payload.password),
            created_at=int(time.time()),
        )
        session.add(user)
        session.flush()
        token = issue_token(session, user.id)
        session.commit()
        return {"token": token, "user": public_user(user)}
    finally:
        session.close()


@app.post("/auth/login")
async def login(payload: LoginRequest) -> dict[str, object]:
    email = payload.email.strip().lower()
    session = get_session()
    try:
        user = session.scalars(select(User).where(User.email == email)).first()
        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail="邮箱或密码不正确")
        token = issue_token(session, user.id)
        session.commit()
        return {"token": token, "user": public_user(user)}
    finally:
        session.close()


@app.get("/auth/me")
async def auth_me(authorization: str | None = Header(default=None)) -> dict[str, object]:
    token = authorization[7:].strip() if authorization and authorization.lower().startswith("bearer ") else ""
    if not token:
        raise HTTPException(status_code=401, detail="缺少令牌")
    session = get_session()
    try:
        row = session.scalars(select(AuthToken).where(AuthToken.token == token)).first()
        if not row:
            raise HTTPException(status_code=401, detail="令牌无效")
        user = session.get(User, row.user_id)
        if not user:
            raise HTTPException(status_code=401, detail="用户不存在")
        return {"user": public_user(user)}
    finally:
        session.close()
