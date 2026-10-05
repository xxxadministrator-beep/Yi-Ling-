"""Import one or more dictionary sources into the configured database.

Examples:
    python -m scripts.import_all --cedict cedict_ts.u8
    python -m scripts.import_all --wordnet --kaikki kaikki.org-dictionary-English.jsonl
"""

from __future__ import annotations

import argparse

from app.db import init_db, get_session
from app.importers.cedict import import_cedict
from app.importers.kaikki import import_kaikki
from app.importers.wordnet import import_wordnet


def main() -> None:
    parser = argparse.ArgumentParser(description="Import dictionary data")
    parser.add_argument("--cedict", help="Path to CC-CEDICT text file")
    parser.add_argument("--wordnet", action="store_true", help="Import WordNet via NLTK")
    parser.add_argument("--kaikki", help="Path to a Kaikki/Wiktionary JSONL file")
    parser.add_argument("--limit", type=int, help="Limit entries for a smoke test")
    args = parser.parse_args()

    init_db()
    session = get_session()
    try:
        if args.cedict:
            count = import_cedict(session, args.cedict, limit=args.limit)
            print(f"CC-CEDICT imported: {count} senses")
        if args.wordnet:
            count = import_wordnet(session, limit=args.limit)
            print(f"WordNet imported: {count} synsets")
        if args.kaikki:
            count = import_kaikki(session, args.kaikki, limit=args.limit)
            print(f"Kaikki imported: {count} entries")
    finally:
        session.close()


if __name__ == "__main__":
    main()
