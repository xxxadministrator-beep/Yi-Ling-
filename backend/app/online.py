"""Online dictionary aggregation: WordNet + Wiktionary + Datamuse.

The importers in app/importers fill the local database from bulk dumps, but a
lookup still has to answer for words the local corpus never saw. This module
queries public sources directly and merges them into the same normalized entry
shape the database path produces.

Role of each source:

* WordNet (NLTK, local corpus) - concise definitions already ordered by sense
  frequency, plus synonyms, antonyms, hypernyms, hyponyms and derived forms.
* Wiktionary (REST definition endpoint) - the only source with a complete
  part-of-speech vocabulary (preposition, conjunction, determiner, article,
  interjection, numeral, ...), which WordNet and Datamuse cannot supply.
* Datamuse - extra definitions, synonyms, antonyms and corpus frequency.
* dictionaryapi.dev - supplementary English definitions and IPA phonetics.

Datamuse's per-sense part-of-speech tags are treated as untrusted on their own:
probes show it labels "into" as a noun, "the" as an adverb and "twenty" as a
noun, because it only knows noun/verb/adjective/adverb. Its definitions are
therefore kept only for parts of speech that a stronger source corroborated,
unless Datamuse is the only source that answered at all.

Every request is best effort: an unreachable or slow source is skipped and the
remaining sources are still merged. Only the standard library and httpx are
imported at module import time, so this module can be tested without the web
stack or database installed.
"""

from __future__ import annotations

import asyncio
import re
from dataclasses import dataclass, field
from typing import Any, Iterable
from urllib.parse import quote

import httpx

from app.pos import normalize_pos, pos_label, pos_rank, pos_short

USER_AGENT = "YilingTranslate/0.3 (dictionary lookup; contact: yiling@example.com)"
DEFAULT_TIMEOUT = 4.0
RELATION_CAP = 20
DEFINITIONS_PER_POS = 10

# Lower number wins when the same sense is described by several sources.
DEFINITION_PRIORITY = {
    "wordnet": 0,
    "wiktionary": 1,
    "dictionaryapi": 2,
    "datamuse": 3,
}
# Sources trusted to establish which parts of speech a word has.
AUTHORITATIVE_SOURCES = ("wordnet", "wiktionary", "dictionaryapi")
SOURCE_NAMES = {
    "wordnet": "WordNet",
    "wiktionary": "Wiktionary",
    "datamuse": "Datamuse",
    "dictionaryapi": "DictionaryAPI",
}

# WordNet part-of-speech codes.
WORDNET_POS = {"n": "noun", "v": "verb", "a": "adjective", "s": "adjective", "r": "adverb"}


@dataclass
class Definition:
    """One sense's definition, tagged with the source that produced it."""

    text: str
    pos: str
    source: str
    example: str = ""


@dataclass
class SourceResult:
    """Normalized output of a single dictionary source."""

    source: str
    word: str = ""
    definitions: list[Definition] = field(default_factory=list)
    synonyms: set[str] = field(default_factory=set)
    antonyms: set[str] = field(default_factory=set)
    hypernyms: set[str] = field(default_factory=set)
    hyponyms: set[str] = field(default_factory=set)
    forms: set[str] = field(default_factory=set)
    translations: list[str] = field(default_factory=list)
    phonetic_uk: str = ""
    phonetic_us: str = ""
    pinyin: str = ""

    @property
    def empty(self) -> bool:
        return not self.definitions and not (self.synonyms or self.antonyms or self.translations)


# --------------------------------------------------------------------------- #
# text helpers
# --------------------------------------------------------------------------- #

_HTML_TAG = re.compile(r"<[^>]+>")
_WIKI_TEMPLATE = re.compile(r"\{\{[^{}]*\}\}")
_WIKI_LINK = re.compile(r"\[\[([^\]|]*\|)?([^\]]*)\]\]")
_WS = re.compile(r"\s+")
# Stripping a wiki link can leave "a fire ." or "( a fire )" behind.
_SPACE_BEFORE_PUNCT = re.compile(r"\s+([,.;:!?%)\]])")
_SPACE_AFTER_OPEN = re.compile(r"([(\[])\s+")


