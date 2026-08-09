# Backlog de millores

Llista de millores pendents, no prioritzades. Cada entrada inclou context i criteris d'acceptació mínims.

---

## Auditoria funcional 2026-08-09 — bugs pendents

**Context:** auditoria de codi (3 agents en paral·lel, sense navegador) sobre
tot `sidebar/`, `options/`, `shared/`, `background.js`, `ext.js`, contrastant
amb els tests existents (275/275 passaven abans i després). Els fixes clars i
de baix risc ja s'han aplicat (missatge d'estat d'«Actualitzar models»,
migració d'`"anki"` a `applyExtensionOrder`, `.catch()` a `setPanelBehavior`,
fuita de listeners del mapa conceptual). **Fets amb tests de regressió
(2026-08-09):**

- [x] **`abortController` era `null` mentre s'estava generant** (`sidebar.js`).
  Fix: `ctx.setAbortController()` es crida síncronament dins `startSummary`,
  abans del primer `await`, en lloc d'esperar que la promesa es resolgui.
- [x] **Un PDF local "encallat" contaminava resums posteriors**
  (`summary.js`, `sidebar.js`). Fix: `ctx.clearContentPreload()` neteja el
  preload d'un sol ús just després de consumir-lo.
- [x] **Targetes Anki cachejades eren irrecuperables des de l'Historial**
  (`summary.js`, `history.js`). Fix: branca `anki` a `loadHistoryEntry`
  (restaura `renderAnkiPanel`); si el model no retorna targetes vàlides, ja
  no es cacheja i es mostra un avís. Nota: «Genera més»/«Afinar» expliquen
  que no estan disponibles per a targetes reobertes des de l'Historial (no
  hi ha el text original de la pàgina fora d'una sessió de generació activa).

**Fets amb tests de regressió (2026-08-09, segona tanda):**

- [x] **Abort entre models del bucle de fallback** (`summary.js`). Guard
  defensiu afegit (inabastable avui amb el codi actual, però es manté per si
  un futur canvi hi introdueix un `await`). De pas, 2 retorns silenciosos
  reals en avortar durant el fetch de contingut (`if (signal.aborted) return`
  sense missatge) ara mostren "Generació aturada per l'usuari."
