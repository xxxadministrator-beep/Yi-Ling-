"""Normalized dictionary schema shared by CC-CEDICT, WordNet and Kaikki imports."""

from __future__ import annotations

from sqlalchemy import ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class DictionaryEntry(Base):
    __tablename__ = "dictionary_entries"
    __table_args__ = (Index("ix_entries_word_lang", "word", "lang"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    word: Mapped[str] = mapped_column(String(128), index=True)
    lang: Mapped[str] = mapped_column(String(8), index=True)
    source: Mapped[str] = mapped_column(String(32), default="")
    phonetic_uk: Mapped[str] = mapped_column(String(128), default="")
    phonetic_us: Mapped[str] = mapped_column(String(128), default="")
    pinyin: Mapped[str] = mapped_column(String(128), default="")

    senses: Mapped[list[DictionarySense]] = relationship(back_populates="entry", cascade="all, delete-orphan")
    relations: Mapped[list[DictionaryRelation]] = relationship(back_populates="entry", cascade="all, delete-orphan")
    forms: Mapped[list[DictionaryForm]] = relationship(back_populates="entry", cascade="all, delete-orphan")


class DictionarySense(Base):
    __tablename__ = "dictionary_senses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entry_id: Mapped[int] = mapped_column(ForeignKey("dictionary_entries.id"), index=True)
    pos: Mapped[str] = mapped_column(String(32), default="other")
    definition_en: Mapped[str] = mapped_column(Text, default="")
    definition_zh: Mapped[str] = mapped_column(Text, default="")
    example: Mapped[str] = mapped_column(Text, default="")
    order: Mapped[int] = mapped_column(Integer, default=0)

    entry: Mapped[DictionaryEntry] = relationship(back_populates="senses")


class DictionaryRelation(Base):
    __tablename__ = "dictionary_relations"
    __table_args__ = (UniqueConstraint("entry_id", "rel_type", "target", name="uq_relation"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entry_id: Mapped[int] = mapped_column(ForeignKey("dictionary_entries.id"), index=True)
    rel_type: Mapped[str] = mapped_column(String(32))
    target: Mapped[str] = mapped_column(String(128))

    entry: Mapped[DictionaryEntry] = relationship(back_populates="relations")


class DictionaryForm(Base):
    __tablename__ = "dictionary_forms"
    __table_args__ = (UniqueConstraint("entry_id", "form", "form_type", name="uq_form"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entry_id: Mapped[int] = mapped_column(ForeignKey("dictionary_entries.id"), index=True)
    form: Mapped[str] = mapped_column(String(128))
    form_type: Mapped[str] = mapped_column(String(32), default="form")

    entry: Mapped[DictionaryEntry] = relationship(back_populates="forms")
