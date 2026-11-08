const loopback = Deno.args.includes("--loopback");
const port = Number(
  Deno.env.get(loopback ? "SANDTIME_PORT" : "PROJECT_PORT") ??
    (loopback ? "0" : "NaN"),
);
if (!Number.isInteger(port) || port < (loopback ? 0 : 1) || port > 65535) {
  throw Error("A valid registered PROJECT_PORT is required");
}
const host = loopback ? "127.0.0.1" : "0.0.0.0";
const files: Record<string, [string, string]> = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/app.js": ["app.js", "text/javascript; charset=utf-8"],
  "/sw.js": ["sw.js", "text/javascript; charset=utf-8"],
  "/font-notices.txt": ["font-notices.txt", "text/plain; charset=utf-8"],
  "/LICENSE.txt": ["LICENSE.txt", "text/plain; charset=utf-8"],
  "/DeparturePixelZhCompact-d5eeaff4.woff2": [
    "DeparturePixelZhCompact-d5eeaff4.woff2",
    "font/woff2",
  ],
  "/style.css": ["style.css", "text/css; charset=utf-8"],
};
Deno.serve({
  hostname: host,
  port,
  onListen: ({ port }) =>
    console.log(
      `Sandtime: http://${host === "0.0.0.0" ? "localhost" : host}:${port}/`,
    ),
}, async (request) => {
  if (new URL(request.url).pathname === "/health") return new Response("ok");
  const file = files[new URL(request.url).pathname];
  if (!file) return new Response("Not found", { status: 404 });
  try {
    const bytes = await Deno.readFile(
      new URL(`../dist/${file[0]}`, import.meta.url),
    );
    return new Response(bytes, {
      headers: {
        "content-type": file[1],
        "cache-control": "no-cache",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response("Build Sandtime first", { status: 503 });
  }
});
