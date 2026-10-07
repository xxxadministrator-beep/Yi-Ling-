// Yiling Translate - Cloudflare Worker backend.
//
// Serves the static frontend from `public/` (via the ASSETS binding) and
// implements the same JSON API as the original FastAPI backend:
//
//   GET  /health          -> { status: "ok" }
//   POST /translate       -> DeepSeek translation (builtin fallback)
//   POST /lookup          -> online dictionary aggregation
//   POST /chat            -> DeepSeek conversational assistant
//   POST /auth/register   -> create account (PBKDF2 hash, D1)
//   POST /auth/login      -> login (D1)
//   GET  /auth/me         -> resolve a Bearer token
//
// LLM backend is any OpenAI-compatible endpoint: DeepSeek cloud, or a local
// Ollama (DEEPSEEK_BASE_URL=http://localhost:11434/v1, model deepseek-r1:1.5b).

// ---------------------------------------------------------------------------
// part-of-speech model (ported from backend/app/pos.py)
// ---------------------------------------------------------------------------

const POS_ORDER = [
  "noun", "proper noun", "pronoun", "verb", "auxiliary verb", "adjective",
  "adverb", "numeral", "determiner", "article", "preposition", "postposition",
  "conjunction", "particle", "interjection", "phrase", "idiom", "abbreviation",
  "contraction", "prefix", "suffix", "symbol", "letter", "other",
];

const POS_ZH = {
  "noun": "名词", "proper noun": "专有名词", "pronoun": "代词", "verb": "动词",
  "auxiliary verb": "助动词", "adjective": "形容词", "adverb": "副词",
  "numeral": "数词", "determiner": "限定词", "article": "冠词",
  "preposition": "介词", "postposition": "后置词", "conjunction": "连词",
  "particle": "助词", "interjection": "感叹词", "phrase": "短语", "idiom": "习语",
  "abbreviation": "缩写", "contraction": "缩合形式", "prefix": "前缀",
  "suffix": "后缀", "symbol": "符号", "letter": "字母", "other": "其他",
};

const POS_SHORT = {
  "noun": "n.", "proper noun": "prop.", "pronoun": "pron.", "verb": "v.",
  "auxiliary verb": "aux.", "adjective": "adj.", "adverb": "adv.",
  "numeral": "num.", "determiner": "det.", "article": "art.",
  "preposition": "prep.", "postposition": "postp.", "conjunction": "conj.",
  "particle": "part.", "interjection": "int.", "phrase": "phr.", "idiom": "idiom",
  "abbreviation": "abbr.", "contraction": "contr.", "prefix": "pref.",
  "suffix": "suf.", "symbol": "sym.", "letter": "letter", "other": "",
};

const POS_ALIASES = {
  "n": "noun", "n.": "noun", "noun": "noun", "common noun": "noun",
  "count noun": "noun", "mass noun": "noun", "名词": "noun",
  "prop": "proper noun", "prop.": "proper noun", "proper noun": "proper noun",
  "proper-noun": "proper noun", "propername": "proper noun",
  "proper name": "proper noun", "name": "proper noun", "专有名词": "proper noun",
  "pron": "pronoun", "pron.": "pronoun", "pronoun": "pronoun",
  "personal pronoun": "pronoun", "relative pronoun": "pronoun",
  "demonstrative": "pronoun", "代词": "pronoun",
  "v": "verb", "v.": "verb", "verb": "verb", "intransitive verb": "verb",
  "transitive verb": "verb", "动词": "verb",
  "aux": "auxiliary verb", "aux.": "auxiliary verb", "auxiliary": "auxiliary verb",
  "auxiliary verb": "auxiliary verb", "modal": "auxiliary verb",
  "modal verb": "auxiliary verb", "helping verb": "auxiliary verb",
  "助动词": "auxiliary verb",
  "a": "adjective", "a.": "adjective", "s": "adjective", "adj": "adjective",
  "adj.": "adjective", "adjective": "adjective", "adjectival": "adjective",
  "形容词": "adjective",
  "r": "adverb", "adv": "adverb", "adv.": "adverb", "adverb": "adverb",
  "adverbial": "adverb", "副词": "adverb",
  "num": "numeral", "num.": "numeral", "numeral": "numeral", "number": "numeral",
  "cardinal number": "numeral", "ordinal number": "numeral", "数词": "numeral",
  "det": "determiner", "det.": "determiner", "determiner": "determiner",
  "determinative": "determiner", "quantifier": "determiner", "限定词": "determiner",
  "art": "article", "art.": "article", "article": "article",
  "definite article": "article", "indefinite article": "article", "冠词": "article",
  "prep": "preposition", "prep.": "preposition", "preposition": "preposition",
  "prepositional": "preposition", "adposition": "preposition",
  "postpositional": "preposition", "介词": "preposition",
  "postp": "postposition", "postp.": "postposition", "postposition": "postposition",
  "后置词": "postposition",
  "conj": "conjunction", "conj.": "conjunction", "conjunction": "conjunction",
  "连词": "conjunction",
  "part": "particle", "part.": "particle", "particle": "particle", "助词": "particle",
  "int": "interjection", "int.": "interjection", "interj": "interjection",
  "interj.": "interjection", "interjection": "interjection",
  "exclamation": "interjection", "感叹词": "interjection",
  "phr": "phrase", "phr.": "phrase", "phrase": "phrase", "phrasal": "phrase",
  "verb phrase": "phrase", "noun phrase": "phrase", "expression": "phrase",
  "proverb": "phrase", "短语": "phrase",
  "idiom": "idiom", "习语": "idiom",
  "abbr": "abbreviation", "abbr.": "abbreviation", "abbreviation": "abbreviation",
  "initialism": "abbreviation", "acronym": "abbreviation", "缩写": "abbreviation",
  "contraction": "contraction", "contraction form": "contraction",
  "缩合形式": "contraction",
  "pref": "prefix", "pref.": "prefix", "prefix": "prefix", "前缀": "prefix",
  "suf": "suffix", "suf.": "suffix", "suffix": "suffix", "后缀": "suffix",
  "sym": "symbol", "sym.": "symbol", "symbol": "symbol", "sign": "symbol",
  "符号": "symbol",
  "letter": "letter", "character": "letter", "字母": "letter",
  "u": "other", "other": "other", "unknown": "other", "undefined": "other",
  "": "other",
};

