/* ISConnect portal data store — client-side only, no backend. Key: isc_demo_v1 (localStorage).
   Stores text, file NAMES (never file contents, except owner-attached requirement samples as data URLs, max 1.5 MB each),
   checklist/task state and support-chat threads. Case types ("visas") are the source of truth: an application's checklist is
   derived from its case type's required documents.
   Multi-admin: data.admins = [{id,first,last,email}]; every admin sees every client; each client has assignedAdminId.
   Same mechanics as the earlier portal build (docsV/namesV/filesV/samplesV/threadsV/reviewV), seeded fresh — there is no older version to migrate. */
(function(){
"use strict";
var KEY='isc_demo_v1', OLDKEY='isc_demo_v0';
var STATUSES=['New','Active','Submitted','Review','Approved','Denied','Cancelled'];
var CLIENT_ID='c0';
function alias(t){return t;}
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
var ADMINS=[{id:'adm-1',first:'Daniela',last:'Reyes',email:'daniela.reyes@example.com'},{id:'adm-2',first:'Marco',last:'Villanueva',email:'marco.villanueva@example.com'},{id:'adm-3',first:'Hannah',last:'Cruz',email:'hannah.cruz@example.com'}];
/* Requirement library — wording follows the documents named on isconnect.ca (Services and country pages); passport/forms/supporting documents are generic. */
function docsSeed(){function d(id,name,code,ver,st,c,u,n){return {id:id,name:name,code:code,version:ver,status:st,createdAt:c,updatedAt:u,uploaded:n};}
 return [d('d1','Passport and identity documents','PASSPORT','v1.0','Active','2026-09-01','2026-09-01',14),
 d('d2','Academic records','ACADEMIC','v1.1','Active','2026-09-01','2026-09-18',12),
 d('d3','Recommendation letters','RECOMMEND','v1.0','Active','2026-09-02','2026-09-02',5),
 d('d4','English proficiency results','ENGLISH','v1.0','Active','2026-09-02','2026-09-02',9),
 d('d5','Proof of funds','FUNDS','v1.2','Active','2026-09-03','2026-10-02',11),
 d('d6','Letter of Acceptance or Offer','LOA','v1.0','Active','2026-09-03','2026-09-03',8),
 d('d7','Statement of Purpose / study plan','SOP','v1.0','Active','2026-09-04','2026-09-20',7),
 d('d8','Travel history','TRAVEL','v1.0','Active','2026-09-05','2026-09-05',3),
 d('d9','Confirmation of Acceptance for Studies (CAS)','CAS','v1.0','Active','2026-09-06','2026-09-06',2),
 d('d10','Proof of medical insurance','INSURANCE','v1.0','Active','2026-09-08','2026-09-08',4),
 d('d11','Signed application forms','FORMS','v1.0','Active','2026-09-09','2026-09-22',6),
 d('d12','Supporting documents','SUPPORT','v0.9','Draft','2026-09-10','2026-10-05',3)];}
/* Case types — named after the services on isconnect.ca. */
function visasSeed(){function v(id,code,name,notes,docIds){return {id:id,code:code,name:name,effective:'2026-01-01',notes:notes,docIds:docIds,createdAt:'2026-09-01',updatedAt:'2026-10-01'};}
 return [v('v-consult','CONS','Free One-on-One Consultation','Initial assessment of goals, budget and academic background.',['d1','d2']),
 v('v-admission','ADM','University Admissions Support','School and program applications.',['d1','d2','d3','d4','d7']),
 v('v-ca-sv','CASV','Canada Student Visa','Handled by our licensed RCIC.',['d1','d6','d5','d2','d4','d7']),
 v('v-ca-pgwp','PGWP','Post-Graduation Work Permit (PGWP)','Core document checklist for this case type.',['d1','d2','d11']),
 v('v-ca-dep','DSV','Dependent & Spouse Visa','Core document checklist for this case type.',['d1','d5','d12','d11']),
 v('v-ca-wp','WP','Work Permit Application','Core document checklist for this case type.',['d1','d12','d11']),
 v('v-ca-pr','PR','Permanent Residency & Citizenship Support','Core document checklist for this case type.',['d1','d4','d12','d11']),
 v('v-uk-sv','UKSV','UK Student Visa (Tier 4)','Core document checklist for this case type.',['d1','d9','d5','d2','d4']),
 v('v-uk-gr','GRV','Graduate Route Visa','Core document checklist for this case type.',['d1','d12']),
 v('v-schengen','SCH','Schengen Visa Processing','Core document checklist for this case type.',['d1','d8','d5']),
 v('v-ie-sv','IESV','Ireland Student Visa (Stamp 2)','Core document checklist for this case type.',['d1','d6','d5','d10']),
 v('v-de-sv','DESV','Germany Student Visa (D Visa)','Core document checklist for this case type.',['d1','d6','d5','d10','d2']),
 v('v-es-sv','ESSV','Spain Student Visa (Long-Term Study Visa)','Core document checklist for this case type.',['d1','d6','d5','d10']),
 v('v-nz-sv','NZSV','New Zealand Student Visa','Core document checklist for this case type.',['d1','d6','d5']),
 v('v-uae-sv','UAESV','UAE Student Visa','Core document checklist for this case type.',['d1','d6','d5']),
 v('v-sg-sp','SGSP','Singapore Student Pass','Core document checklist for this case type.',['d1','d6','d5'])];}
var TYPES=visasSeed().map(function(v){return v.name;});
var NAMES=[['Andrea','Santos'],['Miguel','Bautista'],['Bea','Navarro'],['Joshua','Lim'],['Patricia','Mendoza'],['Carlo','Ramos'],['Nicole','Tan'],['Rafael','Aquino'],['Sofia','Castillo'],['Paolo','Fernandez'],['Kimberly','Ocampo'],['Angelo','Torres'],['Janelle','Sy'],['Gabriel','Domingo'],['Trisha','Pascual'],['Kevin','Ong'],['Erika','Salazar'],['Daniel','Morales'],['Camille','Valdez'],['Jerome','Santiago'],['Alyssa','Gomez'],['Mark','Rivera'],['Hazel','Manalo'],['Ivan','Herrera'],['Lea','Gutierrez']];
function emailPart(t){return String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');}
function seed(){
 var clients=NAMES.map(function(n,i){return {id:'c'+i,code:'C'+String(i+1).padStart(3,'0'),first:n[0],middle:'',last:n[1],email:emailPart(n[0])+'.'+emailPart(n[1])+'@example.com',phone:'(403) 555-01'+String(i).padStart(2,'0'),address:'',language:'',dob:'',assignedAdminId:ADMINS[i%3].id,createdAt:'2026-0'+((i%8)+1)+'-'+String((i%26)+2).padStart(2,'0'),updatedAt:'2026-09-01'};});
 var apps=[{id:'a1',clientId:'c0',type:'Canada Student Visa',visaId:'v-ca-sv',effectiveDate:'2026-01-01',status:'Active',date:'2026-09-15',due:'2026-11-15',createdAt:'2026-09-15',updatedAt:'2026-09-15'},
  {id:'a2',clientId:'c0',type:'University Admissions Support',visaId:'v-admission',effectiveDate:'2026-01-01',status:'Submitted',date:'2026-08-20',due:'2026-12-01',createdAt:'2026-08-20',updatedAt:'2026-08-20'}];
 var types=['v-ca-sv','v-admission','v-uk-sv','v-ie-sv','v-ca-pgwp','v-de-sv','v-consult','v-es-sv','v-nz-sv','v-ca-dep','v-uae-sv','v-sg-sp','v-ca-pr','v-schengen','v-ca-wp','v-uk-gr'];
 var stats=['New','Active','Submitted','Approved','Active','Submitted','Denied','Active','Cancelled','Approved'];
 var vs=visasSeed();function vname(id){return vs.filter(function(v){return v.id===id;})[0].name;}
 for(var j=1;j<=24;j++){var dt='2026-0'+((j%9)+1)+'-'+String((j%27)+1).padStart(2,'0');var vid=types[j%types.length];
  apps.push({id:'a-s'+j,clientId:'c'+j,type:vname(vid),visaId:vid,effectiveDate:'2026-01-01',status:stats[j%stats.length],date:dt,due:(j%4===0?'2026-09-':'2026-12-')+String((j%27)+1).padStart(2,'0'),createdAt:dt,updatedAt:dt,progress:[20,45,60,80,35,90,100,55][j%8]});}
 return {version:1,admins:ADMINS.slice(),clients:clients,applications:apps,checklists:{},
  tasks:tasksSeed(),announcements:announcementsSeed(),documents:docsSeed(),visas:vs,copyV:1,emailsV:1};}
function load(){try{var raw=localStorage.getItem(KEY);if(raw){var d=JSON.parse(raw);if(d&&d.version===1){var ch=false;if(migrateDocs(d))ch=true;if(migrateMetrics(d))ch=true;if(migrateSamples(d))ch=true;if(migrateNames(d))ch=true;if(migrateAll(d))ch=true;if(migrateAdmins(d))ch=true;if(ch)save(d);return d;}}}catch(e){}
 var s=seed();migrateDocs(s);migrateMetrics(s);migrateSamples(s);migrateNames(s);migrateAll(s);migrateAdmins(s);save(s);return s;}
function save(d){try{mergeThreads(d);localStorage.setItem(KEY,JSON.stringify(d));return true;}catch(e){if(window.console)console.warn('ISConnect: could not save (storage full?)');return false;}}
function reset(){localStorage.removeItem(KEY);return load();}
/* adminsV:1 — guarantees data.admins and a valid assignedAdminId on every client (new clients default to the admin who adds them). */
function migrateAdmins(d){var ch=false;if(!Array.isArray(d.admins)||!d.admins.length){d.admins=ADMINS.slice();ch=true;}
 (d.clients||[]).forEach(function(c,i){if(!c.assignedAdminId||!d.admins.some(function(a){return a.id===c.assignedAdminId;})){c.assignedAdminId=d.admins[i%d.admins.length].id;ch=true;}});return ch;}
function adminById(d,id){return (d.admins||[]).filter(function(a){return a.id===id;})[0]||null;}
function adminName(a){return a?[a.first,a.last].filter(Boolean).join(' '):'Unassigned';}
function currentAdminId(){try{return sessionStorage.getItem('isc_demo_admin')||'';}catch(e){return '';}}
function visaFor(data,app){if(app.visaId){var byId=(data.visas||[]).find(function(v){return v.id===app.visaId;});if(byId)return byId;}return (data.visas||[]).find(function(v){return v.name===app.type;});}
function distinctTypes(data){var seen={},out=[];(data.visas||[]).forEach(function(v){if(!seen[v.name]){seen[v.name]=1;out.push(v.name);}});return out;}
function visasOfType(data,type){return (data.visas||[]).map(function(v,i){return {v:v,i:i};}).filter(function(x){return x.v.name===type;}).sort(function(a,b){var ta=Date.parse(a.v.effective),tb=Date.parse(b.v.effective);var va=!isNaN(ta),vb=!isNaN(tb);if(va&&vb)return (tb-ta)||(a.i-b.i);if(va)return -1;if(vb)return 1;return a.i-b.i;}).map(function(x){return x.v;});}
function effectiveDateOf(data,app){if(app.effectiveDate&&!isNaN(Date.parse(app.effectiveDate)))return app.effectiveDate;var v=visaFor(data,app);if(v&&v.effective&&!isNaN(Date.parse(v.effective)))return v.effective;return '';}
/* Legacy migration: apps without visaId get the first visa record matching their type + its effective date.
   The legacy `due` field is KEPT only as an internal field on seeded demo apps for the owner overdue demo; new apps never get one. */
function migrateApps(data){var changed=false;(data.applications||[]).forEach(function(a){if(!a.visaId){var v=(data.visas||[]).find(function(x){return x.name===a.type;});if(v){a.visaId=v.id;if(!a.effectiveDate&&v.effective)a.effectiveDate=v.effective;changed=true;}}});return changed;}
function docById(data,id){return (data.documents||[]).find(function(d){return d.id===id;});}
/* Sync an application's checklist to its visa's required docs, preserving Done/filename by docId. Mutates data.checklists. */
function ensureChecklist(data,app){
 var visa=visaFor(data,app); var stored={}; (data.checklists[app.id]||[]).forEach(function(r){stored[r.docId]=r;});
 var ids=visa?visa.docIds:[];
 var out=ids.map(function(id){var doc=docById(data,id);var prev=stored[id]||{};var r={docId:id,label:doc?doc.name:('Document '+id),done:!!prev.done};if(Array.isArray(prev.files)){r.files=prev.files;r.seq=prev.seq||prev.files.length;r.done=prev.files.length>0;}else if(data.filesV>=1){r.files=[];r.seq=0;r.done=false;}else if(prev.filename)r.filename=prev.filename;if(prev.status)r.status=prev.status;if(prev.submittedAt)r.submittedAt=prev.submittedAt;return r;});
 data.checklists[app.id]=out; return out;}
/* Document submissions (v2, docsV:1). Each checklist row may carry status ('received'|'pending review'|'approved')
   and submittedAt (YYYY-MM-DD). Rows that are not done are 'missing'. Safe, one-time migration:
   - rows already Done keep their filename; missing status/date get defaults ('received', the app's updated/created date)
   - an application with NO submitted rows gets a few sample submissions (filenames only) — rows a user has touched are never changed */
var DOC_STATUSES=['received','pending review','approved'];var FILE_STATUSES=['received','pending review','approved','rejected'];
function slug(t){return String(t||'document').toLowerCase().replace(/\(sample\)/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function addDays(d,n){var t=Date.parse(d);if(isNaN(t))return today();return new Date(t+n*864e5).toISOString().slice(0,10);}
function docStatus(r){return r&&r.done?(r.status||'received'):'missing';}
function migrateDocs(data){if(data.docsV>=1)return false;data.checklists=data.checklists||{};
 (data.applications||[]).forEach(function(a,ai){var cl=ensureChecklist(data,a);var base=a.createdAt||a.date||'2026-09-01';
  var any=cl.some(function(r){return r.done||r.filename;});
  if(any){cl.forEach(function(r){if(r.done){if(!r.status)r.status='received';if(!r.submittedAt)r.submittedAt=a.updatedAt||base;}});return;}
  if(a.status==='New'||!cl.length)return; // brand-new applications start with nothing submitted
  var n=Math.max(1,cl.length-1-(ai%2)); // leave 1–2 required docs missing
  cl.slice(0,n).forEach(function(r,i){r.done=true;r.filename=slug(r.label)+'.pdf';r.status=DOC_STATUSES[(ai+i)%3];r.submittedAt=addDays(base,3+i*4);});});
 data.docsV=1;return true;}
/* Monthly metrics (docs: README). data.metrics = {v:1, revenue:{'YYYY-MM':dollars}, clients:{'YYYY-MM':month-end client total}}.
   No history exists in the sample data, so values are seeded ONCE from a fixed seed and stored; later months are filled
   deterministically from the month key. The CURRENT month's client total is always live (data.clients.length). Never overwrites stored months. */
function monthKeys(n,end){var d=end?new Date(end+'-01T12:00:00'):new Date();var out=[];for(var i=n-1;i>=0;i--){var x=new Date(d.getFullYear(),d.getMonth()-i,1);out.push(x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0'));}return out;}
function hash(str){var h=2166136261;for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function seededRevenue(k){var r=hash('isc-rev-'+k)%1000/1000;var m=+k.slice(5);var season=[0.82,0.86,1.0,1.08,1.12,1.04,0.96,0.9,1.15,1.2,1.06,0.88][m-1];return Math.round((7800+r*4200)*season/50)*50;}
function migrateMetrics(data){var ch=false;var M=data.metrics;if(!M||M.v!==1){M=data.metrics={v:1,revenue:{},clients:{}};ch=true;}
 var keys=monthKeys(12),n=(data.clients||[]).length;
 keys.forEach(function(k,i){if(M.revenue[k]==null){M.revenue[k]=seededRevenue(k);ch=true;}
  if(i<keys.length-1&&M.clients[k]==null){var prev=null;for(var j=i-1;j>=0;j--){if(M.clients[keys[j]]!=null){prev=M.clients[keys[j]];break;}}
   var base=prev==null?Math.max(1,Math.round(n*0.55)):prev;var step=hash('isc-cli-'+k)%3;M.clients[k]=Math.min(n,base+step);ch=true;}});
 /* status history (added later): data.metrics.status{'YYYY-MM':{status:n}} for past months, seeded once; current month is live */
 if(!M.status){M.status={};ch=true;}
 var sts=STATUSES.slice();(data.applications||[]).forEach(function(a){if(a.status&&sts.indexOf(a.status)<0)sts.push(a.status);});
 var w={New:.14,Submitted:.2,Active:.3,Approved:.2,Denied:.08,Cancelled:.08};
 keys.forEach(function(k,i){if(i===keys.length-1||M.status[k])return;var tot=Math.max(4,Math.round((M.clients[k]||n)*1.05));var o={};
  sts.forEach(function(st){var j=(hash('isc-st-'+k+'-'+st)%100)/100;o[st]=Math.max(0,Math.round(tot*(w[st]||.05)*(0.6+0.8*j)));});M.status[k]=o;ch=true;});
 return ch;}
/* Requirement samples (samplesV:1). doc.sample = {name,type,size,dataUrl,addedAt} or absent. Files are stored as data URLs in isc_demo_v1
   (owner-attached, max SAMPLE_MAX bytes each). Migration: a legacy filename-only doc.sampleFileName becomes a metadata-only sample
   (no dataUrl); seeds from sample-seeds.js are added once to d1/d2/d8 if those docs exist and have no sample. */
var SAMPLE_MAX=1.5*1024*1024;
function migrateSamples(data){if(data.samplesV>=1)return false;var seeds=window.ISC_SAMPLE_SEEDS||{};
 (data.documents||[]).forEach(function(d){if(!d.sample&&d.sampleFileName){d.sample={name:d.sampleFileName,type:'',size:0,dataUrl:'',addedAt:d.updatedAt||today()};}
  if(!d.sample&&seeds[d.id]){var x=seeds[d.id];d.sample={name:x.name,type:x.type,size:x.size,dataUrl:x.dataUrl,addedAt:'2026-10-01'};}
  if('sampleFileName' in d)delete d.sampleFileName;});
 data.samplesV=1;return true;}

/* Standard file names (namesV:1). Uploaded files are renamed ISC-{clientCode}-{caseCode}-{docCode}-{YYYYMMDD}.{ext}; multiple files per requirement get -01, -02 … */
var VISA_CODES={};var DOC_CODES={};
function codeFrom(t,max){var w=String(t||'').replace(/\(sample\)/ig,'').toUpperCase().replace(/[^A-Z0-9 ]+/g,' ').trim().split(/\s+/)[0]||'DOC';return w.slice(0,max||12);}
function clientCode(c){if(!c)return 'C000';if(c.code)return c.code;var m=/^c(\d+)$/.exec(c.id||'');return m?'C'+String(Number(m[1])+1).padStart(3,'0'):codeFrom(c.id,8);}
function visaCode(v){return v?(v.code||VISA_CODES[v.id]||codeFrom(v.name,4)):'GEN';}
function docCode(d){return d?(d.code||DOC_CODES[d.id]||codeFrom(d.name,12)):'DOC';}
function stdName(data,app,docId,ext,date){var c=(data.clients||[]).find(function(x){return x.id===app.clientId;});
 var e=String(ext||'pdf').replace(/^\./,'').toLowerCase().replace(/[^a-z0-9]/g,'')||'pdf';
 return ['ISC',clientCode(c),visaCode(visaFor(data,app)),docCode(docById(data,docId)),String(date||today()).replace(/-/g,'')].join('-').toUpperCase()+'.'+e;}
function extOf(n){var m=/\.([A-Za-z0-9]{1,8})$/.exec(n||'');return m?m[1].toLowerCase():'pdf';}
function migrateNames(data){if(data.namesV>=1)return false;
 (data.clients||[]).forEach(function(c){if(!c.code)c.code=clientCode(c);});
 (data.visas||[]).forEach(function(v){if(!v.code)v.code=visaCode(v);});
 (data.documents||[]).forEach(function(d){if(!d.code)d.code=docCode(d);});
 (data.applications||[]).forEach(function(a){(data.checklists[a.id]||[]).forEach(function(r){if(r.filename)r.filename=stdName(data,a,r.docId,extOf(r.filename),r.submittedAt||a.updatedAt||a.createdAt);});});
 data.namesV=1;return true;}

/* ---- filesV:1 — multiple uploads per requirement. row.files=[{name,at,status}], row.seq = last -NN used (never reused),
   row.done = files.length>0, row.status/submittedAt mirror the newest file for older code. */
function fileName(data,app,r,ext,date){r.seq=(r.seq||0)+1;return stdName(data,app,r.docId,ext,date).replace(/(\.[a-z0-9]+)$/,'-'+String(r.seq).padStart(2,'0')+'$1');}
function syncRow(r){r.files=r.files||[];r.done=r.files.length>0;var last=r.files[r.files.length-1];if(last){r.status=last.status;r.submittedAt=last.at;}else{delete r.status;delete r.submittedAt;}}
/* Auto Review: every required doc has >=1 upload -> status 'Review' (previous status kept in reviewFrom); falls back when no longer complete. */
var REVIEWABLE=['New','Active','Submitted'];
function syncReview(data,app){var visa=visaFor(data,app);if(!visa||!visa.docIds.length)return false;var cl=ensureChecklist(data,app);
 var complete=cl.every(function(r){return r.files&&r.files.length;});
 if(complete&&REVIEWABLE.indexOf(app.status)>-1){app.reviewFrom=app.status;app.status='Review';app.updatedAt=today();return true;}
 if(!complete&&app.status==='Review'){app.status=app.reviewFrom||'Active';delete app.reviewFrom;app.updatedAt=today();return true;}
 return false;}
function migrateFiles(data){if(data.filesV>=1)return false;
 (data.applications||[]).forEach(function(a){(data.checklists[a.id]||[]).forEach(function(r){if(!Array.isArray(r.files)){r.files=[];if(r.filename){var m=/^(.*?)(\.[A-Za-z0-9]+)$/.exec(r.filename)||[0,r.filename,'.pdf'];r.files.push({name:m[1]+'-01'+m[2].toLowerCase(),at:r.submittedAt||a.updatedAt||today(),status:r.status||'received'});r.seq=1;}}delete r.filename;syncRow(r);});});
 data.filesV=1;return true;}
function cleanName(t){return String(t||'').trim();}
var IRCC_URL='https://www.canada.ca/en/immigration-refugees-citizenship/services/application/check-processing-times.html';
/* Admin updates shown in the client carousel. Functional notices only — no office hours or dates are invented. */
function announcementsSeed(){return [
 {date:'2026-10-15',title:'Uploading your documents',body:'Upload each required document on your application page. You can add more than one file per requirement, and every file is renamed automatically so nothing gets mixed up.'},
 {date:'2026-10-12',title:'Questions about your file',body:'Send your questions through Chat at the bottom of any portal page. Your assigned counselor will reply there, so the whole conversation stays in one place.'},
 {date:'2026-10-05',title:'Visa processing times',body:'Processing times are set by each country’s immigration authority and change often. For Canadian study permits, check IRCC’s official processing times page. We will let you know of any update on your file.',link:{href:IRCC_URL,text:'Check IRCC processing times'}}];}
function tasksSeed(){return [{id:'t1',title:'Review your uploaded documents',due:'2026-12-10',done:false,appId:'a1'},{id:'t2',title:'Book your pre-departure orientation',due:'2026-10-10',done:false,appId:'a1'},{id:'t3',title:'Prepare questions for your consultation',due:'2026-12-20',done:true,appId:'a2'}];}
function migrateCopy(d){d.copyV=1;return false;}
function migrateEmails(d){d.emailsV=1;return false;}
/* ---- threadsV:1 — support chat. data.threads[clientId] = {messages:[{id,from:'owner'|'client',text,ts}], read:{owner:ms,client:ms}}.
   One thread per client. Every save() merges with what is already stored (messages unioned by id, read markers take the max),
   so a tab holding older data can never drop messages written by another tab. */
function mergeThreads(d){if(!d||!d.threads)return;var cur=null;try{var raw=localStorage.getItem(KEY);cur=raw?JSON.parse(raw):null;}catch(e){}
 if(!cur||!cur.threads)return;Object.keys(cur.threads).forEach(function(cid){var a=cur.threads[cid],b=d.threads[cid];
  if(!b){d.threads[cid]=a;return;}var ids={};b.messages.forEach(function(m){ids[m.id]=1;});
  a.messages.forEach(function(m){if(!ids[m.id])b.messages.push(m);});b.messages.sort(function(x,y){return x.ts-y.ts;});
  b.read=b.read||{};['owner','client'].forEach(function(k){b.read[k]=Math.max(b.read[k]||0,(a.read||{})[k]||0);});});}
function tor(y,mo,dd,h,mi){return Date.UTC(y,mo-1,dd,h+4,mi);} /* Toronto EDT (UTC-4) wall time -> ms; seeds are all in October */
/* by = admin id of the admin who wrote an 'owner' message */
function threadsSeed(){var T={};function th(cid,msgs,readOwner,readClient){T[cid]={messages:msgs.map(function(m,i){var o={id:cid+'-s'+i,from:m[0],text:m[1],ts:m[2]};if(m[3])o.by=m[3];return o;}),read:{owner:readOwner,client:readClient}};}
 th('c0',[
  ['client','Hi! I uploaded my passport, my Letter of Acceptance, my proof of funds and my transcripts for the Canada student visa. Is there anything else you need from me right now?',tor(2026,10,16,10,2)],
  ['owner','Hi Andrea, thanks, those all came through. The items still missing are your English proficiency results and your study plan. You can upload them under each requirement on your application page.',tor(2026,10,16,10,41),'adm-1'],
  ['client','I have two English test reports. Can I upload both?',tor(2026,10,16,10,44)],
  ['owner','Yes, please upload each report as its own file under “English proficiency results”. They’ll be numbered automatically.',tor(2026,10,16,10,47),'adm-1'],
  ['client','Perfect. I’ll upload the reports tonight and send my study plan tomorrow.',tor(2026,10,19,19,59)]],
  tor(2026,10,16,10,47),tor(2026,10,16,10,47));
 th('c1',[
  ['client','Hello, do my recommendation letters need to be signed by my professors?',tor(2026,10,14,9,15)],
  ['owner','Good morning Miguel. Yes, please ask each professor to sign and date the letter and include their contact details.',tor(2026,10,14,9,52),'adm-2'],
  ['client','Thank you, I’ll ask them this week.',tor(2026,10,14,9,58)],
  ['owner','Sounds good. Once you have the signed copies, upload them to your application and let me know here.',tor(2026,10,14,10,3),'adm-2']],
  tor(2026,10,14,9,58),tor(2026,10,14,10,3));
 th('c2',[
  ['owner','Hi Bea, your CAS details are on file. Next we’ll need your financial evidence. Recent bank statements are a good start.',tor(2026,10,17,14,20),'adm-3'],
  ['client','Okay. Should the statements be in my name or can they be my parents’?',tor(2026,10,18,11,6)],
  ['client','My parents are sponsoring my studies.',tor(2026,10,18,11,7)]],
  0,tor(2026,10,17,14,20));
 th('c3',[
  ['client','Hi, how long is the Ireland student visa taking right now?',tor(2026,10,12,16,30)],
  ['owner','Hi Joshua, processing times change often and are set by the immigration authority, so the official website is the best source. We’ll keep you updated on anything that affects your file.',tor(2026,10,12,17,5),'adm-1'],
  ['client','Got it, thanks!',tor(2026,10,12,17,9)]],
  tor(2026,10,12,17,9),tor(2026,10,12,17,5));
 return T;}
function migrateThreads(data){if(data.threadsV>=1)return false;data.threads=data.threads||{};var seed=threadsSeed();
 Object.keys(seed).forEach(function(cid){if(!data.threads[cid]&&(data.clients||[]).some(function(c){return c.id===cid;}))data.threads[cid]=seed[cid];});
 data.threadsV=1;return true;}
function migrateAll(d){var ch=false;if(migrateThreads(d))ch=true;if(migrateFiles(d))ch=true;if(migrateCopy(d))ch=true;if(migrateEmails(d))ch=true;if(!d.reviewV){(d.applications||[]).forEach(function(a){syncReview(d,a);});d.reviewV=1;ch=true;}return ch;}
/* save that reports quota failures instead of throwing */
function trySave(d){return save(d);}
function progress(data,app){var visa=visaFor(data,app);if(visa){if(!visa.docIds.length)return 100;var stored={};(data.checklists[app.id]||[]).forEach(function(r){stored[r.docId]=r;});var done=visa.docIds.filter(function(id){return stored[id]&&stored[id].done;}).length;return Math.round(done/visa.docIds.length*100);}return typeof app.progress==='number'?app.progress:0;}
function clientName(c){return [c.first,c.middle,c.last].filter(Boolean).join(' ');}
window.ISCStore={fileName:fileName,syncRow:syncRow,syncReview:syncReview,FILE_STATUSES:FILE_STATUSES,stdName:stdName,extOf:extOf,clientCode:clientCode,visaCode:visaCode,docCode:docCode,KEY:KEY,OLDKEY:OLDKEY,TYPES:TYPES,STATUSES:STATUSES,CLIENT_ID:CLIENT_ID,today:today,alias:alias,load:load,save:save,reset:reset,progress:progress,clientName:clientName,visaFor:visaFor,distinctTypes:distinctTypes,visasOfType:visasOfType,effectiveDateOf:effectiveDateOf,docById:docById,ensureChecklist:ensureChecklist,docStatus:docStatus,monthKeys:monthKeys,trySave:trySave,SAMPLE_MAX:SAMPLE_MAX,DOC_STATUSES:DOC_STATUSES,slug:slug,adminById:adminById,adminName:adminName,currentAdminId:currentAdminId,esc:function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});}};
})();
