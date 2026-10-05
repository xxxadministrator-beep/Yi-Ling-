"""Import WordNet senses and semantic relations via NLTK."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import DictionaryEntry, DictionaryForm, DictionaryRelation, DictionarySense

POS_MAP = {"n": "noun", "v": "verb", "a": "adjective", "s": "adjective", "r": "adverb"}


def import_wordnet(session: Session, limit: int | None = None) -> int:
    import nltk

    nltk.download("wordnet", quiet=True)
    from nltk.corpus import wordnet as wn

    relation_seen: set[tuple[int, str, str]] = set()
    form_seen: set[tuple[int, str, str]] = set()
    count = 0

    for synset in wn.all_synsets():
        if limit and count >= limit:
            break
        pos = POS_MAP.get(synset.pos(), "other")
        lemma_names = synset.lemma_names()
        if not lemma_names:
            continue

        for lemma_name in lemma_names:
            entry = (
                session.query(DictionaryEntry)
                .filter_by(word=lemma_name, lang="en", source="wordnet")
                .first()
            )
            if not entry:
                entry = DictionaryEntry(word=lemma_name, lang="en", source="wordnet")
                session.add(entry)
                session.flush()

            entry.senses.append(
                DictionarySense(
                    pos=pos,
                    definition_en=synset.definition(),
                    example=(synset.examples() or [""])[0],
                    order=count,
                )
            )

            for other in lemma_names:
                if other != lemma_name:
                    _add_relation(entry, "synonym", other, relation_seen)
            for lemma in synset.lemmas():
                for antonym in lemma.antonyms():
                    _add_relation(entry, "antonym", antonym.name(), relation_seen)
                for derived in lemma.derivationally_related_forms():
                    _add_form(entry, derived.name(), "derived", form_seen)
            for hypernym in synset.hypernyms():
                if hypernym.lemma_names():
                    _add_relation(entry, "hypernym", hypernym.lemma_names()[0], relation_seen)
            for hyponym in synset.hyponyms():
                if hyponym.lemma_names():
                    _add_relation(entry, "hyponym", hyponym.lemma_names()[0], relation_seen)

        count += 1
        if count % 500 == 0:
            session.commit()

    session.commit()
    return count


def _add_relation(entry: DictionaryEntry, rel_type: str, target: str, seen: set[tuple[int, str, str]]) -> None:
    if not target:
        return
    key = (entry.id, rel_type, target)
    if key in seen:
        return
    seen.add(key)
    entry.relations.append(DictionaryRelation(rel_type=rel_type, target=target))


def _add_form(entry: DictionaryEntry, form: str, form_type: str, seen: set[tuple[int, str, str]]) -> None:
    if not form:
        return
    key = (entry.id, form, form_type)
    if key in seen:
        return
    seen.add(key)
    entry.forms.append(DictionaryForm(form=form, form_type=form_type))
