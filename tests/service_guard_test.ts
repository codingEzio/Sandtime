import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(new URL("../scripts/service.ts", import.meta.url));
const run = async (root: string, mode = "--prepare") => {
  const env = {
    ...Deno.env.toObject(),
    HOME: join(root, "home"),
    SANDTIME_COMPOSE: "/usr/bin/true",
    SANDTIME_WRAPPER: join(root, "wrapper"),
    SANDTIME_PROJECT_NAME: "fixture",
  };
  return await new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", join(root, "scripts/service.ts"), mode],
    env,
    stdout: "piped",
    stderr: "piped",
  }).output();
};

Deno.test("service preparation preserves existing outputs and rejects symlink parents", async () => {
  if (Deno.build.os !== "darwin") return; // plutil and launchd are macOS tools.
  const temporary = await Deno.makeTempDir({
    prefix: "sandtime-service-test-",
  });
  const base = await Deno.realPath(temporary);
  try {
    for (
      const mode of [
        "normal",
        "file",
        "link",
        "compose-link",
        "parent",
        "deploy-parent",
        "installed",
      ]
    ) {
      const root = join(base, mode);
      await Deno.mkdir(join(root, "scripts"), { recursive: true });
      await Deno.mkdir(join(root, "dist"));
      await Deno.copyFile(source, join(root, "scripts/service.ts"));
      await Deno.writeTextFile(join(root, "dist/index.html"), "fixture");
      await Deno.writeTextFile(join(root, "wrapper"), "fixture");
      const compose = join(root, "Local/runtime/process-compose.yaml");
      const plist = join(root, "deploy/org.sandtime.web.plist");
      const sentinel = join(root, "sentinel");
      await Deno.writeTextFile(sentinel, "unchanged");
      if (mode === "file" || mode === "link") {
        await Deno.mkdir(dirname(plist), { recursive: true });
        if (mode === "file") await Deno.writeTextFile(plist, "unchanged");
        else await Deno.symlink(sentinel, plist);
      }
      if (mode === "compose-link") {
        await Deno.mkdir(dirname(compose), { recursive: true });
        await Deno.symlink(sentinel, compose);
      }
      if (mode === "parent") await Deno.symlink(root, join(root, "Local"));
      if (mode === "deploy-parent") {
        await Deno.symlink(root, join(root, "deploy"));
      }
      if (mode === "installed") {
        const target = join(
          root,
          "home/Library/LaunchAgents/org.sandtime.web.plist",
        );
        await Deno.mkdir(dirname(target), { recursive: true });
        await Deno.writeTextFile(target, "unchanged");
      }
      const output = await run(
        root,
        mode === "installed" ? "--install" : "--prepare",
      );
      if ((mode === "normal") !== output.success) {
        throw Error(`${mode}: unexpected exit`);
      }
      if (await Deno.readTextFile(sentinel) !== "unchanged") {
        throw Error(`${mode}: sentinel changed`);
      }
      if (mode === "file" && await Deno.readTextFile(plist) !== "unchanged") {
        throw Error("existing plist changed");
      }
      if (mode === "compose-link" && !(await Deno.lstat(compose)).isSymlink) {
        throw Error("compose symlink changed");
      }
      if (mode !== "normal" && mode !== "compose-link") {
        try {
          await Deno.lstat(compose);
          throw Error(`${mode}: compose created`);
        } catch (error) {
          if (!(error instanceof Deno.errors.NotFound)) throw error;
        }
      }
    }
  } finally {
    await Deno.remove(base, { recursive: true });
  }
});
