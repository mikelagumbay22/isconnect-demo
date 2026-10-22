/* ISConnect support chat (admins <-> client). Data: isc_demo_v1 .threads (see portal-data.js). Owner messages carry `by` = admin id. Same-browser only:
   owner and client tabs stay in sync through the window "storage" event. All message text is escaped and shown as plain text. */
(function(){
"use strict";
var S=window.ISCStore;if(!S)return;
var role=document.body.getAttribute('data-role'),page=document.body.getAttribute('data-page');
var CLIENT_ID=S.CLIENT_ID,ME=S.currentAdminId(),GAP=15*60*1000,TZ='America/Toronto';
function esc(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function fresh(){return S.load();}
function parts(ts,o){var f=new Intl.DateTimeFormat('en-US',Object.assign({timeZone:TZ},o));var r={};f.formatToParts(new Date(ts)).forEach(function(p){r[p.type]=p.value;});return r;}
/* Separator label, exactly "Mon | Oct 19, 2026 | 7:59 PM" (America/Toronto) */
function sepLabel(ts){var p=parts(ts,{weekday:'short',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true});return p.weekday+' | '+p.month+' '+p.day+', '+p.year+' | '+p.hour+':'+p.minute+' '+p.dayPeriod;}
function dayKey(ts){var p=parts(ts,{year:'numeric',month:'2-digit',day:'2-digit'});return p.year+p.month+p.day;}
function relTime(ts){var d=Date.now()-ts;if(d<60000)return 'now';if(d<3600000)return Math.floor(d/60000)+'m';if(dayKey(ts)===dayKey(Date.now()))return Math.floor(d/3600000)+'h';
 if(dayKey(ts)===dayKey(Date.now()-864e5))return 'Yesterday';if(d<6*864e5)return parts(ts,{weekday:'short'}).weekday;var p=parts(ts,{month:'short',day:'numeric'});return p.month+' '+p.day;}
function thread(d,cid){d.threads=d.threads||{};if(!d.threads[cid])d.threads[cid]={messages:[],read:{owner:0,client:0}};return d.threads[cid];}
function other(me){return me==='owner'?'client':'owner';}
function unread(t,me){if(!t)return 0;var r=(t.read||{})[me]||0;return t.messages.filter(function(m){return m.from!==me&&m.ts>r;}).length;}
function totalUnreadOwner(d){return Object.keys(d.threads||{}).reduce(function(n,k){return n+unread(d.threads[k],'owner');},0);}
function markRead(cid,me){var d=fresh(),t=d.threads&&d.threads[cid];if(!t||!t.messages.length)return;var last=t.messages[t.messages.length-1].ts;t.read=t.read||{};if((t.read[me]||0)>=last)return;t.read[me]=Math.max(Date.now(),last);S.save(d);}
function send(cid,me,text){text=String(text||'').replace(/\s+$/,'');if(!text.trim())return false;var d=fresh(),t=thread(d,cid);var now=Date.now();
 var m={id:cid+'-'+now.toString(36)+Math.random().toString(36).slice(2,6),from:me,text:text,ts:now};if(me==='owner')m.by=ME;t.messages.push(m);t.read=t.read||{};t.read[me]=now;return S.save(d);}
function initials(c){return ((c.first||'?')[0]+((c.last||'')[0]||'')).toUpperCase();}
function clientName(c){return [c.first,c.last].filter(Boolean).join(' ');}
/* Render messages with Messenger-style separators (new group after a 15+ min gap or a Toronto day change) and Sent/Seen on my last message. */
function ownerWho(d,m){var a=m.by&&S.adminById(d,m.by);return a?S.adminName(a):'International Students Connect';}
function renderLog(el,t,me){var D=fresh();var ms=(t&&t.messages)||[];if(!ms.length){el.innerHTML='<p class="chat-empty">No messages yet. Say hello!</p>';return;}
 var lastMine=-1;ms.forEach(function(m,i){if(m.from===me)lastMine=i;});var h='',prev=null;
 ms.forEach(function(m,i){if(!prev||m.ts-prev.ts>GAP||dayKey(m.ts)!==dayKey(prev.ts))h+='<div class="chat-sep" role="separator"><span>'+esc(sepLabel(m.ts))+'</span></div>';
  var mine=m.from===me,who=mine?'You':(m.from==='owner'?ownerWho(D,m):'Client');
  var showBy=m.from==='owner'&&(!prev||prev.from!=='owner'||prev.by!==m.by||m.ts-prev.ts>GAP)&&!(mine&&m.by===ME);
  h+='<div class="chat-msg '+(mine?'mine':'theirs')+' from-'+m.from+'">'+(showBy?'<span class="chat-by" aria-hidden="true">'+esc(ownerWho(D,m))+'</span>':'')+'<p class="chat-bubble"><span class="sr-only">'+who+': </span>'+esc(m.text)+'</p>'
   +(i===lastMine?'<span class="chat-status">'+(((t.read||{})[other(me)]||0)>=m.ts?'Seen':'Sent')+'</span>':'')+'</div>';prev=m;});
 el.innerHTML=h;el.scrollTop=el.scrollHeight;}
function composer(form,ta,onSend){ta.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();form.requestSubmit?form.requestSubmit():form.dispatchEvent(new Event('submit',{cancelable:true}));}});
 form.addEventListener('submit',function(e){e.preventDefault();if(onSend(ta.value)){ta.value='';}ta.focus();});}
