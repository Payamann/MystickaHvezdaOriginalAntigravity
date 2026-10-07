// Shell-only conversion shared by explicitly scoped visual batches.
export function atlasShell(html, pageClass, stylesheet) {
  let result = html.replace(/<body([^>]*)>/i, (_, attrs) => {
    const classes = new Set([...attrs.matchAll(/class="([^"]*)"/gi)].flatMap(match => match[1].split(/\s+/)).filter(Boolean));
    classes.add('atlas-page');
    for (const name of pageClass.split(/\s+/)) classes.add(name);
    return `<body${attrs.replace(/\s*class="[^"]*"/gi, '')} class="${[...classes].join(' ')}">`;
  });
  result = result.replace(/\s*<div class="stars"(?: aria-hidden="true")?><\/div>/g, '');
  result = result.replace(/(<meta name="theme-color" content=")[^"]+/, '$1#0b1929');
  // Normalize both order and URLs, including pages already partially migrated.
  result = result.replace(/\s*<link[^>]*href="[^"]*\/(?:atlas-web|atlas-blog|atlas-content|atlas-tools|atlas-astro|atlas-angels|atlas-remaining)\.css[^\"]*"[^>]*>/g, '');
  return result.replace('</head>', `\n    <link rel="stylesheet" href="/css/atlas-web.css?v=1">\n    <link rel="stylesheet" href="/css/${stylesheet}?v=1">\n</head>`);
}
