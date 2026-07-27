// Prova el camí de codi NOU (fix de Hacker News) en un Edge controlat.
//
// És l'única part del diff que no s'havia executat mai en viu: getPageContent()
// sobre un fil de HN crida fetchLinkedArticleText(), que ara descarrega
// l'article al context del sidebar i l'analitza amb Readability allà mateix.
// Aquí es fa amb un temps màxim i mesurant el heap, per veure si aquest camí
// bloqueja el fil principal o infla la memòria.
//
// Ús:  node tests/repro-hn-extract.mjs [hnItemId]

import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const extPath = path.join(repoRoot, "build_chromium_dev");
const userDataDir = "D:\\tmp\\edge-hn-profile";
const hnId = process.argv[2] || "48762725";

if (fs.existsSync(userDataDir)) fs.rmSync(userDataDir, { recursive: true, force: true });

const ctx = await chromium.launchPersistentContext(userDataDir, {
    channel: "msedge",
    headless: false,
    args: [
        `--disable-extensions-except=${extPath}`,
        `--load-extension=${extPath}`,
    ],
});

let extId = null;
for (let i = 0; i < 60 && !extId; i++) {
    for (const sw of ctx.serviceWorkers()) {
        const m = sw.url().match(/chrome-extension:\/\/([^/]+)\//);
        if (m) { extId = m[1]; break; }
    }
    if (!extId) await new Promise(r => setTimeout(r, 200));
}
if (!extId) { console.error("No s'ha trobat l'extension ID"); await ctx.close(); process.exit(1); }

// 1) Pestanya del fil de HN. Ha de quedar com a pestanya ACTIVA, perquè
//    getPageContent() fa tabs.query({active:true}).
const hnUrl = `https://news.ycombinator.com/item?id=${hnId}`;
const hnPage = await ctx.newPage();
try {
    await hnPage.goto(hnUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    console.log(`HN carregat: ${await hnPage.title()}`);
} catch (e) {
    console.error(`No s'ha pogut carregar ${hnUrl}: ${e.message}`);
    console.error("Sense xarxa cap a HN no es pot provar aquest camí.");
    await ctx.close();
    process.exit(1);
}

// 2) Pàgina del side panel (en segon pla dins la mateixa finestra).
const sp = await ctx.newPage();
sp.on("console", m => console.log(`  console[${m.type()}] ${m.text().slice(0, 250)}`));
sp.on("pageerror", e => console.log(`  PAGEERROR ${e.message.slice(0, 250)}`));
await sp.goto(`chrome-extension://${extId}/sidebar/sidebar.html`, { waitUntil: "load", timeout: 30000 });
console.log("side panel carregat.");

// 3) La pestanya de HN passa a davant, així queda com a activa.
await hnPage.bringToFront();
await new Promise(r => setTimeout(r, 500));

const before = await sp.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1);
console.log(`heap del side panel abans: ${before} MB`);

// 4) Executa getPageContent() amb temps màxim, mesurant el bloqueig.
console.log("\nCridant getPageContent() sobre el fil de HN...");
const t0 = Date.now();
let result;
try {
    result = await sp.evaluate(async () => {
        const started = performance.now();
        // getPageContent() retorna { title, text, url }. Viu a window perquè
        // content.js es carrega com a script clàssic al side panel.
        const res = await window.getPageContent();
        const text = res && typeof res.text === "string" ? res.text : "";
        return {
            ms: Math.round(performance.now() - started),
            title: res?.title || "",
            length: text.length,
            hasArticleSection: text.includes("ARTICLE:"),
            head: text.slice(0, 400),
            heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1,
        };
    });
} catch (e) {
    console.error(`getPageContent ha fallat o s'ha encallat: ${e.message}`);
    await ctx.close();
    process.exit(2);
}
const wall = Date.now() - t0;

console.log(`\n--- Resultat ---`);
console.log(`  temps dins la pàgina:  ${result.ms} ms`);
console.log(`  temps wall clock:      ${wall} ms`);
console.log(`  longitud del text:     ${result.length} caràcters`);
console.log(`  conté "ARTICLE:":      ${result.hasArticleSection ? "SÍ" : "NO"}`);
console.log(`  heap després:          ${result.heapMB} MB (abans ${before} MB)`);
console.log(`\n  inici del text:\n${result.head}`);

// 5) El fil principal segueix responent?
const t1 = Date.now();
await sp.evaluate(() => 1);
console.log(`\nresposta del fil principal després: ${Date.now() - t1} ms`);

await ctx.close();
