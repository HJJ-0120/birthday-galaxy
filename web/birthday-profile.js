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
      `首先要祝你${birthdayAge}岁生日🎂快乐哟！同时也要祝你🌟入职顺利！希望你后面的每一天都能开开心心！无论做啥都会顺顺利利的！未来的日子里会有更多人认识你，有友谊长久的朋友们，当然也会有对你无微不至的恋人始终坚定选择你，陪伴你，给予你独属于他的独一份温柔与偏爱！`,
      '借此机会想跟你说说我的心里话，刚认识几天（其实已经两周了哦），我们似乎还不太了解对方，我本来挺想找你出来散步聊天的，因为你说过最近很忙，所以我不太想过多打扰你。在这里我想向你介绍一下我到底是一个什么“怪”人吧哈哈，如果你想了解的话就继续往下看吧嘿嘿。',
      `咱今天的小寿星，在我看到你今年才${birthdayAge}岁后，我眼中多了一份羡慕和遗憾，羡慕在于你很年轻，有更多试错的机会和时间，可以不顾一切地为自己热爱的人或物付出自己的全部心血；遗憾在于我已不复青春，我会发现相比于以前我变得更加沉稳成熟，会计算做每一件事所带给我的好处与代价，我害怕不确定性、害怕失去自己所在乎的一切，所以尽力去保持内心的“水平”，这也就是为什么之前我急着问你想不想跟我有进一步的进展的主要原因，站在你的视角我也会觉得进展的过于快了，但现在的我就是这样一个“快”人，仅几天甚至几次见面，我就确定了一个人是不是我真正想要交心的，这也就是他们所说的“一见钟情”吧。但是我仍要为之前微信对你的过激发言向你道歉，有些时候我会是急性子，如果会让你感到不舒服，那是我的错！我的本意并不在此，希望我们的关系不要变得尴尬下去。我知道你需要时间去了解对方，不会仓促地确定一段关系，因此后面我会慢慢等，等我们足够了解对方，等到你心里有答案的那一天！`,
      '一不小心讲多了哈哈，我认为我是一个啥样的人呢？心思细腻、不擅长表达自己，但也会为自己喜欢的人付出自己一切的“蠢”人吧。infj以及风象星座的我会为了别人对我散发的一点善意便会开心一整天，只要别人愿意为我付出一点点，我会付出十倍甚至更多。我大概是个讨好型人格吧，容易患得患失，面对喜欢的人我会变得自卑，地位低下，面对突然的冷漠会怀疑自己是不是说错了话或者做错了事。我大概就是个受虐狂吧，忍痛受爱情的苦哈哈。写到这我真的很想你，我想着去习惯每天见不到你的日子，我发现你会留在我的脑海里挥之不去。我不知道我这是咋了。你知道我们已经多久没见面了吗？大概10天3h15min，在这些天里我也想明白了一件事，我想向你表明我的心意（不太正式版）',
      '我喜欢你❤️我喜欢你❤️我喜欢你❤️我不想只是和你做普通朋友！我想我们需要时间去了解，去发现对方的缺点并学会包容。我愿意接受你的一切（包括所有缺点），只要你不推开我，我会一直坚定的选择你直到被你拒绝。在我不主动找你的时候，不是不想和你分享我的生活，而是不知道在你的心里我到底重不重要，我需要的是对方的足够坚定，如果不被需要我会主动离开，我不愿入情太深、伤的很惨。你说过你更喜欢主动一点的人，我虽然现在对你表现的不够主动，但我希望在你不忙的时候可以给我们很多见面的机会，随着我们慢慢了解，你会发现不一样的我，会为了你变得更加主动，愿意为你而有所改变！我之前说过我虽然不擅表达，但我是一个行动派，我会牢牢你说过的话，你的兴趣爱好，你的饮食习惯，会突然地为你准备小惊喜或者小惊吓哈哈。我愿意为你迈出一亿步，只希望你可以向我迈出一小步！希望你可以给我这个机会（狗狗眼望着你）',
      '思考了很久，才决定为你写这一封也许不太合适的信。其实还有很多话仍在我心里没告诉你，我很希望能当面讲给你听！此刻我不知道你明不明白我的心意，也许需要时间，也许需要一点缘分，也许需要很多努力，但我都会坚定不移的选择你！为了你做出改变和努力，直到你能欣然接受我！',
      '最后，生日快乐宝子！一定要天天开心！希望今晚不要再失眠喽，早点睡啦，晚安！'
    ],
    closing:""
  };
}
