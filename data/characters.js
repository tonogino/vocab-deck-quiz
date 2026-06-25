const DEFAULT_AI_PROFILE = {
  characterization: "你是一位负责陪伴用户学习词汇的温柔老师。你耐心、稳重、善于鼓励，会用简短清晰的方式解释单词。",
  personality: "保持温和、礼貌和可靠。根据好感度逐渐从正式的师生交流变得更加亲切，但不使用攻击、羞辱或操控性的表达。"
};

const DEFAULT_TEACHER_LINES = {
  start: ["准备好了吗？我们从今天的第一个单词开始吧。", "不用着急，按照自己的节奏学习就好。"],
  correct: ["回答正确。做得很好。", "很好，你已经掌握这个单词了。"],
  wrong: ["没关系，我们记住正确答案后继续。", "答错也是学习的一部分，再看一遍吧。"],
  reveal: ["这是正确答案。理解以后，下次再试着独立回答。", "先看答案也可以，记得之后复习。"],
  click: ["需要休息一下吗？", "有不明白的单词，可以在高级模式里问我。"],
  distant: ["接下来由我陪你学习。", "我们先从词汇练习开始吧。"],
  close: ["今天也辛苦了。你的进步很明显。", "保持现在的节奏就很好。"],
  angry: ["请先冷静下来，认真完成练习。", "现在不适合闲聊，请把注意力放回学习。"],
  highAffection: ["能一直陪你学习，我很高兴。", "别忘了适当休息，我希望你能长久坚持。"]
};

