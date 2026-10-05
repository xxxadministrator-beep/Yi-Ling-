"""Import Kaikki / Wiktionary JSONL data."""

from __future__ import annotations

import json

from sqlalchemy.orm import Session

from app.models import DictionaryEntry, DictionaryForm, DictionarySense


def import_kaikki(session: Session, path: str, limit: int | None = None) -> int:
    count = 0
    with open(path, "r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            word = obj.get("word")
            lang = obj.get("lang")
            if not word or lang not in {"English", "Chinese"}:
                continue
            code = "en" if lang == "English" else "zh"
            entry = DictionaryEntry(word=word, lang=code, source="wiktionary")
            _apply_sounds(entry, obj.get("sounds", []))
            _apply_forms(entry, obj.get("forms", []))
            _apply_senses(entry, obj.get("senses", []), obj.get("translations", []))
            session.add(entry)
            count += 1
            if count % 2000 == 0:
                session.commit()
            if limit and count >= limit:
                break
    session.commit()
    return count


def _apply_sounds(entry: DictionaryEntry, sounds: list[dict]) -> None:
    for sound in sounds:
        tags = " ".join(sound.get("tags") or []).lower()
        ipa = sound.get("ipa") or ""
        if not ipa:
            continue
        if "uk" in tags or "received-pronunciation" in tags:
            entry.phonetic_uk = entry.phonetic_uk or ipa
        elif "us" in tags or "general-american" in tags:
            entry.phonetic_us = entry.phonetic_us or ipa
        else:
            entry.phonetic_uk = entry.phonetic_uk or ipa


def _apply_forms(entry: DictionaryEntry, forms: list[dict]) -> None:
    seen: set[tuple[str, str]] = set()
    for item in forms:
        form = item.get("form")
        if not form:
            continue
        tags = item.get("tags") or []
        form_type = tags[0] if tags else "form"
        key = (form, form_type)
        if key in seen:
            continue
        seen.add(key)
        entry.forms.append(DictionaryForm(form=form, form_type=form_type))


def _apply_senses(entry: DictionaryEntry, senses: list[dict], translations: list[dict]) -> None:
    if not senses:
        return
    for index, sense in enumerate(senses):
        glosses = sense.get("glosses") or []
        examples = sense.get("examples") or []
        example = ""
        if examples and isinstance(examples[0], dict):
            example = examples[0].get("text") or examples[0].get("english") or ""
        elif examples:
            example = str(examples[0])

        definition_en = glosses[0] if glosses else ""
        definition_zh = _chinese_translation(translations)
        entry.senses.append(
            DictionarySense(
                pos=sense.get("pos") or "other",
                definition_en=definition_en,
                definition_zh=definition_zh,
                example=example,
                order=index,
            )
        )


def _chinese_translation(translations: list[dict]) -> str:
    for item in translations:
        if item.get("lang") in {"Chinese", "zh", "cmn"} and item.get("word"):
            return item["word"]
    return ""
