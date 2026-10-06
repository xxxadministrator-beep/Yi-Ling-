"""Canonical part-of-speech model shared by every dictionary source.

WordNet, Wiktionary, Datamuse, CC-CEDICT and the built-in lexicon all spell
parts of speech differently: n, noun, Noun, a, s, prop. Everything reaching the
API is normalized through normalize_pos so the client can group and label
senses consistently instead of collapsing unknown values into "other".

This module is dependency free (standard library only) so it can be imported
and tested without the database or web stack installed.
"""

from __future__ import annotations

# Display order: open classes first, closed classes next, rare categories last.
POS_ORDER: tuple[str, ...] = (
    "noun",
    "proper noun",
    "pronoun",
    "verb",
    "auxiliary verb",
    "adjective",
    "adverb",
    "numeral",
    "determiner",
    "article",
    "preposition",
    "postposition",
    "conjunction",
    "particle",
    "interjection",
    "phrase",
    "idiom",
    "abbreviation",
    "contraction",
    "prefix",
    "suffix",
    "symbol",
    "letter",
    "other",
)

POS_ZH: dict[str, str] = {
    "noun": "名词",
    "proper noun": "专有名词",
    "pronoun": "代词",
    "verb": "动词",
    "auxiliary verb": "助动词",
    "adjective": "形容词",
    "adverb": "副词",
    "numeral": "数词",
    "determiner": "限定词",
    "article": "冠词",
    "preposition": "介词",
    "postposition": "后置词",
    "conjunction": "连词",
    "particle": "助词",
    "interjection": "感叹词",
    "phrase": "短语",
    "idiom": "习语",
    "abbreviation": "缩写",
    "contraction": "缩合形式",
    "prefix": "前缀",
    "suffix": "后缀",
    "symbol": "符号",
    "letter": "字母",
    "other": "其他",
}

POS_SHORT: dict[str, str] = {
    "noun": "n.",
    "proper noun": "prop.",
    "pronoun": "pron.",
    "verb": "v.",
    "auxiliary verb": "aux.",
    "adjective": "adj.",
    "adverb": "adv.",
    "numeral": "num.",
    "determiner": "det.",
    "article": "art.",
    "preposition": "prep.",
    "postposition": "postp.",
    "conjunction": "conj.",
    "particle": "part.",
    "interjection": "int.",
    "phrase": "phr.",
    "idiom": "idiom",
    "abbreviation": "abbr.",
    "contraction": "contr.",
    "prefix": "pref.",
    "suffix": "suf.",
    "symbol": "sym.",
    "letter": "letter",
    "other": "",
}

