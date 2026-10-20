/* ISConnect concept site — interactions. No tracking, no cookies, nothing is sent anywhere. */
(function(){
"use strict";
var d=document,root=d.documentElement,RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var fine=window.matchMedia&&matchMedia('(hover: hover) and (pointer: fine)').matches;
function $(s,c){return (c||d).querySelector(s);}function $$(s,c){return [].slice.call((c||d).querySelectorAll(s));}
/* ---- header: solid after scroll, hide on fast scroll down, progress bar ---- */
var hdr=$('.hdr'),bar=$('.progress'),toTop=$('.to-top'),lastY=0,ticking=false;
function onScroll(){var y=window.scrollY||0,h=root.scrollHeight-window.innerHeight;
 if(hdr){hdr.classList.toggle('is-solid',y>24);var open=hdr.querySelector('.dd[data-open]');if(!open){if(y>lastY+6&&y>420)hdr.classList.add('is-hidden');else if(y<lastY-6||y<420)hdr.classList.remove('is-hidden');}}
 if(bar)bar.style.transform='scaleX('+(h>0?Math.min(1,y/h):0)+')';
 if(toTop)toTop.classList.toggle('show',y>900);
 lastY=y;ticking=false;}
window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});onScroll();
if(toTop)toTop.addEventListener('click',function(){window.scrollTo({top:0,behavior:RM?'auto':'smooth'});var s=$('.skip');var m=$('#main');if(m){m.setAttribute('tabindex','-1');m.focus({preventScroll:true});}});
hdr&&hdr.addEventListener('focusin',function(){hdr.classList.remove('is-hidden');});
/* ---- desktop dropdown ---- */
$$('.dd').forEach(function(dd){var btn=$('.dd-btn',dd),panel=$('.dd-panel',dd),t=null;
 function open(){clearTimeout(t);dd.setAttribute('data-open','');btn.setAttribute('aria-expanded','true');}
 function close(){dd.removeAttribute('data-open');btn.setAttribute('aria-expanded','false');}
 btn.addEventListener('click',function(){dd.hasAttribute('data-open')?close():open();});
 if(fine){dd.addEventListener('mouseenter',open);dd.addEventListener('mouseleave',function(){t=setTimeout(close,180);});}
 dd.addEventListener('keydown',function(e){if(e.key==='Escape'&&dd.hasAttribute('data-open')){e.preventDefault();close();btn.focus();}
  if(e.key==='ArrowDown'&&e.target===btn){e.preventDefault();open();var f=$('a',panel);f&&f.focus();}});
 dd.addEventListener('focusout',function(e){if(!dd.contains(e.relatedTarget))close();});
 d.addEventListener('click',function(e){if(!dd.contains(e.target))close();});});
/* ---- mobile drawer ---- */
var drawer=$('#drawer'),burger=$('.burger');
if(drawer&&burger){var closeB=$('.drawer-close',drawer);
 function dOpen(){drawer.hidden=false;requestAnimationFrame(function(){drawer.classList.add('open');});burger.setAttribute('aria-expanded','true');root.classList.add('lock');setTimeout(function(){closeB.focus();},60);}
 function dClose(){drawer.classList.remove('open');burger.setAttribute('aria-expanded','false');root.classList.remove('lock');setTimeout(function(){if(!drawer.classList.contains('open'))drawer.hidden=true;},RM?0:700);burger.focus();}
 burger.addEventListener('click',dOpen);closeB.addEventListener('click',dClose);
 drawer.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();dClose();}
  if(e.key==='Tab'){var f=$$('a,button',drawer).filter(function(x){return x.offsetParent!==null;});var a=f[0],z=f[f.length-1];if(e.shiftKey&&d.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&d.activeElement===z){e.preventDefault();a.focus();}}});
 $$('a',drawer).forEach(function(a){a.addEventListener('click',function(){if(a.getAttribute('href').charAt(0)==='#')dClose();});});
 $$('.acc-btn',drawer).forEach(function(b){var p=d.getElementById(b.getAttribute('aria-controls'));b.addEventListener('click',function(){var o=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!o));p.hidden=o;});});
 window.addEventListener('resize',function(){if(window.innerWidth>=1080&&drawer.classList.contains('open'))dClose();});}
