import {
  age,
  applyLegacyAppearance,
  assertCurrent,
  ImportError,
  importState,
  MAX_PEOPLE,
  persist,
  PersistenceError,
  type State,
  validBirth,
  validState,
} from "../src/model.ts";
const base: State = {
  version: 1,
  people: [],
  selected: "",
  theme: "system",
  language: "en",
  speed: 1,
  grainSize: 1,
  grainCount: 170,
  widthScale: 1,
  motion: true,
};
function assert(ok: unknown, message: string) {
  if (!ok) throw Error(message);
}
Deno.test("Prometheus settings export imports people and visual settings without invented dates", () => {
  const source = {
    format: "prometheus-settings",
    version: 1,
    items: [{
      key: "family.lifeCountdown",
      value: {
        version: 1,
        members: {
          self: {
            birthDate: "1990-02",
            lifespanYears: 90,
            source: "estimate",
            tentative: true,
          },
          mother: {
            birthDate: null,
            lifespanYears: null,
            source: "unknown",
            tentative: false,
          },
        },
      },
    }, {
      key: "hourglass.device",
      value: {
        speed: 2,
        grainSize: 1.5,
        grainCount: 200,
        widthScale: 1,
        motion: true,
      },
    }],
  };
  const next = importState(source, base);
  assert(validState(next), "valid state");
  assert(
    next.people.length === 2 && next.people[1].lifespan === null &&
      next.people[1].birth === "",
    "unknown stays unknown",
  );
  assert(
    next.speed === 2 && next.people[0].birth === "1990-02",
    "settings and partial date",
  );
  let refused = false;
  try {
    importState(source, next);
  } catch {
    refused = true;
  }
  assert(refused, "repeat import must not duplicate");
});
Deno.test("invalid imports and dates are rejected without mutating input", () => {
  const before = JSON.stringify(base);
  let refused = false;
  try {
    importState({
      "family.lifeCountdown": {
        members: { self: { birthDate: "2024-02-30", lifespanYears: 80 } },
      },
    }, base);
  } catch {
    refused = true;
  }
  assert(
    refused && JSON.stringify(base) === before,
    "invalid import must not alter state",
  );
  assert(
    !validBirth("2024-02-30") && validBirth("2000-02"),
    "calendar validation",
  );
  assert(age("2000-01-01", new Date("2020-01-01T00:00:00"))! > 19.9, "age");
});

Deno.test("legacy API export retains the original profile and refuses repeat import", () => {
  const profile = {
    id: "fixture",
    name: "Test",
    revision: 2,
    archived: true,
    settings: {
      birth: "1990",
      lifeExpectancy: 88,
      profile: "feminine",
      speed: 2,
      grainSize: 1,
      grainCount: 170,
      widthScale: 1,
      motion: true,
      previewAge: null,
    },
  };
  const imported = importState({ items: [profile] }, base);
  assert(validState(imported), "valid import");
  assert(
    applyLegacyAppearance(imported, imported.people[0]).speed === 2,
    "legacy appearance can be applied",
  );
  assert(
    JSON.stringify(imported.people[0].legacyProfile) ===
      JSON.stringify(profile),
    "profile metadata remains available in backup",
  );
  let refused = false;
  try {
    importState({ items: [profile] }, imported);
  } catch {
    refused = true;
  }
  assert(refused, "replayed profile is refused");
});

Deno.test("legacy profiles accept 200-character names and more than 100 records", () => {
  const settings = {
    birth: "1990",
    lifeExpectancy: 88,
    profile: "masculine",
    speed: 1,
    grainSize: 1,
    grainCount: 170,
    widthScale: 1,
    motion: true,
    previewAge: null,
  };
  const items = Array.from(
    { length: 101 },
    (_, i) => ({
      id: `id-${i}`,
      name: i === 0 ? "A".repeat(200) : `Profile ${i}`,
      revision: i,
      archived: i === 1,
      pinned: false,
      settings,
    }),
  );
  const before = JSON.stringify(base);
  const result = importState({ items }, base);
  assert(validState(result), "101 profiles form a valid state");
  assert(
    result.people.length === items.length &&
      result.people[0].name === items[0].name,
    "every profile and full name preserved",
  );
  assert(
    result.people.every((p, i) =>
      JSON.stringify(p.legacyProfile) === JSON.stringify(items[i])
    ),
    "all original profile metadata retained",
  );
  assert(JSON.stringify(base) === before, "input remains unchanged");
  let retry: unknown;
  try {
    importState({ items }, result);
  } catch (error) {
    retry = error;
  }
  assert(
    retry instanceof ImportError && retry.code === "alreadyImported",
    "retry visibly refuses without duplicates",
  );
  assert(result.people.length === 101, "retry does not mutate existing state");
});

Deno.test("capacity admits the bound and visibly refuses overflow without mutation", () => {
  const settings = { birth: "1990", lifeExpectancy: 88, profile: "masculine" };
  const items = Array.from(
    { length: MAX_PEOPLE },
    (_, i) => ({ id: `id-${i}`, name: `Profile ${i}`, settings }),
  );
  const result = importState({ items }, base);
  assert(
    validState(result) && result.people.length === MAX_PEOPLE,
    "full supported bound accepted",
  );
  let failure: unknown;
  try {
    importState({
      items: [...items, { id: "overflow", name: "extra", settings }],
    }, base);
  } catch (error) {
    failure = error;
  }
  assert(
    failure instanceof ImportError && failure.code === "capacity",
    "overflow reports capacity",
  );
  assert(base.people.length === 0, "source state unchanged");
});

