(function(){
"use strict";
var S=window.ISCStore, data=S.load(), esc=S.esc, page=document.body.getAttribute('data-page');
function $(id){return document.getElementById(id);}
/* Hidden reset: add ?reset=1 to any portal URL to clear isc_demo_v1 and reseed. */
if(new URLSearchParams(location.search).get('reset')==='1'){S.reset();var ru=new URL(location.href);ru.searchParams.delete('reset');location.replace(ru.pathname+ru.search+ru.hash);return;}
function appById(id){return data.applications.find(function(a){return a.id===id;});}
function clientById(id){return data.clients.find(function(c){return c.id===id;});}
function badge(st){return '<span class="badge '+esc(st)+'">'+esc(st)+'</span>';}
var PENCIL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>';
var TRASH='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m1 0-1 14H8L7 6"/></svg>';
/* --- modal helpers: open/close, Escape, focus return, Tab trap-lite --- */
var lastFocus=null,modalStack=[];/* stack: [{id,ret}] so a modal can open over another; Esc/close returns focus to its opener */
function topModal(){var t=modalStack[modalStack.length-1];return t?$(t.id):document.querySelector('.modal-back:not([hidden])');}
function openModal(id,ret){var m=$(id);modalStack=modalStack.filter(function(x){return x.id!==id;});modalStack.push({id:id,ret:ret||document.activeElement});lastFocus=ret||document.activeElement;m.hidden=false;var f=m.querySelector('[data-autofocus]')||m.querySelector('input,select,textarea,button');if(f)f.focus();}
function closeModal(id){$(id).hidden=true;var i=-1;modalStack.forEach(function(x,k){if(x.id===id)i=k;});var ret=i>-1?modalStack[i].ret:lastFocus;if(i>-1)modalStack.splice(i,1);if(ret&&!document.contains(ret)&&ret.getAttribute&&ret.getAttribute('data-app'))ret=document.querySelector('[data-app="'+ret.getAttribute('data-app')+'"]');if(ret&&ret.focus&&document.contains(ret))ret.focus();}
document.querySelectorAll('[data-close]').forEach(function(b){b.addEventListener('click',function(){closeModal(b.getAttribute('data-close'));});});
document.addEventListener('keydown',function(e){
 if(e.key==='Escape'){var tm=topModal();if(tm){e.preventDefault();closeModal(tm.id);}}
 if(e.key==='Tab'){var open=topModal();if(!open)return;var items=[].filter.call(open.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]'),function(el){return !el.disabled&&el.offsetParent!==null;});if(!items.length)return;var first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});
document.querySelectorAll('[data-signout]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();sessionStorage.removeItem('isc_demo_role');sessionStorage.removeItem('isc_demo_admin');sessionStorage.removeItem('isc_scope');location.href='../index.html';});});
document.querySelectorAll('[data-menu]').forEach(function(b){b.addEventListener('click',function(){var s=document.querySelector('.side');b.setAttribute('aria-expanded',s.classList.toggle('open'));});});
function wireReset(){var b=$('resetDemo');if(b)b.addEventListener('click',function(){data=S.reset();location.reload();});}
/* ---- Multi-admin: every admin sees every client; 'My clients' = assignedAdminId is the signed-in admin. Choice saved per tab. ---- */
var ME=S.currentAdminId();
function getScope(){return sessionStorage.getItem('isc_scope')==='all'?'all':'mine';}
function inScope(c,sc){return (sc||getScope())==='all'||!!(c&&c.assignedAdminId===ME);}
function adminLabel(id){var a=S.adminById(data,id);return a?S.adminName(a)+(a.id===ME?' (you)':''):'Unassigned';}
function adminOptions(sel){return (data.admins||[]).map(function(a){return '<option value="'+esc(a.id)+'"'+(a.id===sel?' selected':'')+'>'+esc(S.adminName(a))+(a.id===ME?' (you)':'')+'</option>';}).join('');}
function scopeToggle(el,onChange){if(!el)return;var cur=getScope();
 el.setAttribute('role','group');if(!el.getAttribute('aria-label'))el.setAttribute('aria-label','Show clients');
 el.innerHTML='<button type="button" class="seg-btn" data-scope="mine" aria-pressed="'+(cur==='mine')+'">My clients</button><button type="button" class="seg-btn" data-scope="all" aria-pressed="'+(cur==='all')+'">All clients</button>';
 el.querySelectorAll('[data-scope]').forEach(function(b){b.addEventListener('click',function(){var v=b.getAttribute('data-scope');if(v===getScope())return;sessionStorage.setItem('isc_scope',v);
  el.querySelectorAll('[data-scope]').forEach(function(x){x.setAttribute('aria-pressed',String(x===b));});onChange(v);});});}
window.ISCScope={get:getScope,toggle:scopeToggle,me:ME};
document.querySelectorAll('[data-admin-name]').forEach(function(el){el.textContent=S.adminName(S.adminById(data,ME));});
function typeCountry(n){var v=(data.visas||[]).find(function(x){return x.name===n;});return S.visaCountry(v);}
function counselorHtml(a){var c=S.counselorById(a&&a.counselorId);if(!c)return '';return '<p class="counselor"><picture><source type="image/webp" srcset="../assets/img/team/'+c.photo+'.webp?v=20261021c"><img src="../assets/img/team/'+c.photo+'.jpg?v=20261021c" width="40" height="40" alt="" decoding="async"></picture><span>Education Counselor: <strong>'+esc(c.name)+'</strong></span></p>';}
function visaOptions(sel){return S.distinctTypes(data).map(function(n){return '<option value="'+esc(n)+'"'+(n===sel?' selected':'')+'>'+esc(n)+' — '+esc(typeCountry(n))+'</option>';}).join('');}
function fmtEff(iso){var m=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];var parts=String(iso||'').split('-');if(parts.length===3){var mo=parseInt(parts[1],10);if(mo>=1&&mo<=12)return m[mo-1]+' '+parseInt(parts[2],10)+', '+parts[0]+' ('+iso+')';}return iso;}
/* Populate an Effective-date <select> from the visa RECORDS of a type: valid dates newest first, value = visa record id. No valid date -> single 'No effective date yet' option (value ''). Returns true if a valid date is available. */
function populateEffective(typeName,sel){var recs=S.visasOfType(data,typeName).filter(function(v){return v.effective&&!isNaN(Date.parse(v.effective));});
 if(!recs.length){sel.innerHTML='<option value="">No effective date yet</option>';return false;}
 sel.innerHTML=recs.map(function(v){return '<option value="'+esc(v.id)+'">'+esc(fmtEff(v.effective))+'</option>';}).join('');return true;}
function selectedVisa(sel){return data.visas.find(function(v){return v.id===sel.value;})||null;}

/* ================= CLIENT ================= */
if(page==='client-dashboard'){
 var mine=data.applications.filter(function(a){return a.clientId===S.CLIENT_ID;});
 var me=clientById(S.CLIENT_ID);if(me&&$('welcomeName'))$('welcomeName').textContent=me.first;
 initCarousel(data.announcements||[]);
 $('appCards').innerHTML=mine.map(function(a){var p=S.progress(data,a);return '<article class="card"><p>'+badge(a.status)+' <span class="badge">'+esc(a.type)+'</span></p><h3><a href="application.html?id='+a.id+'">'+esc(a.type)+' application</a></h3><p class="muted">Started '+esc(a.date)+' · Effective '+esc(S.effectiveDateOf(data,a)||'—')+'</p><div class="bar" role="progressbar" aria-valuenow="'+p+'" aria-valuemin="0" aria-valuemax="100" aria-label="Checklist progress"><i style="width:'+p+'%"></i></div><p>'+p+'% complete</p><a class="btn navy" href="application.html?id='+a.id+'">Open application</a></article>';}).join('');
 if(!mine.length)$('appCards').innerHTML=emptyState('No applications yet','When your counselor opens an application for you, it will appear here.');
 wireReset();
}
/* Empty-state block. Image: AI-generated still (Higgsfield gpt_image_2_5), disclosed in its alt text. */
function emptyState(title,body){return '<div class="empty-state"><img src="../assets/portal/portal-empty-480.webp?v=20261021c" srcset="../assets/portal/portal-empty-240.webp?v=20261021c 240w, ../assets/portal/portal-empty-480.webp?v=20261021c 480w" sizes="200px" width="480" height="360" loading="lazy" alt="AI-generated image: an empty letter tray beside a small plant on a desk"><div><h3>'+esc(title)+'</h3><p class="muted">'+esc(body)+'</p></div></div>';}
/* Owner-updates carousel: arrows, dots, swipe, Left/Right keys, optional autoplay (off by default; pauses on hover/focus; unavailable under reduced motion). */
function initCarousel(items){var track=$('announcements'),vp=$('cViewport'),dots=$('cDots'),root=$('updates');if(!track)return;var n=items.length,i=0,timer=null,playing=false,paused=false;
 var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 track.innerHTML=items.map(function(a,k){return '<article class="c-slide" role="group" aria-roledescription="slide" aria-label="'+(k+1)+' of '+n+': '+esc(a.title)+'"'+(k?' aria-hidden="true"':'')+'><p class="muted c-date">'+esc(fmtDate(a.date))+'</p><h3>'+esc(a.title)+'</h3><p>'+esc(a.body)+'</p>'+(a.link?'<p><a class="c-link" href="'+esc(a.link.href)+'" target="_blank" rel="noopener"'+(k?' tabindex="-1"':'')+'>'+esc(a.link.text)+' <span class="sr-only">(opens in a new tab)</span>↗</a></p>':'')+'</article>';}).join('');
 dots.innerHTML=items.map(function(a,k){return '<button type="button" class="c-dot" data-dot="'+k+'" aria-label="Show update '+(k+1)+': '+esc(a.title)+'"></button>';}).join('');
 function go(k,fromAuto){i=(k+n)%n;track.style.transform='translateX('+(-100*i)+'%)';
  [].forEach.call(track.children,function(sl,j){sl.setAttribute('aria-hidden',j===i?'false':'true');sl.querySelectorAll('a').forEach(function(l){l.tabIndex=j===i?0:-1;});});
  [].forEach.call(dots.children,function(d,j){if(j===i)d.setAttribute('aria-current','true');else d.removeAttribute('aria-current');});}
 $('cPrev').addEventListener('click',function(){go(i-1);});$('cNext').addEventListener('click',function(){go(i+1);});
 dots.addEventListener('click',function(e){var b=e.target.closest('[data-dot]');if(b)go(Number(b.getAttribute('data-dot')));});
 root.addEventListener('keydown',function(e){if(e.target.tagName==='SELECT')return;if(e.key==='ArrowLeft'){e.preventDefault();go(i-1);}else if(e.key==='ArrowRight'){e.preventDefault();go(i+1);}});
 var x0=null;vp.addEventListener('touchstart',function(e){x0=e.touches[0].clientX;},{passive:true});
 vp.addEventListener('touchend',function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>40)go(dx<0?i+1:i-1);});
 function tick(){if(playing&&!paused)go(i+1,true);}
 function setPlay(on){playing=on;var b=$('cPlay');b.setAttribute('aria-pressed',on?'true':'false');b.textContent=on?'Pause':'Play';b.setAttribute('aria-label',on?'Stop automatic rotation':'Start automatic rotation');
  track.setAttribute('aria-live',on?'off':'polite');clearInterval(timer);if(on)timer=setInterval(tick,6000);}
 if(reduce||n<2){$('cPlay').hidden=true;}else{$('cPlay').addEventListener('click',function(){setPlay(!playing);});}
 root.addEventListener('mouseenter',function(){paused=true;});root.addEventListener('mouseleave',function(){paused=false;});
 root.addEventListener('focusin',function(){paused=true;});root.addEventListener('focusout',function(e){if(!root.contains(e.relatedTarget))paused=false;});
 if(n<2){$('cPrev').hidden=$('cNext').hidden=true;dots.hidden=true;}
 go(0);}
function fmtDate(iso){var m=['January','February','March','April','May','June','July','August','September','October','November','December'];var p=String(iso||'').split('-');return p.length===3?m[+p[1]-1]+' '+(+p[2])+', '+p[0]:iso;}
var EYE='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
if(page==='application'){
 var id=new URLSearchParams(location.search).get('id')||'a1'; var app=appById(id)||data.applications[0]; var cl=S.ensureChecklist(data,app); S.save(data);
 var FL={'received':'Received','pending review':'Pending review','approved':'Approved','rejected':'Rejected'};
 function render(focusSel){ var p=S.progress(data,app); var done=cl.filter(function(x){return x.done;}).length;
  /* Header image: AI-generated still (Higgsfield gpt_image_2_5), disclosed in alt text. */
  $('appDetail').innerHTML='<div class="app-hero"><img src="../assets/portal/portal-app-1280.webp?v=20261021c" srcset="../assets/portal/portal-app-640.webp?v=20261021c 640w, ../assets/portal/portal-app-1280.webp?v=20261021c 1280w" sizes="(max-width: 900px) 100vw, 960px" width="1280" height="300" alt="AI-generated image: a folder, a pen and a notebook on a wooden desk"></div>'
  +'<p>'+badge(app.status)+' <span class="badge">'+esc(app.type)+'</span></p><h2>'+esc(app.type)+' application</h2><p class="muted">Started '+esc(app.date)+' · Effective '+esc(S.effectiveDateOf(data,app)||'—')+'</p>'+counselorHtml(app)
  +'<div class="bar" role="progressbar" aria-valuenow="'+p+'" aria-valuemin="0" aria-valuemax="100" aria-label="Checklist progress"><i style="width:'+p+'%"></i></div><p><strong>'+p+'% complete</strong> · Checklist status: <strong>'+(p===100?'Complete':'Incomplete')+'</strong> ('+done+' of '+cl.length+' done)</p>'
  +(app.status==='Review'?'<p class="review-note">All required documents are uploaded. Your counselor is reviewing your application.</p>':'')
  +(cl.length?'<p class="muted">Requirements are based on your case type. You can upload more than one file for each requirement.</p><ul class="check" style="list-style:none;padding:0">'
  +cl.map(function(r,i){var d=S.docById(data,r.docId);var hasS=!!(d&&d.sample&&(d.sample.dataUrl||d.sample.name));var fs=r.files||[];
   return '<li class="card req'+(r.done?' is-done':'')+'" id="req-'+esc(r.docId)+'"><div class="req-top"><div class="req-main"><strong>'+(r.done?'✓ Done':'○ To do')+' — '+esc(r.label)+'</strong>'+(hasS?'<button type="button" class="icon-btn sample-btn" data-sample="'+esc(r.docId)+'" aria-label="View example document" title="View example"><span class="tip" aria-hidden="true">View example</span>'+EYE+'</button>':'')+'</div><div class="req-side"><label class="btn">'+(fs.length?'Upload more':'Upload')+'<input type="file" multiple data-upload="'+i+'" style="position:absolute;opacity:0;width:1px;height:1px" aria-label="Upload files for '+esc(r.label)+'"></label></div></div>'
   +(fs.length?'<ul class="file-list" aria-label="Uploaded files for '+esc(r.label)+'">'+fs.map(function(f,k){return '<li><span class="file-name">'+esc(f.name)+'</span><span class="file-meta"><span class="doc-pill doc-'+f.status.replace(' ','-')+'">'+FL[f.status]+'</span><span class="muted">'+esc(f.at)+'</span><button type="button" class="icon-btn file-del" data-rm="'+i+':'+k+'" aria-label="Remove '+esc(f.name)+'" title="Remove">'+TRASH+'</button></span></li>';}).join('')+'</ul>':'')
   +'</li>';}).join('')+'</ul>':emptyState('No requirements yet','Your counselor has not listed any documents for this application yet.'))
  +'<p class="sr-only" role="status" aria-live="polite" id="appMsg"></p>';
  document.querySelectorAll('[data-sample]').forEach(function(b){b.addEventListener('click',function(){openSample(S.docById(data,b.getAttribute('data-sample')),b);});});
  document.querySelectorAll('[data-upload]').forEach(function(inp){inp.addEventListener('change',function(){if(!inp.files||!inp.files.length)return;var idx=Number(inp.getAttribute('data-upload'));var r=cl[idx];r.files=r.files||[];var t=S.today(),names=[];
   [].forEach.call(inp.files,function(f){var nm=S.fileName(data,app,r,S.extOf(f.name),t);names.push(nm);r.files.push({name:nm,at:t,status:'pending review'});});
   S.syncRow(r);S.syncReview(data,app);app.updatedAt=t;S.save(data);render('[data-upload="'+idx+'"]');$('appMsg').textContent='Uploaded '+names.join(', ')+'.';});});
  document.querySelectorAll('[data-rm]').forEach(function(b){b.addEventListener('click',function(){var q=b.getAttribute('data-rm').split(':'),r=cl[+q[0]],f=r.files.splice(+q[1],1)[0];
   S.syncRow(r);S.syncReview(data,app);app.updatedAt=S.today();S.save(data);var left=r.files.length;render(left?'[data-rm="'+q[0]+':'+Math.min(+q[1],left-1)+'"]':'[data-upload="'+q[0]+'"]');$('appMsg').textContent='Removed '+f.name+'.';});});
  if(focusSel){var el=document.querySelector(focusSel);if(el)el.focus();}
 } render();
}
if(page==='tasks'){
 function taskRows(){var today=S.today(),rows=[];
  data.applications.filter(function(a){return a.clientId===S.CLIENT_ID;}).forEach(function(a){S.ensureChecklist(data,a).forEach(function(r){if(!r.done)rows.push({kind:'doc',title:'Upload: '+r.label,app:a,due:a.due||'',done:false,href:'application.html?id='+a.id+'#req-'+r.docId});});});
  data.tasks.forEach(function(t,i){rows.push({kind:'task',i:i,title:t.title,app:appById(t.appId),due:t.due||'',done:!!t.done});});
  rows.forEach(function(x){x.status=x.done?'Done':(x.due&&x.due<today?'Overdue':'To do');});return rows;}
 function renderTasks(focusI){var rows=taskRows();S.save(data);
  if(!rows.length){$('tasksWrap').innerHTML=emptyState('You’re all caught up','There are no tasks or missing documents right now.');return;}
  var cls={'Done':'done','Overdue':'overdue','To do':'todo'};
  $('tasksWrap').innerHTML='<div class="s-card task-card"><table class="task-table"><caption class="sr-only">Your tasks</caption><thead><tr><th scope="col">Task</th><th scope="col">Application</th><th scope="col">Due</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Action</span></th></tr></thead><tbody>'
  +rows.map(function(x){return '<tr class="'+(x.done?'is-done':'')+'"><td data-label="Task"><strong>'+esc(x.title)+'</strong><span class="muted task-kind">'+(x.kind==='doc'?'Missing document':'From your counselor')+'</span></td>'
   +'<td data-label="Application">'+(x.app?'<a href="application.html?id='+esc(x.app.id)+'">'+esc(x.app.type)+'</a>':'—')+'</td>'
   +'<td data-label="Due">'+esc(x.due?fmtDate(x.due):'—')+'</td>'
   +'<td data-label="Status"><span class="t-badge t-'+cls[x.status]+'">'+x.status+'</span></td>'
   +'<td class="task-act">'+(x.kind==='doc'?'<a class="s-btn" href="'+esc(x.href)+'">Upload<span class="sr-only"> '+esc(x.title.replace('Upload: ',''))+'</span></a>':'<button type="button" class="s-btn'+(x.done?' outline':'')+'" data-task="'+x.i+'" aria-pressed="'+x.done+'">'+(x.done?'Mark as to do':'Mark done')+'<span class="sr-only">: '+esc(x.title)+'</span></button>')+'</td></tr>';}).join('')+'</tbody></table></div>';
  document.querySelectorAll('[data-task]').forEach(function(b){b.addEventListener('click',function(){var k=Number(b.getAttribute('data-task'));var t=data.tasks[k];t.done=!t.done;S.save(data);renderTasks(k);$('taskMsg').textContent=(t.done?'Marked done: ':'Marked as to do: ')+t.title;});});
  if(focusI!==undefined){var el=document.querySelector('[data-task="'+focusI+'"]');if(el)el.focus();}}
 renderTasks();
}
if(page==='profile'){
 var c=clientById(S.CLIENT_ID); var f=$('profileForm');
 ['first','last','phone','email','address','language','dob'].forEach(function(k){if(f.elements[k])f.elements[k].value=c[k]||'';});
 f.addEventListener('submit',function(e){e.preventDefault();['first','last','phone','email','address','language','dob'].forEach(function(k){c[k]=f.elements[k].value.trim();});c.updatedAt=S.today();S.save(data);$('profileMsg').textContent='Saved.';});
 wireReset();
}

/* ---- Shared: requirement sample files (owner attaches in Documents; client views from the checklist). Needs #sampleModal. ---- */
function fmtSize(n){if(!n)return 'size unknown';return n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB';}
function typeLabel(t,name){if(/^image\//.test(t))return t.replace('image/','').toUpperCase()+' image';if(t==='application/pdf')return 'PDF document';var ext=(String(name).split('.').pop()||'').toUpperCase();return t||(ext?ext+' file':'File');}
function dataUrlToBlob(u){var p=u.split(','),m=(p[0].match(/data:([^;]+)/)||[])[1]||'application/octet-stream',b=atob(p[1]),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return new Blob([a],{type:m});}
var sampleUrl=null;
function openSample(doc,opener){var x=doc&&doc.sample;if(!x)return;if(sampleUrl){URL.revokeObjectURL(sampleUrl);sampleUrl=null;}
 $('sampleTitle').textContent='Example: '+doc.name.replace(/\s*\(sample\)/,'');
 $('sampleMeta').innerHTML='<span>'+esc(x.name)+'</span><span>'+esc(typeLabel(x.type,x.name))+'</span><span>'+esc(fmtSize(x.size))+'</span>';
 var body='',dl=$('sampleDownload');
 if(x.dataUrl){sampleUrl=URL.createObjectURL(dataUrlToBlob(x.dataUrl));dl.href=sampleUrl;dl.download=x.name;dl.hidden=false;
  if(/^image\//.test(x.type))body='<img src="'+sampleUrl+'" alt="Example file for '+esc(doc.name)+'">';
  else if(x.type==='application/pdf')body='<object data="'+sampleUrl+'" type="application/pdf" aria-label="PDF preview of '+esc(x.name)+'"><p class="muted">PDF preview isn’t available in this browser. Use Download to open it.</p></object>';
  else body='<p class="muted">No preview for this file type. Use Download to open it.</p>';}
 else{dl.hidden=true;body='<p class="muted">Only the file name was recorded for this example, so there is nothing to preview or download.</p>';}
 $('samplePreview').innerHTML=body;openModal('sampleModal',opener);}
/* ---- Shared: application documents dialog (owner Clients + owner Dashboard). Needs #docsModal with the docs* ids. ---- */
function appDetailsHtml(a,visa){var c=clientById(a.clientId);function row(k,v){return '<div><dt>'+k+'</dt><dd>'+v+'</dd></div>';}
 return '<dl class="detail-grid">'+row('Client',esc(S.clientName(c)))+row('Case type',esc(a.type))+row('Country',esc(S.visaCountry(visa)))+row('Education Counselor',esc((S.counselorById(a.counselorId)||{}).name||'—'))+row('Status',badge(a.status))
  +row('Effective',esc(S.effectiveDateOf(data,a)||'—'))+row('Created',esc(a.createdAt||a.date||'—'))+row('Updated',esc(a.updatedAt||a.createdAt||'—'))
  +(a.due?row('Due',esc(a.due)):'')+'</dl><p class="detail-notes"><span class="muted">Notes</span><br>'+esc((visa&&visa.notes)||'—')+'</p>';}
 var DOC_LABEL={'received':'Received','pending review':'Pending review','approved':'Approved','rejected':'Rejected','missing':'Missing'};
function docPill(st){return '<span class="doc-pill doc-'+st.replace(' ','-')+'">'+DOC_LABEL[st]+'</span>';}
var docsApp=null,pendingFile=null,onDocsChanged=null;
/* Owner documents modal (clients page + dashboard overdue dialog). One row per uploaded file: status <select> saves immediately; trash asks to confirm. */
function renderDocs(appId){var a=appById(appId);if(!a)return;docsApp=appId;var visa=S.visaFor(data,a);var cl=S.ensureChecklist(data,a);S.save(data);
 if($('docsDetails'))$('docsDetails').innerHTML=appDetailsHtml(a,visa);
 var got=[],miss=cl.filter(function(r){return !r.done;});cl.forEach(function(r){(r.files||[]).forEach(function(f,k){got.push({r:r,f:f,k:k});});});
 var vname=visa?visa.name+' (effective '+(visa.effective||'—')+')':a.type;
 $('docsTitle').textContent=a.type+' — documents';
 $('docsSub').innerHTML='Client: <strong>'+esc(S.clientName(clientById(a.clientId)))+'</strong> · Case type: <a href="visas.html">'+esc(vname)+'</a> · Country: <strong>'+esc(S.visaCountry(visa))+'</strong> · Education Counselor: <strong>'+esc((S.counselorById(a.counselorId)||{}).name||'—')+'</strong> · '+badge(a.status);
 var nDone=cl.filter(function(r){return r.done;}).length;
 $('docsSummary').textContent=cl.length?(nDone+' of '+cl.length+' required documents received · '+got.length+' file'+(got.length===1?'':'s')+' uploaded'):'This visa has no required documents listed.';
 $('docsList').innerHTML=got.length?got.map(function(g){var f=g.f,key=esc(g.r.docId+':'+g.k);return '<li class="doc-row"><div class="doc-main"><strong>'+esc(g.r.label)+'</strong>'
  +'<span class="muted">File: '+esc(f.name)+'</span></div>'
  +'<div class="doc-side"><label class="sr-only" for="fs-'+key+'">Status for '+esc(f.name)+'</label><select class="doc-status-sel" id="fs-'+key+'" data-fstatus="'+key+'">'+S.FILE_STATUSES.map(function(st){return '<option value="'+st+'"'+(st===f.status?' selected':'')+'>'+DOC_LABEL[st]+'</option>';}).join('')+'</select>'
  +'<span class="doc-date"><span class="muted">Submitted</span> '+esc(f.at||'—')+'</span>'
  +'<button class="btn" type="button" data-dl="'+key+'">View / Download</button><button class="icon-btn danger-icon" type="button" data-fdel="'+key+'" aria-label="Delete '+esc(f.name)+'" title="Delete">'+TRASH+'</button></div></li>';}).join(''):'<li class="muted">No documents submitted yet.</li>';
 $('docsMissing').innerHTML=miss.length?miss.map(function(r){return '<li>'+docPill('missing')+' '+esc(r.label)+'</li>';}).join(''):'<li class="muted">None — every required document has been received.</li>';
 $('docsMissingWrap').hidden=!cl.length;
 function find(key){var q=key.split(':');var r=cl.find(function(x){return x.docId===q[0];});return {r:r,f:r.files[+q[1]],k:+q[1]};}
 document.querySelectorAll('#docsList [data-dl]').forEach(function(b){b.addEventListener('click',function(){var g=find(b.getAttribute('data-dl'));downloadPlaceholder(a,g.r,visa,g.f);});});
 document.querySelectorAll('#docsList [data-fstatus]').forEach(function(sel){sel.addEventListener('change',function(){var g=find(sel.getAttribute('data-fstatus'));g.f.status=sel.value;S.syncRow(g.r);a.updatedAt=S.today();S.save(data);$('docsMsg').textContent='Saved: '+g.f.name+' is now '+DOC_LABEL[sel.value]+'.';if(onDocsChanged)onDocsChanged();});});
 document.querySelectorAll('#docsList [data-fdel]').forEach(function(b){b.addEventListener('click',function(){var g=find(b.getAttribute('data-fdel'));pendingFile={appId:a.id,docId:g.r.docId,k:g.k};$('fileDeleteMsg').textContent='Delete “'+g.f.name+'” from '+g.r.label+'? This cannot be undone.';openModal('fileDeleteModal',b);});});}
function openDocs(appId,opener){renderDocs(appId);openModal('docsModal',opener);}
if($('confirmFileDelete'))$('confirmFileDelete').addEventListener('click',function(){if(!pendingFile)return;var a=appById(pendingFile.appId),cl=S.ensureChecklist(data,a),r=cl.find(function(x){return x.docId===pendingFile.docId;});
 var f=r.files.splice(pendingFile.k,1)[0];S.syncRow(r);var was=a.status;S.syncReview(data,a);a.updatedAt=S.today();S.save(data);pendingFile=null;
 closeModal('fileDeleteModal');renderDocs(a.id);if(onDocsChanged)onDocsChanged();
 $('docsMsg').textContent='Deleted '+f.name+'.'+(was!==a.status?' Status changed from '+was+' to '+a.status+'.':'');var t=$('docsSummary');t.tabIndex=-1;t.focus();});
/* Uploads store filenames only, so View/Download generates a small plain-text placeholder in the browser (Blob, .txt) named after the uploaded file. */
function downloadPlaceholder(a,r,visa,f){var base=((f&&f.name)||('document-'+S.slug(r.label))).replace(/\.[A-Za-z0-9]+$/,'');
 var txt=['International Students Connect — placeholder file','','This is a generated placeholder. Only the file name was stored; no file contents are kept in this browser.','',
  'Document: '+r.label,'Stored file name: '+((f&&f.name)||'—'),'Application: '+a.type+' ('+a.id+')','Case type: '+(visa?visa.name+' (effective '+(visa.effective||'—')+')':'—'),
  'Client: '+S.clientName(clientById(a.clientId)),'Status: '+DOC_LABEL[(f&&f.status)||'received'],'Submitted: '+((f&&f.at)||'—'),'Generated: '+new Date().toISOString()].join('\n');
 var url=URL.createObjectURL(new Blob([txt],{type:'text/plain'}));var l=document.createElement('a');l.href=url;l.download=base+'.txt';document.body.appendChild(l);l.click();l.remove();setTimeout(function(){URL.revokeObjectURL(url);},1500);
 $('docsMsg').textContent='Downloaded '+base+'.txt (placeholder).';}

/* ================= OWNER: dashboard ================= */
if(page==='owner-dashboard'){
 var NAVY='#0b1626',GOLD='#4482c1',PAL=['#0b1626','#4482c1','#2a609b','#9cc0e6','#c20000','#6b7a90','#a1a1aa'];
 var MUTED='#71717a',GRID='#e4e4e7',RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 function monLabel(k){return MON[+k.slice(5)-1]+' '+k.slice(2,4);}
 function money(n){return '$'+Math.round(n).toLocaleString('en-CA');}
 var charts=[],SC,A,C,share;
function mk(el,cfg){var c=new Chart(el,cfg);charts.push(c);return c;}
function scaleSt(o){var r={};Object.keys(o).forEach(function(k){r[k]=Math.round(o[k]*share);});return r;}
/* 'My clients': live numbers use only the admin's clients; past months are the agency history scaled by the admin's share of clients. */
window.addEventListener('scroll',function(){$('chartTip').hidden=true;},{passive:true});
function drawDash(){charts.forEach(function(c){c.destroy();});charts=[];SC=getScope();
 C=data.clients.filter(function(c){return inScope(c,SC);});var ids={};C.forEach(function(c){ids[c.id]=1;});
 A=data.applications.filter(function(a){return ids[a.clientId];});share=data.clients.length?C.length/data.clients.length:0;
 if($('scopeNote'))$('scopeNote').textContent=SC==='all'?'Showing all '+C.length+' clients across the team.':'Showing the '+C.length+' clients assigned to you.';
function awaitingApps(){return A.filter(function(a){return S.progress(data,a)<100;});}
 function byType(list){var o={};list.forEach(function(a){o[a.type]=(o[a.type]||0)+1;});return Object.keys(o).sort(function(x,y){return o[y]-o[x];}).map(function(k){return [k,o[k]];});}
 function table(cap,head,rows){return '<table class="sr-only"><caption>'+esc(cap)+'</caption><thead><tr>'+head.map(function(h){return '<th>'+esc(h)+'</th>';}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+esc(c)+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table>';}
 var keys=S.monthKeys(12),M=data.metrics||{revenue:{},clients:{}};
 var rev=keys.map(function(k){return Math.round((M.revenue[k]||0)*share/50)*50;});
 var cli=keys.map(function(k,i){return i===keys.length-1?C.length:Math.round((M.clients[k]||0)*share);});
 var curRev=rev[rev.length-1],total12=rev.reduce(function(x,y){return x+y;},0);
 var actives=A.filter(function(a){return a.status==='Active';});
 var awaiting=awaitingApps();
 /* KPI cards (revenue card = current month of the revenue chart) */
 $('kpis').innerHTML=[['Revenue · '+monLabel(keys[11]),money(curRev),'12-month total '+money(total12)],['Total clients',C.length,SC==='all'?'Month-end total, live':'Assigned to you, live'],['Active cases',actives.length,'Status: Active'],['Awaiting documents',awaiting.length,'Required documents still missing']]
  .map(function(k){return '<article class="s-card kpi"><p class="kpi-label">'+esc(k[0])+'</p><p class="kpi-value">'+esc(k[1])+'</p><p class="kpi-sub">'+esc(k[2])+'</p></article>';}).join('');
 /* ---- Charts ---- */
 function extTooltip(ctx){var el=$('chartTip');var t=ctx.tooltip;if(!t||t.opacity===0){el.hidden=true;return;}
  var title=(t.title||[]).join(' ');var rows=t.dataPoints.map(function(p){var col=p.dataset.backgroundColor;col=Array.isArray(col)?col[p.dataIndex]:(p.dataset.borderColor&&p.chart.config.type==='line'?p.dataset.borderColor:col);if(typeof col!=='string')col=NAVY;
   var v=p.chart.canvas.id==='revChart'?money(p.raw):p.raw;return '<div class="tip-row"><span class="tip-dot" style="background:'+col+'"></span><span class="tip-name">'+esc(p.dataset.label||p.label)+'</span><span class="tip-val">'+esc(v)+'</span></div>';}).join('');
  el.innerHTML=(title?'<div class="tip-title">'+esc(title)+'</div>':'')+rows;el.hidden=false;
  var r=ctx.chart.canvas.getBoundingClientRect(),w=el.offsetWidth,x=r.left+window.scrollX+t.caretX+12,y=r.top+window.scrollY+t.caretY-el.offsetHeight/2;
  if(x+w>window.scrollX+document.documentElement.clientWidth-8)x=r.left+window.scrollX+t.caretX-w-12;el.style.left=Math.max(8,x)+'px';el.style.top=y+'px';}
 function baseOpts(extra){var o={responsive:true,maintainAspectRatio:false,animation:RM?false:{duration:500},
   plugins:{legend:{display:false},tooltip:{enabled:false,external:extTooltip,mode:'index',intersect:false}},interaction:{mode:'index',intersect:false},
   scales:{x:{grid:{display:false},border:{display:false},ticks:{color:MUTED,font:{size:11}}},
    y:{beginAtZero:true,grid:{color:GRID,drawTicks:false},border:{display:false,dash:[4,4]},ticks:{color:MUTED,font:{size:11},padding:8,maxTicksLimit:5}}}};
  return Object.assign(o,extra||{});}
 function dashGrid(o){o.scales.y.grid.tickBorderDash=[4,4];o.scales.y.border.dash=[4,4];return o;}
 if(window.Chart){
  Chart.defaults.font.family='Jakarta,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif';Chart.defaults.color=MUTED;
  var dashPlugin={id:'dashY',beforeDraw:function(c){if(c.config.type==='doughnut')return;}};
  /* line: revenue */
  var rc=$('revChart'),g=rc.getContext('2d').createLinearGradient(0,0,0,260);g.addColorStop(0,'rgba(68,130,193,.32)');g.addColorStop(1,'rgba(68,130,193,0)');
  var o1=dashGrid(baseOpts());o1.scales.y.ticks.callback=function(v){return '$'+(v/1000)+'k';};
  mk(rc,{type:'line',data:{labels:keys.map(monLabel),datasets:[{label:'Revenue',data:rev,borderColor:GOLD,backgroundColor:g,fill:true,tension:.4,borderWidth:2,pointRadius:0,pointHoverRadius:4,pointHoverBackgroundColor:GOLD,pointHoverBorderColor:'#fff',pointHoverBorderWidth:2}]},options:o1});
  /* bar: clients */
  mk($('cliChart'),{type:'bar',data:{labels:keys.map(monLabel),datasets:[{label:'Clients',data:cli,backgroundColor:NAVY,hoverBackgroundColor:'#1d2c44',borderRadius:6,borderSkipped:false,maxBarThickness:28}]},options:dashGrid(baseOpts())});
  /* doughnut: active by type, centre total */
  var at=byType(actives);
  var centre={id:'centreTotal',afterDraw:function(c){var m=c.getDatasetMeta(0).data[0];if(!m)return;var x=m.x,y=m.y,ctx=c.ctx;ctx.save();ctx.textAlign='center';ctx.fillStyle='#09090b';ctx.font='700 26px Jakarta,system-ui,sans-serif';ctx.fillText(String(actives.length),x,y+4);ctx.fillStyle=MUTED;ctx.font='12px Jakarta,system-ui,sans-serif';ctx.fillText('Active',x,y+22);ctx.restore();}};
  mk($('actChart'),{type:'doughnut',data:{labels:at.map(function(r){return r[0];}),datasets:[{label:'Active cases',data:at.map(function(r){return r[1];}),backgroundColor:PAL.slice(0,at.length),borderWidth:0,spacing:3,borderRadius:6,hoverOffset:4}]},
   options:{responsive:true,maintainAspectRatio:false,cutout:'68%',animation:RM?false:{duration:500},plugins:{legend:{display:false},tooltip:{enabled:false,external:extTooltip}}},plugins:[centre]});
  $('actLegend').innerHTML=at.map(function(r,i){return '<li><span class="dot" style="background:'+PAL[i]+'"></span>'+esc(r[0])+'<b>'+r[1]+'</b></li>';}).join('');
  /* horizontal bar: awaiting documents by case type */
  var aw=byType(awaiting);var o4=dashGrid(baseOpts({indexAxis:'y'}));o4.scales={x:{beginAtZero:true,grid:{color:GRID,drawTicks:false,tickBorderDash:[4,4]},border:{display:false,dash:[4,4]},ticks:{color:MUTED,font:{size:11},precision:0,maxTicksLimit:5}},y:{grid:{display:false},border:{display:false},ticks:{color:MUTED,font:{size:11}}}};
  mk($('awChart'),{type:'bar',data:{labels:aw.map(function(r){return r[0];}),datasets:[{label:'Awaiting documents',data:aw.map(function(r){return r[1];}),backgroundColor:GOLD,hoverBackgroundColor:'#2a609b',borderRadius:6,borderSkipped:false,maxBarThickness:22}]},options:o4});
  
 }
 /* aria summaries + hidden data tables */
 function lab(id,txt){var c=$(id);c.setAttribute('role','img');c.setAttribute('aria-label',txt);}
 var mx=rev.indexOf(Math.max.apply(null,rev));
 lab('revChart','Line chart of revenue per month for the last 12 months, '+monLabel(keys[0])+' to '+monLabel(keys[11])+'. Highest '+monLabel(keys[mx])+' at '+money(rev[mx])+'; this month '+money(curRev)+'.');
 lab('cliChart','Bar chart of total clients at each month end for the last 12 months, rising from '+cli[0]+' to '+cli[11]+'.');
 lab('actChart','Doughnut chart of '+actives.length+' active cases by case type: '+byType(actives).map(function(r){return r[0]+' '+r[1];}).join(', ')+'.');
 lab('awChart','Horizontal bar chart of '+awaiting.length+' cases awaiting documents by case type: '+byType(awaiting).map(function(r){return r[0]+' '+r[1];}).join(', ')+'.');
 $('revTable').innerHTML=table('Revenue per month',['Month','Revenue'],keys.map(function(k,i){return [monLabel(k),money(rev[i])];}));
 $('cliTable').innerHTML=table('Total clients per month',['Month','Clients'],keys.map(function(k,i){return [monLabel(k),cli[i]];}));
 $('actTable').innerHTML=table('Active cases by case type',['Case type','Cases'],byType(actives));
 $('awTable').innerHTML=table('Cases awaiting documents by case type',['Case type','Cases'],byType(awaiting));
 /* stacked bar: cases by status per month (segment colour == status pill dot colour, see owner-shad.css) */
 var STC={New:'#a1a1aa',Submitted:'#6b85ad',Review:'#0f766e',Active:'#0b1626',Approved:'#4482c1',Denied:'#dc2626',Cancelled:'#d4d4d8'},EXTRA=['#2a609b','#9cc0e6','#71717a'];
 var sts=S.STATUSES.slice();A.forEach(function(a){if(a.status&&sts.indexOf(a.status)<0)sts.push(a.status);});
 var live={};A.forEach(function(a){live[a.status]=(live[a.status]||0)+1;});
 var stH=keys.map(function(k,i){return i===keys.length-1?live:scaleSt((M.status||{})[k]||{});});
 function stCol(st,i){return STC[st]||EXTRA[i%EXTRA.length];}
 if(window.Chart){
  var o5=dashGrid(baseOpts());o5.scales.x.stacked=true;o5.scales.y.stacked=true;o5.scales.y.ticks.precision=0;
  o5.plugins.tooltip.external=function(ctx){extTooltip(ctx);var t=ctx.tooltip;if(!t||t.opacity===0)return;var tot=t.dataPoints.reduce(function(x,p){return x+p.raw;},0);
   $('chartTip').insertAdjacentHTML('beforeend','<div class="tip-row tip-total"><span class="tip-name">Total</span><span class="tip-val">'+tot+'</span></div>');};
  o5.plugins.tooltip.itemSort=function(a,b){return b.datasetIndex-a.datasetIndex;};
  mk($('stChart'),{type:'bar',data:{labels:keys.map(monLabel),datasets:sts.map(function(st,i){return {label:st,data:stH.map(function(o){return o[st]||0;}),backgroundColor:stCol(st,i),borderRadius:i===sts.length-1?{topLeft:6,topRight:6}:0,borderSkipped:false,maxBarThickness:30,
   borderWidth:{top:1},borderColor:'#fff'};})},options:o5});
 }
 $('stLegend').innerHTML=sts.map(function(st,i){return '<li><span class="dot" style="background:'+stCol(st,i)+'"></span>'+esc(st)+'</li>';}).join('');
 var tots=stH.map(function(o){return sts.reduce(function(x,st){return x+(o[st]||0);},0);});
 lab('stChart','Stacked bar chart of cases by status for each of the last 12 months. This month: '+sts.map(function(st){return st+' '+(live[st]||0);}).join(', ')+'; total '+tots[11]+'.');
 $('stTable').innerHTML=table('Cases by status per month',['Month'].concat(sts,['Total']),keys.map(function(k,i){return [monLabel(k)].concat(sts.map(function(st){return stH[i][st]||0;}),[tots[i]]);}));
 /* ---- Overdue ---- */
 var today=S.today();var overdue=A.filter(function(a){return a.due&&a.due<today&&a.status!=='Approved'&&a.status!=='Cancelled';})
  .map(function(a){return {a:a,days:Math.round((Date.parse(today)-Date.parse(a.due))/864e5)};}).sort(function(x,y){return y.days-x.days;});
 $('overdueCount').textContent=overdue.length?overdue.length+' case'+(overdue.length===1?'':'s'):'';
 $('overdue').innerHTML=overdue.length?overdue.map(function(o){var a=o.a;return '<tr class="row-link" tabindex="0" data-app="'+esc(a.id)+'" aria-label="'+esc(S.clientName(clientById(a.clientId))+', '+a.type+', '+o.days+' days overdue. Open details')+'">'
   +'<td data-label="Client"><span class="cell-strong">'+esc(S.clientName(clientById(a.clientId)))+'</span></td><td data-label="Case type">'+esc(a.type)+'</td><td data-label="Status">'+badge(a.status)+'</td><td data-label="Due date">'+esc(a.due)+'</td>'
   +'<td data-label="Days overdue" class="num"><span class="s-badge destructive">'+o.days+' days</span></td></tr>';}).join(''):'<tr><td colspan="5" class="muted">No overdue cases.</td></tr>';
 document.querySelectorAll('#overdue [data-app]').forEach(function(tr){function go(){openDocs(tr.getAttribute('data-app'),tr);}tr.addEventListener('click',go);tr.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});});
 /* ---- Recent applicants (10 per page) ---- */
 var recent=A.slice().reverse(),PER=10,pg=1,pages=Math.max(1,Math.ceil(recent.length/PER));
 function renderRecent(){var start=(pg-1)*PER;
  $('recent').innerHTML=recent.slice(start,start+PER).map(function(a,i){return '<tr><td data-label="No." class="muted">'+(start+i+1)+'</td><td data-label="Applicant"><span class="cell-strong">'+esc(S.clientName(clientById(a.clientId)))+'</span></td><td data-label="Case type">'+esc(a.type)+'</td><td data-label="Assigned admin">'+esc(adminLabel((clientById(a.clientId)||{}).assignedAdminId))+'</td><td data-label="Status">'+badge(a.status)+'</td><td data-label="Effective date">'+esc(S.effectiveDateOf(data,a)||'—')+'</td></tr>';}).join('');
  var pgr=$('recentPager');if(recent.length<=PER){pgr.hidden=true;return;}pgr.hidden=false;
  var h='<button type="button" class="s-btn ghost" data-pg="prev" '+(pg===1?'disabled':'')+' aria-label="Previous page">‹ Previous</button>';
  for(var i=1;i<=pages;i++)h+='<button type="button" class="s-btn '+(i===pg?'outline':'ghost')+' pg-num" data-pg="'+i+'" '+(i===pg?'aria-current="page"':'')+' aria-label="Page '+i+'">'+i+'</button>';
  h+='<button type="button" class="s-btn ghost" data-pg="next" '+(pg===pages?'disabled':'')+' aria-label="Next page">Next ›</button>';
  pgr.innerHTML=h;$('recentInfo').textContent='Showing '+(start+1)+'–'+Math.min(start+PER,recent.length)+' of '+recent.length;
  pgr.querySelectorAll('[data-pg]').forEach(function(b){b.addEventListener('click',function(){var v=b.getAttribute('data-pg');pg=v==='prev'?pg-1:v==='next'?pg+1:+v;renderRecent();var f=pgr.querySelector('[aria-current]');if(f)f.focus();});});}
 renderRecent();
}
drawDash();scopeToggle($('scopeSeg'),drawDash);
}

/* ================= OWNER: clients ================= */
if(page==='clients'){
 var per=20, cur=1, editingId=null;
 $('newVisaType').innerHTML=visaOptions(); $('editVisaType').innerHTML=visaOptions();
 (function(){var t=[];(data.visas||[]).forEach(function(v){if(t.indexOf(v.name)<0)t.push(v.name);});data.applications.forEach(function(x){if(x.type&&t.indexOf(x.type)<0)t.push(x.type);});$('fType').innerHTML='<option value="">All case types</option>'+t.map(function(n){return '<option>'+esc(n)+'</option>';}).join('');})();
 function filtered(){var q=$('search').value.toLowerCase(), st=$('fStatus').value, ty=$('fType').value;
  return data.clients.filter(function(c){if(!inScope(c))return false;var apps=data.applications.filter(function(a){return a.clientId===c.id;});var name=S.clientName(c).toLowerCase();
   return (!q||name.indexOf(q)>-1||apps.some(function(a){return a.type.toLowerCase().indexOf(q)>-1;})) && (!st||apps.some(function(a){return a.status===st;})) && (!ty||apps.some(function(a){return a.type===ty;}));});}
 function render(){var list=filtered();var pages=Math.max(1,Math.ceil(list.length/per));if(cur>pages)cur=pages;var slice=list.slice((cur-1)*per,cur*per);
  $('clientRows').innerHTML=slice.map(function(c){var apps=data.applications.filter(function(a){return a.clientId===c.id;});var latest=apps[apps.length-1];return '<tr><td><span class="cell-strong">'+esc(S.clientName(c))+'</span> <span class="muted cell-code">'+esc(S.clientCode(c))+'</span></td><td>'+esc(c.email)+'</td><td>'+esc(c.phone)+'</td><td><span class="assignee'+(c.assignedAdminId===ME?' is-me':'')+'">'+esc(adminLabel(c.assignedAdminId))+'</span></td><td>'+apps.length+'</td><td>'+(latest?esc(latest.type)+' · '+esc(latest.status):'—')+'</td><td class="row-acts"><button type="button" class="icon-btn" data-edit-client="'+c.id+'" aria-label="Edit client '+esc(S.clientName(c))+'" title="Edit client">'+PENCIL+'</button><a class="btn sm msg-btn" href="messages.html?c='+encodeURIComponent(c.id)+'" aria-label="Message '+esc(S.clientName(c))+'">Message</a></td></tr>';}).join('');
  $('pageInfo').textContent='Page '+cur+' of '+pages+' · '+list.length+' clients';
  $('prevPage').disabled=cur<=1; $('nextPage').disabled=cur>=pages;
  document.querySelectorAll('[data-edit-client]').forEach(function(b){b.addEventListener('click',function(){openEdit(b.getAttribute('data-edit-client'),b);});});}
 onDocsChanged=function(){render();if(editingId)renderEditApps();};
 function docCount(a){return S.ensureChecklist(data,a).filter(function(r){return r.done;}).length;}
 function renderEditApps(){var apps=data.applications.filter(function(a){return a.clientId===editingId;});
  $('editApps').innerHTML=apps.length?apps.map(function(a){var n=docCount(a),eff=S.effectiveDateOf(data,a)||'—';
   return '<li><div class="app-card" role="button" tabindex="0" data-app="'+esc(a.id)+'" aria-label="'+esc(a.type+', '+a.status+', '+n+' document'+(n===1?'':'s')+'. Open documents')+'">'
   +'<div class="app-card-top"><span class="app-card-type">'+esc(a.type)+'</span>'+badge(a.status)+'</div>'
   +'<dl class="app-card-meta"><div><dt>Counselor</dt><dd>'+esc((S.counselorById(a.counselorId)||{}).name||'—')+'</dd></div><div><dt>Effective</dt><dd>'+esc(eff)+'</dd></div><div><dt>Created</dt><dd>'+esc(a.createdAt||a.date)+'</dd></div><div><dt>Updated</dt><dd>'+esc(a.updatedAt||a.createdAt||a.date)+'</dd></div></dl>'
   +'<div class="app-card-foot"><span>'+n+' document'+(n===1?'':'s')+'</span><span class="app-card-chev" aria-hidden="true">View documents ›</span></div></div></li>';}).join(''):'<li class="card">No applications yet.</li>';
  S.save(data);
  document.querySelectorAll('#editApps [data-app]').forEach(function(el){function go(){openDocs(el.getAttribute('data-app'),el);}
   el.addEventListener('click',go);el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});});}
 function openEdit(cid,btn){editingId=cid;var c=clientById(cid);$('editFirst').value=c.first||'';$('editMiddle').value=c.middle||'—';$('editLast').value=c.last||'';$('editEmail').value=c.email;$('editPhone').value=c.phone;$('editClientName').textContent=S.clientName(c);$('editAdmin').innerHTML=adminOptions(c.assignedAdminId);if($('editClientMsg')){$('editClientMsg').href='messages.html?c='+encodeURIComponent(cid);$('editClientMsg').setAttribute('aria-label','Message '+S.clientName(c));}renderEditApps();openModal('editClientModal');if(btn)lastFocus=btn;}
 populateEffective($('newVisaType').value,$('newEffective'));
 $('newVisaType').addEventListener('change',function(){populateEffective($('newVisaType').value,$('newEffective'));});
 $('newAdmin').innerHTML=adminOptions(ME);
 $('addClientBtn').addEventListener('click',function(){$('newAdmin').innerHTML=adminOptions(ME);openModal('addClientModal');});
 $('addClientForm').addEventListener('submit',function(e){e.preventDefault();
  var first=$('newFirst').value.trim(),last=$('newLast').value.trim(),email=$('newEmail').value.trim(),type=$('newVisaType').value;
  var err=''; if(!first)err='First name is required.'; else if(!last)err='Last name is required.'; else if(!email||email.indexOf('@')<1)err='A valid email is required (e.g. name@example.com).'; else if(!type)err='Case type is required.';
  $('addClientError').textContent=err; if(err)return;
  var v=selectedVisa($('newEffective'));if(!v){$('addClientError').textContent='Cannot save: a case type with an effective date is needed first. Add one on the Case types page.';return;}
  var c={id:'c-'+Date.now(),first:first,middle:$('newMiddle').value.trim(),last:last,email:email,phone:$('newPhone').value.trim(),address:'',language:'',dob:'',assignedAdminId:$('newAdmin').value||ME,createdAt:S.today(),updatedAt:S.today()};
  data.clients.push(c);
  data.applications.push({id:'a-'+Date.now(),clientId:c.id,type:type,visaId:v.id,effectiveDate:v.effective,status:'New',date:S.today(),createdAt:S.today(),updatedAt:S.today(),progress:0});
  S.save(data); closeModal('addClientModal'); e.target.reset(); if(!inScope(c)){sessionStorage.setItem('isc_scope','all');scopeToggle($('scopeSeg'),function(){cur=1;render();});} cur=1; render();});
 $('editClientForm').addEventListener('submit',function(e){e.preventDefault();var c=clientById(editingId);c.email=$('editEmail').value.trim();c.phone=$('editPhone').value.trim();var na=$('editAdmin').value,moved=na&&na!==c.assignedAdminId;if(na)c.assignedAdminId=na;c.updatedAt=S.today();S.save(data);$('editMsg').textContent=moved?'Saved. Assigned to '+adminLabel(na)+'.':'Details saved.';render();});
 populateEffective($('editVisaType').value,$('editEffective'));
 $('editVisaType').addEventListener('change',function(){populateEffective($('editVisaType').value,$('editEffective'));$('editAppError').textContent='';});
 $('addAppForClient').addEventListener('click',function(){if(!editingId)return;var v=selectedVisa($('editEffective'));if(!v){$('editAppError').textContent='Cannot add: a case type with an effective date is needed first. Add one on the Case types page.';return;}$('editAppError').textContent='';var a={id:'a-'+Date.now(),clientId:editingId,type:$('editVisaType').value,visaId:v.id,effectiveDate:v.effective,status:'New',date:S.today(),createdAt:S.today(),updatedAt:S.today(),progress:0};data.applications.push(a);S.save(data);renderEditApps();render();$('editMsg').textContent='Added '+a.type+' application.';});
 ['search','fStatus','fType'].forEach(function(id){$(id).addEventListener('input',function(){cur=1;render();});});
 scopeToggle($('scopeSeg'),function(){cur=1;render();});
 $('prevPage').addEventListener('click',function(){cur--;render();}); $('nextPage').addEventListener('click',function(){cur++;render();}); render();
 var deep=new URLSearchParams(location.search).get('client');if(deep&&clientById(deep)&&!inScope(clientById(deep))){sessionStorage.setItem('isc_scope','all');scopeToggle($('scopeSeg'),function(){cur=1;render();});render();}
 if(deep&&clientById(deep))setTimeout(function(){openEdit(deep,null);},0);
}

/* ================= OWNER: documents ================= */
if(page==='documents'){
 var pendingDelete=null;
 function render(){var list=data.documents;
  $('docRows').innerHTML=list.map(function(d){return '<tr><td>'+esc(d.name)+'</td><td>'+esc(d.version)+'</td><td>'+esc((data.visas||[]).filter(function(v){return v.docIds.indexOf(d.id)>-1;}).map(function(v){return v.name;}).join(', ')||'—')+'</td><td>'+esc(d.status)+'</td><td>'+esc(d.createdAt)+'</td><td>'+esc(d.updatedAt)+'</td><td>'+d.uploaded+'</td><td class="sample-cell">'+(d.sample?'<span class="sample-name">'+esc(d.sample.name)+'</span><span class="muted">'+esc(typeLabel(d.sample.type,d.sample.name))+' · '+esc(fmtSize(d.sample.size))+'</span>':'<span class="muted">No example</span>')+'<span class="sample-actions">'+(d.sample?'<button type="button" class="btn ghost sm" data-sview="'+d.id+'" aria-label="View example for '+esc(d.name)+'">View</button><button type="button" class="btn ghost sm" data-sattach="'+d.id+'" aria-label="Replace example for '+esc(d.name)+'">Replace</button><button type="button" class="btn ghost sm danger" data-sremove="'+d.id+'" aria-label="Remove example for '+esc(d.name)+'">Remove</button>':'<button type="button" class="btn ghost sm" data-sattach="'+d.id+'" aria-label="Attach example for '+esc(d.name)+'">Attach example</button>')+'</span></td><td style="white-space:nowrap"><button type="button" class="icon-btn" data-edit="'+d.id+'" aria-label="Edit document '+esc(d.name)+'" title="Edit document">'+PENCIL+'</button> <button type="button" class="icon-btn danger" data-del="'+d.id+'" aria-label="Delete document '+esc(d.name)+'" title="Delete document">'+TRASH+'</button></td></tr>';}).join('');
  document.querySelectorAll('[data-edit]').forEach(function(b){b.addEventListener('click',function(){var d=S.docById(data,b.getAttribute('data-edit'));$('docId').value=d.id;$('docName').value=d.name;$('docVersion').value=d.version;$('docStatus').value=d.status;openModal('docModal');lastFocus=b;});});
  document.querySelectorAll('[data-sattach]').forEach(function(b){b.addEventListener('click',function(){sampleTarget=b.getAttribute('data-sattach');sampleOpener=b;$('sampleFile').value='';$('sampleFile').click();});});
  document.querySelectorAll('[data-sview]').forEach(function(b){b.addEventListener('click',function(){openSample(S.docById(data,b.getAttribute('data-sview')),b);});});
  document.querySelectorAll('[data-sremove]').forEach(function(b){b.addEventListener('click',function(){pendingSampleRemove=b.getAttribute('data-sremove');var d=S.docById(data,pendingSampleRemove);$('sampleRemoveMsg').textContent='Remove the example “'+d.sample.name+'” from “'+d.name+'”? Clients will no longer see an example for this requirement.';openModal('sampleRemoveModal',b);});});
  document.querySelectorAll('[data-del]').forEach(function(b){b.addEventListener('click',function(){pendingDelete=b.getAttribute('data-del');var d=S.docById(data,pendingDelete);$('deleteMsg').textContent='Delete “'+d.name+'”? It will also be removed from any visa required-document lists that use it.';openModal('confirmModal');lastFocus=b;});});}
 var sampleTarget=null,sampleOpener=null,pendingSampleRemove=null;
 function sampleMsg(t,bad){var m=$('sampleStatus');m.textContent=t;m.className=bad?'sample-status err':'sample-status';}
 $('sampleFile').addEventListener('change',function(){var f=$('sampleFile').files[0],d=S.docById(data,sampleTarget);if(!f||!d)return;
  if(f.size>S.SAMPLE_MAX){sampleMsg('“'+f.name+'” is '+fmtSize(f.size)+'. Examples can be at most '+fmtSize(S.SAMPLE_MAX)+' — please choose a smaller file.',true);if(sampleOpener)sampleOpener.focus();return;}
  var rd=new FileReader();rd.onerror=function(){sampleMsg('Could not read “'+f.name+'”.',true);};
  rd.onload=function(){var prev=d.sample,had=!!prev;d.sample={name:f.name,type:f.type||'',size:f.size,dataUrl:String(rd.result),addedAt:S.today()};d.updatedAt=S.today();
   if(!S.trySave(data)){d.sample=prev;sampleMsg('Browser storage is full, so “'+f.name+'” could not be saved. Remove another example or use a smaller file.',true);if(sampleOpener)sampleOpener.focus();return;}
   sampleMsg((had?'Replaced example for ':'Attached example to ')+'“'+d.name+'”: '+f.name+' ('+fmtSize(f.size)+').');var id=d.id;render();var nb=document.querySelector('[data-sattach="'+id+'"]');if(nb)nb.focus();};
  rd.readAsDataURL(f);});
 $('confirmSampleRemove').addEventListener('click',function(){var d=S.docById(data,pendingSampleRemove);if(!d)return;var nm=d.sample&&d.sample.name;delete d.sample;d.updatedAt=S.today();S.save(data);var id=d.id;pendingSampleRemove=null;
  $('sampleRemoveModal').hidden=true;modalStack=modalStack.filter(function(x){return x.id!=='sampleRemoveModal';});render();sampleMsg('Removed example '+nm+' from “'+d.name+'”.');var nb=document.querySelector('[data-sattach="'+id+'"]');if(nb)nb.focus();});
 $('confirmDelete').addEventListener('click',function(){if(!pendingDelete)return;data.documents=data.documents.filter(function(d){return d.id!==pendingDelete;});data.visas.forEach(function(v){v.docIds=v.docIds.filter(function(id){return id!==pendingDelete;});v.updatedAt=S.today();});pendingDelete=null;S.save(data);closeModal('confirmModal');render();});
 $('addDocBtn').addEventListener('click',function(){$('docForm').reset();$('docId').value='';openModal('docModal');});
 $('docForm').addEventListener('submit',function(e){e.preventDefault();var today=S.today();var id=$('docId').value;
  if(id){var d=S.docById(data,id);d.name=$('docName').value;delete d.type;delete d.applicationType;d.version=$('docVersion').value;d.status=$('docStatus').value;d.updatedAt=today;$('docMsg').textContent='Updated document.';}
  else{data.documents.push({id:'d-'+Date.now(),name:$('docName').value,version:$('docVersion').value||'v1.0',status:$('docStatus').value,createdAt:today,updatedAt:today,uploaded:0});$('docMsg').textContent='Added document.';}
  S.save(data);closeModal('docModal');render();});
 render();
}

/* ================= OWNER: visas ================= */
if(page==='visas'){
 var editingVisa=null, selAvail=new Set(), selReq=new Set();
 function dualList(el,docs,selected,onToggle){$(el).innerHTML=docs.length?docs.map(function(d){return '<li tabindex="0" role="option" aria-selected="'+(selected.has(d.id)?'true':'false')+'" data-doc="'+d.id+'">'+esc(d.name)+'</li>';}).join(''):'<li aria-disabled="true">None</li>';
  $(el).querySelectorAll('[data-doc]').forEach(function(li){function tog(){var id=li.getAttribute('data-doc');selected.has(id)?selected.delete(id):selected.add(id);dualList(el,docs,selected,onToggle);}li.addEventListener('click',tog);li.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();tog();}});});}
 function renderPicker(){var chosen=pickerChosen;
  var avail=data.documents.filter(function(d){return chosen.indexOf(d.id)<0;});var req=chosen.map(function(id){return S.docById(data,id);}).filter(Boolean);
  dualList('availList',avail,selAvail);dualList('reqList',req,selReq);pickerChosen=chosen;}
 var pickerChosen=[];
 function currentPickerSelection(){return pickerChosen;}
 function move(toReq){var from=toReq?selAvail:selReq;var list=Array.from(from);
  if(toReq){list.forEach(function(id){if(pickerChosen.indexOf(id)<0)pickerChosen.push(id);});selAvail.clear();}
  else{pickerChosen=pickerChosen.filter(function(id){return list.indexOf(id)<0;});selReq.clear();}
  renderPicker();}
 $('moveRight').addEventListener('click',function(){move(true);}); $('moveLeft').addEventListener('click',function(){move(false);});
 function render(){/* Display-only sort: effective date DESC (newest first); missing/invalid dates last; stable via original index. Stored order in data.visas is NOT mutated, so dropdowns elsewhere keep their order. */
  var sorted=data.visas.map(function(v,i){return {v:v,i:i};}).sort(function(a,b){var ta=Date.parse(a.v.effective),tb=Date.parse(b.v.effective);var va=!isNaN(ta),vb=!isNaN(tb);if(va&&vb)return (tb-ta)||(a.i-b.i);if(va)return -1;if(vb)return 1;return a.i-b.i;}).map(function(x){return x.v;});
  $('visaRows').innerHTML=sorted.map(function(v){return '<tr><td><strong>'+esc(v.name)+'</strong></td><td>'+esc(S.visaCountry(v))+'</td><td>'+esc(v.effective)+'</td><td>'+esc(v.notes)+'</td><td>'+v.docIds.length+'</td><td>'+esc(v.createdAt)+'</td><td>'+esc(v.updatedAt)+'</td><td><button type="button" class="icon-btn" data-edit-visa="'+v.id+'" aria-label="Edit visa '+esc(v.name)+'" title="Edit visa">'+PENCIL+'</button></td></tr>';}).join('');
  document.querySelectorAll('[data-edit-visa]').forEach(function(b){b.addEventListener('click',function(){editingVisa=b.getAttribute('data-edit-visa');var v=data.visas.find(function(x){return x.id===editingVisa;});$('visaName').value=v.name;$('visaCountry').value=S.visaCountry(v);$('visaDate').value=v.effective;$('visaNotes').value=v.notes;pickerChosen=v.docIds.slice();selAvail.clear();selReq.clear();renderPicker();openModal('visaModal');lastFocus=b;});});}
 $('addVisaBtn').addEventListener('click',function(){editingVisa=null;$('visaForm').reset();pickerChosen=[];selAvail.clear();selReq.clear();renderPicker();openModal('visaModal');});
 $('visaForm').addEventListener('submit',function(e){e.preventDefault();var name=$('visaName').value.trim();if(!name){$('visaMsg').textContent='Case type is required.';return;}var country=$('visaCountry').value;if(!country){$('visaMsg').textContent='Country is required.';$('visaCountry').focus();return;}
  if(editingVisa){var v=data.visas.find(function(x){return x.id===editingVisa;});v.name=name;v.country=country;v.effective=$('visaDate').value;v.notes=$('visaNotes').value;v.docIds=pickerChosen.slice();v.updatedAt=S.today();}
  else{data.visas.push({id:'v-'+Date.now(),name:name,country:country,effective:$('visaDate').value,notes:$('visaNotes').value,docIds:pickerChosen.slice(),createdAt:S.today(),updatedAt:S.today()});}
  S.save(data);closeModal('visaModal');render();});
 renderPicker(); render();
}
})();