- [x] **`sortModelsByPriority` ordena malament els Flash Lite** (`shared/models.js`).
  Decisió (confirmada amb l'usuari): el `DEFAULT_MODEL_ID` sempre surt primer
  al desplegable, independentment de versió.
- [x] **`ensureFavoriteModels` torna a afegir el model per defecte a cada
  càrrega** (`shared/models.js`). Decisió (confirmada amb l'usuari): ja no es
  torna a forçar — si l'usuari el desmarca explícitament, es respecta.
- [x] **Truncament de tokens no es recalcula en canviar de model al fallback**
  (`summary.js`). El truncament ara es recalcula per a CADA model provat
  (`truncateForModel`), no un sol cop per al model preferit.
- [x] **Rebuild de l'índex de cache no s'activava si la clau simplement no
  existia** (`sidebar/cache.js`). `get(KEY)` sense valor per defecte + l'índex
  reconstruït es torna a escriure a storage.
- [x] **`summarize-selection` sense text: rebuig de promesa no gestionat**
  (`background.js`). `.catch()` adjuntat a `ext.sidebar.open()` en el moment
  de crear la promesa, no on s'espera més tard.
- [x] **"Genera més"/"Afinar" d'Anki sense guard de re-entrada**
  (`sidebar/anki.js`). Flag de mòdul (`ankiGenerateInFlight`) + `AbortController`
  real en lloc de `undefined`.

**Queda pendent:**

- [ ] **Timeout de 60s no cobreix el cos de l'streaming** (`sidebar/api.js:79-96`),
  només l'espera de capçaleres HTTP. Requereix un timer d'inactivitat que es
  reiniciï a cada chunk, no un deadline únic — més difícil de testejar
  (`t.mock.timers` o timeout injectable).

**Menor / codi mort (no urgent):** `ext.sidebar.close()` sense cap crida
enlloc; icones sense ús a `shared/icons.js`; arbre `<details>` de fallback a
`conceptmap.js` pràcticament inabastable (defensiu, es manté); `closest()`
sobre un resultat potencialment `null` a `options/settings-order.js:63-64`;
`ext` com a nom de variable de loop ombreja l'API global a
`options/settings-sidebar.js:96`; tancament `</UNTRUSTED_CONTENT>` que es pot
truncar en resums molt llargs; flush final del `TextDecoder` no fet a
`sidebar/api.js`; `getDailyStats`/`rpd` (quota diària per model) estan
implementats i testejats però no s'usen enlloc a producció (feature
incompleta, no bug).

**Criteris d'acceptació:** cada ítem es tanca amb un fix + test de
regressió, sense trencar els 275 tests existents.

---

## v2.6.1 — fixes (proper bump)

**Context (2026-06-26):** recollit en tancar la sessió del web propi. **Fixes de codi resolts el 2026-06-29**; queda fer el bump **2.6.1** (patch).

- [x] **Botó «Targetes Anki» desactivat quan hi ha resum a la sidebar:** el botó es desactivava a l'inici de qualsevol generació (`allActionBtns` a `setGeneratingState`) però no es reactivava mai (faltava a la branca `else` i a `resetUI`). Afegit `ankiBtn.disabled = false` als dos llocs + test de regressió. (commit `a95bddb`)
- [x] **Dev a Edge no agafa l'última versió:** el script `dev:chromium` ja generava codi fresc; la causa real era que la carpeta dev tenia el mateix nom i versió que l'extensió de la store ("Resumir" v2.6.0) → impossible distingir-les a Edge (es provava la de la store). Ara `dev:chromium` marca el nom com a **«Resumir (DEV)»**. (commit `6c16064`; vegeu [[chromium-dev-load]].)
- [x] **(procés) Revisió de fitxers esborrables abans del bump** — institucionalitzat com a pas permanent al PRE-RELEASE de `RELEASE-PROCESS.md` (mateix commit `f1f7a6e`, 2026-06-26). Verificat net (2026-08-09): sense `temp/`, `.pw-userdata/`, `test-results/` ni ZIPs solts.

**Criteris d'acceptació:**
- [x] El botó de Targetes Anki s'activa correctament quan hi ha un resum a la sidebar. (verificat en viu a Edge + test unitari; 274/274)
- [x] La build dev a Edge mostra el codi actual i és distingible («Resumir (DEV)»).
- [x] Bump 2.6.1 publicat (seguint RELEASE-PROCESS). ✅ 2026-06-29 (commit `da91ff9` + tag `v2.6.1`)

---

## Fix: Hacker News no enviava el text de l'article enllaçat (✅ VALIDAT EN VIU)

**Context (2026-07-03):** L'usuari va reportar que en resumir un fil de HN només
s'enviava la discussió (comentaris), mai el contingut de l'article enllaçat.

**Causa arrel:** el fetch de l'article es feia dins la funció injectada al
content-script (`extractHackerNewsFromDOM`, món isolated). A Chromium/Edge (MV3)
els `fetch` cross-origin des d'un content-script els bloqueja CORS → el fetch
fallava en silenci → `articleText` sempre buit. El propi codi del fetch de PDF
(`content.js`) ja documentava aquesta limitació i el patró correcte (fetch des
del context del sidebar, amb `<all_urls>`, sense restriccions CORS). El test
antic no ho detectava perquè mockejava `fetch` perquè llancés.

**Fix aplicat:**
- `sidebar/extractors.js`: `extractHackerNewsFromDOM` ara només llegeix el DOM
  (retorna `{ title, comments, articleUrl }`, sense fetch).
- `sidebar/content.js`: nou `fetchLinkedArticleText(url)` que corre al **sidebar**
  (mateix patró que el PDF: fetch directe → si falla, demana `<all_urls>` i
  reintenta). Guard SSRF sobre la URL inicial I la URL final després de seguir
  redireccions (`resp.url`), ja que `redirect: "manual"` trencava els articles
  que redirigeixen (consent/geo/www) i calia permetre `"follow"`.
- Es va descobrir i corregir de pas un bug latent al guard SSRF (màscara de bits
  errònia per a `192.168.0.0/16` i `100.64.0.0/10`, mai detectava aquests
  rangs) — reescrit amb comparació per octets.
- `sidebar/sidebar.html`: carrega `Readability.js` (abans només s'injectava a
  la pàgina; ara cal també al sidebar per parsejar l'article fetchejat allà).
- Tests: 2 tests HN actualitzats al contracte nou + 1 test de regressió SSRF
  (redirecció a IP interna). 275/275 tests, lint net.

**Estat:** codi + tests fets i verificats; build DEV (`build_chromium_dev`)
regenerat. **Validat en viu a Edge** (2026-07-27) amb l'harness
`tests/repro-hn-extract.mjs`, que carrega `build_chromium_dev` a l'Edge real via
Playwright i crida `getPageContent()` sobre un fil de HN de debò. **Fet** (`6105dce`).
Queda només afegir-ho al CHANGELOG al pròxim «prepara vX.Y.Z» (és un canvi visible
per a l'usuari: els resums de HN ara inclouen l'article enllaçat).

**Criteris d'acceptació:**
- [x] Resumir un fil de HN amb article enllaçat (`id=48762725`) inclou la
  secció `ARTICLE:` amb el contingut de l'enllaç, a més de la discussió.
  → 77.017 caràcters, secció `ARTICLE:` present, 2,7 s, heap 3→4 MB.
- [x] No hi ha regressió en fils HN sense article extern (`articleUrl` intern).
  → Ask HN `id=49065668`: cau correctament a «Top Discussion Comments», sense
  secció `ARTICLE:`, 148 ms.
- [x] Commit fet després de validar en viu. → `6105dce`

**Nota — el penjat de RAM d'Edge no era d'aquest fix.** Durant la prova en viu,
carregar l'extensió a l'Edge de l'usuari va penjar la màquina dues vegades. Es va
descartar per mesura directa: l'extensió carregada a l'Edge real dona 337 ms fins
a `load` del side panel, heap de 3-4 MB, ~700 MB en 12 processos estables (normal
per a un Edge nou), cap reinici del service worker i cap error. La causa era
pressió de memòria de la màquina (15,6 GB totals al 78 % d'ús, amb Firefox,
Outlook i dues sessions de Claude Code al damunt): en afegir-hi un Edge nou,
Windows entra en intercanvi a disc i es penja tot. Monitor per si torna a passar:
`D:\tmp\watch-mem.ps1`.

---

## Apuntar els enllaços públics al web propi (PROPER RELEASE)

**Context (2026-06-26):** El web propi ja és viu a **https://xxxaau.github.io/resumir/** (vegeu `web/` i `.github/workflows/pages.yml`). Cal redirigir-hi els enllaços públics que ara apunten a GitHub. El canvi de `settings.html` viatja a l'usuari, així que va **lligat a una release de l'extensió**.

**Estat (2026-06-29):** canvis de codi fets (commit `46b0ac0`); queda l'acció manual a l'AMO durant el release.

- [x] `options/settings.html`: l'enllaç «Com obtinc una clau d'API?» → `https://xxxaau.github.io/resumir/guia/clau-api/` (URL verificada en viu, no 404).
- [x] **AMO**: «Pàgina d'inici» (ara `github.com/xxxaau/resumir`) → el web. (URL de suport i Política de privadesa poden seguir a GitHub.) — **fet manualment al dashboard (confirmat 2026-07-03).**
- [x] `README.md`: afegit badge al lloc web propi.

**Criteris d'acceptació:**
- [x] settings.html i README resolen al web (no 404).
- [x] AMO «Pàgina d'inici» actualitzada al web després del release. ✅ 2026-07-03

---

## Coherència visual dels botons de control del mapa conceptual (✅ FET, 2026-06-26)

**Context (2026-06-05):** Els botons de control del mapa conceptual (sidebar + fullscreen) s'han unificat amb estil planer (32×32, padding 4px, border-radius 4px, hover amb background) per coincidir amb els botons de la toolbar.

**Resolt:**
- [x] Els canvis CSS s'apliquen correctament al sidebar (`.markmap-control-btn`) i al fullscreen (`.markmap-fs-btn`).
- [x] El padding 4px i l'SVG 24×24 donen el mateix aspecte que els botons d'acció del menú de resumir.
- [x] Verificat en local (l'aparent problema era cache del sidebar panel de Firefox).

---

## Renombrar el repositori a `resumir` (✅ COMPLETAT amb v2.6.0, 2026-06-26)

**Context (2026-06-12):** Decisió del propietari: el repo `extensio-resumir-contingut`
passa a dir-se **`resumir`**, alineat amb la marca (vegeu `docs/COMUNICACIO.md`).
Cal fer-ho coordinat amb un bump perquè els manifests publicats duen la
`homepage_url` i els usuaris de Chromium instal·len des de GitHub Releases.

**Inventari d'URLs a actualitzar (51 ocurrències, 18 fitxers — verificat amb
`grep -r "extensio-resumir-contingut"`):**

*Dins de l'extensió (s'envia als usuaris):*
- [x] `manifest.base.json` → `homepage_url` (+ regenerar `manifest.json` i `manifest.chromium.json` amb `npm run manifests:gen`)
- [x] `options/settings.js` → enllaços a issues/repo

*Meta del repo:*
- [x] `package.json` → `repository.url`
- [x] `README.md` → badges (CI, releases, sponsors), enllaços d'instal·lació Chromium i issues/discussions
- [x] `docs/`: `BUILD.md`, `CONTRIBUTING.md`, `MARKETS-COPY.md`, `listing/listing-texts.md`, `marketplace/` (CHROME-STORE, MARKETS-COPY, RELEASE-PROCESS, SUBMISSION-CHECKLIST), `user-guide/GUIA-INICI.md`
- [x] `scripts/prepare-release.mjs`

*Fora del repo (manual):*
- [x] GitHub → Rename a `resumir` (`gh repo rename`, 2026-06-26; GitHub manté redireccions de l'URL antiga per a web i git, però es trenquen si mai es crea un repo nou amb el nom vell — no reutilitzar-lo)
- [x] AMO → panell de l'extensió: Pàgina d'inici, URL de suport i Política de privacitat (actualitzat pel propietari, 2026-06-26)
- [x] Remot local: `git remote set-url origin https://github.com/xxxaau/resumir.git`

**Criteris d'acceptació:**
- [x] `grep -r "extensio-resumir-contingut"` només retorna documents històrics (`.dev/`, `.opencode/plans/`, CHANGELOG) — mai codi, manifests ni docs vius.
- [x] El badge de CI del README funciona amb el nom nou.
- [x] La release del bump següent publica els ZIPs sota el repo renombrat i els enllaços del README hi apunten. (v2.6.0)
- [x] AMO actualitzat amb les URLs noves.

---

## Resum de documents Office online (Word/PowerPoint de SharePoint/OneDrive)

**Context (2026-06-11):** Actualment l'extracció de contingut (`sidebar/content.js`) injecta Readability/Defuddle al DOM de la pàgina i, per a PDFs, els detecta per Content-Type i els processa amb `sidebar/pdf-extract.js`. Els documents Word (`.docx`) i PowerPoint (`.pptx`) oberts online a SharePoint/OneDrive **no funcionen** perquè:

- Es rendereixen dins del **visor web d'Office Online** (Word/PowerPoint for the web), una SPA plena d'iframes on el text no és DOM accessible/seleccionable de forma fiable → Readability/Defuddle no extreuen res útil.
- El fitxer binari real està darrere d'**URLs autenticades** de SharePoint/OneDrive (sessió de l'usuari, no `.docx` directe a la URL) → un `fetch` simple no el recupera, i caldria respectar les credencials.
- Encara que es recuperés el binari, caldria **parsejar el format Office** al client (p. ex. `mammoth.js` per a `.docx`, un parser de `.pptx` per a OOXML), cap dels quals existeix avui al projecte.

**Comportament esperat (proposta):**
- Detectar que la pestanya activa és un visor d'Office Online (patrons d'URL `*.sharepoint.com/.../_layouts/15/Doc.aspx`, `*-my.sharepoint.com`, `officeapps.live.com`, `view.officeapps.live.com`).
- Recuperar el document via l'API autenticada (Microsoft Graph / endpoint de descàrrega de SharePoint) o, com a mínim, oferir un missatge clar que aquest tipus de contingut no és compatible encara.
- Parsejar `.docx`/`.pptx` al client i passar el text pla al pipeline de resum existent.

