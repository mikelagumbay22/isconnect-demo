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
/* Education Counselors — names and headshots from the About page (Meet the Team). Each application has one counselorId. */
var COUNSELORS=[{id:'ec-rica',name:'Rica Urbano',photo:'team-rica-338'},{id:'ec-celene',name:'Celene Garcia',photo:'team-celene-338'},{id:'ec-yeda',name:'Yeda Soriano',photo:'team-yeda-338'},{id:'ec-rae',name:'Gracie Rae Batongbakal',photo:'team-rae-338'}];
var COUNTRIES=['Canada','United Kingdom','Ireland','Germany','Spain','New Zealand','Singapore','United Arab Emirates','All countries'];
var VISA_COUNTRY={'v-ca-sv':'Canada','v-ca-pgwp':'Canada','v-ca-dep':'Canada','v-ca-wp':'Canada','v-ca-pr':'Canada','v-uk-sv':'United Kingdom','v-uk-gr':'United Kingdom','v-ie-sv':'Ireland','v-de-sv':'Germany','v-es-sv':'Spain','v-nz-sv':'New Zealand','v-uae-sv':'United Arab Emirates','v-sg-sp':'Singapore'};
function counselorById(id){return COUNSELORS.filter(function(c){return c.id===id;})[0]||null;}
function visaCountry(v){return (v&&v.country)||'All countries';}
/* Backfill: every case type gets a country, every application a counselor (stable by position). Runs on load and save. */
function ensureAssignments(d){var ch=false;(d.visas||[]).forEach(function(v){if(!v.country||COUNTRIES.indexOf(v.country)<0){v.country=VISA_COUNTRY[v.id]||'All countries';ch=true;}});
 (d.applications||[]).forEach(function(a,i){if(!counselorById(a.counselorId)){a.counselorId=COUNSELORS[i%COUNSELORS.length].id;ch=true;}});return ch;}
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
function load(){try{var raw=localStorage.getItem(KEY);if(raw){var d=JSON.parse(raw);if(d&&d.version===1){var ch=false;if(migrateDocs(d))ch=true;if(migrateMetrics(d))ch=true;if(migrateSamples(d))ch=true;if(migrateNames(d))ch=true;if(migrateAll(d))ch=true;if(migrateAdmins(d))ch=true;if(migrateRoles(d))ch=true;if(migrateTeam2Apps(d)){migrateRoles(d);ch=true;}if(ensureAssignments(d))ch=true;if(ch)save(d);return d;}}}catch(e){}
 var s=seed();migrateDocs(s);migrateMetrics(s);migrateSamples(s);migrateNames(s);migrateAll(s);migrateAdmins(s);migrateRoles(s);migrateTeam2Apps(s);save(s);return s;}
function save(d){try{ensureAssignments(d);mergeThreads(d);localStorage.setItem(KEY,JSON.stringify(d));return true;}catch(e){if(window.console)console.warn('ISConnect: could not save (storage full?)');return false;}}
function reset(){localStorage.removeItem(KEY);return load();}
/* adminsV:1 — guarantees data.admins and a valid assignedAdminId on every client (new clients default to the admin who adds them). */
function migrateAdmins(d){var ch=false;if(!Array.isArray(d.admins)||!d.admins.length){d.admins=ADMINS.slice();ch=true;}
 (d.clients||[]).forEach(function(c,i){if(!c.assignedAdminId||!d.admins.some(function(a){return a.id===c.assignedAdminId;})){c.assignedAdminId=d.admins[i%d.admins.length].id;ch=true;}});return ch;}
/* rbacV:1 — Levels (super=Admin | manager | staff | archive); permissions per level in d.levelPerms (see migrateTeam), and the activity log (d.logs, newest last).
   Admins always hold every permission; Staff permissions come from role defaults and can be changed on the Permissions page. */
