import {test,expect} from '@playwright/test';
async function canvasFits(page){return page.locator('.canvas-space').evaluate(v=>{const p=v.getBoundingClientRect(),c=v.querySelector('canvas').getBoundingClientRect();return c.left>=p.left-1&&c.top>=p.top-1&&c.right<=p.right+1&&c.bottom<=p.bottom+1;});}
test('short screens fit the canvas and scroll tools and previews independently',async({page})=>{
 await page.setViewportSize({width:1280,height:650});await page.goto('/');await expect(page.locator('#canvas')).toHaveAttribute('data-fit-mode','true');await expect.poll(()=>canvasFits(page)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(650);const before=await page.locator('#canvas').boundingBox();
 expect(await page.locator('#toolsPanel').evaluate(e=>e.scrollHeight>e.clientHeight)).toBe(true);await page.locator('#toolsPanel').evaluate(e=>e.scrollTop=300);expect(await page.locator('#toolsPanel').evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
 expect(await page.locator('#previews').evaluate(e=>e.scrollHeight>e.clientHeight)).toBe(true);await page.locator('#previews').evaluate(e=>e.scrollTop=300);
 const after=await page.locator('#canvas').boundingBox();expect(after.y).toBeCloseTo(before.y,0);expect(await page.evaluate(()=>window.scrollY)).toBe(0);
 const small=Number(await page.locator('#canvas').getAttribute('data-zoom'));await page.setViewportSize({width:1280,height:900});await expect.poll(async()=>Number(await page.locator('#canvas').getAttribute('data-zoom'))).toBeGreaterThan(small);
 await page.locator('#zoomIn').click();const manual=await page.locator('#canvas').getAttribute('data-zoom');await page.setViewportSize({width:1280,height:650});await page.waitForTimeout(100);await expect(page.locator('#canvas')).toHaveAttribute('data-zoom',manual);await expect(page.locator('#canvas')).toHaveAttribute('data-fit-mode','false');
 await page.locator('#fitView').click();await expect.poll(()=>canvasFits(page)).toBe(true);await expect(page.locator('#canvas')).toHaveAttribute('data-fit-mode','true');
 await page.screenshot({path:'/private/tmp/flexagon-viewport-fit.png',fullPage:true});
});
