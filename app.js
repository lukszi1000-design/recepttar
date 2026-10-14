let weeks=[], currentView='menu', selectedWeek='1. hét', selectedDay='Hétfő';
const days=['Hétfő','Kedd','Szerda','Csütörtök','Péntek','Szombat','Vasárnap'];
const mealLabels={breakfast:'Reggeli',lunch:'Ebéd',snack:'Kisétkezés',dinner:'Vacsora'};
const $=id=>document.getElementById(id);
fetch('recipes.json').then(r=>r.json()).then(data=>{weeks=data;init();}).catch(()=>{$('mealGrid').innerHTML='<p class="empty">A receptadatok nem tölthetők be. Nyisd meg a csomagot webszerverről vagy telepített példányként.</p>';});
function init(){ $('daySelect').innerHTML=days.map(d=>`<option>${d}</option>`).join('');$('daySelect').value=selectedDay;renderMenu();renderShoppingDays();renderAll();}
function recipesFor(week,day){return (weeks.find(w=>w.name===week)?.recipes||[]).filter(r=>r.day===day||r.meal==='snack'&&r.day==='Minden nap');}
function getKcal(r){return typeof r.kcal==='number'?r.kcal:null;}
function renderMenu(){selectedWeek=$('weekSelect').value;selectedDay=$('daySelect').value;const rs=recipesFor(selectedWeek,selectedDay);const meals=['breakfast','lunch','snack','dinner'];let total=0,count=0;for(const m of meals){const r=rs.find(x=>x.meal===m);if(r&&getKcal(r)!==null){total+=r.kcal;count++;}}
$('daySummary').innerHTML=`<div><strong>${selectedDay} · ${selectedWeek}</strong><small>${count} recept kalóriaértéke szerepel a napi összegben</small></div><div class="big">${total} <small style="display:inline;color:#d5e7df">kcal</small></div>`;
$('mealGrid').innerHTML=meals.map(m=>{const r=rs.find(x=>x.meal===m);return `<article class="meal-card"><div class="meal-top"><span>${mealLabels[m]}</span><span>${r&&getKcal(r)!==null?r.kcal+' kcal':(m==='snack'?'120–200 kcal':'Nincs megadva')}</span></div>${r?`<h3>${esc(r.title.replace(/^(Vasárnap|Hétfői?|Kedd|Szerda|Csütörtök|Péntek|Szombat)(i)?\s*(reggeli|vacsora)?\s*[–-]?\s*/i,''))}</h3><button class="button secondary" onclick="openRecipe('${r.id}')">Recept megnyitása</button>`:`<h3>Nincs külön megadott recept</h3><p class="hint">Ehhez a naphoz a dokumentum nem tartalmazott ilyen étkezést.</p>`}</article>`}).join('');}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function sections(r){let ing=[],prep=[],mode='ingredients';for(const line of r.content){const low=line.toLowerCase();if(/^elkészítés|^👨‍🍳 elkészítés|^👨‍🍳/i.test(line)){mode='prep';if(!/^elkészítés/i.test(line)&&!line.includes('elkészítés'))prep.push(line);continue;}if(/^hozzávalók/i.test(line)){mode='ingredients';continue;}if(/^uzsonnák/i.test(line))continue;if(mode==='ingredients')ing.push(line);else prep.push(line);}return {ing:ing.filter(Boolean),prep:prep.filter(Boolean)};}
function openRecipe(id){const r=weeks.flatMap(w=>w.recipes).find(x=>x.id===id);if(!r)return;const s=sections(r);$('dialogMeta').textContent=`${r.week} · ${r.day} · ${mealLabels[r.meal]||'Recept'}${r.kcal!==null?' · '+r.kcal+' kcal':''}`;$('dialogTitle').textContent=r.title;$('dialogBody').innerHTML=`${s.ing.length?'<h3>Hozzávalók</h3><ul class="ingredients">'+s.ing.map(x=>`<li><label><input type="checkbox">${esc(x)}</label></li>`).join('')+'</ul>':''}${s.prep.length?'<h3>Elkészítés és megjegyzések</h3>'+s.prep.map(x=>`<p>${esc(x)}</p>`).join(''):'<div class="notice">A forrásdokumentumban ehhez a recepthez nem találtam elkészítési leírást.</div>'}${r.title.toLowerCase().includes('brownie')?'<div class="notice">A dokumentum külön „Süti receptek” oldalra hivatkozik; ez a fájl nem volt a két feltöltött dokumentum között.</div>':''}`;$('recipeDialog').showModal();}
window.openRecipe=openRecipe;
function renderShoppingDays(){$('shoppingDays').innerHTML=days.map(d=>`<label><input type="checkbox" value="${d}" ${['Hétfő','Kedd','Szerda','Csütörtök','Péntek','Szombat','Vasárnap'].includes(d)?'checked':''}> ${d}</label>`).join('');}
function ingredientLines(r){return sections(r).ing.filter(line=>{const l=line.toLowerCase();if(/^(adag|1 adag|hozzávalók|a töltelékhez|a lepényhez|öntet|köret|fűszerek|tetejére|bbq csirke|héjában sült burgonya|coleslaw saláta|mediterrán saláta|citromos uborkasaláta|krémes szósz|elkészítés|édes:|sós:)/i.test(l))return false;return /\d|só|bors|fokhagyma|oregánó|petrezselyem|citromlé|vanília|eritrit|fahéj|rozmaring|kapor|menta|víz|mustár|almaecet|olaj|fűszer/i.test(l);});}
function parseIngredient(line){let s=line.replace(/^[🛒🥔🥗🍋🥛👨‍🍳]+\s*/,'').trim();let m=s.match(/^(.+?)(?:\s*[:–-]\s*)(.+)$/);if(m){return {name:m[1].trim(),qty:m[2].trim(),raw:s};}const q=s.match(/^((?:~\s*)?\d[\d.,]*(?:\s*(?:g|kg|ml|cl|l|db|szelet|tk|ek|gerezd|marék|levél|csomag|adag|°C|perc))?(?:\s*(?:v\.|vagy|\/).*)?)\s+(.+)$/i);if(q)return {qty:q[1].trim(),name:q[2].trim(),raw:s};return {qty:'',name:s,raw:s};}
function makeShopping(){const picked=[...$('shoppingDays').querySelectorAll('input:checked')].map(x=>x.value);const selected=[];for(const d of picked){const rs=recipesFor(selectedWeek,d).filter(r=>r.meal!=='snack');for(const r of rs){for(const line of ingredientLines(r)){const p=parseIngredient(line);selected.push({...p,source:r.title});}}}const groups=new Map();for(const x of selected){const key=x.raw.toLocaleLowerCase('hu-HU').replace(/\s+/g,' ');if(!groups.has(key))groups.set(key,{...x,count:0});groups.get(key).count++;}const list=[...groups.values()].sort((a,b)=>a.name.localeCompare(b.name,'hu'));$('shoppingResult').innerHTML=`<div class="shopping-group"><h3>${selectedWeek} · ${picked.length} kiválasztott nap · ${list.length} tétel</h3>${list.length?list.map((x,i)=>`<label class="shop-row"><input type="checkbox"><span>${esc(x.raw)}${x.count>1?` <small>(${x.count} receptben)</small>`:''}</span></label>`).join(''):'<p>Nincs hozzávaló. Válassz ki legalább egy napot.</p>'}<p class="hint">A lista az azonos szövegű hozzávalókat vonja össze. Eltérő megnevezéseket és mértékegységeket nem vált át automatikusan.</p><button id="copyList" class="button secondary">Lista másolása</button></div>`;const b=$('copyList');if(b)b.onclick=()=>{const text=list.map(x=>`${x.raw}${x.count>1?' ('+x.count+' receptben)':''}`).join('\n');navigator.clipboard?.writeText(text).then(()=>b.textContent='Másolva!').catch(()=>{});};$('shoppingResult').querySelectorAll('.shop-row input').forEach(cb=>cb.addEventListener('change',()=>cb.parentElement.classList.toggle('done',cb.checked)));}
function renderAll() {
const q = ($('searchBox')?.value || '')
.toLocaleLowerCase('hu');
const meal = $('mealFilter')?.value || 'all';
const arr = weeks.flatMap(w => w.recipes).filter(r => {
const mealMatch = meal === 'all' || r.meal === meal;
const text = `${r.title} ${r.week} ${r.day}`
.toLocaleLowerCase('hu');
return mealMatch && text.includes(q);
});
$('recipeList').innerHTML = arr.map(r => `
<article class="recipe-item">
<p>
${r.week} · ${r.day} ·
${mealLabels[r.meal] || 'Recept'}
${r.kcal !== null ? ' · ' + r.kcal + ' kcal' : ''}
</p>
<h3>${esc(r.title)}</h3>
<button class="button secondary"
onclick="openRecipe('${r.id}')">
Recept megnyitása
</button>
</article>
`).join('');
}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{currentView=b.dataset.view;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));['menu','shopping','all'].forEach(v=>$(`${v}View`).classList.toggle('hidden',v!==currentView));}));$('weekSelect').addEventListener('change',()=>{selectedWeek=$('weekSelect').value;renderMenu();});$('daySelect').addEventListener('change',renderMenu);$('makeList').addEventListener('click',makeShopping);$('searchBox').addEventListener('input',renderAll);$('mealFilter').addEventListener('change', renderAll);$('closeDialog').addEventListener('click',()=>$('recipeDialog').close());$('recipeDialog').addEventListener('click',e=>{if(e.target===$('recipeDialog'))$('recipeDialog').close();});
let installPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installBtn').classList.remove('hidden');});$('installBtn').addEventListener('click',async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('installBtn').classList.add('hidden');});if('serviceWorker'in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
