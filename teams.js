// ===== 荣耀社区 - 战队赛季阵容数据（完整版） =====

const TEAM_ROSTERS = {
  "嘉世": {
    fullName: "嘉世",
    seasons: {
      1: [{name:"叶修",role:"战斗法师",note:"队长"},{name:"吴雪峰",role:"气功师",note:"副队长"},{name:"夏茗",role:"神枪手"},{name:"殷雄",role:"牧师"},{name:"秦天然",role:"元素法师"},{name:"薛明凯",role:"魔剑士"},{name:"苏沐秋",role:"枪系全精通",note:"千机伞创造者/签约当天去世"}],
      2: [{name:"叶修",role:"战斗法师",note:"队长"},{name:"吴雪峰",role:"气功师",note:"副队长"},{name:"夏茗",role:"神枪手"},{name:"殷雄",role:"牧师"},{name:"秦天然",role:"元素法师"},{name:"薛明凯",role:"魔剑士"}],
      3: [{name:"叶修",role:"战斗法师",note:"队长/夺冠"},{name:"苏沐橙",role:"枪炮师",note:"出道/冠军"},{name:"吴雪峰",role:"气功师",note:"副队长/S3后退役"},{name:"夏茗",role:"神枪手"},{name:"殷雄",role:"牧师"},{name:"秦天然",role:"元素法师"},{name:"薛明凯",role:"魔剑士"}],
      4: [{name:"叶修",role:"战斗法师",note:"队长"},{name:"苏沐橙",role:"枪炮师"},{name:"夏茗",role:"神枪手"},{name:"殷雄",role:"牧师"},{name:"秦天然",role:"元素法师"},{name:"薛明凯",role:"魔剑士"}],
      5: [{name:"叶修",role:"战斗法师",note:"队长/夺冠"},{name:"苏沐橙",role:"枪炮师",note:"冠军"},{name:"刘皓",role:"魔剑士",note:"出道"},{name:"秦天然",role:"元素法师"},{name:"薛明凯",role:"魔剑士"}],
      6: [{name:"叶修",role:"战斗法师",note:"队长/夺冠"},{name:"苏沐橙",role:"枪炮师",note:"冠军"},{name:"刘皓",role:"魔剑士"},{name:"贺铭",role:"元素法师",note:"出道"},{name:"薛明凯",role:"魔剑士"}],
      7: [{name:"叶修",role:"战斗法师",note:"队长"},{name:"苏沐橙",role:"枪炮师"},{name:"刘皓",role:"魔剑士",note:"副队长"},{name:"贺铭",role:"元素法师"},{name:"薛明凯",role:"魔剑士"},{name:"王泽",role:"神枪手",note:"出道"},{name:"孙翔",role:"狂剑士",note:"冬季从越云转入"}],
      8: [{name:"孙翔",role:"战斗法师",note:"接替叶修"},{name:"苏沐橙",role:"枪炮师"},{name:"刘皓",role:"魔剑士",note:"副队长"},{name:"贺铭",role:"元素法师"},{name:"邱非",role:"战斗法师",note:"出道"},{name:"王泽",role:"神枪手"},{name:"申建",role:"拳法家"},{name:"郭阳",role:"气功师"}],
      9: [{name:"孙翔",role:"战斗法师"},{name:"邱非",role:"战斗法师"},{name:"郭阳",role:"气功师"},{name:"张家兴",role:"牧师"}],
      10: [{name:"邱非",role:"战斗法师",note:"新嘉世队长"},{name:"孙翔",role:"战斗法师",note:"S10转会轮回"},{name:"肖时钦",role:"机械师",note:"重回雷霆"},{name:"闻理",role:"—",note:"新嘉世/原训练营"}]
    }
  },
  "兴欣": {
    fullName: "兴欣",
    seasons: {
      1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [],
      9: [{name:"叶修",role:"散人",note:"队长/创建兴欣"},{name:"苏沐橙",role:"枪炮师"},{name:"唐柔",role:"战斗法师"},{name:"包荣兴",role:"流氓"},{name:"乔一帆",role:"阵鬼剑士"},{name:"罗辑",role:"召唤师"},{name:"莫凡",role:"忍者"},{name:"安文逸",role:"牧师"},{name:"魏琛",role:"术士"}],
      10: [{name:"叶修",role:"散人",note:"队长/夺冠退役"},{name:"苏沐橙",role:"枪炮师",note:"S11起任队长"},{name:"方锐",role:"气功师",note:"副队长/从呼啸转入"},{name:"唐柔",role:"战斗法师",note:"最佳新人"},{name:"包荣兴",role:"流氓"},{name:"乔一帆",role:"阵鬼剑士"},{name:"罗辑",role:"召唤师"},{name:"莫凡",role:"忍者"},{name:"安文逸",role:"牧师"},{name:"魏琛",role:"术士"}]
    }
  },
  "蓝雨": {
    fullName: "蓝雨",
    seasons: {
      1: [{name:"魏琛",role:"术士",note:"首任队长"},{name:"方世镜",role:"术士"}],
      2: [{name:"魏琛",role:"术士",note:"队长"},{name:"方世镜",role:"术士",note:"S2后接任队长"}],
      3: [{name:"方世镜",role:"术士",note:"第二任队长"},{name:"黄少天",role:"剑客",note:"出道"},{name:"郑轩",role:"弹药专家"}],
      4: [{name:"喻文州",role:"术士",note:"第三任队长/出道"},{name:"黄少天",role:"剑客",note:"出道"},{name:"郑轩",role:"弹药专家",note:"出道"},{name:"宋晓",role:"气功师"}],
      5: [{name:"喻文州",role:"术士",note:"队长"},{name:"黄少天",role:"剑客"},{name:"郑轩",role:"弹药专家"},{name:"宋晓",role:"气功师"}],
      6: [{name:"喻文州",role:"术士",note:"队长/夺冠"},{name:"黄少天",role:"剑客",note:"MVP"},{name:"郑轩",role:"弹药专家"},{name:"宋晓",role:"气功师"},{name:"于锋",role:"狂剑士",note:"出道/冠军+最佳新人"}],
      7: [{name:"喻文州",role:"术士",note:"队长"},{name:"黄少天",role:"剑客"},{name:"郑轩",role:"弹药专家"},{name:"宋晓",role:"气功师"},{name:"于锋",role:"狂剑士"},{name:"林枫",role:"盗贼",note:"出道"},{name:"徐景熙",role:"守护天使",note:"出道"}],
      8: [{name:"喻文州",role:"术士",note:"队长"},{name:"黄少天",role:"剑客"},{name:"郑轩",role:"弹药专家"},{name:"宋晓",role:"气功师"},{name:"林枫",role:"盗贼"},{name:"徐景熙",role:"守护天使"},{name:"李远",role:"召唤师",note:"出道"}],
      9: [{name:"喻文州",role:"术士",note:"队长"},{name:"黄少天",role:"剑客"},{name:"郑轩",role:"弹药专家"},{name:"宋晓",role:"气功师"},{name:"林枫",role:"盗贼"},{name:"徐景熙",role:"守护天使"},{name:"李远",role:"召唤师"},{name:"卢瀚文",role:"剑客",note:"出道/最佳新人"}],
      10: [{name:"喻文州",role:"术士",note:"队长"},{name:"黄少天",role:"剑客"},{name:"郑轩",role:"弹药专家"},{name:"宋晓",role:"气功师"},{name:"徐景熙",role:"守护天使"},{name:"李远",role:"召唤师"},{name:"卢瀚文",role:"剑客"}]
    }
  },
  "微草": {
    fullName: "微草",
    seasons: {
      1: [{name:"林杰",role:"魔道学者",note:"首任队长"},{name:"方士谦",role:"牧师"}],
      2: [{name:"林杰",role:"魔道学者",note:"队长/S2后退役"},{name:"方士谦",role:"牧师",note:"副队长"}],
      3: [{name:"王杰希",role:"魔道学者",note:"队长/出道"},{name:"方士谦",role:"牧师",note:"副队长"},{name:"邓复升",role:"骑士"}],
      4: [{name:"王杰希",role:"魔道学者",note:"队长"},{name:"方士谦",role:"牧师",note:"副队长"},{name:"邓复升",role:"骑士"}],
      5: [{name:"王杰希",role:"魔道学者",note:"队长/夺冠"},{name:"方士谦",role:"牧师",note:"副队长/冠军"},{name:"邓复升",role:"骑士",note:"冠军"}],
      6: [{name:"王杰希",role:"魔道学者",note:"队长"},{name:"方士谦",role:"牧师",note:"副队长"},{name:"邓复升",role:"骑士"},{name:"许斌",role:"骑士",note:"从三零一转入"},{name:"柳非",role:"神枪手",note:"出道"},{name:"周烨柏",role:"鬼剑士",note:"出道"}],
      7: [{name:"王杰希",role:"魔道学者",note:"队长/夺冠/MVP"},{name:"方士谦",role:"牧师",note:"副队长/冠军"},{name:"邓复升",role:"骑士",note:"冠军"},{name:"许斌",role:"骑士"},{name:"刘小别",role:"剑客",note:"出道/冠军"},{name:"袁柏清",role:"牧师",note:"出道"},{name:"柳非",role:"神枪手"},{name:"周烨柏",role:"鬼剑士"}],
      8: [{name:"王杰希",role:"魔道学者",note:"队长"},{name:"邓复升",role:"骑士",note:"副队长/S8后退役"},{name:"许斌",role:"骑士"},{name:"刘小别",role:"剑客"},{name:"袁柏清",role:"牧师"},{name:"高英杰",role:"魔道学者",note:"出道"},{name:"柳非",role:"神枪手"},{name:"周烨柏",role:"鬼剑士"},{name:"肖云",role:"—",note:"出道"}],
      9: [{name:"王杰希",role:"魔道学者",note:"队长"},{name:"许斌",role:"骑士",note:"副队长"},{name:"刘小别",role:"剑客"},{name:"袁柏清",role:"牧师"},{name:"高英杰",role:"魔道学者"},{name:"柳非",role:"神枪手"},{name:"周烨柏",role:"鬼剑士"},{name:"肖云",role:"—"}],
      10: [{name:"王杰希",role:"魔道学者",note:"队长"},{name:"许斌",role:"骑士",note:"副队长"},{name:"刘小别",role:"剑客"},{name:"袁柏清",role:"牧师"},{name:"高英杰",role:"魔道学者"},{name:"梁方",role:"狂剑士"},{name:"柳非",role:"神枪手"},{name:"周烨柏",role:"鬼剑士"},{name:"肖云",role:"—"},{name:"李济",role:"神枪手"}]
    }
  },
  "霸图": {
    fullName: "霸图",
    seasons: {
      1: [{name:"韩文清",role:"拳法家",note:"队长"},{name:"李艺博",role:"—"},{name:"季冷",role:"刺客"}],
      2: [{name:"韩文清",role:"拳法家",note:"队长"},{name:"李艺博",role:"—"},{name:"季冷",role:"刺客"},{name:"林敬言",role:"流氓"}],
      3: [{name:"韩文清",role:"拳法家",note:"队长"},{name:"李艺博",role:"—"},{name:"季冷",role:"刺客"},{name:"林敬言",role:"流氓"}],
      4: [{name:"韩文清",role:"拳法家",note:"队长/夺冠/MVP"},{name:"张新杰",role:"牧师",note:"副队长/出道/冠军+最佳新人"},{name:"林敬言",role:"流氓"},{name:"李艺博",role:"—",note:"S4后退役"},{name:"季冷",role:"刺客",note:"S4后退役"}],
      5: [{name:"韩文清",role:"拳法家",note:"队长"},{name:"张新杰",role:"牧师",note:"副队长"},{name:"林敬言",role:"流氓"},{name:"白言飞",role:"元素法师",note:"出道"},{name:"贾世明",role:"拳法家"}],
      6: [{name:"韩文清",role:"拳法家",note:"队长"},{name:"张新杰",role:"牧师",note:"副队长"},{name:"林敬言",role:"流氓"},{name:"白言飞",role:"元素法师"},{name:"贾世明",role:"拳法家"}],
      7: [{name:"韩文清",role:"拳法家",note:"队长"},{name:"张新杰",role:"牧师",note:"副队长"},{name:"林敬言",role:"流氓"},{name:"白言飞",role:"元素法师"},{name:"周光义",role:"刺客"},{name:"王池轩",role:"神枪手"}],
      8: [{name:"韩文清",role:"拳法家",note:"队长"},{name:"张新杰",role:"牧师",note:"副队长"},{name:"白言飞",role:"元素法师"},{name:"周光义",role:"刺客"},{name:"王池轩",role:"神枪手"}],
      9: [{name:"韩文清",role:"拳法家",note:"队长"},{name:"张新杰",role:"牧师",note:"副队长"},{name:"张佳乐",role:"弹药专家",note:"复出加入"},{name:"林敬言",role:"流氓",note:"从呼啸转入"},{name:"白言飞",role:"元素法师"},{name:"秦牧云",role:"神枪手",note:"出道"}],
      10: [{name:"韩文清",role:"拳法家",note:"队长"},{name:"张新杰",role:"牧师",note:"副队长"},{name:"张佳乐",role:"弹药专家"},{name:"林敬言",role:"流氓",note:"S9从呼啸转入"},{name:"白言飞",role:"元素法师"},{name:"秦牧云",role:"神枪手"},{name:"宋奇英",role:"拳法家",note:"出道"}]
    }
  },
  "轮回": {
    fullName: "轮回",
    seasons: {
      1: [], 2: [], 3: [], 4: [],
      5: [{name:"周泽楷",role:"神枪手",note:"队长/出道/最佳新人"},{name:"江波涛",role:"魔剑士"}],
      6: [{name:"周泽楷",role:"神枪手",note:"队长"},{name:"江波涛",role:"魔剑士",note:"副队长"}],
      7: [{name:"周泽楷",role:"神枪手",note:"队长"},{name:"江波涛",role:"魔剑士",note:"副队长"},{name:"杜明",role:"剑客"},{name:"方明华",role:"牧师"},{name:"吕泊远",role:"柔道"},{name:"吴启",role:"刺客"}],
      8: [{name:"周泽楷",role:"神枪手",note:"队长/夺冠/MVP"},{name:"江波涛",role:"魔剑士",note:"副队长/冠军"},{name:"杜明",role:"剑客"},{name:"方明华",role:"牧师"},{name:"吕泊远",role:"柔道"},{name:"吴启",role:"刺客"}],
      9: [{name:"周泽楷",role:"神枪手",note:"队长/卫冕/MVP"},{name:"江波涛",role:"魔剑士",note:"副队长/冠军"},{name:"杜明",role:"剑客"},{name:"方明华",role:"牧师"},{name:"吕泊远",role:"柔道"},{name:"吴启",role:"刺客"}],
      10: [{name:"周泽楷",role:"神枪手",note:"队长"},{name:"江波涛",role:"魔剑士",note:"副队长"},{name:"孙翔",role:"战斗法师",note:"从嘉世转入"},{name:"杜明",role:"剑客"},{name:"方明华",role:"牧师"},{name:"吕泊远",role:"柔道"},{name:"吴启",role:"刺客"}]
    }
  },
  "百花": {
    fullName: "百花",
    seasons: {
      1: [],
      2: [{name:"孙哲平",role:"狂剑士",note:"队长"},{name:"张佳乐",role:"弹药专家",note:"副队长"}],
      3: [{name:"孙哲平",role:"狂剑士",note:"队长"},{name:"张佳乐",role:"弹药专家",note:"副队长"}],
      4: [{name:"孙哲平",role:"狂剑士",note:"队长"},{name:"张佳乐",role:"弹药专家",note:"副队长"}],
      5: [{name:"孙哲平",role:"狂剑士",note:"队长/S5因手伤退役"},{name:"张佳乐",role:"弹药专家",note:"MVP"}],
      6: [{name:"张佳乐",role:"弹药专家",note:"队长"},{name:"邹远",role:"弹药专家",note:"出道"}],
      7: [{name:"张佳乐",role:"弹药专家",note:"队长/S7后退役"},{name:"邹远",role:"弹药专家"},{name:"唐昊",role:"流氓",note:"出道"}],
      8: [{name:"于锋",role:"狂剑士",note:"队长/从蓝雨转入"},{name:"邹远",role:"弹药专家",note:"副队长"},{name:"莫楚辰",role:"牧师"},{name:"曾信然",role:"流氓"},{name:"张伟",role:"魔道学者"},{name:"朱效平",role:"召唤师"}],
      9: [{name:"于锋",role:"狂剑士",note:"队长"},{name:"邹远",role:"弹药专家",note:"副队长"},{name:"莫楚辰",role:"牧师"},{name:"曾信然",role:"流氓"},{name:"张伟",role:"魔道学者"},{name:"周光义",role:"刺客",note:"从霸图转入"},{name:"朱效平",role:"召唤师"}],
      10: [{name:"于锋",role:"狂剑士",note:"队长"},{name:"邹远",role:"弹药专家",note:"副队长"},{name:"莫楚辰",role:"牧师"},{name:"曾信然",role:"流氓"},{name:"张伟",role:"魔道学者"},{name:"周光义",role:"刺客"},{name:"朱效平",role:"召唤师"}]
    }
  },
  "呼啸": {
    fullName: "呼啸",
    seasons: {
      1: [], 2: [],
      3: [{name:"林敬言",role:"流氓",note:"队长"}],
      4: [{name:"林敬言",role:"流氓",note:"队长"}],
      5: [{name:"林敬言",role:"流氓",note:"队长"},{name:"方锐",role:"盗贼",note:"副队长/出道"}],
      6: [{name:"林敬言",role:"流氓",note:"队长"},{name:"方锐",role:"盗贼",note:"副队长"}],
      7: [{name:"林敬言",role:"流氓",note:"队长"},{name:"方锐",role:"盗贼",note:"副队长"}],
      8: [{name:"唐昊",role:"流氓",note:"队长/从百花转入"},{name:"方锐",role:"盗贼",note:"副队长"},{name:"郭阳",role:"气功师",note:"从嘉世转入"}],
      9: [{name:"唐昊",role:"流氓",note:"队长/四强"},{name:"方锐",role:"盗贼",note:"副队长"},{name:"郭阳",role:"气功师"}],
      10: [{name:"唐昊",role:"流氓",note:"队长"},{name:"刘皓",role:"魔剑士",note:"副队长/从雷霆转入"},{name:"郭阳",role:"气功师"},{name:"林枫",role:"盗贼",note:"从蓝雨转入"}]
    }
  },
  "雷霆": {
    fullName: "雷霆",
    seasons: {
      1: [], 2: [],
      3: [{name:"肖时钦",role:"机械师"}],
      4: [{name:"肖时钦",role:"机械师",note:"出道"},{name:"方学才",role:"—",note:"副队长"}],
      5: [{name:"肖时钦",role:"机械师",note:"队长"},{name:"方学才",role:"—",note:"副队长"}],
      6: [{name:"肖时钦",role:"机械师",note:"队长"},{name:"方学才",role:"—",note:"副队长"}],
      7: [{name:"肖时钦",role:"机械师",note:"队长"},{name:"方学才",role:"—",note:"副队长"},{name:"戴妍琦",role:"—",note:"出道"}],
      8: [{name:"肖时钦",role:"机械师",note:"队长"},{name:"方学才",role:"—",note:"副队长"},{name:"戴妍琦",role:"—"}],
      9: [{name:"刘皓",role:"魔剑士",note:"队长/从嘉世转入"},{name:"方学才",role:"—",note:"副队长"},{name:"贺铭",role:"元素法师",note:"从嘉世转入"},{name:"戴妍琦",role:"—"},{name:"张奇",role:"—",note:"出道"}],
      10: [{name:"肖时钦",role:"机械师",note:"队长/重回雷霆"},{name:"方学才",role:"—",note:"副队长"},{name:"戴妍琦",role:"—"},{name:"张家兴",role:"牧师",note:"从嘉世转入"},{name:"鲁奕宁",role:"神枪手",note:"从烟雨转入"},{name:"程泰",role:"—"},{name:"张奇",role:"—"},{name:"米修远",role:"—",note:"出道"}]
    }
  },
  "虚空": {
    fullName: "虚空",
    seasons: {
      1: [], 2: [], 3: [],
      4: [{name:"李轩",role:"鬼剑士",note:"队长/出道"},{name:"吴羽策",role:"鬼剑士"}],
      5: [{name:"李轩",role:"鬼剑士",note:"队长"},{name:"吴羽策",role:"鬼剑士",note:"副队长/出道"},{name:"李迅",role:"刺客"},{name:"葛兆蓝",role:"弹药专家"},{name:"杨昊轩",role:"枪炮师"},{name:"唐礼升",role:"守护天使"}],
      6: [{name:"李轩",role:"鬼剑士",note:"队长"},{name:"吴羽策",role:"鬼剑士",note:"副队长"},{name:"李迅",role:"刺客"},{name:"葛兆蓝",role:"弹药专家"},{name:"杨昊轩",role:"枪炮师"},{name:"唐礼升",role:"守护天使"}],
      7: [{name:"李轩",role:"鬼剑士",note:"队长"},{name:"吴羽策",role:"鬼剑士",note:"副队长"},{name:"李迅",role:"刺客"},{name:"葛兆蓝",role:"弹药专家"},{name:"杨昊轩",role:"枪炮师"},{name:"唐礼升",role:"守护天使"}],
      8: [{name:"李轩",role:"鬼剑士",note:"队长/最佳搭档"},{name:"吴羽策",role:"鬼剑士",note:"副队长/最佳搭档"},{name:"李迅",role:"刺客"},{name:"葛兆蓝",role:"弹药专家"},{name:"杨昊轩",role:"枪炮师"},{name:"唐礼升",role:"守护天使"}],
      9: [{name:"李轩",role:"鬼剑士",note:"队长/最佳搭档"},{name:"吴羽策",role:"鬼剑士",note:"副队长/最佳搭档"},{name:"李迅",role:"刺客"},{name:"盖才捷",role:"驱魔师",note:"出道"},{name:"葛兆蓝",role:"弹药专家"},{name:"杨昊轩",role:"枪炮师"},{name:"唐礼升",role:"守护天使"}],
      10: [{name:"李轩",role:"鬼剑士",note:"队长"},{name:"吴羽策",role:"鬼剑士",note:"副队长"},{name:"李迅",role:"刺客"},{name:"盖才捷",role:"驱魔师"},{name:"葛兆蓝",role:"弹药专家"},{name:"杨昊轩",role:"枪炮师"},{name:"唐礼升",role:"守护天使"},{name:"贾世明",role:"拳法家",note:"从霸图→皇风转入"}]
    }
  },
  "烟雨": {
    fullName: "烟雨",
    seasons: {
      1: [], 2: [], 3: [],
      4: [{name:"楚云秀",role:"元素法师",note:"队长/出道"},{name:"舒可欣",role:"神枪手"},{name:"舒可怡",role:"神枪手"}],
      5: [{name:"楚云秀",role:"元素法师",note:"队长"},{name:"舒可欣",role:"神枪手"},{name:"舒可怡",role:"神枪手"}],
      6: [{name:"楚云秀",role:"元素法师",note:"队长"},{name:"舒可欣",role:"神枪手"},{name:"舒可怡",role:"神枪手"}],
      7: [{name:"楚云秀",role:"元素法师",note:"队长"},{name:"李华",role:"忍者",note:"副队长/出道"},{name:"舒可欣",role:"神枪手"},{name:"舒可怡",role:"神枪手"}],
      8: [{name:"楚云秀",role:"元素法师",note:"队长/四强"},{name:"李华",role:"忍者",note:"副队长"},{name:"舒可欣",role:"神枪手"},{name:"舒可怡",role:"神枪手"},{name:"孙亮",role:"拳法家"},{name:"白祁",role:"—"},{name:"冯向明",role:"—"}],
      9: [{name:"楚云秀",role:"元素法师",note:"队长"},{name:"李华",role:"忍者",note:"副队长"},{name:"舒可欣",role:"神枪手"},{name:"舒可怡",role:"神枪手"},{name:"孙亮",role:"拳法家"},{name:"白祁",role:"—"},{name:"冯向明",role:"—"}],
      10: [{name:"楚云秀",role:"元素法师",note:"队长"},{name:"李华",role:"忍者",note:"副队长"},{name:"舒可欣",role:"神枪手"},{name:"舒可怡",role:"神枪手"},{name:"孙亮",role:"拳法家"},{name:"白祁",role:"—"},{name:"冯向明",role:"—"}]
    }
  },
  "三零一": {
    fullName: "三零一",
    seasons: {
      1: [], 2: [],
      3: [{name:"杨聪",role:"刺客",note:"队长/出道"},{name:"许斌",role:"骑士"},{name:"孙明进",role:"剑客"}],
      4: [{name:"杨聪",role:"刺客",note:"队长"},{name:"许斌",role:"骑士",note:"出道"},{name:"孙明进",role:"剑客"},{name:"高杰",role:"—"}],
      5: [{name:"杨聪",role:"刺客",note:"队长"},{name:"许斌",role:"骑士"},{name:"孙明进",role:"剑客"},{name:"高杰",role:"—"}],
      6: [{name:"杨聪",role:"刺客",note:"队长"},{name:"许斌",role:"骑士"},{name:"孙明进",role:"剑客"},{name:"高杰",role:"—"}],
      7: [{name:"杨聪",role:"刺客",note:"队长"},{name:"许斌",role:"骑士"},{name:"孙明进",role:"剑客"},{name:"高杰",role:"—"},{name:"白庶",role:"骑士"}],
      8: [{name:"杨聪",role:"刺客",note:"队长"},{name:"许斌",role:"骑士"},{name:"孙明进",role:"剑客"},{name:"高杰",role:"—"},{name:"白庶",role:"骑士"}],
      9: [{name:"杨聪",role:"刺客",note:"队长"},{name:"白庶",role:"骑士"},{name:"李亦辉",role:"柔道",note:"从微草转入"},{name:"高杰",role:"—"},{name:"孙明进",role:"剑客"}],
      10: [{name:"杨聪",role:"刺客",note:"队长"},{name:"白庶",role:"骑士"},{name:"李亦辉",role:"柔道"},{name:"高杰",role:"—"},{name:"孙明进",role:"剑客"}]
    }
  },
  "义斩": {
    fullName: "义斩",
    seasons: {
      1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [],
      9: [{name:"楼冠宁",role:"狂剑士",note:"队长/出道"},{name:"邹云海",role:"元素法师"},{name:"文客北",role:"战斗法师"},{name:"顾夕夜",role:"柔道"},{name:"钟叶离",role:"牧师"},{name:"宁远",role:"气功师"}],
      10: [{name:"楼冠宁",role:"狂剑士",note:"队长"},{name:"孙哲平",role:"狂剑士",note:"替补/原百花队长"},{name:"邹云海",role:"元素法师"},{name:"文客北",role:"战斗法师"},{name:"顾夕夜",role:"柔道"},{name:"钟叶离",role:"牧师"},{name:"宁远",role:"气功师"}]
    }
  },
  "皇风": {
    fullName: "皇风",
    seasons: {
      1: [{name:"郭明宇",role:"驱魔师",note:"首任队长"},{name:"任俊驰",role:"守护天使"}],
      2: [{name:"吕良",role:"驱魔师",note:"第二任队长"},{name:"任俊驰",role:"守护天使"}],
      3: [{name:"吕良",role:"驱魔师",note:"队长"},{name:"任俊驰",role:"守护天使"}],
      4: [{name:"田森",role:"驱魔师",note:"第三任队长/出道"},{name:"任俊驰",role:"守护天使"},{name:"贾世明",role:"拳法家"}],
      5: [{name:"田森",role:"驱魔师",note:"队长"},{name:"任俊驰",role:"守护天使"},{name:"贾世明",role:"拳法家"}],
      6: [{name:"田森",role:"驱魔师",note:"队长"},{name:"任俊驰",role:"守护天使"}],
      7: [{name:"田森",role:"驱魔师",note:"队长"},{name:"任俊驰",role:"守护天使"}],
      8: [{name:"田森",role:"驱魔师",note:"队长/全明星"},{name:"任俊驰",role:"守护天使"}],
      9: [{name:"田森",role:"驱魔师",note:"队长"},{name:"任俊驰",role:"守护天使"}],
      10: [{name:"田森",role:"驱魔师",note:"队长"},{name:"任俊驰",role:"守护天使"}]
    }
  },
  "神奇": {
    fullName: "神奇",
    seasons: {
      1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [],
      10: [{name:"贺铭",role:"元素法师",note:"队长/从雷霆转入"},{name:"郭少",role:"枪炮师",note:"首任队长/让位"},{name:"申建",role:"拳法家",note:"从嘉世转入"},{name:"王泽",role:"神枪手",note:"从嘉世转入"},{name:"向元纬",role:"魔剑士"},{name:"贾兴",role:"战斗法师"}]
    }
  },
  "越云": {
    fullName: "越云",
    seasons: {
      1: [], 2: [], 3: [], 4: [], 5: [], 6: [],
      7: [{name:"孙翔",role:"狂剑士",note:"出道/最佳新人"}],
      8: [{name:"孙翔",role:"狂剑士",note:"冬季转会嘉世"}],
      9: [], 10: []
    }
  }
};

const TEAM_ORDER = ["嘉世","兴欣","蓝雨","微草","霸图","轮回","百花","呼啸","雷霆","虚空","烟雨","三零一","义斩","皇风","神奇","越云"];
