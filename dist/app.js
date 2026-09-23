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
const DURATION = { task1: 20 * 60, task2: 40 * 60, copy: 5 * 60 };
const STORAGE = 'typeahead-ielts-v1';
const $ = id => document.getElementById(id);
const el = Object.fromEntries(['app','essayTab','copyTab','essaySetup','copySetup','task1Button','task2Button','promptSelect','drillSelect','randomButton','timer','timerPreset','startButton','resetButton','exerciseLabel','practiceTitle','goalPill','promptCard','promptTopic','promptText','taskData','copyReference','copyProgressLabel','referenceText','editorLabel','saveStatus','writingInput','editorHint','clearButton','exportButton','finishButton','primaryStatLabel','wordCount','wordProgress','progressText','speedLabel','speedValue','speedUnit','secondStatLabel','secondStatValue','secondStatUnit','paceTitle','paceDescription','historyList','clearHistoryButton','focusButton','resultDialog','resultSummary','resultMetrics','resultNote','downloadResultButton'].map(id => [id,$(id)]));
function readJson(key, fallback){ try { const value=JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; } }
function writeJson(key,value){ try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch { return false; } }
const saved = readJson(STORAGE + ':settings', {});
const state = { mode: saved.mode === 'copy' ? 'copy' : 'essay', task: saved.task === 'task1' ? 'task1' : 'task2', promptId: saved.promptId || 't2-city', drillId: saved.drillId || 'd-education', remaining: DURATION.task2, running: false, started: false, finished: false, baselineUnits: 0, deadline: 0, tickId: null, focus: false, history: readJson(STORAGE + ':history', []) };
function currentPrompt(){ return prompts.find(p => p.id === state.promptId && p.task === state.task) || prompts.find(p => p.task === state.task); }
function currentDrill(){ return drills.find(d => d.id === state.drillId) || drills[0]; }
function duration(){ return state.mode === 'copy' ? DURATION.copy : DURATION[state.task]; }
function goal(){ return state.mode === 'copy' ? currentDrill().text.length : state.task === 'task1' ? 150 : 250; }
function settings(){ writeJson(STORAGE + ':settings',{ mode: state.mode, task: state.task, promptId: state.promptId, drillId: state.drillId }); }
function draftKey(){ return STORAGE + ':draft:' + state.promptId; }
function elapsed(){ return duration() - state.remaining; }
function formatTime(seconds){ const m=Math.floor(Math.max(0,seconds)/60); const s=Math.max(0,seconds)%60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
function wordCount(text){ return (text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).length; }
function accuracy(){ const text=el.writingInput.value; if(!text.length) return 100; const ref=currentDrill().text; let correct=0; for(let i=0;i<text.length;i++) if(text[i]===ref[i]) correct++; return Math.round(correct/text.length*100); }
function correctChars(){ const text=el.writingInput.value,ref=currentDrill().text; let n=0; for(let i=0;i<text.length;i++) if(text[i]===ref[i]) n++; return n; }
function units(){ return state.mode === 'copy' ? correctChars() : wordCount(el.writingInput.value); }
function speed(){ const minutes=elapsed()/60; if(minutes < 0.08) return 0; const newUnits=Math.max(0,units()-state.baselineUnits); return Math.round(state.mode === 'copy' ? newUnits/5/minutes : newUnits/minutes); }
function setStatus(message){ el.saveStatus.textContent=message; }
function populateSelects(){
  el.promptSelect.replaceChildren();
  prompts.filter(p=>p.task===state.task).forEach(p=>{ const o=document.createElement('option'); o.value=p.id; o.textContent=p.label; el.promptSelect.append(o); });
  state.promptId=currentPrompt().id; el.promptSelect.value=state.promptId;
  el.drillSelect.replaceChildren(); drills.forEach(d=>{ const o=document.createElement('option'); o.value=d.id; o.textContent=d.label; el.drillSelect.append(o); }); el.drillSelect.value=currentDrill().id;
}
function renderTable(data){ el.taskData.replaceChildren(); if(!data){ el.taskData.hidden=true; return; } const table=document.createElement('table'); const head=document.createElement('thead'); const row=document.createElement('tr'); data.headings.forEach(value=>{ const cell=document.createElement('th'); cell.textContent=value; row.append(cell); }); head.append(row); table.append(head); const body=document.createElement('tbody'); data.rows.forEach(values=>{ const tr=document.createElement('tr'); values.forEach(value=>{ const td=document.createElement('td'); td.textContent=value; tr.append(td); }); body.append(tr); }); table.append(body); el.taskData.append(table); el.taskData.hidden=false; }
function renderReference(){ const ref=currentDrill().text,typed=el.writingInput.value; el.referenceText.replaceChildren(); let buffer='',status=null; const flush=()=>{ if(!buffer) return; const span=document.createElement('span'); span.className=status; span.textContent=buffer; el.referenceText.append(span); buffer=''; }; for(let i=0;i<ref.length;i++){ const next=i>=typed.length?'pending':typed[i]===ref[i]?'correct':'incorrect'; if(next!==status){flush();status=next;} buffer+=ref[i]; } flush(); el.copyProgressLabel.textContent=`${Math.min(100,Math.round(typed.length/ref.length*100))}% 完成`; }
function loadDraft(){ el.writingInput.value=state.mode==='copy'?'':(localStorage.getItem(draftKey())||''); setStatus(state.mode==='copy'?'准备就绪':el.writingInput.value?'已恢复本机草稿':'准备就绪'); }
function renderMode(){
  const copy=state.mode==='copy';
  el.essayTab.classList.toggle('active',!copy); el.copyTab.classList.toggle('active',copy); el.essayTab.setAttribute('aria-selected',String(!copy)); el.copyTab.setAttribute('aria-selected',String(copy));
  el.essaySetup.hidden=copy; el.copySetup.hidden=!copy; el.promptCard.hidden=copy; el.copyReference.hidden=!copy;
  el.task1Button.classList.toggle('selected',state.task==='task1'); el.task2Button.classList.toggle('selected',state.task==='task2');
  const prompt=currentPrompt(); el.promptSelect.value=prompt.id; el.drillSelect.value=currentDrill().id;
  el.exerciseLabel.textContent=copy?'TYPING DRILL · 05 MIN':state.task==='task1'?'TASK 1 · ACADEMIC':'TASK 2 · ESSAY';
  el.practiceTitle.textContent=copy?'英文跟打热身':'限时写作'; el.goalPill.textContent=copy?'目标：准确完成':`目标 ${goal()} 词`;
  el.promptTopic.textContent=prompt.topic; el.promptText.textContent=prompt.text; renderTable(prompt.table);
  el.editorLabel.textContent=copy?'你的输入':'你的作文'; el.editorHint.textContent=copy?'请按原文输入；粘贴已关闭。':'建议先用 2–3 分钟构思，再连续打字。';
  el.writingInput.placeholder=copy?'从参考段落的第一个字母开始…':'点击开始计时，或直接在这里输入你的第一句话…';
  el.clearButton.textContent=copy?'重新跟打':'清空'; el.exportButton.hidden=copy;
  el.primaryStatLabel.textContent=copy?'正确字符':'当前词数'; el.speedLabel.textContent=copy?'跟打速度':'输出速度'; el.speedUnit.textContent=copy?'WPM':'词 / 分钟';
  el.secondStatLabel.textContent=copy?'准确率':'已用时间'; el.secondStatUnit.textContent=copy?'按字符计算':'本次练习';
  el.timerPreset.textContent=`${formatTime(duration())} 起`;
  if(copy) renderReference();
  renderStats();
}
function renderTimer(){ el.timer.textContent=formatTime(state.remaining); el.timer.classList.toggle('urgent',state.remaining<=60); el.startButton.textContent=state.running?'暂停计时':state.started?'继续计时':'开始计时'; el.writingInput.disabled=state.started&&!state.running&&!state.finished&&state.remaining>0; }
function renderStats(){
  const text=el.writingInput.value,copy=state.mode==='copy',count=copy?correctChars():wordCount(text),target=goal(),pct=Math.min(100,count/target*100);
  el.wordCount.textContent=count; el.wordProgress.style.width=`${pct}%`;
  el.progressText.textContent=copy?`${Math.max(0,target-count)} 个正确字符待完成`:count>=target?'已达到最低词数':`距离目标还差 ${target-count} 词`;
  el.speedValue.textContent=elapsed()<5?'—':String(speed());
  el.secondStatValue.textContent=copy?`${accuracy()}%`:formatTime(elapsed());
  if(!state.started){ el.paceTitle.textContent=copy?'先打下第一个字母':'先写下第一句'; el.paceDescription.textContent=copy?'开始后，这里会显示你的跟打节奏。':'开始后，这里会显示你的写作节奏。'; }
  else if(copy){ const a=accuracy(); el.paceTitle.textContent=a>=95?'准确率保持得很好':a>=80?'先稳住准确率':'放慢一点，修正错字'; el.paceDescription.textContent=`已输入 ${text.length} / ${target} 个字符。正确字符越多，速度统计越可靠。`; }
  else if(elapsed()<30){ el.paceTitle.textContent='进入写作节奏'; el.paceDescription.textContent='再写一会儿，就能估算当前速度。'; }
  else { const projected=Math.round(speed()*(duration()/60)); el.paceTitle.textContent=projected>=target?'当前节奏有望达标':'可以稍微提高节奏'; el.paceDescription.textContent=`按当前速度，整场约可写 ${projected} 词；目标至少 ${target} 词。`; }
}
function stopTimer(){ if(state.tickId){clearInterval(state.tickId);state.tickId=null;} state.running=false; }
function tick(){ state.remaining=Math.max(0,Math.ceil((state.deadline-Date.now())/1000)); renderTimer(); renderStats(); if(state.remaining===0){ stopTimer(); state.finished=true; el.writingInput.disabled=false; finishPractice(true); } }
function startTimer(){ if(state.running){ tick(); stopTimer(); renderTimer(); setStatus('计时已暂停'); return; } if(state.remaining===0) resetTimer(); state.started=true; state.finished=false; state.running=true; state.deadline=Date.now()+state.remaining*1000; state.tickId=setInterval(tick,300); renderTimer(); renderStats(); el.writingInput.focus(); setStatus('正在计时'); }
function resetTimer(){ stopTimer(); state.remaining=duration(); state.started=false; state.finished=false; state.baselineUnits=units(); renderTimer(); renderStats(); setStatus('计时已重置'); }
function switchExercise({mode=state.mode,task=state.task,promptId=state.promptId,drillId=state.drillId}){
  state.mode=mode; state.task=task; state.promptId=promptId; state.drillId=drillId;
  if(!prompts.some(p=>p.id===state.promptId&&p.task===state.task)) state.promptId=prompts.find(p=>p.task===state.task).id;
  if(!drills.some(d=>d.id===state.drillId)) state.drillId=drills[0].id;
  settings(); populateSelects(); resetTimer(); loadDraft(); state.baselineUnits=units(); renderMode();
}
function renderHistory(){ el.historyList.replaceChildren(); if(!state.history.length){ const p=document.createElement('p'); p.className='history-empty'; p.textContent='完成一次练习后，记录会显示在这里。'; el.historyList.append(p); return; } state.history.slice(0,5).forEach(item=>{const row=document.createElement('div');row.className='history-item';const left=document.createElement('div');const title=document.createElement('strong');title.textContent=item.label;const date=document.createElement('small');date.textContent=new Date(item.date).toLocaleDateString('zh-CN',{month:'numeric',day:'numeric'})+' · '+formatTime(item.elapsed);left.append(title,date);const value=document.createElement('span');value.textContent=item.mode==='copy'?`${item.accuracy}% 准确`:`${item.count} 词`;row.append(left,value);el.historyList.append(row);}); }
function download(){ const text=el.writingInput.value.trim(); if(!text){setStatus('请先输入内容');return;} const item=state.mode==='copy'?currentDrill():currentPrompt(); const heading=state.mode==='copy'?'英文跟打':state.task==='task1'?'Task 1':'Task 2'; const content=`TypeAhead ${heading} · ${item.label}\n${new Date().toLocaleString('zh-CN')}\n\n${state.mode==='essay'?item.text+'\n\n':''}${text}\n`; const blob=new Blob([content],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`typeahead-${item.id}-${new Date().toISOString().slice(0,10)}.txt`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus('已导出 TXT'); }
function finishPractice(auto=false){
  const text=el.writingInput.value.trim(); if(!text){if(!auto)setStatus('请先输入内容');return;}
  if(state.finished&&!auto)return;
  stopTimer(); const used=elapsed(),copy=state.mode==='copy',item=copy?currentDrill():currentPrompt(),count=copy?correctChars():wordCount(text),v=speed(),a=copy?accuracy():null;
  state.finished=true; el.writingInput.disabled=false; renderTimer();
  const record={date:new Date().toISOString(),mode:state.mode,label:item.label,count,accuracy:a,speed:v,elapsed:used}; state.history.unshift(record);state.history=state.history.slice(0,30);writeJson(STORAGE+':history',state.history);renderHistory();
  el.resultSummary.textContent=auto?'时间到了。看看这一轮的结果，再决定下一次练什么。':'练习已记录。下面是这次的打字表现。';
  const metrics=copy?[[count,'正确字符'],[`${a}%`,'准确率'],[v,'WPM']]:[[count,'作文词数'],[v,'词 / 分钟'],[formatTime(used),'已用时间']];el.resultMetrics.replaceChildren();metrics.forEach(([value,label])=>{const box=document.createElement('div');const strong=document.createElement('strong');strong.textContent=value;const span=document.createElement('span');span.textContent=label;box.append(strong,span);el.resultMetrics.append(box);});
  el.resultNote.textContent=copy?'准确率按参考段落逐字符计算；WPM 按正确字符 ÷ 5 ÷ 分钟估算。':`雅思学术写作 ${state.task==='task1'?'Task 1':'Task 2'} 建议至少 ${goal()} 词；这里仅反馈打字节奏，不评估作文分数。`;
  el.downloadResultButton.hidden=copy;el.resultDialog.showModal();setStatus('练习已记录');
}
el.essayTab.addEventListener('click',()=>{if(state.mode!=='essay')switchExercise({mode:'essay'});});
el.copyTab.addEventListener('click',()=>{if(state.mode!=='copy')switchExercise({mode:'copy'});});
el.task1Button.addEventListener('click',()=>{if(state.task!=='task1')switchExercise({task:'task1'});});
el.task2Button.addEventListener('click',()=>{if(state.task!=='task2')switchExercise({task:'task2'});});
el.promptSelect.addEventListener('change',()=>switchExercise({promptId:el.promptSelect.value}));
el.drillSelect.addEventListener('change',()=>switchExercise({drillId:el.drillSelect.value}));
el.randomButton.addEventListener('click',()=>{const choices=prompts.filter(p=>p.task===state.task&&p.id!==state.promptId);switchExercise({promptId:choices[Math.floor(Math.random()*choices.length)].id});});
el.startButton.addEventListener('click',startTimer);el.resetButton.addEventListener('click',resetTimer);
el.writingInput.addEventListener('input',()=>{state.finished=false;if(!state.started)startTimer(); if(state.mode==='essay'){const okay=writeJson(draftKey(),el.writingInput.value);setStatus(okay?'已自动保存到本机':'浏览器存储不可用，请及时导出');}else{renderReference();setStatus('正在跟打');if(el.writingInput.value===currentDrill().text){finishPractice();}}renderStats();});
el.writingInput.addEventListener('paste',event=>{if(state.mode==='copy'){event.preventDefault();setStatus('跟打练习不能粘贴，请使用键盘输入');}});
el.writingInput.addEventListener('drop',event=>{if(state.mode==='copy'){event.preventDefault();setStatus('跟打练习不能拖入文字');}});
el.clearButton.addEventListener('click',()=>{if(el.writingInput.value&&!window.confirm(state.mode==='copy'?'重新开始这段跟打？':'清空当前作文草稿？'))return;el.writingInput.value='';if(state.mode==='essay')writeJson(draftKey(),'');resetTimer();if(state.mode==='copy')renderReference();renderStats();el.writingInput.focus();setStatus('内容已清空');});
el.exportButton.addEventListener('click',download);el.finishButton.addEventListener('click',()=>finishPractice());el.downloadResultButton.addEventListener('click',download);
el.clearHistoryButton.addEventListener('click',()=>{if(!state.history.length)return;if(!window.confirm('清除本机保存的练习记录？草稿会保留。'))return;state.history=[];writeJson(STORAGE+':history',[]);renderHistory();});
el.focusButton.addEventListener('click',()=>{state.focus=!state.focus;el.app.classList.toggle('focus-mode',state.focus);el.focusButton.setAttribute('aria-pressed',String(state.focus));el.focusButton.textContent=state.focus?'退出专注':'专注模式';});
populateSelects();state.remaining=duration();loadDraft();state.baselineUnits=units();renderMode();renderTimer();renderHistory();

// Browsers that support WebMCP can expose the same practice setup to an assistant.
if (document.modelContext?.registerTool) {
  const register = tool => {
    try { Promise.resolve(document.modelContext.registerTool(tool)).catch(() => {}); } catch { /* Browsers without a working implementation keep the normal UI. */ }
  };
  register({
    name: 'start_writing_practice',
    title: 'Start writing practice',
    description: 'Select a visible IELTS writing task or typing drill and start its timer.',
    inputSchema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['essay', 'copy'] },
        task: { type: 'string', enum: ['task1', 'task2'] },
        exerciseId: { type: 'string' }
      },
      required: ['mode', 'exerciseId'],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (!input || !['essay', 'copy'].includes(input.mode) || typeof input.exerciseId !== 'string') throw new Error('Invalid practice selection');
      if (input.mode === 'essay') {
        const prompt = prompts.find(p => p.id === input.exerciseId);
        if (!prompt || (input.task && input.task !== prompt.task)) throw new Error('Unknown writing task');
        switchExercise({ mode: 'essay', task: prompt.task, promptId: prompt.id });
      } else {
        if (!drills.some(d => d.id === input.exerciseId)) throw new Error('Unknown typing drill');
        switchExercise({ mode: 'copy', drillId: input.exerciseId });
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
      return { mode: state.mode, exerciseId: state.mode === 'copy' ? state.drillId : state.promptId, timerRunning: state.running, remainingSeconds: state.remaining, wordCount: wordCount(el.writingInput.value), speed: speed(), accuracy: state.mode === 'copy' ? accuracy() : null };
    }
  });
}
