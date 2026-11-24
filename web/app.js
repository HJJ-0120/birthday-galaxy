"use strict";

const CARD_COUNT = 64;
const DURATION_MS = 5000;
const HEART_PEAK_SCALE = 1.045;
const INVITATION_DIGEST = "09e3f512baaf4a6af12f603c91a8939669701372a75f97c2becea9bafae0ccbd";
const palettes = [
  ["#fff9fa", "#f5dce5", "#b46b89"],
  ["#fcfaff", "#e7dff5", "#9275b7"],
  ["#f8fcff", "#ddecf7", "#6e99b5"],
  ["#f8fffb", "#dcefe6", "#6d9a88"],
  ["#fffcf5", "#f5e8cc", "#b79961"],
  ["#fff9f6", "#f6e0d5", "#bb8b76"],
];
const messages = [
  "希望你永远做自己", "愿你所愿，皆能如愿", "新的一岁，闪闪发光",
  "愿快乐与你不期而遇", "愿你被这个世界温柔以待", "每一天，都值得被珍藏",
  "愿你眼里，始终有光", "祝你自由，也祝你勇敢", "愿生活，满是小确幸",
  "慢慢长大，好好爱自己", "愿你一路繁花，岁岁欢喜", "愿你永远热烈而明亮",
  "愿所有美好，都奔向你", "愿你平安喜乐，万事胜意", "生日快乐，今天你最大",
];

// 计算半边后按等弧长取点，再接上左半边；顺序始终为右下、左上。
function heartPoints(count, width, height, cardWidth, cardHeight) {
  const outline = Array.from({ length: 601 }, (_, i) => {
    const t = i / 600 * Math.PI;
    return [16 * Math.sin(t) ** 3,
      -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t))];
  });
  const minY = Math.min(...outline.map(p => p[1]));
  const maxY = Math.max(...outline.map(p => p[1]));
  const centerY = (minY + maxY) / 2;
  // 让轮廓充分展开；给心跳最大幅度预留空间，始终保持两轴同比缩放。
  const scale = Math.max(0, Math.min((width * .96 / HEART_PEAK_SCALE - cardWidth) / 32,
    (height * .99 / HEART_PEAK_SCALE - cardHeight) / (maxY - minY)));
  const path = outline.map(([x, y]) => [width/2 + x*scale, height/2 + (y-centerY)*scale]);
  const distances = [0];
  for (let i = 1; i < path.length; i++) {
    distances.push(distances[i-1] + Math.hypot(path[i][0]-path[i-1][0], path[i][1]-path[i-1][1]));
  }
  const right = [];
  let segment = 1;
  for (let i = 0; i < count/2; i++) {
    const target = distances.at(-1) * (i+.5) / (count/2);
    while (segment < distances.length-1 && distances[segment] < target) segment++;
    const span = distances[segment] - distances[segment-1];
    const mix = span ? (target-distances[segment-1])/span : 0;
    right.push(path[segment-1].map((value, axis) => value + (path[segment][axis]-value)*mix));
  }
  return [...right, ...right.map(([x,y]) => [width-x,y]).reverse()];
}

const stage = document.getElementById("stage");
const cards = document.getElementById("cards");
const experience = document.getElementById("experience");
const endScreen = document.getElementById("end-screen");
const controls = document.getElementById("controls");
const status = document.getElementById("status");
const introScreen = document.getElementById("intro-screen");
const cakeScreen = document.getElementById("cake-screen");
const cakeEntry = document.getElementById("enter-cake");
const identityScreen = document.getElementById('identity-screen');
let recipient = null;
let cake = null;
let cakeNavigation = 0;
let frame = 0;
let generation = 0;
let nodes = [];
let positions = [];
let cardWidth = 194;
let cardHeight = 120;
let active = false;
let heartbeatTimer = 0;
let cardInteraction=null;

const BACKGROUND_MUSIC = { src: "audio/燃-颜人中.mp3", title: "燃 - 颜人中" };
const BIRTHDAY_MUSIC = { src: "audio/生日快乐.mp3", title: "生日快乐" };
let backgroundAudio = null;
let musicSource = "";
let musicEnabled = false;
let musicWanted = false;
let musicRequest = 0;
let musicFade = 0;

function updateMusicButton() {
  const track = cakeScreen.hidden ? BIRTHDAY_MUSIC : BACKGROUND_MUSIC;
  for (const id of ["cake-music", "music"]) {
    const button = document.getElementById(id);
    button.hidden = id === "cake-music" ? cakeScreen.hidden : experience.hidden;
    button.setAttribute("aria-pressed", String(musicWanted));
    button.setAttribute("aria-busy", String(musicWanted && !musicEnabled));
    button.title = musicWanted ? `关闭音乐 · ${track.title}` : `播放 ${track.title}`;
    button.setAttribute("aria-label", button.title);
  }
  document.getElementById("music-divider").hidden = experience.hidden;
  document.getElementById("music-label").textContent = musicWanted ? "音乐开" : "音乐关";
}

