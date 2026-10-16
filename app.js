import { createDraw, consumeReveal } from './draw.mjs';
import { updateLayout, stopLayoutMotion, fadeIn } from './layout.mjs';
const messages = {
 en: {
  eyebrow:'YOUR SECRET SANTA, SORTED',headline:'A little mystery.<br>A lot of <em>joy.</em>',intro:'Gather your favorite people. Pass the phone.<br>Let a little Christmas magic do the rest.',illustrationNote:'a little surprise for everyone ♡',promise:'Good gifts start with a little secret.',step1Title:'Make your merry list',step1:'Add everyone joining the fun.',step2Title:'Pass, peek, keep it secret',step2:'One phone. One private reveal at a time.',step3Title:'Make someone’s day',step3:'Nobody draws their own name. Promise.',footer:'Less organizing. More merry.',footerRight:'Made for little Christmas moments',
  list:'THE MERRY LIST',people:n=>`${n} ${n===1?'person':'people'}`,setupTitle:'Who’s joining the fun?',setupDescription:'Add your people. We’ll take care of the surprises.',placeholder:'e.g. Alex, Sam, Taylor',inputLabel:'Participant names',add:'Add +',inputHelp:'Press Enter to add. Commas work for a whole group.',emptyTitle:'Your merry little crew goes here',emptyText:'Start with two people. The more, the merrier.',start:'Let’s draw names',min:'Add at least 2 people to begin',privacy:'No self-draws. No peeking at past reveals.',duplicate:'That name is already on the list. Add a surname or nickname to tell people apart.',tooLong:'Keep each name to 40 characters or fewer.',max:'The list is full! You can add up to 50 people.',emptyError:'Add a name first.',remove:name=>`Remove ${name}`,added:n=>`${n} ${n===1?'person added':'people added'}.`,
  handoff:'PASS THE PHONE',turn:(n,total)=>`${n} of ${total}`,pass:'Pass the phone to',handoffDescription:'Only this person should tap the button below.<br>Everyone else, look away!',reveal:name=>`I’m ${name}. Reveal my person`,revealButton:'That’s me. Reveal my person',wait:'A little handoff pause…',handoffPrivacy:'Previous reveals are cleared. Keep the surprise alive.',secret:'FOR YOUR EYES ONLY',yourGift:'You’re the Secret Santa for',secretTag:'YOUR LITTLE SECRET',secretDescription:'Remember this name and make their day.<br>Once you move on, this reveal is gone for good.',next:'Got it! Next person',finish:'Got it! Finish the draw',secretPrivacy:'Tap below before passing the phone.',doneLabel:'ALL WRAPPED UP',doneTitle:'Let the gifting begin.',doneDescription:'Everyone has their person. Now for the fun part:<br>finding a gift that feels just right.',donePrivacy:'All pairings have been cleared. Your secrets stay yours.',again:'Start a new merry list',resume:'Welcome back. Past reveals stay hidden; continue with the next person.',storage:'This browser cannot save progress. Keep this page open until everyone has drawn.',
 },
 pl: {
  eyebrow:'MIKOŁAJKOWE LOSOWANIE BEZ STRESU',headline:'Trochę tajemnicy.<br>Mnóstwo <em>radości.</em>',intro:'Zbierz ulubione osoby. Podaj telefon dalej.<br>Resztą zajmie się świąteczna magia.',illustrationNote:'mała niespodzianka dla każdego ♡',promise:'Dobry prezent zaczyna się od małej tajemnicy.',step1Title:'Zbierz świąteczną ekipę',step1:'Dodaj wszystkich uczestników zabawy.',step2Title:'Podaj, sprawdź, zachowaj sekret',step2:'Jeden telefon. Każdy odkrywa swoje losowanie.',step3Title:'Spraw komuś radość',step3:'Nikt nie wylosuje siebie. Obiecujemy.',footer:'Mniej organizowania. Więcej radości.',footerRight:'Na małe świąteczne chwile',
  list:'ŚWIĄTECZNA LISTA',people:n=>`${n} ${n===1?'osoba':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'osoby':'osób'}`,setupTitle:'Kto dołącza do zabawy?',setupDescription:'Dodaj swoją ekipę. My zadbamy o niespodzianki.',placeholder:'np. Ania, Kuba, Ola',inputLabel:'Imiona uczestników',add:'Dodaj +',inputHelp:'Enter dodaje imię. Całą grupę oddziel przecinkami.',emptyTitle:'Tu pojawi się Twoja świąteczna ekipa',emptyText:'Zacznij od dwóch osób. Im więcej, tym weselej.',start:'Losujemy imiona',min:'Dodaj co najmniej 2 osoby, aby zacząć',privacy:'Nikt nie losuje siebie. Poprzednie wyniki są ukryte.',duplicate:'To imię już jest na liście. Dodaj nazwisko lub pseudonim, aby odróżnić osoby.',tooLong:'Każde imię może mieć maksymalnie 40 znaków.',max:'Lista jest pełna! Możesz dodać do 50 osób.',emptyError:'Najpierw wpisz imię.',remove:name=>`Usuń: ${name}`,added:n=>`Dodano: ${n}.`,
  handoff:'PODAJ TELEFON',turn:(n,total)=>`${n} z ${total}`,pass:'Podaj telefon tej osobie:',handoffDescription:'Tylko ta osoba powinna nacisnąć przycisk poniżej.<br>Reszta ekipy odwraca wzrok!',reveal:name=>`To ja, ${name}. Pokaż moje losowanie`,revealButton:'To ja. Pokaż moje losowanie',wait:'Chwila na przekazanie telefonu…',handoffPrivacy:'Poprzednie wyniki są usunięte. Niech to będzie sekret.',secret:'TYLKO DLA TWOICH OCZU',yourGift:'Twój prezent trafi do:',secretTag:'TWÓJ MAŁY SEKRET',secretDescription:'Zapamiętaj to imię i spraw tej osobie radość.<br>Po przejściu dalej ten wynik zniknie na dobre.',next:'Mam! Następna osoba',finish:'Mam! Zakończ losowanie',secretPrivacy:'Naciśnij przycisk, zanim podasz telefon dalej.',doneLabel:'WSZYSTKO GOTOWE',doneTitle:'Czas na prezenty.',doneDescription:'Każdy zna już swoją osobę. Teraz najlepsza część:<br>znaleźć prezent, który wywoła uśmiech.',donePrivacy:'Wszystkie pary zostały usunięte. Sekrety zostają z Wami.',again:'Utwórz nową świąteczną listę',resume:'Miło Cię znów widzieć. Poprzednie wyniki są ukryte. Czas na kolejną osobę.',storage:'Ta przeglądarka nie zapisuje postępu. Nie zamykaj strony, dopóki wszyscy nie wylosują.',
 }
};
const app = document.querySelector('#app');
const storageKey='merry-little-draw-v1';
let lang=navigator.language?.toLowerCase().startsWith('pl')?'pl':'en';
let names=[], state=null, revealed=null, stage='setup', timer=null, confettiFrame=null, resumed=false, storageAvailable=true;
try {
 const preference=localStorage.getItem('merry-language');if(messages[preference])lang=preference;
 const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');
 if(saved && Array.isArray(saved.pending) && saved.total>=2 && saved.total<=50 && Number.isFinite(saved.completed) && saved.completed+saved.pending.length===saved.total && Number.isFinite(saved.readyAt) && saved.pending.every(p=>typeof p.giver==='string' && typeof p.recipient==='string' && p.giver.length<=40 && p.recipient.length<=40)) {state=saved;stage=state.pending.length?'handoff':'done';resumed=true;}
 sessionStorage.setItem('merry-test','1');sessionStorage.removeItem('merry-test');
} catch {storageAvailable=false;}
const t=(key,...args)=>typeof messages[lang][key]==='function'?messages[lang][key](...args):messages[lang][key];
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lock='<svg class="lock-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5 7V5a3 3 0 016 0v2M4 7h8v7H4z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>';
const phone='<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="15" y="5" width="20" height="37" rx="4" stroke="#527b60" stroke-width="2"/><path d="M23 36h4M21 10h8M5 20h16m-5-5 5 5-5 5M40 21h4" stroke="#527b60" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const gift='<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="8" y="20" width="32" height="22" rx="2" stroke="#b47760" stroke-width="2"/><path d="M5 16h38v10H5zM24 16v26m0-26c-16 0-19-13-11-12 6 0 11 12 11 12Zm0 0c16 0 19-13 11-12-6 0-11 12-11 12Z" stroke="#b47760" stroke-width="2" stroke-linejoin="round"/></svg>';
function persist(){try {if(state)sessionStorage.setItem(storageKey,JSON.stringify(state));else sessionStorage.removeItem(storageKey);}catch {storageAvailable=false;}}
function setLanguage(next){lang=next;try{localStorage.setItem('merry-language',lang);}catch{}render();}
document.querySelectorAll('[data-lang]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.lang)));
function actionButton(id, label, trailing = '↗', disabled = false) {
 return `<button class="primary" id="${id}" ${disabled ? 'disabled' : ''}><span class="button-label">${escapeHTML(label)}</span><span class="button-arrow" aria-hidden="true">${trailing}</span></button>`;
}
function actions(button, message, progress = 0) {
 return `<div class="panel-actions" data-layout="actions">${button}<div class="progress-track" aria-hidden="true"><span style="width:${progress}%"></span></div><p class="privacy-note">${lock}<span>${escapeHTML(message)}</span></p></div>`;
}
function shell(tag, badge, content, controls) {
 return `<div class="stage ${stage === 'reveal' ? 'secret' : stage === 'done' ? 'done' : ''}"><div class="panel-top"><span class="section-tag">${stage === 'setup' ? '✳' : '✦'} ${t(tag)}</span><span class="round-badge">${badge}</span></div>${content}${controls}</div>`;
}
function personHeading(name) {
 return `<h2 class="recipient-name ${Array.from(name).length > 18 ? 'is-long' : ''}" tabindex="-1">${escapeHTML(name)}</h2>`;
}
function render() {
 updateLayout(() => {
  const draft = app.querySelector('#name-input')?.value || '';
  const rosterScroll = app.querySelector('.participants')?.scrollTop || 0;
  clearInterval(timer);
  document.documentElement.lang = lang;
  document.title = lang === 'pl' ? 'Merry Little Draw · Mikołajki' : 'Merry Little Draw · Secret Santa';
  document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  document.querySelectorAll('[data-lang]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === lang)));
  if (stage === 'setup') {
   renderSetup();
   app.querySelector('#name-input').value = draft;
   const list = app.querySelector('.participants');
   if (list) list.scrollTop = rosterScroll;
  } else if (stage === 'handoff') renderHandoff();
  else if (stage === 'reveal') renderReveal();
  else renderDone();
 });
}
function renderSetup() {
 app.innerHTML = shell('list', t('people', names.length),
  `<div class="setup-content" data-layout="content"><h2 class="panel-title">${t('setupTitle')}</h2><p class="panel-description">${t('setupDescription')}</p><form class="entry-form"><label class="visually-hidden" for="name-input">${t('inputLabel')}</label><input id="name-input" name="names" autocomplete="off" placeholder="${t('placeholder')}" maxlength="2200"><button class="add-button" type="submit">${t('add')}</button></form><p class="input-help">${t('inputHelp')}</p><p id="error" class="error" role="alert"></p><div id="roster"></div></div>`,
  actions(actionButton('start', t('start')), t('privacy'))) + '<span id="add-status" class="visually-hidden" role="status"></span>';
 renderRoster(false);
 app.querySelector('form').addEventListener('submit', e => { e.preventDefault(); addNames(); });
 app.querySelector('#start').addEventListener('click', start);
}
function renderRoster(animate = true, scrollToEnd = false) {
 const previousScroll = app.querySelector('.participants')?.scrollTop || 0;
 const update = () => {
  app.querySelector('.round-badge').textContent = t('people', names.length);
  const roster = app.querySelector('#roster');
  if (names.length) {
   roster.innerHTML = `<ul class="participants">${names.map((name, i) => `<li class="person" data-person="${escapeHTML(name)}"><span class="avatar" aria-hidden="true">${escapeHTML(Array.from(name)[0].toLocaleUpperCase(lang))}</span><span class="person-name">${escapeHTML(name)}</span><button type="button" class="remove" data-remove="${i}" aria-label="${escapeHTML(t('remove', name))}">×</button></li>`).join('')}</ul>`;
   const list = roster.querySelector('.participants');
   list.scrollTop = scrollToEnd ? list.scrollHeight : previousScroll;
   roster.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.remove);
    names.splice(index, 1);
    renderRoster();
    const target = app.querySelector(`[data-remove="${Math.min(index, names.length - 1)}"]`);
    (target || app.querySelector('#name-input')).focus({ preventScroll: true });
   }));
  } else roster.innerHTML = `<div class="empty"><span class="empty-icon" aria-hidden="true">✧</span><strong>${t('emptyTitle')}</strong><p>${t('emptyText')}</p></div>`;
  const startButton = app.querySelector('#start');
  startButton.disabled = names.length < 2;
  startButton.setAttribute('aria-label', t(names.length < 2 ? 'min' : 'start'));
 };
 if (animate) updateLayout(update); else update();
}
function addNames(){
 const input=app.querySelector('#name-input');const entries=input.value.split(/[,;\n]+/).map(s=>s.trim().replace(/\s+/g,' ')).filter(Boolean);const error=app.querySelector('#error');error.textContent='';
 const fail = key => { error.textContent = t(key); fadeIn(error); };
 if(!entries.length){fail('emptyError');return;}
 const known=new Set(names.map(n=>n.normalize('NFC').toLocaleLowerCase(lang)));let issue=null;
 for(const name of entries){const key=name.normalize('NFC').toLocaleLowerCase(lang);if(known.has(key)){issue='duplicate';break;}if(name.length>40){issue='tooLong';break;}known.add(key);}
 if(names.length+entries.length>50)issue='max';if(issue){fail(issue);return;}
 names.push(...entries);input.value='';renderRoster(true, true);app.querySelector('#add-status').textContent=t('added',entries.length);input.focus({preventScroll:true});
}
function start(){if(names.length<2||stage!=='setup')return;state={pending:createDraw(names),total:names.length,completed:0,readyAt:Date.now()+5000};names=[];stage='handoff';persist();render();focusStage();}
function renderHandoff() {
 const person = state.pending[0].giver;
 const note = !storageAvailable ? t('storage') : resumed ? t('resume') : t('handoffPrivacy');
 app.innerHTML = shell('handoff', t('turn', state.completed + 1, state.total),
  `<div class="stage-body" data-layout="content"><div class="stage-icon">${phone}</div><span class="secret-label placeholder" aria-hidden="true"></span><p class="stage-eyebrow">${t('pass')}</p>${personHeading(person)}<p class="stage-description">${t('handoffDescription')}</p></div>`,
  actions(actionButton('reveal', t('wait'), '↗', true), note, state.completed / state.total * 100)) + '<p class="visually-hidden" id="timer-status" role="status"></p>';
 const button = app.querySelector('#reveal');
 let lastRemaining = null;
 const update = () => {
  const remaining = Math.max(0, Math.ceil((state.readyAt - Date.now()) / 1000));
  if (remaining === lastRemaining) return;
  const wasWaiting = lastRemaining > 0;
  lastRemaining = remaining;
  button.disabled = remaining > 0;
  button.setAttribute('aria-label', remaining > 0 ? t('wait') : `${t('revealButton')} (${person})`);
  button.innerHTML = `<span class="button-label">${escapeHTML(remaining > 0 ? t('wait') : t('revealButton'))}</span>${remaining > 0 ? `<span class="countdown-pill" aria-hidden="true">${remaining}</span>` : '<span class="button-arrow" aria-hidden="true">↗</span>'}`;
  if (!remaining) {
   clearInterval(timer);
   app.querySelector('#timer-status').textContent = t('reveal', person);
   if (wasWaiting) fadeIn(button.querySelector('.button-label'));
  }
 };
 update();
 if (Date.now() < state.readyAt) timer = setInterval(update, 150);
 button.addEventListener('click', reveal);
}
function reveal() {
 if (stage !== 'handoff') return;
 const pair = consumeReveal(state);
 if (!pair) return;
 persist(); revealed = pair; resumed = false; stage = 'reveal';
 render(); focusStage(); celebrate();
}
function renderReveal() {
 app.innerHTML = shell('secret', t('turn', state.completed, state.total),
  `<div class="stage-body" data-layout="content"><div class="stage-icon">${gift}</div><span class="secret-label">${t('secretTag')}</span><p class="stage-eyebrow">${t('yourGift')}</p>${personHeading(revealed.recipient)}<p class="stage-description">${t('secretDescription')}</p></div>`,
  actions(actionButton('next', t(state.pending.length ? 'next' : 'finish'), '→'), t('secretPrivacy'), state.completed / state.total * 100));
 app.querySelector('#next').addEventListener('click', next);
}
function next() {
 if (stage !== 'reveal') return;
 revealed = null; stopConfetti(); state.readyAt = Date.now() + 5000;
 stage = state.pending.length ? 'handoff' : 'done';
 persist(); render(); focusStage();
}
function renderDone() {
 app.innerHTML = shell('doneLabel', t('people', state.total),
  `<div class="stage-body" data-layout="content"><div class="stage-icon" aria-hidden="true">✦</div><div class="mini-stars" aria-hidden="true">✧ ✦ ✧</div><p class="stage-eyebrow placeholder" aria-hidden="true"></p><h2 class="panel-title" tabindex="-1">${t('doneTitle')}</h2><p class="stage-description">${t('doneDescription')}</p></div>`,
  actions(actionButton('again', t('again')), t('donePrivacy'), 100));
 app.querySelector('#again').addEventListener('click', () => {
  state = null; names = []; revealed = null; resumed = false; stage = 'setup';
  persist(); render(); app.querySelector('#name-input').focus({ preventScroll: true });
 });
}
function focusStage() {
 app.querySelector('h2')?.focus({ preventScroll: true });
}
// No draw step is ever pushed into browser history. A cached page must restore
// only the forward state; an on-screen reveal is consumed on leaving the page.
window.addEventListener('pagehide',()=>{if(stage==='reveal')next();stopConfetti();stopLayoutMotion();document.body.classList.add('page-hidden');});
window.addEventListener('pageshow',event=>{document.body.classList.remove('page-hidden');if(event.persisted){revealed=null;stage=state?(state.pending.length?'handoff':'done'):'setup';render();}});
document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('page-hidden',document.hidden);if(document.hidden){stopConfetti();stopLayoutMotion();}});
function stopConfetti(){cancelAnimationFrame(confettiFrame);const canvas=document.querySelector('#confetti');canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);}
function celebrate(){
 stopConfetti();if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const canvas=document.querySelector('#confetti'),ctx=canvas.getContext('2d');const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
 const colors=['#efb1a0','#315f4d','#d6b36b','#96b599','#cec1db'];const particles=Array.from({length:135},()=>({x:w/2,y:h*.48,vx:(Math.random()-.5)*18,vy:-Math.random()*16-4,spin:Math.random()*.2-.1,angle:Math.random()*Math.PI,size:4+Math.random()*5,color:colors[Math.floor(Math.random()*colors.length)]}));const startTime=performance.now();let prev=startTime;
 const frame=now=>{const delta=Math.min((now-prev)/16.67,2);prev=now;ctx.clearRect(0,0,w,h);ctx.globalAlpha=Math.min(1,(3800-(now-startTime))/700);for(const p of particles){p.vy+=.18*delta;p.x+=p.vx*delta;p.y+=p.vy*delta;p.vx*=Math.pow(.992,delta);p.angle+=p.spin*delta;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.6);ctx.restore();}if(now-startTime<3800)confettiFrame=requestAnimationFrame(frame);else{ctx.clearRect(0,0,w,h);ctx.globalAlpha=1;}};
 confettiFrame=requestAnimationFrame(frame);
}
render();
