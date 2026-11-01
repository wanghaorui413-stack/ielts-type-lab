const prompts = [
  { id: 't2-city', task: 'task2', topic: '城市生活', label: '城市绿地', text: 'Some people believe that cities should invest more in public parks and green spaces rather than building new roads. To what extent do you agree or disagree?' },
  { id: 't2-learning', task: 'task2', topic: '教育', label: '线上学习', text: 'Online courses are becoming more common in universities. Some people think they will eventually replace classroom teaching. Discuss both views and give your own opinion.' },
  { id: 't2-work', task: 'task2', topic: '工作与科技', label: '远程办公', text: 'Many employees now work from home for part of the week. Do the advantages of this trend outweigh the disadvantages for workers and employers?' },
  { id: 't2-transport', task: 'task2', topic: '环境与交通', label: '公共交通', text: 'Some governments encourage people to use public transport by making it cheaper. Others believe that improving its reliability is more effective. Discuss both views and give your own opinion.' },
  { id: 't1-travel', task: 'task1', topic: '图表描述', label: '通勤方式变化', text: 'The table shows the percentage of commuters using three forms of transport in Northbridge in 2010, 2020 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.', table: { headings: ['方式', '2010', '2020', '2025'], rows: [['Car', '62%', '52%', '45%'], ['Bus', '25%', '29%', '31%'], ['Bicycle', '13%', '19%', '24%']] } },
  { id: 't1-energy', task: 'task1', topic: '图表描述', label: '家庭能源使用', text: 'The table compares the average monthly electricity use of households in three neighbourhoods in 2015 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.', table: { headings: ['地区', '2015', '2025'], rows: [['Central', '310 kWh', '285 kWh'], ['Riverside', '260 kWh', '295 kWh'], ['Hillview', '340 kWh', '320 kWh']] } }
];
const drills = [
  { id: 'd-education', label: '教育话题 · 约 80 词', text: 'Access to education can shape the opportunities available to young people. However, simply providing more courses does not guarantee better outcomes. Students also need clear guidance, regular feedback and time to practise what they learn. When schools combine these elements, learners are more likely to gain confidence and develop skills that remain useful beyond the classroom.' },
  { id: 'd-cities', label: '城市话题 · 约 80 词', text: 'A city is easier to live in when daily journeys are short and predictable. Reliable buses and trains can reduce the need for private cars, while safe walking routes make local shops more accessible. These changes may seem small on their own, but together they can improve air quality and give residents more time for work, family and leisure.' },
  { id: 'd-technology', label: '科技话题 · 约 80 词', text: 'Digital tools have changed the way people collaborate across long distances. A team can now share documents, discuss ideas and solve problems without meeting in the same room. Yet technology works best when expectations are clear. Workers need agreed deadlines, useful feedback and opportunities for conversation so that speed does not come at the cost of understanding.' }
];
const levels = [
  { id: 'level-1', number: 1, title: '找到节奏', subtitle: '短句起步', seconds: 90, minWpm: 12, minAccuracy: 90, text: 'Clear ideas need clear sentences. Take a breath, find your rhythm, and keep your eyes on the screen.' },
  { id: 'level-2', number: 2, title: '稳定输出', subtitle: '连续输入', seconds: 120, minWpm: 18, minAccuracy: 92, text: 'A strong paragraph begins with one clear idea. The next sentences explain it and add a relevant example. Keep moving forward, check the words you type, and let a steady rhythm carry you to the final sentence.' },
  { id: 'level-3', number: 3, title: '考场冲刺', subtitle: '限时挑战', seconds: 150, minWpm: 22, minAccuracy: 95, text: 'In a timed writing test, speed matters only when the meaning remains clear. A useful habit is to plan the main point before typing, then build each paragraph one sentence at a time. If you make a mistake, correct it calmly and continue. The goal is a response that is both complete and easy to read.' }
];
const DURATION = { task1: 20 * 60, task2: 40 * 60, copy: 5 * 60 };
const STORAGE = 'typeahead-ielts-v1';
function track(event){
  if(!['page_view','mode_essay','mode_copy','mode_game','practice_start','practice_complete','feedback_open','feedback_submit'].includes(event))return;
  try { void fetch('/api/track',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event}),keepalive:true}).catch(()=>{}); } catch { /* Practice remains available offline. */ }
}
const $ = id => document.getElementById(id);
const el = Object.fromEntries(['app','essayTab','copyTab','gameTab','essaySetup','copySetup','gameSetup','levelList','task1Button','task2Button','promptSelect','drillSelect','randomButton','timer','timerPreset','startButton','resetButton','saveNote','exerciseLabel','practiceTitle','goalPill','gameChallenge','challengeBadge','challengeTitle','challengeDescription','promptCard','promptTopic','promptText','taskData','copyReference','referenceLabel','copyProgressLabel','referenceText','editorLabel','saveStatus','writingInput','editorHint','clearButton','exportButton','finishButton','primaryStatLabel','wordCount','wordProgress','progressText','speedLabel','speedValue','speedUnit','secondStatLabel','secondStatValue','secondStatUnit','paceTitle','paceDescription','historyList','clearHistoryButton','focusButton','soundButton','resultDialog','resultEyebrow','resultTitle','resultSummary','resultMetrics','resultNote','downloadResultButton','nextLevelButton'].map(id => [id,$(id)]));
function readJson(key, fallback){ try { const value=JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; } }
function writeJson(key,value){ try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch { return false; } }
const saved = readJson(STORAGE + ':settings', {});
const progress = readJson(STORAGE + ':levels', { unlocked: 1, best: {} });
const state = { mode: ['essay','copy','game'].includes(saved.mode) ? saved.mode : 'essay', task: saved.task === 'task1' ? 'task1' : 'task2', promptId: saved.promptId || 't2-city', drillId: saved.drillId || 'd-education', levelId: saved.levelId || 'level-1', remaining: DURATION.task2, running: false, started: false, finished: false, baselineUnits: 0, deadline: 0, tickId: null, focus: false, soundOn: readJson(STORAGE + ':sound', true), history: readJson(STORAGE + ':history', []), progress: { unlocked: Math.min(3,Math.max(1,Number(progress.unlocked)||1)), best: progress.best && typeof progress.best === 'object' ? progress.best : {} } };
function currentPrompt(){ return prompts.find(p => p.id === state.promptId && p.task === state.task) || prompts.find(p => p.task === state.task); }
function currentDrill(){ return drills.find(d => d.id === state.drillId) || drills[0]; }
function currentLevel(){ return levels.find(l => l.id === state.levelId) || levels[0]; }
function currentReference(){ return state.mode === 'game' ? currentLevel().text : currentDrill().text; }
function duration(){ return state.mode === 'game' ? currentLevel().seconds : state.mode === 'copy' ? DURATION.copy : DURATION[state.task]; }
function goal(){ return state.mode === 'game' ? currentLevel().text.length : state.mode === 'copy' ? currentDrill().text.length : state.task === 'task1' ? 150 : 250; }
function settings(){ writeJson(STORAGE + ':settings',{ mode: state.mode, task: state.task, promptId: state.promptId, drillId: state.drillId, levelId: state.levelId }); }
function draftKey(){ return STORAGE + ':draft:' + state.promptId; }
function elapsed(){ return duration() - state.remaining; }
function formatTime(seconds){ const m=Math.floor(Math.max(0,seconds)/60); const s=Math.max(0,seconds)%60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
function wordCount(text){ return (text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).length; }
// Aligns the input with the reference by edit distance, so a missed or extra character is flagged once instead of shifting everything after it.
let alignCache={typed:null,ref:null,result:null};
function alignTyping(){
  const typed=el.writingInput.value,ref=currentReference(); if(alignCache.typed===typed&&alignCache.ref===ref) return alignCache.result;
  const t=typed.length,cols=Math.min(ref.length,t+50)+1,d=new Uint16Array((t+1)*cols),cost=(i,j)=>typed[i-1]===ref[j-1]?0:1;
  for(let j=0;j<cols;j++) d[j]=j;
  for(let i=1;i<=t;i++){ d[i*cols]=i; for(let j=1;j<cols;j++) d[i*cols+j]=Math.min(d[(i-1)*cols+j-1]+cost(i,j),d[(i-1)*cols+j]+1,d[i*cols+j-1]+1); }
  let end=0; for(let j=1;j<cols;j++) if(d[t*cols+j]<=d[t*cols+end]) end=j;
  const status=new Array(ref.length).fill('pending'); let i=t,j=end,correct=0,errors=0;
  while(i>0||j>0){
    const here=d[i*cols+j];
    // Skips are tried before matches so that, among equally good alignments, extra or missing characters sit as late as possible.
    if(i>0&&here===d[(i-1)*cols+j]+1){ status[Math.max(0,j-1)]='incorrect'; errors++; i--; }
    else if(j>0&&here===d[i*cols+j-1]+1){ status[j-1]='incorrect'; errors++; j--; }
    else { const ok=!cost(i,j); status[j-1]=ok&&status[j-1]!=='incorrect'?'correct':'incorrect'; ok?correct++:errors++; i--; j--; }
  }
  alignCache={typed,ref,result:{status,correct,errors,covered:end}}; return alignCache.result;
}
function accuracy(){ const {correct,errors}=alignTyping(); return correct+errors?Math.round(correct/(correct+errors)*100):100; }
function correctChars(){ return alignTyping().correct; }
function coveredChars(){ return alignTyping().covered; }
function units(){ return state.mode === 'essay' ? wordCount(el.writingInput.value) : correctChars(); }
function speed(){ const minutes=elapsed()/60; if(minutes < 0.08) return 0; const newUnits=Math.max(0,units()-state.baselineUnits); return Math.round(state.mode === 'essay' ? newUnits/minutes : newUnits/5/minutes); }
function setStatus(message){ el.saveStatus.textContent=message; }
function populateSelects(){
  el.promptSelect.replaceChildren();
  prompts.filter(p=>p.task===state.task).forEach(p=>{ const o=document.createElement('option'); o.value=p.id; o.textContent=p.label; el.promptSelect.append(o); });
  state.promptId=currentPrompt().id; el.promptSelect.value=state.promptId;
  el.drillSelect.replaceChildren(); drills.forEach(d=>{ const o=document.createElement('option'); o.value=d.id; o.textContent=d.label; el.drillSelect.append(o); }); el.drillSelect.value=currentDrill().id;
}
function renderTable(data){ el.taskData.replaceChildren(); if(!data){ el.taskData.hidden=true; return; } const table=document.createElement('table'); const head=document.createElement('thead'); const row=document.createElement('tr'); data.headings.forEach(value=>{ const cell=document.createElement('th'); cell.textContent=value; row.append(cell); }); head.append(row); table.append(head); const body=document.createElement('tbody'); data.rows.forEach(values=>{ const tr=document.createElement('tr'); values.forEach(value=>{ const td=document.createElement('td'); td.textContent=value; tr.append(td); }); body.append(tr); }); table.append(body); el.taskData.append(table); el.taskData.hidden=false; }
function renderReference(){ const ref=currentReference(),aligned=alignTyping(); el.referenceText.replaceChildren(); let buffer='',status=null; const flush=()=>{ if(!buffer) return; const span=document.createElement('span'); span.className=status; span.textContent=buffer; el.referenceText.append(span); buffer=''; }; for(let i=0;i<ref.length;i++){ const next=aligned.status[i]; if(next!==status){flush();status=next;} buffer+=ref[i]; } flush(); el.copyProgressLabel.textContent=`${Math.min(100,Math.round(aligned.covered/ref.length*100))}% 完成`; }
function loadDraft(){ el.writingInput.value=state.mode==='essay'?(localStorage.getItem(draftKey())||''):''; setStatus(state.mode==='essay'&&el.writingInput.value?'已恢复本机草稿':'准备就绪'); }
function renderLevels(){
  el.levelList.replaceChildren();
  levels.forEach(level=>{
    const locked=level.number>state.progress.unlocked,passed=Boolean(state.progress.best[level.id]);
    const button=document.createElement('button');button.type='button';button.className='level-item'+(state.levelId===level.id?' current':'')+(locked?' locked':'');button.disabled=locked;button.setAttribute('aria-current',state.levelId===level.id?'step':'false');
    const number=document.createElement('span');number.className='level-number';number.textContent=String(level.number).padStart(2,'0');
    const details=document.createElement('span');details.className='level-details';const title=document.createElement('strong');title.textContent=level.title;const subtitle=document.createElement('small');subtitle.textContent=`${level.subtitle} · ${formatTime(level.seconds)}`;details.append(title,subtitle);
    const status=document.createElement('span');status.className='level-status';status.textContent=locked?'锁定':passed?`${state.progress.best[level.id].speed} WPM`:'待挑战';if(passed)status.title='本关最佳速度';
    button.append(number,details,status);button.addEventListener('click',()=>switchExercise({mode:'game',levelId:level.id}));el.levelList.append(button);
  });
}
function renderMode(){
  const essay=state.mode==='essay',copy=state.mode==='copy',game=state.mode==='game',typing=!essay;
  el.app.dataset.mode=state.mode;
  for(const [tab,active] of [[el.essayTab,essay],[el.copyTab,copy],[el.gameTab,game]]){tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));}
  el.essaySetup.hidden=!essay; el.copySetup.hidden=!copy; el.gameSetup.hidden=!game; el.promptCard.hidden=!essay; el.copyReference.hidden=essay;el.gameChallenge.hidden=!game;
  el.task1Button.classList.toggle('selected',state.task==='task1'); el.task2Button.classList.toggle('selected',state.task==='task2');
  const prompt=currentPrompt(); el.promptSelect.value=prompt.id; el.drillSelect.value=currentDrill().id;
  el.exerciseLabel.textContent=game?`LEVEL ${String(currentLevel().number).padStart(2,'0')} · TYPING QUEST`:copy?'TYPING DRILL · 05 MIN':state.task==='task1'?'TASK 1 · ACADEMIC':'TASK 2 · ESSAY';
  el.practiceTitle.textContent=game?'打字闯关':copy?'英文跟打热身':'限时写作'; el.goalPill.textContent=typing?'目标：准确完成':`目标 ${goal()} 词`;
  el.promptTopic.textContent=prompt.topic; el.promptText.textContent=prompt.text; renderTable(prompt.table);
  el.editorLabel.textContent=typing?'你的输入':'你的作文'; el.editorHint.textContent=typing?'请按原文输入；粘贴已关闭。':'建议先用 2–3 分钟构思，再连续打字。';
  el.writingInput.placeholder=typing?'从参考段落的第一个字母开始…':'点击开始计时，或直接在这里输入你的第一句话…';
  el.clearButton.textContent=game?'重新挑战':copy?'重新跟打':'清空'; el.exportButton.hidden=typing;el.finishButton.textContent=game?'提交闯关':'完成练习';
  el.primaryStatLabel.textContent=game?'输入字符':copy?'正确字符':'当前词数'; el.speedLabel.textContent=typing?'跟打速度':'输出速度'; el.speedUnit.textContent=typing?'WPM':'词 / 分钟';
  el.secondStatLabel.textContent=typing?'准确率':'已用时间'; el.secondStatUnit.textContent=typing?'按字符计算':'本次练习';
  el.saveNote.textContent=game?'每关需要输入完整段落，并达到速度和准确率目标。闯关进度保存在本机。':copy?'跟打只记录本次成绩；内容不会上传。':'作文草稿只保存在当前浏览器。正式练习前，记得导出重要内容。';
  el.timerPreset.textContent=`${formatTime(duration())} 起`;
  if(game){const level=currentLevel();el.challengeBadge.textContent=String(level.number).padStart(2,'0');el.challengeTitle.textContent=`第${['一','二','三'][level.number-1]}关 · ${level.title}`;el.challengeDescription.textContent=`${formatTime(level.seconds)} 内完成 · 准确率 ≥ ${level.minAccuracy}% · 速度 ≥ ${level.minWpm} WPM`;el.referenceLabel.textContent='闯关文本';renderLevels();}
  else el.referenceLabel.textContent='请照着输入';
  if(typing)renderReference();
  renderStats();
}
function renderTimer(){ const game=state.mode==='game';el.timer.textContent=formatTime(state.remaining); el.timer.classList.toggle('urgent',state.remaining<=60);el.startButton.disabled=game&&state.running; el.startButton.textContent=game?(state.running?'闯关中':state.finished?'再挑战':'开始挑战'):state.running?'暂停计时':state.started?'继续计时':'开始计时'; el.writingInput.disabled=state.started&&!state.running&&!state.finished&&state.remaining>0; }
function renderStats(){
  const text=el.writingInput.value,essay=state.mode==='essay',game=state.mode==='game',count=game?coveredChars():essay?wordCount(text):correctChars(),target=goal(),pct=Math.min(100,count/target*100);
  el.wordCount.textContent=count; el.wordProgress.style.width=`${pct}%`;
  el.progressText.textContent=game?`已输入 ${Math.min(count,target)} / ${target} 个字符`:essay?(count>=target?'已达到最低词数':`距离目标还差 ${target-count} 词`):`${Math.max(0,target-count)} 个正确字符待完成`;
  el.speedValue.textContent=elapsed()<5?'—':String(speed());
  el.secondStatValue.textContent=essay?formatTime(elapsed()):`${accuracy()}%`;
  if(!state.started){ el.paceTitle.textContent=game?'准备挑战第 '+currentLevel().number+' 关':essay?'先写下第一句':'先打下第一个字母'; el.paceDescription.textContent=game?`准确率至少 ${currentLevel().minAccuracy}%，速度至少 ${currentLevel().minWpm} WPM。`:essay?'开始后，这里会显示你的写作节奏。':'开始后，这里会显示你的跟打节奏。'; }
  else if(game){const level=currentLevel(),a=accuracy(),v=speed();el.paceTitle.textContent=a>=level.minAccuracy&&v>=level.minWpm?'正在达到通关节奏':'稳住手感，继续向前';el.paceDescription.textContent=`当前 ${a}% 准确 · ${v} WPM。需要完整输入文本才能通关。`;}
  else if(!essay){ const a=accuracy(); el.paceTitle.textContent=a>=95?'准确率保持得很好':a>=80?'先稳住准确率':'放慢一点，修正错字'; el.paceDescription.textContent=`已输入 ${text.length} / ${target} 个字符。正确字符越多，速度统计越可靠。`; }
  else if(elapsed()<30){ el.paceTitle.textContent='进入写作节奏'; el.paceDescription.textContent='再写一会儿，就能估算当前速度。'; }
  else { const projected=Math.round(speed()*(duration()/60)); el.paceTitle.textContent=projected>=target?'当前节奏有望达标':'可以稍微提高节奏'; el.paceDescription.textContent=`按当前速度，整场约可写 ${projected} 词；目标至少 ${target} 词。`; }
}
function stopTimer(){ if(state.tickId){clearInterval(state.tickId);state.tickId=null;} state.running=false; }
function tick(){ state.remaining=Math.max(0,Math.ceil((state.deadline-Date.now())/1000)); renderTimer(); renderStats(); if(state.remaining===0){ stopTimer(); state.finished=true; el.writingInput.disabled=false; finishPractice(true); } }
function startTimer(){ if(state.running){if(state.mode==='game')return;tick(); stopTimer(); renderTimer(); setStatus('计时已暂停'); return; } if(state.finished&&state.mode==='game'){el.writingInput.value='';resetTimer();renderReference();} if(state.remaining===0) resetTimer(); if(!state.started)track('practice_start'); state.started=true; state.finished=false; state.running=true; state.deadline=Date.now()+state.remaining*1000; state.tickId=setInterval(tick,300); renderTimer(); renderStats(); el.writingInput.focus(); setStatus('正在计时'); }
function resetTimer(){ stopTimer(); state.remaining=duration(); state.started=false; state.finished=false; state.baselineUnits=units(); renderTimer(); renderStats(); setStatus('计时已重置'); }
function switchExercise({mode=state.mode,task=state.task,promptId=state.promptId,drillId=state.drillId,levelId=state.levelId}){
  const requestedLevel=levels.find(l=>l.id===levelId);if(mode==='game'&&(!requestedLevel||requestedLevel.number>state.progress.unlocked))return;
  if(mode!==state.mode)track(`mode_${mode}`);
  state.mode=mode; state.task=task; state.promptId=promptId; state.drillId=drillId;state.levelId=levelId;
  if(!prompts.some(p=>p.id===state.promptId&&p.task===state.task)) state.promptId=prompts.find(p=>p.task===state.task).id;
  if(!drills.some(d=>d.id===state.drillId)) state.drillId=drills[0].id;
  settings(); populateSelects(); resetTimer(); loadDraft(); state.baselineUnits=units(); renderMode();
}
function renderHistory(){ el.historyList.replaceChildren(); if(!state.history.length){ const p=document.createElement('p'); p.className='history-empty'; p.textContent='完成一次练习后，记录会显示在这里。'; el.historyList.append(p); return; } state.history.slice(0,5).forEach(item=>{const row=document.createElement('div');row.className='history-item';const left=document.createElement('div');const title=document.createElement('strong');title.textContent=item.label;const date=document.createElement('small');date.textContent=new Date(item.date).toLocaleDateString('zh-CN',{month:'numeric',day:'numeric'})+' · '+formatTime(item.elapsed);left.append(title,date);const value=document.createElement('span');value.textContent=item.mode==='game'?(item.passed?'已通关':'未通关'):item.mode==='copy'?`${item.accuracy}% 准确`:`${item.count} 词`;row.append(left,value);el.historyList.append(row);}); }
function download(){ const text=el.writingInput.value.trim(); if(!text){setStatus('请先输入内容');return;} const item=state.mode==='copy'?currentDrill():currentPrompt(); const heading=state.mode==='copy'?'英文跟打':state.task==='task1'?'Task 1':'Task 2'; const content=`TypeAhead ${heading} · ${item.label}\n${new Date().toLocaleString('zh-CN')}\n\n${state.mode==='essay'?item.text+'\n\n':''}${text}\n`; const blob=new Blob([content],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`typeahead-${item.id}-${new Date().toISOString().slice(0,10)}.txt`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus('已导出 TXT'); }
function finishPractice(auto=false){
  const text=el.writingInput.value.trim(); if(!text){if(!auto)setStatus('请先输入内容');if(!auto||state.mode!=='game')return;}
  if(state.finished&&!auto)return;
  stopTimer(); const used=elapsed(),essay=state.mode==='essay',game=state.mode==='game',item=game?currentLevel():essay?currentPrompt():currentDrill(),count=game?coveredChars():essay?wordCount(text):correctChars(),v=speed(),a=essay?null:accuracy();
  const passed=game&&count>=item.text.length&&a>=item.minAccuracy&&v>=item.minWpm&&state.remaining>0;
  state.finished=true; el.writingInput.disabled=false; renderTimer(); track('practice_complete');
  const record={date:new Date().toISOString(),mode:state.mode,label:game?`第${item.number}关 · ${item.title}`:item.label,count,accuracy:a,speed:v,elapsed:used,passed}; state.history.unshift(record);state.history=state.history.slice(0,30);writeJson(STORAGE+':history',state.history);renderHistory();
  if(game&&passed){state.progress.unlocked=Math.min(levels.length,Math.max(state.progress.unlocked,item.number+1));const previous=state.progress.best[item.id];if(!previous||v>previous.speed)state.progress.best[item.id]={speed:v,accuracy:a,elapsed:used};writeJson(STORAGE+':levels',state.progress);renderLevels();}
  el.resultEyebrow.textContent=game?(passed?'LEVEL CLEARED':'TRY AGAIN'):'SESSION COMPLETE';
  el.resultTitle.textContent=game?(passed?'漂亮，闯关成功！':'这关还没过，再试一次。'):'这一轮，练得很扎实。';
  if(game){const missing=[];if(count<item.text.length)missing.push(`还差 ${item.text.length-count} 个字符`);if(a<item.minAccuracy)missing.push(`准确率需达到 ${item.minAccuracy}%`);if(v<item.minWpm)missing.push(`速度需达到 ${item.minWpm} WPM`);el.resultSummary.textContent=passed?(item.number<levels.length?'下一关已解锁，继续保持这个节奏。':'三关全部完成！可以重玩，刷新自己的最佳成绩。'):(auto?'时间到了。':'本次未达成通关条件。')+(missing.length?' '+missing.join('；')+'。':' 再试一次。');}
  else el.resultSummary.textContent=auto?'时间到了。看看这一轮的结果，再决定下一次练什么。':'练习已记录。下面是这次的打字表现。';
  const metrics=essay?[[count,'作文词数'],[v,'词 / 分钟'],[formatTime(used),'已用时间']]:[[count,game?'输入字符':'正确字符'],[`${a}%`,'准确率'],[v,'WPM']];el.resultMetrics.replaceChildren();metrics.forEach(([value,label])=>{const box=document.createElement('div');const strong=document.createElement('strong');strong.textContent=value;const span=document.createElement('span');span.textContent=label;box.append(strong,span);el.resultMetrics.append(box);});
  el.resultNote.textContent=game?`通关条件：完整输入 · 准确率 ≥ ${item.minAccuracy}% · 速度 ≥ ${item.minWpm} WPM · 在 ${formatTime(item.seconds)} 内完成。`:essay?`雅思学术写作 ${state.task==='task1'?'Task 1':'Task 2'} 建议至少 ${goal()} 词；这里仅反馈打字节奏，不评估作文分数。`:'准确率按参考段落逐字符计算；WPM 按正确字符 ÷ 5 ÷ 分钟估算。';
  el.downloadResultButton.hidden=!essay;el.nextLevelButton.hidden=!game||!passed||item.number===levels.length;el.resultDialog.showModal();setStatus(game?(passed?'闯关成功':'本关未通过'):'练习已记录');
}
el.essayTab.addEventListener('click',()=>{if(state.mode!=='essay')switchExercise({mode:'essay'});});
el.copyTab.addEventListener('click',()=>{if(state.mode!=='copy')switchExercise({mode:'copy'});});
el.gameTab.addEventListener('click',()=>{if(state.mode!=='game')switchExercise({mode:'game',levelId:levels[Math.min(state.progress.unlocked,levels.length)-1].id});});
el.task1Button.addEventListener('click',()=>{if(state.task!=='task1')switchExercise({task:'task1'});});
el.task2Button.addEventListener('click',()=>{if(state.task!=='task2')switchExercise({task:'task2'});});
el.promptSelect.addEventListener('change',()=>switchExercise({promptId:el.promptSelect.value}));
el.drillSelect.addEventListener('change',()=>switchExercise({drillId:el.drillSelect.value}));
el.randomButton.addEventListener('click',()=>{const choices=prompts.filter(p=>p.task===state.task&&p.id!==state.promptId);switchExercise({promptId:choices[Math.floor(Math.random()*choices.length)].id});});
el.startButton.addEventListener('click',startTimer);el.resetButton.addEventListener('click',()=>{if(state.mode==='game'){el.writingInput.value='';renderReference();}resetTimer();});
el.writingInput.addEventListener('input',()=>{state.finished=false;if(!state.started)startTimer(); if(state.mode==='essay'){const okay=writeJson(draftKey(),el.writingInput.value);setStatus(okay?'已自动保存到本机':'浏览器存储不可用，请及时导出');}else{renderReference();setStatus(state.mode==='game'?'正在闯关':'正在跟打');if((state.mode==='copy'&&el.writingInput.value===currentReference())||(state.mode==='game'&&coveredChars()>=currentReference().length)){finishPractice();}}renderStats();});
el.writingInput.addEventListener('paste',event=>{if(state.mode!=='essay'){event.preventDefault();setStatus('打字练习不能粘贴，请使用键盘输入');}});
el.writingInput.addEventListener('drop',event=>{if(state.mode!=='essay'){event.preventDefault();setStatus('打字练习不能拖入文字');}});
el.clearButton.addEventListener('click',()=>{const question=state.mode==='game'?'重新挑战本关？':state.mode==='copy'?'重新开始这段跟打？':'清空当前作文草稿？';if(el.writingInput.value&&!window.confirm(question))return;el.writingInput.value='';if(state.mode==='essay')writeJson(draftKey(),'');resetTimer();if(state.mode!=='essay')renderReference();renderStats();el.writingInput.focus();setStatus('内容已清空');});
el.exportButton.addEventListener('click',download);el.finishButton.addEventListener('click',()=>finishPractice());el.downloadResultButton.addEventListener('click',download);
el.nextLevelButton.addEventListener('click',()=>{const next=levels[currentLevel().number];if(!next)return;el.resultDialog.close();switchExercise({mode:'game',levelId:next.id});el.writingInput.focus();});
el.clearHistoryButton.addEventListener('click',()=>{if(!state.history.length)return;if(!window.confirm('清除本机保存的练习记录？草稿会保留。'))return;state.history=[];writeJson(STORAGE+':history',[]);renderHistory();});
el.focusButton.addEventListener('click',()=>{state.focus=!state.focus;el.app.classList.toggle('focus-mode',state.focus);el.focusButton.setAttribute('aria-pressed',String(state.focus));el.focusButton.textContent=state.focus?'退出专注':'专注模式';});
let audioContext,clickBuffer;
function playKeySound(event){
  if(!state.soundOn||event.repeat||event.isComposing||event.ctrlKey||event.metaKey||event.altKey||!(event.key.length===1||['Backspace','Enter'].includes(event.key)))return;
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  try{
    if(!audioContext){audioContext=new Audio();clickBuffer=audioContext.createBuffer(1,Math.round(audioContext.sampleRate*.025),audioContext.sampleRate);const samples=clickBuffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*Math.pow(1-i/samples.length,2);}
    if(audioContext.state==='suspended')void audioContext.resume();
    const source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain(),now=audioContext.currentTime;
    source.buffer=clickBuffer;source.playbackRate.value=event.key==='Enter'?.72:event.key==='Backspace'?.84:.9+Math.random()*.22;
    filter.type='highpass';filter.frequency.value=850;gain.gain.setValueAtTime(.018,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.026);
    source.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);source.start(now);source.stop(now+.03);
  }catch{/* Audio is optional when a browser blocks playback. */}
}
function renderSound(){el.soundButton.setAttribute('aria-pressed',String(state.soundOn));el.soundButton.textContent=state.soundOn?'♫ 音效开':'♪ 音效关';el.soundButton.setAttribute('aria-label',state.soundOn?'关闭键盘音效':'开启键盘音效');}
el.soundButton.addEventListener('click',()=>{state.soundOn=!state.soundOn;writeJson(STORAGE+':sound',state.soundOn);if(!state.soundOn&&audioContext?.state==='running')void audioContext.suspend();if(state.soundOn&&audioContext?.state==='suspended')void audioContext.resume();renderSound();});
el.writingInput.addEventListener('keydown',playKeySound);
if(!levels.some(l=>l.id===state.levelId)||currentLevel().number>state.progress.unlocked)state.levelId=levels[state.progress.unlocked-1].id;
populateSelects();state.remaining=duration();loadDraft();state.baselineUnits=units();renderMode();renderTimer();renderHistory();renderSound();
track('page_view');