/* ---- reveal on scroll ---- */
var revealEls=$$('[data-reveal],.img-reveal,.tl li');
if('IntersectionObserver' in window&&!RM){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var par=e.target.parentElement,grp=par&&par.hasAttribute('data-stagger')&&par.scrollWidth>par.clientWidth+4?$$(':scope > *',par):[e.target];grp.forEach(function(x){x.classList.add('in');io.unobserve(x);});}});},{rootMargin:'0px 0px -8% 0px',threshold:.08});
 $$('[data-stagger]').forEach(function(g){$$(':scope > *',g).forEach(function(c,i){if(!c.hasAttribute('data-reveal'))c.setAttribute('data-reveal','');c.style.setProperty('--d',(Math.min(i,8)*0.08)+'s');});});
 revealEls=$$('[data-reveal],.img-reveal,.tl li');revealEls.forEach(function(el){io.observe(el);});}
else{revealEls.forEach(function(el){el.classList.add('in');});}
/* ---- timeline fill follows scroll ---- */
$$('.tl').forEach(function(tl){var fill=$('.tl-fill',tl);if(!fill)return;function upd(){var r=tl.getBoundingClientRect(),vh=window.innerHeight;var p=(vh*0.7-r.top)/r.height;fill.style.setProperty('--p',Math.max(0,Math.min(1,p)).toFixed(3));}
 if(RM){fill.style.setProperty('--p','1');return;}window.addEventListener('scroll',function(){requestAnimationFrame(upd);},{passive:true});upd();});
/* ---- counters (HTML holds the final value; animate from 0 when visible) ---- */
$$('[data-count]').forEach(function(el){var to=+el.getAttribute('data-count'),suf=el.getAttribute('data-suffix')||'';if(RM||!('IntersectionObserver' in window))return;
 var ob=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;ob.disconnect();var t0=null,dur=1800;el.textContent='0'+suf;
  function step(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,4);el.textContent=Math.round(to*e).toLocaleString('en-CA')+suf;if(k<1)requestAnimationFrame(step);}requestAnimationFrame(step);},{threshold:.6});ob.observe(el);});
/* ---- videos: lazy, muted, never under reduced motion or Save-Data ---- */
var saveData=navigator.connection&&navigator.connection.saveData;
function loadVideo(v){if(v.dataset.loaded)return;v.dataset.loaded='1';$$('source[data-src]',v).forEach(function(s){s.src=s.getAttribute('data-src');});v.load();
 v.addEventListener('playing',function(){v.classList.add('is-playing');},{once:true});var p=v.play();if(p&&p.catch)p.catch(function(){});}
if(!RM&&!saveData){$$('video[data-lazy]').forEach(function(v){
 if('IntersectionObserver' in window){var vo=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){if(!v.dataset.loaded){var go=function(){loadVideo(v);};if(v.hasAttribute('data-hero')){if(d.readyState==='complete')setTimeout(go,150);else window.addEventListener('load',function(){setTimeout(go,150);},{once:true});}else go();}else{var p=v.play();if(p&&p.catch)p.catch(function(){});}}else if(v.dataset.loaded){v.pause();}});},{rootMargin:'200px 0px'});vo.observe(v);}
 else loadVideo(v);});}
/* ---- testimonials carousel ---- */
$$('[data-carousel]').forEach(function(c){var slides=$$('.quote',c),dots=$('.tst-dots',c),cnt=$('.tst-count b',c),i=0,n=slides.length,timer=null,paused=false;
 function go(k){i=(k+n)%n;slides.forEach(function(s,j){var on=j===i;s.classList.toggle('on',on);s.setAttribute('aria-hidden',on?'false':'true');});
  if(dots)$$('button',dots).forEach(function(b,j){if(j===i)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});if(cnt)cnt.textContent=String(i+1).padStart(2,'0');}
 $('[data-prev]',c).addEventListener('click',function(){go(i-1);});$('[data-next]',c).addEventListener('click',function(){go(i+1);});
 if(dots)dots.addEventListener('click',function(e){var b=e.target.closest('button');if(b)go(+b.getAttribute('data-i'));});
 c.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){go(i-1);}else if(e.key==='ArrowRight'){go(i+1);}});
 var x0=null;c.addEventListener('touchstart',function(e){x0=e.touches[0].clientX;},{passive:true});c.addEventListener('touchend',function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>45)go(dx<0?i+1:i-1);});
 c.addEventListener('mouseenter',function(){paused=true;});c.addEventListener('mouseleave',function(){paused=false;});c.addEventListener('focusin',function(){paused=true;});c.addEventListener('focusout',function(e){if(!c.contains(e.relatedTarget))paused=false;});
 if(!RM)timer=setInterval(function(){if(!paused&&!d.hidden)go(i+1);},8000);go(0);});