var refreshers=[];window.addEventListener('storage',function(e){if(e.key===S.KEY||e.key===null)refreshers.forEach(function(f){f();});});
function badgeText(n){return n>99?'99+':String(n);}

/* ---------------- OWNER ---------------- */
if(role==='owner'){
 /* Sidebar badge (every owner page) */
 function navBadge(){var b=document.getElementById('navMsgBadge');if(!b)return;var n=totalUnreadOwner(fresh());b.textContent=n?badgeText(n):'';b.hidden=!n;
  var a=b.closest('a');if(a)a.setAttribute('aria-label','Messages'+(n?', '+n+' unread':''));}
 navBadge();refreshers.push(navBadge);
 if(page==='messages'){
  var list=document.getElementById('convList'),q=document.getElementById('convSearch'),log=document.getElementById('ownerLog'),head=document.getElementById('threadHead'),wrap=document.getElementById('msgr'),form=document.getElementById('ownerForm'),ta=document.getElementById('ownerInput');
  var cur=new URLSearchParams(location.search).get('c')||null;
  function cRec(d,id){return (d.clients||[]).find(function(c){return c.id===id;});}
  function appOf(d,id){return (d.applications||[]).filter(function(x){return x.clientId===id;})[0];}
  function scopeOk(c){if(window.ISCScope&&window.ISCScope.has)return window.ISCScope.has(c);return !window.ISCScope||window.ISCScope.get()==='all'||(c&&c.assignedAdminId===ME);}
  function renderList(){var d=fresh(),term=(q.value||'').trim().toLowerCase();
   var ids=Object.keys(d.threads||{}).filter(function(id){return cRec(d,id)&&d.threads[id].messages.length&&scopeOk(cRec(d,id));});
   /* a picked client with no messages yet is shown (unsaved) at the top until the first message is sent */
   var pending=cur&&cRec(d,cur)&&ids.indexOf(cur)<0;
   ids.sort(function(a,b){var ma=d.threads[a].messages,mb=d.threads[b].messages;return (mb.length?mb[mb.length-1].ts:0)-(ma.length?ma[ma.length-1].ts:0);});
   var rows=(pending?[cur]:[]).concat(ids).filter(function(id){if(!term)return true;var c=cRec(d,id),t=(d.threads||{})[id]||{messages:[]};return clientName(c).toLowerCase().indexOf(term)>-1||(S.clientCode(c)||'').toLowerCase().indexOf(term)>-1||t.messages.some(function(m){return m.text.toLowerCase().indexOf(term)>-1;});});
   list.innerHTML=rows.length?rows.map(function(id){var c=cRec(d,id),t=(d.threads||{})[id]||{messages:[]},last=t.messages[t.messages.length-1],u=unread(t,'owner');
    return '<li><button type="button" class="conv'+(id===cur?' active':'')+(u?' has-unread':'')+'" data-conv="'+esc(id)+'"'+(id===cur?' aria-current="true"':'')+'><span class="avatar" aria-hidden="true">'+esc(initials(c))+'</span><span class="conv-body"><span class="conv-top"><span class="conv-name">'+esc(clientName(c))+'</span><span class="conv-time">'+(last?esc(relTime(last.ts)):'')+'</span></span><span class="conv-prev">'+(last?(last.from==='owner'?(last.by===ME?'You: ':esc(ownerWho(d,last).split(' ')[0])+': '):'')+esc(last.text):'No messages yet')+'</span></span>'+(u?'<span class="unread-dot" aria-hidden="true"></span><span class="sr-only">, '+u+' unread</span>':'')+'</button></li>';}).join(''):(term?'<li class="conv-none">No conversations match “'+esc(q.value)+'”.</li>':'<li class="conv-none">No conversations with your clients yet. Choose <strong>All clients</strong> or start a new conversation.</li>');
   list.querySelectorAll('[data-conv]').forEach(function(b){b.addEventListener('click',function(){openThread(b.getAttribute('data-conv'),true);});});}
  function renderThread(){var d=fresh();if(!cur||!cRec(d,cur)){wrap.classList.remove('show-thread');head.innerHTML='';log.innerHTML='<p class="chat-empty">Select a conversation.</p>';form.hidden=true;return;}
   var c=cRec(d,cur),a=appOf(d,cur),asg=S.adminById(d,c.assignedAdminId);form.hidden=false;
   head.innerHTML='<button type="button" class="thread-back" id="threadBack" aria-label="Back to conversations"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><span class="avatar" aria-hidden="true">'+esc(initials(c))+'</span><div class="thread-id"><h2 id="threadTitle">'+esc(clientName(c))+'</h2><p>'+esc(S.clientCode(c))+(a?' · '+esc(a.type)+' <span class="badge '+esc(a.status)+'">'+esc(a.status)+'</span>':'')+'</p><p class="thread-assignee">Assigned to <strong>'+esc(asg?S.adminName(asg)+(asg.id===ME?' (you)':''):'nobody yet')+'</strong></p></div><a class="s-btn outline thread-link" href="clients.html?client='+encodeURIComponent(cur)+'">View client</a>';
   document.getElementById('threadBack').addEventListener('click',function(){wrap.classList.remove('show-thread');var b=list.querySelector('[data-conv="'+cur+'"]');if(b)b.focus();});
   renderLog(log,d.threads[cur],'owner');}
  function openThread(id,focus){cur=id;history.replaceState(null,'','?c='+encodeURIComponent(id));wrap.classList.add('show-thread');markRead(id,'owner');renderList();renderThread();navBadge();if(focus)ta.focus();}
  q.addEventListener('input',renderList);
  composer(form,ta,function(v){if(!cur)return false;var ok=send(cur,'owner',v);renderList();renderThread();return ok;});
  refreshers.push(function(){if(cur&&!document.hidden&&wrap.classList.contains('show-thread')||cur&&window.innerWidth>760)markRead(cur,'owner');renderList();renderThread();navBadge();});
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&cur){markRead(cur,'owner');renderThread();renderList();navBadge();}});
  if(!cur&&window.innerWidth>760){var d0=fresh(),ids=Object.keys(d0.threads||{});if(ids.length){renderList();cur=list.querySelector('[data-conv]')&&list.querySelector('[data-conv]').getAttribute('data-conv');}}
  var deepC=!!new URLSearchParams(location.search).get('c');
  if(window.ISCScope)window.ISCScope.toggle(document.getElementById('scopeSeg'),function(){renderList();});
  if(cur)openThread(cur,deepC);else{renderList();renderThread();}
  /* New conversation picker: filter by name, C-code, email; Up/Down/Home/End + Enter; Esc closes and returns focus */
  var nb=document.getElementById('newConvBtn'),pm=document.getElementById('newConvModal'),ps=document.getElementById('pickSearch'),pl=document.getElementById('pickList'),act=0,opts=[];
  function pickRender(){var d=fresh(),term=ps.value.trim().toLowerCase();
   opts=(d.clients||[]).filter(function(c){return !term||clientName(c).toLowerCase().indexOf(term)>-1||String(S.clientCode(c)).toLowerCase().indexOf(term)>-1||String(c.email||'').toLowerCase().indexOf(term)>-1;});
   if(act>=opts.length)act=Math.max(0,opts.length-1);
   pl.innerHTML=opts.length?opts.map(function(c,i){var has=d.threads&&d.threads[c.id]&&d.threads[c.id].messages.length;return '<li role="option" id="pick-'+esc(c.id)+'" data-pick="'+esc(c.id)+'" aria-selected="'+(i===act)+'" class="pick'+(i===act?' active':'')+'"><span class="avatar" aria-hidden="true">'+esc(initials(c))+'</span><span class="pick-body"><span class="pick-name">'+esc(clientName(c))+' <span class="pick-code">'+esc(S.clientCode(c))+'</span></span><span class="pick-mail">'+esc(c.email||'')+' · '+esc((S.adminById(d,c.assignedAdminId)||{}).first?S.adminName(S.adminById(d,c.assignedAdminId)):'Unassigned')+'</span></span>'+(has?'<span class="pick-has">Existing</span>':'')+'</li>';}).join(''):'<li class="pick-none" role="option" aria-disabled="true" aria-selected="false">No clients match.</li>';
   ps.setAttribute('aria-activedescendant',opts.length?'pick-'+opts[act].id:'');document.getElementById('pickCount').textContent=opts.length+' client'+(opts.length===1?'':'s');
   var a=pl.querySelector('.active');if(a&&a.scrollIntoView)a.scrollIntoView({block:'nearest'});}
  function pickOpen(){pm.hidden=false;ps.value='';act=0;pickRender();ps.focus();}
  function pickClose(ret){pm.hidden=true;if(ret!==false)nb.focus();}
  function choose(id){pickClose(false);openThread(id,true);}
  nb.addEventListener('click',pickOpen);document.getElementById('newConvClose').addEventListener('click',function(){pickClose();});
  pm.addEventListener('click',function(e){if(e.target===pm)pickClose();});
  ps.addEventListener('input',function(){act=0;pickRender();});
  pl.addEventListener('click',function(e){var li=e.target.closest('[data-pick]');if(li)choose(li.getAttribute('data-pick'));});
  pm.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();pickClose();return;}
   if(e.target!==ps)return;
   if(e.key==='ArrowDown'){e.preventDefault();act=Math.min(opts.length-1,act+1);pickRender();}else if(e.key==='ArrowUp'){e.preventDefault();act=Math.max(0,act-1);pickRender();}
   else if(e.key==='Home'&&opts.length){e.preventDefault();act=0;pickRender();}else if(e.key==='End'&&opts.length){e.preventDefault();act=opts.length-1;pickRender();}
   else if(e.key==='Enter'){e.preventDefault();if(opts[act])choose(opts[act].id);}});
 }
}

