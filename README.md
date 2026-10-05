# 译灵翻译 - 中英自动互译

一个参考 Google Translate 手机版风格的交互式原型，采用单主页布局，输入英文或中文后自动检测语言并互译，单词会自动补充词典释义。直接用浏览器打开 `index.html` 即可体验，无需安装依赖或启动服务。

## 已实现的交互

- 单主页翻译：输入英文或中文，自动检测语言并翻译到另一语言，无语言切换界面
- 词典自动补充：单个单词输入后自动显示完整词性分组、英/美音标、双语例句、同近义词、反义词与常见搭配
- 中文查词：CC-CEDICT 风格的拼音、词性与英文释义，并联动 WordNet 语义关系
- 翻译缓存与词典缓存：重复输入即时返回，减少网络等待
- 辅助解析：逐词解析、地道表达提示、替代译法，仅在需要时展开
- 朗读语速：结果页提供 0.7x / 1.0x / 1.3x 快捷切换，设置页可精细调节
- 一词多译：英文词显示多个中文释义，中文词显示多个英文释义
- 账户：本地注册 / 登录 / 退出，历史与收藏按账户隔离保存
- 语音输入：使用浏览器 Web Speech API 做 ASR 演示
- 语音朗读：使用浏览器 SpeechSynthesis 做 TTS 演示
- 拍照翻译：上传图片，浏览器端 OCR 识别英文后自动翻译
- 历史记录与收藏：保存在本地 `localStorage`
- 设置：朗读语速、翻译后自动朗读、关于页

## 演示数据说明

原型内置了常见单词与短语的本地词典作为离线回退。联网时会优先调用 Dictionary API（WordNet 词义与语义关系）、Wiktionary REST API 和 MyMemory 翻译接口，便于对任意内容做真实查词与翻译演示；这些是演示用免费接口，不会向第三方泄露任何应用内状态。

## 生产架构映射

| 原型能力 | 生产实现建议 |
| --- | --- |
| 翻译、查词 UI | Kotlin + Jetpack Compose，MVVM / UDF + Repository |
| 网络层 | Retrofit + OkHttp（也可用 Ktor） |
| 本地词典、历史缓存 | Room / SQLite |
| 拍照 OCR | CameraX + Google ML Kit，DeepSeek Vision 做图片语义辅助 |
| 录音 | Android AudioRecord / MediaRecorder |
| 语音输入 ASR | Android SpeechRecognizer 起步，后续接 Whisper / 云端 ASR |
| 语音朗读 TTS | Android TextToSpeech |
| 后端 API | Python + FastAPI |
| AI 翻译 | DeepSeek API |
| 词典聚合 | CC-CEDICT（中英核心词库）+ WordNet（英语语义关系）+ Kaikki / Wiktionary（丰富词条） |
| 后端存储 | PostgreSQL，Redis 做缓存与限流 |
| 鉴权 | JWT / OAuth2（后期增加） |
| 部署 | Docker + Linux 云服务器，GitHub Actions 做 CI/CD |

## 文件

- `index.html` - 页面结构
- `styles.css` - 视觉样式
- `app.js` - 交互逻辑、本地词典与接口回退
- `backend/` - FastAPI 后端参考骨架与 Docker 配置

## 后端参考骨架

`backend/app/main.py` 提供 `/health`、`/translate`、`/lookup` 三个接口。配置 `DEEPSEEK_API_KEY` 后会走 DeepSeek 翻译；未配置时使用内置迷你词典作为降级，便于本地跑通。

```bash
cd backend
cp .env.example .env
docker compose up --build
```

## 词典聚合导入

为了提高词性完整度和中文释义质量，后端使用 PostgreSQL 保存归一化词库，`/lookup` 会聚合 CC-CEDICT、WordNet、Kaikki/Wiktionary 三份数据，并对英文词做词形还原。

```bash
cd backend
python -m pip install -r requirements.txt

# 1. 导入中文核心词库
python -m scripts.import_all --cedict /path/to/cedict_ts.u8

# 2. 导入 WordNet（首次运行会下载 NLTK WordNet 数据）
python -m scripts.import_all --wordnet

# 3. 导入 Kaikki/Wiktionary（JSONL）
python -m scripts.import_all --kaikki /path/to/kaikki.org-dictionary-English.jsonl

# 启动 API
uvicorn app.main:app --reload
```

前端打开后会探测 `http://localhost:8000/health`，后端可用时优先使用聚合词典接口，否则自动回退到浏览器内置词库和免费接口。

云服务器部署步骤见 [DEPLOY.md](DEPLOY.md)。