/* ---- pointer spotlight + magnetic buttons (fine pointers only) ---- */
if(fine&&!RM){$$('.svc').forEach(function(el){el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();el.style.setProperty('--mx',(e.clientX-r.left)+'px');el.style.setProperty('--my',(e.clientY-r.top)+'px');});});
 $$('[data-magnetic]').forEach(function(b){b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();var x=(e.clientX-r.left-r.width/2)/r.width,y=(e.clientY-r.top-r.height/2)/r.height;b.style.transform='translate('+(x*8).toFixed(1)+'px,'+(y*8).toFixed(1)+'px)';});b.addEventListener('pointerleave',function(){b.style.transform='';});});
 $$('[data-parallax]').forEach(function(el){var s=+el.getAttribute('data-parallax')||.08;function u(){var r=el.parentNode.getBoundingClientRect();el.style.transform='translate3d(0,'+((r.top+r.height/2-window.innerHeight/2)*-s).toFixed(1)+'px,0)';}window.addEventListener('scroll',function(){requestAnimationFrame(u);},{passive:true});u();});}
/* ---- schools filter + search ---- */
var sg=$('#schoolGrid');if(sg){var chips=$$('.chip'),q=$('#schoolSearch'),cards=$$('.school',sg),out=$('#schoolCount'),none=$('#schoolNone'),cur='all';
 function apply(){var t=(q.value||'').trim().toLowerCase(),n=0;cards.forEach(function(c){var ok=(cur==='all'||(' '+c.getAttribute('data-c')+' ').indexOf(' '+cur+' ')>-1)&&(!t||c.textContent.toLowerCase().indexOf(t)>-1);c.hidden=!ok;if(ok)n++;});
  out.textContent='Showing '+n+' of '+cards.length;none.hidden=n>0;}
 chips.forEach(function(ch){ch.addEventListener('click',function(){cur=ch.getAttribute('data-f');chips.forEach(function(x){x.setAttribute('aria-pressed',String(x===ch));});apply();});});
 q.addEventListener('input',apply);apply();}
/* ---- forms: validate in the browser; nothing is sent ---- */
$$('form[data-form]').forEach(function(f){var st=$('.form-status',f);
 function setErr(inp,msg){var fl=inp.closest('.field'),e=fl&&$('.err',fl);if(fl)fl.classList.toggle('bad',!!msg);if(e)e.textContent=msg||'';inp.setAttribute('aria-invalid',msg?'true':'false');}
 function check(inp){var v=(inp.value||'').trim(),lab=inp.getAttribute('data-label')||'This field';
  if(inp.required&&!v)return setErr(inp,'Please enter your '+lab.toLowerCase()+'.'),false;
  if(inp.type==='email'&&v&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))return setErr(inp,'Please enter a valid email address.'),false;
  if(inp.type==='tel'&&v&&v.replace(/\D/g,'').length<7)return setErr(inp,'Please enter a valid mobile number.'),false;
  if(inp.tagName==='SELECT'&&inp.required&&!v)return setErr(inp,'Please choose a study destination.'),false;
  setErr(inp,'');return true;}
 $$('input,select',f).forEach(function(inp){inp.addEventListener('blur',function(){if(inp.value)check(inp);});inp.addEventListener('input',function(){if(inp.getAttribute('aria-invalid')==='true')check(inp);});});
 f.addEventListener('submit',function(e){e.preventDefault();var bad=null;$$('input,select',f).forEach(function(inp){if(!check(inp)&&!bad)bad=inp;});
  if(bad){bad.focus();st.className='form-status';st.textContent='';return;}
  st.className='form-status ok';st.textContent=st.getAttribute('data-ok');f.reset();st.setAttribute('tabindex','-1');st.focus();});});
/* ---- year-free: nothing else ---- */
})();
