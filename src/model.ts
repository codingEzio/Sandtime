export type Person = {
  id: string;
  name: string;
  birth: string;
  lifespan: number | null;
  profile: "masculine" | "feminine";
  source?: "unknown" | "owner" | "estimate";
  tentative?: boolean;
  legacyProfile?: Record<string, unknown>;
};
export type State = {
  version: 1;
  people: Person[];
  selected: string;
  theme: "system" | "light" | "dark";
  font?: "system" | "pixel";
  language: "en" | "zh-Hant" | "zh-Hans";
  speed: number;
  grainSize: number;
  grainCount: number;
  widthScale: number;
  motion: boolean;
};
export const key = "sandtime.state.v1";
/** Bounded for local browser storage and import processing; existing files are never changed on refusal. */
export const MAX_PEOPLE = 1000;
export const MAX_NAME_LENGTH = 200;
export const MAX_IMPORT_BYTES = 5_000_000;
export type ImportFailure = "capacity" | "alreadyImported" | "invalid";
export class ImportError extends Error {
  constructor(public code: ImportFailure) {
    super(code);
  }
}
export class PersistenceError extends Error {
  constructor(
    public phase: "read" | "conflict" | "write" | "unverified",
    options?: ErrorOptions,
  ) {
    super(phase, options);
  }
}
export const blank = (): State => ({
  version: 1,
  people: [],
  selected: "",
  theme: "system",
  font: "system",
  language: navigator.language.startsWith("zh")
    ? (navigator.language.toLowerCase().includes("tw") ||
        navigator.language.toLowerCase().includes("hant")
      ? "zh-Hant"
      : "zh-Hans")
    : "en",
  speed: 1,
  grainSize: 1,
  grainCount: 170,
  widthScale: 1,
  motion: true,
});
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const inRange = (x: unknown, lo: number, hi: number): x is number =>
  typeof x === "number" && Number.isFinite(x) && x >= lo && x <= hi;
