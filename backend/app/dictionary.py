"""Query and merge normalized dictionary entries from PostgreSQL."""

from __future__ import annotations

from collections import defaultdict
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import DictionaryEntry, DictionarySense

POS_NORMALIZE = {
    "n": "noun",
    "noun": "noun",
    "v": "verb",
    "verb": "verb",
    "adj": "adjective",
    "a": "adjective",
    "s": "adjective",
    "adjective": "adjective",
    "adv": "adverb",
    "r": "adverb",
    "adverb": "adverb",
    "pron": "pronoun",
    "pronoun": "pronoun",
    "prep": "preposition",
    "preposition": "preposition",
    "conj": "conjunction",
    "conjunction": "conjunction",
    "int": "interjection",
    "interjection": "interjection",
    "det": "determiner",
    "determiner": "determiner",
    "num": "numeral",
    "numeral": "numeral",
    "part": "particle",
    "particle": "particle",
}


def normalize_pos(pos: str) -> str:
    return POS_NORMALIZE.get((pos or "").strip().lower(), "other")


def lemmatize_en(word: str) -> str:
    """Return a WordNet lemma when available, otherwise the lowercase word."""
    lowered = word.strip().lower()
    if not lowered:
        return ""
    try:
        from nltk.stem import WordNetLemmatizer

        lemmatizer = WordNetLemmatizer()
        for pos in ("v", "n", "a", "r"):
            lemma = lemmatizer.lemmatize(lowered, pos=pos)
            if lemma != lowered:
                return lemma
        return lowered
    except Exception:
        return lowered


def _load_entries(session: Session, words: set[str], lang: str) -> list[DictionaryEntry]:
    if not words:
        return []
    stmt = (
        select(DictionaryEntry)
        .options(selectinload(DictionaryEntry.senses), selectinload(DictionaryEntry.relations), selectinload(DictionaryEntry.forms))
        .where(DictionaryEntry.lang == lang, DictionaryEntry.word.in_(words))
    )
    return list(session.scalars(stmt).all())


def _entry_senses(entry: DictionaryEntry) -> list[dict[str, Any]]:
    return [
        {
            "pos": normalize_pos(sense.pos),
            "definition_en": sense.definition_en or "",
            "definition_zh": sense.definition_zh or "",
            "example": sense.example or "",
        }
        for sense in sorted(entry.senses, key=lambda s: (s.order, s.id))
    ]


def _entry_relations(entries: list[DictionaryEntry]) -> dict[str, list[str]]:
    grouped: dict[str, set[str]] = defaultdict(set)
    for entry in entries:
        for rel in entry.relations:
            grouped[rel.rel_type].add(rel.target)
    return {key: sorted(values) for key, values in grouped.items()}


def _entry_forms(entries: list[DictionaryEntry]) -> list[str]:
    forms: set[str] = set()
    for entry in entries:
        for form in entry.forms:
            forms.add(form.form)
    return sorted(forms)


def _collect_translations(entries: list[DictionaryEntry], lang: str) -> list[str]:
    values: list[str] = []
    for entry in entries:
        for sense in entry.senses:
            text = sense.definition_zh if lang == "en" else sense.definition_en
            if text and text not in values:
                values.append(text)
    return values[:12]


def _reverse_cedict(session: Session, english_word: str) -> list[str]:
    stmt = (
        select(DictionaryEntry.word)
        .join(DictionarySense, DictionarySense.entry_id == DictionaryEntry.id)
        .where(DictionaryEntry.lang == "zh", DictionarySense.definition_en.ilike(f"%{english_word}%"))
        .limit(20)
    )
    return [row[0] for row in session.execute(stmt).all()]


def lookup_entry(session: Session, word: str, lang: str | None = None) -> dict[str, Any] | None:
    word = word.strip()
    if not word:
        return None

    detected = lang or ("zh" if any("\u4e00" <= ch <= "\u9fff" for ch in word) else "en")
    if detected == "en":
        variants = {word.lower(), lemmatize_en(word)}
        entries = _load_entries(session, variants, "en")
        if not entries:
            return None

        senses: list[dict[str, Any]] = []
        for entry in entries:
            for sense in _entry_senses(entry):
                senses.append(sense)

        relations = _entry_relations(entries)
        forms = _entry_forms(entries)
        translations = _collect_translations(entries, "en")
        reverse = _reverse_cedict(session, word.lower())
        for zh_word in reverse:
            if zh_word not in translations:
                translations.append(zh_word)
        phonetics = next(
            (e for e in entries if e.phonetic_uk or e.phonetic_us),
            entries[0] if entries else None,
        )
        return {
            "word": word,
            "language": "en",
            "phonetic_uk": (phonetics.phonetic_uk if phonetics else "") or "",
            "phonetic_us": (phonetics.phonetic_us if phonetics else "") or "",
            "pinyin": "",
            "senses": _group_senses(senses),
            "synonyms": relations.get("synonym", []),
            "antonyms": relations.get("antonym", []),
            "hyponyms": relations.get("hyponym", []),
            "hypernyms": relations.get("hypernym", []),
            "forms": forms,
            "translations": translations,
            "source": "CC-CEDICT · WordNet · Wiktionary",
        }

    entries = _load_entries(session, {word}, "zh")
    if not entries:
        return None

    glosses = [sense.definition_en for entry in entries for sense in entry.senses if sense.definition_en]
    english_entries: list[DictionaryEntry] = []
    for gloss in glosses[:4]:
        first_word = gloss.split()[0].strip(".,;:()[]")
        english_entries.extend(_load_entries(session, {first_word, lemmatize_en(first_word)}, "en"))

    merged_senses: list[dict[str, Any]] = []
    for entry in entries:
        for sense in _entry_senses(entry):
            merged_senses.append(sense)
    if english_entries:
        for entry in english_entries:
            for sense in _entry_senses(entry):
                merged_senses.append(sense)

    relations = _entry_relations(english_entries)
    pinyin = next((entry.pinyin for entry in entries if entry.pinyin), "")
    return {
        "word": word,
        "language": "zh",
        "phonetic_uk": "",
        "phonetic_us": "",
        "pinyin": pinyin,
        "senses": _group_senses(merged_senses),
        "synonyms": relations.get("synonym", []),
        "antonyms": relations.get("antonym", []),
        "hyponyms": relations.get("hyponym", []),
        "hypernyms": relations.get("hypernym", []),
        "forms": [],
        "translations": glosses[:12],
        "source": "CC-CEDICT · WordNet · Wiktionary",
    }


def _group_senses(senses: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for sense in senses:
        grouped[sense["pos"]].append(sense)

    result: list[dict[str, Any]] = []
    for pos, items in grouped.items():
        definitions: list[dict[str, Any]] = []
        for item in items:
            definitions.append(
                {
                    "en": item.get("definition_en", ""),
                    "zh": item.get("definition_zh", ""),
                    "ex": item.get("example", ""),
                }
            )
        result.append({"pos": pos, "label": pos_label(pos), "definitions": definitions})
    return result


def pos_label(pos: str) -> str:
    return {
        "noun": "名词",
        "verb": "动词",
        "adjective": "形容词",
        "adverb": "副词",
        "pronoun": "代词",
        "preposition": "介词",
        "conjunction": "连词",
        "interjection": "感叹词",
        "determiner": "限定词",
        "numeral": "数词",
        "particle": "助词",
    }.get(pos, "其他")
