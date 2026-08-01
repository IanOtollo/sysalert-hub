// Vercel doesn't support Next.js-style optional catch-all filenames
// ([[...slug]].js) for plain (non-Next.js) Serverless Functions, so nested
// routes are handled via vercel.json rewrites into a single resource-level
// index.js, which still receives the original request path on req.url.
// This derives the path segments after the resource's base path.
export default function parseSlug(req, basePath) {
  const urlPath = req.url.split('?')[0]
  const rest = urlPath.startsWith(basePath) ? urlPath.slice(basePath.length) : ''
  return rest.split('/').filter(Boolean)
}