const feedbackDialog=$('feedbackDialog'),feedbackForm=$('feedbackForm'),feedbackStatus=$('feedbackStatus'),feedbackSubmitButton=$('feedbackSubmitButton');
function closeFeedback(){feedbackDialog.close();}
$('feedbackButton').addEventListener('click',()=>{feedbackStatus.textContent='';feedbackDialog.showModal();$('feedbackMessage').focus();track('feedback_open');});
$('feedbackCloseButton').addEventListener('click',closeFeedback);
$('feedbackCancelButton').addEventListener('click',closeFeedback);
feedbackDialog.addEventListener('click',event=>{if(event.target===feedbackDialog)closeFeedback();});
feedbackForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const message=$('feedbackMessage').value.trim(),category=$('feedbackCategory').value,website=$('feedbackWebsite').value;
  if(message.length<10){feedbackStatus.textContent='请至少写 10 个字，方便我们理解问题。';return;}
  feedbackSubmitButton.disabled=true;feedbackStatus.textContent='正在提交…';
  try{
    const response=await fetch('/api/feedback',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({category,message,website})});
    if(!response.ok)throw Error('submit failed');
    feedbackForm.reset();feedbackStatus.textContent='提交成功，谢谢你的建议！';track('feedback_submit');
    setTimeout(()=>{if(feedbackDialog.open)closeFeedback();},1600);
  }catch{feedbackStatus.textContent='提交失败，请稍后重试。你的内容还在，可以再次提交。';}
  finally{feedbackSubmitButton.disabled=false;}
});

