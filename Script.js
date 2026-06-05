const TRANSITION_IMAGES = [
    './GimpFaili/Schizophrenia1.png',
    './GimpFaili/Schizophrenia2.png',
    './GimpFaili/Schizophrenia3.png',
    './GimpFaili/Schizophrenia4.png',
    './GimpFaili/Schizophrenia5.png',
    './GimpFaili/Schizophrenia6.png',
    './GimpFaili/Schizophrenia7.png',
];
  
  const state = {
    day: 1,
    bones: 1000,
    proles: 15,
    controllers: 2,
    legions: 0,
    machineTier: 1,
    safetyTier: 1,
  };
  
  // Hujņa, kas notiks
  let dayEvents = [];
  
  // notikumi
  // notikumam var būt:
  //   condition(s)  -> nosacījumi
  //   onEnter(s)    -> funkcija, kas tiek izsaukta pirms spēlētājs izvēlas opciju.
  //   options[]     -> opcijas
  const eventPool = [
    {
      name: "Starvation",
      desc: "Supplies are running low. Theres northing left for the workers to eat.",
      options: [
        {
          text: "Break down bones into a paste for the proles.",
          requires: s => ({ ok: s.bones >= Math.ceil(s.proles * 2), reason: "Need " + Math.ceil(s.proles * 2) + "+ bones" }),
          fn: s => { s.bones -= Math.ceil(s.proles * 2); addLog("Bones spent. Workers - ready to live for one more day"); }
        },
        { text: "Let them starve. They should be working, not whinning", fn: s => { s.proles = Math.max(0, s.proles - Math.ceil(s.proles * 0.3)); addLog("Many perished."); } }
      ]
    },
    {
      name: "Viral cancer",
      desc: "A disease spreads through the quarters.",
      onEnter: s => { addLog("Mucus and bile line the walls.....doesn't look sanitary in the slightest."); },
      options: [
        {
          text: "Quarantine and treat the ill (−500 bones)",
          requires: s => ({ ok: s.bones >= 500, reason: "Need more bones" }),
          fn: s => { s.bones -= 500; addLog("The plague is under control for now. Get back to work."); }
        },
        { text: "Walk it off.", fn: s => {
          
          if (Math.random() > 0.5){
            s.proles = Math.max(0, s.proles - Math.ceil(s.proles * 0.5)); addLog("Ignorance."); }
          s.proles = Math.max(0, s.proles - Math.ceil(s.proles * 0.1)); addLog("Ehh, could have been worse."); 
        
        
        } },
        {
          text: "Execute the diseased.",
          requires: s => ({ ok: 1 == 1, reason: "There is no fucking reason why this should be false." }),
          fn: s => { s.proles = Math.max(0, s.proles - Math.ceil(s.proles * 0.25)); addLog("Spread Cauterised."); }
        }
      ]
    },
    {
      name: "Crisis",
      desc: "The workers are discontent. Many break out into hysteria. Action must be taken before this gets out of control.",
      options: [
        {
          text: "How about 50 bones for each of them?",
          requires: s => ({ ok: s.bones >= s.proles * 50, reason: "Bones don't grow on trees" }),
          fn: s => { s.bones -= s.proles * 50; addLog("They should be happy for now."); }
        },
        {
          text: "Send controllers to diffuse the situation",
          requires: s => ({ ok: s.controllers >= 1, reason: "Need controllers" }),
          fn: s => { s.controllers -= 1; addLog("The controllers dispersed the crowd. A controller dissappeared amongst the chaos."); }
        },
        { text: "They can cry all they want.", fn: s => { 
            traitors = s.proles * Math.ceil(s.proles * 0.1);
            s.legions += traitors;
            s.proles -= traitors; 
            addLog("Hatred grows to a boiling point. Some proles have decided to join the legionnaires."); 

        } }
      ]
    },
    {
      name: "Propaganda campaign.",
      desc: "An offer has been left at your table. It costs a hefty sum (500 bones), but has alot of potential",
      options: [
        { text: "Sure",
        requires: s => ({ ok: s.bones >= 500,
        reason: "Not enough bones" }),
        fn: s => {
          s.bones -= 500;
          s.proles -= 3;
          random = Math.random();
          if (random <= 0.1) {
            s.proles = s.proles  + Math.ceil(s.proles * 0.5);
            s.controllers = s.controllers  + Math.ceil(s.controllers * 1); // Izskatās debīli, bet viegli mainīt vērtību.
            addLog("Propaganda campaign was a critical success!!!");
          }
          else if ( 0.1 > random <= 0.6) {
            s.proles = s.proles  + Math.ceil(s.proles * 0.25);

            addLog("Propaganda campaign was a success!");
          }
          else {
            addLog("What a waste...");
          }
            
          } },
        { text: "Pass", fn: s => { addLog("Propaganda campaign offer was declined."); } }
      ]
    },
    {
      name: "Legionnaire Raid",
      desc: "The legionnaires have launched a coordinated terrorist attack in your factories.",
      condition: s => s.legions >= 25,
      onEnter: s => {
        const stolen = Math.ceil(s.legions * 0.5);
        s.bones = Math.max(0, s.bones - stolen);
        addLog("They've breached the gate and have already stolen " + stolen + " bones.");
        updateStats();
      },
      options: [
        {
          text: "Send in the controllers",
          requires: s => ({ ok: s.controllers >= 1, reason: "Need 1+ controller" }),
          fn: s => { const lost = Math.min(s.controllers, s.legions); s.controllers -= lost; s.legions = Math.max(0, s.legions - lost * 2); addLog("Controllers stand their ground."); }
        },
        {
          text: "Negotiate and offer 500 bones",
          requires: s => ({ ok: s.bones >= 500, reason: "Need 500+ bones" }),
          fn: s => { s.bones -= 25; addLog("They take the bones and leave."); }
        },
        { text: "Do nothing", fn: s => { s.proles = Math.max(0, s.proles - Math.ceil(s.legions * 0.5)); addLog("Workers suffer as collateral"); } }
      ]
    },
    {
      name: "Fortunate circumstances",
      desc: "A cemetary was found with a cache of bones",
      options: [
        { text: "Collect the bones.", fn: s => { s.bones += 200; addLog("FREE BONES!!!!."); } }
      ]
    },
    {
      name: "Critical machine failure",
      desc: "One of the machines gas tanks have exploded.",
      condition: s => s.machineTier >= 3,
      onEnter: s => {
        const lost = Math.ceil(s.proles * 0.08);
        s.proles = Math.max(1, s.proles - lost);
        addLog("Initial explosion - " + lost + " workers caught in the blast.");
        updateStats();
      },
      options: [
        {
          text: "Emergency repairs (−300 bones)",
          requires: s => ({ ok: s.bones >= 300, reason: "Need 300+ bones" }),
          fn: s => { s.bones -= 300; addLog("Fire extinguished, gas tank replaced."); }
        },
        { text: "Cannibalize the parts", fn: s => { s.machineTier = Math.max(1, s.machineTier - 1); addLog("Machine degraded to tier " + s.machineTier + "."); } }
      ]
    },
    {
      name: "Betrayal",
      desc: "The legionnaires have convinced some of your workers to betray you",
      condition: s => s.legions >= 5,
      onEnter: s => {
        converted = Math.ceil(s.proles * 0.2);
        s.proles -= converted;
        s.legions += converted
        addLog(converted + " proleteriats(s) betrayed you.");
        updateStats();
      },
      options: [],
    },
    {
      name: "Genocide",
      desc: "The legionnaires have taken extreme measures and massacered your workers.",
      condition: s => s.legions >= 5,
      onEnter: s => {
        killed = Math.ceil(s.proles * 0.4);
        s.proles -= killed;
        addLog(killed + " proleteriats(s) were murdered.");
        updateStats();
      },
      options: [],
    },
    {
      name: "An ambush opportunity",
      desc: "You've recieved intel about where one of the legionnaire camp resides.",
      options: [
        {
          text: "Bomb it (-500 bones)",
          requires: s => ({ ok: s.bones >= 500, reason: "Need more bones" }),
          fn: s => { s.bones += 500; s.legions -= Math.ceil(s.legions * 0.75); addLog("Legionnaire camp destroyed."); }
        },
        { text: "Leave them be. We've got bigger problems", fn: s => { addLog("Efforts delegated elsewhere."); } }
      ]
    },
    {
        name: "Uneventful Day",
        desc: "Machines rattle. The workers suffer and operate the machines. Nothing of importance...",
        options: []
      }
  ];
  
  // Dienas režīms
  function buildDayEvents() {
    const s = state;
    // Nosacījuma notikumi
    const conditional = eventPool.filter(e => e.condition && e.condition(s));
    // Parastie notikumi
    const regular = eventPool.filter(e => !e.condition && e.name !== "Uneventful Day");
  
    let chosen = [];
    // Varbūt iesmērē nosacījuma notikumu
    if(conditional.length > 0 && Math.random() < 0.65) {
      chosen.push(conditional[Math.floor(Math.random() * conditional.length)]);
    }
  
    // index = notikumu skaits...kinda?
    const weights = [0.35, 0.35, 0.2, 0.1];
    let r = Math.random(), total = 0, count = 0;
    for(let i = 0; i < weights.length; i++) { total += weights[i]; if(r < total){ count = i; break; } }
  
    const shuffled = regular.slice().sort(() => Math.random() - 0.5);
    for(let e of shuffled) {
      if(chosen.length >= count) break;
      if(!chosen.includes(e)) chosen.push(e);
    }
  
    // Ja nekas nenotiek
    if(chosen.length === 0) chosen.push(eventPool.find(e => e.name === "Uneventful Day"));
  
    return chosen;
  }
  
  // Renderingininingingings
  // 
  let eventSelections = {};
  