var SUPER_ADMIN={id:'adm-0',first:'Emmanuel',last:'Garcia',email:'superadmin@isconnect.ca',role:'super'};
var AREAS=[{k:'dashboard',label:'Dashboard',acts:['view']},{k:'clients',label:'Clients',acts:['view','all','add','edit','delete']},{k:'documents',label:'Documents',acts:['view','add','edit','delete']},{k:'casetypes',label:'Case types',acts:['view','add','edit','delete']},{k:'messages',label:'Messages',acts:['view']},{k:'logs',label:'Activity logs',acts:['view']},{k:'team',label:'Team',acts:['view','add','edit','delete']}];
var ACT_LABEL={view:'View',all:'All clients',add:'Add',edit:'Edit',delete:'Delete'};
var ROLE_LABEL={super:'Admin',manager:'Manager',staff:'Staff',archive:'Archive'};
var LEVELS=['super','manager','staff','archive'];
var MANAGER={id:'adm-4',first:'Mary Grace',last:'Ariola',email:'manager@isconnect.ca',role:'manager'};
var MANAGER2={id:'adm-5',first:'Alma',last:'Armada',email:'manager2@isconnect.ca',role:'manager'};
/* Second team: staff reporting to Alma Armada. */
var TEAM2=[{id:'adm-6',first:'Joshua',last:'Santos',email:'joshua.santos@example.com',role:'staff',managerId:'adm-5'},{id:'adm-7',first:'Bea',last:'Navarro',email:'bea.navarro@example.com',role:'staff',managerId:'adm-5'}];
function roleDefaults(role){var p={};AREAS.forEach(function(a){p[a.k]={};a.acts.forEach(function(x){p[a.k][x]=role==='super';});});
 if(role!=='super'){p.dashboard.view=true;p.clients.view=p.clients.add=p.clients.edit=true;p.documents.view=p.documents.add=p.documents.edit=p.documents.delete=true;p.casetypes.view=p.casetypes.add=p.casetypes.edit=true;p.messages.view=true;}
 if(role==='manager'){p.clients.delete=true;p.casetypes.delete=true;p.logs.view=true;}
 return p;}
/* Assignable users: Managers and Staff (never Admins or archived members). */
/* levelsV:1 — custom permission levels in d.levels [{id,name,desc,perms,reports,manages}]; 'super' (Admin) and 'archive' are built-in system levels. */
function seedLevels(d){var lp=d.levelPerms||{};return [{id:'manager',name:'Manager',desc:'Leads a team and oversees their clients.',perms:lp.manager||roleDefaults('manager'),reports:false,manages:true},{id:'staff',name:'Staff',desc:'Works their assigned clients and reports to a manager.',perms:lp.staff||roleDefaults('staff'),reports:true,manages:false}];}
function levels(d){return d.levels||(d.levels=seedLevels(d));}
function levelById(d,id){return levels(d).filter(function(l){return l.id===id;})[0]||null;}
function roleLabel(d,r){if(r==='super')return 'Admin';if(r==='archive')return 'Archive';var l=levelById(d,r);return l?l.name:'Staff';}
function manages(d,r){var l=levelById(d,r);return !!(l&&l.manages);}
function reportsTo(d,r){var l=levelById(d,r);return !!(l&&l.reports);}
function migrateLevels(d){var ch=false;if(!d.levels){d.levels=seedLevels(d);ch=true;}
 d.levels.forEach(function(l){var def=roleDefaults(l.id==='manager'?'manager':'staff');l.perms=l.perms||{};AREAS.forEach(function(ar){var p=l.perms[ar.k]=l.perms[ar.k]||{};ar.acts.forEach(function(x){if(typeof p[x]!=='boolean'){p[x]=l.id==='manager'||l.id==='staff'?def[ar.k][x]:false;ch=true;}});});});
 if(d.levelPerms){delete d.levelPerms;ch=true;}
 var fb=levelById(d,'staff')?'staff':d.levels[0]&&d.levels[0].id;(d.admins||[]).forEach(function(a){if(a.role&&a.role!=='super'&&a.role!=='archive'&&!levelById(d,a.role)&&fb){a.role=fb;ch=true;}});
 return ch;}
