import {test,expect} from '@playwright/test';
import {stat} from 'node:fs/promises';
test('back-sheet square artwork keeps its left and right pixels instead of mirroring',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {drawPrintArtwork}=await import('/src/print-artwork.js');
  const artwork=document.createElement('canvas');artwork.width=artwork.height=20;const a=artwork.getContext('2d');a.fillStyle='#ff0000';a.fillRect(0,0,10,20);a.fillStyle='#0000ff';a.fillRect(10,0,10,20);
  const sheet=document.createElement('canvas');sheet.width=sheet.height=100;const ctx=sheet.getContext('2d');
  // Same reflected corner order produced by PDF back-sheet positioning.
  drawPrintArtwork(ctx,'square',[[90,10],[10,10],[10,90],[90,90]],artwork);
  return {left:Array.from(ctx.getImageData(20,50,1,1).data),right:Array.from(ctx.getImageData(80,50,1,1).data)};
 });
 expect(result.left).toEqual([255,0,0,255]);expect(result.right).toEqual([0,0,255,255]);
});

test('tetraflexagon export downloads the matching illustrated assembly guides',async({page})=>{
 await page.goto('/');
 await page.selectOption('#model','tetra');
 const confirm=page.locator('#confirmModelChange');
 if(await confirm.isVisible())await confirm.click();
 await expect(page.locator('#model')).toHaveValue('tetra');
 await page.locator('#export').click();
 const guide=page.locator('#downloadAssemblyGuide');
 await expect(guide).toBeEnabled();
 let downloadPromise=page.waitForEvent('download');
 await guide.click();
 let download=await downloadPromise;
 expect(download.suggestedFilename()).toBe('flexagon-studio-tetraflexagon-assembly-glue-flaps.pdf');
 expect((await stat(await download.path())).size).toBeGreaterThan(100000);
 await page.locator('#addGlueFlap').uncheck();
 await expect(guide).toBeEnabled();
 downloadPromise=page.waitForEvent('download');
 await guide.click();
 download=await downloadPromise;
 expect(download.suggestedFilename()).toBe('flexagon-studio-tetraflexagon-assembly-no-glue.pdf');
 expect((await stat(await download.path())).size).toBeGreaterThan(100000);
});
