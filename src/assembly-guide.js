import tetraflexagonNoGlueSvg from '../drafts/tetraflexagon-no-glue-assembly-draft.svg?raw';

const GUIDES = {
  tetra: {
    tape: {
      svg: tetraflexagonNoGlueSvg,
      filename: 'flexagon-studio-tetraflexagon-assembly-no-glue.pdf',
    },
  },
};

export function assemblyGuideFor(modelId, {addGlueFlaps = false} = {}) {
  return GUIDES[modelId]?.[addGlueFlaps ? 'glue' : 'tape'] ?? null;
}

function svgDimensions(svg) {
  const viewBox = svg.match(/viewBox=["']\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s*["']/i);
  if (viewBox) return {width: Number(viewBox[3]), height: Number(viewBox[4])};
  const width = Number(svg.match(/\bwidth=["']([\d.]+)/i)?.[1]);
  const height = Number(svg.match(/\bheight=["']([\d.]+)/i)?.[1]);
  if (width > 0 && height > 0) return {width, height};
  throw new Error('Assembly guide SVG has no usable dimensions.');
}

async function rasterizeSvg(svg, outputWidth = 2400) {
  const dimensions = svgDimensions(svg);
  const outputHeight = Math.round(outputWidth * dimensions.height / dimensions.width);
  const url = URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml;charset=utf-8'}));
  try {
    const image = new Image();
    image.decoding = 'async';
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('The assembly guide could not be rendered.'));
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const context = canvas.getContext('2d');
    context.fillStyle = '#faf9f4';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return {dataUrl: canvas.toDataURL('image/png'), ...dimensions};
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function downloadAssemblyGuidePDF(modelId, {addGlueFlaps = false} = {}) {
  const guide = assemblyGuideFor(modelId, {addGlueFlaps});
  if (!guide) throw new Error('No assembly guide is available for these export options yet.');

  const [{jsPDF}, image] = await Promise.all([
    import('jspdf'),
    rasterizeSvg(guide.svg),
  ]);
  const pdf = new jsPDF({orientation: 'landscape', unit: 'mm', format: 'letter'});
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 6;
  const scale = Math.min(
    (pageWidth - margin * 2) / image.width,
    (pageHeight - margin * 2) / image.height,
  );
  const width = image.width * scale;
  const height = image.height * scale;
  pdf.addImage(
    image.dataUrl,
    'PNG',
    (pageWidth - width) / 2,
    (pageHeight - height) / 2,
    width,
    height,
    undefined,
    'FAST',
  );
  pdf.save(guide.filename);
}