/* Assignable users: anyone on a non-system level (never Admins or archived members). */
function staffList(d){return (d.admins||[]).filter(function(a){return a.role!=='super'&&a.role!=='archive'&&!!levelById(d,a.role);});}
function managers(d){return (d.admins||[]).filter(function(a){return manages(d,a.role);});}
/* teamIds: a Manager's own id plus every Staff member whose managerId is that Manager. */
function teamIds(d,id){var a=adminById(d,id);if(!a)return [];if(!manages(d,a.role))return [a.id];return [a.id].concat((d.admins||[]).filter(function(x){return x.managerId===a.id&&x.id!==a.id&&x.role!=='archive'&&x.role!=='super';}).map(function(x){return x.id;}));}
function migrateRoles(d){var ch=false;if(!Array.isArray(d.admins))d.admins=[];d.admins.forEach(function(x){if(x.id==='adm-0'&&x.first==='Isabel'&&x.last==='Ramirez'){x.first=SUPER_ADMIN.first;x.last=SUPER_ADMIN.last;ch=true;}});(d.logs||[]).forEach(function(l){if(l.actor==='Isabel Ramirez'){l.actor='Emmanuel Garcia';ch=true;}if(l.target==='Isabel Ramirez'){l.target='Emmanuel Garcia';ch=true;}});
 if(migrateLevels(d))ch=true;
 var DEL=d.deletedAdmins||[];function gone(id){return DEL.indexOf(id)>-1;}
 if(!d.admins.some(function(a){return a.id===SUPER_ADMIN.id;})&&!gone(SUPER_ADMIN.id)){d.admins.unshift(JSON.parse(JSON.stringify(SUPER_ADMIN)));ch=true;}
 if(!d.admins.some(function(a){return a.id===MANAGER.id;})&&!gone(MANAGER.id)){var mi=d.admins.findIndex(function(a){return a.role!=='super';});d.admins.splice(mi<0?d.admins.length:mi,0,JSON.parse(JSON.stringify(MANAGER)));ch=true;}
 var added2=[];if(!d.admins.some(function(a){return a.id===MANAGER2.id;})&&!gone(MANAGER2.id)){var mj=d.admins.findIndex(function(a){return a.role==='staff';});d.admins.splice(mj<0?d.admins.length:mj,0,JSON.parse(JSON.stringify(MANAGER2)));added2.push(MANAGER2.id);ch=true;}
 TEAM2.forEach(function(t){if(!d.admins.some(function(a){return a.id===t.id;})&&!gone(t.id)){d.admins.push(JSON.parse(JSON.stringify(t)));added2.push(t.id);ch=true;}});
 /* One-time: hand every 5th and 6th-of-every-7 client to the new staff so their team has a caseload. */
 var newSt=TEAM2.filter(function(t){return added2.indexOf(t.id)>-1;});if(newSt.length)(d.clients||[]).forEach(function(c,i){var k=i%7;if(k>=5&&newSt[k-5])c.assignedAdminId=newSt[k-5].id;});
 d.admins.forEach(function(a){if(!a.role){a.role=a.id===SUPER_ADMIN.id?'super':'staff';ch=true;}});
 var st=staffList(d);(d.clients||[]).forEach(function(c,i){var a=adminById(d,c.assignedAdminId);if(st.length&&(!a||a.role==='super'||a.role==='archive')){c.assignedAdminId=st[i%st.length].id;ch=true;}});
 var ms=managers(d);d.admins.forEach(function(a){if(reportsTo(d,a.role)&&ms.length&&!ms.some(function(m){return m.id===a.managerId&&m.id!==a.id;})){var m0=ms.filter(function(m){return m.id!==a.id;})[0];if(m0){a.managerId=m0.id;ch=true;}}if(!reportsTo(d,a.role)&&a.role!=='archive'&&a.managerId){delete a.managerId;ch=true;}});
 if(!Array.isArray(d.logs)){d.logs=seedLogs(d);ch=true;}
 [[MANAGER.id,36,'lm-',23],[MANAGER2.id,30,'lm2-',31],['adm-6',40,'ls6-',37],['adm-7',40,'ls7-',41]].forEach(function(x){var u=adminById(d,x[0]);if(u&&!d.logs.some(function(l){return l.actorId===x[0];})){d.logs=d.logs.concat(seedLogs(d,[u],x[1],x[2],x[3]));ch=true;}});
 if(migrateTeam(d))ch=true;
 if(ch){d.logs=d.logs.sort(function(a,b){return a.at<b.at?-1:a.at>b.at?1:0;});ch=true;}
 return ch;}
