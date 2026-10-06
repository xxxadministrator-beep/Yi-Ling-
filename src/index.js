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

async function deepseekCompletion(env, messages, { temperature = 0.2, timeout = 45000 } = {}) {
  const { apiKey, baseUrl, model } = deepseekConfig(env);
  if (!apiKey) throw new DeepSeekError("unconfigured");

  const response = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature }),
    },
    timeout,
  );
  if (!response.ok) throw new DeepSeekError("http", response.status);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  return String(content || "").trim();
}

async function deepseekTranslate(env, text, source, target, timeout = 45000) {
  const fromName = source === "zh" ? "中文" : "英语";
  const toName = target === "zh" ? "中文" : "英语";
  const prompt = `你是专业的英中翻译。请把下面的${fromName}翻译成自然、地道的${toName}，只返回译文本身，不要解释：\n\n${text}`;
  return deepseekCompletion(
    env,
    [
      { role: "system", content: "You are a professional translator." },
      { role: "user", content: prompt },
    ],
    { timeout },
  );
}

const CHAT_SYSTEM_PROMPT =
  "你是译灵翻译的 AI 助手，服务中文用户学习英语（也支持英语用户学习中文）。" +
  "回答时用简体中文，必要时给出英文对应表达。解释单词时说明词性、常见搭配和例句；" +
  "翻译时给出自然、地道的译文，并在需要时补充更口语或更正式的说法。回答保持简洁。";

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
// HTTP helpers
// ---------------------------------------------------------------------------

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function corsOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
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

        try {
          const translation = await deepseekTranslate(env, text, source, targetLang);
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
        const history = (body.messages || []).slice(-20).map((m) => ({
          role: m.role === "system" || m.role === "assistant" ? m.role : "user",
          content: String(m.content || ""),
        }));
        const messages = [{ role: "system", content: CHAT_SYSTEM_PROMPT }, ...history];
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

        let entry = await lookupOnline(word, source);
        if ((!entry || !entry.senses || !entry.senses.length) && source === "zh") {
          entry = await lookupChineseViaEnglish(env, word);
        }
        if (entry && entry.senses && entry.senses.length) {
          if (entry.language === "en") {
            await translateDefinitionsZh(env, word, entry.senses);
            refreshTranslations(entry);
          }
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
        const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
        if (!user || !(await verifyPassword(password, user.password_hash))) {
          return json({ detail: "邮箱或密码不正确" }, 401);
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