**Abast tècnic estimat:**
- `vendor/` — afegir parser OOXML (`mammoth` per a docx; avaluar opcions lleugeres per a pptx).
- `sidebar/content.js` — branca de detecció + extracció per a Office Online, anàloga a la del PDF.
- Permisos de host addicionals per als dominis de SharePoint/OneDrive (probablement via `optional_host_permissions`).
- Gestió d'autenticació (cookies de sessió / Graph token) — el punt més incert i possiblement bloquejant en entorns corporatius amb MFA/condicions d'accés.

**Criteris d'acceptació mínims:**
- [ ] Un `.docx` obert a SharePoint es resumeix correctament, o
- [ ] Si no és viable l'extracció, es mostra un missatge específic ("Els documents d'Office online encara no són compatibles") en lloc de l'error genèric de permisos.
- [ ] No hi ha regressió en l'extracció de PDFs ni de pàgines HTML.

**Nota:** sorgit de proves a Edge (sessió 2026-06-11). Cal validar primer si l'entorn corporatiu permet recuperar el binari abans d'invertir en parsers.

---

## Interfície d'usuari multidioma (i18n)

**Context (2026-05-27):** Actualment tota la interfície d'usuari està en català dur — ~200+ cadenes repartides entre ~18 fitxers (3 HTML + 15 JS). No existeix cap infraestructura d'internacionalització: ni `_locales/`, ni `default_locale` als manifests, ni `chrome.i18n`, ni `__MSG__` als HTML.

