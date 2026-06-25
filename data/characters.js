const CHARACTERS = {
  sophia: {
    id: "sophia",
    displayName: "索菲亚",
    description: "陪你一起学习单词的女孩。",
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
      start: ["欢迎回来。今天也一起背几个单词吧。", "我已经准备好了。你呢？", "不用急，慢慢来。我会陪着你的。"],
      correct: ["答对了！你刚才很帅哦。", "嗯，很好。这个单词已经记住了吧？", "不错嘛，看来今天状态很好。"],
      wrong: ["没关系，再看一眼答案就好了。", "错了也没事。比起逃避，继续学更重要。", "我不会因为你答错就讨厌你的啦。"],
      reveal: ["答案就在这里。下次要自己想起来哦。", "看答案也可以，不过之后要补回来。", "记不住的时候，先理解意思也很好。"],
      click: ["怎么了？想休息一下吗？", "你一直看着我，是想让我夸你吗？", "别偷懒啦，先把这个单词背完。", "如果你今天认真学习，我会很开心的。"],
      highAffection: ["和你一起学习，好像也没那么无聊。", "今天也来找我了啊……我有点高兴。", "别太勉强自己。我会一直在这里。"]
    }
  }
};