Deno.test("malformed or conflicting imports refuse the whole file", () => {
  const valid = {
    id: "one",
    name: "One",
    settings: { birth: "1990", lifeExpectancy: 80, profile: "feminine" },
  };
  const invalids = [
    { items: [valid, null] },
    { items: [valid, { ...valid }] },
    { items: [valid, { name: "missing ID", settings: valid.settings }] },
    {
      "family.lifeCountdown": {
        members: {
          self: {
            birthDate: null,
            lifespanYears: null,
            source: "unknown",
            tentative: false,
          },
          unrecognized: {},
        },
      },
    },
    {
      format: "prometheus-settings",
      items: [{
        key: "family.lifeCountdown",
        value: {
          members: {
            self: {
              birthDate: null,
              lifespanYears: null,
              source: "unknown",
              tentative: false,
            },
          },
        },
      }, { key: "hourglass.device", value: { speed: 999 } }],
    },
  ];
  for (const raw of invalids) {
    let refused = false;
    try {
      importState(raw, base);
    } catch {
      refused = true;
    }
    assert(refused, "invalid or duplicated input refused");
    assert(base.people.length === 0, "no partial import");
  }
});

Deno.test("family import preserves future dates and local today is valid", () => {
  const date = new Date(),
    today = `${date.getFullYear()}-${
      String(date.getMonth() + 1).padStart(2, "0")
    }-${String(date.getDate()).padStart(2, "0")}`;
  assert(validBirth(today), "today uses local civil date");
  const nextYear = String(date.getFullYear() + 1);
  const source = {
    "family.lifeCountdown": {
      members: {
        self: {
          birthDate: `${nextYear}-03`,
          lifespanYears: 80,
          source: "estimate",
          tentative: true,
        },
      },
    },
  };
  const result = importState(source, base);
  assert(
    validState(result) && result.people[0].birth === `${nextYear}-03`,
    "future source date retained",
  );
  assert(
    age(result.people[0].birth) === null,
    "future birthday is not represented as age zero",
  );
});

Deno.test("storage quota failure leaves old value; failed readback reports unknown outcome", () => {
  let value = "previous";
  const failedWrite = {
    setItem() {
      throw new DOMException("quota", "QuotaExceededError");
    },
    getItem() {
      return value;
    },
  };
  let failure: unknown;
  try {
    persist(base, "previous", failedWrite);
  } catch (error) {
    failure = error;
  }
  assert(
    failure instanceof PersistenceError && failure.phase === "write" &&
      value === "previous",
    "write refusal preserves prior data",
  );
  let reads = 0;
  const failedRead = {
    setItem(_key: string, next: string) {
      value = next;
    },
    getItem() {
      if (reads++ === 0) return "previous";
      throw Error("read blocked");
    },
  };
  failure = undefined;
  try {
    persist(base, "previous", failedRead);
  } catch (error) {
    failure = error;
  }
  assert(
    failure instanceof PersistenceError && failure.phase === "unverified" &&
      value === JSON.stringify(base),
    "readback failure does not falsely claim rollback",
  );
});

Deno.test("stale tab cannot overwrite a newer person or export stale state", () => {
  let value: string | null = null;
  const storage = {
    getItem() {
      return value;
    },
    setItem(_key: string, next: string) {
      value = next;
    },
  };
  const first = {
    ...base,
    people: [{
      id: "one",
      name: "One",
      birth: "",
      lifespan: null,
      profile: "masculine" as const,
    }],
    selected: "one",
  };
  const newValue = persist(first, null, storage);
  const source = {
    items: [{
      id: "old",
      name: "Imported",
      settings: {
        birth: "1990",
        lifeExpectancy: 80,
        profile: "feminine",
      },
    }],
  };
  const staleImport = importState(source, base);
  let failure: unknown;
  try {
    persist(staleImport, null, storage);
  } catch (error) {
    failure = error;
  }
  assert(
    failure instanceof PersistenceError && failure.phase === "conflict",
    "stale import refused",
  );
  assert(
    value === newValue && JSON.parse(value).people[0].id === "one",
    "newer state remains exact",
  );
  failure = undefined;
  try {
    assertCurrent(null, storage);
  } catch (error) {
    failure = error;
  }
  assert(
    failure instanceof PersistenceError && failure.phase === "conflict",
    "stale export refused",
  );
  const refreshed = importState(source, first);
  assert(
    persist(refreshed, newValue, storage) === value &&
      refreshed.people.length === 2,
    "refreshed import preserves the newer person",
  );
});

Deno.test("a failed pre-write read never attempts to write", () => {
  let wrote = false;
  const storage = {
    getItem(): string | null {
      throw Error("read blocked");
    },
    setItem() {
      wrote = true;
    },
  };
  let failure: unknown;
  try {
    persist(base, null, storage);
  } catch (error) {
    failure = error;
  }
  assert(
    failure instanceof PersistenceError && failure.phase === "read",
    "pre-read failure reported",
  );
  assert(!wrote, "no write attempted");
});
