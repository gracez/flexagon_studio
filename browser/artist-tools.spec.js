import {test,expect} from '@playwright/test';

async function seedImage(page){
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=100;const ctx=c.getContext('2d');ctx.fillStyle='#ed3421';ctx.fillRect(15,20,30,60);ctx.fillStyle='#2255cc';ctx.fillRect(55,20,30,60);return c.toDataURL().split(',')[1];});
 await page.locator('#imageFile').setInputFiles({name:'two-colors.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await expect(page.locator('#imageControls')).toBeVisible();await page.locator('#imageScale').fill('40');await page.locator('#placeImage').click();await expect.poll(()=>pixel(page,325,345)).toEqual([237,52,33,255]);
}
async function canvasPoint(page,x,y){return page.locator('#canvas').evaluate((c,[x,y])=>{const wrap=c.parentElement,rect=wrap.getBoundingClientRect(),z=+c.dataset.zoom||1,r=(+c.dataset.viewRotation||0)*Math.PI/180,s=wrap.clientWidth*z/720,dx=x-360,dy=y-360;return{x:rect.left+rect.width/2+s*(dx*Math.cos(r)-dy*Math.sin(r)),y:rect.top+rect.height/2+s*(dx*Math.sin(r)+dy*Math.cos(r))};},[x,y]);}
async function clickPoint(page,x,y){const p=await canvasPoint(page,x,y);await page.mouse.click(p.x,p.y);}
async function selectRegion(page){
 await page.locator('[data-tool=lasso]').click();const first=await canvasPoint(page,280,280);await page.mouse.move(first.x,first.y);await page.mouse.down();
 for(const [x,y] of [[440,280],[440,440],[280,440],[280,280]]){const p=await canvasPoint(page,x,y);await page.mouse.move(p.x,p.y,{steps:4});}await page.mouse.up();await expect(page.locator('#copySelection')).toBeEnabled();
}
const pixel=(page,x,y)=>page.locator('#canvas').evaluate((c,[x,y])=>Array.from(c.getContext('2d').getImageData(x,y,1,1).data),[x,y]);

test('brush popover offers distinct real-engine previews and category filtering',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('#canvas')).toHaveAttribute('data-brush-engine','libmypaint');
 await page.locator('#brushPickerButton').click();await expect(page.locator('.brush-card')).toHaveCount(13);
 const images=await page.locator('.brush-card canvas').evaluateAll(cs=>cs.map(c=>c.toDataURL()));expect(new Set(images).size).toBeGreaterThan(10);
 await page.locator('#brushCategory').selectOption('Ink');await expect(page.locator('.brush-card')).toHaveCount(3);await page.locator('[data-preset=nib]').click();await expect(page.locator('#currentBrushName')).toHaveText('Chisel nib');await expect(page.locator('#size')).toHaveValue('26');
 const before=await page.locator('.preview canvas').first().evaluate(c=>c.toDataURL());const a=await canvasPoint(page,320,320),b=await canvasPoint(page,420,320);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:12});await page.mouse.up();
 await expect.poll(()=>page.locator('.preview canvas').first().evaluate(c=>c.toDataURL())).not.toBe(before);expect(errors).toEqual([]);
 await page.screenshot({path:'/private/tmp/flexagon-artist-tools.png',fullPage:true});
});

test('zoom, pan and rotation preserve artwork and painting coordinates',async({page})=>{
 await page.goto('/');await seedImage(page);await page.locator('#guides').uncheck();const original=await page.locator('.preview canvas').first().evaluate(c=>c.toDataURL());
 await page.locator('#zoomIn').click();await page.locator('#zoomIn').click();await page.locator('#viewRotation').fill('90');await expect(page.locator('#canvas')).toHaveAttribute('data-view-rotation','90');
 await page.locator('#viewRotation').blur();const center=await canvasPoint(page,360,360);await page.keyboard.down('Space');await page.mouse.move(center.x,center.y);await page.mouse.down();await page.mouse.move(center.x+60,center.y+35,{steps:5});await page.mouse.up();await page.keyboard.up('Space');
 expect(await page.locator('.preview canvas').first().evaluate(c=>c.toDataURL())).toBe(original);
 await page.locator('[data-tool=eyedropper]').click();await clickPoint(page,325,345);await expect(page.locator('#color')).toHaveValue('#ed3421');
 await page.locator('#color').fill('#00aa44');await page.locator('#size').fill('20');await clickPoint(page,360,300);await expect.poll(()=>pixel(page,360,300)).not.toEqual([255,254,249,255]);
 await page.locator('#fitView').click();await expect(page.locator('#canvas')).toHaveAttribute('data-fit-mode','true');await expect(page.locator('#viewRotation')).toHaveValue('0');
});

test('eyedropper ignores samples and guides and remembers recent colors',async({page})=>{
 await page.goto('/');await seedImage(page);await page.locator('#sampleDesign').check();await page.locator('[data-tool=eyedropper]').click();await clickPoint(page,325,345);
 await expect(page.locator('#color')).toHaveValue('#ed3421');await expect(page.locator('[data-recent-color="#ed3421"]')).toHaveCount(1);
 await page.locator('[data-color="#7184a3"]').click();await expect(page.locator('#recentColors button').first()).toHaveAttribute('data-recent-color','#7184a3');
 await page.locator('[data-recent-color="#ed3421"]').click();await expect(page.locator('#color')).toHaveValue('#ed3421');
 await page.locator('#saveProject').click();await page.reload();await expect(page.locator('#recentColors button').first()).toHaveAttribute('data-recent-color','#ed3421');
});

test('selection transforms preview, cancel, apply and undo without accumulating resampling',async({page})=>{
 await page.goto('/');await seedImage(page);await page.locator('#guides').uncheck();await selectRegion(page);await page.locator('#selectionTransform summary').click();
 const original=await page.locator('.preview canvas').first().evaluate(c=>c.toDataURL());
 await page.locator('#flipSelectionX').click();await expect.poll(()=>pixel(page,325,345)).toEqual([34,85,204,255]);await expect.poll(()=>pixel(page,395,345)).toEqual([237,52,33,255]);
 await page.locator('#cancelSelectionTransform').click();await expect.poll(()=>page.locator('.preview canvas').first().evaluate(c=>c.toDataURL())).toBe(original);
 await page.locator('#selectionScale').fill('50');await expect.poll(()=>pixel(page,325,345)).toEqual([255,254,249,255]);await expect.poll(()=>pixel(page,345,345)).toEqual([237,52,33,255]);
 await page.locator('#selectionScale').fill('100');await expect.poll(()=>pixel(page,325,345)).toEqual([237,52,33,255]);await page.locator('#selectionRotation').fill('180');await expect.poll(()=>pixel(page,325,345)).toEqual([34,85,204,255]);
 await page.locator('#applySelectionTransform').click();await expect(page.locator('#selectionRotation')).toHaveValue('0');await page.locator('#undo').click();await expect.poll(()=>page.locator('.preview canvas').first().evaluate(c=>c.toDataURL())).toBe(original);
 await page.locator('#redo').click();await expect.poll(()=>pixel(page,325,345)).toEqual([34,85,204,255]);
});
