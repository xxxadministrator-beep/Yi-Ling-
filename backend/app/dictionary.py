"""Query and merge normalized dictionary entries.

Two layers can answer a lookup:

1. the local database, filled by the importers in app/importers from CC-CEDICT,
   WordNet and Kaikki dumps;
2. the live sources in app.online (WordNet corpus, Wiktionary, Datamuse,
   dictionaryapi.dev) for anything the local corpus never saw.

Both layers are merged into one normalized entry, and every definition keeps
the source it came from so the client can show honest provenance instead of
claiming a fixed list of dictionaries.
"""

from __future__ import annotations

from collections import defaultdict
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import DictionaryEntry, DictionarySense
from app.online import SOURCE_NAMES, dedupe_key, lemmatize_en, lookup_online, truncate
from app.pos import normalize_pos, pos_label, pos_rank, pos_short

__all__ = [
    "lookup_entry",
    "lookup_word",
    "normalize_pos",
    "pos_label",
    "pos_short",
    "lemmatize_en",
]

DEFINITIONS_PER_POS = 10
TRANSLATION_CAP = 12

# Friendly names for the source column written by the importers.
DB_SOURCE_NAMES = {
    "cc-cedict": "CC-CEDICT",
    "wordnet": "WordNet",
    "wiktionary": "Wiktionary",
    "kaikki": "Wiktionary",
}


def friendly_source(name: str) -> str:
    """Map an internal source key onto the label shown in the user interface."""
    key = str(name or "").strip()
    lowered = key.lower()
    if lowered in DB_SOURCE_NAMES:
        return DB_SOURCE_NAMES[lowered]
    if lowered in SOURCE_NAMES:
        return SOURCE_NAMES[lowered]
    return key


# --------------------------------------------------------------------------- #
# database layer
# --------------------------------------------------------------------------- #


def _load_entries(session: Session, words: set[str], lang: str) -> list[DictionaryEntry]:
    if not words:
        return []
    stmt = (
        select(DictionaryEntry)
        .options(
            selectinload(DictionaryEntry.senses),
            selectinload(DictionaryEntry.relations),
            selectinload(DictionaryEntry.forms),
        )
        .where(DictionaryEntry.lang == lang, DictionaryEntry.word.in_(words))
    )
    return list(session.scalars(stmt).all())


def _sense_items(entries: list[DictionaryEntry]) -> list[dict[str, Any]]:
    """Flatten stored senses into source-tagged definition items."""
    items: list[dict[str, Any]] = []
    for entry in entries:
        label = friendly_source(entry.source) or "数据库"
        for sense in sorted(entry.senses, key=lambda item: (item.order, item.id)):
            items.append(
                {
                    "pos": normalize_pos(sense.pos),
                    "en": sense.definition_en or "",
                    "zh": sense.definition_zh or "",
                    "ex": sense.example or "",
                    "source": label,
                }
            )
    return items


def _entry_relations(entries: list[DictionaryEntry]) -> dict[str, list[str]]:
    grouped: dict[str, list[str]] = defaultdict(list)
    for entry in entries:
        for relation in entry.relations:
            if relation.target not in grouped[relation.rel_type]:
                grouped[relation.rel_type].append(relation.target)
    return {key: truncate(values) for key, values in grouped.items()}


def _entry_forms(entries: list[DictionaryEntry]) -> list[str]:
    forms: list[str] = []
    for entry in entries:
        for form in entry.forms:
            if form.form and form.form not in forms:
                forms.append(form.form)
    return truncate(forms, 24)


def _collect_translations(entries: list[DictionaryEntry], lang: str) -> list[str]:
    values: list[str] = []
    for entry in entries:
        for sense in sorted(entry.senses, key=lambda item: (item.order, item.id)):
            text = sense.definition_zh if lang == "en" else sense.definition_en
            text = (text or "").strip()
            if text and text not in values:
                values.append(text)
    return values


def _reverse_cedict(session: Session, english_word: str) -> list[str]:
    stmt = (
        select(DictionaryEntry.word)
        .join(DictionarySense, DictionarySense.entry_id == DictionaryEntry.id)
        .where(DictionaryEntry.lang == "zh", DictionarySense.definition_en.ilike(f"%{english_word}%"))
        .limit(20)
    )
    return [row[0] for row in session.execute(stmt).all()]


def _db_sources(entries: list[DictionaryEntry]) -> list[str]:
    names: list[str] = []
    for entry in entries:
        label = friendly_source(entry.source)
        if label and label not in names:
            names.append(label)
    return names


