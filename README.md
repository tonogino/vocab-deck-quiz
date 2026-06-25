# 索菲亚单词小屋

一个无需安装即可运行的本地背单词 Galgame。

项目提供普通离线模式和高级 AI 模式。用户可以创建多个存档、管理自定义词库、提升索菲亚的好感度，并在高级模式中通过 OpenAI API 与索菲亚对话。

## 功能概览

### 学习系统

- 每个存档独立记录当前题目、答题数量、正确率和好感度。
- 答对后增加 3 点好感度，并自动切换到下一题。
- 答错后减少 2 点好感度，并显示正确答案。
- 查看答案会减少 2 点好感度，同时锁定当前题目。
- 查看答案后不能继续作答，只能进入下一题。
- 可以为一个存档同时启用多个词库。

### 多语言界面

主界面支持：

- 中文
- English
- 日本語

语言选择会保存在当前浏览器中。

索菲亚的角色名称、人物设定和主要角色台词不会随界面语言完全翻译。

### 角色系统

- 提供角色管理界面。
- 当前默认角色为索菲亚。
- 角色选择保存在对应存档中。
- 角色图片支持普通、开心、难过和害羞四种状态。

目前项目只内置索菲亚，但角色数据结构可以继续扩展。

## 游戏模式

标题界面可以选择普通模式或高级模式。

### 普通模式

普通模式完全离线，不会调用任何 API。

普通模式包含：

- 多存档
- 背单词
- 好感度
- 好感度事件
- 词库管理
- 角色管理
- 索菲亚的默认离线互动台词

### 高级模式：API 消耗模式

高级模式保留普通学习功能，并加入 AI 对话。

高级模式包含：

- 与索菲亚进行日常对话
- 请索菲亚解释当前单词
- 根据好感度改变索菲亚的态度
- User.md 关键记忆
- API 设置和连接测试
- 生气状态和学习管理员惩罚

高级模式不显示好感度事件。索菲亚的态度会直接随着好感度变化：

- 低好感度：礼貌、克制，保持一定距离。
- 中等好感度：逐渐亲近，愿意鼓励用户。
- 高好感度：更加信赖、坦率，偶尔害羞或撒娇。
- 生气状态：语气简短，并发动不会损坏数据的学习惩罚。

普通模式和高级模式的以下数据互不相通：

- 存档
- 好感度
- 答题记录
- 当前题目
- 聊天记录
- User.md 记忆

两个模式唯一共享的数据是词库。

## AI 对话

高级模式进入游戏后，索菲亚下方会出现聊天区域。

可以：

- 与索菲亚进行简单的日常交流。
- 询问当前单词的含义、用法或记忆方法。
- 告诉索菲亚自己的长期学习目标和偏好。

索菲亚遇到过于困难、过于专业或不适合认真回答的问题时，会以角色口吻卖萌或回避，而不是给出长篇严肃回答。

如果聊天输入框为空，点击索菲亚仍然会触发原有的离线互动台词，不会调用 API。

如果 API Key 为空、错误或请求失败，索菲亚会回复：

> 看不懂

## 索菲亚的生气机制

以下情况会让索菲亚生气：

1. 连续答错 10 道题。
2. 在聊天中明确挑衅或辱骂索菲亚。

生气后会：

- 降低一定好感度。
- 临时改变索菲亚的态度和界面效果。
- 打乱当前词库的题目顺序。
- 接下来 3 道题隐藏提示。
- 接下来 3 道题禁止查看答案。

这些操作不会删除单词、词库、存档或 User.md 记忆。

## API 设置

在高级模式主界面点击“设置”。

可以配置：

- API Key
- 模型名称
- API 地址
- User.md 关键记忆

默认配置：

```text
模型：gpt-5.5
API 地址：https://api.openai.com/v1
```

保存后可以点击“测试 API”确认配置是否可用。

项目使用 OpenAI Responses API：

```text
POST /v1/responses
```

请求不会要求 OpenAI 保存响应：

```json
{
  "store": false
}
```

### API Key 安全说明

这是一个纯前端项目。API Key 会保存在浏览器的 `localStorage` 中，因此无法像服务器端应用一样真正隐藏。

建议：

- 为本项目创建单独的 API Key。
- 为该 Key 设置较低的消费限额。
- 不要在公共电脑上保存 API Key。
- 不要把真实 API Key 写进项目文件。
- 分享项目或截图前检查设置页面。

如果需要公开部署，建议增加自己的后端代理，让浏览器只连接后端，不直接持有 API Key。

## User.md 记忆

角色设定目录中包含：

```text
characters/sophia/profile/User.md
```

该文件用于说明索菲亚应该记住哪些类型的信息。

网页运行时无法静默修改项目中的 `User.md` 文件，因此真正的用户记忆保存在高级模式对应存档的浏览器本地存储中。

适合记住：

- 用户希望被如何称呼
- 正在学习的语言
- 长期学习目标
- 明确表达的长期偏好
- 希望索菲亚以后继续遵守的学习习惯

不会主动记住：

- API Key
- 密码和验证码
- 支付信息
- 完整聊天记录
- 与未来交流无关的临时细节

设置页面可以查看、编辑或删除这些记忆。每行代表一条关键信息。

## 词库管理

词库在普通模式和高级模式之间共享。

可以：

- 创建自定义词库。
- 为词库添加单词。
- 删除自定义单词。
- 删除自定义词库。
- 为当前存档启用一个或多个词库。
- 导出所有自创词库。
- 从本地文件导入词库。

默认词库为只读词库，不能直接删除或修改。