def clean_text(text: str) -> str:
    """Strip HTML tags, wiki links and templates from a gloss."""
    value = str(text or "")
    value = _HTML_TAG.sub(" ", value)
    value = _WIKI_LINK.sub(lambda m: m.group(2) or m.group(1) or "", value)
    value = _WIKI_TEMPLATE.sub(" ", value)
    value = value.replace("'''", "").replace("''", "")
    value = _WS.sub(" ", value)
    value = _SPACE_AFTER_OPEN.sub(r"\1", value)
    value = _SPACE_BEFORE_PUNCT.sub(r"\1", value)
    return value.strip()


def dedupe_key(text: str) -> str:
    """Key used to collapse the same definition coming from several sources."""
    return re.sub(r"[^a-z0-9一-鿿]+", "", str(text or "").lower())


def truncate(values: Iterable[str], cap: int = RELATION_CAP) -> list[str]:
    seen: list[str] = []
    for value in values:
        if value and value not in seen:
            seen.append(value)
        if len(seen) >= cap:
            break
    return seen


def lemmatize_en(word: str) -> str:
    """Return a WordNet lemma when available, otherwise the lowercase word."""
    lowered = str(word or "").strip().lower()
    if not lowered:
        return ""
    lemmatizer = _lemmatizer()
    if lemmatizer is None:
        return lowered
    try:
        for pos in ("v", "n", "a", "r"):
            lemma = lemmatizer.lemmatize(lowered, pos=pos)
            if lemma and lemma != lowered:
                return lemma
    except Exception:
        pass
    return lowered


_LEMMATIZER: Any = None
_LEMMATIZER_TRIED = False


def _lemmatizer() -> Any:
    global _LEMMATIZER, _LEMMATIZER_TRIED
    if not _LEMMATIZER_TRIED:
        _LEMMATIZER_TRIED = True
        try:
            from nltk.stem import WordNetLemmatizer

            _LEMMATIZER = WordNetLemmatizer()
        except Exception:
            _LEMMATIZER = None
    return _LEMMATIZER


def _wordnet():
    """Return the NLTK WordNet corpus, or None when it is unavailable."""
    try:
        from nltk.corpus import wordnet as wn

        return wn
    except Exception:
        return None


# --------------------------------------------------------------------------- #
# WordNet (local corpus, synchronous)
# --------------------------------------------------------------------------- #


def wordnet_result(word: str) -> SourceResult:
    """Collect WordNet senses and semantic relations for an English word."""
    result = SourceResult(source="wordnet")
    wn = _wordnet()
    if wn is None:
        return result

    candidates = [word.strip().lower()]
    lemma = lemmatize_en(word)
    if lemma and lemma not in candidates:
        candidates.append(lemma)

    synsets: list[Any] = []
    for candidate in candidates:
        try:
            found = wn.synsets(candidate)
        except Exception:
            found = []
        if found:
            synsets = found
            result.word = candidate
            break
    if not synsets:
        return result

    def sense_frequency(synset) -> int:
        """How often this sense is tagged in SemCor - WordNet's frequency signal."""
        try:
            return max((lemma.count() for lemma in synset.lemmas()), default=0)
        except Exception:
            return 0

    # WordNet returns noun senses before verb senses, so sorting by corpus
    # frequency instead surfaces the sense a learner meets first ("run" as
    # movement rather than as a baseball score). The sort is stable, so senses
    # with no corpus evidence keep WordNet's own order.
    ranked = sorted(synsets, key=sense_frequency, reverse=True)
    for synset in ranked[:24]:
        pos = WORDNET_POS.get(synset.pos(), "other")
        try:
            definition = clean_text(synset.definition())
        except Exception:
            definition = ""
        if not definition:
            continue
        try:
            examples = synset.examples() or []
        except Exception:
            examples = []
        result.definitions.append(
            Definition(
                text=definition,
                pos=pos,
                source="wordnet",
                example=clean_text(examples[0]) if examples else "",
            )
        )

        try:
            for name in synset.lemma_names():
                cleaned = name.replace("_", " ").strip()
                if cleaned.lower() != result.word:
                    result.synonyms.add(cleaned)
        except Exception:
            pass

        try:
            for hypernym in synset.hypernyms():
                names = hypernym.lemma_names()
                if names:
                    result.hypernyms.add(names[0].replace("_", " "))
            for hyponym in synset.hyponyms():
                names = hyponym.lemma_names()
                if names:
                    result.hyponyms.add(names[0].replace("_", " "))
        except Exception:
            pass

        try:
            for word_lemma in synset.lemmas():
                for antonym in word_lemma.antonyms():
                    result.antonyms.add(antonym.name().replace("_", " "))
                for derived in word_lemma.derivationally_related_forms():
                    name = derived.name().replace("_", " ")
                    if name.lower() != result.word:
                        result.forms.add(name)
        except Exception:
            pass

    return result