/* teamV:1 — Team page: phone + photo per member, permissions per level (d.levelPerms), per-user overrides dropped, 'Super Admin' renamed 'Admin'. */
var PHOTOS={'adm-0':'team-em-338.jpg','adm-4':'team-grace-338.jpg','adm-5':'team-alma-338.jpg'};
var PHONES={'adm-0':'0180','adm-4':'0181','adm-5':'0182','adm-1':'0183','adm-2':'0184','adm-3':'0185','adm-6':'0186','adm-7':'0187'};
function migrateTeam(d){var ch=false;
 (d.admins||[]).forEach(function(a,i){if(!a.last&&a.first&&a.first.indexOf(' ')>0){var k=a.first.lastIndexOf(' ');a.last=a.first.slice(k+1);a.first=a.first.slice(0,k);ch=true;}
  if(!a.phone){a.phone='(403) 555-'+(PHONES[a.id]||('01'+String(90+i%10)));ch=true;}if(a.photo===undefined&&PHOTOS[a.id]){a.photo=PHOTOS[a.id];ch=true;}});
 if(d.perms){delete d.perms;ch=true;}
 if(!d.teamV){(d.logs||[]).forEach(function(l){if(l.role==='Super Admin')l.role='Admin';if(l.detail)l.detail=String(l.detail).replace(/Super Admin/g,'Admin');});d.teamV=1;ch=true;}
 return ch;}
function isSuper(d,id){var a=adminById(d,id);return !!(a&&a.role==='super');}
function can(d,id,area,act){var a=adminById(d,id);if(!a)return false;if(a.role==='super')return true;if(a.role==='archive')return false;var l=levelById(d,a.role),p=l&&l.perms&&l.perms[area];return !!(p&&p[act||'view']);}
function actorNow(d){var r='';try{r=sessionStorage.getItem('isc_demo_role')||'';}catch(e){}if(r==='client'){var c=(d.clients||[]).filter(function(x){return x.id===CLIENT_ID;})[0];return {id:CLIENT_ID,name:c?clientName(c):'Client',role:'Client'};}
 var a=adminById(d,currentAdminId());return {id:a?a.id:'',name:a?adminName(a):'System',role:a?roleLabel(d,a.role):'System'};}
