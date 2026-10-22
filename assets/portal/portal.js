(function(){
"use strict";
var S=window.ISCStore, data=S.load(), esc=S.esc, page=document.body.getAttribute('data-page');
function $(id){return document.getElementById(id);}
/* Hidden reset: add ?reset=1 to any portal URL to clear isc_demo_v1 and reseed. */
if(new URLSearchParams(location.search).get('reset')==='1'){S.reset();var ru=new URL(location.href);ru.searchParams.delete('reset');location.replace(ru.pathname+ru.search+ru.hash);return;}
function appById(id){return data.applications.find(function(a){return a.id===id;});}
function clientById(id){return data.clients.find(function(c){return c.id===id;});}
function badge(st){return '<span class="badge '+esc(st)+'">'+esc(st)+'</span>';}
var MSGI='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
var KEYI='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M17 6l3 3M14.5 8.5l2.5 2.5"/></svg>';
function toast(t){var el=document.getElementById('appToast');if(!el){el=document.createElement('div');el.id='appToast';el.className='app-toast';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el);}
 el.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span></span>';el.querySelector('span').textContent=t;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(function(){el.classList.remove('show');},5000);}
var PENCIL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>';
var TRASH='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m1 0-1 14H8L7 6"/></svg>';
/* ---- Roles & permissions (Admin / Staff). The nav lists only pages the signed-in user may open; a disallowed page shows a no-access notice. ---- */
var IS_OWNER=document.body.getAttribute('data-role')==='owner',ME0=S.currentAdminId();
var SUPER=S.isSuper(data,ME0);var ROLE0=(S.adminById(data,ME0)||{}).role||'staff';var MGR=S.manages(data,ROLE0);var TEAM=S.teamIds(data,ME0);
function can(area,act){return S.can(data,ME0,area,act);}
var NAV=[['dashboard.html','Dashboard','dashboard'],['clients.html','Clients','clients'],['documents.html','Documents','documents'],['visas.html','Case types','casetypes'],['messages.html','Messages','messages'],['logs.html','Activity logs','logs'],['team.html','Team','team']];
var PAGE_AREA={'owner-dashboard':'dashboard',clients:'clients',documents:'documents',visas:'casetypes',messages:'messages',logs:'logs',team:'team'};
function allowed(area){return area==='_super'?SUPER:can(area,'view');}
function clientAv(c,cls){var n=((c&&c.first||'?').charAt(0)+((c&&c.last)||'').charAt(0)).toUpperCase();return c&&c.photo?'<span class="c-av '+(cls||'')+'"><img src="'+esc(c.photo)+'" alt=""></span>':'<span class="c-av '+(cls||'')+'" aria-hidden="true">'+esc(n)+'</span>';}
function staffAv(a,cls){return clientAv({first:a&&a.first,last:a&&a.last,photo:S.adminPhoto(a)},cls);}
function staffCell(id){var a=S.adminById(data,id);return a?'<span class="who-cell">'+staffAv(a,'sm')+esc(adminLabel(id))+'</span>':esc(adminLabel(id));}
/* Shared avatar file reader: JPG/PNG/WebP under 2 MB, centre-cropped square, 256px. cb(error, dataURL) */
function readAvatar(file,cb){if(!/^image\/(jpeg|png|webp)$/.test(file.type))return cb('Choose a JPG, PNG or WebP image.');
 if(file.size>2*1048576)return cb('That image is larger than 2 MB. Choose a smaller one.');
 var rd=new FileReader();rd.onload=function(){var im=new Image();im.onload=function(){var S2=256,cv=document.createElement('canvas');cv.width=cv.height=S2;var k=Math.min(im.width,im.height),sx=(im.width-k)/2,sy=(im.height-k)/2;var cx=cv.getContext('2d');cx.imageSmoothingQuality='high';cx.drawImage(im,sx,sy,k,k,0,0,S2,S2);
   var u=cv.toDataURL('image/webp',0.85);if(u.indexOf('data:image/webp')!==0)u=cv.toDataURL('image/jpeg',0.85);cb(null,u);};
  im.onerror=function(){cb('This image couldn’t be read. Try another file.');};im.src=rd.result;};rd.readAsDataURL(file);}
function paintStaffChrome(){if(!IS_OWNER)return;var a=S.adminById(data,ME0);if(!a)return;var sp=document.querySelector('.side > p');if(sp){var o=sp.querySelector('.c-av');if(o)o.remove();sp.classList.add('side-me');sp.insertAdjacentHTML('afterbegin',staffAv(a,'md'));}}
function paintClientChrome(){if(IS_OWNER)return;var c=data.clients.find(function(x){return x.id===S.CLIENT_ID;});if(!c)return;
 var sp=document.querySelector('.side > p');if(sp){var o=sp.querySelector('.c-av');if(o)o.remove();sp.classList.add('side-me');sp.insertAdjacentHTML('afterbegin',clientAv(c,'md'));}
 var tb=document.querySelector('.topbar');if(tb){var t=tb.querySelector('.c-av');if(t)t.remove();var mb=tb.querySelector('[data-menu]');if(mb)mb.insertAdjacentHTML('beforebegin',clientAv(c,'sm tb-av'));}}
function meName(){return IS_OWNER?S.adminName(S.adminById(data,ME0)):S.clientName(data.clients.find(function(c){return c.id===S.CLIENT_ID;})||{});}
if(IS_OWNER){
 if(!S.adminById(data,ME0)||(S.adminById(data,ME0)||{}).role==='archive'){sessionStorage.removeItem('isc_demo_role');location.replace('../login.html');}
 function goneChk(){try{var st=JSON.parse(localStorage.getItem('isc_demo_v1')||'{}');if(Array.isArray(st.admins)&&!st.admins.some(function(a){return a.id===ME0&&a.role!=='archive';})){sessionStorage.removeItem('isc_demo_role');sessionStorage.removeItem('isc_demo_admin');location.replace('../login.html');}}catch(x){}}
 window.addEventListener('storage',function(e){if(!e.key||e.key==='isc_demo_v1')goneChk();});window.addEventListener('focus',goneChk);document.addEventListener('visibilitychange',goneChk);setInterval(goneChk,3000);
 var here=location.pathname.split('/').pop()||'dashboard.html',navOk=NAV.filter(function(n){return allowed(n[2]);});
 var navEl=document.querySelector('.side nav');
 if(navEl)navEl.innerHTML=navOk.map(function(n){var m=n[0]==='messages.html';return '<a href="'+n[0]+'"'+(m?' class="nav-msg"':'')+(n[0]===here?' aria-current="page"':'')+'>'+n[1]+(m?' <span class="nav-badge" id="navMsgBadge" hidden></span>':'')+'</a>';}).join('')+'<a href="../index.html">View public site</a><a href="#" data-signout>Sign out</a>';
 var sideP=document.querySelector('.side > p');if(sideP&&!sideP.querySelector('.role-tag'))sideP.insertAdjacentHTML('beforeend','<span class="role-tag">'+esc(S.roleLabel(data,ROLE0))+'</span>');
 var pArea=PAGE_AREA[page];
 if(pArea&&!allowed(pArea)){
  if(page==='owner-dashboard'&&navOk.length){location.replace(navOk[0][0]);}
  page='noaccess';document.body.setAttribute('data-page','noaccess');
  var mn=$('main'),ft=mn.querySelector('.mini-footer');
  mn.innerHTML='<section class="no-access" role="alert"><h1>You don’t have access to this page</h1><p class="muted">Your account doesn’t include permission for this area. An Admin can change this on the Team page.</p>'+(navOk.length?'<p><a class="btn navy" href="'+navOk[0][0]+'">Go to '+esc(navOk[0][1])+'</a></p>':'')+'</section>'+(ft?ft.outerHTML:'');
 }
}
paintClientChrome();paintStaffChrome();
try{if(sessionStorage.getItem('isc_login_evt')){sessionStorage.removeItem('isc_login_evt');S.log(data,'Login','Account',meName(),'Signed in');S.save(data);}}catch(e){}
/* --- modal helpers: open/close, Escape, focus return, Tab trap-lite --- */
var lastFocus=null,modalStack=[];/* stack: [{id,ret}] so a modal can open over another; Esc/close returns focus to its opener */
function topModal(){var t=modalStack[modalStack.length-1];return t?$(t.id):document.querySelector('.modal-back:not([hidden])');}
function openModal(id,ret){var m=$(id);modalStack=modalStack.filter(function(x){return x.id!==id;});modalStack.push({id:id,ret:ret||document.activeElement});lastFocus=ret||document.activeElement;m.hidden=false;var f=m.querySelector('[data-autofocus]')||m.querySelector('input,select,textarea,button');if(f)f.focus();}
function closeModal(id){$(id).hidden=true;var i=-1;modalStack.forEach(function(x,k){if(x.id===id)i=k;});var ret=i>-1?modalStack[i].ret:lastFocus;if(i>-1)modalStack.splice(i,1);if(ret&&!document.contains(ret)&&ret.getAttribute&&ret.getAttribute('data-app'))ret=document.querySelector('[data-app="'+ret.getAttribute('data-app')+'"]');if(ret&&ret.focus&&document.contains(ret))ret.focus();}
document.querySelectorAll('.modal-back').forEach(function(m){m.addEventListener('mousedown',function(e){m._down=e.target===m;});m.addEventListener('click',function(e){if(e.target===m&&m._down&&m.id==='addAppModal')closeModal(m.id);});});
document.querySelectorAll('[data-close]').forEach(function(b){b.addEventListener('click',function(){closeModal(b.getAttribute('data-close'));});});
document.addEventListener('keydown',function(e){
 if(e.key==='Escape'){var tm=topModal();if(tm){e.preventDefault();closeModal(tm.id);}}
 if(e.key==='Tab'){var open=topModal();if(!open)return;var items=[].filter.call(open.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]'),function(el){return !el.disabled&&el.offsetParent!==null;});if(!items.length)return;var first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});
document.querySelectorAll('[data-signout]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();try{S.log(data,'Logout','Account',meName(),'Signed out');S.save(data);}catch(x){}sessionStorage.removeItem('isc_demo_role');sessionStorage.removeItem('isc_demo_admin');sessionStorage.removeItem('isc_scope');location.href='../index.html';});});
document.querySelectorAll('[data-menu]').forEach(function(b){b.addEventListener('click',function(){var s=document.querySelector('.side');b.setAttribute('aria-expanded',s.classList.toggle('open'));});});
function wireReset(){var b=$('resetDemo');if(b)b.addEventListener('click',function(){data=S.reset();location.reload();});}
/* ---- Multi-admin: every admin sees every client; 'My clients' = assignedAdminId is the signed-in admin. Choice saved per tab. ---- */
var ME=S.currentAdminId();
var BASE=MGR?'team':'mine';
function getScope(){if(SUPER)return 'all';if(!can('clients','all'))return BASE;return sessionStorage.getItem('isc_scope')==='all'?'all':BASE;}
function inScope(c,sc){sc=sc||getScope();if(sc==='all')return true;if(!c)return false;return sc==='team'?TEAM.indexOf(c.assignedAdminId)>-1:c.assignedAdminId===ME;}
function adminLabel(id){var a=S.adminById(data,id);return a?S.adminName(a)+(a.id===ME?' (you)':''):'Unassigned';}
function adminOptions(sel){return S.staffList(data).filter(function(a){return !MGR||TEAM.indexOf(a.id)>-1||a.id===sel;}).map(function(a){return '<option value="'+esc(a.id)+'"'+(a.id===sel?' selected':'')+'>'+esc(S.adminName(a))+(a.id===ME?' (you)':'')+'</option>';}).join('');}
function scopeToggle(el,onChange){if(!el)return;if(SUPER||!can('clients','all')){el.hidden=true;el.innerHTML='';return;}var cur=getScope();
 el.setAttribute('role','group');if(!el.getAttribute('aria-label'))el.setAttribute('aria-label','Show clients');
 el.innerHTML='<button type="button" class="seg-btn" data-scope="'+BASE+'" aria-pressed="'+(cur===BASE)+'">'+(MGR?'My team':'My clients')+'</button><button type="button" class="seg-btn" data-scope="all" aria-pressed="'+(cur==='all')+'">All clients</button>';
 el.querySelectorAll('[data-scope]').forEach(function(b){b.addEventListener('click',function(){var v=b.getAttribute('data-scope');if(v===getScope())return;sessionStorage.setItem('isc_scope',v);
  el.querySelectorAll('[data-scope]').forEach(function(x){x.setAttribute('aria-pressed',String(x===b));});onChange(v);});});}
window.ISCScope={get:getScope,toggle:scopeToggle,me:ME,has:function(c){return inScope(c);}};
document.querySelectorAll('[data-admin-name]').forEach(function(el){el.textContent=S.adminName(S.adminById(data,ME));});
function typeCountry(n){var v=(data.visas||[]).find(function(x){return x.name===n;});return S.visaCountry(v);}
function counselorOf(a){return a?S.adminById(data,a.counselorId):null;}
function counselorHtml(a){var c=counselorOf(a);if(!c)return '';return '<p class="counselor">'+staffAv(c,'md cn-av')+'<span>Education Counselor: <strong>'+esc(S.adminName(c))+'</strong></span></p>';}
/* Active = still in progress (New, Active, Submitted, Review). Closed outcomes are excluded: Approved, Denied, Cancelled (withdrawn). */
var CLOSED_STATUSES=['Approved','Denied','Cancelled','Withdrawn','Closed'];
function isActiveApp(a){return CLOSED_STATUSES.indexOf(a.status)<0;}
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
function emptyState(title,body){return '<div class="empty-state"><img src="../assets/portal/portal-empty-480.webp?v=20261022f" srcset="../assets/portal/portal-empty-240.webp?v=20261022f 240w, ../assets/portal/portal-empty-480.webp?v=20261022f 480w" sizes="200px" width="480" height="360" loading="lazy" alt="AI-generated image: an empty letter tray beside a small plant on a desk"><div><h3>'+esc(title)+'</h3><p class="muted">'+esc(body)+'</p></div></div>';}
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
  $('appDetail').innerHTML='<div class="app-hero"><img src="../assets/portal/portal-app-1280.webp?v=20261022f" srcset="../assets/portal/portal-app-640.webp?v=20261022f 640w, ../assets/portal/portal-app-1280.webp?v=20261022f 1280w" sizes="(max-width: 900px) 100vw, 960px" width="1280" height="300" alt="AI-generated image: a folder, a pen and a notebook on a wooden desk"></div>'
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
   S.syncRow(r);S.syncReview(data,app);app.updatedAt=t;S.log(data,'Upload','Documents',names.join(', '),'Uploaded for '+app.type);S.save(data);render('[data-upload="'+idx+'"]');$('appMsg').textContent='Uploaded '+names.join(', ')+'.';});});
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
 var pend;/* undefined = unchanged, '' = remove, dataURL = new photo */
 function curPhoto(){return pend===undefined?c.photo||'':pend;}
 function paintPf(){var ph=curPhoto();$('pfAv').outerHTML=clientAv({first:f.elements.first.value||c.first,last:f.elements.last.value||c.last,photo:ph},'xl').replace('<span class="c-av','<span id="pfAv" class="c-av');
  $('pfUpload').textContent=ph?'Replace photo':'Upload photo';$('pfRemove').hidden=!ph;
  $('pfPhotoNote').textContent=pend!==undefined?(pend?'Preview. Save profile to keep this photo.':'Photo will be removed when you save.'):'JPG, PNG or WebP, up to 2 MB.';}
 $('pfUpload').addEventListener('click',function(){$('pfFile').click();});
 $('pfRemove').addEventListener('click',function(){pend='';$('pfErr').textContent='';paintPf();$('profileMsg').textContent='';});
 $('pfFile').addEventListener('change',function(){var file=this.files&&this.files[0];this.value='';$('pfErr').textContent='';if(!file)return;
  readAvatar(file,function(er,u){if(er){$('pfErr').textContent=er;return;}pend=u;paintPf();$('profileMsg').textContent='';});});
 ['first','last'].forEach(function(k){f.elements[k].addEventListener('input',function(){if(!curPhoto())paintPf();});});
 ['first','last','phone','email','address','language','dob'].forEach(function(k){if(f.elements[k])f.elements[k].value=c[k]||'';});
 f.addEventListener('submit',function(e){e.preventDefault();['first','last','phone','email','address','language','dob'].forEach(function(k){c[k]=f.elements[k].value.trim();});var pc=pend;if(pc!==undefined){if(pc)c.photo=pc;else delete c.photo;S.log(data,pc?'Upload':'Delete','Profile',S.clientName(c),pc?'Profile photo updated':'Profile photo removed');pend=undefined;}c.updatedAt=S.today();if(!S.save(data)){$('profileMsg').textContent='Couldn’t save. Browser storage is full.';return;}paintPf();paintClientChrome();$('profileMsg').textContent='Saved.';});
 paintPf();
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
 return '<dl class="detail-grid">'+row('Client',esc(S.clientName(c)))+row('Case type',esc(a.type))+row('Country',esc(S.visaCountry(visa)))+row('Education Counselor',esc((counselorOf(a)?S.adminName(counselorOf(a)):'—')))+row('Status',badge(a.status))
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
 $('docsSub').innerHTML='Client: <strong>'+esc(S.clientName(clientById(a.clientId)))+'</strong> · Case type: <a href="visas.html">'+esc(vname)+'</a> · Country: <strong>'+esc(S.visaCountry(visa))+'</strong> · Education Counselor: <strong>'+esc((counselorOf(a)?S.adminName(counselorOf(a)):'—'))+'</strong> · '+badge(a.status);
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
 document.querySelectorAll('#docsList [data-fstatus]').forEach(function(sel){sel.addEventListener('change',function(){var g=find(sel.getAttribute('data-fstatus'));g.f.status=sel.value;S.syncRow(g.r);a.updatedAt=S.today();S.log(data,'Status change','Documents',g.f.name,'File marked '+DOC_LABEL[sel.value]+' for '+S.clientName(clientById(a.clientId)));S.save(data);$('docsMsg').textContent='Saved: '+g.f.name+' is now '+DOC_LABEL[sel.value]+'.';if(onDocsChanged)onDocsChanged();});});
 document.querySelectorAll('#docsList [data-fdel]').forEach(function(b){b.addEventListener('click',function(){var g=find(b.getAttribute('data-fdel'));pendingFile={appId:a.id,docId:g.r.docId,k:g.k};$('fileDeleteMsg').textContent='Delete “'+g.f.name+'” from '+g.r.label+'? This cannot be undone.';openModal('fileDeleteModal',b);});});}
function openDocs(appId,opener){renderDocs(appId);openModal('docsModal',opener);}
if($('confirmFileDelete'))$('confirmFileDelete').addEventListener('click',function(){if(!pendingFile)return;var a=appById(pendingFile.appId),cl=S.ensureChecklist(data,a),r=cl.find(function(x){return x.docId===pendingFile.docId;});
 var f=r.files.splice(pendingFile.k,1)[0];S.syncRow(r);var was=a.status;S.syncReview(data,a);a.updatedAt=S.today();S.log(data,'Delete','Documents',f.name,'Removed submitted file for '+S.clientName(clientById(a.clientId)));S.save(data);pendingFile=null;
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
var VIEW='';
function viewIds(){if(!VIEW)return null;var id=VIEW.slice(2);return VIEW.charAt(0)==='m'?S.teamIds(data,id):[id];}
function viewLabel(){if(!VIEW)return '';var a=S.adminById(data,VIEW.slice(2));return a?(VIEW.charAt(0)==='m'?S.adminName(a)+'’s team':S.adminName(a)):'';}
function viewSetup(){var w=$('dashViewWrap'),sel=$('dashView');if(!w||!(SUPER||MGR))return;function o(v,t){return '<option value="'+esc(v)+'">'+esc(t)+'</option>';}
 var h;if(SUPER){var ms=S.managers(data),st=S.staffList(data).filter(function(a){return !S.manages(data,a.role);});h=o('','Whole business')+(ms.length?'<optgroup label="Managers">'+ms.map(function(m){return o('m:'+m.id,S.adminName(m)+' (team)');}).join('')+'</optgroup>':'')+(st.length?'<optgroup label="Team members">'+st.map(function(s){return o('s:'+s.id,S.adminName(s));}).join('')+'</optgroup>':'');}
 else{h=o('','Whole team')+TEAM.filter(function(id){return id!==ME0;}).map(function(id){var a=S.adminById(data,id);return a?o('s:'+id,S.adminName(a)):'';}).join('');}
 sel.innerHTML=h;w.hidden=false;sel.addEventListener('change',function(){VIEW=sel.value;drawDash();});}
function drawDash(){charts.forEach(function(c){c.destroy();});charts=[];SC=getScope();var VI=viewIds();
 C=data.clients.filter(function(c){return VI?VI.indexOf(c.assignedAdminId)>-1:inScope(c,SC);});var ids={};C.forEach(function(c){ids[c.id]=1;});
 A=data.applications.filter(function(a){return ids[a.clientId];});share=data.clients.length?C.length/data.clients.length:0;
 if($('scopeNote'))$('scopeNote').textContent=VI?'Showing the '+C.length+' clients for '+viewLabel()+'.':SC==='all'?'Showing all '+C.length+' clients across the team.':SC==='team'?'Showing the '+C.length+' clients assigned to you and your team.':'Showing the '+C.length+' clients assigned to you.';
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
 $('kpis').innerHTML=[['Revenue · '+monLabel(keys[11]),money(curRev),'12-month total '+money(total12)],['Total clients',C.length,VI?(VIEW.charAt(0)==='m'?'Team total, live':'Assigned to this staff member, live'):SC==='all'?'Month-end total, live':SC==='team'?'You and your team, live':'Assigned to you, live'],['Active cases',actives.length,'Status: Active'],['Awaiting documents',awaiting.length,'Required documents still missing']]
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
  $('recent').innerHTML=recent.slice(start,start+PER).map(function(a,i){return '<tr><td data-label="No." class="muted">'+(start+i+1)+'</td><td data-label="Applicant"><span class="cell-strong">'+esc(S.clientName(clientById(a.clientId)))+'</span></td><td data-label="Case type">'+esc(a.type)+'</td><td data-label="Assigned admin">'+staffCell((clientById(a.clientId)||{}).assignedAdminId)+'</td><td data-label="Status">'+badge(a.status)+'</td><td data-label="Effective date">'+esc(S.effectiveDateOf(data,a)||'—')+'</td></tr>';}).join('');
  var pgr=$('recentPager');if(recent.length<=PER){pgr.hidden=true;return;}pgr.hidden=false;
  var h='<button type="button" class="s-btn ghost" data-pg="prev" '+(pg===1?'disabled':'')+' aria-label="Previous page">‹ Previous</button>';
  for(var i=1;i<=pages;i++)h+='<button type="button" class="s-btn '+(i===pg?'outline':'ghost')+' pg-num" data-pg="'+i+'" '+(i===pg?'aria-current="page"':'')+' aria-label="Page '+i+'">'+i+'</button>';
  h+='<button type="button" class="s-btn ghost" data-pg="next" '+(pg===pages?'disabled':'')+' aria-label="Next page">Next ›</button>';
  pgr.innerHTML=h;$('recentInfo').textContent='Showing '+(start+1)+'–'+Math.min(start+PER,recent.length)+' of '+recent.length;
  pgr.querySelectorAll('[data-pg]').forEach(function(b){b.addEventListener('click',function(){var v=b.getAttribute('data-pg');pg=v==='prev'?pg-1:v==='next'?pg+1:+v;renderRecent();var f=pgr.querySelector('[aria-current]');if(f)f.focus();});});}
 renderRecent();
 drawExtras();
}
function drawExtras(){var el=$('dashExtra');if(!el)return;var ACTIVE={New:1,Active:1,Submitted:1,Review:1};
 function bars(rows){var mx=Math.max.apply(null,rows.map(function(r){return r[1];}).concat([1]));return '<ul class="hbars">'+rows.map(function(r){return '<li><span class="hb-l">'+esc(r[0])+'</span><span class="hb-t"><span class="hb-f" style="width:'+Math.round(r[1]/mx*100)+'%"></span></span><b>'+r[1]+'</b></li>';}).join('')+'</ul>';}
 var since=Date.now()-30*864e5;
 function acts(id){return (data.logs||[]).filter(function(l){return l.actorId===id&&Date.parse(l.at)>=since;}).length;}
 function logRows(list){return list.length?list.map(function(l){return '<li><span class="act-who">'+esc(l.actor)+'</span> <span class="muted">'+esc(l.action.toLowerCase())+'</span> '+esc(l.target)+'<span class="act-when muted">'+esc(new Date(l.at).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}))+'</span></li>';}).join(''):'<li class="muted">No activity yet.</li>';}
 var VI=viewIds();var logs=(data.logs||[]).filter(function(l){return VI?VI.indexOf(l.actorId)>-1:(SUPER||!MGR||TEAM.indexOf(l.actorId)>-1);}).sort(function(a,b){return a.at<b.at?1:-1;});
 if(SUPER||MGR){
  var ST=['New','Active','Submitted','Review','Approved','Denied','Cancelled'];
  var byS=ST.map(function(s){return [s,A.filter(function(a){return a.status===s;}).length];});
  var cs={};A.forEach(function(a){var v=S.visaFor?S.visaFor(data,a):null;var k=v?S.visaCountry(v):'—';cs[k]=(cs[k]||0)+1;});
  var byC=Object.keys(cs).map(function(k){return [k,cs[k]];}).sort(function(a,b){return b[1]-a[1];});
  function agg(list){var ids={};var cl=data.clients.filter(function(c){return list.indexOf(c.assignedAdminId)>-1;});cl.forEach(function(c){ids[c.id]=1;});var ap=data.applications.filter(function(a){return ids[a.clientId];});return [cl.length,ap.length,ap.filter(function(a){return ACTIVE[a.status];}).length,ap.filter(function(a){return a.status==='Approved';}).length,ap.filter(function(a){return S.progress(data,a)<100&&ACTIVE[a.status];}).length,list.reduce(function(n,id){return n+acts(id);},0)];}
  var mgrTbl='';if(SUPER&&!VI){var ms=S.managers(data);if(ms.length)mgrTbl='<section class="s-card dash-sec"><div class="s-card-head"><h2>Teams by manager</h2></div><div class="s-table-wrap"><table class="s-table"><thead><tr><th>Manager</th><th class="num">Staff</th><th class="num">Clients</th><th class="num">Applications</th><th class="num">Active</th><th class="num">Approved</th><th class="num">Awaiting documents</th><th class="num">Actions (30 days)</th></tr></thead><tbody>'+ms.map(function(m){var t=S.teamIds(data,m.id);return '<tr><td><span class="who-cell">'+staffAv(m,'sm')+'<span class="cell-strong">'+esc(S.adminName(m))+'</span></span></td><td class="num">'+(t.length-1)+'</td>'+agg(t).map(function(v){return '<td class="num">'+v+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div></section>';}
  var staff=S.staffList(data).filter(function(s){return VI?VI.indexOf(s.id)>-1:(SUPER||TEAM.indexOf(s.id)>-1);}).map(function(s){var cl=data.clients.filter(function(c){return c.assignedAdminId===s.id;}),ids={};cl.forEach(function(c){ids[c.id]=1;});var ap=data.applications.filter(function(a){return ids[a.clientId];});
   return '<tr><td><span class="who-cell">'+staffAv(s,'sm')+'<span class="cell-strong">'+esc(S.adminName(s))+'</span></span></td><td class="num">'+cl.length+'</td><td class="num">'+ap.length+'</td><td class="num">'+ap.filter(function(a){return ACTIVE[a.status];}).length+'</td><td class="num">'+ap.filter(function(a){return a.status==='Approved';}).length+'</td><td class="num">'+ap.filter(function(a){return S.progress(data,a)<100&&ACTIVE[a.status];}).length+'</td><td class="num">'+acts(s.id)+'</td></tr>';}).join('');
  el.innerHTML='<div class="chart-grid"><section class="s-card"><div class="s-card-head"><h2>Applications by status</h2></div>'+bars(byS)+'</section><section class="s-card"><div class="s-card-head"><h2>Applications by country</h2></div>'+bars(byC)+'</section></div>'
   +mgrTbl+'<section class="s-card dash-sec"><div class="s-card-head"><h2>'+(VIEW.charAt(0)==='s'?'Performance':SUPER&&!VI?'Staff performance':'Team performance')+'</h2></div><div class="s-table-wrap"><table class="s-table"><thead><tr><th>Staff member</th><th class="num">Clients</th><th class="num">Applications</th><th class="num">Active</th><th class="num">Approved</th><th class="num">Awaiting documents</th><th class="num">Actions (30 days)</th></tr></thead><tbody>'+staff+'</tbody></table></div></section>'
   +'<section class="s-card dash-sec"><div class="sec-head"><div class="s-card-head"><h2>'+(VIEW.charAt(0)==='s'?'Recent activity':SUPER&&!VI?'Recent activity':'Team activity')+'</h2></div>'+(can('logs','view')?'<a href="logs.html">View all activity</a>':'')+'</div><ul class="act-list">'+logRows(logs.slice(0,8))+'</ul></section>';
 }else{
  var mine=logs.filter(function(l){return l.actorId===ME0;});
  var k=[['Active applications',A.filter(function(a){return ACTIVE[a.status];}).length,'New, active, submitted or in review'],['Approved',A.filter(function(a){return a.status==='Approved';}).length,'All time, your clients'],['Submitted',A.filter(function(a){return a.status==='Submitted'||a.status==='Review';}).length,'Submitted or in review'],['Your actions',acts(ME0),'Last 30 days']];
  el.innerHTML='<h2 class="dash-h2">Your performance</h2><div class="kpi-grid">'+k.map(function(x){return '<div class="s-card kpi"><p class="kpi-label">'+x[0]+'</p><p class="kpi-value">'+x[1]+'</p><p class="kpi-sub">'+x[2]+'</p></div>';}).join('')+'</div>'
   +'<section class="s-card dash-sec"><div class="s-card-head"><h2>Your recent activity</h2></div><ul class="act-list">'+logRows(mine.slice(0,8))+'</ul></section>';
 }}
var dh=document.querySelector('.page-head h1');if(dh)dh.textContent=SUPER||MGR?'Team dashboard':'My dashboard';
viewSetup();drawDash();scopeToggle($('scopeSeg'),drawDash);
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
  $('clientRows').innerHTML=slice.map(function(c){var apps=data.applications.filter(function(a){return a.clientId===c.id;});var act=apps.filter(isActiveApp);return '<tr><td>'+clientAv(c,'sm')+'<span class="cell-strong">'+esc(S.clientName(c))+'</span> <span class="muted cell-code">'+esc(S.clientCode(c))+'</span></td><td>'+esc(c.email)+'</td><td>'+esc(c.phone)+'</td><td><span class="assignee'+(c.assignedAdminId===ME?' is-me':'')+'">'+staffCell(c.assignedAdminId)+'</span></td><td>'+apps.length+(apps.length?'<span class="muted app-act-n">'+act.length+' active</span>':'')+'</td><td>'+(act.length?'<ul class="app-mini">'+act.map(function(x){return '<li>'+esc(S.visaCountry(S.visaFor(data,x)))+' - '+esc(x.type)+' · '+esc(x.status)+'</li>';}).join('')+'</ul>':'<span class="muted">None</span>')+'</td><td><div class="row-acts"><a class="icon-btn" href="messages.html?c='+encodeURIComponent(c.id)+'" aria-label="Message" title="Message">'+MSGI+'</a><button type="button" class="icon-btn" data-edit-client="'+c.id+'" aria-label="Edit client '+esc(S.clientName(c))+'" title="Edit client">'+PENCIL+'</button>'+(can('clients','delete')?'<button type="button" class="icon-btn danger" data-del-client="'+c.id+'" aria-label="Delete client '+esc(S.clientName(c))+'" title="Delete client">'+TRASH+'</button>':'')+'<button type="button" class="icon-btn" data-reset-client="'+c.id+'" aria-label="Send password reset link" title="Send password reset link">'+KEYI+'</button></div></td></tr>';}).join('');
  $('pageInfo').textContent='Page '+cur+' of '+pages+' · '+list.length+' clients';
  $('prevPage').disabled=cur<=1; $('nextPage').disabled=cur>=pages;
  document.querySelectorAll('[data-edit-client]').forEach(function(b){b.addEventListener('click',function(){openEdit(b.getAttribute('data-edit-client'),b);});});
  document.querySelectorAll('[data-del-client]').forEach(function(b){b.addEventListener('click',function(){delClient=b.getAttribute('data-del-client');var c=clientById(delClient),n=data.applications.filter(function(a){return a.clientId===delClient;}).length;$('delClientMsg').textContent='Delete '+S.clientName(c)+'? This removes their '+n+' application'+(n===1?'':'s')+', document checklists and messages. This cannot be undone.';openModal('delClientModal',b);});});}
 var delClient=null;
 if($('confirmReset')){var rsClient=null;
  $('clientRows').addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-reset-client]');if(!b)return;var c=clientById(b.getAttribute('data-reset-client'));if(!c)return;rsClient=c.id;
   $('resetMsg').innerHTML='Send a password reset link to <strong>'+esc(c.email)+'</strong>? '+esc(S.clientName(c))+' will get a temporary password to sign in with. Their current password will stop working.';openModal('resetModal',b);});
  $('confirmReset').addEventListener('click',function(){var c=rsClient&&clientById(rsClient);if(!c)return;
   if(!SUPER&&!inScope(c)){closeModal('resetModal');return;}
   var A='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789',pw='';var r=new Uint32Array(10);(window.crypto||{getRandomValues:function(a){for(var i=0;i<a.length;i++)a[i]=Math.random()*4e9;return a;}}).getRandomValues(r);for(var i=0;i<10;i++)pw+=A.charAt(r[i]%A.length);
   c.password=pw;c.pwResetAt=new Date().toISOString();S.log(data,'Password Reset','Clients',S.clientName(c),'Password reset link sent to '+c.email+' (temporary password issued)');
   if(!S.save(data)){closeModal('resetModal');toast('Couldn’t save. Browser storage is full.');return;}closeModal('resetModal');rsClient=null;toast('Temporary password sent to '+c.email);});}
 if($('confirmDelClient'))$('confirmDelClient').addEventListener('click',function(){if(!delClient||!can('clients','delete'))return;var c=clientById(delClient),aids=data.applications.filter(function(a){return a.clientId===delClient;}).map(function(a){return a.id;});data.applications=data.applications.filter(function(a){return a.clientId!==delClient;});aids.forEach(function(id){delete data.checklists[id];});if(data.threads)data.threads=data.threads.filter(function(t){return t.clientId!==delClient;});data.clients=data.clients.filter(function(x){return x.id!==delClient;});S.log(data,'Delete','Clients',S.clientName(c),'Deleted client and '+aids.length+' application'+(aids.length===1?'':'s'));S.save(data);delClient=null;closeModal('delClientModal');render();});
 if(!can('clients','add'))$('addClientBtn').hidden=true;
 onDocsChanged=function(){render();if(editingId)renderEditApps();};
 function docCount(a){return S.ensureChecklist(data,a).filter(function(r){return r.done;}).length;}
 function renderEditApps(){var apps=data.applications.filter(function(a){return a.clientId===editingId;});if($('editAppsCount'))$('editAppsCount').textContent='('+apps.length+')';
  $('editApps').innerHTML=apps.length?apps.map(function(a){var n=docCount(a),eff=S.effectiveDateOf(data,a)||'—';
   return '<li><div class="app-card" role="button" tabindex="0" data-app="'+esc(a.id)+'" aria-label="'+esc(a.type+', '+a.status+', '+n+' document'+(n===1?'':'s')+'. Open documents')+'">'
   +'<div class="app-card-top"><span class="app-card-type">'+esc(a.type)+'</span>'+badge(a.status)+'</div>'
   +'<dl class="app-card-meta"><div><dt>Counselor</dt><dd>'+esc((counselorOf(a)?S.adminName(counselorOf(a)):'—'))+'</dd></div><div><dt>Effective</dt><dd>'+esc(eff)+'</dd></div><div><dt>Created</dt><dd>'+esc(a.createdAt||a.date)+'</dd></div><div><dt>Updated</dt><dd>'+esc(a.updatedAt||a.createdAt||a.date)+'</dd></div></dl>'
   +'<div class="app-card-foot"><span>'+n+' document'+(n===1?'':'s')+'</span><span class="app-card-chev" aria-hidden="true">View documents ›</span></div></div></li>';}).join(''):'<li class="card">No applications yet.</li>';
  S.save(data);
  document.querySelectorAll('#editApps [data-app]').forEach(function(el){function go(){openDocs(el.getAttribute('data-app'),el);}
   el.addEventListener('click',go);el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});});}
 function openEdit(cid,btn){editingId=cid;var c=clientById(cid);$('editFirst').value=c.first||'';$('editMiddle').value=c.middle||'—';$('editLast').value=c.last||'';$('editEmail').value=c.email;$('editPhone').value=c.phone;$('editClientName').textContent=S.clientName(c);$('editAdmin').innerHTML=adminOptions(c.assignedAdminId);if($('editClientMsg')){$('editClientMsg').href='messages.html?c='+encodeURIComponent(cid);$('editClientMsg').setAttribute('aria-label','Message '+S.clientName(c));}renderEditApps();var ce=can('clients','edit');$('editClientForm').querySelectorAll('input,select').forEach(function(x){if(x.id!=='editMiddle'&&x.id!=='editFirst'&&x.id!=='editLast')x.disabled=!ce;});var sb=$('editClientForm').querySelector('[type=submit]');if(sb)sb.hidden=!ce;if($('addAppForClient'))$('addAppForClient').hidden=!ce;openModal('editClientModal');if(btn)lastFocus=btn;}
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
  if(!can('clients','add'))return;data.clients.push(c);S.log(data,'Create','Clients',S.clientName(c),'Added client with '+type+' application');
  data.applications.push({id:'a-'+Date.now(),clientId:c.id,type:type,visaId:v.id,effectiveDate:v.effective,status:'New',date:S.today(),createdAt:S.today(),updatedAt:S.today(),progress:0});
  S.save(data); closeModal('addClientModal'); e.target.reset(); if(!inScope(c)){sessionStorage.setItem('isc_scope','all');scopeToggle($('scopeSeg'),function(){cur=1;render();});} cur=1; render();});
 $('editClientForm').addEventListener('submit',function(e){e.preventDefault();if(!can('clients','edit'))return;var c=clientById(editingId);var o={e:c.email,p:c.phone};c.email=$('editEmail').value.trim();c.phone=$('editPhone').value.trim();var na=$('editAdmin').value,moved=na&&na!==c.assignedAdminId;if(na)c.assignedAdminId=na;c.updatedAt=S.today();var dt=[];if(o.e!==c.email)dt.push('Email updated');if(o.p!==c.phone)dt.push('Phone updated');if(moved)dt.push('Reassigned to '+adminLabel(na));S.log(data,'Edit','Clients',S.clientName(c),dt.join('; ')||'Saved details');S.save(data);$('editMsg').textContent=moved?'Saved. Assigned to '+adminLabel(na)+'.':'Details saved.';render();});
 populateEffective($('editVisaType').value,$('editEffective'));
 $('editVisaType').addEventListener('change',function(){populateEffective($('editVisaType').value,$('editEffective'));$('editAppError').textContent='';});
 $('addAppForClient').addEventListener('click',function(){if(!editingId||!can('clients','edit'))return;$('addAppTitle').textContent='Add an application for '+S.clientName(clientById(editingId));$('editAppError').textContent='';openModal('addAppModal',$('addAppForClient'));});
 $('addAppForm').addEventListener('submit',function(ev){ev.preventDefault();if(!editingId||!can('clients','edit'))return;var v=selectedVisa($('editEffective'));if(!v){$('editAppError').textContent='Cannot add: a case type with an effective date is needed first. Add one on the Case types page.';return;}$('editAppError').textContent='';var a={id:'a-'+Date.now(),clientId:editingId,type:$('editVisaType').value,visaId:v.id,effectiveDate:v.effective,status:'New',date:S.today(),createdAt:S.today(),updatedAt:S.today(),progress:0};data.applications.push(a);S.log(data,'Create','Applications',S.clientName(clientById(editingId)),'Added '+a.type+' application');S.save(data);renderEditApps();render();closeModal('addAppModal');$('editMsg').textContent='';toast('Added '+a.type+' application for '+S.clientName(clientById(editingId)));});
 ['search','fStatus','fType'].forEach(function(id){$(id).addEventListener('input',function(){cur=1;render();});});
 scopeToggle($('scopeSeg'),function(){cur=1;render();});
 $('prevPage').addEventListener('click',function(){cur--;render();}); $('nextPage').addEventListener('click',function(){cur++;render();}); render();
 var deep=new URLSearchParams(location.search).get('client');if(deep&&clientById(deep)&&!inScope(clientById(deep))&&(SUPER||can('clients','all'))){sessionStorage.setItem('isc_scope','all');scopeToggle($('scopeSeg'),function(){cur=1;render();});render();}
 if(deep&&clientById(deep))setTimeout(function(){openEdit(deep,null);},0);
}

