RECEPTTÁR PWA – első verzió

Tartalom:
- Heti menü a két feltöltött Word-dokumentumból
- Recept részletei, hozzávalók kipipálásával és elkészítési leírással
- Napi kalóriaösszeg (csak a dokumentumban megadott értékekből)
- Heti bevásárlólista, kiválasztott napok alapján
- Receptkeresés
- PWA manifest és offline gyorsítótár

FONTOS A TELEPÍTÉSHEZ:
A PWA telepítéséhez HTTPS-en (vagy localhoston) kell megnyitni. A ZIP-ben lévő fájlokat tedd fel például egy saját GitHub Pages vagy Netlify oldalra, majd Androidon Chrome-ban nyisd meg az oldalt és válaszd a „Telepítés” / „Hozzáadás a kezdőképernyőhöz” lehetőséget. A fájlok közvetlen, file:// megnyitása a telepítést és az offline módot nem biztosítja.

A harmadik dokumentum később a recipes.json fájlba illeszthető be az alkalmazás újratervezése nélkül. A jelenlegi adatok megőrzik a forrás szövegezését; az eltérő/hiányzó adatok nincsenek automatikusan kijavítva. Az „Őszi sütőtökös brownie” recept a dokumentum szerint egy külön „Süti receptek” oldalra hivatkozik, amely nem volt a két forrásfájl között.

Ez egy első prototípus: a bevásárlólista az azonos szövegű hozzávalókat vonja össze, nem végez okos mértékegység-átváltást. A receptadatok és a megadott kalóriaértékek nem dietetikai ellenőrzés eredményei.
