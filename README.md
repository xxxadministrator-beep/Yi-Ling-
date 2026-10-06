# 译灵翻译 · 中英自动互译

参考 Google Translate 手机版布局的交互原型：输入英文或中文自动检测语言并互译，单词自动补充完整词性的词典释义，输入区底部一排是拍照、语音输入与 AI 对话。直接用浏览器打开 `index.html` 即可体验，无需安装依赖或启动服务。

## 已实现的交互

- 界面：Google Translate 手机版风格的单主页；原文输入框保持紧凑，底部左侧拍照、正中语音、右侧 AI 对话
- 单主页翻译：输入英文或中文，自动检测语言并翻译到另一语言，无语言切换界面
- 词典自动补充：单词自动显示按词性分组的释义、英/美音标、双语例句、同近义词、反义词与常见搭配
- 词性完整：统一的词性模型覆盖 24 类（名词、专有名词、代词、动词、助动词、形容词、副词、数词、限定词、冠词、介词、后置词、连词、助词、感叹词、短语、习语、缩写、缩合形式、前缀、后缀、符号、字母、其他），前后端使用同一套词性名称与中文标签
- AI 对话：底部「AI对话」打开对话面板，由后端 `/chat` 调用 DeepSeek，支持中英混合提问
- DeepSeek解析：由用户在「AI对话」中点「解析当前译文」手动触发，不再随翻译自动调用；逐词解析、地道表达与替代译法，后端可用时由 DeepSeek 生成，否则回退本地规则
- 中文查词：拼音与中英对照释义，词性由英文释义经 WordNet / Wiktionary / Datamuse 推出
- 翻译与词典缓存：重复输入即时返回
- 朗读语速：结果页 0.7x / 1.0x / 1.3x 快捷切换，设置页可精细调节
- 一词多译：英文词显示多个中文释义，中文词显示多个英文释义；中译英结果同样列出多个英文译法
- 账户：注册 / 登录 / 退出，后端可用时账户与密码哈希保存在服务器用户数据库，离线时保存在本地；历史与收藏按账户隔离
- 语音输入：浏览器 Web Speech API；语音朗读：SpeechSynthesis
- 拍照翻译：上传图片，浏览器端 OCR 识别后自动翻译
- 历史记录与收藏保存在本地 `localStorage`

## 查词数据源与词性质量

浏览器端与后端按同一套规则聚合在线词典：

| 数据源 | 作用 |
| --- | --- |
| WordNet（NLTK 语料） | 简洁释义，按语料频次排序；同义词、反义词、上下位词、派生词 |
| Wiktionary（REST 定义接口） | 唯一能给出完整词性表的来源（介词、连词、冠词、感叹词、数词…） |
| Datamuse | 补充释义、同近义词、反义词与词频 |
| dictionaryapi.dev | 补充英文释义与英/美音标 |

词性处理规则：

- 各来源的词性拼写先归一化：WordNet 的 `n/v/a/s/r`、Wiktionary 的 `Noun/Preposition`、Datamuse 的 `n/v/adj/adv/prop` 都映射到同一套中文标签，只有确实无法识别的值才落到「其他」
- Datamuse 的词性只在被更强来源印证时采用。实测它会把 `into` 标成名词、把 `the` 标成副词，因为它只认识名词/动词/形容词/副词
- WordNet 义项按 SemCor 语料频次排序，避免 `run` 以棒球「得分」义项开头
- 每条释义都记录来源，界面「数据来源」只列出真正返回数据的那几个源

已知限制：CC-CEDICT 不存词性，Wiktionary 的定义接口对多数汉字不返回中文段落（实测 `光`、`中国` 只返回 `ja`/`other`），因此中文词的词性由英文释义经上述英文源推出。需要严格的中文词性覆盖时，请导入 Kaikki 中文 JSONL。

## 演示数据说明

