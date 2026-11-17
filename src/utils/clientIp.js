// The real client IP, for rate limiting.
//
// Production path: browser -> Vercel (/api rewrite) -> Cloudflare -> Render -> this app.
// X-Forwarded-For can't be trusted here: Vercel passes a client-sent X-Forwarded-For through
// unchanged, so its first entry is spoofable. Vercel sets x-vercel-forwarded-for itself
// (a client-sent value is overwritten), so that header is the reliable one.
// Locally (no Vercel) it falls back to req.ip.
//
// Limitation: someone calling the onrender.com URL directly, skipping Vercel, could forge this
// header to dodge the login rate limit. That's acceptable for this project.
const clientIp = (req) =>
  req.get("x-vercel-forwarded-for")?.split(",")[0].trim() || req.ip;

module.exports = { clientIp };
