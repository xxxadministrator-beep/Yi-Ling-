/* 译灵 - AI 英中智能翻译与词典（浏览器高保真原型） */

const ICONS = {
  search: '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>',
  mic: '<path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"></path><path d="M19 10v1a7 7 0 0 1-14 0v-1"></path><path d="M12 18v4"></path>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><path d="M7 12h10"></path>',
  x: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>',
  "volume-2": '<path d="M11 5 6 9H2v6h4l5 4V5Z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>',
  star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"></path>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path>',
  trash: '<path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M10 11v6"></path><path d="M14 11v6"></path>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle>',
  swap: '<path d="m8 3-4 4 4 4"></path><path d="M4 7h16"></path><path d="m16 21 4-4-4-4"></path><path d="M20 17H4"></path>',
  "chevron-down": '<path d="m6 9 6 6 6-6"></path>',
  check: '<path d="M20 6 9 17l-5-5"></path>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
  settings: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>'
};

const LEXICON = {
  hello: { phonetic: "/həˈloʊ/", pos: "interj. / n.", zh: "你好；问候", en: "used as a greeting", forms: "helloed · helloing · hellos", synonyms: ["hi", "hey", "greetings"], collocations: ["say hello", "hello there", "golden hello"], examples: [{ en: "Hello, how are you?", zh: "你好，你最近怎么样？" }, { en: "She said hello to everyone.", zh: "她向每个人问好。" }] },
  world: { phonetic: "/wɜːrld/", pos: "n.", zh: "世界；地球；领域", en: "the earth and all its people and places", forms: "worlds", synonyms: ["earth", "globe", "realm"], collocations: ["the whole world", "around the world", "business world"], examples: [{ en: "The whole world watched the event.", zh: "全世界都在关注这一事件。" }, { en: "It is a small world.", zh: "这世界真小。" }] },
  love: { phonetic: "/lʌv/", pos: "n. / v.", zh: "爱；喜爱；热爱", en: "a strong feeling of affection", forms: "loved · loving · loves", synonyms: ["affection", "adore", "cherish"], collocations: ["fall in love", "love story", "make love"], examples: [{ en: "I love learning languages.", zh: "我热爱学习语言。" }, { en: "Their love grew over time.", zh: "他们的爱随着时间日渐加深。" }] },
  translate: { phonetic: "/trænzˈleɪt/", pos: "v.", zh: "翻译；转化；解释", en: "to express words in another language", forms: "translated · translating · translates", synonyms: ["interpret", "render", "convert"], collocations: ["translate into", "translate a text", "roughly translate"], examples: [{ en: "Can you translate this sentence?", zh: "你能翻译这句话吗？" }, { en: "The app translates instantly.", zh: "这款应用能即时翻译。" }] },
  dictionary: { phonetic: "/ˈdɪkʃəneri/", pos: "n.", zh: "词典；字典", en: "a book or electronic resource listing words and meanings", forms: "dictionaries", synonyms: ["lexicon", "glossary", "wordbook"], collocations: ["look up a dictionary", "bilingual dictionary", "dictionary entry"], examples: [{ en: "I looked the word up in the dictionary.", zh: "我在词典里查了这个词。" }, { en: "This dictionary has many examples.", zh: "这本词典有很多例句。" }] },
  intelligent: { phonetic: "/ɪnˈtelɪdʒənt/", pos: "adj.", zh: "智能的；聪明的；有才智的", en: "having or showing the ability to learn and understand", forms: "intelligently", synonyms: ["smart", "clever", "bright"], collocations: ["intelligent machine", "intelligent design", "highly intelligent"], examples: [{ en: "This is an intelligent assistant.", zh: "这是一位智能助手。" }, { en: "She is highly intelligent.", zh: "她非常聪明。" }] },
  artificial: { phonetic: "/ˌɑːrtɪˈfɪʃl/", pos: "adj.", zh: "人工的；人造的；虚假的", en: "made by humans, not occurring naturally", forms: "artificially", synonyms: ["man-made", "synthetic", "fabricated"], collocations: ["artificial intelligence", "artificial light", "artificial flavor"], examples: [{ en: "Artificial intelligence is evolving quickly.", zh: "人工智能正在快速发展。" }, { en: "The room had artificial light.", zh: "房间使用人造光。" }] },
  computer: { phonetic: "/kəmˈpjuːtər/", pos: "n.", zh: "计算机；电脑", en: "an electronic device for storing and processing data", forms: "computers", synonyms: ["PC", "machine", "laptop"], collocations: ["personal computer", "computer science", "computer screen"], examples: [{ en: "My computer is very fast.", zh: "我的电脑很快。" }, { en: "He studies computer science.", zh: "他学习计算机科学。" }] },
  phone: { phonetic: "/foʊn/", pos: "n. / v.", zh: "电话；手机；打电话", en: "a device used for voice communication", forms: "phoned · phoning · phones", synonyms: ["telephone", "mobile", "call"], collocations: ["mobile phone", "phone call", "answer the phone"], examples: [{ en: "Please put down your phone.", zh: "请放下你的手机。" }, { en: "I will phone you later.", zh: "我稍后给你打电话。" }] },
  camera: { phonetic: "/ˈkæmərə/", pos: "n.", zh: "相机；摄像机", en: "a device for taking photographs or videos", forms: "cameras", synonyms: ["shooter", "webcam", "lens"], collocations: ["digital camera", "camera roll", "point the camera"], examples: [{ en: "Use the camera to scan the text.", zh: "用相机扫描文字。" }, { en: "Her camera is very expensive.", zh: "她的相机很贵。" }] },
  apple: { phonetic: "/ˈæpl/", pos: "n.", zh: "苹果", en: "a round fruit with red, green, or yellow skin", forms: "apples", synonyms: ["fruit", "pome"], collocations: ["green apple", "apple pie", "apple tree"], examples: [{ en: "I eat an apple every day.", zh: "我每天吃一个苹果。" }, { en: "The apple is sweet.", zh: "这个苹果很甜。" }] },
  book: { phonetic: "/bʊk/", pos: "n. / v.", zh: "书；书籍；预订", en: "a set of printed pages bound together", forms: "booked · booking · books", synonyms: ["volume", "title", "publication"], collocations: ["read a book", "phone book", "book a ticket"], examples: [{ en: "This book is worth reading.", zh: "这本书值得一读。" }, { en: "I want to book a hotel.", zh: "我想预订一家酒店。" }] },
  run: { phonetic: "/rʌn/", pos: "v. / n.", zh: "跑；运行；经营", en: "to move quickly on foot", forms: "ran · running · runs", synonyms: ["sprint", "jog", "operate"], collocations: ["run fast", "run a business", "run out of"], examples: [{ en: "I run every morning.", zh: "我每天早上跑步。" }, { en: "The program is running.", zh: "程序正在运行。" }] },
  fast: { phonetic: "/fæst/", pos: "adj. / adv.", zh: "快的；快速地", en: "moving or happening quickly", forms: "faster · fastest", synonyms: ["quick", "rapid", "swift"], collocations: ["fast food", "fast train", "run fast"], examples: [{ en: "This train is very fast.", zh: "这列火车非常快。" }, { en: "Time passes fast.", zh: "时间过得很快。" }] },
  beautiful: { phonetic: "/ˈbjuːtɪfl/", pos: "adj.", zh: "美丽的；漂亮的", en: "pleasing to the senses or mind", forms: "beautifully", synonyms: ["pretty", "lovely", "gorgeous"], collocations: ["beautiful view", "beautiful day", "a beautiful smile"], examples: [{ en: "What a beautiful view!", zh: "多么美丽的景色！" }, { en: "She has a beautiful voice.", zh: "她的嗓音很美。" }] },
  happy: { phonetic: "/ˈhæpi/", pos: "adj.", zh: "快乐的；幸福的；满意的", en: "feeling or showing pleasure", forms: "happier · happiest · happily", synonyms: ["glad", "joyful", "pleased"], collocations: ["happy birthday", "happy ending", "be happy with"], examples: [{ en: "I am happy to help you.", zh: "我很乐意帮助你。" }, { en: "Happy birthday!", zh: "生日快乐！" }] },
  friend: { phonetic: "/frend/", pos: "n.", zh: "朋友；友人", en: "a person whom one knows and likes", forms: "friends", synonyms: ["companion", "pal", "buddy"], collocations: ["best friend", "make friends", "old friend"], examples: [{ en: "She is my best friend.", zh: "她是我最好的朋友。" }, { en: "We made friends quickly.", zh: "我们很快就成了朋友。" }] },
  water: { phonetic: "/ˈwɔːtər/", pos: "n. / v.", zh: "水；浇水", en: "a clear liquid essential for life", forms: "watered · watering · waters", synonyms: ["liquid", "aqua", "H2O"], collocations: ["drinking water", "water bottle", "boil water"], examples: [{ en: "Drink plenty of water.", zh: "多喝水。" }, { en: "Please water the plants.", zh: "请给植物浇水。" }] },
  fire: { phonetic: "/ˈfaɪər/", pos: "n. / v.", zh: "火；火灾；解雇", en: "the process of burning producing heat and light", forms: "fired · firing · fires", synonyms: ["flame", "blaze", "combustion"], collocations: ["catch fire", "fire alarm", "open fire"], examples: [{ en: "The fire spread quickly.", zh: "火势蔓延得很快。" }, { en: "He was fired from his job.", zh: "他被解雇了。" }] },
  light: { phonetic: "/laɪt/", pos: "n. / adj. / v.", zh: "光；灯；轻的；点亮", en: "the natural agent that makes things visible", forms: "lit · lighting · lights", synonyms: ["brightness", "lamp", "illuminate"], collocations: ["turn on the light", "traffic light", "light rain"], examples: [{ en: "Please turn on the light.", zh: "请打开灯。" }, { en: "The box is very light.", zh: "这个箱子很轻。" }] },
  time: { phonetic: "/taɪm/", pos: "n. / v.", zh: "时间；次数；计时", en: "the measured or measurable period during which events occur", forms: "timed · timing · times", synonyms: ["period", "duration", "moment"], collocations: ["free time", "on time", "time zone"], examples: [{ en: "What time is it?", zh: "现在几点了？" }, { en: "We had a great time.", zh: "我们玩得很开心。" }] },
  work: { phonetic: "/wɜːrk/", pos: "n. / v.", zh: "工作；劳动；运转", en: "activity involving mental or physical effort", forms: "worked · working · works", synonyms: ["labor", "job", "function"], collocations: ["hard work", "work out", "go to work"], examples: [{ en: "I go to work at nine.", zh: "我九点去上班。" }, { en: "The machine works well.", zh: "这台机器运转良好。" }] },
  study: { phonetic: "/ˈstʌdi/", pos: "n. / v.", zh: "学习；研究；书房", en: "the activity of learning or investigating", forms: "studied · studying · studies", synonyms: ["learn", "research", "examine"], collocations: ["study hard", "study abroad", "field of study"], examples: [{ en: "I study English every day.", zh: "我每天学习英语。" }, { en: "This study is very important.", zh: "这项研究非常重要。" }] },
  travel: { phonetic: "/ˈtrævl/", pos: "v. / n.", zh: "旅行；出行", en: "to go from one place to another", forms: "traveled · traveling · travels", synonyms: ["journey", "trip", "tour"], collocations: ["travel abroad", "travel agency", "travel light"], examples: [{ en: "I love to travel abroad.", zh: "我喜欢出国旅行。" }, { en: "Travel broadens the mind.", zh: "旅行开阔眼界。" }] },
  food: { phonetic: "/fuːd/", pos: "n.", zh: "食物；食品", en: "substances eaten for nourishment", forms: "foods", synonyms: ["meal", "cuisine", "nourishment"], collocations: ["fast food", "food safety", "delicious food"], examples: [{ en: "The food here is delicious.", zh: "这里的食物很美味。" }, { en: "We need more food.", zh: "我们需要更多食物。" }] },
  home: { phonetic: "/hoʊm/", pos: "n. / adv.", zh: "家；住所；回家", en: "the place where one lives", forms: "homes", synonyms: ["house", "residence", "dwelling"], collocations: ["go home", "at home", "home page"], examples: [{ en: "I want to go home.", zh: "我想回家。" }, { en: "Welcome home!", zh: "欢迎回家！" }] },
  city: { phonetic: "/ˈsɪti/", pos: "n.", zh: "城市；都市", en: "a large town", forms: "cities", synonyms: ["town", "metropolis", "municipality"], collocations: ["big city", "city center", "capital city"], examples: [{ en: "Beijing is a big city.", zh: "北京是一座大城市。" }, { en: "The city is very crowded.", zh: "这座城市非常拥挤。" }] },
  language: { phonetic: "/ˈlæŋɡwɪdʒ/", pos: "n.", zh: "语言；言语", en: "a system of communication used by people", forms: "languages", synonyms: ["tongue", "speech", "dialect"], collocations: ["foreign language", "native language", "body language"], examples: [{ en: "English is a global language.", zh: "英语是一门全球性语言。" }, { en: "How many languages do you speak?", zh: "你会说几种语言？" }] },
  meaning: { phonetic: "/ˈmiːnɪŋ/", pos: "n.", zh: "意思；含义；意义", en: "what something signifies", forms: "meanings", synonyms: ["sense", "definition", "significance"], collocations: ["the meaning of", "deep meaning", "real meaning"], examples: [{ en: "What is the meaning of this word?", zh: "这个词是什么意思？" }, { en: "Life has deep meaning.", zh: "生命有深刻的意义。" }] },
  word: { phonetic: "/wɜːrd/", pos: "n.", zh: "单词；话语；消息", en: "a single unit of language", forms: "words", synonyms: ["term", "expression", "vocable"], collocations: ["key word", "say a word", "word by word"], examples: [{ en: "I don't know this word.", zh: "我不认识这个单词。" }, { en: "Can I have a word with you?", zh: "我能和你说句话吗？" }] },
  sentence: { phonetic: "/ˈsentəns/", pos: "n. / v.", zh: "句子；判决", en: "a set of words expressing a complete thought", forms: "sentenced · sentencing · sentences", synonyms: ["phrase", "clause", "statement"], collocations: ["topic sentence", "death sentence", "complete sentence"], examples: [{ en: "Please translate this sentence.", zh: "请翻译这个句子。" }, { en: "That is a long sentence.", zh: "那是一个长句。" }] },
  phrase: { phonetic: "/freɪz/", pos: "n. / v.", zh: "短语；措辞；表达", en: "a small group of words standing together", forms: "phrased · phrasing · phrases", synonyms: ["expression", "idiom", "wording"], collocations: ["common phrase", "prepositional phrase", "coin a phrase"], examples: [{ en: "This is a useful phrase.", zh: "这是一个有用的短语。" }, { en: "Please phrase it differently.", zh: "请换个方式表达。" }] }
};