const POS_SEPARATORS = ["/", "\\", ",", "，", ";", "；", "、", "·", "|"];

function cleanPos(raw) {
  let text = String(raw == null ? "" : raw).trim().toLowerCase();
  for (const sep of POS_SEPARATORS) text = text.split(sep).join(" ");
  text = text.replace(/_/g, " ").replace(/-/g, " ").replace(/\(/g, " ").replace(/\)/g, " ");
  return text.split(/\s+/).filter(Boolean).join(" ");
}

function normalizePos(raw) {
  const cleaned = cleanPos(raw);
  if (!cleaned) return "other";
  if (POS_ALIASES[cleaned]) return POS_ALIASES[cleaned];
  if (POS_ALIASES[cleaned + "."]) return POS_ALIASES[cleaned + "."];
  for (const word of cleaned.split(" ")) {
    const target = POS_ALIASES[word];
    if (target && target !== "other") return target;
  }
  return "other";
}

function posLabel(pos) {
  return POS_ZH[pos] || POS_ZH["other"];
}

function posShort(pos) {
  return POS_SHORT[pos] ?? "";
}

function posRank(pos) {
  const index = POS_ORDER.indexOf(pos);
  return index === -1 ? POS_ORDER.length : index;
}

// ---------------------------------------------------------------------------
// text helpers
// ---------------------------------------------------------------------------