### 单词数据格式

单个单词的格式：

```json
{
  "word": "apple",
  "answer": ["苹果"],
  "hint": "一种水果。"
}
```

`answer` 必须是数组，可以提供多个可接受答案：

```json
{
  "word": "memory",
  "answer": ["记忆", "内存"],
  "hint": "心理学和计算机里都会出现。"
}
```

### 导入 JSON

可以导入单词数组：

```json
[
  {
    "word": "いぬ",
    "answer": ["狗"],
    "hint": "一种动物。"
  },
  {
    "word": "ねこ",
    "answer": ["猫"],
    "hint": "一种动物。"
  }
]
```

也可以导入单个词库对象：

```json
{
  "name": "日语基础",
  "words": [
    {
      "word": "いぬ",
      "answer": ["狗"],
      "hint": "一种动物。"
    }
  ]
}
```

还可以导入由项目导出的完整备份：

```json
{
  "format": "sophia-vocab-libraries",
  "version": 1,
  "libraries": [
    {
      "name": "日语基础",
      "words": []
    }
  ]
}
```

### 导入 words.js

项目提供示例文件：

```text
data/words.js
```

支持的 JavaScript 格式：

```js
const WORDS = [
  {
    "word": "いぬ",
    "answer": ["狗"],
    "hint": "一种动物。"
  }
];
```

导入器只提取并解析 `WORDS` 数组，不会执行所选 JavaScript 文件中的代码。

导入词库时：

- 无效单词会被忽略。
- 同名词库不会覆盖原词库，而是自动添加编号。
- 新导入的词库会自动为当前存档启用。

### 导出词库

点击“导出自创词库”后，浏览器会下载一个 JSON 文件。

该文件是真正保存在电脑上的本地备份。即使清除浏览器数据，也可以通过重新导入恢复自创词库。

目前导出功能只导出自创词库，不导出默认词库、游戏存档或 API Key。

## 数据保存位置

运行数据主要保存在浏览器的 `localStorage` 中。

| 数据 | localStorage 键 |
| --- | --- |
| 普通模式存档 | `sophia_v2_save_slots` |
| 普通模式当前存档 | `sophia_v2_active_save_id` |
| 高级模式存档 | `sophia_v3_advanced_save_slots` |
| 高级模式当前存档 | `sophia_v3_advanced_active_save_id` |
| 共享词库 | `sophia_v2_vocab_libraries` |
| 界面语言 | `sophia_v2_language` |
| 当前模式 | `sophia_v3_game_mode` |
| API 设置 | `sophia_v3_ai_settings` |

以下操作可能导致浏览器内数据丢失：

- 清除网站数据
- 清除浏览器存储
- 更换浏览器
- 更换设备
- 使用隐私模式后关闭窗口

建议定期导出自创词库。

## 使用方法

### 直接打开

双击：

```text
index.html
```

普通离线模式可以直接运行。

部分浏览器可能限制本地 `file://` 页面访问网络。如果高级模式无法调用 API，建议使用本地 HTTP 服务器。

### 使用本地 HTTP 服务器

如果电脑安装了 Python，可以在项目目录运行：

```bash
python -m http.server 8000
```

然后访问：

```text
http://127.0.0.1:8000
```

关闭命令行窗口即可停止服务器。

## 角色资源

索菲亚图片位于：

```text
characters/sophia/images/
```

需要以下文件：

```text
normal.png
happy.png
sad.png
shy.png
```

角色设定位于：

```text
characters/sophia/profile/
```

其中包括：

- `Characterization.md`：角色定位和行为边界
- `personality.md`：性格和不同状态下的表现
- `好感度.md`：好感度与生气机制
- `User.md`：用户记忆规则

运行时使用的简化角色设定也保存在：

```text
data/characters.js
```

## 项目结构

```text
vocab-deck-quiz/
├─ index.html
├─ README.md
├─ css/
│  ├─ style.css
│  └─ features.css
├─ js/
│  └─ app.js
├─ data/
│  ├─ characters.js
│  ├─ events.js
│  ├─ language.js
│  ├─ vocab-libraries.js
│  └─ words.js
└─ characters/
   └─ sophia/
      ├─ images/
      │  ├─ normal.png
      │  ├─ happy.png
      │  ├─ sad.png
      │  └─ shy.png
      └─ profile/
         ├─ Characterization.md
         ├─ personality.md
         ├─ 好感度.md
         └─ User.md
```

## 技术说明

项目使用：

- HTML
- CSS
- 原生 JavaScript
- 浏览器 `localStorage`
- OpenAI Responses API

项目没有构建步骤，也没有第三方前端依赖。

主要逻辑集中在：

```text
js/app.js
```

## 当前限制

- API Key 保存在浏览器中，无法真正隐藏。
- User.md 运行数据不能自动写回项目文件。
- 聊天历史只保留最近一部分内容，避免上下文无限增长。
- 目前只有索菲亚一个角色。
- 目前不能导出完整游戏存档。
- AI 对话会产生 API 费用。
- 高级模式需要网络连接，并可能受到浏览器跨域策略影响。

## 后续可扩展方向

- 完整存档导入和导出
- 更多角色
- 每个角色独立的 AI 人设
- 发音和听力题
- 错题本
- 间隔重复算法
- 学习统计图表
- 后端 API 代理
- AI 对话流式输出
- User.md 本地文件同步

## OpenAI 相关资料

- [Text generation and Responses API](https://developers.openai.com/api/docs/guides/text)
- [Create a model response](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [API Key safety](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)
