import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test('paint shares pats, undo works, projects round-trip and PDF has two pages',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await expect(page.locator('#canvas')).toHaveAttribute('data-brush-engine','libmypaint');
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
 const projectDownload=page.waitForEvent('download');await page.locator('#saveProject').click();const project=await projectDownload;const file=await project.path();const json=JSON.parse(await readFile(file,'utf8'));expect(json.banks.hexahexa).toHaveLength(36);expect(json.orientation).toBe(1);
 await page.locator('#model').selectOption('trihexa');await expect(page.locator('.preview')).toHaveCount(6);
 await page.locator('#projectFile').setInputFiles(file);await expect(page.locator('#model')).toHaveValue('hexahexa');await expect(page.locator('#orientationTitle')).toHaveText('Orientation B');
 const legacy={...json,model:'hexa',banks:{hexa:json.banks.hexahexa}};
 await page.locator('#projectFile').setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});
 await expect(page.locator('#model')).toHaveValue('hexahexa');
 await expect(page.locator('#saveStatus')).toHaveText('Project opened');
 await page.locator('#export').click();const pdfDownload=page.waitForEvent('download');await page.locator('#downloadPDF').click();const pdf=await pdfDownload;const bytes=await readFile(await pdf.path());expect(bytes.toString('latin1')).toContain('/Count 2');expect(bytes.subarray(0,4).toString()).toBe('%PDF');expect(errors).toEqual([]);
 await page.screenshot({path:'/private/tmp/flexagon-studio-desktop.png',fullPage:true});
});
test('transparent image placement and all model switches',async({page})=>{
 await page.goto('/');const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=100;const ctx=c.getContext('2d');ctx.fillStyle='#c64d42';ctx.fillRect(20,20,60,60);return c.toDataURL().split(',')[1];});
 await page.locator('#imageFile').setInputFiles({name:'transparent.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await expect(page.locator('#imageControls')).toBeVisible();await page.locator('#imageScale').fill('55');await page.locator('#imageRotation').fill('45');await page.locator('#placeImage').click();await expect(page.locator('#imageControls')).toBeHidden();await expect(page.locator('#undo')).toBeEnabled();
 for(const [id,count] of [['tetra',8],['trihexa',6],['hexahexa',18]]){await page.locator('#model').selectOption(id);await expect(page.locator('.preview')).toHaveCount(count);if(id!=='hexahexa'){await page.locator('#export').click();await page.locator('#paper').selectOption('letter');const downloaded=page.waitForEvent('download');await page.locator('#downloadPDF').click();const pdf=await downloaded;expect((await readFile(await pdf.path())).toString('latin1')).toContain('/Count 2');}}
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
 const blank=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=512;return c.toDataURL();});expect(project.banks.hexahexa.every(data=>data===blank)).toBe(true);
 await page.locator('#sampleDesign').uncheck();await expect.poll(()=>page.locator('#canvas').evaluate(c=>c.toDataURL())).toBe(original);
 for(const id of ['tetra','trihexa']){await page.locator('#model').selectOption(id);const before=await page.locator('#canvas').evaluate(c=>c.toDataURL());await page.locator('#sampleDesign').check();await expect.poll(()=>page.locator('#canvas').evaluate(c=>c.toDataURL())).not.toBe(before);await page.locator('#sampleDesign').uncheck();await expect.poll(()=>page.locator('#canvas').evaluate(c=>c.toDataURL())).toBe(before);}
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
test('export defaults to Letter with no glue flap for a taped joint',async({page})=>{
 await page.goto('/');await page.locator('#export').click();
 await expect(page.locator('#paper')).toHaveValue('letter');
 await expect(page.locator('#addGlueFlap')).not.toBeChecked();
 const downloaded=page.waitForEvent('download');await page.locator('#downloadPDF').click();const pdf=await downloaded;
 const bytes=(await readFile(await pdf.path())).toString('latin1');
 expect(bytes).toContain('/Count 2');expect(bytes).toContain('Join the ends with tape');
 expect(bytes).toMatch(/\/MediaBox\s*\[0 0 792(?:\.0*)? 612(?:\.0*)?\]/);
});
test('glue option exports two sheets for every model',async({page})=>{
 await page.goto('/');
 for(const model of ['tetra','trihexa','hexahexa']){
  await page.locator('#model').selectOption(model);await page.locator('#export').click();
  await expect(page.locator('#paper')).toHaveValue('letter');await page.locator('#addGlueFlap').check();
  const downloaded=page.waitForEvent('download');await page.locator('#downloadPDF').click();const pdf=await downloaded;
  const data=(await readFile(await pdf.path())).toString('latin1');expect(data).toContain('/Count 2');expect(data).toContain('Blank end pats: glue flaps');
  await expect(page.locator('#dialog')).not.toBeVisible();
 }
});
test('libmypaint WASM renders each brush and erases actual artwork',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const loaded=page.waitForResponse(r=>r.url().endsWith('/brushlib.wasm'));
 await page.goto('/');const wasm=await loaded;expect(wasm.status()).toBe(200);expect((await wasm.body()).subarray(0,4).toString('hex')).toBe('0061736d');
 await expect(page.locator('#canvas')).toHaveAttribute('data-brush-engine','libmypaint');
 const box=await page.locator('#canvas').boundingBox();
 for(const tool of ['ink','pencil','wash']){
  if(tool==='ink')await page.locator('[data-tool=ink]').click();else{await page.locator('#brushPickerButton').click();await page.locator(`[data-preset=${tool}]`).click();}const before=await page.locator('.preview canvas').first().evaluate(c=>c.toDataURL());
  await page.mouse.move(box.x+box.width*.4,box.y+box.height*.4);await page.mouse.down();await page.mouse.move(box.x+box.width*.6,box.y+box.height*.4,{steps:12});await page.mouse.up();
  await expect.poll(()=>page.locator('.preview canvas').first().evaluate(c=>c.toDataURL())).not.toBe(before);
 }
 await page.locator('[data-tool=eraser]').click();await page.locator('#size').fill('100');const before=await page.locator('.preview canvas').first().evaluate(c=>c.toDataURL());
 await page.mouse.move(box.x+box.width*.38,box.y+box.height*.4);await page.mouse.down();await page.mouse.move(box.x+box.width*.62,box.y+box.height*.4,{steps:15});await page.mouse.up();
 await expect.poll(()=>page.locator('.preview canvas').first().evaluate(c=>c.toDataURL())).not.toBe(before);expect(errors).toEqual([]);
});
test('lasso moves pixels and copies between faces with undo',async({page})=>{
 await page.goto('/');
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=100;const ctx=c.getContext('2d');ctx.fillStyle='#ed3421';ctx.fillRect(20,20,60,60);return c.toDataURL().split(',')[1];});
 await page.locator('#imageFile').setInputFiles({name:'red.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await expect(page.locator('#imageControls')).toBeVisible();await page.locator('#imageScale').fill('40');await page.locator('#placeImage').click();
 await page.locator('[data-tool=lasso]').click();await page.evaluate(()=>new Promise(requestAnimationFrame));
 const box=await page.locator('#canvas').boundingBox(),at=(x,y)=>({x:box.x+x*box.width/720,y:box.y+y*box.height/720});
 const pixel=(x,y)=>page.locator('#canvas').evaluate((c,[x,y])=>Array.from(c.getContext('2d').getImageData(x,y,1,1).data),[x,y]);
 const a=at(280,280);await page.mouse.move(a.x,a.y);await page.mouse.down();for(const [x,y] of [[440,280],[440,440],[280,440],[280,280]]){const p=at(x,y);await page.mouse.move(p.x,p.y,{steps:4});}await page.mouse.up();await expect(page.locator('#copySelection')).toBeEnabled();
 const from=at(350,345),to=at(450,345);await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});await page.mouse.up();
 await expect.poll(()=>pixel(450,345)).toEqual([237,52,33,255]);await expect.poll(()=>pixel(350,345)).toEqual([255,254,249,255]);
 await page.locator('#copySelection').click();await page.locator('.preview').nth(2).click();await page.locator('#pasteSelection').click();await expect.poll(()=>pixel(350,345)).toEqual([237,52,33,255]);
 await page.locator('#undo').click();await expect.poll(()=>pixel(350,345)).toEqual([255,254,249,255]);await page.locator('#redo').click();await expect.poll(()=>pixel(350,345)).toEqual([237,52,33,255]);
});
test('libmypaint supports a single-click dot',async({page})=>{
 await page.goto('/');await expect(page.locator('#canvas')).toHaveAttribute('data-brush-engine','libmypaint');
 const before=await page.locator('.preview canvas').first().evaluate(c=>c.toDataURL()),box=await page.locator('#canvas').boundingBox();
 await page.mouse.click(box.x+box.width*.5,box.y+box.height*.4);
 await expect.poll(()=>page.locator('.preview canvas').first().evaluate(c=>c.toDataURL())).not.toBe(before);
});