La decisió d'idioma ja es va identificar com a pendent al TO-DO.md (veure «Decisions estratègiques», punt 3), i el README descriu l'extensió com a catalana. L'objectiu és habilitar contribucions externes d'idiomes i preparar l'extensió per a un públic internacional.

**Comportament esperat:**
- L'extensió detecta l'idioma del navegador i mostra la UI en l'idioma corresponent.
- Si l'idioma del navegador no està disponible, es mostra el català (idioma per defecte).
- Totes les cadenes visibles a la UI són traduïbles: sidebar, settings, visor PDF, botons, etiquetes, missatges d'error, menús contextuals, nom/descripció del manifest.
- Els system prompts de l'IA (`shared/defaults.js`) es mantenen en català (instrueixen la IA en català independentment de l'idioma UI) o es tradueixen segons decisió de disseny.

**Abast:**
- `_locales/ca/messages.json` — traducció catalana (completa)
- `_locales/en/messages.json` — traducció anglesa (completa)
- `_locales/es/messages.json` — traducció castellana (opcional, fase 2)

**Evolució tècnica (proposta):**
1. Crear `_locales/{ca,en}/messages.json` amb totes les claus de traducció.
2. Afegir `"default_locale": "ca"` a tots els manifests (`manifest.base.json`, `manifest.chromium.json`, patches).
3. Substituir cadenes en HTML per `__MSG_*__` (sidebar/sidebar.html, options/settings.html, sidebar/pdf-viewer.html).
4. Afegir `ext.i18n.getMessage(key, ...args)` a `ext.js` com a wrapper cross-browser de `chrome.i18n.getMessage`.
5. Substituir cadenes hardcoded als JS per crides a `ext.i18n.getMessage()`.
6. Decidir el tractament dels system prompts de l'IA (mantenir en català o traduir-los).
7. Actualitzar build pipeline per validar que totes les claus `__MSG__` existeixin als messages.json.

