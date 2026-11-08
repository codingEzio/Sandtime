import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const workspace = dirname(root),
  runtime = join(root, "Local", "runtime"),
  deploy = join(root, "deploy");
const label = "org.sandtime.web",
  compose = join(runtime, "process-compose.yaml"),
  plist = join(deploy, `${label}.plist`);
const home = Deno.env.get("HOME");
if (!home) throw Error("HOME is required");
const project = Deno.env.get("SANDTIME_PROJECT_NAME") ?? basename(root);
const deno = Deno.execPath(),
  manager = Deno.env.get("SANDTIME_COMPOSE") ??
    "/opt/homebrew/bin/process-compose",
  wrapper = Deno.env.get("SANDTIME_WRAPPER") ??
    join(workspace, ".runtime", "run-project.sh"),
  ports = Deno.env.get("SANDTIME_PORT_REGISTRY") ??
    join(workspace, ".runtime", "ports.ts");
const quote = (s: string) =>
  /^[A-Za-z0-9_./:@=-]+$/.test(s) ? s : "'" + s.replaceAll("'", "'\\''") + "'";
const xml = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const command = [
  wrapper,
  project,
  "frontend",
  "--reclaim-port",
  "--",
  deno,
  "run",
  "--allow-net",
  "--allow-read",
  "--allow-env=PROJECT_PORT",
  join(root, "scripts", "serve.ts"),
].map(quote).join(" ");
const yaml =
  `version: "0.5"\nis_strict: true\nis_tui_disabled: true\nlog_level: info\nlog_length: 300\nlog_location: ${
    JSON.stringify(join(runtime, "process-compose.log"))
  }\nlog_configuration:\n  rotation:\n    max_size_mb: 5\n    max_age_days: 7\n    max_backups: 2\n    compress: true\nprocesses:\n  sandtime-web:\n    description: Sandtime web 0.0.0.0\n    command: ${
    JSON.stringify(`exec ${command}`)
  }\n    working_dir: ${
    JSON.stringify(root)
  }\n    availability:\n      restart: always\n      backoff_seconds: 2\n    shutdown:\n      signal: 15\n      timeout_seconds: 15\n`;
// The shared runtime verifier identifies the exact wrapper in the command.
const normalizedYaml = yaml;
const document =
  `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict>\n<key>Label</key><string>${label}</string>\n<key>ProgramArguments</key><array><string>${
    xml(manager)
  }</string><string>-f</string><string>${
    xml(compose)
  }</string><string>--no-server</string><string>up</string></array>\n<key>WorkingDirectory</key><string>${
    xml(root)
  }</string>\n<key>RunAtLoad</key><true/><key>KeepAlive</key><true/><key>ThrottleInterval</key><integer>5</integer><key>ExitTimeOut</key><integer>35</integer>\n<key>EnvironmentVariables</key><dict><key>PATH</key><string>${
    xml(Deno.env.get("PATH") ?? "/opt/homebrew/bin:/usr/bin:/bin")
  }</string><key>HOME</key><string>${
    xml(home)
  }</string><key>PC_DISABLE_DOTENV</key><string>1</string><key>PC_LOG_FILE</key><string>/dev/null</string></dict>\n<key>StandardOutPath</key><string>/dev/null</string><key>StandardErrorPath</key><string>/dev/null</string>\n</dict></plist>\n`;
