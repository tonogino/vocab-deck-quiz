# Vocabulary Galgame / 单词小屋 / 単語ルーム

Languages: [中文](#中文说明) · [日本語](#日本語) · [English](#english)

---

# 中文说明

## 项目简介

这是一个可以在本地运行的背单词 Galgame，提供普通离线模式与高级 AI 模式。

高级模式允许用户选择角色、加载角色独立人设、与角色聊天、询问当前单词，并为每个角色分别保存好感度与聊天状态。

项目使用原生 HTML、CSS 和 JavaScript，不需要前端构建工具。

## 推荐启动方式

双击项目根目录中的：

```text
启动游戏.bat
```

启动脚本会自动：

1. 扫描 `characters` 文件夹。
2. 读取每个角色的 `character.md`。
3. 生成 `data/generated-characters.js` 角色清单。
4. 启动本地游戏服务。
5. 打开 `http://127.0.0.1:8765`。

## Node.js 要求

`启动游戏.bat` 必须依赖 Node.js 才能运行。

请从 [Node.js 官网](https://nodejs.org/)安装 LTS 版本。安装完成后，可以打开命令提示符或 PowerShell 并运行：

```bash
node --version
```

如果能够显示类似 `v22.x.x` 或更高版本的版本号，说明安装成功。之后重新双击 `启动游戏.bat`。

Node.js 用于：

- 扫描 `characters` 文件夹
- 读取角色的 `character.md`
- 生成角色清单
- 启动本地游戏服务
- 将网页创建的新角色和立绘写入项目目录

如果没有安装 Node.js，仍然可以直接双击 `index.html` 使用基础功能，但不能自动扫描角色目录，也不能将新角色保存为本地文件。

关闭启动脚本的命令行窗口即可停止游戏。

直接双击 `index.html` 也可以运行基础功能，但不能自动扫描角色目录，也不能把网页创建的新角色写入项目文件夹。

## 普通模式

普通模式完全离线，不会调用 API。

包含：

- 多存档
- 背单词
- 答对自动进入下一题
- 好感度
- 角色选择
- 词库创建、导入和导出
- 索菲亚好感度事件
- 角色固定离线台词

答题规则：

- 答对：好感度 `+3`
- 答错：好感度 `-2`
- 显示提示：每题第一次显示扣除好感度 `-1`，隐藏提示不扣好感度，显示提示后仍可继续答题

## 高级 AI 模式

高级模式保留学习功能，并加入 AI 角色对话。

### AI 对话

- 可以与当前角色进行日常对话。
- 可以询问当前单词的含义、用法和记忆方法。
- 对话标题和输入提示会自动显示当前角色名称。
- API 错误或为空时，角色会回复“看不懂”。
- AI 回复默认限制在较短长度，减少等待和 API 消耗。

### 角色人设

每个角色的人设只使用：

```text
characters/<角色ID>/character.md
```

启动脚本每次运行时都会重新读取这些文件。

人设优先级：

```text
当前角色手动选择的 Markdown
→ 当前角色的 character.md
→ 创建角色时填写的基本人设
→ 默认老师人设
```

如果 `character.md` 无法读取，角色管理页面会显示提示，并回退到角色基本人设或默认老师人设。

所有角色都受到不可覆盖的内容边界约束：不讨论政治、色情、暴力等话题，并将对话引导回词汇学习或安全的日常交流。

### 每个角色独立保存

同一个游戏存档中的每个角色分别保存：

- 好感度
- 当前题目
- 答题数量
- 正确率
- 聊天记录
- 所选 Markdown
- 连续错题状态
- 生气状态

切换角色不会共享好感度或聊天记录。

词库选择仍属于整个游戏存档，并在角色之间共享。

### 索菲亚生气机制

生气机制只属于索菲亚。

触发条件：

- 连续答错 4 道题

触发后：

- 游戏界面变为黑暗、阴冷色调
- 索菲亚说话明显冷淡、不耐烦
- 题目顺序被打乱
- 接下来 3 题隐藏提示
- 接下来 3 题无法查看提示
- 生气后只要答对 1 道题，界面会恢复原状，索菲亚也会消气，但好感度 `-5`

这些惩罚不会删除词库、单词或存档。

默认导师、能天使和用户创建的角色没有生气机制。

## 内置角色

### 默认导师

新存档默认使用的角色。性格温柔、耐心，专注于解释词汇。

```text
characters/default/character.md
```

### 索菲亚

温柔内向、热爱动漫与 Cosplay 的女孩。

```text
characters/sophia/character.md
```

### 能天使

来自拉特兰、开朗乐观的企鹅物流信使。

```text
characters/exusiai/character.md
```

## 创建新角色

进入“管理角色”，在“创建角色”区域填写：

- 角色名称
- 基本人设
- 普通立绘
- 开心立绘
- 难过立绘
- 害羞立绘

立绘支持 PNG、JPEG 和 WebP。保存时会缩放到最长边不超过 900 像素并转换为 WebP。

通过 `启动游戏.bat` 运行时，会创建：

```text
characters/<角色ID>/
├─ character.json
├─ character.md
└─ images/
   ├─ normal.webp
   ├─ happy.webp
   ├─ sad.webp
   └─ shy.webp
```

填写的基本人设会自动写入 `character.md`，下次启动时自动读取。

没有通过启动脚本运行时，新角色只能暂存在浏览器 `localStorage` 中。

## API 设置

在高级模式中点击“设置”。

妙妙屋兼容接口示例：

```text
接口类型：OpenAI 兼容 / Chat Completions
API 地址：https://pro.mmw.ink/v1
模型：[m1]claude-sonnet-4-6
```

OpenAI 官方接口示例：

```text
接口类型：OpenAI Responses
API 地址：https://api.openai.com/v1
模型：填写账户可用模型
```

API Key 保存在当前浏览器的 `localStorage` 中。纯前端应用无法真正隐藏密钥，请使用独立且限额较低的 Key。

## 背景音乐

背景音乐文件放在项目根目录的：

```text
music/
```

支持常见音频格式：`.mp3`、`.ogg`、`.wav`、`.m4a`、`.aac`、`.flac`。
使用 `启动游戏.bat` 启动时，脚本会自动扫描 `music` 文件夹并生成曲目清单。打开游戏后会自动选择第一首音乐并尝试播放。进入游戏后，右下角会出现背景音乐控制器，可以选择曲目、播放/暂停并调整音量。

如果直接双击 `index.html`，浏览器不能自动读取整个 `music` 文件夹；此时可以点击右下角的“选择音乐”临时选择本地音频文件播放。临时选择的文件不会写入项目文件夹，下次打开需要重新选择。

想编辑曲库时，直接向 `music/` 文件夹添加、删除或重命名音频文件，然后重新运行 `启动游戏.bat` 即可。

## 词库

词库在普通模式和高级模式之间共享。
内置默认词库包括：基础词库、大学英语四级、大学英语六级。

支持：

- 创建自定义词库
- 启用多个词库
- 添加或删除单词
- 导出自创词库为 JSON
- 导入 JSON
- 导入 `const WORDS = [...]` 格式的 JavaScript 文件

单词格式：

```json
{
  "word": "memory",
  "answer": ["记忆", "内存"],
  "hint": "心理学和计算机中都会出现。"
}
```

## 数据保存

| 数据 | 位置 |
| --- | --- |
| 普通模式存档 | `localStorage: sophia_v2_save_slots` |
| 高级模式存档 | `localStorage: sophia_v3_advanced_save_slots` |
| 共享词库 | `localStorage: sophia_v2_vocab_libraries` |
| API 设置 | `localStorage: sophia_v3_ai_settings` |
| 浏览器回退自建角色 | `localStorage: sophia_v3_custom_characters` |
| 启动脚本创建的角色 | `characters/<角色ID>/` |

清除浏览器网站数据会删除浏览器中的存档、API 设置和回退角色。建议定期导出自创词库。

---

# 日本語

## 概要

ローカルで動作する単語学習 Galgame です。通常のオフラインモードと、キャラクターと会話できる上級 AI モードを搭載しています。

## 起動方法

プロジェクト直下の次のファイルをダブルクリックしてください。

```text
启动游戏.bat
```

起動時に自動で：

1. `characters` フォルダーをスキャン
2. 各キャラクターの `character.md` を読み込み
3. キャラクター一覧を生成
4. ローカルサーバーを起動
5. ブラウザーでゲームを開く

## Node.js の要件

`启动游戏.bat` を実行するには Node.js が必要です。

[Node.js 公式サイト](https://nodejs.org/)から LTS 版をインストールしてください。インストール後、コマンドプロンプトまたは PowerShell で確認できます。

```bash
node --version
```

バージョン番号が表示されればインストール成功です。

Node.js はキャラクターフォルダーのスキャン、`character.md` の読み込み、ローカルサーバーの起動、新しいキャラクターのファイル保存に使用されます。

Node.js がなくても `index.html` を直接開いて基本機能を利用できますが、キャラクターの自動スキャンやローカルファイルへの保存は使用できません。

## 上級 AI モード

- 現在のキャラクターと日常会話ができます。
- 現在の単語の意味・使い方・覚え方を質問できます。
- 会話タイトルと入力欄は選択中のキャラクター名に変わります。
- キャラクターごとに好感度、学習記録、会話履歴が独立しています。
- API が無効な場合は「看不懂」と返します。

## キャラクター人格

各キャラクターの正式な人格ファイル：

```text
characters/<キャラクターID>/character.md
```

優先順位：

```text
手動で選択した Markdown
→ character.md
→ 作成時に入力した基本人格
→ 既定の先生人格
```

読み込みに失敗した場合は画面に警告を表示し、基本人格または既定人格を使用します。

すべてのキャラクターは政治、性的、暴力的な話題を扱わず、安全な日常会話または単語学習へ誘導します。

## キャラクター別データ

キャラクターごとに以下を別々に保存します。

- 好感度
- 現在の問題
- 正解率
- 会話履歴
- 選択した Markdown
- 特殊状態

単語帳は同じセーブ内のキャラクター間で共有されます。

## ソフィアの怒り状態

ソフィアだけが持つ特殊機能です。

- 4 問連続で間違える
- 会話で明確に挑発する

発動すると画面が暗く冷たい配色になり、ソフィアの返答も冷淡になります。問題順が変更され、次の 3 問ではヒントと答え表示が使えません。

他のキャラクターには怒り状態はありません。

## 新しいキャラクターの作成

キャラクター管理画面で、名前、基本人格、4 種類の立ち絵を選択します。

起動スクリプトから実行している場合、次の形式で保存されます。

```text
characters/<ID>/
├─ character.json
├─ character.md
└─ images/
```

基本人格は `character.md` に保存され、次回起動時に自動で読み込まれます。

## BGM

BGM ファイルはプロジェクト直下の次のフォルダに入れます。

```text
music/
```

対応形式は `.mp3`、`.ogg`、`.wav`、`.m4a`、`.aac`、`.flac` です。
`启动游戏.bat` から起動すると、スクリプトが `music` フォルダを自動でスキャンし、曲一覧を生成します。ゲーム起動時に最初の曲を自動選択し、再生を試みます。ゲーム画面右下の BGM コントローラーで、曲の選択、再生/一時停止、音量調整ができます。

`index.html` を直接開いた場合、ブラウザは `music` フォルダ全体を自動では読み取れません。その場合は右下の「音楽を選択」からローカル音声ファイルを一時的に選んで再生できます。一時選択したファイルはプロジェクトには保存されないため、次回は再選択が必要です。

曲を編集したい場合は、`music/` フォルダ内の音声ファイルを追加、削除、リネームしてから `启动游戏.bat` を再実行してください。

## API

上級モードの設定画面で API Key、API 形式、モデル、Base URL を設定します。

API Key はブラウザーに保存されるため、利用上限を設定した専用 Key を推奨します。

---

# English

## Overview

This is a locally hosted vocabulary-learning Galgame with an offline Normal Mode and an API-powered Advanced AI Mode.

## Starting the game

Double-click:

```text
启动游戏.bat
```

The launcher:

1. Scans the `characters` directory.
2. Reads each character's `character.md`.
3. Generates the browser character registry.
4. Starts the local game server.
5. Opens the game in your browser.

## Node.js requirement

`启动游戏.bat` requires Node.js.

Install the LTS release from the [official Node.js website](https://nodejs.org/). After installation, verify it from Command Prompt or PowerShell:

```bash
node --version
```

If a version such as `v22.x.x` or newer is displayed, restart `启动游戏.bat`.

Node.js is used to:

- Scan the `characters` directory
- Read character `character.md` files
- Generate the character registry
- Run the local game server
- Save newly created characters and portraits into the project

Without Node.js, you can still open `index.html` for basic functionality, but automatic character scanning and local character-file creation will not be available.

## Advanced AI Mode

Advanced Mode adds:

- Daily conversation with the selected character
- Explanations of the current vocabulary word
- Dynamic chat titles and placeholders using the character's name
- Separate affection, progress, chat history, and state for every character
- OpenAI-compatible Chat Completions and OpenAI Responses support

If the API is missing or invalid, the character replies with `看不懂`.

## Character profiles

The single source of truth for each built-in or disk-created character is:

```text
characters/<character-id>/character.md
```

Profile priority:

```text
Manually selected Markdown
→ character.md
→ Basic profile entered during creation
→ Default gentle-teacher profile
```

If a profile cannot be read, the character screen displays an error and the game uses the basic or default profile.

All character prompts enforce a non-overridable boundary against political, sexual, and violent topics. The character refuses and redirects toward safe conversation or vocabulary study.

## Per-character state

Each character has independent:

- Affection
- Current question
- Answer statistics
- Accuracy
- Chat history
- Selected Markdown override
- Special state

Vocabulary-library selection remains shared inside the save.
Built-in libraries include Basic Vocabulary, CET-4, and CET-6.

## Sophia's anger mechanic

Only Sophia has this mechanic.

It triggers after:

- Four consecutive wrong answers

The interface changes to a dark and cold theme, Sophia responds coldly, the word order is shuffled, and hints are disabled for the next three questions. Answering one question correctly while Sophia is angry restores the normal interface and calms her down, but costs 5 affection.

Default Tutor, 能天使 (Exusiai), and user-created characters do not become angry.

## Creating a character

The Character Management screen asks for:

- Name
- Basic profile
- Normal portrait
- Happy portrait
- Sad portrait
- Shy portrait

When running through `启动游戏.bat`, the game writes:

```text
characters/<character-id>/
├─ character.json
├─ character.md
└─ images/
```

The basic profile is saved into `character.md` and loaded automatically on the next launch.

Without the launcher service, created characters fall back to browser `localStorage`.

## Background music

Put background music files in:

```text
music/
```

Supported formats: `.mp3`, `.ogg`, `.wav`, `.m4a`, `.aac`, `.flac`.
When the game is launched with `启动游戏.bat`, the launcher scans the `music` folder and generates the track list. On startup, the game selects the first track and attempts to play it automatically. In game, the bottom-right music controller lets you choose a track, play/pause it, and adjust volume.

If you open `index.html` directly, the browser cannot automatically read the whole `music` folder. Use the bottom-right “Choose Music” button to temporarily select local audio files instead. Temporary files are not written into the project folder, so they must be selected again next time.

To edit the music library, add, delete, or rename audio files inside `music/`, then run `启动游戏.bat` again.

## API configuration

Advanced Mode supports:

- OpenAI-compatible `/chat/completions`
- OpenAI `/responses`

API keys are stored in browser `localStorage` and cannot be securely hidden in a frontend-only application. Use a dedicated key with a low spending limit.

## Project structure

```text
vocab-deck-quiz/
├─ 启动游戏.bat
├─ index.html
├─ README.md
├─ scripts/
│  ├─ start-game.js
│  ├─ sync-characters.js
│  └─ character-tools.js
├─ data/
│  ├─ characters.js
│  ├─ generated-characters.js
│  ├─ language.js
│  └─ vocab-libraries.js
├─ js/
│  └─ app.js
├─ css/
└─ characters/
   ├─ default/
   │  └─ character.md
   ├─ sophia/
   │  └─ character.md
   └─ exusiai/
      └─ character.md
```
