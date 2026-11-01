const GUIDES = {
  tetra: {
    tape: {
      path: 'assembly-guides/tetraflexagon-tape-closure.pdf',
      filename: 'flexagon-studio-tetraflexagon-assembly-no-glue.pdf',
    },
    glue: {
      path: 'assembly-guides/tetraflexagon-glue-flaps.pdf',
      filename: 'flexagon-studio-tetraflexagon-assembly-glue-flaps.pdf',
    },
  },
  trihexa: {
    tape: {
      path: 'assembly-guides/trihexaflexagon-tape-closure.pdf',
      filename: 'flexagon-studio-trihexaflexagon-assembly-no-glue.pdf',
    },
    glue: {
      path: 'assembly-guides/trihexaflexagon-glue-flaps.pdf',
      filename: 'flexagon-studio-trihexaflexagon-assembly-glue-flaps.pdf',
    },
  },
};

export function assemblyGuideFor(modelId, {addGlueFlaps = false} = {}) {
  return GUIDES[modelId]?.[addGlueFlaps ? 'glue' : 'tape'] ?? null;
}

export async function downloadAssemblyGuidePDF(modelId, {addGlueFlaps = false} = {}) {
  const guide = assemblyGuideFor(modelId, {addGlueFlaps});
  if (!guide) throw new Error('No assembly guide is available for these export options yet.');
  const link = document.createElement('a');
  link.href = new URL(guide.path, document.baseURI).href;
  link.download = guide.filename;
  document.body.append(link);
  link.click();
  link.remove();
}
