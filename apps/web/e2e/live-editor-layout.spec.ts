import { expect, test } from '@playwright/test';

test.describe('live editor viewport lock', () => {
  test('scrolls workspace with tab-edge scrollbar; chrome stays fixed', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      sessionStorage.setItem('shaqyru.live-editor.guided-v1', '1');
    });
    await page.goto('/invitations/edit?template=wedding-luxury', {
      waitUntil: 'networkidle',
    });
    await page.waitForSelector('[data-testid="live-editor-preview"]');
    await page.waitForSelector('[data-testid="live-editor-stage"]');
    await page.waitForSelector('[data-testid="live-editor-steps"]');

    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const frame = document.querySelector('.live-editor-phone__frame');
      const stage = document.querySelector('.live-editor-stage');
      const shell = document.querySelector('.live-editor-shell');
      const topbar = document.querySelector('.live-editor-topbar');
      const rail = document.querySelector('[data-testid="live-editor-scroll-rail"]');
      if (!frame || !stage || !shell || !topbar) {
        throw new Error('live editor pieces missing');
      }
      const fr = frame.getBoundingClientRect();
      const stRect = stage.getBoundingClientRect();
      const st = getComputedStyle(stage);
      return {
        hasHScroll: doc.scrollWidth > doc.clientWidth + 1,
        hasDocVScroll: doc.scrollHeight > doc.clientHeight + 1,
        centerDelta: Math.round(fr.left + fr.width / 2 - (stRect.left + stRect.width / 2)),
        stageOverflowY: st.overflowY,
        stageCanScroll: stage.scrollHeight > stage.clientHeight + 20,
        hasPhoneRail: Boolean(rail),
        topbarY: Math.round(topbar.getBoundingClientRect().top),
        phoneViewportOverflowY: getComputedStyle(
          document.querySelector('.live-editor-phone__viewport')!,
        ).overflowY,
      };
    });

    expect(metrics.hasHScroll, 'no horizontal page scrollbar').toBe(false);
    expect(metrics.hasDocVScroll, 'document itself must not scroll').toBe(false);
    expect(metrics.hasPhoneRail, 'no custom rail glued to phone').toBe(false);
    expect(metrics.stageOverflowY).toMatch(/auto|scroll/);
    expect(metrics.stageCanScroll, 'workspace must be taller than stage').toBe(true);
    expect(metrics.phoneViewportOverflowY).toMatch(/visible|clip/);
    expect(Math.abs(metrics.centerDelta), 'phone centered in stage').toBeLessThan(80);
    expect(metrics.topbarY).toBe(0);

    const before = await page.evaluate(() => ({
      docY: window.scrollY,
      stageY: document.querySelector('.live-editor-stage')?.scrollTop ?? 0,
      topbarY: document.querySelector('.live-editor-topbar')?.getBoundingClientRect().top ?? -1,
    }));

    const box = await page.locator('.live-editor-phone__frame').boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + Math.min(200, box!.height / 2));
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(200);

    const after = await page.evaluate(() => ({
      docY: window.scrollY,
      stageY: document.querySelector('.live-editor-stage')?.scrollTop ?? 0,
      topbarY: document.querySelector('.live-editor-topbar')?.getBoundingClientRect().top ?? -1,
    }));

    expect(after.docY, 'document must not scroll').toBe(before.docY);
    expect(after.stageY, 'stage workspace must scroll').toBeGreaterThan(before.stageY);
    expect(after.topbarY, 'topbar stays fixed').toBe(0);
  });
});
