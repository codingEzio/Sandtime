# Sandtime

<p><img src="docs/icon.svg" width="96" height="96" alt="Sandtime"></p>

[English](README.md) · [简体中文](README.zh-Hans.md) ·
[繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md)
· [Español](README.es.md)

A private-by-default, standalone hourglass for reflecting on a lifespan. Runs
locally in a browser without an account or remote service. Profiles and settings
remain in this browser and origin; use Export backup to move them between
browsers or addresses. After the first online visit, offline access is available
in browsers that support service workers on the chosen origin.

- Add people with a name, birth date and target lifespan. Partial dates are
  marked approximate; no personal dates are supplied by default.
- Preview age, reset to today, and adjust the figure, sand, animation and theme.
  System reduced-motion is respected. System text and the prepared pixel font are
  selectable.
- Import a Sandtime backup, a Prometheus Settings export containing
  `family.lifeCountdown` and Hourglass device settings, or JSON with legacy
  `profiles` (or an API `items` list) and their `settings`. Legacy profile
  metadata is retained in backups; select a person and choose Apply imported
  appearance to restore their profile-specific visual settings. Prometheus
  imports append people; a Sandtime backup replaces local data after
  confirmation. Original files are not changed. Already imported family records
  are refused to prevent duplicates. Each file is limited to 5 MB and Sandtime
  supports up to 1,000 people with names up to 200 characters. Oversized or
  duplicate imports are refused without changing existing data. Archived and
  pinned flags remain in the retained legacy metadata and exported backups;
  Sandtime does not currently apply those flags to its person list.
- Settings are local to the browser. Export a backup before clearing site data
  or changing devices. Saving requires a secure origin with Web Locks. If
  another tab changes the data, reload before editing or exporting. Before
  upgrading, reload or close old Sandtime tabs: earlier versions do not use the
  lock.

## Font preparation

The source excludes the font binary. Download the [v0.1.1 web release](https://github.com/codingEzio/DeparturePixelZh-OSS/releases/download/v0.1.1/DeparturePixelZh-0.1.1-web.zip) and run `python3 scripts/prepare_font.py /path/to/DeparturePixelZh-0.1.1-web.zip` before `deno task build`. The script verifies the release ZIP SHA-256 `d0784670f40f898b4909189695c945e02392105725988b7c0e7df28baca4c892` and the exact font SHA-256; build fails on a missing or changed font. The prepared font is local and ignored by Git. The built app works offline. Existing matching regular files are reused; other existing targets are preserved and cause an error. Safe preparation requires Python support for `O_NOFOLLOW`, `O_NONBLOCK`, and a filesystem supporting hard links. Unsupported environments fail without replacing the target. Termux and Windows have not been tested.

The font's component notices are in `assets/fonts/`; Font Logos and Material Design include marks whose individual rights and trademark restrictions are not resolved by this source or the font release. Review rights for each intended use and redistribution.

## Preview

![Sandtime — Demo person](docs/demo/sandtime-en.png)

A real app screenshot with synthetic data: “Demo person”, born 2000-01-01, with
a chosen lifespan of 80 years. The displayed time changes with the clock. The
app UI is English in this capture.

## Run

Requires Deno with `deno bundle` support. `deno task build`, then
`deno task preview`. The preview binds loopback on an ephemeral port and prints
its URL. `deno task check` checks TypeScript and the import/persistence model.

## Local service integration

`deno run -A scripts/service.ts --prepare` generates an ignored Process Compose and macOS
LaunchAgent configuration. `--install` requires the shared workspace port
registry and refuses an existing agent. Its default project name is the source
directory name; `SANDTIME_PROJECT_NAME`, `SANDTIME_WRAPPER`,
`SANDTIME_PORT_REGISTRY` and `SANDTIME_COMPOSE` override the project key,
workspace wrapper, registry script and Process Compose executable respectively.
The service uses the registry port and binds all interfaces. Preview uses
loopback and an ephemeral port, or `SANDTIME_PORT`. Keep machine-specific
configuration in the environment or ignored `Local/` and `deploy/`.

Preserve the existing browser address and port when replacing an installation:
browser data belongs to its origin. Changing source does not migrate that data.

## License and artwork

GPL-3.0-only. The owner confirmed on 2026-10-27 that the anatomical artwork may
be redistributed. The atlas comes from an owner-supplied prototype, SHA-256
`3f85f8d7237377b2c75aabaedc3f33334147992a277eb5fb8a898a467ecb933d`. The adapted
rendering, anatomical geometry, and point atlas originated in the owner’s earlier application. No
personal settings or records are included in the repository. The owner confirmed
on 2026-10-27 that the original prototype code may also be redistributed under
GPL 3.0.

## Prepared font

Optional DeparturePixelZh Compact is a modified font family, WOFF2
SHA-256 `d5eeaff49ffc69fc14b4ee8a5f79a6e80febff358e5367c2f41b51970f5dcf19`. It
uses SIL OFL 1.1 and component licenses, all retained in `assets/fonts/`. After preparation, no network is needed. System is the default.

The build also includes the unchanged project license in `dist/LICENSE.txt` and
all existing font notices and provenance in `dist/font-notices.txt`.

## Repository and release

This repository provides the source. Publishing a build or hosting the app is a separate decision.
