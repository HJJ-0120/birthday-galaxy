// The entry is a local birthday ritual. No network request or credential storage.
let recipient = null;
export function shanghaiToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Shanghai',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(now);
  const value=type=>Number(parts.find(part=>part.type===type).value);
  return {year:value('year'),month:value('month'),day:value('day')};
}
export function createBirthdayProfile(nameValue, birthdayValue, today = shanghaiToday()) {
  const name=String(nameValue??'').replace(/[\u0000-\u001f\u007f]/g,'').trim();
  if(!name)throw new Error('先告诉我，今天想被祝福的名字吧。');
  if(Array.from(name).length>20)throw new Error('名字请写在 20 个字以内。');
  const match=/^(\d{4})\.(\d{2})\.(\d{2})$/.exec(String(birthdayValue??'').trim());
  if(!match)throw new Error('生日口令请按 2000.02.01 这样的格式填写。');
  const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
  const leap=year%4===0&&(year%100!==0||year%400===0),days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  if(year<1900||month<1||month>12||day<1||day>days[month-1])throw new Error('这个生日好像不存在，再检查一下年月日吧。');
  if(year>today.year||year===today.year&&(month>today.month||month===today.month&&day>today.day))throw new Error('出生日期还在未来，请再检查一下。');
  const before=today.month<month||today.month===month&&today.day<day;
  const passed=today.month>month||today.month===month&&today.day>day;
  const celebrationYear=today.year+(passed?1:0);
  const birthdayAge=celebrationYear-year,currentAge=today.year-year-(before?1:0);
  return Object.freeze({name,birthdayAge,currentAge,celebrationYear,birthdayLabel:`${match[2]}.${match[3]}`});
}
export function setRecipient(profile){recipient=profile;}
export function getRecipient(){return recipient;}
export function cakeGreeting(profile){return Array.from(profile.name).length>12?profile.name:`${profile.name}，${profile.birthdayAge}岁快乐`;}
export function birthdayBlessing(profile){
  const {name,birthdayAge}=profile;
  return {
    title:`${name}${birthdayAge}岁生日快乐`,
    dedication:`写给 ${name} · 属于你的第 ${birthdayAge} 岁`,
    paragraphs:[
      `${name}同学，你好！`,
      `首先要祝你${birthdayAge}岁生日🎂快乐哟！希望你后面的每一天都能开开心心！无论做啥都会顺顺利利的！未来的日子里会有更多人的认识你，有友谊长久的朋友们，当然也会有对你无微不至的恋人始终坚定选择你，陪伴你，给予你独属于他的独一份温柔与偏爱！`,
      '借此机会想跟你说说我的心里话，刚认识几天，想必你对我也不是很了解吧，因为你最近很忙也没机会聊聊天啥的，所以想向你介绍我到底是一个什么“怪”人吧哈哈，如果你想了解的话就继续往下看吧嘿嘿。',
      `咱今天的小寿星，在我看到你今年才${birthdayAge}岁后，我眼中多了一份羡慕和遗憾，羡慕在于你很年轻，有更多试错的机会和时间，可以不顾一切地为自己热爱的人或物付出自己的全部心血；遗憾在于我已不复青春，我会发现相比于以前我变得更加沉稳成熟，会计算做每一件事所带给我的好处与代价，我害怕不确定性、害怕失去自己所在乎的一切，所以尽力去保持内心的“水平”，这也就是为什么之前我急着问你想不想跟我有进一步的进展的主要原因，站在你的视角我也会觉得进展的过于快了，但我就是这样一个“快”人，仅几天甚至几次见面，我就确定了一个人是不是我真正想要交心的，这也就是他们所说的“一见钟情”吧，我愿意为那个人付出自己的一切，不会主动放弃这段关系，直到他对我不感兴趣，那我会主动离开再也不见。我觉得你跟我很不一样，你需要时间去了解对方，不会仓促的确定一段关系，这也是对自己的一份保护吧，我很能够理解。但我纠结的点在于我如果本就不是你喜欢的类型，我想尽管做再多的努力也徒有空悲吧（ost：希望你不是这样想的）`,
      '一不小心讲多了哈哈，我认为我是一个啥样的人呢？心思细腻、不擅长表达自己，但也会为自己喜欢的人付出自己一切的“蠢”人吧。infj以及风象星座的我会为了别人对我散发的一点善意便会开心一整天，只要别人愿意为我付出一点点，我会付出十倍甚至更多。我大概是个讨好型人格吧，容易患得患失，面对喜欢的人我会变得自卑，地位低下，面对突然的冷漠会怀疑自己是不是说错了话或者做了不满意的事。我可能就是个受虐狂吧，忍痛受爱情的苦哈哈。',
      '我喜欢你❤️我喜欢你❤️我喜欢你❤️我不想只是和你做普通朋友！我想我们需要时间去了解，去发现对方的缺点并学会包容。我愿意接受你的一切（包括所有缺点），知道你之前被逃避型人格所伤，可能不愿意轻易尝试一段关系，我想说的是我一定不会！多说无益，我想以后用行动来证明！在我不主动找你的时候，不是不想和你分享我的生活，而是不知道在你的心里我到底重不重要，我需要的是对方的足够坚定，如果不被需要我并不会伤心反而会主动离开，保留我最后的体面。你说过你更喜欢主动一点的人，我虽然现在对你表现的不够主动，但随着我们的慢慢了解，我会为了你变得更加主动，愿意为你而有所改变！我之前说过我虽然不擅表达，但我是一个行动派，我会牢牢你说过的话，你的兴趣爱好，你的饮食习惯，会突然地为你准备小惊喜或者小惊吓哈哈。我愿意为你迈出一百步，只希望你可以向我迈出一小步！你愿意给我这个机会吗宝子？',
      '思考了很久，才决定为你写这一封也许不合适的信。不知道你明不明白我的心意，也许需要时间，也许需要一点缘分，也许需要很多努力，但我都会坚定不移的选择你，为了你做出改变和努力，直到你能欣然接受我！',
      '生日快乐宝子！一定要天天开心，希望今晚不要再失眠喽，早点睡啦，晚安！'
    ],
    closing:""
  };
}