# Source spelling -> canonical name. WordNet uses n/v/a/s/r, Datamuse adds
# "prop" for proper nouns, Wiktionary sends capitalized words such as "Noun",
# dictionaryapi.dev sends plain lowercase names.
ALIASES: dict[str, str] = {
    "n": "noun",
    "n.": "noun",
    "noun": "noun",
    "common noun": "noun",
    "count noun": "noun",
    "mass noun": "noun",
    "名词": "noun",
    "prop": "proper noun",
    "prop.": "proper noun",
    "proper noun": "proper noun",
    "proper-noun": "proper noun",
    "propername": "proper noun",
    "proper name": "proper noun",
    "name": "proper noun",
    "专有名词": "proper noun",
    "pron": "pronoun",
    "pron.": "pronoun",
    "pronoun": "pronoun",
    "personal pronoun": "pronoun",
    "relative pronoun": "pronoun",
    "demonstrative": "pronoun",
    "代词": "pronoun",
    "v": "verb",
    "v.": "verb",
    "verb": "verb",
    "intransitive verb": "verb",
    "transitive verb": "verb",
    "动词": "verb",
    "aux": "auxiliary verb",
    "aux.": "auxiliary verb",
    "auxiliary": "auxiliary verb",
    "auxiliary verb": "auxiliary verb",
    "modal": "auxiliary verb",
    "modal verb": "auxiliary verb",
    "helping verb": "auxiliary verb",
    "助动词": "auxiliary verb",
    "a": "adjective",
    "a.": "adjective",
    "s": "adjective",
    "adj": "adjective",
    "adj.": "adjective",
    "adjective": "adjective",
    "adjectival": "adjective",
    "形容词": "adjective",
    "r": "adverb",
    "adv": "adverb",
    "adv.": "adverb",
    "adverb": "adverb",
    "adverbial": "adverb",
    "副词": "adverb",
    "num": "numeral",
    "num.": "numeral",
    "numeral": "numeral",
    "number": "numeral",
    "cardinal number": "numeral",
    "ordinal number": "numeral",
    "数词": "numeral",
    "det": "determiner",
    "det.": "determiner",
    "determiner": "determiner",
    "determinative": "determiner",
    "quantifier": "determiner",
    "限定词": "determiner",
    "art": "article",
    "art.": "article",
    "article": "article",
    "definite article": "article",
    "indefinite article": "article",
    "冠词": "article",
    "prep": "preposition",
    "prep.": "preposition",
    "preposition": "preposition",
    "prepositional": "preposition",
    "adposition": "preposition",
    "postpositional": "preposition",
    "介词": "preposition",
    "postp": "postposition",
    "postp.": "postposition",
    "postposition": "postposition",
    "后置词": "postposition",
    "conj": "conjunction",
    "conj.": "conjunction",
    "conjunction": "conjunction",
    "连词": "conjunction",
    "part": "particle",
    "part.": "particle",
    "particle": "particle",
    "助词": "particle",
    "int": "interjection",
    "int.": "interjection",
    "interj": "interjection",
    "interj.": "interjection",
    "interjection": "interjection",
    "exclamation": "interjection",
    "感叹词": "interjection",
    "phr": "phrase",
    "phr.": "phrase",
    "phrase": "phrase",
    "phrasal": "phrase",
    "verb phrase": "phrase",
    "noun phrase": "phrase",
    "expression": "phrase",
    "proverb": "phrase",
    "短语": "phrase",
    "idiom": "idiom",
    "习语": "idiom",
    "abbr": "abbreviation",
    "abbr.": "abbreviation",
    "abbreviation": "abbreviation",
    "initialism": "abbreviation",
    "acronym": "abbreviation",
    "缩写": "abbreviation",
    "contraction": "contraction",
    "contraction form": "contraction",
    "缩合形式": "contraction",
    "pref": "prefix",
    "pref.": "prefix",
    "prefix": "prefix",
    "前缀": "prefix",
    "suf": "suffix",
    "suf.": "suffix",
    "suffix": "suffix",
    "后缀": "suffix",
    "sym": "symbol",
    "sym.": "symbol",
    "symbol": "symbol",
    "sign": "symbol",
    "符号": "symbol",
    "letter": "letter",
    "character": "letter",
    "字母": "letter",
    "u": "other",
    "other": "other",
    "unknown": "other",
    "undefined": "other",
    "": "other",
}

# Separators seen in combined part-of-speech strings such as "n. / v.".
_SEPARATORS = ("/", "\\", ",", "，", ";", "；", "、", "·", "|")


def _clean(raw: str) -> str:
    """Lowercase, drop separator noise and collapse internal whitespace."""
    text = str(raw or "").strip().lower()
    for sep in _SEPARATORS:
        text = text.replace(sep, " ")
    text = text.replace("_", " ").replace("-", " ").replace("(", " ").replace(")", " ")
    return " ".join(text.split())


def normalize_pos(raw: str) -> str:
    """Map any source part-of-speech spelling onto a canonical name."""
    cleaned = _clean(raw)
    if not cleaned:
        return "other"
    if cleaned in ALIASES:
        return ALIASES[cleaned]
    dotted = cleaned + "."
    if dotted in ALIASES:
        return ALIASES[dotted]
    # Multi-word values such as "transitive verb" reduce to their head word.
    for word in cleaned.split():
        target = ALIASES.get(word)
        if target and target != "other":
            return target
    return "other"


def split_pos_string(raw: str) -> list[str]:
    """Split a combined string like n. / v. into canonical names.

    "other" is only kept when nothing better was found, mirroring the behaviour
    the client already had for the built-in lexicon.
    """
    text = str(raw or "")
    for sep in _SEPARATORS:
        text = text.replace(sep, " ")
    found: list[str] = []
    for part in text.split():
        name = normalize_pos(part)
        if name not in found:
            found.append(name)
    meaningful = [name for name in found if name != "other"]
    return meaningful or found or ["other"]


def is_known(pos: str) -> bool:
    return pos in POS_ZH


def pos_label(pos: str) -> str:
    """Chinese label for a canonical part of speech."""
    return POS_ZH.get(pos, POS_ZH["other"])


def pos_short(pos: str) -> str:
    """Abbreviated tag for a canonical part of speech."""
    return POS_SHORT.get(pos, "")


def pos_rank(pos: str) -> int:
    """Sort key following POS_ORDER; unknown names sort last."""
    try:
        return POS_ORDER.index(pos)
    except ValueError:
        return len(POS_ORDER)


def sort_pos(values) -> list[str]:
    """Return unique canonical names in display order."""
    unique = {pos for pos in values if pos}
    return sorted(unique, key=pos_rank)
