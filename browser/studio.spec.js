import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test('paint shares pats, undo works, projects round-trip and PDF has two pages',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await expect(page.locator('.preview')).toHaveCount(18);
 const otherBefore=await page.locator('.preview canvas').nth(1).evaluate(c=>c.toDataURL());
 const before=await page.locator('.preview canvas').first().evaluate(c=>c.toDataURL());
 const box=await page.locator('#canvas').boundingBox();
 await page.mouse.move(box.x+box.width*.5,box.y+box.height*.35);await page.mouse.down();await page.mouse.move(box.x+box.width*.65,box.y+box.height*.45,{steps:12});await page.mouse.up();
 await expect.poll(()=>page.locator('.preview canvas').first().evaluate(c=>c.toDataURL())).not.toBe(before);
 await expect.poll(()=>page.locator('.preview canvas').nth(1).evaluate(c=>c.toDataURL())).not.toBe(otherBefore);
 const painted=await page.locator('.preview canvas').first().evaluate(c=>c.toDataURL());
 await page.locator('#undo').click();await expect.poll(()=>page.locator('.preview canvas').first().evaluate(c=>c.toDataURL())).toBe(before);
 await page.locator('#redo').click();await expect.poll(()=>page.locator('.preview canvas').first().evaluate(c=>c.toDataURL())).toBe(painted);
 await page.locator('.preview').nth(1).click();await expect(page.locator('#orientationTitle')).toHaveText('Orientation B');
 const projectDownload=page.waitForEvent('download');await page.locator('#saveProject').click();const project=await projectDownload;const file=await project.path();const json=JSON.parse(await readFile(file,'utf8'));expect(json.banks.hexa).toHaveLength(36);expect(json.orientation).toBe(1);
 await page.locator('#model').selectOption('tri');await expect(page.locator('.preview')).toHaveCount(6);
 await page.locator('#projectFile').setInputFiles(file);await expect(page.locator('#model')).toHaveValue('hexa');await expect(page.locator('#orientationTitle')).toHaveText('Orientation B');
 await page.locator('#export').click();const pdfDownload=page.waitForEvent('download');await page.locator('#downloadPDF').click();const pdf=await pdfDownload;const bytes=await readFile(await pdf.path());expect(bytes.toString('latin1')).toContain('/Count 2');expect(bytes.subarray(0,4).toString()).toBe('%PDF');expect(errors).toEqual([]);
 await page.screenshot({path:'/private/tmp/flexagon-studio-desktop.png',fullPage:true});
});
test('transparent image placement and all model switches',async({page})=>{
 await page.goto('/');const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=100;const ctx=c.getContext('2d');ctx.fillStyle='#c64d42';ctx.fillRect(20,20,60,60);return c.toDataURL().split(',')[1];});
 await page.locator('#imageFile').setInputFiles({name:'transparent.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await expect(page.locator('#imageControls')).toBeVisible();await page.locator('#imageScale').fill('55');await page.locator('#imageRotation').fill('45');await page.locator('#placeImage').click();await expect(page.locator('#imageControls')).toBeHidden();await expect(page.locator('#undo')).toBeEnabled();
 for(const [id,count] of [['tetra',8],['tri',6],['hexa',18]]){await page.locator('#model').selectOption(id);await expect(page.locator('.preview')).toHaveCount(count);if(id!=='hexa'){await page.locator('#export').click();await page.locator('#paper').selectOption('letter');const downloaded=page.waitForEvent('download');await page.locator('#downloadPDF').click();const pdf=await downloaded;expect((await readFile(await pdf.path())).toString('latin1')).toContain('/Count 2');}}
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);await page.screenshot({path:'/private/tmp/flexagon-studio-mobile.png',fullPage:true});
});
test('sample reference rearranges, toggles off cleanly and never enters saved artwork',async({page})=>{
 await page.goto('/');
 const original=await page.locator('#canvas').evaluate(c=>c.toDataURL());
 await page.locator('#sampleDesign').check();
 await expect.poll(()=>page.locator('#canvas').evaluate(c=>c.toDataURL())).not.toBe(original);
 await expect(page.locator('#saveStatus')).toHaveText('New project');
 const previews=await page.locator('.preview canvas').evaluateAll(cs=>cs.slice(0,2).map(c=>c.toDataURL()));expect(previews[0]).not.toBe(previews[1]);
 const downloaded=page.waitForEvent('download');await page.locator('#saveProject').click();const file=await downloaded;const project=JSON.parse(await readFile(await file.path(),'utf8'));
 const blank=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=512;return c.toDataURL();});expect(project.banks.hexa.every(data=>data===blank)).toBe(true);
 await page.locator('#sampleDesign').uncheck();await expect.poll(()=>page.locator('#canvas').evaluate(c=>c.toDataURL())).toBe(original);
 for(const id of ['tetra','tri']){await page.locator('#model').selectOption(id);const before=await page.locator('#canvas').evaluate(c=>c.toDataURL());await page.locator('#sampleDesign').check();await expect.poll(()=>page.locator('#canvas').evaluate(c=>c.toDataURL())).not.toBe(before);await page.locator('#sampleDesign').uncheck();await expect.poll(()=>page.locator('#canvas').evaluate(c=>c.toDataURL())).toBe(before);}
});
test('panel dividers resize, clamp, persist and support keyboard controls',async({page})=>{
 await page.goto('/');
 const preview=page.locator('#previewPanel'),tools=page.locator('#toolsPanel');
 const start=await preview.boundingBox(),divider=await page.locator('#previewDivider').boundingBox();
 await page.mouse.move(divider.x+3,divider.y+80);await page.mouse.down();await page.mouse.move(divider.x-147,divider.y+80,{steps:8});await page.mouse.up();
 expect((await preview.boundingBox()).width).toBeCloseTo(start.width+150,0);
 const larger=await preview.boundingBox();await page.reload();expect((await preview.boundingBox()).width).toBeCloseTo(larger.width,0);
 await page.locator('#previewDivider').focus();await page.keyboard.press('ArrowLeft');expect((await preview.boundingBox()).width).toBeCloseTo(larger.width+16,0);
 await page.locator('#toolsDivider').focus();const oldTools=await tools.boundingBox();await page.keyboard.press('ArrowRight');expect((await tools.boundingBox()).width).toBeCloseTo(oldTools.width+16,0);
 await page.setViewportSize({width:800,height:900});expect((await page.locator('#canvasPanel').boundingBox()).width).toBeGreaterThanOrEqual(299);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(800);
 await page.setViewportSize({width:390,height:844});await expect(page.locator('#previewDivider')).toBeVisible();const t=await tools.boundingBox(),c=await page.locator('#canvasPanel').boundingBox(),p=await preview.boundingBox();expect(c.y).toBe(t.y);expect(p.y).toBe(t.y);expect(p.x).toBeGreaterThan(c.x);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
});