function musicVolume(){return document.querySelector('#wish-letter-dialog[open]') ? .16 : .38;}
function fadeMusicTo(target,duration,request=musicRequest){
  cancelAnimationFrame(musicFade);if(!backgroundAudio)return;
  const start=backgroundAudio.volume,started=performance.now();
  function tick(now){
    if(request!==musicRequest)return;const t=Math.min(1,(now-started)/duration),ease=t*t*(3-2*t);
    backgroundAudio.volume=start+(target-start)*ease;
    if(t<1)musicFade=requestAnimationFrame(tick);
    else if(target===0&&!musicWanted){backgroundAudio.pause();musicEnabled=false;updateMusicButton();}
  }
  musicFade=requestAnimationFrame(tick);
}
async function setMusic(enabled,immediate=false) {
  const request = ++musicRequest;
  const track = cakeScreen.hidden ? BIRTHDAY_MUSIC : BACKGROUND_MUSIC;
  const sceneVisible = recipient && identityScreen.hidden && (!introScreen.hidden || !experience.hidden || !cakeScreen.hidden);
  musicWanted=Boolean(enabled&&sceneVisible&&!document.hidden);cancelAnimationFrame(musicFade);
  if (!musicWanted) {
    musicEnabled = false;
    if (backgroundAudio){
      if(immediate||document.hidden||backgroundAudio.paused){backgroundAudio.volume=0;backgroundAudio.pause();}
      else fadeMusicTo(0,260,request);
    }
    updateMusicButton();
    return;
  }
  updateMusicButton();
  try {
    if (!backgroundAudio) {
      backgroundAudio = new Audio();
      backgroundAudio.loop = true;
      backgroundAudio.volume = 0;
      backgroundAudio.preload = "none";
    }
    if (musicSource !== track.src || backgroundAudio.error) {
      backgroundAudio.pause();
      backgroundAudio.src = track.src;
      backgroundAudio.volume = 0;
      musicSource = track.src;
      musicEnabled = false;
    }
    // Call play inside the original click handler, before any await, for mobile browsers.
    await backgroundAudio.play();
    if (request !== musicRequest){if(!musicWanted)backgroundAudio.pause();return;}
    musicEnabled = true;
    fadeMusicTo(musicVolume(),1400,request);
    updateMusicButton();
  } catch {
    if(request!==musicRequest)return;
    musicWanted=false;
    musicEnabled = false;
    updateMusicButton();
    if (!cakeScreen.hidden) document.getElementById('workshop-status').textContent='音乐暂时未能开启，点击音符可重试';
  }
}

function layout() {
  if (experience.hidden) return;
  const { width, height } = stage.getBoundingClientRect();
  // 卡片略收窄，让爱心的内圈更宽，避免中间被厚厚一圈卡片挤住。
  cardWidth = width < 580 ? Math.max(84, Math.min(116, width * .27)) : Math.min(184, Math.max(144, width * .125));
  cardHeight = Math.round(cardWidth * .62);
  stage.style.setProperty("--card-width", `${cardWidth}px`);
  stage.style.setProperty("--card-height", `${cardHeight}px`);
  positions = heartPoints(CARD_COUNT, width, height, cardWidth, cardHeight);
  nodes.forEach((node, index) => positionCard(node, index));
  cardInteraction?.relayout();
}

function positionCard(node, index) {
  const offset=cardInteraction?.offsetFor(node)||{x:0,y:0};
  node.style.left = `${positions[index][0] - cardWidth/2+offset.x}px`;
  node.style.top = `${positions[index][1] - cardHeight/2+offset.y}px`;
}

function createCard(index) {
  const node = document.createElement("article");
  node.className = "wish-card";
  const palette = palettes[index % palettes.length];
  ["--paper-top", "--paper-bottom", "--accent"].forEach((property, i) => node.style.setProperty(property, palette[i]));
  node.style.zIndex = index + 1;
  node.innerHTML = '<div class="card-header"><span class="card-heart" aria-hidden="true">♡</span><span class="card-label">一份小小的祝福</span><button class="card-close" type="button" aria-label="收起这张祝福卡片">×</button></div><p class="card-message"></p><span class="card-footer" aria-hidden="true">HAPPY BIRTHDAY</span>';
  const namedMessages = recipient ? [
    `${recipient.name}同学生日快乐鸭！`,
    "无伤痛无疾病",
    "20岁，依旧继续闪闪发光！",
    "一定一定要幸福！",
    "所愿皆所成",
    "不要那么忙啦",
    "暴富暴富暴富！！！",
    "想和你一起散步聊天",
    "愿生活里满是小确幸",
    "要好好爱自己！",
    messages[10],
    "愿你永远保持阳光而热烈！",
    "未来有家人、有朋友、有我",
    "保持热爱，奔赴山海！",
    "不会再被爱情所伤！",
  ] : messages;
  const message=namedMessages[index % namedMessages.length];
  node.querySelector(".card-message").textContent = message;
  node.classList.toggle('personal-long',Array.from(message).length>19);
  node.title=message;
  cardInteraction?.register(node,index);
  positionCard(node, index);
  cards.append(node);
  nodes.push(node);
  // 先绘制初始帧，让每张新卡片轻轻出现。
  const current = generation;
  requestAnimationFrame(() => { if (current === generation && active) node.classList.add("visible"); });
}