/* ---------------- CLIENT ---------------- */
if(role==='client'){
 function counselor(){var d=fresh(),c=(d.clients||[]).find(function(x){return x.id===CLIENT_ID;}),a=c&&S.adminById(d,c.assignedAdminId);return a?S.adminName(a):'International Students Connect';}
 var host=document.createElement('div');host.className='portal-chat';
 host.innerHTML='<button class="isc-chat-fab portal-chat-fab" id="pcOpen" type="button" aria-haspopup="dialog" aria-controls="pcPanel" aria-expanded="false"><span aria-hidden="true">💬</span><span class="isc-chat-fab-text">Chat</span><span class="pc-badge" id="pcBadge" hidden></span></button>'
  +'<div class="pc-panel" id="pcPanel" role="dialog" aria-modal="true" aria-labelledby="pcTitle" aria-describedby="pcSub" hidden><div class="pc-head"><span class="avatar pc-logo" aria-hidden="true">ISC</span><div><h2 id="pcTitle">International Students Connect</h2><p id="pcSub">Your counselor: '+esc(counselor())+'</p></div><button type="button" class="pc-close" id="pcClose" aria-label="Close chat">×</button></div>'
  +'<div class="pc-log chat-log" id="pcLog" role="log" aria-live="polite" aria-label="Messages with International Students Connect" tabindex="0"></div>'
  +'<form class="chat-composer" id="pcForm"><label class="sr-only" for="pcInput">Message</label><textarea id="pcInput" rows="1" placeholder="Write a message…" aria-describedby="pcHint"></textarea><button type="submit" class="chat-send" aria-label="Send message"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4Z"/></svg></button><span class="sr-only" id="pcHint">Press Enter to send, Shift+Enter for a new line.</span></form></div>';
 document.body.appendChild(host);document.body.classList.add('has-portal-chat');
 var fab=document.getElementById('pcOpen'),panel=document.getElementById('pcPanel'),plog=document.getElementById('pcLog'),pform=document.getElementById('pcForm'),pin=document.getElementById('pcInput'),badge=document.getElementById('pcBadge');
 function isOpen(){return !panel.hidden;}
 function cBadge(){var n=unread(fresh().threads&&fresh().threads[CLIENT_ID],'client');badge.textContent=n?badgeText(n):'';badge.hidden=!n;fab.setAttribute('aria-label','Chat with International Students Connect'+(n?', '+n+' unread':''));}
 function cRender(){var d=fresh();renderLog(plog,d.threads&&d.threads[CLIENT_ID],'client');}
 function openChat(){panel.hidden=false;fab.setAttribute('aria-expanded','true');document.body.classList.add('pc-open');markRead(CLIENT_ID,'client');cRender();cBadge();pin.focus();}
 function closeChat(){panel.hidden=true;fab.setAttribute('aria-expanded','false');document.body.classList.remove('pc-open');fab.focus();}
 fab.addEventListener('click',function(){isOpen()?closeChat():openChat();});
 document.getElementById('pcClose').addEventListener('click',closeChat);
 panel.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeChat();return;}
  if(e.key==='Tab'){var f=[].filter.call(panel.querySelectorAll('button,textarea,[tabindex="0"]'),function(x){return !x.disabled&&x.offsetParent!==null;});var a=f[0],z=f[f.length-1];
   if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}}});
 composer(pform,pin,function(v){var ok=send(CLIENT_ID,'client',v);cRender();return ok;});
 refreshers.push(function(){document.getElementById('pcSub').textContent='Your counselor: '+counselor();if(isOpen()&&!document.hidden)markRead(CLIENT_ID,'client');if(isOpen())cRender();cBadge();});
 document.addEventListener('visibilitychange',function(){if(!document.hidden&&isOpen()){markRead(CLIENT_ID,'client');cRender();cBadge();}});
 cBadge();
}
})();
