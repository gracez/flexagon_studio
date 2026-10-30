import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
async function ready(page){await expect(page.locator('#recoveryDialog')).not.toBeVisible();}
async function seed(page,color){
 const png=await page.evaluate(color=>{const c=document.createElement('canvas');c.width=c.height=100;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,100,100);return c.toDataURL().split(',')[1];},color);
 await page.locator('#imageFile').setInputFiles({name:'paint.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await expect(page.locator('#imageControls')).toBeVisible();await page.locator('#imageScale').fill('20');await page.locator('#placeImage').click();
}
async function saved(page){await expect(page.locator('#saveStatus')).toContainText('Saved locally',{timeout:15000});}
async function project(page){const event=page.waitForEvent('download');await page.locator('#saveProject').click();return JSON.parse(await readFile(await(await event).path(),'utf8'));}
async function records(page){return page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('flexagon-studio',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('recovery','readonly'),q=tx.objectStore('recovery').getAll();tx.oncomplete=()=>{resolve(q.result.map(v=>({id:v.id,timestamp:v.timestamp,blob:v.project.banks[v.project.model][0] instanceof Blob})));db.close();};};r.onerror=()=>reject(r.error);}));}
const pixel=page=>page.locator('#canvas').evaluate(c=>Array.from(c.getContext('2d').getImageData(350,345,1,1).data));

test('autosave recovers all models, selected orientation and transparent artwork after reload',async({page})=>{
 await page.goto('/');await ready(page);await seed(page,'#ed3421');await page.locator('#model').selectOption('tetra');await seed(page,'#2255cc');await page.locator('.preview').nth(1).click();await saved(page);
 const before=await project(page);const copies=await records(page);expect(copies.find(v=>v.id==='latest').blob).toBe(true);
 await page.reload();await expect(page.locator('#saveStatus')).toContainText('Recovered');await expect(page.locator('dialog[open]')).toHaveCount(0);
 await expect(page.locator('#model')).toHaveValue('tetra');await expect(page.locator('#orientationTitle')).toHaveText('Orientation B');const after=await project(page);expect(after).toEqual(before);
});

test('a previous recovery copy survives a corrupt latest copy and can be restored',async({page})=>{
 await page.goto('/');await ready(page);await seed(page,'#ed3421');await saved(page);await seed(page,'#2255cc');await saved(page);expect((await records(page)).map(r=>r.id).sort()).toEqual(['latest','previous']);
 await page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('flexagon-studio',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('recovery','readwrite'),store=tx.objectStore('recovery'),q=store.get('latest');q.onsuccess=()=>{const v=q.result;v.project.format='corrupt';store.put(v);};tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};}));
 await page.reload();await expect(page.locator('#recoveryBannerText')).toContainText('backup');await expect(page.locator('dialog[open]')).toHaveCount(0);await expect.poll(()=>pixel(page)).toEqual([237,52,33,255]);await saved(page);
 await page.reload();await expect(page.locator('#saveStatus')).toContainText('Recovered');await expect.poll(()=>pixel(page)).toEqual([237,52,33,255]);
});

test('Start new explicitly clears local recovery without restoring old art',async({page})=>{
 await page.goto('/');await ready(page);await seed(page,'#ed3421');await saved(page);await page.reload();await expect(page.locator('#recoveryBannerText')).toContainText('restored');await page.locator('#newSession').click();await page.locator('#backupBeforeNew').uncheck();await page.locator('#confirmNewSession').click();await expect(page.locator('dialog[open]')).toHaveCount(0);expect(await records(page)).toEqual([]);await expect.poll(()=>pixel(page)).toEqual([255,254,249,255]);await page.reload();await ready(page);await expect(page.locator('#saveStatus')).toHaveText('New project');
});

test('blocked local storage reports failure and leaves manual project downloads available',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(window,'indexedDB',{value:{open(){throw new Error('Storage blocked for test');}}}));await page.goto('/');await ready(page);await expect(page.locator('#saveStatus')).toContainText('Local save failed');await seed(page,'#ed3421');await expect(page.locator('#saveStatus')).toContainText('Local save failed');const data=await project(page);expect(data.banks.hexahexa).toHaveLength(36);
});

test('slow background recovery never overwrites artwork started in the meantime',async({page})=>{
 await page.goto('/');await seed(page,'#ed3421');await saved(page);
 await page.addInitScript(()=>{
  const open=IDBFactory.prototype.open;
  IDBFactory.prototype.open=function(...args){const request=open.apply(this,args);return new Proxy(request,{
   get(target,key){return Reflect.get(target,key,target);},
   set(target,key,value){if(key==='onsuccess')target.onsuccess=event=>setTimeout(()=>value(event),4000);else Reflect.set(target,key,value,target);return true;}
  });};
 });
 await page.reload();await expect(page.locator('dialog[open]')).toHaveCount(0);await seed(page,'#2255cc');await expect.poll(()=>pixel(page)).toEqual([34,85,204,255]);
 await expect(page.locator('#recoveryBannerText')).toContainText('Previous session found',{timeout:12000});await expect.poll(()=>pixel(page)).toEqual([34,85,204,255]);await page.locator('#dismissRecovery').click();await saved(page);
});

test('previous copies remain accessible on demand without a startup dialog',async({page})=>{
 await page.goto('/');await seed(page,'#ed3421');await saved(page);await seed(page,'#2255cc');await saved(page);
 await page.reload();await expect(page.locator('#saveStatus')).toContainText('Recovered');await expect.poll(()=>pixel(page)).toEqual([34,85,204,255]);
 await page.setViewportSize({width:800,height:650});await expect(page.locator('#saveStatus')).toBeVisible();await page.locator('#saveStatus').click();await expect(page.locator('#recoveryDialog')).toBeVisible();await page.locator('#recoveryChoice').selectOption('previous');await page.locator('#backupBeforeRecovery').uncheck();await page.locator('#recoverProject').click();await expect(page.locator('#recoveryDialog')).not.toBeVisible();await expect.poll(()=>pixel(page)).toEqual([237,52,33,255]);
});