function replay() {
  if(!recipient){document.getElementById('birthday-name').focus({preventScroll:true});return;}
  cakeNavigation++;
  cake?.pause();
  cakeScreen.hidden = true;
  cakeEntry.hidden = true;
  cancelAnimationFrame(frame);
  clearTimeout(heartbeatTimer);
  cardInteraction?.reset();cardInteraction?.setReady(false);
  cards.classList.remove("beating");
  generation++;
  active = true;
  introScreen.hidden = true;
  document.body.classList.remove("awaiting-start");
  document.querySelector(".page-header").inert = false;
  document.querySelector(".page-header").hidden = false;
  experience.inert = false;
  endScreen.hidden = true;
  experience.hidden = false;
  controls.hidden = false;
  setMusic(true);
  cards.replaceChildren();
  nodes = [];
  status.textContent = "我想把每一份美好，慢慢送给你";
  layout();
  let started = null;
  function tick(now) {
    if (!active) return;
    started ??= now;
    const progress = Math.min(1, (now-started)/DURATION_MS);
    const target = Math.min(CARD_COUNT, Math.floor(progress*(CARD_COUNT-1))+1);
    while (nodes.length < target) createCard(nodes.length);
    if (progress < 1) frame = requestAnimationFrame(tick);
    else {
      status.textContent = `64 份小小的心意，都送给${recipient.name}的${recipient.birthdayAge}岁生日`;
      const current = generation;
      // 等最后一张卡片的入场过渡完成，再启动整体心跳。
      heartbeatTimer = setTimeout(() => {
        if (active && current === generation) {
          cards.classList.add("beating");
          cardInteraction?.setReady(true);
          status.textContent = "宝子，上面的卡片是可以拖出来的哦";
          cakeEntry.hidden = false;
        }
      }, 260);
    }
  }
  frame = requestAnimationFrame(tick);
}