def _db_entry(session: Session, word: str, lang: str) -> dict[str, Any] | None:
    """Build an entry from the local database alone (no network)."""
    if lang == "en":
        variants = {word.lower(), lemmatize_en(word)}
        entries = _load_entries(session, variants, "en")
        if not entries:
            return None
        items = _sense_items(entries)
        translations = _collect_translations(entries, "en")
        for zh_word in _reverse_cedict(session, word.lower()):
            if zh_word not in translations:
                translations.append(zh_word)
        relations = _entry_relations(entries)
        phonetics = next((e for e in entries if e.phonetic_uk or e.phonetic_us), entries[0])
        return {
            "word": word,
            "language": "en",
            "phonetic_uk": phonetics.phonetic_uk or "",
            "phonetic_us": phonetics.phonetic_us or "",
            "pinyin": "",
            "items": items,
            "synonyms": relations.get("synonym", []),
            "antonyms": relations.get("antonym", []),
            "hyponyms": relations.get("hyponym", []),
            "hypernyms": relations.get("hypernym", []),
            "forms": _entry_forms(entries),
            "translations": truncate(translations, TRANSLATION_CAP),
            "sources_used": _db_sources(entries),
        }

    entries = _load_entries(session, {word}, "zh")
    if not entries:
        return None

    # CC-CEDICT stores English glosses, so the English entries those glosses
    # point at supply part-of-speech and semantic relations for a Chinese word.
    glosses = [sense.definition_en for entry in entries for sense in entry.senses if sense.definition_en]
    items = _sense_items(entries)
    english_entries: list[DictionaryEntry] = []
    for gloss in glosses[:4]:
        first_word = gloss.split()[0].strip(".,;:()[]") if gloss.split() else ""
        if first_word:
            english_entries.extend(_load_entries(session, {first_word, lemmatize_en(first_word)}, "en"))

    relations = _entry_relations(english_entries)
    pinyin = next((entry.pinyin for entry in entries if entry.pinyin), "")
    return {
        "word": word,
        "language": "zh",
        "phonetic_uk": "",
        "phonetic_us": "",
        "pinyin": pinyin,
        "items": items + _sense_items(english_entries),
        "synonyms": relations.get("synonym", []),
        "antonyms": relations.get("antonym", []),
        "hyponyms": relations.get("hyponym", []),
        "hypernyms": relations.get("hypernym", []),
        "forms": [],
        "translations": truncate(glosses, TRANSLATION_CAP),
        "sources_used": _db_sources(entries + english_entries),
    }


# --------------------------------------------------------------------------- #
# merging
# --------------------------------------------------------------------------- #


def _group_definitions(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Group definition items by part of speech, preserving arrival order."""
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in items:
        # Normalize defensively: an unnormalized key would reach the client as
        # an unlabelled part of speech.
        grouped[normalize_pos(item.get("pos"))].append(item)

    senses: list[dict[str, Any]] = []
    for pos in sorted(grouped, key=pos_rank):
        seen: set[str] = set()
        definitions: list[dict[str, Any]] = []
        for item in grouped[pos]:
            key = dedupe_key(item.get("en") or item.get("zh") or "")
            if not key or key in seen:
                continue
            seen.add(key)
            definitions.append(
                {
                    "en": item.get("en", ""),
                    "zh": item.get("zh", ""),
                    "ex": item.get("ex", ""),
                    "source": item.get("source", ""),
                }
            )
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
    return senses


def _online_to_items(entry: dict[str, Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for sense in entry.get("senses", []):
        for definition in sense.get("definitions", []):
            items.append(
                {
                    "pos": normalize_pos(sense.get("pos")),
                    "en": definition.get("en", ""),
                    "zh": definition.get("zh", ""),
                    "ex": definition.get("ex", ""),
                    "source": friendly_source(definition.get("source") or entry.get("source", "")),
                }
            )
    return items


def _merge_entries(
    word: str,
    lang: str,
    db_entry: dict[str, Any] | None,
    online_entry: dict[str, Any] | None,
) -> dict[str, Any] | None:
    """Combine the database entry and the online entry into one response."""
    layers = [entry for entry in (db_entry, online_entry) if entry]
    if not layers:
        return None

    items: list[dict[str, Any]] = []
    for entry in layers:
        if entry is db_entry:
            items.extend(entry.get("items", []))
        else:
            items.extend(_online_to_items(entry))

    senses = _group_definitions(items)
    if not senses:
        return None

    sources_used: list[str] = []
    translations: list[str] = []
    forms: list[str] = []
    relations: dict[str, list[str]] = {}
    for entry in layers:
        for name in entry.get("sources_used") or []:
            label = friendly_source(name)
            if label and label not in sources_used:
                sources_used.append(label)
        translations.extend(entry.get("translations") or [])
        forms.extend(entry.get("forms") or [])
        for key in ("synonyms", "antonyms", "hyponyms", "hypernyms"):
            for value in entry.get(key) or []:
                relations.setdefault(key, []).append(value)

    return {
        "word": word,
        "language": lang,
        "phonetic_uk": (db_entry or {}).get("phonetic_uk") or (online_entry or {}).get("phonetic_uk") or "",
        "phonetic_us": (db_entry or {}).get("phonetic_us") or (online_entry or {}).get("phonetic_us") or "",
        "pinyin": (db_entry or {}).get("pinyin") or (online_entry or {}).get("pinyin") or "",
        "senses": senses,
        "synonyms": truncate(relations.get("synonyms", [])),
        "antonyms": truncate(relations.get("antonyms", [])),
        "hyponyms": truncate(relations.get("hyponyms", [])),
        "hypernyms": truncate(relations.get("hypernyms", [])),
        "forms": truncate(forms, 24),
        "translations": truncate(translations, TRANSLATION_CAP),
        "source": " · ".join(sources_used),
        "sources_used": sources_used,
        "pos_count": len(senses),
    }


def lookup_entry(session: Session, word: str, lang: str | None = None) -> dict[str, Any] | None:
    """Database-only lookup, kept for callers that must not touch the network."""
    text = str(word or "").strip()
    if not text:
        return None
    detected = lang or ("zh" if any("一" <= ch <= "鿿" for ch in text) else "en")
    db_entry = _db_entry(session, text, detected)
    if not db_entry:
        return None
    return _merge_entries(text, detected, db_entry, None)


async def lookup_word(session: Session, word: str, lang: str | None = None) -> dict[str, Any] | None:
    """Look up a word in the local database and the live online sources."""
    text = str(word or "").strip()
    if not text:
        return None
    detected = lang or ("zh" if any("一" <= ch <= "鿿" for ch in text) else "en")

    db_entry = _db_entry(session, text, detected)
    try:
        online_entry = await lookup_online(text, detected)
    except Exception:
        online_entry = None
    return _merge_entries(text, detected, db_entry, online_entry)