const ZH_LEXICON = {
  "你好": { pinyin: "nǐ hǎo", pos: "问候语", en: "hello; hi", examples: [{ zh: "你好，很高兴认识你。", en: "Hello, nice to meet you." }] },
  "世界": { pinyin: "shì jiè", pos: "n.", en: "world", examples: [{ zh: "世界很大。", en: "The world is very big." }] },
  "爱": { pinyin: "ài", pos: "n. / v.", en: "love; to love", examples: [{ zh: "我爱学习。", en: "I love learning." }] },
  "翻译": { pinyin: "fān yì", pos: "n. / v.", en: "translation; to translate", examples: [{ zh: "请翻译这句话。", en: "Please translate this sentence." }] },
  "字典": { pinyin: "zì diǎn", pos: "n.", en: "dictionary", examples: [{ zh: "我在字典里查了这个词。", en: "I looked up this word in the dictionary." }] },
  "词典": { pinyin: "cí diǎn", pos: "n.", en: "dictionary; lexicon", examples: [{ zh: "这是一本英汉词典。", en: "This is an English-Chinese dictionary." }] },
  "智能": { pinyin: "zhì néng", pos: "adj. / n.", en: "intelligent; smart", examples: [{ zh: "这是一位智能助手。", en: "This is an intelligent assistant." }] },
  "人工": { pinyin: "rén gōng", pos: "adj. / adv.", en: "artificial; manual", examples: [{ zh: "人工智能发展很快。", en: "Artificial intelligence is developing quickly." }] },
  "计算机": { pinyin: "jì suàn jī", pos: "n.", en: "computer", examples: [{ zh: "我的计算机很快。", en: "My computer is very fast." }] },
  "手机": { pinyin: "shǒu jī", pos: "n.", en: "mobile phone; cellphone", examples: [{ zh: "请放下手机。", en: "Please put down your phone." }] },
  "相机": { pinyin: "xiàng jī", pos: "n.", en: "camera", examples: [{ zh: "用相机扫描文字。", en: "Use the camera to scan the text." }] },
  "苹果": { pinyin: "píng guǒ", pos: "n.", en: "apple", examples: [{ zh: "我每天吃一个苹果。", en: "I eat an apple every day." }] },
  "书": { pinyin: "shū", pos: "n.", en: "book", examples: [{ zh: "这本书值得读。", en: "This book is worth reading." }] },
  "跑": { pinyin: "pǎo", pos: "v.", en: "run", examples: [{ zh: "我每天早上跑步。", en: "I run every morning." }] },
  "快": { pinyin: "kuài", pos: "adj. / adv.", en: "fast; quick", examples: [{ zh: "时间过得很快。", en: "Time passes fast." }] },
  "美丽": { pinyin: "měi lì", pos: "adj.", en: "beautiful", examples: [{ zh: "多么美丽的景色。", en: "What a beautiful view." }] },
  "快乐": { pinyin: "kuài lè", pos: "adj. / n.", en: "happy; happiness", examples: [{ zh: "生日快乐！", en: "Happy birthday!" }] },
  "朋友": { pinyin: "péng you", pos: "n.", en: "friend", examples: [{ zh: "她是我最好的朋友。", en: "She is my best friend." }] },
  "水": { pinyin: "shuǐ", pos: "n.", en: "water", examples: [{ zh: "请多喝水。", en: "Please drink plenty of water." }] },
  "火": { pinyin: "huǒ", pos: "n.", en: "fire", examples: [{ zh: "火势蔓延得很快。", en: "The fire spread quickly." }] },
  "光": { pinyin: "guāng", pos: "n. / adj.", en: "light; bright", examples: [{ zh: "请打开灯。", en: "Please turn on the light." }] },
  "时间": { pinyin: "shí jiān", pos: "n.", en: "time", examples: [{ zh: "现在几点了？", en: "What time is it?" }] },
  "工作": { pinyin: "gōng zuò", pos: "n. / v.", en: "work; job", examples: [{ zh: "我九点去上班。", en: "I go to work at nine." }] },
  "学习": { pinyin: "xué xí", pos: "v. / n.", en: "study; learn", examples: [{ zh: "我每天学习英语。", en: "I study English every day." }] },
  "旅行": { pinyin: "lǚ xíng", pos: "v. / n.", en: "travel", examples: [{ zh: "我喜欢出国旅行。", en: "I love to travel abroad." }] },
  "食物": { pinyin: "shí wù", pos: "n.", en: "food", examples: [{ zh: "这里的食物很美味。", en: "The food here is delicious." }] },
  "家": { pinyin: "jiā", pos: "n.", en: "home; family", examples: [{ zh: "我想回家。", en: "I want to go home." }] },
  "城市": { pinyin: "chéng shì", pos: "n.", en: "city", examples: [{ zh: "北京是一座大城市。", en: "Beijing is a big city." }] },
  "语言": { pinyin: "yǔ yán", pos: "n.", en: "language", examples: [{ zh: "英语是一门全球性语言。", en: "English is a global language." }] },
  "意思": { pinyin: "yì si", pos: "n.", en: "meaning", examples: [{ zh: "这个词是什么意思？", en: "What is the meaning of this word?" }] },
  "单词": { pinyin: "dān cí", pos: "n.", en: "word", examples: [{ zh: "我不认识这个单词。", en: "I don't know this word." }] },
  "句子": { pinyin: "jù zi", pos: "n.", en: "sentence", examples: [{ zh: "请翻译这个句子。", en: "Please translate this sentence." }] },
  "短语": { pinyin: "duǎn yǔ", pos: "n.", en: "phrase", examples: [{ zh: "这是一个有用的短语。", en: "This is a useful phrase." }] }
};

const PHRASES = {
  "how are you": { zh: "你好吗？", tip: "英语口语中常用 “How are you?” 作为开场问候，回答时可以说 “I'm fine, thank you.”", alt: "你最近怎么样？" },
  "thank you": { zh: "谢谢你。", tip: "“Thank you” 是最常用的致谢表达；更正式的表达是 “I really appreciate it.”", alt: "多谢你。" },
  "good morning": { zh: "早上好。", tip: "“Good morning” 用于清晨问候，中午后常用 “Good afternoon.”", alt: "早安。" },
  "i love you": { zh: "我爱你。", tip: "口语中 “I love you” 常缩读为 “I love ya”，语气更轻松。", alt: "我喜欢你。" },
  "nice to meet you": { zh: "很高兴认识你。", tip: "初次见面常用；正式场合可说 “It's a pleasure to meet you.”", alt: "见到你很高兴。" },
  "what is your name": { zh: "你叫什么名字？", tip: "询问姓名也可说 “May I have your name?” 更礼貌。", alt: "请问你叫什么？" },
  "where are you from": { zh: "你来自哪里？", tip: "“Where are you from?” 常用于寒暄，回答可说 “I'm from China.”", alt: "你是哪里人？" },
  "你好吗": { en: "How are you?", tip: "“你好吗” 对应英语 “How are you?”，口语也可说 “How's it going?”", alt: "How are you doing?" },
  "谢谢": { en: "Thank you.", tip: "“谢谢” 的英语是 “Thank you.”，更随意的说法是 “Thanks.”", alt: "Thanks a lot." },
  "早上好": { en: "Good morning.", tip: "“早上好” 对应 “Good morning.”，更随意的说法是 “Morning!”", alt: "Morning." },
  "我爱你": { en: "I love you.", tip: "“我爱你” 对应 “I love you.”，强调程度可说 “I adore you.”", alt: "I'm in love with you." },
  "很高兴认识你": { en: "Nice to meet you.", tip: "“很高兴认识你” 对应 “Nice to meet you.”，正式场合可用 “It's a pleasure.”", alt: "Pleased to meet you." },
  "你叫什么名字": { en: "What is your name?", tip: "询问姓名也可说 “What's your name?”", alt: "May I have your name?" },
  "你来自哪里": { en: "Where are you from?", tip: "“你来自哪里” 对应 “Where are you from?”", alt: "Where do you come from?" }
};

const LANG_OPTIONS = {
  auto: { code: "自动", name: "检测语言", sub: "自动识别" },
  en: { code: "EN", name: "英语", sub: "English" },
  zh: { code: "中", name: "中文", sub: "Chinese" }
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function svg(name) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    const name = el.dataset.icon;
    if (ICONS[name]) el.innerHTML = svg(name);
  });
}

function decodeHtml(text) {
  const node = document.createElement("textarea");
  node.innerHTML = text;
  return node.value;
}

const state = {
  sourceLang: "en",
  targetLang: "zh",
  speechRate: 1,
  autoSpeak: false,
  activeTab: "dictionary",
  currentTranslation: "",
  currentSource: "",
  currentSaved: false,
  history: [],
  saved: [],
  ocrFile: null,
  dictActivePos: "all",
  dictEntry: null,
  dictQuery: "",
  currentSrcLang: "en",
  currentTargetLang: "zh",
  user: null,
  accountMode: "login"
};

const TRANSLATE_CACHE = new Map();
const DICT_CACHE = new Map();
const ACCOUNTS_KEY = "yiling_accounts";
const CURRENT_USER_KEY = "yiling_current_user";
const TOKEN_KEY = "yiling_token";
const API_BASE =
  window.YILING_API_BASE ||
  (window.location.protocol.startsWith("http") ? window.location.origin : "http://localhost:8000");