export function validBirth(value: string, allowFuture = false): boolean {
  if (!value) return true;
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value);
  if (!m) return false;
  const y = +m[1], month = +(m[2] ?? "1"), day = +(m[3] ?? "1");
  const d = new Date(0);
  d.setUTCFullYear(y, month - 1, day);
  d.setUTCHours(0, 0, 0, 0);
  if (
    y < 1 || d.getUTCFullYear() !== y || d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) return false;
  if (allowFuture) return true;
  const now = new Date();
  const today = `${String(now.getFullYear()).padStart(4, "0")}-${
    String(now.getMonth() + 1).padStart(2, "0")
  }-${String(now.getDate()).padStart(2, "0")}`;
  return `${m[1]}-${String(month).padStart(2, "0")}-${
    String(day).padStart(2, "0")
  }` <= today;
}
export function validState(x: unknown): x is State {
  if (
    !object(x) || x.version !== 1 || !Array.isArray(x.people) ||
    x.people.length > MAX_PEOPLE || typeof x.selected !== "string" ||
    !["system", "light", "dark"].includes(String(x.theme)) ||
    (x.font !== undefined && !["system", "pixel"].includes(String(x.font))) ||
    !["en", "zh-Hant", "zh-Hans"].includes(String(x.language)) ||
    !inRange(x.speed, .25, 3) || !inRange(x.grainSize, .5, 2) ||
    !inRange(x.grainCount, 40, 340) || !inRange(x.widthScale, .75, 1.25) ||
    typeof x.motion !== "boolean"
  ) return false;
  const ids = new Set<string>();
  for (const p of x.people) {
    if (
      !object(p) ||
      (p.source !== undefined &&
        !["unknown", "owner", "estimate"].includes(String(p.source))) ||
      (p.tentative !== undefined && typeof p.tentative !== "boolean") ||
      typeof p.id !== "string" || !p.id || ids.has(p.id) ||
      typeof p.name !== "string" || !p.name.trim() ||
      p.name.length > MAX_NAME_LENGTH ||
      typeof p.birth !== "string" || !validBirth(p.birth, true) ||
      !(p.lifespan === null || inRange(p.lifespan, 1, 200)) ||
      !["masculine", "feminine"].includes(String(p.profile))
    ) return false;
    ids.add(p.id);
  }
  return x.people.length ? ids.has(x.selected) : x.selected === "";
}
export function assertCurrent(
  expected: string | null,
  storage: Pick<Storage, "getItem"> = localStorage,
): void {
  let current: string | null;
  try {
    current = storage.getItem(key);
  } catch (cause) {
    throw new PersistenceError("read", { cause });
  }
  if (current !== expected) throw new PersistenceError("conflict");
}
export function persist(
  state: State,
  expected: string | null,
  storage: Pick<Storage, "setItem" | "getItem"> = localStorage,
): string {
  if (!validState(state)) throw Error("Invalid settings");
  const encoded = JSON.stringify(state);
  assertCurrent(expected, storage);
  try {
    storage.setItem(key, encoded);
  } catch (cause) {
    throw new PersistenceError("write", { cause });
  }
  try {
    if (storage.getItem(key) !== encoded) {
      throw Error("Settings readback mismatch");
    }
  } catch (cause) {
    // A successful write cannot safely be rolled back after a later read failure:
    // another tab may already have changed it. Report the result as unverified.
    throw new PersistenceError("unverified", { cause });
  }
  return encoded;
}
export function age(birth: string, now = new Date()): number | null {
  if (!birth || !validBirth(birth)) return null;
  const [y, m = 1, d = 1] = birth.split("-").map(Number);
  const anniversary = (year: number) => {
    const date = new Date(0);
    date.setHours(0, 0, 0, 0);
    date.setFullYear(year, m - 1, d);
    if (date.getMonth() !== m - 1) date.setDate(0);
    return date;
  };
  let years = now.getFullYear() - y;
  if (now < anniversary(now.getFullYear())) years--;
  if (years < 0) return 0;
  const last = anniversary(y + years), next = anniversary(y + years + 1);
  return years +
    (now.getTime() - last.getTime()) / (next.getTime() - last.getTime());
}
export function applyLegacyAppearance(current: State, person: Person): State {
  const settings = person.legacyProfile?.settings;
  if (
    !object(settings) || !inRange(settings.speed, .25, 3) ||
    !inRange(settings.grainSize, .5, 2) ||
    !inRange(settings.grainCount, 40, 340) ||
    !inRange(settings.widthScale, .75, 1.25) ||
    typeof settings.motion !== "boolean"
  ) {
    throw Error("Invalid legacy appearance");
  }
  return {
    ...current,
    speed: settings.speed,
    grainSize: settings.grainSize,
    grainCount: settings.grainCount,
    widthScale: settings.widthScale,
    motion: settings.motion,
  };
}
/** Imports a Sandtime backup, an exported family.lifeCountdown value, or legacy Hourglass profile(s). Never touches Prometheus. */
export function importState(raw: unknown, current: State): State {
  if (
    object(raw) && Array.isArray(raw.people) && raw.people.length > MAX_PEOPLE
  ) {
    throw new ImportError("capacity");
  }
  if (validState(raw)) return raw;
  if (!object(raw)) throw Error("Unsupported file");
  if (Array.isArray(raw.items) && raw.items.some((v) => !object(v))) {
    throw new ImportError("invalid");
  }
  const entries = Array.isArray(raw.items) ? raw.items.filter(object) : [];
  for (
    const name of [
      "family.lifeCountdown",
      "hourglass.device",
      "hourglass.playground",
    ]
  ) {
    if (entries.filter((entry) => entry.key === name).length > 1) {
      throw new ImportError("invalid");
    }
  }
  const item = (name: string) => entries.find((v) => v.key === name)?.value;
  let source: unknown = item("family.lifeCountdown") ??
    raw["family.lifeCountdown"] ?? raw;
  let appearance: unknown = item("hourglass.device") ??
    item("hourglass.playground");
  if (typeof appearance === "string") appearance = JSON.parse(appearance);
  if (appearance !== undefined && appearance !== null && !object(appearance)) {
    throw new ImportError("invalid");
  }
  const settings = object(appearance) ? appearance : {};
  for (
    const [field, min, max] of [["speed", .25, 3], ["grainSize", .5, 2], [
      "grainCount",
      40,
      340,
    ], ["widthScale", .75, 1.25]] as const
  ) {
    if (field in settings && !inRange(settings[field], min, max)) {
      throw new ImportError("invalid");
    }
  }
  if ("motion" in settings && typeof settings.motion !== "boolean") {
    throw new ImportError("invalid");
  }
  const merged = {
    ...current,
    speed: inRange(settings.speed, .25, 3) ? settings.speed : current.speed,
    grainSize: inRange(settings.grainSize, .5, 2)
      ? settings.grainSize
      : current.grainSize,
    grainCount: inRange(settings.grainCount, 40, 340)
      ? settings.grainCount
      : current.grainCount,
    widthScale: inRange(settings.widthScale, .75, 1.25)
      ? settings.widthScale
      : current.widthScale,
    motion: typeof settings.motion === "boolean"
      ? settings.motion
      : current.motion,
  };
  if (typeof source === "string") source = JSON.parse(source);
  if (object(source) && object(source.members)) {
    const names: Record<string, string> = {
      self: "Me",
      mother: "Mother",
      father: "Father",
      brother: "Brother",
    };
    const people: Person[] = [];
    for (const [id, member] of Object.entries(source.members)) {
      if (!Object.hasOwn(names, id) || !object(member)) {
        throw new ImportError("invalid");
      }
      const birth = member.birthDate === null ? "" : member.birthDate;
      if (
        typeof birth !== "string" || !validBirth(birth, true) ||
        !(member.lifespanYears === null ||
          inRange(member.lifespanYears, 1, 200)) ||
        !["unknown", "owner", "estimate"].includes(String(member.source)) ||
        typeof member.tentative !== "boolean"
      ) throw Error("Invalid family record");
      people.push({
        id: `prometheus-family-${id}`,
        name: names[id],
        birth,
        lifespan: member.lifespanYears as number | null,
        profile: id === "mother" ? "feminine" : "masculine",
        source: member.source as Person["source"],
        tentative: member.tentative,
      });
    }
    if (!people.length) throw new ImportError("invalid");
    if (current.people.length + people.length > MAX_PEOPLE) {
      throw new ImportError("capacity");
    }
    if (
      people.some((p) =>
        current.people.some((existing) => existing.id === p.id)
      )
    ) throw new ImportError("alreadyImported");
    return {
      ...merged,
      people: [...current.people, ...people],
      selected: current.selected || people[0].id,
    };
  }
  const list = Array.isArray(raw.profiles)
    ? raw.profiles
    : entries.some((v) => object(v.settings))
    ? entries
    : object(raw.settings)
    ? [raw]
    : [];
  if (current.people.length + list.length > MAX_PEOPLE) {
    throw new ImportError("capacity");
  }
  const people: Person[] = [];
  const importedIds = new Set<string>();
  for (const item of list) {
    if (
      !object(item) || !object(item.settings) ||
      typeof item.name !== "string" ||
      typeof item.id !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(item.id)
    ) throw new ImportError("invalid");
    if (importedIds.has(item.id)) throw new ImportError("alreadyImported");
    importedIds.add(item.id);
    const s = item.settings;
    if (
      typeof s.birth !== "string" || !validBirth(s.birth) ||
      !inRange(s.lifeExpectancy, 1, 200) ||
      !["masculine", "feminine"].includes(String(s.profile))
    ) throw Error("Invalid profile");
    people.push({
      id: `prometheus-profile-${item.id}`,
      name: item.name,
      birth: s.birth,
      lifespan: s.lifeExpectancy,
      profile: s.profile as Person["profile"],
      legacyProfile: item,
    });
  }
  if (!people.length) throw Error("Unsupported file");
  if (
    people.some((p) => current.people.some((existing) => existing.id === p.id))
  ) throw new ImportError("alreadyImported");
  return {
    ...current,
    people: [...current.people, ...people],
    selected: current.selected || people[0].id,
  };
}