// Browsers that support WebMCP can expose the same practice setup to an assistant.
if (document.modelContext?.registerTool) {
  const register = tool => {
    try { Promise.resolve(document.modelContext.registerTool(tool)).catch(() => {}); } catch { /* Browsers without a working implementation keep the normal UI. */ }
  };
  register({
    name: 'start_writing_practice',
    title: 'Start writing practice',
    description: 'Select a visible IELTS writing task, typing drill or unlocked typing level and start its timer.',
    inputSchema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['essay', 'copy', 'game'] },
        task: { type: 'string', enum: ['task1', 'task2'] },
        exerciseId: { type: 'string' }
      },
      required: ['mode', 'exerciseId'],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (!input || !['essay', 'copy', 'game'].includes(input.mode) || typeof input.exerciseId !== 'string') throw new Error('Invalid practice selection');
      if (input.mode === 'essay') {
        const prompt = prompts.find(p => p.id === input.exerciseId);
        if (!prompt || (input.task && input.task !== prompt.task)) throw new Error('Unknown writing task');
        switchExercise({ mode: 'essay', task: prompt.task, promptId: prompt.id });
      } else if(input.mode==='copy') {
        if (!drills.some(d => d.id === input.exerciseId)) throw new Error('Unknown typing drill');
        switchExercise({ mode: 'copy', drillId: input.exerciseId });
      } else {
        const level=levels.find(l=>l.id===input.exerciseId);
        if(!level||level.number>state.progress.unlocked)throw new Error('Level is locked or unknown');
        switchExercise({ mode: 'game', levelId: level.id });
      }
      startTimer();
      return { mode: state.mode, exerciseId: input.exerciseId, remainingSeconds: state.remaining, timerRunning: state.running };
    }
  });
  register({
    name: 'read_writing_practice_status',
    title: 'Read writing practice status',
    description: 'Read the selected exercise and current typing metrics without changing the practice.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute() {
      return { mode: state.mode, exerciseId: state.mode === 'game' ? state.levelId : state.mode === 'copy' ? state.drillId : state.promptId, timerRunning: state.running, remainingSeconds: state.remaining, wordCount: wordCount(el.writingInput.value), speed: speed(), accuracy: state.mode === 'essay' ? null : accuracy(), unlockedLevel: state.progress.unlocked };
    }
  });
}
