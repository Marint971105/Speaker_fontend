const baseEvaluationTypes = [
  {
    evaluationContent: "视频",
    evaluationTitles: [
      {
        evaluationTitle: "演讲自信程度(Self-confidence in Public Speaking)",
        evaluationInfos: [
          "演讲开场阶段<beginning>",
          "演讲进行过程<body>",
          "演讲结束阶段<ending>",
        ]
      },
      {
        evaluationTitle: "演讲展现能力(Delivery)",
        evaluationInfos: [
          "能进行有效的眼神交流<eye contact>",
          "能有效运用肢体语言提升演讲效果<body language>",
          "声音洪亮<volume>",
          "吐辞清楚<enunciation>",
          "能运用语法停顿或逻辑停顿把控演讲节奏<pause between sentence groups>",
          "能抑扬顿挫，提升演讲效果<intonation>",
          "激情洋溢，感染力强<passion>",
          "很少使用'uh' 'er' 'um'等的停顿，衔接流畅自然<no or few vocalized pauses>",
        ]
      },
      {
        evaluationTitle: "总体印象(speaker credibility)",
        evaluationInfos: [
          "演讲者的选题具有挑战性<challenge>",
          "演讲者熟悉演讲主题，驾驭话题的专业能力强<competence>",
          "演讲者值得信赖<trustworthiness>",
        ]
      }
    ]
  },
  {
    evaluationContent: "音频",
    evaluationTitles: [
      {
        evaluationTitle: "口头表达能力(Speaking Competence)",
        evaluationInfos: [
          "发音准确规范<accuracy>",
          "表达流利<fluency>",
          "发音清晰标准<standardness>",
          "语句完整<integrity>",
          "表现力强<expressiveness>",
        ]
      }
    ]
  },
  {
    evaluationContent: "PPT",
    evaluationTitles: [
      {
        evaluationTitle: "视觉材料辅助效果(Visual Aids)",
        evaluationInfos: [
          "层次清晰、布局合理<organization>",
          "内容明确、重点突出<content>",
          "整体言简意赅<brevity>",
          "字体大小合理<font>",
          "图文并茂，展示效果好<illustration>",
          "色彩协调，对比度适宜（每张PPT一般不超过4种颜色)<color>",
          "演示与发言内容同步<coordinateness>",
        ]
      }
    ]
  },
  {
    evaluationContent: "演讲稿",
    evaluationTitles: [
      {
        evaluationTitle: "演讲稿写作质量(Competence in Drafting a Speech)",
        evaluationInfos: [
          "体裁适宜（记叙文、说明文、议论文的文体选择适宜）<literary styles>",
          "证据充分<evidence>",
          "论证有力<reasoning>",
          "语言表达地道<idiomaticity>",
          "逻辑连贯<logic>",
          "句子简明扼要<conciseness>",
          "无拼写错误<spelling>",
          "无标点错误<punctuation>",
          "基本无语法错误<grammar>",
          "整体谋篇布局合理<organization>",
          "内容切题<relevancy>",
        ]
      }
    ]
  }
];

// 定义默认模板
const defaultTemplate = [
  {
    evaluationMethods: "师评",
    evaluationTypes: JSON.parse(JSON.stringify(baseEvaluationTypes))
  },
  {
    evaluationMethods: "自评",
    evaluationTypes: JSON.parse(JSON.stringify(baseEvaluationTypes))
  },
  {
    evaluationMethods: "互评",
    evaluationTypes: JSON.parse(JSON.stringify(baseEvaluationTypes))
  },
  {
    evaluationMethods: "机评",
    evaluationTypes: [
      {
        evaluationContent: "视频",
        evaluationTitles: [
          {
            evaluationTitle: "自信总分",
            evaluationInfos: []
          }
        ]
      },
      {
        evaluationContent: "音频",
        evaluationTitles: [
          {
            evaluationTitle: "口头表达能力(Speaking Competence)",
            evaluationInfos: [
              "发音准确规范<accuracy>",
              "表达流利<fluency>",
              "发音清晰<standardness>",
              "语句完整<integrity>",
            ]
          }
        ]
      },
      {
        evaluationContent: "演讲稿",
        evaluationTitles: [
          {
            evaluationTitle: "演讲稿写作质量(Competence in Drafting a Speech)",
            evaluationInfos: [
              "文体适宜（记叙文、说明文、议论文的文体选择适宜）<literary styles>",
              "表达地道<authenticity>",
              "逻辑连贯<logic>",
              "语句简明<brevity>",
              "拼写<spelling>",
              "标点<punctuation>",
              "语法<grammar>",
            ]
          }
        ]
      }
    ]
  }
];

export default defaultTemplate;