/* ================= OWNER: documents ================= */
if(page==='documents'){
 var pendingDelete=null,editDoc=null,draft=[],repIdx=-1;
 var canAdd=can('documents','add'),canEdit=can('documents','edit'),canDel=can('documents','delete');
 if(!canAdd)$('addDocBtn').hidden=true;
 function filesOf(d){return d.files?d.files:(d.sample?[d.sample]:[]);}
 function pageMsg(t,bad){var m=$('sampleStatus');m.textContent=t;m.className=bad?'sample-status err':'sample-status';}
 function attMsg(t,bad){var m=$('attMsg');m.textContent=t;m.className=bad?'att-msg err':'att-msg';}
 function render(){var list=data.documents;
  $('docRows').innerHTML=list.map(function(d){var fs=filesOf(d);return '<tr><td><span class="cell-strong">'+esc(d.name)+'</span></td><td>'+esc(d.version)+'</td><td>'+esc(d.status)+'</td><td>'+(fs.length?'<span class="att-count">'+fs.length+' file'+(fs.length===1?'':'s')+'</span><span class="muted att-first">'+esc(fs[0].name)+(fs.length>1?' +'+(fs.length-1)+' more':'')+'</span>':'<span class="muted">None</span>')+'</td><td>'+esc(d.createdAt)+'</td><td>'+esc(d.updatedAt)+'</td><td>'+d.uploaded+'</td><td class="row-acts">'
   +(canEdit?'<button type="button" class="icon-btn" data-edit="'+d.id+'" aria-label="Edit document '+esc(d.name)+'" title="Edit document">'+PENCIL+'</button>':'')
   +(canDel?'<button type="button" class="icon-btn danger" data-del="'+d.id+'" aria-label="Delete document '+esc(d.name)+'" title="Delete document">'+TRASH+'</button>':'')
   +(!canEdit&&!canDel?'<span class="muted">—</span>':'')+'</td></tr>';}).join('');
  document.querySelectorAll('[data-edit]').forEach(function(b){b.addEventListener('click',function(){openDoc(b.getAttribute('data-edit'),b);});});
  document.querySelectorAll('[data-del]').forEach(function(b){b.addEventListener('click',function(){if(!can('documents','delete'))return;pendingDelete=b.getAttribute('data-del');var d=S.docById(data,pendingDelete);var n=(data.visas||[]).filter(function(v){return v.docIds.indexOf(d.id)>-1;}).length;$('deleteMsg').textContent='Delete “'+d.name+'” and its '+filesOf(d).length+' attached file'+(filesOf(d).length===1?'':'s')+'? '+(n?'It will also be removed from '+n+' case type'+(n===1?'':'s')+' that require it.':'No case types require it.')+' This cannot be undone.';openModal('confirmModal',b);});});}
 function openDoc(id,opener){editDoc=id?S.docById(data,id):null;$('docForm').reset();$('docId').value=id||'';$('docTitle').textContent=editDoc?'Edit document':'Add document';
  if(editDoc){$('docName').value=editDoc.name;$('docVersion').value=editDoc.version;$('docStatus').value=editDoc.status;}
  draft=JSON.parse(JSON.stringify(editDoc?filesOf(editDoc):[]));$('docMsg').textContent='';attMsg('');renderAtt();openModal('docModal',opener);}
 function renderAtt(){
  $('attList').innerHTML=draft.length?draft.map(function(f,i){return '<li class="att-row"><div class="att-main"><label class="sr-only" for="attName'+i+'">File name</label><input id="attName'+i+'" class="att-name" data-aname="'+i+'" value="'+esc(f.name)+'"><span class="muted att-meta">'+esc(typeLabel(f.type||'',f.name))+' · '+esc(fmtSize(f.size))+(f.addedAt?' · Added '+esc(f.addedAt):'')+'</span></div><div class="att-acts">'
   +(f.dataUrl?'<button type="button" class="btn ghost sm" data-aview="'+i+'" aria-label="View '+esc(f.name)+'">View</button>':'')
   +'<button type="button" class="btn ghost sm" data-arep="'+i+'" aria-label="Replace '+esc(f.name)+'">Replace</button><button type="button" class="icon-btn danger" data-adel="'+i+'" aria-label="Delete '+esc(f.name)+'" title="Delete file">'+TRASH+'</button></div></li>';}).join(''):'<li class="muted att-empty">No files attached yet.</li>';
  $('attList').querySelectorAll('[data-aname]').forEach(function(inp){inp.addEventListener('input',function(){draft[+inp.getAttribute('data-aname')].name=inp.value;});});
  $('attList').querySelectorAll('[data-aview]').forEach(function(b){b.addEventListener('click',function(){openSample({name:$('docName').value||'Document',sample:draft[+b.getAttribute('data-aview')]},b);});});
  $('attList').querySelectorAll('[data-arep]').forEach(function(b){b.addEventListener('click',function(){repIdx=+b.getAttribute('data-arep');var fi=$('sampleFile');fi.multiple=false;fi.value='';fi.click();});});
  $('attList').querySelectorAll('[data-adel]').forEach(function(b){b.addEventListener('click',function(){var i=+b.getAttribute('data-adel'),f=draft.splice(i,1)[0];renderAtt();attMsg('Removed '+f.name+'. Save the document to apply.');var nx=$('attList').querySelector('[data-adel]')||$('attAdd');nx.focus();});});}
 $('attAdd').addEventListener('click',function(){repIdx=-1;var fi=$('sampleFile');fi.multiple=true;fi.value='';fi.click();});
 $('sampleFile').addEventListener('change',function(){var files=[].slice.call($('sampleFile').files||[]);if(!files.length)return;var ok=[],bad=[];
  files.forEach(function(f){if(f.size>S.SAMPLE_MAX)bad.push(f.name);else ok.push(f);});
  var left=ok.length,names=[];if(!left){attMsg(bad.join(', ')+' '+(bad.length===1?'is':'are')+' larger than '+fmtSize(S.SAMPLE_MAX)+'. Choose a smaller file.',true);return;}
  ok.forEach(function(f){var rd=new FileReader();rd.onload=function(){var rec={name:f.name,type:f.type||'',size:f.size,dataUrl:String(rd.result),addedAt:S.today()};
   if(repIdx>-1&&draft[repIdx]){draft[repIdx]=rec;}else draft.push(rec);names.push(f.name);if(--left===0){var was=repIdx>-1;renderAtt();attMsg((was?'Replaced with ':'Added ')+names.join(', ')+'. Save the document to apply.'+(bad.length?' Skipped '+bad.join(', ')+' (over '+fmtSize(S.SAMPLE_MAX)+').':''),!!bad.length);repIdx=-1;}};
   rd.onerror=function(){attMsg('Could not read “'+f.name+'”.',true);};rd.readAsDataURL(f);});});
 $('confirmDelete').addEventListener('click',function(){if(!pendingDelete||!can('documents','delete'))return;var d=S.docById(data,pendingDelete);data.documents=data.documents.filter(function(x){return x.id!==pendingDelete;});data.visas.forEach(function(v){if(v.docIds.indexOf(pendingDelete)>-1){v.docIds=v.docIds.filter(function(id){return id!==pendingDelete;});v.updatedAt=S.today();}});pendingDelete=null;S.log(data,'Delete','Documents',d?d.name:'Document','Deleted document');S.save(data);closeModal('confirmModal');render();pageMsg('Deleted '+(d?d.name:'document')+'.');});
 $('addDocBtn').addEventListener('click',function(b){openDoc(null,$('addDocBtn'));});
 $('docForm').addEventListener('submit',function(e){e.preventDefault();var today=S.today();var id=$('docId').value,name=$('docName').value.trim();
  if(!name){$('docMsg').textContent='Document name is required.';$('docName').focus();return;}
  if(id?!can('documents','edit'):!can('documents','add')){$('docMsg').textContent='You don’t have permission to do this.';return;}
  var empty=draft.filter(function(f){return !String(f.name||'').trim();});if(empty.length){attMsg('Every file needs a name.',true);return;}
  draft.forEach(function(f){f.name=f.name.trim();});
  var d,prev=null,isNew=!id;if(id){d=S.docById(data,id);prev=JSON.stringify({n:d.name,v:d.version,s:d.status,f:filesOf(d),sm:d.sample});}else{d={id:'d-'+Date.now(),createdAt:today,uploaded:0};data.documents.push(d);}
  var before=prev?JSON.parse(prev):null;
  d.name=name;delete d.type;delete d.applicationType;d.version=$('docVersion').value.trim()||'v1.0';d.status=$('docStatus').value;d.files=draft.slice();if(draft.length)d.sample=draft[0];else delete d.sample;d.updatedAt=today;
  var det=[];if(before){if(before.n!==d.name)det.push('Renamed from “'+before.n+'”');if(before.v!==d.version)det.push('Version '+before.v+' → '+d.version);if(before.s!==d.status)det.push('Status '+before.s+' → '+d.status);if(JSON.stringify(before.f.map(function(f){return f.name+f.size;}))!==JSON.stringify(d.files.map(function(f){return f.name+f.size;})))det.push('Attachments updated ('+d.files.length+' file'+(d.files.length===1?'':'s')+')');}
  S.log(data,isNew?'Create':'Edit','Documents',d.name,isNew?'Added document'+(d.files.length?' with '+d.files.length+' file'+(d.files.length===1?'':'s'):''):(det.join('; ')||'Saved without changes'));
  if(!S.trySave(data)){if(isNew)data.documents=data.documents.filter(function(x){return x!==d;});else{d.name=before.n;d.version=before.v;d.status=before.s;d.files=before.f;if(before.sm)d.sample=before.sm;else delete d.sample;}data.logs.pop();attMsg('Browser storage is full, so the files could not be saved. Remove a file or use a smaller one.',true);return;}
  closeModal('docModal');render();pageMsg((isNew?'Added ':'Saved ')+d.name+'.');});
 render();
}
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
  $('visaRows').innerHTML=sorted.map(function(v){return '<tr><td><strong>'+esc(v.name)+'</strong></td><td>'+esc(S.visaCountry(v))+'</td><td>'+esc(v.effective)+'</td><td>'+esc(v.notes)+'</td><td>'+v.docIds.length+'</td><td>'+esc(v.createdAt)+'</td><td>'+esc(v.updatedAt)+'</td><td class="row-acts">'+(can('casetypes','edit')?'<button type="button" class="icon-btn" data-edit-visa="'+v.id+'" aria-label="Edit case type '+esc(v.name)+'" title="Edit case type">'+PENCIL+'</button>':'')+(can('casetypes','delete')?'<button type="button" class="icon-btn danger" data-del-visa="'+v.id+'" aria-label="Delete case type '+esc(v.name)+'" title="Delete case type">'+TRASH+'</button>':'')+'</div></td></tr>';}).join('');
  document.querySelectorAll('[data-del-visa]').forEach(function(b){b.addEventListener('click',function(){var v=data.visas.find(function(x){return x.id===b.getAttribute('data-del-visa');});var used=data.applications.filter(function(a){return S.visaFor(data,a)===v;}).length;delVisa=used?null:v.id;$('delVisaMsg').textContent=used?'“'+v.name+'” is used by '+used+' application'+(used===1?'':'s')+', so it can’t be deleted. Move or remove those applications first.':'Delete “'+v.name+'” ('+S.visaCountry(v)+')? Its document checklist will be removed. This cannot be undone.';$('confirmDelVisa').hidden=!!used;openModal('delVisaModal',b);});});
  document.querySelectorAll('[data-edit-visa]').forEach(function(b){b.addEventListener('click',function(){editingVisa=b.getAttribute('data-edit-visa');var v=data.visas.find(function(x){return x.id===editingVisa;});$('visaName').value=v.name;$('visaCountry').value=S.visaCountry(v);$('visaDate').value=v.effective;$('visaNotes').value=v.notes;pickerChosen=v.docIds.slice();selAvail.clear();selReq.clear();renderPicker();openModal('visaModal');lastFocus=b;});});}
 var delVisa=null;
 if(!can('casetypes','add'))$('addVisaBtn').hidden=true;
 $('confirmDelVisa').addEventListener('click',function(){if(!delVisa||!can('casetypes','delete'))return;var v=data.visas.find(function(x){return x.id===delVisa;});data.visas=data.visas.filter(function(x){return x.id!==delVisa;});S.log(data,'Delete','Case types',v.name,'Deleted case type ('+S.visaCountry(v)+')');S.save(data);delVisa=null;closeModal('delVisaModal');render();});
 $('addVisaBtn').addEventListener('click',function(){if(!can('casetypes','add'))return;editingVisa=null;$('visaForm').reset();pickerChosen=[];selAvail.clear();selReq.clear();renderPicker();openModal('visaModal');});
 $('visaForm').addEventListener('submit',function(e){e.preventDefault();var name=$('visaName').value.trim();if(!name){$('visaMsg').textContent='Case type is required.';return;}var country=$('visaCountry').value;if(!country){$('visaMsg').textContent='Country is required.';$('visaCountry').focus();return;}
  if(editingVisa?!can('casetypes','edit'):!can('casetypes','add')){$('visaMsg').textContent='You don’t have permission to do this.';return;}
  if(editingVisa){var v=data.visas.find(function(x){return x.id===editingVisa;});S.log(data,'Edit','Case types',name,v.name!==name?'Renamed from “'+v.name+'”':'Updated details and required documents');v.name=name;v.country=country;v.effective=$('visaDate').value;v.notes=$('visaNotes').value;v.docIds=pickerChosen.slice();v.updatedAt=S.today();}
  else{S.log(data,'Create','Case types',name,'Added case type ('+country+')');data.visas.push({id:'v-'+Date.now(),name:name,country:country,effective:$('visaDate').value,notes:$('visaNotes').value,docIds:pickerChosen.slice(),createdAt:S.today(),updatedAt:S.today()});}
  S.save(data);closeModal('visaModal');render();});
 renderPicker(); render();
}
if(page==='logs'){
 var LPER=25,lpg=1,ACTS=['Login','Logout','Create','Edit','Delete','Status change','Upload','Permission change','Password Reset'];
 var LOGS=(data.logs||[]).filter(function(l){return SUPER||(MGR?TEAM.indexOf(l.actorId)>-1:l.actorId===ME0);});
 var users={};LOGS.forEach(function(l){users[l.actorId]=l.actor;});
 $('logUser').innerHTML='<option value="">All users</option>'+Object.keys(users).sort(function(a,b){return users[a]<users[b]?-1:1;}).map(function(k){return '<option value="'+esc(k)+'">'+esc(users[k])+'</option>';}).join('');
 $('logAction').innerHTML='<option value="">All actions</option>'+ACTS.map(function(a){return '<option>'+a+'</option>';}).join('');
 var areas={};LOGS.forEach(function(l){areas[l.area]=1;});
 $('logArea').innerHTML='<option value="">All areas</option>'+Object.keys(areas).sort().map(function(a){return '<option>'+esc(a)+'</option>';}).join('');
 function dkey(iso){var d=new Date(iso);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
 function lrender(){var q=$('logQ').value.trim().toLowerCase(),u=$('logUser').value,ac=$('logAction').value,ar=$('logArea').value,fr=$('logFrom').value,to=$('logTo').value;
  var list=LOGS.filter(function(l){var k=dkey(l.at);return (!u||l.actorId===u)&&(!ac||l.action===ac)&&(!ar||l.area===ar)&&(!fr||k>=fr)&&(!to||k<=to)&&(!q||(l.actor+' '+l.target+' '+l.detail+' '+l.action).toLowerCase().indexOf(q)>-1);}).sort(function(a,b){return a.at<b.at?1:a.at>b.at?-1:0;});
  var pages=Math.max(1,Math.ceil(list.length/LPER));if(lpg>pages)lpg=pages;var st=(lpg-1)*LPER;
  $('logRows').innerHTML=list.slice(st,st+LPER).map(function(l){return '<tr><td class="log-when">'+esc(new Date(l.at).toLocaleString(undefined,{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}))+'</td><td><span class="cell-strong">'+esc(l.actor)+'</span><span class="muted log-role">'+esc(l.role)+'</span></td><td><span class="log-act act-'+esc(l.action.toLowerCase().replace(/\s+/g,'-'))+'">'+esc(l.action)+'</span></td><td>'+esc(l.area)+'</td><td>'+esc(l.target)+'</td><td class="muted">'+esc(l.detail)+'</td></tr>';}).join('')||'<tr><td colspan="6" class="muted">No activity matches these filters.</td></tr>';
  $('logInfo').textContent=list.length?'Showing '+(st+1)+'–'+Math.min(st+LPER,list.length)+' of '+list.length+' entries':'0 entries';
  var h='<button type="button" class="btn ghost sm" data-lp="prev" '+(lpg===1?'disabled':'')+'>‹ Previous</button><span class="pg-of">Page '+lpg+' of '+pages+'</span><button type="button" class="btn ghost sm" data-lp="next" '+(lpg===pages?'disabled':'')+'>Next ›</button>';
  $('logPager').innerHTML=h;$('logPager').querySelectorAll('[data-lp]').forEach(function(b){b.addEventListener('click',function(){lpg+=b.getAttribute('data-lp')==='next'?1:-1;lrender();});});}
 ['logQ','logUser','logAction','logArea','logFrom','logTo'].forEach(function(id){$(id).addEventListener(id==='logQ'?'input':'change',function(){lpg=1;lrender();});});
 $('logReset').addEventListener('click',function(){['logQ','logUser','logAction','logArea','logFrom','logTo'].forEach(function(id){$(id).value='';});lpg=1;lrender();});
 lrender();
}
if(page==='team'){
 var LBL=new Proxy({},{get:function(_,k){return S.roleLabel(data,k);}}),PER=10,tpg=1,editU=null;
 function pillCls(r){return r==='super'||r==='archive'?r:S.manages(data,r)?'manager':r==='staff'?'staff':'custom';}
 function defLv(){return S.levelById(data,'staff')?'staff':(S.levels(data)[0]||{}).id||'super';}
 function o(v,t){return '<option value="'+esc(v)+'">'+esc(t)+'</option>';}
 function levelOpts(){$('mLevel').innerHTML=o('super','Admin')+S.levels(data).map(function(l){return o(l.id,l.name);}).join('')+o('archive','Archive');}
 function filterOpts(){var v=$('tmLevel').value;$('tmLevel').innerHTML=o('','All active')+o('super','Admin')+S.levels(data).map(function(l){return o(l.id,l.name);}).join('')+o('archive','Archive');$('tmLevel').value=v;if($('tmLevel').value!==v)$('tmLevel').value='';}
 filterOpts();
 var CAN_ADD=can('team','add'),CAN_EDIT=can('team','edit'),CAN_ARCH=can('team','delete');
 function initials(a){return ((a.first||'').charAt(0)+(a.last||'').charAt(0)).toUpperCase()||'?';}
 function avatar(a){return a.photo?'<span class="mem-av"><img src="'+esc(S.adminPhoto(a))+'" alt="" width="36" height="36" loading="lazy"></span>':'<span class="mem-av ini" aria-hidden="true">'+esc(initials(a))+'</span>';}
 function admins(){return data.admins.filter(function(a){return a.role==='super';});}
 function mgrOpts(sel,ex){return '<option value="">Select a manager…</option>'+S.managers(data).filter(function(m){return m.id!==ex;}).map(function(m){return '<option value="'+esc(m.id)+'"'+(m.id===sel?' selected':'')+'>'+esc(S.adminName(m))+'</option>';}).join('');}
 /* tabs */
 function tab(which){var m=which!=='perms';$('tabMembers').setAttribute('aria-selected',m);$('tabPerms').setAttribute('aria-selected',!m);$('panelMembers').hidden=!m;$('panelPerms').hidden=m;if(history.replaceState)history.replaceState(null,'',m?location.pathname:'#permissions');}
 $('tabMembers').addEventListener('click',function(){tab('members');});$('tabPerms').addEventListener('click',function(){tab('perms');});
 /* members list */
 function trender(){var q=$('tmQ').value.trim().toLowerCase(),lv=$('tmLevel').value,ORD=function(r){return r==='super'?0:r==='archive'?3:S.manages(data,r)?1:2;};
  var list=data.admins.filter(function(a){if(lv?a.role!==lv:a.role==='archive')return false;if(!q)return true;return [S.adminName(a),a.email,a.phone].join(' ').toLowerCase().indexOf(q)>-1;}).slice().sort(function(a,b){return (ORD(a.role)-ORD(b.role))||(a.first||'').localeCompare(b.first||'');});
  var pages=Math.max(1,Math.ceil(list.length/PER));if(tpg>pages)tpg=pages;var st=(tpg-1)*PER,rows=list.slice(st,st+PER);
  $('tmRows').innerHTML=rows.length?rows.map(function(a){var arch=a.role==='archive';return '<tr'+(arch?' class="is-archived"':'')+'><td>'+avatar(a)+'</td><td><span class="cell-strong">'+esc(a.first||'')+'</span>'+(a.id===ME0?' <span class="muted">(you)</span>':'')+'</td><td>'+esc(a.last||'')+'</td><td>'+esc(a.phone||'—')+'</td><td>'+esc(a.email||'')+'</td><td><span class="role-pill '+pillCls(a.role)+'">'+esc(LBL[a.role]||a.role)+'</span>'+(S.reportsTo(data,a.role)&&S.adminById(data,a.managerId)?'<span class="muted small tm-rep">Reports to '+esc(S.adminName(S.adminById(data,a.managerId)))+'</span>':'')+'</td><td><div class="row-acts">'+(CAN_EDIT?'<button type="button" class="icon-btn" data-tedit="'+a.id+'" aria-label="Edit '+esc(S.adminName(a))+'" title="Edit member">'+PENCIL+'</button>':'')+'</div></td></tr>';}).join(''):'<tr><td colspan="7" class="muted">No team members match.</td></tr>';
  $('tmInfo').textContent=list.length?'Showing '+(st+1)+'–'+Math.min(st+PER,list.length)+' of '+list.length+' member'+(list.length===1?'':'s'):'0 members';
  $('tmPager').innerHTML=pages>1?'<button type="button" class="btn ghost sm" data-tp="prev" '+(tpg===1?'disabled':'')+'>‹ Previous</button><span class="pg-of">Page '+tpg+' of '+pages+'</span><button type="button" class="btn ghost sm" data-tp="next" '+(tpg===pages?'disabled':'')+'>Next ›</button>':'';
  $('tmPager').querySelectorAll('[data-tp]').forEach(function(b){b.addEventListener('click',function(){tpg+=b.getAttribute('data-tp')==='next'?1:-1;trender();});});
  document.querySelectorAll('[data-tedit]').forEach(function(b){b.addEventListener('click',function(){openM(b.getAttribute('data-tedit'),b);});});}
 $('tmQ').addEventListener('input',function(){tpg=1;trender();});$('tmLevel').addEventListener('change',function(){tpg=1;trender();});
 $('addMemberBtn').hidden=!CAN_ADD;
 /* member form */
 function archInfo(u){var cl=u?data.clients.filter(function(c){return c.assignedAdminId===u.id;}):[];var st=u&&S.manages(data,u.role)?data.admins.filter(function(a){return a.id!==u.id&&a.role!=='archive'&&a.managerId===u.id;}):[];return {cl:cl,st:st};}
 function sync(){var lv=$('mLevel').value;$('mMgrWrap').hidden=!S.reportsTo(data,lv);$('mMgrErr').hidden=true;$('mManager').classList.remove('invalid');
  var show=lv==='archive'&&editU&&editU.role!=='archive';$('mArch').hidden=!show;if(!show)return;var inf=archInfo(editU),nm=S.adminName(editU);
  $('mArchText').textContent=nm+' will be signed out and can no longer sign in. They stay in the Team list and can be restored by changing their level.';
  $('mArchCl').hidden=!inf.cl.length;$('mArchClLbl').textContent='Reassign '+inf.cl.length+' client'+(inf.cl.length===1?'':'s')+' to';
  $('mArchClients').innerHTML='<option value="">Select a team member…</option>'+S.staffList(data).filter(function(a){return a.id!==editU.id;}).map(function(a){return '<option value="'+esc(a.id)+'">'+esc(S.adminName(a))+' ('+esc(LBL[a.role])+')</option>';}).join('');
  $('mArchSt').hidden=!inf.st.length;$('mArchStLbl').textContent='New manager for '+inf.st.map(S.adminName).join(', ');$('mArchMgr').innerHTML=mgrOpts('',editU.id);}
 var mPend;/* undefined = unchanged, '' = remove, dataURL = new photo */
 function mCur(){return mPend===undefined?S.adminPhoto(editU||{}):mPend;}
 function paintM(){var ph=mCur();$('mAv').outerHTML=clientAv({first:$('mFirst').value,last:$('mLast').value,photo:ph},'xl').replace('<span class="c-av','<span id="mAv" class="c-av');
  $('mUpload').textContent=ph?'Replace photo':'Upload photo';$('mRemove').hidden=!ph;
  $('mPhotoNote').textContent=mPend!==undefined?(mPend?'Preview. Save to keep this photo.':'Photo will be removed when you save.'):'JPG, PNG or WebP, up to 2 MB.';}
 $('mUpload').addEventListener('click',function(){$('mFile').click();});
 $('mRemove').addEventListener('click',function(){mPend='';$('mPhotoErr').textContent='';paintM();});
 $('mFile').addEventListener('change',function(){var file=this.files&&this.files[0];this.value='';$('mPhotoErr').textContent='';if(!file)return;readAvatar(file,function(er,u){if(er){$('mPhotoErr').textContent=er;return;}mPend=u;paintM();});});
 ['mFirst','mLast'].forEach(function(i){$(i).addEventListener('input',function(){if(!mCur())paintM();});});
 function openM(id,opener){editU=id?S.adminById(data,id):null;mPend=undefined;$('mPhotoErr').textContent='';$('memForm').reset();$('memMsg').textContent='';$('memTitle').textContent=editU?'Edit '+S.adminName(editU):'Add member';
  $('mFirst').value=editU?editU.first||'':'';$('mLast').value=editU?editU.last||'':'';$('mPhone').value=editU?editU.phone||'':'';$('mEmail').value=editU?editU.email||'':'';
  var self=!!(editU&&editU.id===ME0);levelOpts();$('mLevel').value=editU?editU.role:defLv();$('mLevel').disabled=self;$('mLevelNote').hidden=!self;
  $('mLevel').querySelector('[value="archive"]').disabled=!CAN_ARCH||!editU;
  $('mManager').innerHTML=mgrOpts(editU?editU.managerId:'',editU&&editU.id);sync();paintM();openModal('memModal',opener);}
 $('mLevel').addEventListener('change',sync);
 ['mManager','mArchClients','mArchMgr'].forEach(function(i){$(i).addEventListener('change',function(){$('memMsg').textContent='';$('mMgrErr').hidden=true;$('mManager').classList.remove('invalid');});});
 $('addMemberBtn').addEventListener('click',function(){openM(null,$('addMemberBtn'));});
 function err(t,f){$('memMsg').textContent=t;if(f)$(f).focus();}
 $('memForm').addEventListener('submit',function(e){e.preventDefault();if(editU?!CAN_EDIT:!CAN_ADD)return;
  var f=$('mFirst').value.trim(),l=$('mLast').value.trim(),ph=$('mPhone').value.trim(),em=$('mEmail').value.trim().toLowerCase(),lv=editU&&editU.id===ME0?editU.role:$('mLevel').value;
  if(!f||!l||!em)return err('First name, last name and email are required.',!f?'mFirst':!l?'mLast':'mEmail');
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))return err('Enter a valid email address.','mEmail');
  if(ph&&!/^[\d\s()+.-]{7,}$/.test(ph))return err('Enter a valid contact number.','mPhone');
  if(data.admins.some(function(a){return a!==editU&&String(a.email||'').toLowerCase()===em;}))return err('Another member already has this email.','mEmail');
  if(S.reportsTo(data,lv)&&!$('mManager').value){$('mMgrErr').hidden=false;$('mManager').classList.add('invalid');return err('A manager is required for '+LBL[lv]+' members.','mManager');}
  var was=editU?editU.role:'';
  if(editU&&was==='super'&&lv!=='super'&&admins().length<2)return err('At least one Admin is required.');
  if(editU&&editU.id===ME0&&lv!==was)return err('You can’t change your own level.');
  var inf=archInfo(editU),toArch=lv==='archive'&&was!=='archive',reCl='',reMg='';
  if(toArch){if(!CAN_ARCH)return err('You don’t have permission to archive members.');
   reCl=$('mArchClients').value;reMg=$('mArchMgr').value;
   if(inf.cl.length&&!reCl)return err('Choose who should take over this member’s clients.','mArchClients');
   if(inf.st.length&&!reMg)return err('Choose a new manager for this member’s staff.','mArchMgr');}
  else if(editU&&S.manages(data,was)&&!S.manages(data,lv)&&inf.st.length)return err('Move this manager’s staff to another manager before changing the level.');
  else if(editU&&was!=='super'&&was!=='archive'&&(lv==='super')&&inf.cl.length)return err('Reassign this member’s clients before making them an Admin.');
  var isNew=!editU,u=editU||{id:'adm-'+Date.now()};var before=editU?JSON.stringify([u.first,u.last,u.phone||'',u.email,u.role,u.managerId||'']):'';
  u.first=f;u.last=l;u.phone=ph;u.email=em;u.role=lv;if(S.reportsTo(data,lv))u.managerId=$('mManager').value;else delete u.managerId;if(isNew)data.admins.push(u);
  var pc=mPend;if(pc!==undefined){if(pc)u.photo=pc;else u.photo='';}
  if(toArch){inf.cl.forEach(function(c){c.assignedAdminId=reCl;});inf.st.forEach(function(a){a.managerId=reMg;});
   var det='Archived (was '+LBL[was]+')';if(inf.cl.length)det+='; '+inf.cl.length+' client'+(inf.cl.length===1?'':'s')+' reassigned to '+S.adminName(S.adminById(data,reCl));if(inf.st.length)det+='; '+inf.st.length+' staff moved to '+S.adminName(S.adminById(data,reMg));
   S.log(data,'Status change','Team',S.adminName(u),det);}
  else if(isNew)S.log(data,'Create','Team',S.adminName(u),'Added '+LBL[lv]+' member');
  else if(was==='archive'&&lv!=='archive')S.log(data,'Status change','Team',S.adminName(u),'Restored as '+LBL[lv]);
  else if(before!==JSON.stringify([u.first,u.last,u.phone||'',u.email,u.role,u.managerId||'']))S.log(data,was!==lv?'Permission change':'Edit','Team',S.adminName(u),was!==lv?'Level: '+LBL[was]+' → '+LBL[lv]:'Updated details');
  if(pc!==undefined&&(pc||!isNew))S.log(data,pc?'Upload':'Delete','Team',S.adminName(u),pc?'Profile photo updated':'Profile photo removed');mPend=undefined;
  if(!S.save(data))return err('Couldn’t save. Browser storage is full.');closeModal('memModal');trender();if(u.id===ME0){paintStaffChrome();}$('tmStatus').textContent=(isNew?'Added ':toArch?'Archived ':'Saved ')+S.adminName(u)+'.';});
 /* permission levels */
 var ROWS=[['Dashboard','dashboard',{view:'view'}],['Clients','clients',{view:'view',add:'add',edit:'edit',delete:'delete'}],['All clients','clients',{view:'all'}],['Documents','documents',{view:'view',add:'add',edit:'edit',delete:'delete'}],['Case types','casetypes',{view:'view',add:'add',edit:'edit',delete:'delete'}],['Messages','messages',{view:'view'}],['Activity logs','logs',{view:'view'}],['Team','team',{view:'view',add:'add',edit:'edit',delete:'delete'}]];
 var COLS=['view','add','edit','delete'],CAN_LVL=SUPER,editL=null,delL=null;
 var LOCK='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
 var TRASH='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>';
 function members(id){return data.admins.filter(function(a){return a.role===id;});}
 function validMgr(a,exLv){return S.managers(data).some(function(m){return m.id===a.managerId&&m.id!==a.id&&m.role!==exLv;});}
 function summary(perms){var out=[];ROWS.forEach(function(r){var p=perms[r[1]]||{},cs=COLS.filter(function(c){return r[2][c];}),on=cs.filter(function(c){return p[r[2][c]];});if(!on.length)return;out.push(r[0]+(cs.length>1?(on.length===cs.length?' (full)':' ('+on.map(function(c){return S.ACT_LABEL[c].toLowerCase();}).join(', ')+')'):''));});return out.length?out.join(' · '):'No access';}
 function lrow(id,name,desc,acc,sys,extra){var n=members(id).length;return '<tr'+(sys?' class="sys"':'')+'><td><span class="role-pill '+pillCls(id)+'">'+esc(name)+'</span>'+(sys?' <span class="sys-tag" title="Built-in system level">'+LOCK+' System</span>':'')+(extra?'<span class="muted small tm-rep">'+esc(extra)+'</span>':'')+'</td><td class="muted">'+esc(desc||'—')+'</td><td class="num">'+n+'</td><td class="small lvl-sum">'+esc(acc)+'</td><td><div class="row-acts">'+(sys?'<span class="muted small">Locked</span>':CAN_LVL?'<button type="button" class="icon-btn" data-ledit="'+esc(id)+'" aria-label="Edit '+esc(name)+' level" title="Edit level">'+PENCIL+'</button><button type="button" class="icon-btn danger" data-ldel="'+esc(id)+'" aria-label="Delete '+esc(name)+' level" title="Delete level">'+TRASH+'</button>':'')+'</td></tr>';}
 function grender(){$('addLevelBtn').hidden=!CAN_LVL;
  $('lvlRows').innerHTML=lrow('super','Admin','Owns the business account. Full access to everything.','Full access',true)+S.levels(data).map(function(l){var ex=[l.reports?'Reports to a manager':'',l.manages?'Can manage a team':''].filter(Boolean).join(' · ');return lrow(l.id,l.name,l.desc,summary(l.perms),false,ex);}).join('')+lrow('archive','Archive','Former members. They can’t sign in and are hidden from assignment.','No access',true);
  document.querySelectorAll('[data-ledit]').forEach(function(b){b.addEventListener('click',function(){openL(b.getAttribute('data-ledit'),b);});});
  document.querySelectorAll('[data-ldel]').forEach(function(b){b.addEventListener('click',function(){openDel(b.getAttribute('data-ldel'),b);});});}
 function lgrid(perms){$('lGrid').innerHTML='<thead><tr><th>Area</th>'+COLS.map(function(c){return '<th class="num">'+esc(S.ACT_LABEL[c])+'</th>';}).join('')+'</tr></thead><tbody>'+ROWS.map(function(r){return '<tr><th scope="row">'+esc(r[0])+'</th>'+COLS.map(function(c){var k=r[2][c];if(!k)return '<td class="num muted">—</td>';var on=!!(perms[r[1]]&&perms[r[1]][k]);return '<td class="num"><label class="tgl"><input type="checkbox" data-la="'+r[1]+'" data-lk="'+k+'"'+(on?' checked':'')+' aria-label="'+esc(r[0]+': '+S.ACT_LABEL[c])+'"><span aria-hidden="true"></span></label></td>';}).join('')+'</tr>';}).join('')+'</tbody>';}
 function blank(){var p={};S.AREAS.forEach(function(a){p[a.k]={};a.acts.forEach(function(x){p[a.k][x]=false;});});return p;}
 function openL(id,opener){if(!CAN_LVL)return;editL=id?S.levelById(data,id):null;$('lvlMsg').textContent='';$('lvlTitle').textContent=editL?'Edit '+editL.name+' level':'Add level';
  $('lName').value=editL?editL.name:'';$('lDesc').value=editL?editL.desc||'':'';$('lReports').checked=!!(editL&&editL.reports);$('lManages').checked=!!(editL&&editL.manages);
  lgrid(editL?editL.perms:blank());openModal('lvlModal',opener);}
 $('lGrid').addEventListener('change',function(e){var c=e.target;if(!c.matches||!c.matches('input[data-la]'))return;var a=c.getAttribute('data-la'),k=c.getAttribute('data-lk');
  $('lGrid').querySelectorAll('input[data-la="'+a+'"]').forEach(function(x){var xk=x.getAttribute('data-lk');if(k==='view'&&!c.checked&&xk!=='view')x.checked=false;if(k!=='view'&&c.checked&&xk==='view')x.checked=true;});});
 $('addLevelBtn').addEventListener('click',function(){openL(null,$('addLevelBtn'));});
 ['lName','lReports','lManages'].forEach(function(i){$(i).addEventListener('input',function(){$('lvlMsg').textContent='';});});
 $('lvlForm').addEventListener('submit',function(e){e.preventDefault();if(!CAN_LVL)return;var nm=$('lName').value.trim().replace(/\s+/g,' '),ds=$('lDesc').value.trim(),rp=$('lReports').checked,mg=$('lManages').checked;
  function lerr(t,f){$('lvlMsg').textContent=t;if(f)$(f).focus();}
  if(!nm)return lerr('Level name is required.','lName');
  if(/^(admin|archive|super admin)$/i.test(nm)||S.levels(data).some(function(l){return l!==editL&&l.name.toLowerCase()===nm.toLowerCase();}))return lerr('Another level already has this name.','lName');
  if(rp&&mg)return lerr('Choose either “Reports to a manager” or “Can manage a team”, not both.');
  var perms=blank();$('lGrid').querySelectorAll('input[data-la]').forEach(function(c){perms[c.getAttribute('data-la')][c.getAttribute('data-lk')]=c.checked;});
  var lid=editL?editL.id:null,ms=lid?members(lid):[];
  if(editL&&editL.manages&&!mg&&data.admins.some(function(a){return a.role!=='archive'&&ms.some(function(m){return m.id===a.managerId&&a.id!==m.id;});}))return lerr('Members on this level manage a team. Move their team to another manager before turning off “Can manage a team”.');
  var avail=S.managers(data).filter(function(m){return m.role!==lid;});
  if(rp&&ms.length&&!avail.length)return lerr('There’s no manager to assign this level’s members to. Turn on “Can manage a team” for another level first.');
  var ch=[];if(editL){if(editL.name!==nm)ch.push('renamed from '+editL.name);if((editL.desc||'')!==ds)ch.push('description updated');if(!!editL.reports!==rp)ch.push('Reports to a manager '+(rp?'on':'off'));if(!!editL.manages!==mg)ch.push('Can manage a team '+(mg?'on':'off'));
   ROWS.forEach(function(r){COLS.forEach(function(c){var k=r[2][c];if(!k)return;var a=!!(editL.perms[r[1]]&&editL.perms[r[1]][k]),b=perms[r[1]][k];if(a!==b)ch.push(r[0]+': '+S.ACT_LABEL[c]+' '+(b?'on':'off'));});});}
  var L=editL||{id:'lvl-'+Date.now().toString(36)};L.name=nm;L.desc=ds;L.reports=rp;L.manages=mg;L.perms=perms;
  if(!editL)data.levels.push(L);
  ms.forEach(function(a){if(rp){if(!validMgr(a,L.id))a.managerId=avail[0].id;}else delete a.managerId;});
  if(!editL)S.log(data,'Create','Team',nm+' level','Added level: '+summary(perms));else if(ch.length)S.log(data,'Permission change','Team',nm+' level',ch.join('; '));
  S.save(data);closeModal('lvlModal');grender();filterOpts();trender();$('lvStatus').textContent=(editL?'Saved ':'Added ')+nm+' level.';});
 function openDel(id,opener){if(!CAN_LVL)return;delL=S.levelById(data,id);if(!delL)return;var ms=members(id);$('lvlDelMsg').textContent='';
  $('lvlDelTitle').textContent='Delete '+delL.name+' level?';
  $('lvlDelText').textContent=ms.length?ms.length+' member'+(ms.length===1?' is':'s are')+' on this level ('+ms.map(S.adminName).join(', ')+'). Choose a level to move them to. This can’t be undone.':'No one is on this level. This can’t be undone.';
  $('lvlDelMove').hidden=!ms.length;$('lvlDelTo').innerHTML='<option value="">Select a level…</option>'+S.levels(data).filter(function(l){return l.id!==id;}).map(function(l){return o(l.id,l.name);}).join('')+o('archive','Archive');
  $('lvlDelMgrWrap').hidden=true;openModal('lvlDelModal',opener);}
 function delSync(){var to=$('lvlDelTo').value,ms=members(delL.id);$('lvlDelMsg').textContent='';var need=S.reportsTo(data,to)&&ms.some(function(a){return !validMgr(a,delL.id);});$('lvlDelMgrWrap').hidden=!need;
  if(need)$('lvlDelMgr').innerHTML='<option value="">Select a manager…</option>'+S.managers(data).filter(function(m){return m.role!==delL.id;}).map(function(m){return o(m.id,S.adminName(m));}).join('');}
 $('lvlDelTo').addEventListener('change',delSync);$('lvlDelMgr').addEventListener('change',function(){$('lvlDelMsg').textContent='';});
 $('lvlDelGo').addEventListener('click',function(){if(!CAN_LVL||!delL)return;var ms=members(delL.id),to=$('lvlDelTo').value;function derr(t,f){$('lvlDelMsg').textContent=t;if(f)$(f).focus();}
  if(ms.length&&!to)return derr('Choose a level to move this level’s members to.','lvlDelTo');
  var team=delL.manages?data.admins.filter(function(a){return a.role!=='archive'&&a.role!==delL.id&&ms.some(function(m){return m.id===a.managerId;});}):[];
  if(team.length&&!S.manages(data,to))return derr('Members on this level manage '+team.map(S.adminName).join(', ')+'. Move them to a level that can manage a team, or move their team to another manager first.','lvlDelTo');
  if(to==='archive'&&ms.some(function(a){return data.clients.some(function(c){return c.assignedAdminId===a.id;});}))return derr('Some of these members still have clients. Reassign their clients on the Members tab before archiving them.','lvlDelTo');
  var mgr='';if(!$('lvlDelMgrWrap').hidden){mgr=$('lvlDelMgr').value;if(!mgr)return derr('Choose a manager for the moved members.','lvlDelMgr');}
  var nm=delL.name,did=delL.id;ms.forEach(function(a){if(S.reportsTo(data,to)){if(!validMgr(a,did))a.managerId=mgr;}else if(to!=='archive')delete a.managerId;a.role=to;});
  data.levels=data.levels.filter(function(l){return l.id!==did;});
  S.log(data,'Delete','Team',nm+' level',ms.length?'Deleted level; '+ms.length+' member'+(ms.length===1?'':'s')+' moved to '+S.roleLabel(data,to):'Deleted level');
  S.save(data);closeModal('lvlDelModal');delL=null;grender();filterOpts();trender();$('lvStatus').textContent='Deleted '+nm+' level.';});
 trender();grender();if(location.hash==='#permissions')tab('perms');
}
})();