function exit() {
  cardInteraction?.reset();cardInteraction?.setReady(false);
  cakeNavigation++;
  cake?.dispose();
  cake = null;
  cakeScreen.hidden = true;
  cakeEntry.disabled = false;
  cakeEntry.hidden = true;
  cancelAnimationFrame(frame);
  clearTimeout(heartbeatTimer);
  cards.classList.remove("beating");
  generation++;
  active = false;
  setMusic(false,true);
  cards.replaceChildren();
  nodes = [];
  experience.hidden = true;
  controls.hidden = true;
  endScreen.hidden = false;
  document.getElementById("restart").focus({ preventScroll: true });
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

async function enterCake() {
  if (!recipient || cakeEntry.disabled || cakeEntry.hidden || !active) return;
  const navigation = ++cakeNavigation;
  cakeEntry.disabled = true;
  experience.hidden = true;
  document.querySelector(".page-header").hidden = true;
  controls.hidden = true;
  cards.classList.remove("beating");
  cakeScreen.hidden = false;
  // 直接响应进入蛋糕页的点击，在加载场景前启动音乐。
  setMusic(true);
  document.getElementById("back-heart").focus({ preventScroll: true });
  try {
    if (!cake) {
      document.getElementById("workshop-status").textContent = "正在把星光，变成你的蛋糕…";
      const { createWorkshop: createCake } = await import("./workshop.js?v=16");
      if (navigation !== cakeNavigation) return;
      const created = await createCake(document.getElementById("workshop-canvas"));
      if (navigation !== cakeNavigation) { created.dispose(); return; }
      cake = created;
    }
    cake.resume();
  } catch (error) {
    if (navigation === cakeNavigation) {
      document.getElementById("workshop-status").textContent = "蛋糕暂时未能加载，请返回爱心后重试（请使用本地网页地址）";
      console.error("Cake initialization failed:", error);
    }
  } finally {
    if (navigation === cakeNavigation) cakeEntry.disabled = false;
  }
}

function backToHeart() {
  cakeNavigation++;
  cake?.dispose();
  cake = null;
  cakeScreen.hidden = true;
  cakeEntry.disabled = false;
  experience.hidden = false;
  document.querySelector(".page-header").hidden = false;
  controls.hidden = false;
  setMusic(true);
  cards.classList.add("beating");
  layout();
  cakeEntry.focus({ preventScroll: true });
}

function startExperience() {
  if (!recipient || introScreen.hidden) return;
  replay();
  document.getElementById("replay").focus({ preventScroll: true });
}

document.getElementById("start").addEventListener("click", startExperience);
document.getElementById('identity-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const button=document.getElementById('identity-submit'),nameInput=document.getElementById('birthday-name'),dateInput=document.getElementById('birthday-password'),error=document.getElementById('identity-error');
  if(button.disabled)return;button.disabled=true;error.textContent='';nameInput.removeAttribute('aria-invalid');dateInput.removeAttribute('aria-invalid');
  try{
    const name = nameInput.value;
    const code = dateInput.value;
    if (!name || !code) throw new Error('请填写账号和密码。');
    const entry = new TextEncoder().encode(JSON.stringify([name, code]));
    const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', entry));
    const digest = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    if (digest !== INVITATION_DIGEST) {
      nameInput.setAttribute('aria-invalid', 'true');
      throw new Error('账号或密码不正确，请再核对一下。');
    }
    const [profile,interaction]=await Promise.all([import('./birthday-profile.js?v=6'),import('./heart-cards.js?v=1')]);
    const next = profile.createBirthdayProfile(name, '2006.11.25', {year: 2026, month: 11, day: 25});
    profile.setRecipient(next);recipient=next;
    cardInteraction??=interaction.createCardInteraction({cards,stage,getNodes:()=>nodes,getPositions:()=>positions,getCardSize:()=>({width:cardWidth,height:cardHeight}),position:positionCard,onStatus:text=>status.textContent=text});
    document.getElementById('recipient-greeting').textContent=`只送给 ${next.name}`;
    document.getElementById('recipient-heart-note').textContent=`愿你的${next.birthdayAge}岁，自由、明亮、满是欢喜`;
    document.getElementById('intro-description').textContent=`给${next.name}的${next.birthdayAge}岁生日惊喜`;
    document.getElementById('cake-recipient-line').textContent=`${next.name}的${next.birthdayAge}岁生日，愿每一个心愿都有星光回应`;
    document.title=`${next.name}${next.birthdayAge}岁生日快乐`;
    identityScreen.hidden=true;identityScreen.inert=true;introScreen.hidden=false;introScreen.inert=false;dateInput.value='';
    document.body.classList.remove('awaiting-identity');document.getElementById('start').focus({preventScroll:true});
    setMusic(true);
  }catch(reason){
    error.textContent=reason instanceof Error?reason.message:'入口暂未打开成功，请再试一次。';
    const field=nameInput.value.trim()?dateInput:nameInput;field.setAttribute('aria-invalid','true');field.focus({preventScroll:true});
  }finally{button.disabled=false;}
});
document.getElementById("replay").addEventListener("click", replay);
document.getElementById("restart").addEventListener("click", replay);
document.getElementById("exit").addEventListener("click", exit);
cakeEntry.addEventListener("click", enterCake);
document.getElementById("back-heart").addEventListener("click", backToHeart);
document.getElementById("cake-exit").addEventListener("click", exit);
document.getElementById('cake-music').addEventListener('click',()=>setMusic(!musicWanted));
document.getElementById('music').addEventListener('click',()=>setMusic(!musicWanted));
const musicReadingObserver=new MutationObserver(()=>{if(musicWanted&&musicEnabled)fadeMusicTo(musicVolume(),600);});
musicReadingObserver.observe(document.getElementById('wish-letter-dialog'),{attributes:true,attributeFilter:['open']});
document.addEventListener('visibilitychange',()=>{if(document.hidden)setMusic(false,true);});
window.addEventListener('pagehide',()=>setMusic(false,true));
document.getElementById("fullscreen").addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch { status.textContent = "当前浏览器未开启全屏，仍可正常观看祝福"; }
});
document.addEventListener("fullscreenchange", () => {
  document.getElementById("fullscreen-label").textContent = document.fullscreenElement ? "还原" : "全屏";
});
document.addEventListener("keydown", event => {
  if (document.querySelector('dialog[open]')) return;
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target.matches("input, textarea, select")) return;
  if (event.key.toLowerCase() === "r" && introScreen.hidden && cakeScreen.hidden) replay();
  if (event.key === "Escape" && active) {
    if (!cakeScreen.hidden) backToHeart(); else exit();
  }
});
new ResizeObserver(layout).observe(stage);
updateMusicButton();
document.getElementById("intro-title").textContent = "点击开启祝福";
document.getElementById("start-quiet").hidden = true;
document.getElementById("music-divider").hidden = true;
document.getElementById('birthday-name').focus({preventScroll:true});
