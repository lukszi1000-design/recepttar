let weeks = [], currentView = 'planner', selectedWeek = '3. hét', selectedDay = 'Hétfő';
const days = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
const mealLabels = { breakfast: 'Reggeli', lunch: 'Ebéd', snack: 'Uzsonna / Kisétkezés', dinner: 'Vacsora' };
const $ = id => document.getElementById(id);

fetch('recipes.json')
  .then(r => r.json())
  .then(data => {
    weeks = data;
    init();
  })
  .catch(() => {
    $('plannerMealCards').innerHTML = '<p class="empty">A receptadatok nem tölthetők be.</p>';
  });

function init() {
  $('daySelect').innerHTML = days.map(d => `<option>${d}</option>`).join('');
  $('daySelect').value = selectedDay;
  
  populatePlannerSelects();
  updatePlanner();
  renderMenu();
  renderShoppingDays();
  renderAll();
}

function getAllRecipes() {
  return weeks.flatMap(w => w.recipes || []);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function sections(r) {
  if (!r || !r.content) return { ing: [], prep: [] };
  let ing = [], prep = [], mode = 'ingredients';
  for (const line of r.content) {
    if (/^elkészítés|^👨‍🍳 elkészítés|^👨‍🍳/i.test(line)) {
      mode = 'prep';
      if (!/^elkészítés/i.test(line)) prep.push(line);
      continue;
    }
    if (/^hozzávalók/i.test(line)) {
      mode = 'ingredients';
      continue;
    }
    if (/^uzsonnák/i.test(line)) continue;
    if (mode === 'ingredients') ing.push(line);
    else prep.push(line);
  }
  return { ing: ing.filter(Boolean), prep: prep.filter(Boolean) };
}

/* NAPI MENÜÉPÍTŐ LOGIKA */
function populatePlannerSelects() {
  const all = getAllRecipes();
  
  const breakfasts = all.filter(r => r.meal === 'breakfast');
  const lunches = all.filter(r => r.meal === 'lunch');
  const snacks = all.filter(r => r.meal === 'snack');
  const dinners = all.filter(r => r.meal === 'dinner');

  const makeOptions = (arr, defaultIndex = 0) => {
    return arr.map((r, i) => `<option value="${r.id}" ${i === defaultIndex ? 'selected' : ''}>${r.week} - ${r.day}: ${r.title.replace(/^(Vasárnap|Hétfői?|Kedd|Szerda|Csütörtök|Péntek|Szombat)(i)?\s*(reggeli|vacsora|ebéd)?\s*[–-]?\s*/i, '')} (${r.kcal ? r.kcal + ' kcal' : 'kb. 150 kcal'})</option>`).join('');
  };

  $('plannerBreakfast').innerHTML = makeOptions(breakfasts, 0);
  $('plannerLunch').innerHTML = makeOptions(lunches, 0);
  $('plannerSnack').innerHTML = '<option value="">-- Nincs uzsonna kiválasztva --</option>' + makeOptions(snacks, 0);
  $('plannerDinner').innerHTML = makeOptions(dinners, 0);
}

function updatePlanner() {
  const all = getAllRecipes();
  const bId = $('plannerBreakfast').value;
  const lId = $('plannerLunch').value;
  const sId = $('plannerSnack').value;
  const dId = $('plannerDinner').value;

  const bRecipe = all.find(r => r.id === bId);
  const lRecipe = all.find(r => r.id === lId);
  const sRecipe = all.find(r => r.id === sId);
  const dRecipe = all.find(r => r.id === dId);

  const selectedList = [bRecipe, lRecipe, sRecipe, dRecipe].filter(Boolean);

  // Kalória összegzése
  let totalKcal = 0;
  selectedList.forEach(r => {
    if (r.kcal) totalKcal += r.kcal;
    else if (r.meal === 'snack') totalKcal += 150;
  });

  $('plannerTotalKcal').textContent = totalKcal;
  $('plannerMealCount').textContent = `${selectedList.length} étkezés kiválasztva a napi menüben`;

  // Kártyák megjelenítése
  $('plannerMealCards').innerHTML = selectedList.map(r => `
    <article class="meal-card">
      <div class="meal-top">
        <span>${mealLabels[r.meal] || 'Étkezés'} (${r.week})</span>
        <span class="kcal">${r.kcal ? r.kcal + ' kcal' : '150 kcal'}</span>
      </div>
      <h3>${esc(r.title)}</h3>
      <button class="button secondary" onclick="openRecipe('${r.id}')">Recept és Elkészítés</button>
    </article>
  `).join('');

  // Automatikus aznapi bevásárlólista előállítása
  generatePlannerShoppingList(selectedList);
}

function generatePlannerShoppingList(recipes) {
  const container = $('plannerShoppingList');
  let ingredients = [];

  recipes.forEach(r => {
    const s = sections(r);
    s.ing.forEach(line => {
      const clean = line.replace(/^[1 adag|Hozzávalók|👨‍🍳|🛒]+\s*/i, '').trim();
      if (clean && !/^(1 adag|hozzávalók|elkészítés)/i.test(clean)) {
        ingredients.push(clean);
      }
    });
  });

  if (!ingredients.length) {
    container.innerHTML = '<p class="empty">Nincs elérhető hozzávaló.</p>';
    return;
  }

  // Összevonjuk a duplikált sorokat
  const countMap = new Map();
  ingredients.forEach(item => {
    const key = item.toLocaleLowerCase('hu-HU');
    if (!countMap.has(key)) countMap.set(key, { raw: item, count: 0 });
    countMap.get(key).count++;
  });

  const list = [...countMap.values()];

  container.innerHTML = list.map((x, i) => `
    <label class="shop-row">
      <input type="checkbox">
      <span>${esc(x.raw)}${x.count > 1 ? ` <small>(${x.count}x)</small>` : ''}</span>
    </label>
  `).join('');

  container.querySelectorAll('.shop-row input').forEach(cb => {
    cb.addEventListener('change', () => cb.parentElement.classList.toggle('done', cb.checked));
  });
}

function copyPlannerList() {
  const rows = [...document.querySelectorAll('#plannerShoppingList .shop-row span')];
  if (!rows.length) return;
  const text = "Aznapi Menü Bevásárlólistája:\n" + rows.map(r => "- " + r.innerText).join('\n');
  navigator.clipboard?.writeText(text).then(() => {
    const btn = $('copyPlannerListBtn');
    btn.textContent = ' Másolva!';
    setTimeout(() => btn.textContent = '📋 Lista Másolása', 2000);
  });
}

/* HETI MENÜ NÉZET LOGIKA */
function recipesFor(week, day) {
  return (weeks.find(w => w.name === week)?.recipes || []).filter(r => r.day === day || (r.meal === 'snack' && r.day === 'Minden nap'));
}

function getKcal(r) {
  return typeof r.kcal === 'number' ? r.kcal : null;
}

function renderMenu() {
  selectedWeek = $('weekSelect').value;
  selectedDay = $('daySelect').value;
  const rs = recipesFor(selectedWeek, selectedDay);
  const meals = ['breakfast', 'lunch', 'snack', 'dinner'];
  let total = 0, count = 0;
  for (const m of meals) {
    const r = rs.find(x => x.meal === m);
    if (r && getKcal(r) !== null) {
      total += r.kcal;
      count++;
    }
  }

  $('daySummary').innerHTML = `
    <div>
      <strong>${selectedDay} · ${selectedWeek}</strong>
      <small>${count} recept kalóriaértéke szerepel a napi összegben</small>
    </div>
    <div class="big">${total} <small style="display:inline;color:#d5e7df">kcal</small></div>
  `;

  $('mealGrid').innerHTML = meals.map(m => {
    const r = rs.find(x => x.meal === m);
    return `
      <article class="meal-card">
        <div class="meal-top">
          <span>${mealLabels[m]}</span>
          <span>${r && getKcal(r) !== null ? r.kcal + ' kcal' : (m === 'snack' ? '120–200 kcal' : 'Nincs megadva')}</span>
        </div>
        ${r ? `<h3>${esc(r.title.replace(/^(Vasárnap|Hétfői?|Kedd|Szerda|Csütörtök|Péntek|Szombat)(i)?\s*(reggeli|vacsora)?\s*[–-]?\s*/i, ''))}</h3>
        <button class="button secondary" onclick="openRecipe('${r.id}')">Recept megnyitása</button>` : `
        <h3>Nincs külön megadott recept</h3>
        <p class="hint">Ehhez a naphoz a dokumentum nem tartalmazott ilyen étkezést.</p>`}
      </article>
    `;
  }).join('');
}

function openRecipe(id) {
  const r = getAllRecipes().find(x => x.id === id);
  if (!r) return;
  const s = sections(r);
  $('dialogMeta').textContent = `${r.week} · ${r.day} · ${mealLabels[r.meal] || 'Recept'}${r.kcal !== null ? ' · ' + r.kcal + ' kcal' : ''}`;
  $('dialogTitle').textContent = r.title;
  $('dialogBody').innerHTML = `
    ${s.ing.length ? '<h3>Hozzávalók</h3><ul class="ingredients">' + s.ing.map(x => `<li><label><input type="checkbox">${esc(x)}</label></li>`).join('') + '</ul>' : ''}
    ${s.prep.length ? '<h3>Elkészítés és megjegyzések</h3>' + s.prep.map(x => `<p>${esc(x)}</p>`).join('') : '<div class="notice">A forrásdokumentumban ehhez a recepthez nem találtam külön elkészítési leírást.</div>'}
  `;
  $('recipeDialog').showModal();
}
window.openRecipe = openRecipe;

function renderShoppingDays() {
  $('shoppingDays').innerHTML = days.map(d => `<label><input type="checkbox" value="${d}" checked> ${d}</label>`).join('');
}

function ingredientLines(r) {
  return sections(r).ing.filter(line => {
    const l = line.toLowerCase();
    if (/^(adag|1 adag|hozzávalók|a töltelékhez|a lepényhez|öntet|köret|fűszerek|tetejére|elkészítés|édes:|sós:)/i.test(l)) return false;
    return /\d|só|bors|fokhagyma|oregánó|petrezselyem|citromlé|vanília|eritrit|fahéj|rozmaring|kapor|menta|víz|mustár|almaecet|olaj|fűszer/i.test(l);
  });
}

function makeShopping() {
  const picked = [...$('shoppingDays').querySelectorAll('input:checked')].map(x => x.value);
  const selected = [];
  for (const d of picked) {
    const rs = recipesFor(selectedWeek, d).filter(r => r.meal !== 'snack');
    for (const r of rs) {
      for (const line of ingredientLines(r)) {
        selected.push(line);
      }
    }
  }
  const groups = new Map();
  for (const raw of selected) {
    const key = raw.toLocaleLowerCase('hu-HU').replace(/\s+/g, ' ');
    if (!groups.has(key)) groups.set(key, { raw, count: 0 });
    groups.get(key).count++;
  }
  const list = [...groups.values()].sort((a, b) => a.raw.localeCompare(b.raw, 'hu'));
  
  $('shoppingResult').innerHTML = `
    <div class="shopping-group">
      <h3>${selectedWeek} · ${picked.length} kiválasztott nap · ${list.length} tétel</h3>
      ${list.length ? list.map(x => `<label class="shop-row"><input type="checkbox"><span>${esc(x.raw)}${x.count > 1 ? ` <small>(${x.count} receptben)</small>` : ''}</span></label>`).join('') : '<p>Nincs hozzávaló. Válassz ki legalább egy napot.</p>'}
      <button id="copyList" class="button secondary" style="margin-top:12px;">Minden tétel másolása</button>
    </div>
  `;
  const b = $('copyList');
  if (b) b.onclick = () => {
    const text = list.map(x => `${x.raw}${x.count > 1 ? ' (' + x.count + ' receptben)' : ''}`).join('\n');
    navigator.clipboard?.writeText(text).then(() => b.textContent = 'Másolva!');
  };
  $('shoppingResult').querySelectorAll('.shop-row input').forEach(cb => cb.addEventListener('change', () => cb.parentElement.classList.toggle('done', cb.checked)));
}

function renderAll() {
  const q = ($('searchBox')?.value || '').toLocaleLowerCase('hu');
  const arr = getAllRecipes().filter(r => (`${r.title} ${r.week} ${r.day} ${(r.content||[]).join(' ')}`).toLocaleLowerCase('hu').includes(q));
  $('recipeList').innerHTML = arr.map(r => `
    <article class="recipe-item">
      <p>${r.week} · ${r.day} · ${mealLabels[r.meal] || 'Recept'}${r.kcal ? ' · ' + r.kcal + ' kcal' : ''}</p>
      <h3>${esc(r.title)}</h3>
      <button class="button secondary" onclick="openRecipe('${r.id}')">Recept megnyitása</button>
    </article>
  `).join('');
}

/* TAB KAPCSOLÓK */
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => {
  currentView = b.dataset.view;
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === b));
  ['planner', 'menu', 'shopping', 'all'].forEach(v => $(`${v}View`).classList.toggle('hidden', v !== currentView));
}));

$('weekSelect').addEventListener('change', () => { selectedWeek = $('weekSelect').value; renderMenu(); });
$('daySelect').addEventListener('change', renderMenu);
$('makeList').addEventListener('click', makeShopping);
$('searchBox').addEventListener('input', renderAll);
$('closeDialog').addEventListener('click', () => $('recipeDialog').close());
$('recipeDialog').addEventListener('click', e => { if (e.target === $('recipeDialog')) $('recipeDialog').close(); });

/* PWA INSTALL HANDLER */
let installPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installPrompt = e;
  $('installBtn').classList.remove('hidden');
});
$('installBtn').addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  $('installBtn').classList.add('hidden');
});
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