**Criteris d'acceptació:**
- [ ] `_locales/` creat amb `ca` i `en` (mínim).
- [ ] `default_locale` present a tots els manifests.
- [ ] Totes les cadenes UI són substituïdes per claus i18n.
- [ ] L'extensió funciona correctament en navegador configurat en català i en anglès.
- [ ] No hi ha regressió visual ni funcional.
- [ ] Les cadenes noves es poden afegir sense tocar codi (només afegir clau als messages.json).
- [ ] Els tests existents continuen passant (207/207).

**Fitxers probables a modificar:**
- `_locales/ca/messages.json` (nou)
- `_locales/en/messages.json` (nou)
- `ext.js` (wrapper `ext.i18n.getMessage`)
- `sidebar/sidebar.html`, `options/settings.html`, `sidebar/pdf-viewer.html`
- `sidebar/ui.js`, `sidebar/summary.js`, `sidebar/sidebar.js`, `sidebar/history.js`, `sidebar/content.js`, `sidebar/api.js`, `sidebar/pdf-viewer.js`, `sidebar/cache.js`, `background.js`
- `options/settings-options.js`, `options/settings-cache.js`, `options/settings-models.js`
- `shared/content-types.js`
- `manifest.base.json` (+ patches)
- `scripts/pre-release-check.mjs` (validació de claus i18n)

---

## Múltiples proveïdors de models (més enllà de Google Gemini)

**Context (2026-06-19):** Sorgit del testing amb usuaris. Avui l'extensió només
funciona amb Google Gemini i el codi hi està **fortament acoblat, sense cap capa
d'abstracció de proveïdor**:

- `sidebar/api.js:47-71` (`callGeminiStream`) té l'endpoint
  (`generativelanguage.googleapis.com/.../streamGenerateContent?alt=sse`) i el
  format del body hardcoded, amb una branca especial per a Gemma vs Gemini.
- El parsing de la resposta assumeix l'SSE de Gemini i `usageMetadata`
  (`promptTokenCount`, etc.) per al comptatge real de tokens.