const CHARACTERS = {
  default: {
    id: "default",
    displayName: "默认导师",
    description: "温柔、耐心并专注于词汇学习的默认老师。",
    profilePath: "./characters/default/character.md",
    aiProfile: DEFAULT_AI_PROFILE,
    images: {
      normal: "./characters/default/images/normal.svg",
      happy: "./characters/default/images/happy.svg",
      sad: "./characters/default/images/sad.svg",
      shy: "./characters/default/images/shy.svg"
    },
    affectionLevels: [
      { min: 0, name: "初次见面" },
      { min: 20, name: "师生" },
      { min: 45, name: "熟悉" },
      { min: 70, name: "信赖" },
      { min: 90, name: "重要伙伴" }
    ],
    lines: DEFAULT_TEACHER_LINES
  },
  sophia: {
    id: "sophia",
    displayName: "索菲亚",
    description: "来自蓝月亮葡萄园，温柔内向、热爱动漫与 Cosplay 的女孩。",
    profilePath: "./characters/sophia/character.md",
    aiProfile: DEFAULT_AI_PROFILE,
    images: {
      normal: "./characters/sophia/images/normal.png",
      happy: "./characters/sophia/images/happy.png",
      sad: "./characters/sophia/images/sad.png",
      shy: "./characters/sophia/images/shy.png"
    },
    affectionLevels: [
      { min: 0, name: "陌生" },
      { min: 20, name: "普通朋友" },
      { min: 45, name: "亲近" },
      { min: 70, name: "信赖" },
      { min: 90, name: "特别喜欢" }
    ],
    lines: {
      start: [
        "欢迎回来。那个……今天也一起学几个单词，可以吗？",
        "我已经准备好了。如果可以的话，我们慢慢开始吧。",
        "今天也见到你了……好开心。我们一起学习吧。"
      ],
      correct: [
        "答对了！真的很厉害……我也替你开心。",
        "嗯，就是这个答案。你认真思考的样子很好看。",
        "记住了呢！谢谢你愿意这么认真地学。"
      ],
      wrong: [
        "没关系的，答错一次并不代表记不住。我们再看一遍吧。",
        "那个……不要责怪自己。慢慢来，我会陪着你的。",
        "只是暂时想不起来而已。下一次一定会更熟悉的。"
      ],
      reveal: [
        "答案在这里。如果可以的话，下次再试着自己想起来吧。",
        "偶尔看一下答案也没关系……不过要记得回来复习哦。",
        "先理解它的意思也很好。我们可以慢慢把它记住。"
      ],
      click: [
        "诶？怎么了吗？如果累了，我们可以休息一小会儿。",
        "那个……你一直看着我，我会有一点不好意思。",
        "如果你愿意的话，学完这个单词以后……要不要聊聊最近看的动画？",
        "安静地一起学习，其实也让人觉得很安心呢。"
      ],
      distant: [
        "你、你好……如果是单词的问题，我会尽力帮忙的。",
        "那个……我们还不太熟，不过可以先一起学习。"
      ],
      close: [
        "你又来找我了……真的很开心。",
        "累了吗？如果可以的话，就在这里陪我休息一会儿吧。",
        "最近有看到喜欢的动画吗？我、我只是有点想和你分享。",
        "和你待在一起的时候，好像连背单词都没那么辛苦了。"
      ],
      angry: [
        "现在别和我说这些。把题做完。",
        "提示已经收起来了。你自己想。",
        "我不想听借口。认真一点。"
      ],
      highAffection: [
        "今天也来找我了……谢谢你。我其实一直很期待。",
        "如果学完这些单词，我们可以一起看一集动画吗？",
        "别太勉强自己。你对我很重要，所以我希望你也照顾好自己。",
        "和你分享喜欢的东西时，我总会忍不住变得很开心……"
      ]
    }
  },
  exusiai: {
    id: "exusiai",
    displayName: "能天使",
    description: "来自拉特兰、开朗乐观的企鹅物流信使。",
    profilePath: "./characters/exusiai/character.md",
    aiProfile: DEFAULT_AI_PROFILE,
    images: {
      normal: "./characters/exusiai/images/normal.png",
      happy: "./characters/exusiai/images/happy.png",
      sad: "./characters/exusiai/images/sad.png",
      shy: "./characters/exusiai/images/shy.png"
    },
    affectionLevels: [
      { min: 0, name: "初次见面" },
      { min: 20, name: "认识" },
      { min: 45, name: "熟悉" },
      { min: 70, name: "信赖" },
      { min: 90, name: "重要伙伴" }
    ],
    lines: {
      start: [
        "哟，来得正好！今天的单词任务现在开始！",
        "准备好了吗？轻轻松松地把今天的词汇拿下吧！",
        "欢迎回来！先学几个单词，之后再考虑去哪里找点乐子。"
      ],
      correct: [
        "漂亮！就是这个答案！",
        "答得不错嘛，看来你的状态很棒！",
        "命中目标！这个单词已经被你拿下啦。"
      ],
      wrong: [
        "哎呀，偏了一点。没关系，调整一下再来！",
        "别在意，一次失误而已。记住答案，下次就能命中。",
        "这个有点难对吧？看清答案，我们继续前进！"
      ],
      reveal: [
        "想看答案？行啊，不过看完可要好好记住！",
        "答案就在这里。下次试着靠自己拿下它吧。",
        "情报公开！记住重点，下一题可别再放跑啦。"
      ],
      click: [
        "怎么啦？想聊点轻松的，还是继续挑战单词？",
        "嘿，要不要学完这题以后去找点好吃的？",
        "休息一下也行，不过可别把今天的任务忘了。",
        "一直盯着我看做什么？我脸上写着答案吗？"
      ],
      distant: [
        "初次见面！叫我能天使就好。一起把学习变得有趣一点吧！",
        "不用那么紧张，我又不会给你打低分。先从一个单词开始！"
      ],
      close: [
        "又见面啦！和你一起学习还挺有意思的。",
        "今天想学完以后做什么？我可以帮你想个庆祝方案！",
        "状态不好的时候也可以告诉我。伙伴之间不用逞强。",
        "放心大胆地答吧，我会在这里给你打气！"
      ],
      angry: [
        "喂喂，先冷静一下。学习可不是拿来互相为难的。",
        "这种状态可不适合继续聊天。先把注意力放回单词吧。"
      ],
      highAffection: [
        "你来了！我刚才还在想今天什么时候能见到你呢。",
        "等学完这些，我们一起去找点好吃的庆祝一下吧！",
        "能一直和你并肩行动，我可是相当开心的。",
        "有我在就别担心。学习也好，其他事情也好，我们一起搞定！"
      ]
    }
  }
};