if (
  Deno.args.length !== 1 || !["--prepare", "--install"].includes(Deno.args[0])
) throw Error("Use --prepare or --install");
const installing = Deno.args[0] === "--install";
const target = join(home, "Library", "LaunchAgents", `${label}.plist`);
async function requireAbsent(path: string) {
  try {
    await Deno.lstat(path);
    throw Error(`Refusing to overwrite ${path}`);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
}
// Check every existing ancestor, not only the final output. This rejects a
// symlinked Local/runtime, deploy, or LaunchAgents directory before writes.
async function requireSafeParents(path: string) {
  let parent = dirname(resolve(path));
  const parents: string[] = [];
  while (true) {
    parents.push(parent);
    const next = dirname(parent);
    if (next === parent) break;
    parent = next;
  }
  for (const part of parents.reverse()) {
    try {
      const info = await Deno.lstat(part);
      if (info.isSymlink || !info.isDirectory) {
        throw Error(`Unsafe output parent ${part}`);
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) break;
      throw error;
    }
  }
}
await requireSafeParents(compose);
await requireSafeParents(plist);
if (installing) await requireSafeParents(target);
await Deno.stat(join(root, "dist", "index.html"));
await Deno.stat(manager);
await Deno.stat(wrapper);
async function inspectGenerated(
  path: string,
  expected: string,
): Promise<boolean> {
  let before: Deno.FileInfo;
  try {
    before = await Deno.lstat(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
  const bytes = new TextEncoder().encode(expected);
  if (!before.isFile || before.isSymlink || before.size !== bytes.length) {
    throw Error(`Unsafe or different generated file ${path}`);
  }
  const file = await Deno.open(path, { read: true });
  try {
    const opened = await file.stat();
    if (
      !opened.isFile || opened.dev !== before.dev || opened.ino !== before.ino
    ) {
      throw Error(`Generated file changed during inspection ${path}`);
    }
    const actual = new Uint8Array(bytes.length + 1);
    let offset = 0;
    while (offset < actual.length) {
      const count = await file.read(actual.subarray(offset));
      if (count === null) break;
      offset += count;
    }
    const after = await Deno.lstat(path);
    if (
      !after.isFile || after.isSymlink || after.dev !== before.dev ||
      after.ino !== before.ino || offset !== bytes.length ||
      !bytes.every((byte, i) => byte === actual[i])
    ) {
      throw Error(`Unsafe or different generated file ${path}`);
    }
    return true;
  } finally {
    file.close();
  }
}
async function inspectPair(): Promise<boolean> {
  const hasCompose = await inspectGenerated(compose, normalizedYaml);
  const hasPlist = await inspectGenerated(plist, document);
  if (hasCompose !== hasPlist) {
    throw Error("Incomplete generated configuration; preserved");
  }
  return hasCompose;
}
const reuse = await inspectPair();
let domain = "";
let frontend = "";
if (installing) {
  if (Deno.build.os !== "darwin") throw Error("Installation requires macOS");
  await requireAbsent(target);
  const uid = new TextDecoder().decode(
    (await new Deno.Command("/usr/bin/id", { args: ["-u"] }).output()).stdout,
  ).trim();
  domain = `gui/${uid}`;
  if (
    (await new Deno.Command("/bin/launchctl", {
      args: ["print", `${domain}/${label}`],
      stdout: "null",
      stderr: "null",
    }).output()).success
  ) throw Error("LaunchAgent already loaded");
  const entry = await new Deno.Command(deno, {
    args: ["run", "--allow-read", ports, "get", project],
    stdout: "piped",
    stderr: "piped",
  }).output();
  if (!entry.success) {
    throw Error("Sandtime registry entry is required before install");
  }
  const registration = JSON.parse(new TextDecoder().decode(entry.stdout));
  if (
    registration.runtime?.composeFile !==
      `${project}/Local/runtime/process-compose.yaml` ||
    registration.runtime?.launchAgentLabel !== label
  ) throw Error("Registry runtime mismatch");
  frontend = registration.frontend;
}
const check = new Deno.Command("/usr/bin/plutil", {
  args: ["-lint", "-"],
  stdin: "piped",
  stdout: "null",
  stderr: "null",
}).spawn();
const writer = check.stdin.getWriter();
await writer.write(new TextEncoder().encode(document));
await writer.close();
if (!(await check.status).success) {
  throw Error("Generated launch agent failed validation");
}
await Deno.mkdir(runtime, { recursive: true });
await Deno.mkdir(deploy, { recursive: true });
await requireSafeParents(compose);
await requireSafeParents(plist);
// Exclusive creation prevents a file or symlink appearing after preflight
// from being overwritten. Roll back only files created by this invocation.
async function removeIfSame(path: string, info: Deno.FileInfo) {
  try {
    const current = await Deno.lstat(path);
    if (current.dev === info.dev && current.ino === info.ino) {
      await Deno.remove(path);
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
}
async function createExclusive(path: string, contents: string) {
  const file = await Deno.open(path, { write: true, createNew: true });
  const info = await file.stat();
  try {
    const bytes = new TextEncoder().encode(contents);
    let offset = 0;
    while (offset < bytes.length) {
      const count = await file.write(bytes.subarray(offset));
      if (!count) throw Error(`Could not write ${path}`);
      offset += count;
    }
  } catch (error) {
    file.close();
    await removeIfSame(path, info);
    throw error;
  }
  file.close();
  return info;
}
if (reuse) {
  if (!await inspectPair()) {
    throw Error("Generated configuration disappeared; preserved");
  }
} else {
  const firstInfo = await createExclusive(compose, normalizedYaml);
  try {
    await createExclusive(plist, document);
  } catch (error) {
    await removeIfSame(compose, firstInfo);
    throw error;
  }
}
if (!installing) {
  console.log(`Prepared ${compose} and ${plist}`);
  Deno.exit(0);
}
await Deno.mkdir(dirname(target), { recursive: true });
await requireSafeParents(target);
// createNew also protects an agent that appears after the preflight.
await createExclusive(target, document);
const result = await new Deno.Command("/bin/launchctl", {
  args: ["bootstrap", domain, target],
  stdout: "inherit",
  stderr: "inherit",
}).output();
if (!result.success) {
  throw Error(
    `LaunchAgent bootstrap failed; prepared files retained, inspect ${target}`,
  );
}
console.log(`Installed ${label} on ${frontend}`);