let BACKEND_READY = false;

function storageKeys() {
  const prefix = state.user ? `yiling_user_${state.user.email}` : "yiling";
  return { history: `${prefix}_history`, saved: `${prefix}_saved` };
}

function loadCurrentUser() {
  try {
    state.user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");
  } catch {
    state.user = null;
  }
}

function loadStore() {
  loadCurrentUser();
  const keys = storageKeys();
  try {
    state.history = JSON.parse(localStorage.getItem(keys.history) || "[]");
    state.saved = JSON.parse(localStorage.getItem(keys.saved) || "[]");
  } catch {
    state.history = [];
    state.saved = [];
  }
}

function saveStore() {
  const keys = storageKeys();
  try {
    localStorage.setItem(keys.history, JSON.stringify(state.history));
    localStorage.setItem(keys.saved, JSON.stringify(state.saved));
  } catch {
    /* storage may be unavailable */
  }
}

function detectLang(text) {
  return /[\u4e00-\u9fff]/.test(text) ? "zh" : "en";
}

async function checkBackend() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1500) });
    BACKEND_READY = res.ok;
  } catch {
    BACKEND_READY = false;
  }
}

function backendToEntry(data) {
  const senses = (data.senses || []).map((sense) => ({
    pos: sense.pos || "other",
    label: sense.label || "其他",
    defs: (sense.definitions || []).map((d) => ({ en: d.en || "", zh: d.zh || "", ex: d.ex || "", exZh: "" }))
  }));
  const translations = data.translations || [];
  return {
    word: data.word,
    phoneticUK: data.phonetic_uk || "",
    phoneticUS: data.phonetic_us || "",
    pinyin: data.pinyin || "",
    zh: translations.join("；"),
    shortGloss: translations[0] || "",
    translations,
    senses,
    synonyms: data.synonyms || [],
    antonyms: data.antonyms || [],
    forms: (data.forms || []).join(" · "),
    collocations: [],
    examples: [],
    source: data.source || "后端聚合词库"
  };
}

async function fetchBackendEntry(query) {
  const res = await fetch(`${API_BASE}/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word: query }),
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || !data.senses || !data.senses.length) return null;
  return backendToEntry(data);
}

async function fetchBackendTranslate(text, src, tgt) {
  const res = await fetch(`${API_BASE}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, source_lang: src, target_lang: tgt }),
    signal: AbortSignal.timeout(30000)
  });
  if (!res.ok) throw new Error(`bad status ${res.status}`);
  const data = await res.json();
  const translation = data && data.translation;
  if (!translation) throw new Error("no translation");
  return decodeHtml(translation);
}

// Resolve the English gloss for a Chinese word, most-trustworthy first. Reusing
// the translation already shown for this exact source avoids re-hitting the
// flaky MyMemory API, which can return pinyin fragments and mislead a Chinese
// lookup into searching the wrong English word.
async function translateZhToEn(text) {
  if (state.currentSource === text && state.currentTranslation) {
    return state.currentTranslation;
  }
  if (BACKEND_READY) {
    try {
      const result = await fetchBackendTranslate(text, "zh", "en");
      if (result) return result;
    } catch {
      /* fall through to MyMemory */
    }
  }
  return remoteTranslate(text, "zh", "en");
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove("show"), 2200);
}

function setActiveTab(tab) {
  state.activeTab = tab;
  $$(".tab").forEach((el) => el.classList.toggle("active", el.id === `tab-${tab}`));
  $$(".nav-item").forEach((el) => el.classList.toggle("active", el.dataset.tab === tab));
}

function openSheet(id) {
  $("#scrim").hidden = false;
  $("#" + id).hidden = false;
}

function closeSheets() {
  $("#scrim").hidden = true;
  $("#accountSheet").hidden = true;
  $("#historySheet").hidden = true;
  $("#settingsSheet").hidden = true;
  $("#cameraModal").hidden = true;
  $("#chatSheet").hidden = true;
}

function setHistoryTab(tab) {
  state.activeTab = tab;
  $$("#historyTabs .seg").forEach((seg) => seg.classList.toggle("active", seg.dataset.histTab === tab));
  $("#historyPane").hidden = tab !== "history";
  $("#savedPane").hidden = tab !== "saved";
}

function openHistorySheet() {
  renderHistory();
  renderSaved();
  setHistoryTab("history");
  openSheet("historySheet");
}

function openChatSheet() {
  renderChatMessages();
  updateParseButton();
  openSheet("chatSheet");
  setTimeout(() => $("#chatInput").focus(), 60);
}

function openSettings() {
  $("#rateRange").value = String(state.speechRate);
  $("#rateVal").textContent = state.speechRate.toFixed(1) + "x";
  $("#autoSpeak").checked = state.autoSpeak;
  openSheet("settingsSheet");
}

function setSpeechRate(rate) {
  state.speechRate = rate;
  $("#rateRange").value = String(rate);
  $("#rateVal").textContent = rate.toFixed(1) + "x";
  $$(".rate-option").forEach((btn) => btn.classList.toggle("active", Number(btn.dataset.rate) === rate));
}

function getAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    /* storage may be unavailable */
  }
}

function setAccountMode(mode) {
  state.accountMode = mode;
  $("#loginTab").classList.toggle("active", mode === "login");
  $("#registerTab").classList.toggle("active", mode === "register");
  $("#accountName").closest(".account-field").hidden = mode !== "register";
  $("#accountSubmit").textContent = mode === "login" ? "登录" : "注册";
}

function renderAccountUI() {
  const loggedOut = $("#accountLoggedOut");
  const loggedIn = $("#accountLoggedIn");
  loggedOut.hidden = !!state.user;
  loggedIn.hidden = !state.user;
  if (state.user) {
    const initial = (state.user.name || state.user.email || "译").slice(0, 1).toUpperCase();
    $("#accountAvatar").textContent = initial;
    $("#accountDisplayName").textContent = state.user.name || state.user.email;
    $("#accountDisplayEmail").textContent = state.user.email;
    $("#statHistory").textContent = String(state.history.length);
    $("#statSaved").textContent = String(state.saved.length);
  }
  setAccountMode(state.accountMode);
}

function openAccountSheet() {
  renderAccountUI();
  openSheet("accountSheet");
}

function loginUser(email, password) {
  const accounts = getAccounts();
  const account = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password);
  if (!account) return false;
  state.user = { name: account.name, email: account.email };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(state.user));
  return true;
}

function registerUser(name, email, password) {
  const accounts = getAccounts();
  if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) return "exists";
  const account = { name, email, password };
  accounts.push(account);
  saveAccounts(accounts);
  state.user = { name, email };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(state.user));
  return "ok";
}

// Server-side account endpoints. When the backend is reachable, register/login
// write to the users table (passwords stored as PBKDF2 hashes) instead of the
// localStorage demo store.
function authErrorDetail(data) {
  const detail = data && data.detail;
  if (!detail) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0];
    if (first && typeof first === "object" && first.msg) return first.msg;
    return String(detail[0]);
  }
  return "";
}

async function authRequest(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(authErrorDetail(data) || "请求失败");
    error.status = res.status;
    throw error;
  }
  return data;
}

