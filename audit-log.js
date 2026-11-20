(()=>{
 const KEY='acaciaRidesAuditLog';
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}};
 window.acaciaAudit=(action,detail='')=>{const rows=read(); rows.unshift({id:Date.now()+'-'+Math.random().toString(36).slice(2,7),time:new Date().toISOString(),action:String(action).slice(0,100),detail:String(detail).slice(0,160)}); localStorage.setItem(KEY,JSON.stringify(rows.slice(0,2000)));};
 document.addEventListener('click',e=>{const el=e.target.closest('button,a,[role="button"]'); if(!el)return; const label=(el.getAttribute('aria-label')||el.innerText||el.textContent||el.id||el.className||'Action').trim().replace(/\s+/g,' ').slice(0,90); if(label) window.acaciaAudit('Interaction',label);},true);
 document.addEventListener('submit',e=>{const f=e.target; window.acaciaAudit('Form submitted',f.getAttribute('aria-label')||f.id||f.getAttribute('name')||'Form');},true);
 window.addEventListener('error',e=>window.acaciaAudit('Client error',e.message||'Unknown error'));
})();