/*
 Es tik ilgi čakarējos ar šito.
 Es tik ilgi čakarējos, lai pieliktu klāt skaņu.
 Un vai man sanāca?
 Nope!
 Tuvākais, kas sanāca bija squarewave skaņa, bet audio playback nesanāca.
 */
/* 
Update: STRĀDĀ UZ GITHUB PAGES!!!!!
*/
let twTimer = null;
let twAudioCtx = null;

function getAudioCtx() {
  if(!twAudioCtx) twAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return twAudioCtx;
}

let twAudioBuffer = null;

async function loadTypingSound() {
  const response = await fetch('./Sound/typing.wav');
  const arrayBuffer = await response.arrayBuffer();
  twAudioBuffer = await getAudioCtx().decodeAudioData(arrayBuffer);
}
loadTypingSound();

function playTypingSound(pitch) {
  if(!twAudioBuffer) return;
  try {
    const ctx = getAudioCtx();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = twAudioBuffer;
    source.connect(gain);
    gain.connect(ctx.destination);
    // 1 = oktāvs
    // 2 = divi oktāvi
    source.playbackRate.value = pitch / 220;
    gain.gain.setValueAtTime(1, ctx.currentTime);
    source.start(ctx.currentTime);
  } catch(e) {}
}

// Ok šis ir actually kinda forši
function typewriteEl(el, text, onDone) {
  el.textContent = '';
  let i = 0;
  let pitch = 110;
  clearInterval(twTimer);
  twTimer = setInterval(() => {
    if(i >= text.length) {
      clearInterval(twTimer);
      if(onDone) onDone();
      return;
    }
    const ch = text[i++];
    el.textContent += ch;
    if(ch !== ' ' && ch !== '\n') {
      playTypingSound(pitch);
      pitch = Math.min(pitch + 1, 520);
    }
    const panel = document.getElementById('event-panel');
    if(panel) panel.scrollTop = panel.scrollHeight;
  }, 28);
}


  function renderDay() {
  const container = document.getElementById('diary-container');
  container.innerHTML = '';


  const header = document.createElement('div');
  header.className = 'diary-day-header';
  header.textContent = 'Day: #' + state.day;
  container.appendChild(header);

  updateNextBtn(); 

  let evIdx = 0;
  function typeNextEvent() {
    if(evIdx >= dayEvents.length) {
      updateStats();
      updateNextBtn();
      return;
    }
    const ev = dayEvents[evIdx];
    const myIdx = evIdx++;

    if(ev.onEnter) ev.onEnter(state);

    const block = document.createElement('div');
    block.className = 'diary-block';
    block.dataset.evIdx = myIdx;

    const deEl = document.createElement('div');
    deEl.className = 'diary-event active';

    const titleEl = document.createElement('div');
    titleEl.className = 'diary-event-title';
    titleEl.style.cssText = 'font-size:16px;font-weight:500;color:#e8d5a3;min-height:22px;margin-bottom:4px;';

    const descEl = document.createElement('div');
    descEl.className = 'diary-event-desc';
    descEl.style.cssText = 'font-size:13px;color:#aaa;line-height:1.6;min-height:40px;margin-bottom:6px;';

    const optsEl = document.createElement('div');
    optsEl.className = 'event-options-container';

    deEl.appendChild(titleEl);
    deEl.appendChild(descEl);
    deEl.appendChild(optsEl);
    block.appendChild(deEl);
    container.appendChild(block);

    
    typewriteEl(titleEl, ev.name, () => {
      typewriteEl(descEl, ev.desc, () => {
        ev.options.forEach((opt, optIdx) => {
          const req = opt.requires ? opt.requires(state) : { ok: true };
          const row = document.createElement('div');
          row.className = 'option-row' + (req.ok ? '' : ' locked');
          row.dataset.evIdx = myIdx;
          row.dataset.optIdx = optIdx;
          // Es biju tādā ahujā, kad noskaidroju, ka .innerHTML var likt div konteinerus
          row.innerHTML = `<div class="option-check"><div class="option-check-inner"></div></div>
            <div class="option-text">${opt.text}${!req.ok ? `<div class="option-req">✗ ${req.reason}</div>` : ''}</div>`;
          if(req.ok) row.onclick = () => selectEventOption(myIdx, optIdx);
          optsEl.appendChild(row);
        });
        updateNextBtn();
        setTimeout(typeNextEvent, 200);
      });
    });
  }

  typeNextEvent();
}

  
  function selectEventOption(evIdx, optIdx) {
    eventSelections[evIdx] = optIdx;
    const block = document.querySelector(`.diary-block[data-ev-idx="${evIdx}"]`);
    if(!block) return;
    block.querySelectorAll('.option-row').forEach((r, j) => {
      r.classList.toggle('selected', j === optIdx);
    });
    updateNextBtn();
  }
  
  function updateNextBtn() {
    const btn = document.getElementById('next-btn');
    btn.textContent = 'Next Day ›';
    const allResolved = dayEvents.every((ev, i) =>
      ev.options.length === 0 || eventSelections[i] !== undefined
    );
    btn.disabled = !allResolved;
    btn.className = allResolved ? 'ready' : '';
  }
  
  function nextEvent() {
    const s = state;
    dayEvents.forEach((ev, i) => {
      const sel = eventSelections[i];
      if(ev.options.length > 0 && sel !== undefined) {
        ev.options[sel].fn(s);
      }
    });
    updateStats();
    /*

    DZINTAR, JA TU MEKLĒ KUR TIEK PALIELINĀTS KAULU SKAITS, ŠEIT.

    */
    const boneGain = (s.proles * (Math.ceil(Math.random() * 10) + 1)) * s.machineTier;
    s.bones += boneGain;
  
    const accidentChance = (s.machineTier - 1) * 0.12 - (s.safetyTier - 1) * 0.06;
    if(accidentChance > 0 && Math.random() < accidentChance) {
      const lost = Math.ceil(s.proles * 0.15);
      s.proles = Math.max(0, s.proles - lost);
      addLog("Machine accident! " + lost + " workers injured.");
    }
  
    s.legions += Math.floor(s.day * 0.5);
    if(s.controllers > 0) {
      const killed = Math.min(s.legions, s.controllers * 2);
      s.legions = Math.max(0, s.legions - killed);
    }
  
    if(s.legions > 0) {
      if(Math.random() < 0.5) {
        const dmg = Math.ceil(s.legions * 0.5);
        s.bones -= dmg;
        addLog("Legionnaires stole " + dmg + " bones overnight.");
      } else {
        const dmg = Math.ceil(s.legions * 0.2);
        s.proles = Math.max(0, s.proles - dmg);
        addLog("Legionnaires attacked " + dmg + " workers overnight.");
      }
    }
    /*

    DZINTAR, JA TU MEKLĒ KUR TIEK INKREMENTĒTA DIENA, ŠEIT.

    */
    s.day++;
    updateStats();
  
    showDayTransition(() => {
      //Teorētiski - ja nav vairs darbinieku bet ir kauli, var nopitk variāk darbiniekus, bet šo sistēmu var eksplautēt.
      if(/*s.bones <= 0 && */s.proles <= 0) { gameOver(); return; }
      startNewDay();
    });
  }
  
  function startNewDay() {
    dayEvents = buildDayEvents();
    eventSelections = {};
    renderDay();
  }
  
  // Pāreja
  function showDayTransition(cb) {
    const overlay = document.getElementById('overlay');
    const imgEl = document.getElementById('overlay-img');
    const dayEl = document.getElementById('overlay-day');
    const subEl = document.getElementById('overlay-sub');
  
    dayEl.textContent = state.day;
    overlay.classList.add('visible');
  
    let fi = 0;
    const flicker = setInterval(() => {
      fi++;
      const img = TRANSITION_IMAGES[fi % TRANSITION_IMAGES.length];
      imgEl.style.backgroundImage = `url('${img}')`;
      
      imgEl.style.opacity = (Math.random() * 0.65 + 0.3).toFixed(2);
      
      
    }, 100); // Šis maina cik ātri mainās attēli
    setTimeout(() => {
      clearInterval(flicker);
      imgEl.style.opacity = 0;
      subEl.textContent = 'Day';
      overlay.classList.remove('visible');
      setTimeout(cb, 420); // Uhhhhh fucken uhhhhh funkcija un pēc cik ilga laika tiks izsaukta
    }, 1800); // Šis maina cik ilgi ir transition
  }


  
  // man zajebal man zajebal man zajebal man zajebal man zajebal man zajebal man zajebal man zajebal man zajebal man zajebal 
  function updateStats() {
    const s = state;
    function sv(id, val, warn, danger) {
      const el = document.getElementById(id);
      el.textContent = Math.max(0, val);
      el.className = 'stat-val' + (val <= danger ? ' danger' : val <= warn ? ' warning' : '');
    }
    sv('stat-bones', s.bones, 20, 10);
    sv('stat-proles', s.proles, 5, 2);
    sv('stat-controllers', s.controllers, 2, 0);
    /*sv('stat-legions', s.legions, 3, 6);*/
    document.getElementById('stat-machine').textContent = s.machineTier;
    document.getElementById('stat-safety').textContent = s.safetyTier;
    document.getElementById('machine-cost-label').textContent = '— ' + machineCost() + ' bones';
    document.getElementById('safety-cost-label').textContent = '— ' + safetyCost() + ' bones';
  }
  
  function machineCost() { return 200 * state.machineTier; }
  function safetyCost() { return 250 * state.safetyTier; }
  
  function addLog(msg) {
    const el = document.getElementById('log');
    el.textContent = '› ' + msg;
  }
  
  function buyItem(type) {
    const s = state;
    if(type === 'prole' && s.bones >= 100) { s.bones -= 100; s.proles++; addLog("+1 proletarian recruited."); }
    else if(type === 'controller' && s.bones >= 200) { s.bones -= 200; s.controllers++; addLog("+1 controller hired."); }
    else if(type === 'machine' && s.bones >= machineCost()) { s.bones -= machineCost(); s.machineTier++; addLog("Machine upgraded to tier " + s.machineTier + "."); }
    else if(type === 'safety' && s.bones >= safetyCost()) { s.bones -= safetyCost(); s.safetyTier++; addLog("Safety upgraded to tier " + s.safetyTier + "."); }
    else { addLog("Not enough bones."); }
    updateStats();
  }
  
  function gameOver() {
    /*
    document.getElementById('gameover').style.display = 'flex';
    */
    location.href = 'GameOver.html';
  }
  
  function init() {
    updateStats();
    startNewDay();
  }
  
  /*
  Man pietiek.
  Man zb jau šis projekts.
  */
  init();
  startDayThing();