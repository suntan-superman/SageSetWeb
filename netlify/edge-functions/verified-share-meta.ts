const SHARE_ID_PATTERN = /^[a-f0-9]{32}$/;
const SHARE_FUNCTION_URL =
  "https://us-central1-greencheck-d3d88.cloudfunctions.net/getVerifiedChallengeShare";

const metaTag = (property: string, content: string) =>
  `<meta property="${property}" content="${content}" />`;

export default async (request: Request, context: {next: () => Promise<Response>}) => {
  const response = await context.next();
  if (!response.headers.get("content-type")?.includes("text/html")) return response;

  const url = new URL(request.url);
  const shareId = String(url.pathname.split("/").filter(Boolean).at(-1) || "").toLowerCase();
  if (!SHARE_ID_PATTERN.test(shareId)) return response;

  let reps = 0;
  try {
    const lookup = await fetch(SHARE_FUNCTION_URL, {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify({data: {shareId}}),
      signal: AbortSignal.timeout(3500),
    });
    const payload = await lookup.json();
    if (payload?.result?.available === true) {
      reps = Math.max(0, Math.floor(Number(payload.result.share?.reps) || 0));
    }
  } catch {
    return response;
  }
  if (reps < 1) return response;

  const title = `${reps} SageSet Verified Squats — Can You Match It?`;
  const description = `A SageSet member completed ${reps} server-verified squats. Open the private invitation and try to match the verified result.`;
  const canonicalUrl = `https://sagesetfitness.com/share/verified-squats/${shareId}`;
  const imageUrl = "https://sagesetfitness.com/app-icon-1024.png";
  const socialMeta = [
    metaTag("og:title", title),
    metaTag("og:description", description),
    metaTag("og:image", imageUrl),
    metaTag("og:type", "website"),
    metaTag("og:url", canonicalUrl),
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${imageUrl}" />`,
  ].join("\n    ");

  const original = await response.text();
  const html = original
    .replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`)
    .replace(/\s*<meta property="og:(?:title|description|image|type|url)"[^>]*\/?>/gi, "")
    .replace("</head>", `    ${socialMeta}\n  </head>`);
  const headers = new Headers(response.headers);
  headers.set("cache-control", "public, max-age=60, s-maxage=300");
  return new Response(html, {status: response.status, headers});
};