- `shared/models.js` (`CURATED_MODELS`) assumeix l'estructura i el pricing de Gemini.
- El fallback automàtic de models (`sidebar/summary.js`) assumeix que tots els
  models són de Gemini.

L'objectiu és donar opció de proveïdors **gratuïts i de pagament** (redueix la
fricció de l'API key de Google, que motiva també la guia d'API key de l'usuari).

**Comportament esperat:**
- L'usuari pot triar el proveïdor a Settings i introduir-hi la seva API key.
- Suport per a proveïdors **compatibles amb l'API d'OpenAI** (cobreix molts d'un
  sol cop: OpenRouter, Groq, Together, locals via Ollama/LM Studio, OpenAI…) a
  més de Gemini.
- El comptatge de tokens i el fallback funcionen per proveïdor.

**Abast tècnic estimat:**
- **Crear una abstracció de proveïdor** (interfície comuna: construir petició,
  fer streaming, parsejar resposta i usage) — `sidebar/api.js`.
- Implementacions: Gemini (existent, refactoritzada) + un adaptador
  "OpenAI-compatible".
- `shared/models.js` — model de dades de models per proveïdor (pricing, context,
  límits) i selecció de proveïdor + model.
- `options/settings-models.js` + `settings.html` — selector de proveïdor i gestió
  de múltiples API keys (`storage.sync`).
- `sidebar/summary.js` — fallback conscient del proveïdor.
- Tests — mockejar les respostes streaming de cada format.

**Cost:** ALT. El **primer** proveïdor nou és el car (dissenyar l'abstracció);
afegir-ne més després és incremental.

**Criteris d'acceptació mínims:**
- [ ] Es pot resumir amb un proveïdor compatible amb OpenAI (a triar) i amb Gemini.
- [ ] El comptatge de tokens i el cost es mostren correctament per al proveïdor actiu.
- [ ] El fallback de models no creua proveïdors de forma incorrecta.
- [ ] No hi ha regressió amb Gemini com a proveïdor per defecte.

---

## Crear plugins propis des de la configuració (prompt + icona)

**Context (2026-06-19):** Sorgit del testing amb usuaris. Avui els plugins són
**estàtics i compilats** (`docs/CREAR-PLUGIN.md`: *"feature toggles estàtic — tots
els plugins estan compilats dins l'extensió. No hi ha descobriment dinàmic"*).
Afegir-ne un requereix 10+ passos repartits en molts fitxers (`sidebar/sidebar.html`,
`sidebar/ui.js`, `shared/defaults.js`, `sidebar/sidebar.js`, `options/*`).

La idea: que l'usuari es pugui crear un plugin **bàsic** des de Settings amb només
un **prompt editable** i una **icona** (seleccionar d'un conjunt o pujar-ne una).

**Comportament esperat:**
- Botó "Crear plugin" a Settings → formulari amb nom, prompt i icona.
- El plugin apareix com un botó més a la toolbar de la sidebar i és
  activable/reordenable com els existents.
- La configuració del plugin és només l'edició del prompt (i nom/icona).

**Abast tècnic estimat:**
- **Migrar de hardcoded a data-driven**: un array de plugins d'usuari
  `{ id, nom, prompt, icona }` a `storage` (sync per a metadades; `local` per a
  les icones, que poden ser pesades).
- **Render dinàmic** dels botons de la toolbar a `sidebar/ui.js` /
  `sidebar/sidebar.html` (avui són estàtics) i de la UI de settings.
- **Icones (net-new, no existeix res avui)**: selector d'un conjunt d'icones
  incloses + pujada d'imatge desada com a **data URI** a `storage.local`
  (validar mida/format; no hi ha cap mecanisme d'imatges custom actualment).
- Reaprofitar la **infra d'edició de prompts** existent (`storage.sync` + textarea).

**Cost:** ALT / MITJÀ-ALT. Refactor estàtic→dinàmic dels plugins + sistema d'icones
de zero. **Bonus:** elimina el procés manual de 10 passos de `CREAR-PLUGIN.md`.

**Criteris d'acceptació mínims:**
- [ ] L'usuari crea un plugin amb nom + prompt + icona des de Settings i apareix a la sidebar.
- [ ] El plugin d'usuari resumeix usant el seu prompt.
- [ ] Es pot editar, reordenar, desactivar i esborrar com els plugins integrats.
- [ ] La icona pujada es desa i es mostra correctament (i no peta el límit de `storage`).
- [ ] No hi ha regressió amb els plugins integrats.