原型内置常见单词与短语的本地词典作为离线回退（首屏即时显示）。联网时会调用 Datamuse、Wiktionary REST、dictionaryapi.dev 与 MyMemory 翻译接口，便于对任意内容做真实查词与翻译演示；这些都是公开的免费接口，不会向第三方泄露应用内状态。

## 生产架构映射

| 原型能力 | 生产实现建议 |
| --- | --- |
| 翻译、查词、AI 对话 UI | Kotlin + Jetpack Compose，MVVM / UDF + Repository |
| 网络层 | Retrofit + OkHttp（也可用 Ktor） |
| 本地词典、历史缓存 | Room / SQLite |
| 拍照 OCR | CameraX + Google ML Kit，DeepSeek Vision 做图片语义辅助 |
| 录音 | Android AudioRecord / MediaRecorder |
| 语音输入 ASR | Android SpeechRecognizer 起步，后续接 Whisper / 云端 ASR |
| 语音朗读 TTS | Android TextToSpeech |
| 后端 API | Python + FastAPI（`/translate`、`/lookup`、`/chat`） |
| AI 翻译与对话 | DeepSeek API |
| 词典聚合 | WordNet + Wiktionary + Datamuse + CC-CEDICT / Kaikki |
| 后端存储 | PostgreSQL，Redis 做缓存与限流 |
| 鉴权 | JWT / OAuth2（后期增加） |
| 部署 | Docker + Linux 云服务器，GitHub Actions 做 CI/CD |

## 文件

- `index.html` - 页面结构
- `styles.css` - 视觉样式
- `app.js` - 交互逻辑、本地词库、在线查词聚合
- `backend/` - FastAPI 后端（词典聚合、翻译、AI 对话）与 Docker 配置

## 后端接口

| 接口 | 说明 |
| --- | --- |
| `GET /health` | 健康检查，前端据此决定是否启用后端聚合与 DeepSeek |
| `POST /translate` | DeepSeek 翻译；未配置密钥时用内置迷你词典降级 |
| `POST /lookup` | 词典聚合：本地词库 + 在线 WordNet / Wiktionary / Datamuse |
| `POST /chat` | AI 对话，供前端「AI对话」面板与 DeepSeek解析使用 |
| `POST /auth/register` | 注册账户（密码 PBKDF2 哈希后写入 users 表），返回令牌 |
| `POST /auth/login` | 登录校验，返回令牌 |
| `GET /auth/me` | 用 Bearer 令牌换取当前用户 |

```bash
cd backend
cp .env.example .env      # 至少填 DEEPSEEK_API_KEY
uvicorn app.main:app --reload

curl -s localhost:8000/lookup -H "Content-Type: application/json" -d "{\"word\":\"into\"}"
curl -s localhost:8000/chat -H "Content-Type: application/json" -d "{\"messages\":[{\"role\":\"user\",\"content\":\"run 有哪些词性？\"}]}"
```

WordNet 走本地 NLTK 语料，首次使用需要下载一次：

```bash
python -c "import nltk; nltk.download('wordnet')"
```

没有语料时 WordNet 这一路会被跳过，其余在线来源照常返回；`/lookup` 也会读取已导入的 PostgreSQL 词库。

## 词典聚合导入

```bash
cd backend
python -m pip install -r requirements.txt

python -m scripts.import_all --cedict /path/to/cedict_ts.u8      # 中文核心词库
python -m scripts.import_all --wordnet                           # WordNet（首次会下载语料）
python -m scripts.import_all --kaikki /path/to/kaikki-English.jsonl
python -m scripts.import_all --kaikki /path/to/kaikki-Chinese.jsonl

uvicorn app.main:app --reload
```

前端打开后会探测 `http://localhost:8000/health`，后端可用时优先使用聚合词典与 DeepSeek，否则自动回退到浏览器内置词库和公开接口。

云服务器部署步骤见 [DEPLOY.md](DEPLOY.md)。