/* log(d, action, area, target, detail) — action: Login | Logout | Create | Edit | Delete | Status change | Upload | Permission change */
function log(d,action,area,target,detail){if(!Array.isArray(d.logs))d.logs=[];var who=actorNow(d);
 d.logs.push({id:'l-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),at:new Date().toISOString(),actorId:who.id,actor:who.name,role:who.role,action:action,area:area,target:target||'',detail:detail||''});
 if(d.logs.length>3000)d.logs=d.logs.slice(-3000);}
function seedLogs(d,only,cnt,pre,sd){var out=[],seed=sd||7;function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}function pick(a){return a[Math.floor(rnd()*a.length)];}
 var admins=only||(d.admins.length?d.admins.filter(function(a){return !manages(d,a.role)&&a.role!=='archive';}):[SUPER_ADMIN]),cl=d.clients||[],docs=d.documents||[],vs=d.visas||[],apps=d.applications||[];
 var now=Date.now(),N=cnt||140;pre=pre||'ls-';
 for(var i=0;i<N;i++){var t=new Date(now-Math.round((N-i)*(45*864e5/N)+rnd()*3600e3));var h=t.getHours();if(h<8||h>18)t.setHours(9+Math.floor(rnd()*8));
  var a=pick(admins),r=rnd(),e={id:pre+i,at:t.toISOString(),actorId:a.id,actor:adminName(a),role:roleLabel(d,a.role||'staff')};
  var tm=teamIds(d,a.id);var mine=cl.filter(function(c){return a.role==='super'||tm.indexOf(c.assignedAdminId)>-1;});var c=pick(mine.length?mine:cl);
  if(r<.22){e.action='Login';e.area='Account';e.target=adminName(a);e.detail='Signed in';}
  else if(r<.40){var ap=apps.filter(function(x){return x.clientId===(c&&c.id);})[0]||pick(apps);e.action='Status change';e.area='Clients';e.target=clientName(c);e.detail=(ap?ap.type:'Application')+': '+pick(['New → Active','Active → Submitted','Submitted → Review','Review → Approved','Pending review → Approved','Received → Pending review']);}
  else if(r<.55){e.action='Edit';e.area='Clients';e.target=clientName(c);e.detail=pick(['Updated phone number','Updated email address','Updated contact details']);}
  else if(r<.63){e.action='Create';e.area='Clients';e.target=clientName(c);e.detail='Added application: '+pick(vs).name;}
  else if(r<.73){e.action=pick(['Edit','Edit','Upload']);e.area='Documents';var dc=pick(docs);e.target=dc?dc.name:'Document';e.detail=e.action==='Upload'?'Attached sample file':'Updated version to '+(dc?dc.version:'v1.0');}
  else if(r<.80){e.action='Edit';e.area='Case types';var v=pick(vs);e.target=v.name;e.detail=pick(['Updated required documents','Updated notes','Updated effective date']);}
  else if(r<.86&&a.role==='super'){e.action='Permission change';e.area='Permissions';var s=pick(staffList(d).length?staffList(d):admins);e.target=adminName(s);e.detail=pick(['Documents: Delete on','Case types: Add on','Activity logs: View off']);}
  else if(r<.92){e.action='Status change';e.area='Documents';e.target=clientName(c);e.detail=pick(docs).name+': Pending review → Approved';}
  else {e.action='Logout';e.area='Account';e.target=adminName(a);e.detail='Signed out';}
  out.push(e);}
 return out;}
function adminById(d,id){return (d.admins||[]).filter(function(a){return a.id===id;})[0]||null;}
function adminPhoto(a,base){var p=a&&a.photo;if(!p)return '';return /^data:/.test(p)?p:(base==null?'../':base)+'assets/img/team/'+p;}
function adminName(a){return a?[a.first,a.last].filter(Boolean).join(' '):'Unassigned';}
function currentAdminId(){try{return sessionStorage.getItem('isc_demo_admin')||'';}catch(e){return '';}}
function visaFor(data,app){if(app.visaId){var byId=(data.visas||[]).find(function(v){return v.id===app.visaId;});if(byId)return byId;}return (data.visas||[]).find(function(v){return v.name===app.type;});}
function distinctTypes(data){var seen={},out=[];(data.visas||[]).forEach(function(v){if(!seen[v.name]){seen[v.name]=1;out.push(v.name);}});return out;}
function visasOfType(data,type){return (data.visas||[]).map(function(v,i){return {v:v,i:i};}).filter(function(x){return x.v.name===type;}).sort(function(a,b){var ta=Date.parse(a.v.effective),tb=Date.parse(b.v.effective);var va=!isNaN(ta),vb=!isNaN(tb);if(va&&vb)return (tb-ta)||(a.i-b.i);if(va)return -1;if(vb)return 1;return a.i-b.i;}).map(function(x){return x.v;});}
function effectiveDateOf(data,app){if(app.effectiveDate&&!isNaN(Date.parse(app.effectiveDate)))return app.effectiveDate;var v=visaFor(data,app);if(v&&v.effective&&!isNaN(Date.parse(v.effective)))return v.effective;return '';}
/* Legacy migration: apps without visaId get the first visa record matching their type + its effective date.
   The legacy `due` field is KEPT only as an internal field on seeded demo apps for the owner overdue demo; new apps never get one. */
/* Second team (Alma Armada): realistic caseload for Joshua Santos and Bea Navarro. One-time, idempotent (team2AppsV). */
var TEAM2_APPS=[['adm-6',0,'v-uk-sv','Active',-24,'2026-12-10'],['adm-6',1,'v-de-sv','Submitted',-38,'2026-11-28'],['adm-6',0,'v-ie-sv','Approved',-70,'2026-10-05'],
 ['adm-7',0,'v-nz-sv','New',-3,'2027-01-15'],['adm-7',1,'v-ca-sv','Review',-30,'2026-11-20'],['adm-7',0,'v-sg-sp','Active',-15,'2026-12-18'],['adm-7',1,'v-es-sv','Approved',-55,'2026-09-30']];
function migrateTeam2Apps(d){if(d.team2AppsV>=1)return false;if(!Array.isArray(d.applications))return false;d.checklists=d.checklists||{};
 var now=today(),added=0;
 TEAM2_APPS.forEach(function(t,i){var id='a-t2-'+(i+1);if(d.applications.some(function(a){return a.id===id;}))return;
  var cl=(d.clients||[]).filter(function(c){return c.assignedAdminId===t[0];});if(!cl.length)return;var c=cl[t[1]%cl.length];
  var v=(d.visas||[]).filter(function(x){return x.id===t[2];})[0];if(!v)return;var dt=addDays(now,t[4]);
  var a={id:id,clientId:c.id,type:v.name,visaId:v.id,effectiveDate:v.effective||'2026-01-01',status:t[3],date:dt,due:t[5],createdAt:dt,updatedAt:addDays(dt,Math.min(10,-t[4])),counselorId:COUNSELORS[(i+2)%COUNSELORS.length].id};
  d.applications.push(a);added++;
  var rows=ensureChecklist(d,a),n=t[3]==='New'?0:(t[3]==='Review'||t[3]==='Approved')?rows.length:Math.max(1,rows.length-1-(i%2));
  rows.forEach(function(r,k){if(k<n){var st=t[3]==='Approved'?'approved':DOC_STATUSES[(i+k)%3];r.files=[{name:slug(r.label)+'-01.pdf',at:addDays(dt,2+k*3),status:st}];r.seq=1;r.done=true;r.status=st;r.submittedAt=addDays(dt,2+k*3);}else{r.files=[];r.seq=0;r.done=false;}});
  if(t[3]==='Review')a.reviewFrom='Submitted';});
 d.team2AppsV=1;return true;}
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
 if(!cur)return;if(Array.isArray(cur.logs)&&Array.isArray(d.logs)){var lid={};d.logs.forEach(function(l){lid[l.id]=1;});var add=cur.logs.filter(function(l){return !lid[l.id];});if(add.length){d.logs=d.logs.concat(add).sort(function(x,y){return x.at<y.at?-1:x.at>y.at?1:0;});}}
 if(!cur.threads)return;Object.keys(cur.threads).forEach(function(cid){var a=cur.threads[cid],b=d.threads[cid];if(!(d.clients||[]).some(function(c){return c.id===cid;}))return;
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
window.ISCStore={adminPhoto:adminPhoto,levels:levels,levelById:levelById,roleLabel:roleLabel,manages:manages,reportsTo:reportsTo,LEVELS:LEVELS,managers:managers,teamIds:teamIds,AREAS:AREAS,ACT_LABEL:ACT_LABEL,ROLE_LABEL:ROLE_LABEL,roleDefaults:roleDefaults,staffList:staffList,isSuper:isSuper,can:can,log:log,COUNSELORS:COUNSELORS,COUNTRIES:COUNTRIES,counselorById:counselorById,visaCountry:visaCountry,fileName:fileName,syncRow:syncRow,syncReview:syncReview,FILE_STATUSES:FILE_STATUSES,stdName:stdName,extOf:extOf,clientCode:clientCode,visaCode:visaCode,docCode:docCode,KEY:KEY,OLDKEY:OLDKEY,TYPES:TYPES,STATUSES:STATUSES,CLIENT_ID:CLIENT_ID,today:today,alias:alias,load:load,save:save,reset:reset,progress:progress,clientName:clientName,visaFor:visaFor,distinctTypes:distinctTypes,visasOfType:visasOfType,effectiveDateOf:effectiveDateOf,docById:docById,ensureChecklist:ensureChecklist,docStatus:docStatus,monthKeys:monthKeys,trySave:trySave,SAMPLE_MAX:SAMPLE_MAX,DOC_STATUSES:DOC_STATUSES,slug:slug,adminById:adminById,adminName:adminName,currentAdminId:currentAdminId,esc:function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});}};
})();
