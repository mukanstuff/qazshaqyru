/**
 * Screenshot a published invitation, opening the envelope first.
 *
 *   node scripts/shot-gate.mjs http://localhost:3000/i/preview-aq-mor out.png
 *
 * `scripts/shot.ts` waits for the canvas stage and gives up on a template
 * whose document sets `envelopeEnabled`: the gate is all there is until a
 * guest taps it, so the capture comes back as 844px of envelope plus the note
 * "no canvas stage found". Correct behaviour for that script, and useless for
 * reviewing the template behind the gate.
 *
 * Also forces every scroll-triggered entrance into its finished state and
 * walks the page once so lazy images decode, since a full-page shot otherwise
 * captures a column of held first frames.
 */
import { chromium } from '@playwright/test';
const [url, out] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(3000);
// Wait for the gate rather than sampling at a fixed moment: the canvas is
// fetched after hydration, so at 3s the button sometimes exists and sometimes
// does not, and a miss silently produces an 844px screenshot of an envelope.
const btn = p.locator('button', { hasText: /ашу|Открыть/ }).first();
let gated = false;
try { await btn.waitFor({ state: 'visible', timeout: 8000 }); gated = true; } catch {}
if (gated) { await btn.click({ force: true }); await p.waitForTimeout(3000); }
await p.evaluate(async () => {
  document.querySelectorAll('.canvas-anim').forEach(e => e.classList.add('is-visible'));
  const h = document.body.scrollHeight;
  for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); }
  window.scrollTo(0, 0);
});
// `HTMLImageElement.decode()` never settles for an image the browser has not
// started loading — a lazy frame still below the fold, or one whose src 404s.
// `Promise.all` over those hangs the script forever with no output, which is
// the "Playwright periodically freezes" in the handoff: it was this line, not
// Playwright. Racing it against a timer bounds the wait.
await p.evaluate(() => Promise.race([
  Promise.all([...document.images].map(i => i.complete ? null : i.decode().catch(() => {}))),
  new Promise(r => setTimeout(r, 5000)),
]));
await p.waitForTimeout(1200);
await p.screenshot({ path: out, fullPage: true });
console.log('saved', out, await p.evaluate(() => document.body.scrollHeight) + 'px');
await b.close();
