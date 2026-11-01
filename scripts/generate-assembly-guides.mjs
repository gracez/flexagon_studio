import {readFile, mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';

const guides = [
  {sources: ['tetraflexagon-no-glue-assembly-draft.svg'], output: 'tetraflexagon-tape-closure.pdf'},
  {sources: ['tetraflexagon-glue-assembly-draft.svg'], output: 'tetraflexagon-glue-flaps.pdf'},
  {sources: ['trihexaflexagon-no-glue-assembly-draft.svg'], output: 'trihexaflexagon-tape-closure.pdf'},
  {sources: ['trihexaflexagon-glue-assembly-draft.svg'], output: 'trihexaflexagon-glue-flaps.pdf'},
  {
    sources: [
      'hexahexaflexagon-no-glue-assembly-draft-page-1.svg',
      'hexahexaflexagon-no-glue-assembly-draft-page-2.svg',
    ],
    output: 'hexahexaflexagon-tape-closure.pdf',
  },
];

await mkdir('public/assembly-guides', {recursive: true});
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const {sources, output} of guides) {
    const pages = await Promise.all(sources.map(async source => readFile(`drafts/${source}`, 'utf8')));
    await page.setContent(`<!doctype html><style>
      @page { size: letter landscape; margin: 0; }
      html, body { margin: 0; background: #faf9f4; }
      .guide-page { width: 11in; height: 8.5in; display: flex; align-items: center; justify-content: center; break-after: page; }
      .guide-page:last-child { break-after: auto; }
      svg { display: block; width: 100%; height: 100%; }
    </style>${pages.map(svg => `<section class="guide-page">${svg}</section>`).join('')}`, {waitUntil: 'load'});
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
