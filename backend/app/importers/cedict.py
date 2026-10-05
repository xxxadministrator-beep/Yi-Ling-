"""Import the CC-CEDICT text dictionary."""

from __future__ import annotations

import re

from sqlalchemy.orm import Session

from app.models import DictionaryEntry, DictionarySense

LINE_RE = re.compile(r"^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+/(.*)/$")


def import_cedict(session: Session, path: str, limit: int | None = None) -> int:
    count = 0
    with open(path, "r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            match = LINE_RE.match(line)
            if not match:
                continue
            _, simplified, pinyin, glosses = match.groups()
            for gloss in glosses.split("/"):
                gloss = gloss.strip()
                if not gloss:
                    continue
                entry = DictionaryEntry(word=simplified, lang="zh", source="cc-cedict", pinyin=pinyin)
                entry.senses.append(DictionarySense(pos="other", definition_en=gloss, order=count))
                session.add(entry)
                count += 1
                if limit and count >= limit:
                    break
            if count and count % 2000 == 0:
                session.commit()
            if limit and count >= limit:
                break
    session.commit()
    return count