# --------------------------------------------------------------------------- #
# Datamuse
# --------------------------------------------------------------------------- #


def _datamuse_entries(payload: Any, word: str) -> dict:
    """Pick the entry whose word matches exactly (Datamuse returns near misses)."""
    if not isinstance(payload, list):
        return {}
    target = word.strip().lower()
    for item in payload:
        if isinstance(item, dict) and str(item.get("word", "")).strip().lower() == target:
            return item
    return {}


async def datamuse_result(client: httpx.AsyncClient, word: str) -> SourceResult:
    """Definitions, synonyms and antonyms from Datamuse."""
    result = SourceResult(source="datamuse")
    base = "https://api.datamuse.com/words"

    async def get(params: str) -> Any:
        response = await client.get(f"{base}?{params}", timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
        return response.json()

    # Fire the three Datamuse queries together. Previously the definitions call
    # gated the synonym/antonym calls, tripling the round-trip time.
    sp_payload, syn_payload, ant_payload = await asyncio.gather(
        get(f"sp={quote(word, safe='')}&md=dp&max=5"),
        get(f"rel_syn={quote(word, safe='')}&max={RELATION_CAP}"),
        get(f"rel_ant={quote(word, safe='')}&max={RELATION_CAP}"),
        return_exceptions=True,
    )

    entry = _datamuse_entries(sp_payload, word) if not isinstance(sp_payload, Exception) else {}
    if entry:
        result.word = str(entry.get("word", word))
        for raw in entry.get("defs", []) or []:
            parts = str(raw).split("\t")
            if len(parts) < 2:
                continue
            pos = normalize_pos(parts[0])
            text = clean_text(parts[1])
            if text:
                result.definitions.append(Definition(text=text, pos=pos, source="datamuse"))

    for payload, bucket in ((syn_payload, result.synonyms), (ant_payload, result.antonyms)):
        if isinstance(payload, Exception) or not isinstance(payload, list):
            continue
        for item in payload:
            if isinstance(item, dict) and item.get("word"):
                name = str(item["word"]).strip()
                if name.lower() != word.strip().lower():
                    bucket.add(name)

    return result


# --------------------------------------------------------------------------- #
# Wiktionary
# --------------------------------------------------------------------------- #


def _wiktionary_definition(item: Any) -> tuple[str, str]:
    """Return (definition, example) from a Wiktionary definition object."""
    if isinstance(item, str):
        return clean_text(item), ""
    if not isinstance(item, dict):
        return "", ""
    raw = item.get("definition")
    if isinstance(raw, list):
        raw = " ".join(str(part) for part in raw)
    definition = clean_text(raw or "")
    example = ""
    for key in ("parsedExamples", "examples"):
        values = item.get(key)
        if not values:
            continue
        first = values[0]
        if isinstance(first, dict):
            example = clean_text(first.get("example") or first.get("text") or "")
        else:
            example = clean_text(first)
        if example:
            break
    return definition, example


def _wiktionary_sections(payload: Any, lang: str) -> list[dict]:
    """Choose the language section matching the query's language.

    The endpoint keys sections by language (en, fr, other, zh, ...) and the
    "other" bucket mixes several languages, so an English or Chinese query must
    never fall back to every section: presenting a Portuguese gloss as an
    English definition would be worse than returning nothing.
    """
    if not isinstance(payload, dict):
        return []
    preferred = {
        "en": ("en", "english"),
        "zh": ("zh", "cmn", "zh-hans", "zh-hant", "chinese", "mandarin"),
    }.get(lang, ())
    matching: list[dict] = []
    for key, value in payload.items():
        if not isinstance(value, list):
            continue
        if not preferred or str(key).lower() in preferred:
            matching.extend(item for item in value if isinstance(item, dict))
    return matching


async def wiktionary_result(client: httpx.AsyncClient, word: str, lang: str) -> SourceResult:
    """Definitions and part-of-speech detail from the Wiktionary REST API."""
    result = SourceResult(source="wiktionary")
    url = f"https://en.wiktionary.org/api/rest_v1/page/definition/{quote(word, safe='')}"
    response = await client.get(url, timeout=DEFAULT_TIMEOUT)
    response.raise_for_status()
    payload = response.json()

    for section in _wiktionary_sections(payload, lang):
        pos = normalize_pos(section.get("partOfSpeech"))
        for item in section.get("definitions") or []:
            definition, example = _wiktionary_definition(item)
            if definition:
                result.definitions.append(
                    Definition(text=definition, pos=pos, source="wiktionary", example=example)
                )
    return result


# --------------------------------------------------------------------------- #
# dictionaryapi.dev (supplementary definitions and IPA)
# --------------------------------------------------------------------------- #


async def dictionaryapi_result(client: httpx.AsyncClient, word: str) -> SourceResult:
    result = SourceResult(source="dictionaryapi")
    url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{quote(word, safe='')}"
    response = await client.get(url, timeout=DEFAULT_TIMEOUT)
    response.raise_for_status()
    payload = response.json()
    first = payload[0] if isinstance(payload, list) and payload else None
    if not isinstance(first, dict):
        return result

    result.word = str(first.get("word", word))
    for meaning in first.get("meanings", []) or []:
        if not isinstance(meaning, dict):
            continue
        pos = normalize_pos(meaning.get("partOfSpeech"))
        for item in (meaning.get("definitions") or [])[:6]:
            if not isinstance(item, dict):
                continue
            text = clean_text(item.get("definition"))
            if text:
                result.definitions.append(
                    Definition(text=text, pos=pos, source="dictionaryapi", example=clean_text(item.get("example")))
                )
        for name in meaning.get("synonyms") or []:
            result.synonyms.add(str(name))
        for name in meaning.get("antonyms") or []:
            result.antonyms.add(str(name))

    phonetics = [item for item in (first.get("phonetics") or []) if isinstance(item, dict)]
    fallback = first.get("phonetic") or ""
    for item in phonetics:
        text = str(item.get("text") or "").strip()
        audio = str(item.get("audio") or "")
        if not text:
            continue
        if re.search(r"[-_]uk\.", audio, re.I):
            result.phonetic_uk = result.phonetic_uk or text
        elif re.search(r"[-_]us\.", audio, re.I):
            result.phonetic_us = result.phonetic_us or text
    if not result.phonetic_uk:
        result.phonetic_uk = fallback or next((str(p.get("text")) for p in phonetics if p.get("text")), "")
    if not result.phonetic_us:
        result.phonetic_us = result.phonetic_uk
    return result


# --------------------------------------------------------------------------- #
# merging
# --------------------------------------------------------------------------- #


def merge_results(word: str, lang: str, results: list[SourceResult]) -> dict[str, Any] | None:
    """Merge every source result into the normalized API entry shape."""
    usable = [item for item in results if not item.empty]
    if not usable:
        return None

    # Parts of speech a trustworthy source vouched for. Datamuse definitions
    # outside this set are dropped, because its own tags mislabel function
    # words; when nothing else answered, Datamuse is better than nothing.
    corroborated = {
        definition.pos or "other"
        for item in usable
        if item.source in AUTHORITATIVE_SOURCES
        for definition in item.definitions
    }

    buckets: dict[str, list[Definition]] = {}
    for item in usable:
        for definition in item.definitions:
            pos = definition.pos or "other"
            if item.source == "datamuse" and corroborated and pos not in corroborated:
                continue
            buckets.setdefault(pos, []).append(definition)

    senses: list[dict[str, Any]] = []
    for pos in sorted(buckets, key=pos_rank):
        # Stable sort: source preference decides the order, and each source
        # keeps its own curated sense order (Wiktionary lists commonest first).
        entries = sorted(buckets[pos], key=lambda definition: DEFINITION_PRIORITY.get(definition.source, 99))
        seen: set[str] = set()
        definitions: list[dict[str, Any]] = []
        for entry in entries:
            key = dedupe_key(entry.text)
            if not key or key in seen:
                continue
            seen.add(key)
            definitions.append({"en": entry.text, "zh": "", "ex": entry.example, "source": entry.source})
            if len(definitions) >= DEFINITIONS_PER_POS:
                break
        if definitions:
            senses.append(
                {
                    "pos": pos,
                    "label": pos_label(pos),
                    "short": pos_short(pos),
                    "definitions": definitions,
                }
            )

    if not senses:
        return None

    def collect(attr: str) -> list[str]:
        values: list[str] = []
        for item in usable:
            values.extend(sorted(getattr(item, attr)))
        return truncate(values)

    translations: list[str] = []
    for item in usable:
        translations.extend(item.translations)

    phonetics = next((item for item in usable if item.phonetic_uk or item.phonetic_us), None)
    pinyin = next((item.pinyin for item in usable if item.pinyin), "")
    contributing = [
        name
        for name in ("wordnet", "wiktionary", "dictionaryapi", "datamuse")
        if any(definition.source == name for bucket in buckets.values() for definition in bucket)
    ]

    return {
        "word": word,
        "language": lang,
        "phonetic_uk": (phonetics.phonetic_uk if phonetics else "") or "",
        "phonetic_us": (phonetics.phonetic_us if phonetics else "") or "",
        "pinyin": pinyin,
        "senses": senses,
        "synonyms": collect("synonyms"),
        "antonyms": collect("antonyms"),
        "hyponyms": collect("hyponyms"),
        "hypernyms": collect("hypernyms"),
        "forms": truncate(sorted({form for item in usable for form in item.forms}), 24),
        "translations": truncate(translations, 12),
        "source": " · ".join(SOURCE_NAMES.get(name, name) for name in contributing),
        "sources_used": contributing,
        "pos_count": len(senses),
    }


async def lookup_online(
    word: str,
    lang: str | None = None,
    *,
    client: httpx.AsyncClient | None = None,
) -> dict[str, Any] | None:
    """Query WordNet, Wiktionary and Datamuse and merge whatever answers."""
    query = str(word or "").strip()
    if not query:
        return None
    language = lang or ("zh" if any("一" <= ch <= "鿿" for ch in query) else "en")
    english_word = query if language == "en" else lemmatize_en(query)

    owns_client = client is None
    if client is None:
        client = httpx.AsyncClient(
            timeout=DEFAULT_TIMEOUT,
            headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
            follow_redirects=True,
        )

    try:
        tasks: list[Any] = []
        labels: list[str] = []
        if language == "en":
            tasks.append(asyncio.to_thread(wordnet_result, english_word))
            labels.append("wordnet")
            tasks.append(datamuse_result(client, english_word))
            labels.append("datamuse")
            tasks.append(dictionaryapi_result(client, query))
            labels.append("dictionaryapi")
        tasks.append(wiktionary_result(client, query, language))
        labels.append("wiktionary")

        settled = await asyncio.gather(*tasks, return_exceptions=True)

        results: list[SourceResult] = []
        for label, outcome in zip(labels, settled):
            if isinstance(outcome, SourceResult):
                results.append(outcome)
            elif isinstance(outcome, Exception):
                results.append(SourceResult(source=label))

        return merge_results(query, language, results)
    finally:
        if owns_client:
            await client.aclose()
