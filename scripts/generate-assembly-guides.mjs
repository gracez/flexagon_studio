import {readFile, mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';

const guides = [
  ['tetraflexagon-no-glue-assembly-draft.svg', 'tetraflexagon-tape-closure.pdf'],
  ['tetraflexagon-glue-assembly-draft.svg', 'tetraflexagon-glue-flaps.pdf'],
  ['trihexaflexagon-no-glue-assembly-draft.svg', 'trihexaflexagon-tape-closure.pdf'],
  ['trihexaflexagon-glue-assembly-draft.svg', 'trihexaflexagon-glue-flaps.pdf'],
];

await mkdir('public/assembly-guides', {recursive: true});
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const [source, output] of guides) {
    const svg = await readFile(`drafts/${source}`, 'utf8');
    await page.setContent(`<!doctype html><style>
      @page { size: letter landscape; margin: 0; }
      html, body { width: 100%; height: 100%; margin: 0; background: #faf9f4; }
      body { display: flex; align-items: center; justify-content: center; }
      svg { display: block; width: 100%; height: 100%; }
    </style>${svg}`, {waitUntil: 'load'});
    await page.pdf({
      path: `public/assembly-guides/${output}`,
      format: 'Letter',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
    });
  }
} finally {
  await browser.close();
}
