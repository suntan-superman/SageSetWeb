// Writes per-route index.html files into dist so crawlers see the correct
// title, description and canonical without running JavaScript.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ORIGIN = 'https://sagesetfitness.com';

const source = await readFile(path.join(root, 'src', 'components', 'SeoMetadata.jsx'), 'utf8');
const block = source.match(/const pages = (\{[\s\S]*?\n\});/);
if (!block) throw new Error('prerender-meta: could not find the pages table in SeoMetadata.jsx');
const pages = new Function(`return ${block[1]}`)();
const { blogPosts } = await import(pathToFileURL(path.join(root, 'src', 'data', 'blogPosts.js')).href);
blogPosts.forEach((post) => { pages[`/blog/${post.slug}`] = [`${post.title} | SageSet Blog`, post.description]; });

const noindex = new Set(['/before-after', '/testimonials']);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const base = await readFile(path.join(dist, 'index.html'), 'utf8');

function setTag(html, pattern, tag) {
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}

function render(route, [title, description]) {
  const canonical = route === '/' ? `${ORIGIN}/` : `${ORIGIN}${route}`;
  let html = base;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = setTag(html, /<meta\s+name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`);
  html = setTag(html, /<link\s+rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}" />`);
  html = setTag(html, /<meta\s+property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}" />`);
  html = setTag(html, /<meta\s+property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`);
  html = setTag(html, /<meta\s+property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`);
  if (noindex.has(route)) html = setTag(html, /<meta\s+name="robots"[^>]*>/, '<meta name="robots" content="noindex, nofollow" />');
  return html;
}

let count = 0;
for (const [route, meta] of Object.entries(pages)) {
  if (route === '/') {
    await writeFile(path.join(dist, 'index.html'), render(route, meta), 'utf8');
  } else {
    const dir = path.join(dist, route.replace(/^\//, ''));
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.html'), render(route, meta), 'utf8');
  }
  count += 1;
}
console.log(`prerender-meta: wrote head tags for ${count} routes`);