function storeSession(user, token) {
  state.user = user;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

async function handleAccountSubmit() {
  const email = $("#accountEmail").value.trim();
  const password = $("#accountPassword").value;
  const name = $("#accountName").value.trim();
  if (!email || !password) {
    toast("请输入邮箱和密码");
    return;
  }
  if (state.accountMode === "register" && !name) {
    toast("请输入昵称");
    return;
  }
  if (state.accountMode === "register" && password.length < 6) {
    toast("密码至少 6 位");
    return;
  }

  if (BACKEND_READY) {
    try {
      const data =
        state.accountMode === "register"
          ? await authRequest("/auth/register", { name, email, password })
          : await authRequest("/auth/login", { email, password });
      storeSession(data.user, data.token);
      loadStore();
      renderHistory();
      renderSaved();
      renderAccountUI();
      toast(state.accountMode === "register" ? "注册成功" : "登录成功");
      closeSheets();
      return;
    } catch (error) {
      toast(error.message || (state.accountMode === "register" ? "注册失败" : "登录失败"));
      return;
    }
  }

  // Offline fallback: local accounts in localStorage.
  let ok = false;
  if (state.accountMode === "register") {
    const result = registerUser(name, email, password);
    if (result === "exists") {
      toast("该邮箱已注册");
      return;
    }
    ok = true;
  } else {
    ok = loginUser(email, password);
    if (!ok) {
      toast("邮箱或密码不正确");
      return;
    }
  }

  loadStore();
  renderHistory();
  renderSaved();
  renderAccountUI();
  toast(state.accountMode === "register" ? "注册成功" : "登录成功");
  closeSheets();
}

function logoutUser() {
  state.user = null;
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  loadStore();
  renderHistory();
  renderSaved();
  renderAccountUI();
  toast("已退出登录");
}

function openCamera() {
  state.ocrFile = null;
  $("#cameraPreview").innerHTML = `<span class="preview-ic" data-icon="camera"></span><p>选择照片，识别其中的中英文文字</p>`;
  $("#ocrStatus").textContent = "";
  $("#ocrStatus").classList.remove("error");
  hydrateIcons($("#cameraPreview"));
  openSheet("cameraModal");
}

function openFilePicker(capture) {
  const input = $("#imageInput");
  input.removeAttribute("capture");
  if (capture) input.setAttribute("capture", "environment");
  input.value = "";
  input.click();
}

function showResult(mainHtml, altHtml, multiHtml) {
  const el = $("#resultContent");
  let html = `<p class="translated-main">${mainHtml}</p>`;
  if (multiHtml) {
    html += multiHtml;
  } else if (altHtml) {
    html += `<p class="translated-alt">${altHtml}</p>`;
  }
  el.innerHTML = html;
  $("#resultActions").hidden = false;
}

function clearResult() {
  $("#resultContent").innerHTML = `<p class="result-placeholder">译文将显示在这里</p>`;
  $("#resultActions").hidden = true;
  $("#dictPanel").hidden = true;
  state.currentTranslation = "";
  state.currentSource = "";
  state.currentSaved = false;
  updateSaveButton();
}

function setLoading() {
  $("#resultContent").innerHTML = `<p class="result-placeholder">正在翻译<span class="loading-dots"></span></p>`;
  $("#resultActions").hidden = true;
  $("#dictPanel").hidden = true;
}

function normalizeWord(word) {
  return word.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

function shouldAutoDict(text, src) {
  if (src === "zh") return Boolean(ZH_LEXICON[text]);
  return /^[a-zA-Z][a-zA-Z-]*$/.test(text) && text.length <= 48;
}

function remoteTranslate(text, src, tgt) {
  const from = src === "zh" ? "zh-CN" : "en";
  const to = tgt === "zh" ? "zh-CN" : "en";
  // MyMemory caps a request at 500 chars and replies with an error string
  // instead of a translation, so long text is split into line-aware chunks.
  const chunks = splitForTranslation(text);
  const requests = chunks.map((chunk) =>
    fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${from}|${to}`,
      { signal: AbortSignal.timeout(8000) }
    )
      .then((res) => {
        if (!res.ok) throw new Error("bad status");
        return res.json();
      })
      .then((data) => {
        const translated = data && data.responseData && data.responseData.translatedText;
        if (!translated || /MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID SOURCE|NO QUERY/i.test(translated)) {
          throw new Error("no result");
        }
        return decodeHtml(translated);
      })
  );
  // A failed chunk is dropped instead of failing the whole document, so a
  // partial translation is still returned.
  return Promise.allSettled(requests).then((results) => {
    const parts = results
      .filter((item) => item.status === "fulfilled" && item.value)
      .map((item) => item.value);
    const joined = parts.join("\n").trim();
    if (!joined) throw new Error("no result");
    return joined;
  });
}

function splitForTranslation(text, max = 450) {
  const trimmed = String(text || "").trim();
  if (trimmed.length <= max) return [trimmed];

  const chunks = [];
  for (const line of trimmed.split("\n")) {
    let rest = line.trim();
    if (!rest) continue;
    while (rest.length > max) {
      let cut = rest.slice(0, max);
      const breakAt = Math.max(
        cut.lastIndexOf(". "),
        cut.lastIndexOf("。"),
        cut.lastIndexOf("；"),
        cut.lastIndexOf("; "),
        cut.lastIndexOf("! "),
        cut.lastIndexOf("? ")
      );
      if (breakAt > max * 0.5) cut = rest.slice(0, breakAt + 1);
      chunks.push(cut.trim());
      rest = rest.slice(cut.length).trim();
    }
    if (rest) chunks.push(rest);
  }
  return chunks.filter(Boolean);
}

function localTranslate(text, src, tgt) {
  const clean = text.trim();
  const key = clean.toLowerCase();
  if (PHRASES[key]) {
    return src === "en" ? PHRASES[key].zh : PHRASES[key].en;
  }

  if (src === "en" && tgt === "zh") {
    const single = LEXICON[normalizeWord(clean)];
    if (single) return single.zh.split("；")[0];
    return "";
  }

  if (src === "zh" && tgt === "en") {
    const single = ZH_LEXICON[clean];
    if (single) return single.en.split(";")[0].trim();
    return "";
  }

  return clean;
}

// Curated 中文 -> 英文 一词多译 groups. Each English headword is followed by
// its Chinese glosses, so 查词 shows "promote 促进，提倡；升职，晋升…" style
// lines instead of a flat word list. Words absent here fall back to the
// auto-derived groups below.
const ZH_MULTI = {
  "促进": [
    { en: "promote", zh: "促进，提倡；升职，晋升；促销，推广；将（运动）" },
    { en: "accelerate", zh: "（使）加快，促进；（车辆或驾驶者）加速" },
    { en: "facilitate", zh: "使更容易，使便利；促进，推动" }
  ]
};

// Grouped 中文 -> 英文 translations, each as { en, zh }. The curated ZH_MULTI
// table wins; otherwise a Chinese lexicon entry's English glosses become the
// headwords, and each headword's Chinese meaning is pulled from the English
// lexicon when available (otherwise the source word itself).
function zhAlternativeGroups(text) {
  const clean = text.trim();
  if (ZH_MULTI[clean]) return ZH_MULTI[clean];
  const entry = ZH_LEXICON[clean];
  if (!entry || !entry.en) return null;
  const words = entry.en.split(/[;；]/).map((s) => s.trim()).filter(Boolean);
  if (words.length < 2) return null;
  return words.map((w) => {
    const key = normalizeWord(w);
    const gloss = LEXICON[key] ? LEXICON[key].zh : clean;
    return { en: w, zh: gloss };
  });
}

// Flat list of Chinese glosses for an English word's 一词多译 block.
function enAlternativeTranslations(text) {
  const entry = LEXICON[normalizeWord(text.trim())];
  if (!entry || !entry.zh) return null;
  const list = entry.zh.split(/[；;]/).map((s) => s.trim()).filter(Boolean);
  return list.length > 1 ? list : null;
}

function multiItemsHtml(groups) {
  return groups
    .map(
      (g) =>
        `<div class="multi-item"><span class="multi-en">${escapeHtml(g.en)}</span><span class="multi-zh">${escapeHtml(g.zh)}</span></div>`
    )
    .join("");
}

function groupedMultiHtml(groups) {
  if (!groups || !groups.length) return "";
  return `<div class="result-multi"><div class="result-multi-title">一词多译</div><div class="multi-list">${multiItemsHtml(groups)}</div></div>`;
}

function flatMultiHtml(items) {
  if (!items || items.length < 2) return "";
  const list = items
    .map(
      (text, index) =>
        `<div class="trans-item"><span class="trans-num">${index + 1}</span><span class="trans-text">${escapeHtml(text)}</span></div>`
    )
    .join("");
  return `<div class="result-multi"><div class="result-multi-title">一词多译</div><div class="trans-list">${list}</div></div>`;
}

function buildTokens(text, src, tgt) {
  if (src === "en") {
    return text
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => {
        const entry = LEXICON[normalizeWord(word)];
        return { src: word, tgt: entry ? entry.zh.split("；")[0] : "" };
      });
  }
  const chunks = [];
  let rest = text;
  while (rest) {
    let matched = false;
    for (let len = Math.min(rest.length, 4); len > 0; len--) {
      const part = rest.slice(0, len);
      if (ZH_LEXICON[part]) {
        chunks.push({ src: part, tgt: ZH_LEXICON[part].en.split(";")[0].trim() });
        rest = rest.slice(len);
        matched = true;
        break;
      }
    }
    if (!matched) {
      chunks.push({ src: rest[0], tgt: "" });
      rest = rest.slice(1);
    }
  }
  return chunks;
}

function findTip(text, src) {
  if (PHRASES[text.toLowerCase()] && src === "en") return PHRASES[text.toLowerCase()].tip;
  if (PHRASES[text] && src === "zh") return PHRASES[text].tip;
  if (src === "en") {
    const word = normalizeWord(text.trim());
    if (LEXICON[word]) return `“${text.trim()}” 常见搭配包括：${LEXICON[word].collocations.slice(0, 3).join("、")}。`;
  }
  if (src === "zh" && ZH_LEXICON[text.trim()]) {
    return `“${text.trim()}” 的拼音是 ${ZH_LEXICON[text.trim()].pinyin}，对应英语 ${ZH_LEXICON[text.trim()].en}。`;
  }
  return "演示模式采用本地语料生成解析；接入 DeepSeek 后可持续补充语境与地道表达。";
}

async function fetchChat(messages, timeout) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal: AbortSignal.timeout(timeout || 30000)
  });
  if (!res.ok) throw new Error(`bad status ${res.status}`);
  const data = await res.json();
  return data && data.reply ? String(data.reply).trim() : "";
}

function buildInsightPrompt(text, src, tgt, translated) {
  const from = src === "zh" ? "中文" : "英语";
  const to = tgt === "zh" ? "中文" : "英语";
  return [
    `请分析这段${from}文本，并把它翻译成${to}。`,
    `原文：${text}`,
    translated ? `参考译文：${translated}` : "",
    "请分三部分输出，每部分 2-3 句，使用简体中文：",
    "1. 逐词解析：关键词语的词性、含义与常见搭配；",
    "2. 地道表达：更自然的说法或语气差异；",
    "3. 替代译法：1-2 个可选译文。"
  ]
    .filter(Boolean)
    .join("\n");
}

// Plain-text version of the local parse, shown in the AI 对话 sheet when the
// user manually asks to parse the current translation while the backend is
// offline. The online path sends the fuller prompt below to DeepSeek instead.
function localInsightText(text, src, tgt) {
  const tokens = buildTokens(text, src, tgt);
  const known = tokens.filter((t) => t.tgt);
  const lines = [];
  lines.push(
    known.length
      ? "逐词解析：" + tokens.map((t) => (t.tgt ? `${t.src}（${t.tgt}）` : t.src)).join("、")
      : `逐词解析：语料未覆盖“${text}”`
  );
  lines.push("地道表达：" + findTip(text, src));

  let alternative = "";
  if (src === "en" && PHRASES[text.toLowerCase()]) alternative = PHRASES[text.toLowerCase()].alt;
  else if (src === "zh" && PHRASES[text]) alternative = PHRASES[text].alt;
  else if (src === "en" && LEXICON[normalizeWord(text.trim())]) {
    alternative = LEXICON[normalizeWord(text.trim())].synonyms.slice(0, 3).join("、");
  }
  if (alternative) lines.push("替代译法：" + alternative);
  return lines.join("\n");
}

async function doTranslate(text) {
  if (!text.trim()) {
    clearResult();
    return;
  }
  const src = detectLang(text);
  const tgt = src === "zh" ? "en" : "zh";
  const safeText = text.trim();
  const cacheKey = `${src}|${tgt}|${safeText}`;
  setLoading();
  state.currentSource = safeText;
  state.currentSrcLang = src;
  state.currentTargetLang = tgt;

  let translated = "";
  let usedLocal = false;
  let multiHtml = "";

  // 中文 -> 英文 with known equivalents resolves locally (no network), which
  // both speeds it up and keeps the grouped 一词多译 list authoritative.
  const zhGroups = src === "zh" && tgt === "en" ? zhAlternativeGroups(safeText) : null;
  if (zhGroups) {
    translated = zhGroups[0].en;
    usedLocal = true;
    multiHtml = groupedMultiHtml(zhGroups);
  } else if (TRANSLATE_CACHE.has(cacheKey)) {
    translated = TRANSLATE_CACHE.get(cacheKey);
    usedLocal = true;
  } else {
    translated = localTranslate(safeText, src, tgt);
    usedLocal = !!translated;
    if (!translated) {
      // DeepSeek first when the backend is up: it handles long documents and
      // has no 500-char cap. MyMemory is the offline fallback.
      if (BACKEND_READY) {
        try {
          translated = await fetchBackendTranslate(safeText, src, tgt);
          usedLocal = false;
        } catch {
          translated = "";
        }
      }
      if (!translated) {
        try {
          translated = await remoteTranslate(safeText, src, tgt);
          usedLocal = false;
        } catch {
          translated = "";
        }
      }
    }
    if (translated) {
      TRANSLATE_CACHE.set(cacheKey, translated);
      if (TRANSLATE_CACHE.size > 200) {
        TRANSLATE_CACHE.delete(TRANSLATE_CACHE.keys().next().value);
      }
    }
  }

  if (src === "en" && tgt === "zh") {
    multiHtml = flatMultiHtml(enAlternativeTranslations(safeText));
  }

  if (!translated) {
    $("#resultContent").innerHTML = `<p class="result-placeholder">当前为离线演示模式，尚未覆盖该内容。联网后可使用完整 AI 翻译。</p>`;
    $("#resultActions").hidden = true;
    $("#dictPanel").hidden = true;
    state.currentTranslation = "";
    return;
  }

  showResult(escapeHtml(translated), usedLocal ? "本地 / 离线译文" : "", multiHtml);
  state.currentTranslation = translated;
  state.currentSaved = isSaved(safeText, translated);
  updateSaveButton();
  pushHistory(safeText, translated, src, tgt);

  if (state.autoSpeak) speak(translated, tgt);

  if (shouldAutoDict(safeText, src)) {
    lookupDictionary(safeText, { auto: true });
  } else {
    $("#dictPanel").hidden = true;
  }
}

let translateTimer = null;
function scheduleTranslate() {
  const text = $("#sourceInput").value;
  $("#charCount").textContent = `${text.length} / 5000`;
  clearTimeout(translateTimer);
  translateTimer = setTimeout(() => doTranslate(text), 420);
}

function updateSaveButton() {
  const btn = $("#saveBtn");
  btn.classList.toggle("active", state.currentSaved);
  btn.style.color = state.currentSaved ? "var(--amber)" : "";
  btn.setAttribute("aria-label", state.currentSaved ? "取消收藏" : "收藏");
}

function isSaved(src, tgt) {
  return state.saved.some((item) => item.source === src && item.target === tgt);
}

function pushHistory(source, target, srcLang, tgtLang) {
  const item = {
    id: Date.now(),
    source,
    target,
    srcLang,
    tgtLang,
    time: Date.now()
  };
  state.history = [item, ...state.history.filter((i) => !(i.source === source && i.target === target))].slice(0, 50);
  saveStore();
  renderHistory();
}

function toggleSave() {
  if (!state.currentTranslation || !state.currentSource) {
    toast("请先翻译内容");
    return;
  }
  const src = state.currentSource;
  const tgt = state.currentTranslation;
  const index = state.saved.findIndex((item) => item.source === src && item.target === tgt);
  if (index >= 0) {
    state.saved.splice(index, 1);
    state.currentSaved = false;
    toast("已取消收藏");
  } else {
    state.saved.unshift({ id: Date.now(), source: src, target: tgt, time: Date.now() });
    state.currentSaved = true;
    toast("已加入收藏");
  }
  saveStore();
  updateSaveButton();
  renderSaved();
}

function historyItemHtml(item) {
  const srcName = LANG_OPTIONS[item.srcLang] ? LANG_OPTIONS[item.srcLang].name : "自动";
  const tgtName = LANG_OPTIONS[item.tgtLang] ? LANG_OPTIONS[item.tgtLang].name : "中文";
  const saved = isSaved(item.source, item.target);
  return `<div class="history-item" data-id="${item.id}">
    <div class="history-main">
      <p class="history-src">${escapeHtml(item.source)}</p>
      <p class="history-tgt">${escapeHtml(item.target)}</p>
    </div>
    <div class="history-meta">
      <span class="history-langs">${srcName} → ${tgtName} · ${formatTime(item.time)}</span>
      <span class="history-actions">
        <button class="mini-btn save-history ${saved ? "active" : ""}" data-save="${item.id}" aria-label="收藏">${svg("star")}</button>
        <button class="mini-btn del-history" data-del="${item.id}" aria-label="删除">${svg("trash")}</button>
      </span>
    </div>
  </div>`;
}

function savedItemHtml(item) {
  return `<div class="history-item" data-id="${item.id}">
    <div class="history-main">
      <p class="history-src">${escapeHtml(item.source)}</p>
      <p class="history-tgt">${escapeHtml(item.target)}</p>
    </div>
    <div class="history-meta">
      <span class="history-langs">收藏于 ${formatTime(item.time)}</span>
      <span class="history-actions">
        <button class="mini-btn del-saved" data-del="${item.id}" aria-label="删除">${svg("trash")}</button>
      </span>
    </div>
  </div>`;
}

function formatTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderHistory() {
  const list = $("#historyList");
  const empty = $("#historyEmpty");
  list.innerHTML = state.history.map(historyItemHtml).join("");
  empty.hidden = state.history.length > 0;
  list.hidden = state.history.length === 0;
}

function renderSaved() {
  const list = $("#savedList");
  const empty = $("#savedEmpty");
  list.innerHTML = state.saved.map(savedItemHtml).join("");
  empty.hidden = state.saved.length > 0;
  list.hidden = state.saved.length === 0;
}

function loadHistoryItem(item) {
  $("#sourceInput").value = item.source;
  $("#charCount").textContent = `${item.source.length} / 5000`;
  closeSheets();
  doTranslate(item.source);
}

function loadSavedItem(item) {
  loadHistoryItem(item);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("已复制到剪贴板");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    toast("已复制到剪贴板");
  }
}

function speak(text, lang) {
  if (!("speechSynthesis" in window)) {
    toast("当前浏览器不支持语音朗读");
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === "zh" ? "zh-CN" : "en-US";
  utter.rate = state.speechRate;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang.toLowerCase().startsWith(utter.lang.split("-")[0]));
  if (voice) utter.voice = voice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function speechErrorMessage(code) {
  const map = {
    "no-speech": "没有听到声音，请靠近麦克风重试",
    "not-allowed": "麦克风权限被拒绝：请在浏览器地址栏允许麦克风，或通过 localhost 打开本页",
    NotAllowedError: "麦克风权限被拒绝：请在浏览器地址栏允许麦克风，或通过 localhost 打开本页",
    "service-not-allowed": "当前环境不允许语音识别，请改用 Chrome 或 Edge 浏览器",
    network: "无法连接语音识别服务器：Chrome 依赖 Google 服务，若无法访问请改用 Edge 浏览器",
    aborted: "语音识别已取消",
    "audio-capture": "未检测到可用麦克风",
    "language-not-supported": "当前语言暂不支持语音识别"
  };
  return map[code] || (code ? `语音识别失败：${code}` : "语音识别失败，请重试");
}

function startListening(lang) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    toast("当前浏览器不支持语音输入，请使用 Chrome 或 Edge");
    return;
  }
  const rec = new SR();
  rec.lang = lang === "zh" ? "zh-CN" : "en-US";
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.continuous = false;
  rec.onstart = () => toast("正在聆听，请说话…");
  rec.onresult = (event) => {
    const text = event.results[0][0].transcript;
    $("#sourceInput").value = text;
    $("#charCount").textContent = `${text.length} / 5000`;
    scheduleTranslate();
  };
  rec.onerror = (event) => toast(speechErrorMessage(event && event.error));
  rec.onend = () => {};
  try {
    rec.start();
  } catch (error) {
    toast(speechErrorMessage(error && error.name));
  }
}

const TESSERACT_CDNS = [
  "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js",
  "https://unpkg.com/tesseract.js@5/dist/tesseract.min.js"
];
// tesseract.js downloads language data from tessdata.projectnaptha.com by
// default, which is frequently unreachable; the jsdelivr mirror is more
// reliable and hosts both English and Simplified Chinese packs.
const TESSDATA_LANG_PATH = "https://cdn.jsdelivr.net/gh/naptha/tessdata@gh-pages/4.0.0";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("加载失败：" + src));
    document.head.appendChild(script);
  });
}

async function loadTesseract() {
  if (window.Tesseract) return window.Tesseract;
  let lastError = null;
  for (const url of TESSERACT_CDNS) {
    try {
      await loadScript(url);
      if (window.Tesseract) return window.Tesseract;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("OCR 引擎加载失败");
}

async function runOcr(file) {
  const status = $("#ocrStatus");
  status.classList.remove("error");
  status.textContent = "正在加载识别引擎，请稍候…";
  try {
    const Tesseract = await loadTesseract();
    status.textContent = "引擎就绪，正在识别中英文文字…";
    const { data } = await Tesseract.recognize(file, "chi_sim+eng", {
      langPath: TESSDATA_LANG_PATH,
      logger: (m) => {
        if (m.status === "recognizing text") {
          status.textContent = `识别中 ${Math.round(m.progress * 100)}%`;
        }
      }
    });
    const text = (data.text || "").trim();
    if (!text) {
      status.classList.add("error");
      status.textContent = "未识别到文字，请换一张更清晰的图片";
      return;
    }
    status.textContent = "识别完成";
    closeSheets();
    $("#sourceInput").value = text;
    $("#charCount").textContent = `${text.length} / 5000`;
    setActiveTab("translate");
    doTranslate(text);
  } catch {
    status.classList.add("error");
    status.textContent = "OCR 识别失败：请检查网络后重试（首次识别需下载语言数据）";
  }
}

// Canonical part-of-speech model, mirroring backend/app/pos.py. WordNet sends
// n/v/a/s/r, Wiktionary sends "Noun"/"Preposition", Datamuse sends
// n/v/adj/adv/prop and dictionaryapi.dev sends lowercase names. Everything is
// normalized before display, otherwise every capitalized value collapses into
// "其他" and the part-of-speech tabs look incomplete.
const POS_ORDER = [
  "noun", "proper noun", "pronoun", "verb", "auxiliary verb", "adjective",
  "adverb", "numeral", "determiner", "article", "preposition", "postposition",
  "conjunction", "particle", "interjection", "phrase", "idiom", "abbreviation",
  "contraction", "prefix", "suffix", "symbol", "letter", "other"
];

const POS_LABELS = {
  noun: { short: "n.", label: "名词" },
  "proper noun": { short: "prop.", label: "专有名词" },
  pronoun: { short: "pron.", label: "代词" },
  verb: { short: "v.", label: "动词" },
  "auxiliary verb": { short: "aux.", label: "助动词" },
  adjective: { short: "adj.", label: "形容词" },
  adverb: { short: "adv.", label: "副词" },
  numeral: { short: "num.", label: "数词" },
  determiner: { short: "det.", label: "限定词" },
  article: { short: "art.", label: "冠词" },
  preposition: { short: "prep.", label: "介词" },
  postposition: { short: "postp.", label: "后置词" },
  conjunction: { short: "conj.", label: "连词" },
  particle: { short: "part.", label: "助词" },
  interjection: { short: "int.", label: "感叹词" },
  phrase: { short: "phr.", label: "短语" },
  idiom: { short: "idiom", label: "习语" },
  abbreviation: { short: "abbr.", label: "缩写" },
  contraction: { short: "contr.", label: "缩合形式" },
  prefix: { short: "pref.", label: "前缀" },
  suffix: { short: "suf.", label: "后缀" },
  symbol: { short: "sym.", label: "符号" },
  letter: { short: "letter", label: "字母" },
  other: { short: "", label: "其他" }
};

const POS_ALIASES = {
  n: "noun", "n.": "noun", noun: "noun", "common noun": "noun", "count noun": "noun", "mass noun": "noun", "名词": "noun",
  prop: "proper noun", "prop.": "proper noun", "proper noun": "proper noun", "proper-noun": "proper noun", "proper name": "proper noun", name: "proper noun", "专有名词": "proper noun",
  pron: "pronoun", "pron.": "pronoun", pronoun: "pronoun", "personal pronoun": "pronoun", "relative pronoun": "pronoun", "代词": "pronoun",
  v: "verb", "v.": "verb", verb: "verb", "intransitive verb": "verb", "transitive verb": "verb", "动词": "verb",
  aux: "auxiliary verb", "aux.": "auxiliary verb", auxiliary: "auxiliary verb", modal: "auxiliary verb", "modal verb": "auxiliary verb", "助动词": "auxiliary verb",
  a: "adjective", "a.": "adjective", s: "adjective", adj: "adjective", "adj.": "adjective", adjective: "adjective", adjectival: "adjective", "形容词": "adjective",
  r: "adverb", adv: "adverb", "adv.": "adverb", adverb: "adverb", adverbial: "adverb", "副词": "adverb",
  num: "numeral", "num.": "numeral", numeral: "numeral", number: "numeral", "cardinal number": "numeral", "ordinal number": "numeral", "数词": "numeral",
  det: "determiner", "det.": "determiner", determiner: "determiner", determinative: "determiner", quantifier: "determiner", "限定词": "determiner",
  art: "article", "art.": "article", article: "article", "definite article": "article", "indefinite article": "article", "冠词": "article",
  prep: "preposition", "prep.": "preposition", preposition: "preposition", prepositional: "preposition", adposition: "preposition", "介词": "preposition",
  postp: "postposition", "postp.": "postposition", postposition: "postposition", "后置词": "postposition",
  conj: "conjunction", "conj.": "conjunction", conjunction: "conjunction", "连词": "conjunction",
  part: "particle", "part.": "particle", particle: "particle", "助词": "particle",
  int: "interjection", "int.": "interjection", interj: "interjection", "interj.": "interjection", interjection: "interjection", exclamation: "interjection", "感叹词": "interjection",
  phr: "phrase", "phr.": "phrase", phrase: "phrase", phrasal: "phrase", "noun phrase": "phrase", "verb phrase": "phrase", expression: "phrase", proverb: "phrase", "短语": "phrase",
  idiom: "idiom", "习语": "idiom",
  abbr: "abbreviation", "abbr.": "abbreviation", abbreviation: "abbreviation", initialism: "abbreviation", acronym: "abbreviation", "缩写": "abbreviation",
  contraction: "contraction", "contraction form": "contraction", "缩合形式": "contraction",
  pref: "prefix", "pref.": "prefix", prefix: "prefix", "前缀": "prefix",
  suf: "suffix", "suf.": "suffix", suffix: "suffix", "后缀": "suffix",
  sym: "symbol", "sym.": "symbol", symbol: "symbol", sign: "symbol", "符号": "symbol",
  letter: "letter", character: "letter", "字母": "letter",
  u: "other", other: "other", unknown: "other", undefined: "other",
  // Kept in step with backend/app/pos.py; a cross-language parity check fails
  // whenever the two alias tables drift apart.
  "": "other",
  "auxiliary verb": "auxiliary verb",
  demonstrative: "pronoun",
  "helping verb": "auxiliary verb",
  postpositional: "preposition",
  propername: "proper noun"
};

function normalizePos(raw) {
  const cleaned = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[\/\\,，;；、·|]/g, " ")
    .replace(/[()_\-]/g, " ")
    .replace(/\s+/g, " ");
  if (!cleaned) return "other";
  if (POS_ALIASES[cleaned]) return POS_ALIASES[cleaned];
  if (POS_ALIASES[cleaned + "."]) return POS_ALIASES[cleaned + "."];
  for (const word of cleaned.split(" ")) {
    const target = POS_ALIASES[word];
    if (target && target !== "other") return target;
  }
  return "other";
}

function posInfo(pos) {
  return POS_LABELS[normalizePos(pos)] || POS_LABELS.other;
}

function posRank(pos) {
  const index = POS_ORDER.indexOf(normalizePos(pos));
  return index < 0 ? POS_ORDER.length : index;
}

function splitPosString(raw) {
  const parts = String(raw || "").replace(/[\/\\,，;；、·|]/g, " ").split(/\s+/).filter(Boolean);
  const found = [];
  for (const part of parts) {
    const name = normalizePos(part);
    if (!found.includes(name)) found.push(name);
  }
  const meaningful = found.filter((name) => name !== "other");
  if (meaningful.length) return meaningful;
  return found.length ? found : ["other"];
}

function parseLocalPos(posString) {
  return splitPosString(posString);
}

function normalizeSenses(entry) {
  if (entry.senses && entry.senses.length) {
    return entry.senses.map((sense) => ({
      pos: sense.pos || "other",
      label: posInfo(sense.pos || "other").label,
      defs: (sense.defs || []).map((d) => ({
        en: d.en || "",
        zh: d.zh || "",
        ex: d.ex || "",
        exZh: d.exZh || ""
      }))
    }));
  }

  const definitions = entry.definitions || [];
  if (definitions.length) {
    const groups = {};
    definitions.forEach((d) => {
      const pos = d.pos || entry.pos || "other";
      groups[pos] = groups[pos] || [];
      groups[pos].push({ en: d.meaning || d.en || "", zh: d.zh || "", ex: d.example || "", exZh: "" });
    });
    return Object.entries(groups).map(([pos, defs]) => ({ pos, label: posInfo(pos).label, defs }));
  }

  const pos = entry.pos || "other";
  return [{ pos, label: posInfo(pos).label, defs: [{ en: entry.en || "", zh: entry.zh || "", ex: "", exZh: "" }] }];
}

function phoneticLine(entry, query) {
  const uk = entry.phoneticUK || entry.phonetic || "";
  const us = entry.phoneticUS || "";
  const chunks = [];
  if (uk) chunks.push(`<span class="phonetic-tag">英</span><span class="phonetic">${escapeHtml(uk)}</span>`);
  if (us && us !== uk) chunks.push(`<span class="phonetic-tag">美</span><span class="phonetic">${escapeHtml(us)}</span>`);
  if (!chunks.length) return "";
  return `<div class="phonetic-line">${chunks.join("")}<button class="mini-btn speak-word" data-text="${escapeHtml(query)}" aria-label="朗读">${svg("volume-2")}</button></div>`;
}

function senseBlock(sense, lang) {
  const info = posInfo(sense.pos);
  const defs = sense.defs
    .map((d, index) => {
      const example = d.ex
        ? `<p class="def-ex">${escapeHtml(d.ex)}${d.exZh ? ` <span>${escapeHtml(d.exZh)}</span>` : ""}<button class="mini-btn speak-example" data-text="${escapeHtml(d.ex)}" aria-label="朗读">${svg("volume-2")}</button></p>`
        : "";
      // Chinese-first for English words, English-first for Chinese words.
      const en = d.en || "";
      const zh = d.zh || "";
      let primary, secondary;
      if (lang === "en") {
        primary = zh || en;
        secondary = zh ? en : "";
      } else {
        primary = en || zh;
        secondary = en ? zh : "";
      }
      const primaryHtml = primary ? `<p class="def-primary">${escapeHtml(primary)}</p>` : "";
      const secondaryHtml = secondary ? `<p class="def-secondary">${escapeHtml(secondary)}</p>` : "";
      return `<li class="def-item">
        <div class="def-main"><span class="def-num">${index + 1}.</span><div class="def-text">${primaryHtml}${secondaryHtml}</div></div>
        ${example}
      </li>`;
    })
    .join("");
  return `<section class="sense" data-pos="${escapeHtml(sense.pos)}">
    <div class="sense-head"><span class="sense-pos">${info.short}</span><span class="sense-label">${info.label}</span></div>
    <ol class="def-list">${defs}</ol>
  </section>`;
}

function relChips(items) {
  return items.map((s) => `<button class="rel-chip" data-word="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join("");
}

function buildRelations(entry) {
  const groups = [];
  if (entry.synonyms && entry.synonyms.length) groups.push(`<div class="rel-group"><h3>同近义词</h3><div class="rel-chips">${relChips(entry.synonyms)}</div></div>`);
  if (entry.antonyms && entry.antonyms.length) groups.push(`<div class="rel-group"><h3>反义词</h3><div class="rel-chips">${relChips(entry.antonyms)}</div></div>`);
  if (entry.collocations && entry.collocations.length) groups.push(`<div class="rel-group"><h3>常见搭配</h3><div class="rel-chips">${relChips(entry.collocations)}</div></div>`);
  if (entry.forms) groups.push(`<div class="rel-group"><h3>词形变化</h3><div class="rel-text">${escapeHtml(entry.forms)}</div></div>`);
  if (entry.derived && entry.derived.length) groups.push(`<div class="rel-group"><h3>派生词</h3><div class="rel-chips">${relChips(entry.derived)}</div></div>`);
  if (!groups.length) return "";
  return `<div class="dict-block"><h3>更多信息</h3>${groups.join("")}</div>`;
}

function buildExamples(entry) {
  if (!entry.examples || !entry.examples.length) return "";
  const examples = entry.examples
    .map((e) => {
      const en = typeof e === "string" ? e : e.en || "";
      const zh = typeof e === "string" ? "" : e.zh || "";
      return `<div class="dict-example"><p class="en">${escapeHtml(en)}</p>${zh ? `<p class="zh">${escapeHtml(zh)}</p>` : ""}<button class="mini-btn speak-example" data-text="${escapeHtml(en)}" aria-label="朗读">${svg("volume-2")}</button></div>`;
    })
    .join("");
  return `<div class="dict-block"><h3>双语例句</h3>${examples}</div>`;
}

function buildTranslations(items) {
  if (!items || items.length < 2) return "";
  const list = items
    .map((text, index) => `<div class="trans-item"><span class="trans-num">${index + 1}</span><span class="trans-text">${escapeHtml(text)}</span></div>`)
    .join("");
  return `<div class="dict-trans"><h3>一词多译</h3><div class="trans-list">${list}</div></div>`;
}

function sourceLine(entry) {
  const source = entry.source || "内置词库";
  return `<div class="source-badge">数据来源：${escapeHtml(source)}</div>`;
}

function renderDictionaryEntry(entry, query) {
  const container = $("#dictResult");
  const senses = normalizeSenses(entry);
  const lang = detectLang(query);
  const posList = [...new Set(senses.map((s) => s.pos))];
  state.dictActivePos = "all";
  state.dictEntry = entry;
  state.dictQuery = query;
  DICT_CACHE.set(`${lang}|${String(query).toLowerCase()}`, entry);
  if (DICT_CACHE.size > 200) DICT_CACHE.delete(DICT_CACHE.keys().next().value);
  $("#dictPanel").hidden = false;

  const tabs = [`<button class="pos-tab active" data-pos="all">全部</button>`]
    .concat(posList.map((p) => `<button class="pos-tab" data-pos="${escapeHtml(p)}">${posInfo(p).label}</button>`))
    .join("");

  const gloss = entry.shortGloss || entry.zh || "";
  const saved = isSaved(query, gloss);
  const pinyin = entry.pinyin ? `<p class="dict-pinyin">拼音：${escapeHtml(entry.pinyin)}</p>` : "";
  const translations = entry.translations || [];
  const zhGroups = lang === "zh" ? zhAlternativeGroups(query) : null;
  const hasMulti = (zhGroups && zhGroups.length) || translations.length >= 2;
  const zhLine = hasMulti ? "" : entry.zh ? `<p class="dict-zh">${escapeHtml(entry.zh)}</p>` : "";
  const transHtml = zhGroups
    ? `<div class="dict-trans"><h3>一词多译</h3><div class="multi-list">${multiItemsHtml(zhGroups)}</div></div>`
    : buildTranslations(translations);

  container.innerHTML = `<article class="dict-card">
    <div class="dict-top">
      <div class="dict-word-row">
        <h2>${escapeHtml(entry.word || query)}</h2>
        <button class="mini-btn save-word ${saved ? "active" : ""}" data-save-word="${escapeHtml(query)}" data-gloss="${escapeHtml(gloss)}" aria-label="收藏">${svg("star")}</button>
      </div>
      ${phoneticLine(entry, entry.word || query)}
      ${zhLine}
      ${transHtml}
      ${pinyin}
    </div>
    <div class="pos-tabs">${tabs}</div>
    <div class="sense-list">${senses.map((sense) => senseBlock(sense, lang)).join("")}</div>
    ${buildExamples(entry)}
    ${buildRelations(entry)}
    ${sourceLine(entry)}
  </article>`;
  hydrateIcons(container);
}

function localToDict(local, word) {
  return {
    word,
    phonetic: local.phonetic || "",
    phoneticUK: local.phonetic || "",
    phoneticUS: "",
    zh: local.zh,
    shortGloss: (local.zh || "").split("；")[0],
    translations: (local.zh || "").split(/[；;]/).map((s) => s.trim()).filter(Boolean),
    senses: parseLocalPos(local.pos).map((pos) => ({ pos, label: posInfo(pos).label, defs: [{ en: local.en, zh: local.zh }] })),
    synonyms: local.synonyms || [],
    antonyms: [],
    collocations: local.collocations || [],
    forms: local.forms || "",
    examples: local.examples || [],
    source: "内置词库"
  };
}

function emptyDictResult(message, query) {
  const container = $("#dictResult");
  container.innerHTML = `<div class="empty-state"><span class="empty-ic" data-icon="book"></span><p>${message}</p></div>`;
  hydrateIcons(container);
  if (query) DICT_CACHE.set(`${detectLang(query)}|${String(query).toLowerCase()}`, null);
  $("#dictPanel").hidden = false;
}

let dictRequest = 0;

function buildZhLocalEntry(query, local) {
  return {
    word: query,
    pinyin: local.pinyin || "",
    zh: local.en,
    shortGloss: (local.en || "").split(";")[0].trim(),
    translations: (local.en || "").split(/[;；]/).map((s) => s.trim()).filter(Boolean),
    senses: parseLocalPos(local.pos).map((pos) => ({
      pos,
      label: posInfo(pos).label,
      short: posInfo(pos).short,
      defs: [{ en: local.en, zh: "" }]
    })),
    examples: local.examples || [],
    source: "内置词库"
  };
}

async function lookupDictionary(query, options = {}) {
  query = (query == null ? $("#sourceInput").value : query).trim();
  if (!query) {
    toast("请输入要查询的单词");
    return;
  }
  const lang = detectLang(query);
  const cacheKey = `${lang}|${query.toLowerCase()}`;
  if (DICT_CACHE.has(cacheKey)) {
    const cached = DICT_CACHE.get(cacheKey);
    if (cached === null) {
      emptyDictResult(`未找到 “${escapeHtml(query)}”，请检查拼写或联网重试`, query);
    } else {
      renderDictionaryEntry(cached, query);
    }
    return;
  }
  state.dictQuery = query;
  const requestId = ++dictRequest;
  const dictStale = () => requestId !== dictRequest;

  // Render a known word instantly so the first paint never waits on the
  // network; the backend and browser sources enrich it in the background.
  if (lang === "zh") {
    const local = ZH_LEXICON[query];
    if (local) {
      renderDictionaryEntry(buildZhLocalEntry(query, local), query);
    } else {
      showDictLoading();
    }

    // Curated local entries for common Chinese words beat the backend's DeepSeek
    // zh->en guess, which can pick the wrong homograph (苹果 -> the Apple brand).
    // Words the local lexicon doesn't know still go through the backend.
    if (!local && BACKEND_READY) {
      const backendEntry = await fetchBackendEntry(query).catch(() => null);
      if (dictStale()) return;
      if (backendEntry && backendEntry.senses.length) {
        renderDictionaryEntry(backendEntry, query);
        return;
      }
    }

    // No reachable source describes Chinese parts of speech (CC-CEDICT stores
    // none, and the Wiktionary REST endpoint usually omits the Chinese
    // section), so the English gloss of the word supplies them instead.
    const english = local
      ? (local.en || "").split(/[;；]/)[0].trim()
      : await translateZhToEn(query).catch(() => "");
    if (dictStale()) return;
    if (!english) {
      if (!local) emptyDictResult(`未找到 “${escapeHtml(query)}”，请检查拼写或联网重试`, query);
      return;
    }
    const glossWord = normalizeWord(english.split(/\s+/)[0] || english);
    const remote = glossWord ? await fetchMergedEntry(glossWord).catch(() => null) : null;
    if (dictStale()) return;

    if (remote && remote.senses.length) {
      renderDictionaryEntry({
        word: query,
        pinyin: local ? local.pinyin : "",
        phoneticUK: "",
        phoneticUS: "",
        zh: local ? local.en : `英文释义：${english}`,
        shortGloss: english,
        translations: local ? (local.en || "").split(/[;；]/).map((s) => s.trim()).filter(Boolean) : [english],
        senses: remote.senses.map((sense) => ({
          pos: sense.pos,
          label: sense.label,
          short: sense.short,
          defs: sense.defs.map((d) => ({ en: d.en, zh: local ? local.en : "", ex: d.ex, exZh: "" }))
        })),
        synonyms: remote.synonyms,
        antonyms: remote.antonyms,
        forms: remote.forms,
        examples: local ? local.examples : [],
        source: `${remote.source} · 由英文释义「${english}」推出词性`
      }, query);
    } else if (!local) {
      renderDictionaryEntry({
        word: query,
        pinyin: "",
        zh: english,
        shortGloss: english,
        translations: [english],
        senses: [{ pos: "other", label: posInfo("other").label, short: "", defs: [{ en: english, zh: "" }] }],
        source: "机器翻译"
      }, query);
    }
    return;
  }

  // English word: paint the local lexicon immediately, then merge whichever of
  // the backend and browser sources answers, fetched in parallel.
  const word = normalizeWord(query);
  const local = LEXICON[word];
  if (local) {
    renderDictionaryEntry(localToDict(local, word), query);
  } else {
    showDictLoading();
  }

  const [backendEntry, browserEntry] = await Promise.all([
    BACKEND_READY ? fetchBackendEntry(query).catch(() => null) : Promise.resolve(null),
    word ? fetchMergedEntry(word).catch(() => null) : Promise.resolve(null)
  ]);
  if (dictStale()) return;

  const remote =
    backendEntry && backendEntry.senses.length
      ? backendEntry
      : browserEntry && browserEntry.senses.length
        ? browserEntry
        : null;
  if (remote && remote.senses.length) {
    renderDictionaryEntry(mergeLocalAndRemote(local, remote, query), query);
  } else if (!local) {
    emptyDictResult(`未找到 “${escapeHtml(query)}”，请检查拼写或联网重试`, query);
  }
}

function showDictLoading() {
  $("#dictPanel").hidden = false;
  $("#dictResult").innerHTML = `<div class="empty-state"><p class="result-placeholder">正在查询<span class="loading-dots"></span></p></div>`;
}

const DEFS_PER_POS = 10;
const RELATION_CAP = 20;
const SOURCE_PRIORITY = { wordnet: 0, wiktionary: 1, dictionaryapi: 2, datamuse: 3 };
const SOURCE_LABELS = {
  wordnet: "WordNet",
  wiktionary: "Wiktionary",
  dictionaryapi: "DictionaryAPI",
  datamuse: "Datamuse"
};
// Sources trusted to establish which parts of speech a word has. Datamuse is
// deliberately excluded: it reports "into" as a noun and "the" as an adverb
// because its vocabulary only covers noun/verb/adjective/adverb. WordNet is
// listed for the merge order even though only the backend can reach the
// corpus; the browser gets its WordNet senses through /lookup.
const AUTHORITATIVE_SOURCES = ["wordnet", "wiktionary", "dictionaryapi"];

function cleanGloss(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{\{[^{}]*\}\}/g, " ")
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, (match, prefix, label) => label || prefix || "")
    .replace(/'''/g, "")
    .replace(/''/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?%)\]])/g, "$1")
    .replace(/([(\[])\s+/g, "$1")
    .trim();
}

function glossKey(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9一-鿿]+/g, "");
}

function exactHit(payload, word) {
  if (!Array.isArray(payload)) return null;
  const target = String(word || "").trim().toLowerCase();
  return payload.find((item) => item && String(item.word || "").trim().toLowerCase() === target) || null;
}

async function fetchJson(url, timeout) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeout || 5000) });
  if (!response.ok) throw new Error(`bad status ${response.status}`);
  return response.json();
}

async function fetchDatamuse(word) {
  const base = "https://api.datamuse.com/words";
  const [entries, synonyms, antonyms] = await Promise.allSettled([
    fetchJson(`${base}?sp=${encodeURIComponent(word)}&md=dp&max=5`),
    fetchJson(`${base}?rel_syn=${encodeURIComponent(word)}&max=${RELATION_CAP}`),
    fetchJson(`${base}?rel_ant=${encodeURIComponent(word)}&max=${RELATION_CAP}`)
  ]);

  const result = { source: "datamuse", definitions: [], synonyms: [], antonyms: [] };
  // Datamuse answers with near misses when the exact word is unknown
  // ("Lighting" returns "lightning", "slighting"), so only an exact match counts.
  const entry = entries.status === "fulfilled" ? exactHit(entries.value, word) : null;
  if (entry) {
    for (const raw of entry.defs || []) {
      const parts = String(raw).split("\t");
      if (parts.length < 2) continue;
      const text = cleanGloss(parts[1]);
      if (text) result.definitions.push({ pos: normalizePos(parts[0]), en: text, ex: "" });
    }
  }

  const collect = (settled) =>
    settled.status === "fulfilled" && Array.isArray(settled.value)
      ? settled.value.map((item) => String((item && item.word) || "").trim()).filter(Boolean)
      : [];
  const target = String(word || "").toLowerCase();
  result.synonyms = collect(synonyms).filter((name) => name.toLowerCase() !== target);
  result.antonyms = collect(antonyms).filter((name) => name.toLowerCase() !== target);
  return result;
}

async function fetchWiktionary(word) {
  const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`;
  const payload = await fetchJson(url);
  const result = { source: "wiktionary", definitions: [], synonyms: [], antonyms: [] };

  const language = detectLang(word);
  const preferred = language === "zh"
    ? ["zh", "cmn", "zh-hans", "zh-hant", "chinese", "mandarin"]
    : ["en", "english"];
  // The endpoint keys sections by language and its "other" section mixes
  // several of them, so never fall back to every section: a Portuguese gloss
  // presented as an English definition would be worse than showing nothing.
  const sections = [];
  for (const [key, value] of Object.entries(payload || {})) {
    if (Array.isArray(value) && preferred.includes(String(key).toLowerCase())) sections.push(...value);
  }

  for (const section of sections) {
    if (!section || typeof section !== "object") continue;
    const pos = normalizePos(section.partOfSpeech);
    for (const item of section.definitions || []) {
      if (!item) continue;
      const raw = typeof item === "string" ? item : item.definition;
      const text = cleanGloss(Array.isArray(raw) ? raw.join(" ") : raw);
      if (!text) continue;
      let example = "";
      for (const key of ["parsedExamples", "examples"]) {
        const values = item[key];
        if (values && values.length) {
          const first = values[0];
          example = cleanGloss(typeof first === "string" ? first : first.example || first.text || "");
          if (example) break;
        }
      }
      result.definitions.push({ pos, en: text, ex: example });
    }
  }
  return result;
}

// A dictionaryapi.dev fetcher used to live here. It was removed from the browser
// path because that host sends no Access-Control-Allow-Origin header, so every
// call fails CORS; the backend still queries it in backend/app/online.py, where
// CORS does not apply, and merges those senses into /lookup responses.

function mergeSourceResults(results, word) {
  const answered = results.filter(
    (item) => item && (item.definitions.length || (item.synonyms || []).length || (item.antonyms || []).length)
  );
  if (!answered.length) return null;

  const corroborated = new Set();
  for (const item of answered) {
    if (!AUTHORITATIVE_SOURCES.includes(item.source)) continue;
    for (const definition of item.definitions) corroborated.add(definition.pos || "other");
  }

  const buckets = new Map();
  for (const item of answered) {
    for (const definition of item.definitions) {
      const pos = definition.pos || "other";
      // Datamuse senses outside a corroborated part of speech are dropped,
      // unless Datamuse is the only source that answered.
      if (item.source === "datamuse" && corroborated.size && !corroborated.has(pos)) continue;
      if (!buckets.has(pos)) buckets.set(pos, []);
      buckets.get(pos).push({ ...definition, source: item.source });
    }
  }

  const senses = [];
  const positions = [...buckets.keys()].sort((a, b) => posRank(a) - posRank(b));
  for (const pos of positions) {
    // Stable sort by source preference keeps each source's own sense order.
    const entries = buckets
      .get(pos)
      .slice()
      .sort((a, b) => (SOURCE_PRIORITY[a.source] ?? 9) - (SOURCE_PRIORITY[b.source] ?? 9));
    const seen = new Set();
    const defs = [];
    for (const entry of entries) {
      const key = glossKey(entry.en);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      defs.push({ en: entry.en, zh: "", ex: entry.ex || "", exZh: "" });
      if (defs.length >= DEFS_PER_POS) break;
    }
    if (defs.length) {
      senses.push({ pos, label: posInfo(pos).label, short: posInfo(pos).short, defs });
    }
  }
  if (!senses.length) return null;

  const mergeRelations = (field) => {
    const values = [];
    for (const item of answered) {
      for (const value of item[field] || []) {
        if (value && !values.includes(value)) values.push(value);
      }
    }
    return values.slice(0, RELATION_CAP);
  };

  const contributing = Object.keys(SOURCE_LABELS).filter((name) =>
    answered.some((item) => item.source === name)
  );
  const phonetics = answered.find((item) => item.phoneticUK || item.phoneticUS) || {};

  return {
    word,
    senses,
    synonyms: mergeRelations("synonyms"),
    antonyms: mergeRelations("antonyms"),
    forms: "",
    collocations: [],
    phoneticUK: phonetics.phoneticUK || "",
    phoneticUS: phonetics.phoneticUS || "",
    sources: contributing,
    source: contributing.map((name) => SOURCE_LABELS[name]).join(" · ")
  };
}

async function fetchMergedEntry(word) {
  const query = String(word || "").trim();
  if (!query) return null;
  // dictionaryapi.dev is deliberately not queried from the browser: it sends no
  // Access-Control-Allow-Origin header, so every call fails CORS and only adds
  // console noise. The backend still uses it (see backend/app/online.py), where
  // CORS does not apply.
  const settled = await Promise.allSettled([fetchDatamuse(query), fetchWiktionary(query)]);
  const results = settled.filter((item) => item.status === "fulfilled").map((item) => item.value);
  return mergeSourceResults(results, query);
}

function mergeLocalAndRemote(local, remote, query) {
  const merged = { ...remote };
  if (!local) {
    merged.word = merged.word || query;
    return merged;
  }

  // Union the senses instead of letting the remote answer replace them: when
  // one online source is unreachable it may describe only a single part of
  // speech ("light" as a noun), and the built-in lexicon already knows better.
  const localEntry = localToDict(local, query);
  const byPos = new Map();
  for (const sense of localEntry.senses) {
    byPos.set(sense.pos, { ...sense, defs: sense.defs.slice() });
  }
  for (const sense of remote.senses) {
    if (!byPos.has(sense.pos)) {
      byPos.set(sense.pos, { pos: sense.pos, label: sense.label, short: sense.short, defs: sense.defs.slice() });
      continue;
    }
    const target = byPos.get(sense.pos);
    const seen = new Set(target.defs.map((def) => glossKey(def.en || def.zh || "")));
    for (const def of sense.defs) {
      const key = glossKey(def.en || def.zh || "");
      if (!key || seen.has(key)) continue;
      seen.add(key);
      target.defs.push(def);
      if (target.defs.length >= DEFS_PER_POS) break;
    }
  }

  merged.senses = [...byPos.values()].sort((a, b) => posRank(a.pos) - posRank(b.pos));
  merged.zh = local.zh;
  merged.shortGloss = (local.zh || "").split("；")[0];
  merged.phoneticUK = local.phonetic || remote.phoneticUK;
  merged.phoneticUS = remote.phoneticUS || local.phonetic || "";
  merged.collocations = local.collocations || [];
  merged.forms = local.forms || remote.forms || "";
  merged.examples = local.examples || [];
  merged.source = `${remote.source} · 内置词库`;
  merged.word = merged.word || query;
  return merged;
}

function setDictPos(pos) {
  state.dictActivePos = pos;
  $$("#dictResult .pos-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.pos === pos));
  $$("#dictResult .sense").forEach((sense) => {
    sense.style.display = pos === "all" || sense.dataset.pos === pos ? "" : "none";
  });
}

function toggleSaveWord(btn) {
  const word = btn.dataset.saveWord;
  const gloss = btn.dataset.gloss || "";
  const index = state.saved.findIndex((item) => item.source === word && item.target === gloss);
  if (index >= 0) {
    state.saved.splice(index, 1);
    toast("已取消收藏");
  } else {
    state.saved.unshift({ id: Date.now(), source: word, target: gloss, time: Date.now() });
    toast("已加入收藏");
  }
  saveStore();
  renderSaved();
  btn.classList.toggle("active", index < 0);
}

/* --- AI 对话 --- */

const chatMessages = [];
const CHAT_HISTORY_LIMIT = 20;
let chatPending = false;

function renderChatMessages() {
  const list = $("#chatList");
  const empty = $("#chatEmpty");
  list.querySelectorAll(".chat-msg").forEach((node) => node.remove());
  chatMessages.forEach((message) => {
    const node = document.createElement("div");
    node.className = `chat-msg ${message.role === "user" ? "user" : "bot"}`;
    node.textContent = message.content;
    list.appendChild(node);
  });
  if (empty) empty.hidden = chatMessages.length > 0;
  list.scrollTop = list.scrollHeight;
}

function appendChatMessage(role, content) {
  chatMessages.push({ role, content });
  const list = $("#chatList");
  const empty = $("#chatEmpty");
  const node = document.createElement("div");
  node.className = `chat-msg ${role === "user" ? "user" : "bot"}`;
  node.textContent = content;
  list.appendChild(node);
  if (empty) empty.hidden = true;
  list.scrollTop = list.scrollHeight;
  return node;
}

// Send a message through the chat. `displayText`, when given, is what the user
// sees in the bubble while `text` is what actually reaches the model — the
// 解析当前译文 action sends a fuller instruction than the short label shown.
async function submitChatText(text, displayText) {
  if (chatPending) return;
  const shown = displayText !== undefined ? displayText : text;
  appendChatMessage("user", shown);

  if (!BACKEND_READY) {
    appendChatMessage(
      "assistant",
      "AI 对话需要后端服务：请先启动 backend（uvicorn app.main:app），并在 .env 中配置 DEEPSEEK_API_KEY。"
    );
    return;
  }

  const history = chatMessages.slice(-CHAT_HISTORY_LIMIT).map((m) => ({ role: m.role, content: m.content }));
  history[history.length - 1].content = text;

  chatPending = true;
  const sendBtn = $("#chatSend");
  if (sendBtn) sendBtn.disabled = true;
  const pending = appendChatMessage("assistant", "正在思考…");

  try {
    const reply = await fetchChat(history, 45000);
    if (reply) {
      pending.textContent = reply;
    } else {
      pending.className = "chat-msg bot error";
      pending.textContent = "未收到回复：请确认后端已配置 DEEPSEEK_API_KEY。";
    }
  } catch (error) {
    pending.className = "chat-msg bot error";
    pending.textContent = `请求失败：${error && error.message ? error.message : error}`;
  } finally {
    chatMessages[chatMessages.length - 1] = { role: "assistant", content: pending.textContent };
    chatPending = false;
    if (sendBtn) sendBtn.disabled = false;
    const list = $("#chatList");
    list.scrollTop = list.scrollHeight;
    $("#chatInput").focus();
  }
}

async function sendChatMessage() {
  const input = $("#chatInput");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  submitChatText(text);
}

// Manually parse the current translation inside the AI 对话 sheet. DeepSeek
// 解析 is never triggered automatically by a translation; it only runs here,
// on the user's request.
function parseCurrentTranslation() {
  if (!state.currentSource || !state.currentTranslation) {
    toast("请先在主页翻译一段内容");
    return;
  }
  const src = state.currentSrcLang || "en";
  const tgt = state.currentTargetLang || "zh";
  const display = `请解析：${state.currentSource} → ${state.currentTranslation}`;
  if (!BACKEND_READY) {
    appendChatMessage("user", display);
    appendChatMessage("assistant", localInsightText(state.currentSource, src, tgt));
    return;
  }
  submitChatText(buildInsightPrompt(state.currentSource, src, tgt, state.currentTranslation), display);
}

function updateParseButton() {
  const btn = $("#parseCurrentBtn");
  const hint = $("#parseHint");
  const has = !!(state.currentSource && state.currentTranslation);
  if (btn) btn.disabled = !has;
  if (hint) hint.textContent = has ? `解析“${state.currentSource}”` : "先翻译内容，再点这里逐词解析";
}

function bindEvents() {
  $("#sourceInput").addEventListener("input", scheduleTranslate);
  $("#chatBtn").addEventListener("click", openChatSheet);
  $("#parseCurrentBtn").addEventListener("click", parseCurrentTranslation);
  $("#chatClose").addEventListener("click", closeSheets);
  $("#chatForm").addEventListener("submit", (e) => {
    e.preventDefault();
    sendChatMessage();
  });
  $("#chatInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });
  $("#clearBtn").addEventListener("click", () => {
    $("#sourceInput").value = "";
    $("#charCount").textContent = "0 / 5000";
    clearResult();
    $("#sourceInput").focus();
  });
  $("#micBtn").addEventListener("click", () => {
    const current = $("#sourceInput").value.trim();
    // Empty input defaults to Chinese recognition — most users dictate in
    // Chinese, and an English ASR would mangle Chinese speech.
    const lang = current ? (detectLang(current) === "zh" ? "zh" : "en") : "zh";
    $("#sourceInput").focus();
    startListening(lang);
  });
  $("#scanBtn").addEventListener("click", openCamera);
  $("#lookupBtn").addEventListener("click", () => lookupDictionary());
  $("#speakBtn").addEventListener("click", () => {
    if (state.currentTranslation) speak(state.currentTranslation, state.currentTargetLang);
  });
  $("#copyBtn").addEventListener("click", () => {
    if (state.currentTranslation) copyText(state.currentTranslation);
  });
  $("#saveBtn").addEventListener("click", toggleSave);

  $("#historyBtn").addEventListener("click", openHistorySheet);
  $("#historyClose").addEventListener("click", closeSheets);
  $("#accountBtn").addEventListener("click", openAccountSheet);
  $("#accountClose").addEventListener("click", closeSheets);
  $("#loginTab").addEventListener("click", () => setAccountMode("login"));
  $("#registerTab").addEventListener("click", () => setAccountMode("register"));
  $("#accountSubmit").addEventListener("click", handleAccountSubmit);
  $("#accountLogout").addEventListener("click", logoutUser);
  $("#settingsBtn").addEventListener("click", openSettings);
  $("#settingsClose").addEventListener("click", closeSheets);
  $("#scrim").addEventListener("click", closeSheets);
  $("#historyTabs").addEventListener("click", (e) => {
    const seg = e.target.closest("[data-hist-tab]");
    if (seg) setHistoryTab(seg.dataset.histTab);
  });
  $("#rateBar").addEventListener("click", (e) => {
    const btn = e.target.closest(".rate-option");
    if (btn) setSpeechRate(Number(btn.dataset.rate));
  });

  $("#rateRange").addEventListener("input", (e) => {
    setSpeechRate(Number(e.target.value));
  });
  $("#autoSpeak").addEventListener("change", (e) => {
    state.autoSpeak = e.target.checked;
  });

  $("#dictResult").addEventListener("click", (e) => {
    const speakBtn = e.target.closest(".speak-word");
    if (speakBtn) {
      speak(speakBtn.dataset.text, "en");
      return;
    }
    const exBtn = e.target.closest(".speak-example");
    if (exBtn) {
      speak(exBtn.dataset.text, "en");
      return;
    }
    const posTab = e.target.closest(".pos-tab");
    if (posTab) {
      setDictPos(posTab.dataset.pos);
      return;
    }
    const saveWord = e.target.closest(".save-word");
    if (saveWord) {
      toggleSaveWord(saveWord);
      return;
    }
    const chip = e.target.closest(".rel-chip");
    if (chip) {
      $("#sourceInput").value = chip.dataset.word;
      $("#charCount").textContent = `${chip.dataset.word.length} / 5000`;
      lookupDictionary();
      scheduleTranslate();
    }
  });

  $("#historyList").addEventListener("click", (e) => {
    const del = e.target.closest("[data-del]");
    if (del) {
      const id = Number(del.dataset.del);
      state.history = state.history.filter((i) => i.id !== id);
      saveStore();
      renderHistory();
      return;
    }
    const save = e.target.closest("[data-save]");
    if (save) {
      const id = Number(save.dataset.save);
      const item = state.history.find((i) => i.id === id);
      if (item) {
        if (isSaved(item.source, item.target)) {
          toast("该内容已在收藏中");
          return;
        }
        state.saved.unshift({ id: Date.now(), source: item.source, target: item.target, time: Date.now() });
        saveStore();
        renderSaved();
        renderHistory();
        toast("已加入收藏");
      }
      return;
    }
    const main = e.target.closest(".history-main");
    if (main) {
      const id = Number(main.parentElement.dataset.id);
      const item = state.history.find((i) => i.id === id);
      if (item) loadHistoryItem(item);
    }
  });

  $("#savedList").addEventListener("click", (e) => {
    const del = e.target.closest("[data-del]");
    if (del) {
      const id = Number(del.dataset.del);
      state.saved = state.saved.filter((i) => i.id !== id);
      saveStore();
      renderSaved();
      return;
    }
    const main = e.target.closest(".history-main");
    if (main) {
      const id = Number(main.parentElement.dataset.id);
      const item = state.saved.find((i) => i.id === id);
      if (item) loadSavedItem(item);
    }
  });

  $("#clearHistoryBtn").addEventListener("click", () => {
    state.history = [];
    saveStore();
    renderHistory();
    toast("已清空历史记录");
  });

  $("#takePhotoBtn").addEventListener("click", () => openFilePicker(true));
  $("#pickPhotoBtn").addEventListener("click", () => openFilePicker(false));
  $("#cameraClose").addEventListener("click", closeSheets);
  $("#imageInput").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    state.ocrFile = file;
    const preview = $("#cameraPreview");
    preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="待识别图片">`;
    $("#ocrStatus").textContent = "已选择图片，可点击下方开始识别（首次加载 OCR 引擎稍慢）";
    const runBtn = document.createElement("button");
    runBtn.className = "primary-btn";
    runBtn.style.marginTop = "14px";
    runBtn.textContent = "识别并翻译";
    runBtn.id = "runOcrBtn";
    const old = $("#runOcrBtn");
    if (old) old.remove();
    $("#ocrStatus").after(runBtn);
    runBtn.addEventListener("click", () => runOcr(file));
  });
}

function init() {
  loadStore();
  hydrateIcons();
  renderHistory();
  renderSaved();
  $("#dictPanel").hidden = true;
  updateSaveButton();
  setSpeechRate(state.speechRate);
  renderAccountUI();
  bindEvents();
  checkBackend();
}

document.addEventListener("DOMContentLoaded", init);