const HTML_TAG = /<[^>]+>/g;
const WIKI_TEMPLATE = /\{\{[^{}]*\}\}/g;
const WIKI_LINK = /\[\[([^\]|]*\|)?([^\]]*)\]\]/g;
const WHITESPACE = /\s+/g;
const SPACE_BEFORE_PUNCT = /\s+([,.;:!?%)\]])/g;
const SPACE_AFTER_OPEN = /([(\[])\s+/g;

function cleanText(raw) {
  let value = String(raw == null ? "" : raw);
  value = value.replace(HTML_TAG, " ").replace(WIKI_LINK, (_m, _g1, g2) => g2 || "").replace(WIKI_TEMPLATE, " ");
  value = value.replace(/'''/g, "").replace(/''/g, "");
  value = value.replace(WHITESPACE, " ").replace(SPACE_AFTER_OPEN, "$1").replace(SPACE_BEFORE_PUNCT, "$1");
  return value.trim();
}

function dedupeKey(text) {
  return String(text == null ? "" : text).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}

function truncate(values, cap) {
  const seen = [];
  for (const value of values) {
    if (value && !seen.includes(value)) seen.push(value);
    if (seen.length >= cap) break;
  }
  return seen;
}

function detectLang(text) {
  return /[\u4e00-\u9fff]/.test(text) ? "zh" : "en";
}

function isAscii(text) {
  return /^[\x00-\x7f]+$/.test(text);
}

function parseJsonArray(text) {
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data.map(String).map((s) => s.trim()).filter(Boolean);
  } catch {}
  const match = /\[.*\]/s.exec(text);
  if (!match) return [];
  try {
    const data = JSON.parse(match[0]);
    if (Array.isArray(data)) return data.map(String).map((s) => s.trim()).filter(Boolean);
  } catch {}
  return [];
}

async function fetchWithTimeout(url, init, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// DeepSeek
// ---------------------------------------------------------------------------

class DeepSeekError extends Error {
  constructor(kind, status) {
    super(kind);
    this.kind = kind;
    this.status = status;
  }
}

function deepseekConfig(env) {
  return {
    apiKey: String(env.DEEPSEEK_API_KEY || "").trim(),
    baseUrl: String(env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, ""),
    model: String(env.DEEPSEEK_MODEL || "deepseek-chat"),
  };
}

// deepseek-r1 emits its reasoning as <think>...</think> inside `content`
// (and sometimes only the closing tag, or a never-closed block when cut off).
function stripThink(text) {
  return String(text || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^[\s\S]*?<\/think>/i, "")
    .replace(/<think>[\s\S]*$/i, "")
    .trim();
}

async function deepseekCompletion(env, messages, { temperature = 0.2, timeout = 45000 } = {}) {
  const { apiKey, baseUrl, model } = deepseekConfig(env);
  if (!apiKey) throw new DeepSeekError("unconfigured");

  // Small local models are slow: LLM_MIN_TIMEOUT_MS raises every call's floor.
  const ms = Math.max(timeout, Number(env.LLM_MIN_TIMEOUT_MS) || 0);
  const headers = { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" };
  // Optional: Cloudflare Access service token in front of a tunnelled Ollama.
  if (env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
    headers["CF-Access-Client-Id"] = env.CF_ACCESS_CLIENT_ID;
    headers["CF-Access-Client-Secret"] = env.CF_ACCESS_CLIENT_SECRET;
  }

  const response = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    { method: "POST", headers, body: JSON.stringify({ model, messages, temperature, stream: false }) },
    ms,
  );
  if (!response.ok) throw new DeepSeekError("http", response.status);
  const data = await response.json();
  return stripThink(data?.choices?.[0]?.message?.content);
}

const CHUNK_LIMIT = 300;

// Split long text on sentence/paragraph boundaries so a small model sees
// short inputs. Short text comes back as a single chunk.
function splitForTranslation(text, limit = CHUNK_LIMIT) {
  if (text.length <= limit) return [text];
  const pieces = text.match(/[^。！？!?.\n]+[。！？!?.]*\s*|\n+/g) || [text];
  const chunks = [];
  let current = "";
  for (const piece of pieces) {
    if (current && current.length + piece.length > limit) {
      chunks.push(current);
      current = "";
    }
    current += piece;
  }
  if (current) chunks.push(current);
  return chunks;
}

function cleanTranslation(raw) {
  return stripThink(raw)
    .replace(/^(译文|翻译|Translation)\s*[:：]\s*/i, "")
    .replace(/^["“「](.*)["”」]$/s, "$1")
    .trim();
}

function glossaryHint(glossary) {
  const rows = (Array.isArray(glossary) ? glossary : [])
    .filter((g) => g && g.src && g.tgt)
    .slice(0, 30)
    .map((g) => `${String(g.src).slice(0, 60)} => ${String(g.tgt).slice(0, 60)}`);
  return rows.length ? `\n术语表（必须按此翻译）：\n${rows.join("\n")}\n` : "";
}

async function deepseekTranslate(env, text, source, target, timeout = 45000, glossary = []) {
  const fromName = source === "zh" ? "中文" : "英语";
  const toName = target === "zh" ? "中文" : "英语";
  const hint = glossaryHint(glossary);
  const out = [];
  for (const chunk of splitForTranslation(text)) {
    if (!chunk.trim()) { out.push(chunk.includes("\n") ? "\n" : ""); continue; }
    const prompt =
      `把下面的${fromName}翻译成自然、地道的${toName}。只输出译文，不要解释，不要加引号。\n${hint}\n${chunk.trim()}`;
    const result = await deepseekCompletion(
      env,
      [
        { role: "system", content: "You are a professional translator. Output only the translation." },
        { role: "user", content: prompt },
      ],
      { timeout },
    );
    // keep the source's paragraph breaks; otherwise glue sentences by language
    out.push(cleanTranslation(result) + (/\n\s*$/.test(chunk) ? "\n" : target === "zh" ? "" : " "));
  }
  return out.join("").replace(/\n{3,}/g, "\n\n").trim();
}

const CHAT_SYSTEM_PROMPT =
  "你是「译灵翻译」应用里的 AI 助手，帮助中文用户学习英语，也支持英语用户学习中文。" +
  "先判断用户这句话想做什么：如果是打招呼、闲聊或提问（例如“你是谁”），就直接用简体中文简短回答，不要当作单词来讲解；" +
  "只有用户明确要求翻译，或询问某个词的意思时，才给出译文、词性、搭配和例句。" +
  "只回答用户最新的一句话，不要重复之前的回答。回答保持简洁。";

// ---------------------------------------------------------------------------
// builtin mini dictionary
// ---------------------------------------------------------------------------

const MINI_EN = {
  "hello": "你好；问候", "world": "世界；地球", "translate": "翻译",
  "dictionary": "词典；字典", "intelligent": "智能的；聪明的",
  "artificial": "人工的；人造的", "language": "语言", "meaning": "意思；含义",
};

const MINI_ZH = {
  "你好": "hello", "世界": "world", "翻译": "translate", "词典": "dictionary",
  "字典": "dictionary", "智能": "intelligent", "人工": "artificial",
  "语言": "language", "意思": "meaning",
};

function builtinTranslate(text, source, target) {
  const key = text.trim().toLowerCase();
  if (source === "en" && target === "zh") return MINI_EN[key];
  if (source === "zh" && target === "en") return MINI_ZH[text.trim()];
  return undefined;
}

function builtinEntry(word, source) {
  let gloss = "";
  let definitions = [];
  if (source === "en") {
    gloss = MINI_EN[word.toLowerCase()] || "";
    if (gloss) definitions = [{ en: "", zh: gloss, ex: "", source: "builtin" }];
  } else {
    gloss = MINI_ZH[word] || "";
    if (gloss) definitions = [{ en: gloss, zh: "", ex: "", source: "builtin" }];
  }
  return {
    word,
    language: source,
    phonetic_uk: "",
    phonetic_us: "",
    pinyin: "",
    senses: definitions.length ? [{ pos: "other", label: "其他", short: "", definitions }] : [],
    synonyms: [],
    antonyms: [],
    hyponyms: [],
    hypernyms: [],
    forms: [],
    translations: gloss ? [gloss] : [],
    source: "builtin",
    sources_used: definitions.length ? ["builtin"] : [],
    pos_count: definitions.length ? 1 : 0,
  };
}

// ---------------------------------------------------------------------------
// online dictionary aggregation (ported from backend/app/online.py)
// ---------------------------------------------------------------------------

const USER_AGENT = "YilingTranslate/0.3 (dictionary lookup)";
const DEFAULT_TIMEOUT = 4500;
const RELATION_CAP = 20;
const DEFINITIONS_PER_POS = 10;
const DEFINITION_PRIORITY = { wordnet: 0, wiktionary: 1, dictionaryapi: 2, datamuse: 3 };
const AUTHORITATIVE_SOURCES = ["wordnet", "wiktionary", "dictionaryapi"];
const SOURCE_NAMES = {
  wordnet: "WordNet", wiktionary: "Wiktionary", datamuse: "Datamuse", dictionaryapi: "DictionaryAPI",
};

function wiktionaryDefinition(item) {
  if (typeof item === "string") return [cleanText(item), ""];
  if (!item || typeof item !== "object") return ["", ""];
  let raw = item.definition;
  if (Array.isArray(raw)) raw = raw.map(String).join(" ");
  const definition = cleanText(raw || "");
  let example = "";
  for (const key of ["parsedExamples", "examples"]) {
    const values = item[key];
    if (!values || !Array.isArray(values) || !values.length) continue;
    const first = values[0];
    example = cleanText(first && typeof first === "object" ? (first.example || first.text) : first);
    if (example) break;
  }
  return [definition, example];
}

async function wiktionaryResult(word, lang) {
  const out = { source: "wiktionary", definitions: [] };
  const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`;
  const response = await fetchWithTimeout(
    url,
    { headers: { "User-Agent": USER_AGENT, "Accept": "application/json" } },
    DEFAULT_TIMEOUT,
  );
  if (!response.ok) throw new Error(`wiktionary ${response.status}`);
  const payload = await response.json();
  if (!payload || typeof payload !== "object") return out;

  const preferred = lang === "en"
    ? ["en", "english"]
    : ["zh", "cmn", "zh-hans", "zh-hant", "chinese", "mandarin"];
  for (const [key, value] of Object.entries(payload)) {
    if (!Array.isArray(value)) continue;
    if (preferred.length && !preferred.includes(String(key).toLowerCase())) continue;
    for (const section of value) {
      if (!section || typeof section !== "object") continue;
      const pos = normalizePos(section.partOfSpeech);
      for (const item of section.definitions || []) {
        const [definition, example] = wiktionaryDefinition(item);
        if (definition) out.definitions.push({ text: definition, pos, example, source: "wiktionary" });
      }
    }
  }
  return out;
}

async function datamuseResult(word) {
  const out = { source: "datamuse", definitions: [], synonyms: [], antonyms: [] };
  const base = "https://api.datamuse.com/words";
  const target = word.trim().toLowerCase();
  const get = async (params) => {
    const response = await fetchWithTimeout(`${base}?${params}`, {}, DEFAULT_TIMEOUT);
    if (!response.ok) throw new Error(`datamuse ${response.status}`);
    return response.json();
  };

  const [sp, syn, ant] = await Promise.allSettled([
    get(`sp=${encodeURIComponent(target)}&md=dp&max=5`),
    get(`rel_syn=${encodeURIComponent(target)}&max=${RELATION_CAP}`),
    get(`rel_ant=${encodeURIComponent(target)}&max=${RELATION_CAP}`),
  ]);

  const entry = sp.status === "fulfilled" && Array.isArray(sp.value)
    ? sp.value.find((item) => item && String(item.word || "").trim().toLowerCase() === target)
    : null;
  if (entry) {
    for (const raw of entry.defs || []) {
      const parts = String(raw).split("\t");
      if (parts.length < 2) continue;
      const pos = normalizePos(parts[0]);
      const text = cleanText(parts[1]);
      if (text) out.definitions.push({ text, pos, example: "", source: "datamuse" });
    }
  }

  for (const [result, bucket] of [[syn, out.synonyms], [ant, out.antonyms]]) {
    if (result.status !== "fulfilled" || !Array.isArray(result.value)) continue;
    for (const item of result.value) {
      if (!item || !item.word) continue;
      const name = String(item.word).trim();
      if (name.toLowerCase() !== target) bucket.push(name);
    }
  }
  return out;
}

async function dictionaryapiResult(word) {
  const out = { source: "dictionaryapi", definitions: [], synonyms: [], antonyms: [], phonetic_uk: "", phonetic_us: "" };
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
  const response = await fetchWithTimeout(url, {}, DEFAULT_TIMEOUT);
  if (!response.ok) throw new Error(`dictionaryapi ${response.status}`);
  const payload = await response.json();
  const first = Array.isArray(payload) && payload[0] ? payload[0] : null;
  if (!first || typeof first !== "object") return out;

  for (const meaning of first.meanings || []) {
    const pos = normalizePos(meaning.partOfSpeech);
    for (const item of (meaning.definitions || []).slice(0, 6)) {
      const text = cleanText(item.definition);
      if (text) out.definitions.push({ text, pos, example: cleanText(item.example), source: "dictionaryapi" });
    }
    for (const name of meaning.synonyms || []) out.synonyms.push(String(name));
    for (const name of meaning.antonyms || []) out.antonyms.push(String(name));
  }

  const phonetics = (first.phonetics || []).filter((p) => p && typeof p === "object");
  const fallback = first.phonetic || "";
  for (const p of phonetics) {
    const text = String(p.text || "").trim();
    const audio = String(p.audio || "");
    if (!text) continue;
    if (/-uk\./i.test(audio)) out.phonetic_uk = out.phonetic_uk || text;
    else if (/-us\./i.test(audio)) out.phonetic_us = out.phonetic_us || text;
  }
  if (!out.phonetic_uk) {
    out.phonetic_uk = fallback || (phonetics.find((p) => p.text) || {}).text || "";
  }
  if (!out.phonetic_us) out.phonetic_us = out.phonetic_uk;
  return out;
}

function mergeResults(word, lang, results) {
  const usable = results.filter(
    (r) => r.definitions.length || r.synonyms.length || r.antonyms.length || (r.translations || []).length,
  );
  if (!usable.length) return null;

  const corroborated = new Set();
  for (const r of usable) {
    if (AUTHORITATIVE_SOURCES.includes(r.source)) {
      for (const d of r.definitions) corroborated.add(d.pos || "other");
    }
  }

  const buckets = {};
  for (const r of usable) {
    for (const d of r.definitions) {
      const pos = d.pos || "other";
      if (r.source === "datamuse" && corroborated.size && !corroborated.has(pos)) continue;
      (buckets[pos] = buckets[pos] || []).push({ ...d, source: r.source });
    }
  }

  const senses = [];
  for (const pos of Object.keys(buckets).sort((a, b) => posRank(a) - posRank(b))) {
    const entries = buckets[pos].sort(
      (a, b) => (DEFINITION_PRIORITY[a.source] ?? 99) - (DEFINITION_PRIORITY[b.source] ?? 99),
    );
    const seen = new Set();
    const definitions = [];
    for (const entry of entries) {
      const key = dedupeKey(entry.text);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      definitions.push({ en: entry.text, zh: "", ex: entry.example || "", source: entry.source });
      if (definitions.length >= DEFINITIONS_PER_POS) break;
    }
    if (definitions.length) senses.push({ pos, label: posLabel(pos), short: posShort(pos), definitions });
  }
  if (!senses.length) return null;

  const collect = (attr) => truncate([...new Set(usable.flatMap((r) => r[attr] || []))], RELATION_CAP);
  const translations = usable.flatMap((r) => r.translations || []);
  const phonetics = usable.find((r) => r.phonetic_uk || r.phonetic_us);
  const contributing = ["wordnet", "wiktionary", "dictionaryapi", "datamuse"].filter((name) =>
    Object.values(buckets).some((bucket) => bucket.some((d) => d.source === name)),
  );

  return {
    word,
    language: lang,
    phonetic_uk: phonetics ? phonetics.phonetic_uk || "" : "",
    phonetic_us: phonetics ? phonetics.phonetic_us || "" : "",
    pinyin: "",
    senses,
    synonyms: collect("synonyms"),
    antonyms: collect("antonyms"),
    hyponyms: collect("hyponyms"),
    hypernyms: collect("hypernyms"),
    forms: [],
    translations: truncate(translations, 12),
    source: contributing.map((name) => SOURCE_NAMES[name] || name).join(" · "),
    sources_used: contributing,
    pos_count: senses.length,
  };
}

async function lookupOnline(word, lang) {
  const query = String(word || "").trim();
  if (!query) return null;
  const language = lang || detectLang(query);

  const labels = language === "en"
    ? ["datamuse", "dictionaryapi", "wiktionary"]
    : ["wiktionary"];
  const tasks = language === "en"
    ? [datamuseResult(query), dictionaryapiResult(query), wiktionaryResult(query, language)]
    : [wiktionaryResult(query, language)];

  const settled = await Promise.allSettled(tasks);
  const results = [];
  settled.forEach((outcome, index) => {
    if (outcome.status === "fulfilled" && labels[index]) results.push(outcome.value);
  });
  return mergeResults(query, language, results);
}

async function translateDefinitionsZh(env, word, senses) {
  const pending = [];
  for (const sense of senses) {
    const pos = sense.pos || "other";
    for (const definition of sense.definitions || []) {
      const en = String(definition.en || "").trim();
      const zh = String(definition.zh || "").trim();
      if (!en || zh) continue;
      pending.push({ definition, pos, en });
    }
  }
  if (!pending.length) return;

  const numbered = pending.map((p, i) => `${i + 1}. [${p.pos}] ${p.en}`).join("\n");
  const prompt =
    "你是英汉词典编纂助手。请把下面这些英文词典释义逐条翻译成简明中文。\n" +
    `单词：${word}\n` +
    "要求：按序号逐条翻译；每条给出 1-2 个简短中文说法，近义说法用“，”连接；" +
    "方括号里的词性仅供参考，不要写进译文。\n" +
    "只输出一个 JSON 数组，元素是各条释义对应的中文字符串，顺序与序号完全一致，" +
    "不要输出任何解释或代码块标记。\n\n" + numbered;

  try {
    const result = await deepseekCompletion(env, [{ role: "user", content: prompt }], { temperature: 0.1, timeout: 7000 });
    const glosses = parseJsonArray(result);
    pending.forEach((p, i) => {
      const gloss = glosses[i] || "";
      if (gloss) p.definition.zh = gloss;
    });
  } catch {}
}

function refreshTranslations(entry) {
  const glosses = [];
  for (const sense of entry.senses || []) {
    for (const definition of sense.definitions || []) {
      const zh = String(definition.zh || "").trim();
      if (zh && !glosses.includes(zh)) glosses.push(zh);
    }
  }
  if (!glosses.length) return;
  const existing = (entry.translations || []).filter((t) => t && !glosses.includes(t));
  entry.translations = [...existing, ...glosses].slice(0, 12);
}

async function lookupChineseViaEnglish(env, word) {
  let english = "";
  try {
    english = (await deepseekTranslate(env, word, "zh", "en", 12000)).trim();
  } catch {
    return null;
  }
  const firstWord = english.split(/\s+/)[0]
    ? english.split(/\s+/)[0].replace(/^[.,;:()[\]]+|[.,;:()[\]]+$/g, "")
    : "";
  if (!firstWord || !isAscii(firstWord)) return null;

  const entry = await lookupOnline(firstWord, "en");
  if (!entry || !entry.senses || !entry.senses.length) return null;
  entry.word = word;
  entry.language = "zh";
  entry.phonetic_uk = "";
  entry.phonetic_us = "";
  entry.pinyin = "";
  entry.source = `${entry.source || ""} · 由英文「${firstWord}」推出`.replace(/^ · /, "");
  entry.translations = [english, ...(entry.translations || []).filter((t) => t !== english)];
  return entry;
}

// ---------------------------------------------------------------------------
// accounts (D1 + PBKDF2-HMAC-SHA256)
// ---------------------------------------------------------------------------

// Cloudflare Workers caps WebCrypto PBKDF2 at 100,000 iterations, and the Free
// plan's per-request CPU budget makes high counts exceed the limit. 20,000 is a
// reasonable demo-level tradeoff; raise it on a Paid plan if stronger hashing is
// required.
const PBKDF2_ITERATIONS = 20000;

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function pbkdf2Hex(password, saltHex) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBytes(saltHex), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

async function hashPassword(password) {
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const digest = await pbkdf2Hex(password, salt);
  return `${salt}$${digest}`;
}

async function verifyPassword(password, stored) {
  const index = String(stored || "").indexOf("$");
  if (index < 0) return false;
  const salt = String(stored).slice(0, index);
  const digest = String(stored).slice(index + 1);
  const candidate = await pbkdf2Hex(password, salt);
  if (candidate.length !== digest.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i += 1) diff |= candidate.charCodeAt(i) ^ digest.charCodeAt(i);
  return diff === 0;
}

function newToken() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
}

function publicUser(user) {
  return { name: user.name || "", email: user.email || "" };
}

// ---------------------------------------------------------------------------
// cache + rate limit (D1). Both fail open: if the tables are missing the app
// still works, just without caching / limiting.
// ---------------------------------------------------------------------------

const CACHE_TTL_SECONDS = 30 * 24 * 3600;

async function cacheGet(env, key) {
  try {
    const row = await env.DB.prepare("SELECT value, created_at FROM kv_cache WHERE key = ?").bind(key).first();
    if (!row) return null;
    if (Math.floor(Date.now() / 1000) - row.created_at > CACHE_TTL_SECONDS) return null;
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

async function cachePut(env, key, value) {
  try {
    await env.DB.prepare("INSERT OR REPLACE INTO kv_cache (key, value, created_at) VALUES (?, ?, ?)")
      .bind(key, JSON.stringify(value), Math.floor(Date.now() / 1000)).run();
  } catch {}
}

// Fixed one-minute window per (client, scope). Returns a 429 Response when
// over the limit, otherwise null.
async function rateLimited(env, request, scope, defaultLimit) {
  const limit = Number(env.RATE_LIMIT_PER_MIN) > 0 ? Number(env.RATE_LIMIT_PER_MIN) : defaultLimit;
  const ip = request.headers.get("CF-Connecting-IP") || "local";
  const bucket = Math.floor(Date.now() / 60000);
  try {
    const row = await env.DB.prepare(
      "INSERT INTO rate_limit (key, bucket, count) VALUES (?, ?, 1) " +
      "ON CONFLICT(key) DO UPDATE SET count = CASE WHEN bucket = excluded.bucket THEN count + 1 ELSE 1 END, " +
      "bucket = excluded.bucket RETURNING count",
    ).bind(`${scope}:${ip}`, bucket).first();
    if (row && row.count > limit) {
      return json({ detail: "请求过于频繁，请稍后再试" }, 429, { "Retry-After": "60" });
    }
  } catch {}
  return null;
}

function fullyTranslated(entry) {
  if (entry.language !== "en") return true;
  return (entry.senses || []).every((s) => (s.definitions || []).every((d) => !d.en || d.zh));
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      ...extraHeaders,
    },
  });
}

function corsOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}

function constantTimeEqual(a, b) {
  const left = String(a ?? "");
  const right = String(b ?? "");
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

function adminAuthorized(request, env) {
  const token = String(env.ADMIN_TOKEN || "");
  if (!token) return false;
  const cookies = parseCookies(request.headers.get("Cookie") || "");
  return constantTimeEqual(cookies.admin, token);
}

// ---------------------------------------------------------------------------
// router
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    if (method === "OPTIONS") return corsOptions();

    try {
      if (method === "GET" && path === "/health") {
        return json({ status: "ok" });
      }

      if (method === "POST" && path === "/translate") {
        const body = await request.json().catch(() => ({}));
        const text = String(body.text || "").trim();
        const sourceLang = body.source_lang === "en" || body.source_lang === "zh" ? body.source_lang : "auto";
        const targetLang = body.target_lang === "en" ? "en" : "zh";
        if (!text) return json({ translation: "", engine: "unconfigured", detail: "text is required" }, 422);

        const source = sourceLang === "auto" ? detectLang(text) : sourceLang;
        if (source === targetLang) return json({ translation: text, engine: "identity" });

        const builtin = builtinTranslate(text, source, targetLang);
        if (builtin) return json({ translation: builtin, engine: "builtin" });

        const glossary = Array.isArray(body.glossary) ? body.glossary : [];
        const cacheKey = `tr:${source}>${targetLang}:${text}`;
        const cacheable = text.length <= 1000 && !glossary.length;
        if (cacheable) {
          const hit = await cacheGet(env, cacheKey);
          if (hit) return json({ translation: hit, engine: "cache" });
        }
        const blocked = await rateLimited(env, request, "translate", 20);
        if (blocked) return blocked;

        try {
          const translation = await deepseekTranslate(env, text, source, targetLang, 45000, glossary);
          if (translation && cacheable) await cachePut(env, cacheKey, translation);
          return json({ translation, engine: "deepseek" });
        } catch (error) {
          if (error instanceof DeepSeekError && error.kind === "unconfigured") {
            return json({ translation: "", engine: "unconfigured", detail: "Set DEEPSEEK_API_KEY to enable AI translation." });
          }
          throw error;
        }
      }

      if (method === "POST" && path === "/chat") {
        const body = await request.json().catch(() => ({}));
        const history = (body.messages || []).slice(-6).map((m) => ({
          role: m.role === "system" || m.role === "assistant" ? m.role : "user",
          content: String(m.content || ""),
        }));
        const messages = [{ role: "system", content: CHAT_SYSTEM_PROMPT }, ...history];
        const blocked = await rateLimited(env, request, "chat", 20);
        if (blocked) return blocked;
        try {
          const reply = await deepseekCompletion(env, messages, { temperature: 0.6 });
          return json({ reply, engine: "deepseek" });
        } catch (error) {
          if (error instanceof DeepSeekError && error.kind === "unconfigured") {
            return json({ reply: "", engine: "unconfigured", detail: "Set DEEPSEEK_API_KEY to enable AI chat." });
          }
          throw error;
        }
      }

      if (method === "POST" && path === "/lookup") {
        const body = await request.json().catch(() => ({}));
        const word = String(body.word || "").trim();
        if (!word) return json({ senses: [] }, 422);
        const source = detectLang(word);

        const lookupKey = `lk:${source}:${word.toLowerCase()}`;
        const cachedEntry = await cacheGet(env, lookupKey);
        if (cachedEntry) return json(cachedEntry);
        const blocked = await rateLimited(env, request, "lookup", 60);
        if (blocked) return blocked;

        let entry = await lookupOnline(word, source);
        if ((!entry || !entry.senses || !entry.senses.length) && source === "zh") {
          entry = await lookupChineseViaEnglish(env, word);
        }
        if (entry && entry.senses && entry.senses.length) {
          if (entry.language === "en") {
            await translateDefinitionsZh(env, word, entry.senses);
            refreshTranslations(entry);
          }
          // Only cache complete entries, so a timed-out LLM call isn't frozen in.
          if (fullyTranslated(entry)) await cachePut(env, lookupKey, entry);
          return json(entry);
        }
        return json(builtinEntry(word, source));
      }

      if (method === "POST" && path === "/auth/register") {
        const body = await request.json().catch(() => ({}));
        const name = String(body.name || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        if (!name || !email || password.length < 6) {
          return json({ detail: "昵称、邮箱和至少 6 位密码都是必填项" }, 422);
        }

        const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
        if (existing) return json({ detail: "该邮箱已注册" }, 409);

        const passwordHash = await hashPassword(password);
        const now = Math.floor(Date.now() / 1000);
        const inserted = await env.DB.prepare(
          "INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?) RETURNING id",
        ).bind(name, email, passwordHash, now).first();
        const token = newToken();
        await env.DB.prepare(
          "INSERT INTO auth_tokens (user_id, token, created_at) VALUES (?, ?, ?)",
        ).bind(inserted.id, token, now).run();
        return json({ token, user: { name, email } });
      }

      if (method === "POST" && path === "/auth/login") {
        const body = await request.json().catch(() => ({}));
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const blocked = await rateLimited(env, request, "login", 10);
        if (blocked) return blocked;
        const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
        if (!user || !(await verifyPassword(password, user.password_hash))) {
          return json({ detail: "邮箱或密码不正确" }, 401);
        }
        if (user.banned) {
          return json({ detail: "该账号已被封禁" }, 403);
        }
        const token = newToken();
        await env.DB.prepare(
          "INSERT INTO auth_tokens (user_id, token, created_at) VALUES (?, ?, ?)",
        ).bind(user.id, token, Math.floor(Date.now() / 1000)).run();
        return json({ token, user: publicUser(user) });
      }

      if (method === "GET" && path === "/auth/me") {
        const authorization = request.headers.get("Authorization") || "";
        const token = authorization.toLowerCase().startsWith("bearer ")
          ? authorization.slice(7).trim()
          : "";
        if (!token) return json({ detail: "缺少令牌" }, 401);
        const row = await env.DB.prepare("SELECT user_id FROM auth_tokens WHERE token = ?").bind(token).first();
        if (!row) return json({ detail: "令牌无效" }, 401);
        const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(row.user_id).first();
        if (!user) return json({ detail: "用户不存在" }, 401);
        return json({ user: publicUser(user) });
      }

      if (method === "GET" && path === "/admin") {
        return Response.redirect("/admin.html", 302);
      }

      if (method === "POST" && path === "/admin/login") {
        const body = await request.json().catch(() => ({}));
        const token = String(body.token || "");
        if (!env.ADMIN_TOKEN || !constantTimeEqual(token, env.ADMIN_TOKEN)) {
          return json({ ok: false, error: "令牌不正确" }, 401);
        }
        const cookie = `admin=${encodeURIComponent(env.ADMIN_TOKEN)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`;
        return json({ ok: true }, 200, { "Set-Cookie": cookie });
      }

      if (method === "POST" && path === "/admin/logout") {
        return json({ ok: true }, 200, { "Set-Cookie": "admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0" });
      }

      if (method === "GET" && path === "/admin/users") {
        if (!adminAuthorized(request, env)) return json({ error: "未授权" }, 401);
        const result = await env.DB.prepare(
          "SELECT id, name, email, created_at, banned FROM users ORDER BY id DESC",
        ).all();
        return json({ users: result.results || [] });
      }

      if ((method === "DELETE" || method === "POST") && path.startsWith("/admin/users/")) {
        if (!adminAuthorized(request, env)) return json({ error: "未授权" }, 401);
        const parts = path.split("/");
        const id = Number.parseInt(parts[3], 10);
        const action = parts[4];
        if (!id) return json({ error: "无效 ID" }, 400);

        if (method === "DELETE") {
          await env.DB.prepare("DELETE FROM auth_tokens WHERE user_id = ?").bind(id).run();
          await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
          return json({ ok: true });
        }
        if (action === "ban") {
          await env.DB.prepare("UPDATE users SET banned = 1 WHERE id = ?").bind(id).run();
          await env.DB.prepare("DELETE FROM auth_tokens WHERE user_id = ?").bind(id).run();
          return json({ ok: true });
        }
        if (action === "unban") {
          await env.DB.prepare("UPDATE users SET banned = 0 WHERE id = ?").bind(id).run();
          return json({ ok: true });
        }
        return json({ error: "未知操作" }, 400);
      }
    } catch (error) {
      console.error("Worker error:", error);
      if (error instanceof DeepSeekError && error.kind === "http") {
        return json({ detail: `DeepSeek request failed: ${error.status}` }, 502);
      }
      return json({ detail: "internal error" }, 500);
    }

    // Anything else is a static asset (or a 404 from the asset server).
    return env.ASSETS.fetch(request);
  },
};
