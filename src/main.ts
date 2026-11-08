import { mountHourglass } from "./renderer.ts";
import {
  age,
  applyLegacyAppearance,
  assertCurrent,
  blank,
  ImportError,
  importState,
  key,
  MAX_IMPORT_BYTES,
  MAX_NAME_LENGTH,
  MAX_PEOPLE,
  persist,
  PersistenceError,
  type Person,
  type State,
  validBirth,
  validState,
} from "./model.ts";

const words = {
  en: {
    people: "People",
    add: "Add person",
    name: "Name",
    birth: "Birth date",
    birthHint: "YYYY, YYYY-MM, or YYYY-MM-DD",
    lifespan: "Lifespan in years",
    shape: "Figure",
    masculine: "Masculine",
    feminine: "Feminine",
    delete: "Remove person",
    confirm: "Remove this person?",
    empty: "Add a person to begin",
    unknown: "Set a birth date and lifespan to begin",
    future: "Birth date is in the future",
    settings: "Settings",
    close: "Close",
    appearance: "Appearance",
    theme: "Theme",
    font: "Font",
    fontSystem: "System",
    fontPixel: "Pixel",
    system: "System",
    light: "Light",
    dark: "Dark",
    language: "Language",
    sand: "Sand",
    speed: "Animation speed",
    size: "Grain size",
    count: "Grain count",
    width: "Figure width",
    motion: "Animate sand",
    data: "Data",
    import: "Import JSON",
    export: "Export backup",
    importHelp:
      "Import a Sandtime backup, family.lifeCountdown record, or legacy Hourglass profiles. Existing people are kept when importing Prometheus data.",
    legacyAppearance: "Apply imported appearance",
    offlineReady: "Available offline on this browser",
    offlineUnavailable: "Offline access unavailable in this browser",
    saving: "Saving locally…",
    saved: "Saved locally",
    imported: "Import complete",
    invalid: "Could not import this file. No data was changed.",
    importCapacity: "Maximum {max} people. No data was changed.",
    importTooLarge: "File exceeds 5 MB. No data was changed.",
    importAlready:
      "One or more people were already imported. No data was changed.",
    storageUnverified:
      "Save could not be verified. Reload before making more changes.",
    storageConflict:
      "Data changed in another tab. Reload before making more changes.",
    storageBusy: "Another change is being saved. Please try again.",
    storageLock:
      "This browser cannot safely save here. Use a secure origin with Web Locks.",
    storageError: "Could not save locally. Your change was not applied.",
    dateError: "Enter a valid past date.",
    nameError: "Enter a name.",
    lifespanError: "Enter a lifespan between 1 and 200.",
    addName: "New person",
    age: "Age",
    reset: "Reset to current age",
    preview: "Preview age",
    years: "years",
    approx: "Approximate date",
    readError: "Saved data could not be read. It has not been changed.",
    importReplace:
      "A Sandtime backup replaces the current Sandtime data. Continue?",
    format: "Choose a JSON file",
  },
  "zh-Hant": {
    people: "人物",
    add: "新增人物",
    name: "名稱",
    birth: "出生日期",
    birthHint: "年、年-月，或年-月-日",
    lifespan: "預期壽命（年）",
    shape: "人物",
    masculine: "男性",
    feminine: "女性",
    delete: "移除人物",
    confirm: "移除此人物？",
    empty: "新增人物以開始",
    unknown: "設定出生日期與壽命以開始",
    future: "出生日期尚未到來",
    settings: "設定",
    close: "關閉",
    appearance: "外觀",
    theme: "主題",
    font: "字體",
    fontSystem: "系統",
    fontPixel: "像素",
    system: "跟隨系統",
    light: "淺色",
    dark: "深色",
    language: "語言",
    sand: "沙粒",
    speed: "動畫速度",
    size: "沙粒大小",
    count: "沙粒數量",
    width: "人物寬度",
    motion: "沙粒動畫",
    data: "資料",
    import: "匯入 JSON",
    export: "匯出備份",
    importHelp:
      "匯入 Sandtime 備份、family.lifeCountdown 記錄或舊 Hourglass 人物。匯入 Prometheus 資料時會保留現有人物。",
    legacyAppearance: "套用匯入的外觀",
    offlineReady: "此瀏覽器可離線使用",
    offlineUnavailable: "此瀏覽器無法離線使用",
    saving: "正在儲存至本機…",
    saved: "已儲存於本機",
    imported: "匯入完成",
    invalid: "無法匯入此檔案，資料未變更。",
    importCapacity: "最多 {max} 個人物，資料未變更。",
    importTooLarge: "檔案超過 5 MB，資料未變更。",
    importAlready: "一個或多個人物已匯入，資料未變更。",
    storageUnverified: "無法確認儲存結果，請重新載入後再變更。",
    storageConflict: "資料已在其他分頁變更，請重新載入後再變更。",
    storageBusy: "另一項變更正在儲存，請再試一次。",
    storageLock: "此瀏覽器無法在此安全儲存，請使用支援 Web Locks 的安全網址。",
    storageError: "無法儲存至本機，變更未套用。",
    dateError: "請輸入有效的過去日期。",
    nameError: "請輸入名稱。",
    lifespanError: "請輸入 1 到 200 年的壽命。",
    addName: "新人物",
    age: "年齡",
    reset: "重設為目前年齡",
    preview: "預覽年齡",
    years: "歲",
    approx: "約略日期",
    readError: "無法讀取已儲存資料，原資料未變更。",
    importReplace: "Sandtime 備份會取代目前資料。繼續？",
    format: "選擇 JSON 檔案",
  },
  "zh-Hans": {
    people: "人物",
    add: "新增人物",
    name: "名称",
    birth: "出生日期",
    birthHint: "年、年-月，或年-月-日",
    lifespan: "预期寿命（年）",
    shape: "人物",
    masculine: "男性",
    feminine: "女性",
    delete: "移除人物",
    confirm: "移除此人物？",
    empty: "新增人物以开始",
    unknown: "设置出生日期与寿命以开始",
    future: "出生日期尚未到来",
    settings: "设置",
    close: "关闭",
    appearance: "外观",
    theme: "主题",
    font: "字体",
    fontSystem: "系统",
    fontPixel: "像素",
    system: "跟随系统",
    light: "浅色",
    dark: "深色",
    language: "语言",
    sand: "沙粒",
    speed: "动画速度",
    size: "沙粒大小",
    count: "沙粒数量",
    width: "人物宽度",
    motion: "沙粒动画",
    data: "数据",
    import: "导入 JSON",
    export: "导出备份",
    importHelp:
      "导入 Sandtime 备份、family.lifeCountdown 记录或旧 Hourglass 人物。导入 Prometheus 数据时会保留现有人物。",
    legacyAppearance: "应用导入的外观",
    offlineReady: "此浏览器可离线使用",
    offlineUnavailable: "此浏览器无法离线使用",
    saving: "正在保存到本机…",
    saved: "已保存到本机",
    imported: "导入完成",
    invalid: "无法导入此文件，数据未更改。",
    importCapacity: "最多 {max} 个人物，数据未更改。",
    importTooLarge: "文件超过 5 MB，数据未更改。",
    importAlready: "一个或多个人物已导入，数据未更改。",
    storageUnverified: "无法确认保存结果，请重新加载后再更改。",
    storageConflict: "数据已在其他标签页更改，请重新加载后再更改。",
    storageBusy: "另一项更改正在保存，请再试一次。",
    storageLock: "此浏览器无法在此安全保存，请使用支持 Web Locks 的安全网址。",
    storageError: "无法保存到本机，更改未应用。",
    dateError: "请输入有效的过去日期。",
    nameError: "请输入名称。",
    lifespanError: "请输入 1 到 200 年的寿命。",
    addName: "新人物",
    age: "年龄",
    reset: "重设为当前年龄",
    preview: "预览年龄",
    years: "岁",
    approx: "约略日期",
    readError: "无法读取已保存数据，原数据未更改。",
    importReplace: "Sandtime 备份会替换当前数据。继续？",
    format: "选择 JSON 文件",
  },
} as const;
const root = document.querySelector<HTMLElement>("#app")!;
let state: State = blank();
let expected: string | null = null;
let blocked: "read" | "unverified" | "conflict" | null = null;
let saving = false;
try {
  expected = localStorage.getItem(key);
  if (expected !== null) {
    const parsed = JSON.parse(expected);
    if (!validState(parsed)) throw Error();
    state = parsed;
  }
} catch {
  blocked = "read";
}
const t = (k: keyof typeof words.en) => words[state.language][k];
let preview: number | null = null;
root.innerHTML =
  `<header><div class="brand"><span class="brand-mark">◌</span><strong>SANDTIME</strong></div><button id="settings" class="icon" type="button" aria-label="Settings">⚙</button></header><section class="stage"><div class="stage-head"><label><span id="peopleLabel"></span><select id="person"></select></label><button id="add" class="secondary" type="button"></button></div><div class="scene-wrap"><div id="scene"></div><div id="overlay" class="overlay"></div></div><div class="scrub"><label for="scrub" id="previewLabel"></label><input id="scrub" type="range" min="0" max="100" step="0.1"><button id="reset" type="button" class="secondary"></button></div></section><aside id="panel" hidden><div class="panel-head"><h1 id="settingsTitle"></h1><button id="close" class="icon" type="button">×</button></div><div id="content"></div></aside><div id="status" role="status" aria-live="polite"></div><input id="file" type="file" accept="application/json,.json" hidden>`;
const el = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const scene = el<HTMLDivElement>("scene"),
  personSelect = el<HTMLSelectElement>("person"),
  panel = el<HTMLElement>("panel"),
  content = el<HTMLElement>("content"),
  status = el<HTMLElement>("status"),
  scrub = el<HTMLInputElement>("scrub");
const renderer = mountHourglass(scene);
function message(s: string) {
  status.textContent = s;
}
function blockedMessage() {
  return t(
    blocked === "conflict"
      ? "storageConflict"
      : blocked === "unverified"
      ? "storageUnverified"
      : "readError",
  );
}
addEventListener("storage", (event) => {
  if (
    !blocked && event.storageArea === localStorage &&
    (event.key === key || event.key === null) &&
    event.newValue !== expected
  ) {
    blocked = "conflict";
    message(blockedMessage());
  }
});
async function save(next: State): Promise<boolean> {
  if (blocked) {
    message(blockedMessage());
    return false;
  }
  if (saving) {
    message(t("storageBusy"));
    return false;
  }
  if (!navigator.locks) {
    message(t("storageLock"));
    return false;
  }
  if (next.people.length > MAX_PEOPLE) {
    message(t("importCapacity").replace("{max}", String(MAX_PEOPLE)));
    return false;
  }
  saving = true;
  // Prevent a second user edit while the Web Lock is pending: its state would
  // otherwise be based on the previous snapshot and must be rejected.
  const controls = Array.from(
    root.querySelectorAll<
      | HTMLInputElement
      | HTMLButtonElement
      | HTMLSelectElement
      | HTMLTextAreaElement
    >("input, button, select, textarea"),
  );
  const disabled = controls.map((control) => control.disabled);
  controls.forEach((control) => control.disabled = true);
  message(t("saving"));
  const prior = expected;
  try {
    const written = await navigator.locks.request(
      key,
      { ifAvailable: true },
      (lock) => {
        if (!lock) return null;
        if (blocked) throw new PersistenceError("conflict");
        return persist(next, prior);
      },
    );
    if (written === null) {
      message(t("storageBusy"));
      return false;
    }
    expected = written;
    state = next;
    message(t("saved"));
    return true;
  } catch (error) {
    if (
      error instanceof PersistenceError &&
      (error.phase === "unverified" || error.phase === "read" ||
        error.phase === "conflict")
    ) {
      blocked = error.phase;
      message(blockedMessage());
    } else message(t("storageError"));
    return false;
  } finally {
    controls.forEach((control, index) => control.disabled = disabled[index]);
    saving = false;
  }
}
const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]!),
  );
function selected(): Person | undefined {
  return state.people.find((p) => p.id === state.selected);
}
function renderScene(visual: State = state) {
  const p = selected(),
    current = p ? age(p.birth) : null,
    target = p?.lifespan ?? null,
    shown = preview ?? current;
  const active = current !== null && target !== null;
  el("overlay").textContent = p
    ? active ? "" : p.birth && !validBirth(p.birth) ? t("future") : t("unknown")
    : t("empty");
  scrub.disabled = !active;
  scrub.max = String(target ?? 100);
  scrub.value = String(Math.min(shown ?? 0, target ?? 100));
  el("previewLabel").textContent = active
    ? `${t("age")} ${
      new Intl.NumberFormat(state.language, { maximumFractionDigits: 1 })
        .format(shown!)
    } ${t("years")}${
      p!.birth.length < 10 || p!.tentative || p!.source === "estimate"
        ? ` · ${t("approx")}`
        : ""
    }`
    : t("preview");
  renderer.update({
    progress: active ? Math.max(0, Math.min(1, shown! / target!)) : 0,
    profile: p?.profile ?? "masculine",
    ink: getComputedStyle(document.documentElement).getPropertyValue("--ink")
      .trim(),
    motion: visual.motion,
    speed: visual.speed,
    grainSize: visual.grainSize,
    grainCount: visual.grainCount,
    widthScale: visual.widthScale,
  });
}
function render() {
  document.documentElement.lang = state.language;
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.dataset.font = state.font ?? "system";
  el("peopleLabel").textContent = t("people");
  el("add").textContent = t("add");
  el("reset").textContent = t("reset");
  el("settingsTitle").textContent = t("settings");
  el("settings").setAttribute("aria-label", t("settings"));
  el("close").setAttribute("aria-label", t("close"));
  personSelect.innerHTML = state.people.length
    ? state.people.map((p) =>
      `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`
    ).join("")
    : `<option value="">${escapeHtml(t("empty"))}</option>`;
  personSelect.value = state.selected;
  personSelect.disabled = !state.people.length;
  const p = selected();
  content.innerHTML = `${
    p
      ? `<section><h2>${t("people")}</h2><form id="personForm"><label>${
        t("name")
      }<input name="name" maxlength="${MAX_NAME_LENGTH}" required value="${
        escapeHtml(p.name)
      }"></label><label>${t("birth")}<input name="birth" placeholder="${
        t("birthHint")
      }" value="${escapeHtml(p.birth)}" inputmode="numeric"></label><label>${
        t("lifespan")
      }<input name="lifespan" type="number" min="1" max="200" step="1" value="${
        p.lifespan ?? ""
      }"></label><label>${
        t("shape")
      }<select name="profile"><option value="masculine" ${
        p.profile === "masculine" ? "selected" : ""
      }>${t("masculine")}</option><option value="feminine" ${
        p.profile === "feminine" ? "selected" : ""
      }>${t("feminine")}</option></select></label>${
        p.legacyProfile
          ? `<button class="secondary" id="applyLegacy" type="button">${
            t("legacyAppearance")
          }</button>`
          : ""
      }<button class="danger" id="delete" type="button">${
        t("delete")
      }</button></form></section>`
      : ""
  }<section><h2>${t("appearance")}</h2><label>${t("theme")}<select id="theme">${
    ["system", "light", "dark"].map((v) =>
      `<option value="${v}" ${state.theme === v ? "selected" : ""}>${
        t(v as "system" | "light" | "dark")
      }</option>`
    ).join("")
  }</select></label><label>${
    t("font")
  }<select id="font"><option value="system" ${
    (state.font ?? "system") === "system" ? "selected" : ""
  }>${t("fontSystem")}</option><option value="pixel" ${
    state.font === "pixel" ? "selected" : ""
  }>${t("fontPixel")}</option></select></label><label>${
    t("language")
  }<select id="language"><option value="en">English</option><option value="zh-Hant">繁體中文</option><option value="zh-Hans">简体中文</option></select></label></section><section><h2>${
    t("sand")
  }</h2>${
    ([["speed", "speed", .25, 3, .25], ["grainSize", "size", .5, 2, .1], [
      "grainCount",
      "count",
      40,
      340,
      10,
    ], ["widthScale", "width", .75, 1.25, .05]] as const).map((
      [field, label, min, max, step],
    ) =>
      `<label>${t(label)} <output>${
        state[field]
      }</output><input type="range" data-field="${field}" min="${min}" max="${max}" step="${step}" value="${
        state[field]
      }"></label>`
    ).join("")
  }<label class="check"><input id="motion" type="checkbox" ${
    state.motion ? "checked" : ""
  }>${t("motion")}</label></section><section><h2>${t("data")}</h2><p>${
    t("importHelp")
  }</p><div class="actions"><button id="import" class="secondary">${
    t("import")
  }</button><button id="export" class="secondary">${
    t("export")
  }</button></div></section>`;
  el<HTMLSelectElement>("language").value = state.language;
  el<HTMLSelectElement>("theme").onchange = async (e) => {
    await save({
      ...state,
      theme: (e.target as HTMLSelectElement).value as State["theme"],
    });
    render();
  };
  el<HTMLSelectElement>("font").onchange = async (e) => {
    await save({
      ...state,
      font: (e.target as HTMLSelectElement).value as "system" | "pixel",
    });
    render();
  };
  el<HTMLSelectElement>("language").onchange = async (e) => {
    await save({
      ...state,
      language: (e.target as HTMLSelectElement).value as State["language"],
    });
    render();
  };
  el<HTMLInputElement>("motion").onchange = async (e) => {
    await save({ ...state, motion: (e.target as HTMLInputElement).checked });
    render();
  };
  content.querySelectorAll<HTMLInputElement>("input[data-field]").forEach(
    (input) => {
      input.oninput = () => {
        const next = { ...state, [input.dataset.field!]: Number(input.value) };
        input.previousElementSibling!.textContent = input.value;
        renderScene(next);
      };
      input.onchange = async () => {
        const next = { ...state, [input.dataset.field!]: Number(input.value) };
        await save(next);
        render();
      };
    },
  );
  if (p) {
    const form = el<HTMLFormElement>("personForm");
    form.onchange = async () => {
      const fd = new FormData(form),
        name = String(fd.get("name")).trim(),
        birth = String(fd.get("birth")).trim(),
        raw = String(fd.get("lifespan")),
        lifespan = raw ? Number(raw) : null,
        profile = String(fd.get("profile")) as Person["profile"];
      if (!name) {
        message(t("nameError"));
        return;
      }
      if (birth !== p.birth && !validBirth(birth)) {
        message(t("dateError"));
        return;
      }
      if (
        lifespan !== null &&
        (!Number.isInteger(lifespan) || lifespan < 1 || lifespan > 200)
      ) {
        message(t("lifespanError"));
        return;
      }
      if (
        await save({
          ...state,
          people: state.people.map((x) =>
            x.id === p.id ? { ...p, name, birth, lifespan, profile } : x
          ),
        })
      ) {
        preview = null;
        render();
      } else render();
    };
    if (p.legacyProfile) {
      el<HTMLButtonElement>("applyLegacy").onclick = async () => {
        try {
          if (await save(applyLegacyAppearance(state, p))) render();
        } catch {
          message(t("invalid"));
        }
      };
    }
    el<HTMLButtonElement>("delete").onclick = async () => {
      if (!confirm(t("confirm"))) return;
      const people = state.people.filter((x) => x.id !== p.id);
      if (await save({ ...state, people, selected: people[0]?.id ?? "" })) {
        preview = null;
        render();
      }
    };
  }
  el<HTMLButtonElement>("import").onclick = () =>
    el<HTMLInputElement>("file").click();
  el<HTMLButtonElement>("export").onclick = async () => {
    if (blocked || saving) {
      message(blocked ? blockedMessage() : t("storageBusy"));
      return;
    }
    saving = true;
    let data: string | null;
    try {
      const capture = () => {
        if (blocked) throw new PersistenceError("conflict");
        assertCurrent(expected);
        return JSON.stringify(state, null, 2);
      };
      data = navigator.locks
        ? await navigator.locks.request(
          key,
          { ifAvailable: true },
          (lock) => lock ? capture() : null,
        )
        : capture();
      if (data === null) {
        message(t("storageBusy"));
        return;
      }
    } catch (error) {
      if (
        error instanceof PersistenceError &&
        (error.phase === "read" || error.phase === "conflict")
      ) {
        blocked = error.phase;
        message(blockedMessage());
      } else message(t("storageError"));
      return;
    } finally {
      saving = false;
    }
    const a = document.createElement("a");
    const url = URL.createObjectURL(
      new Blob([data], { type: "application/json" }),
    );
    a.href = url;
    a.download = "sandtime-backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  renderScene();
}
personSelect.onchange = async () => {
  if (await save({ ...state, selected: personSelect.value })) {
    preview = null;
    render();
  } else render();
};
el<HTMLButtonElement>("add").onclick = async () => {
  const p: Person = {
    id: crypto.randomUUID(),
    name: t("addName"),
    birth: "",
    lifespan: null,
    profile: "masculine",
  };
  if (await save({ ...state, people: [...state.people, p], selected: p.id })) {
    preview = null;
    panel.hidden = false;
    render();
    content.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
  }
};
el<HTMLButtonElement>("settings").onclick = () => {
  panel.hidden = !panel.hidden;
};
el<HTMLButtonElement>("close").onclick = () => {
  panel.hidden = true;
  el<HTMLButtonElement>("settings").focus();
};
scrub.oninput = () => {
  preview = Number(scrub.value);
  renderScene();
};
el<HTMLButtonElement>("reset").onclick = () => {
  preview = null;
  renderScene();
};
el<HTMLInputElement>("file").onchange = async (e) => {
  const input = e.target as HTMLInputElement, file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > MAX_IMPORT_BYTES) {
      message(t("importTooLarge"));
      return;
    }
    const raw = JSON.parse(await file.text());
    if (validState(raw) && !confirm(t("importReplace"))) return;
    const next = importState(raw, state);
    if (!validState(next)) throw Error();
    if (await save(next)) {
      preview = null;
      render();
      message(t("imported"));
    }
  } catch (error) {
    if (error instanceof ImportError && error.code === "capacity") {
      message(t("importCapacity").replace("{max}", String(MAX_PEOPLE)));
    } else if (
      error instanceof ImportError && error.code === "alreadyImported"
    ) {
      message(t("importAlready"));
    } else message(t("invalid"));
  } finally {
    input.value = "";
  }
};
matchMedia("(prefers-color-scheme: dark)").addEventListener(
  "change",
  () => renderScene(),
);
render();
if (blocked) message(blockedMessage());
let drag: { pointer: number; y: number; start: number; range: number } | null =
  null;
scene.style.touchAction = "none";
scene.addEventListener("pointerdown", (event) => {
  const p = selected(), current = p ? age(p.birth) : null;
  if (!p?.lifespan || current === null) return;
  drag = {
    pointer: event.pointerId,
    y: event.clientY,
    start: preview ?? current,
    range: p.lifespan,
  };
  scene.setPointerCapture(event.pointerId);
});
scene.addEventListener("pointermove", (event) => {
  if (!drag || drag.pointer !== event.pointerId) return;
  preview = Math.max(
    0,
    Math.min(
      drag.range,
      drag.start +
        (drag.y - event.clientY) / Math.max(scene.clientHeight, 1) * drag.range,
    ),
  );
  renderScene();
});
for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) {
  scene.addEventListener(event, () => {
    drag = null;
  });
}
scene.addEventListener("wheel", (event) => {
  const p = selected(), current = p ? age(p.birth) : null;
  if (!p?.lifespan || current === null) return;
  event.preventDefault();
  const pixels = event.deltaY *
    (event.deltaMode === 1
      ? 16
      : event.deltaMode === 2
      ? scene.clientHeight
      : 1);
  preview = Math.max(
    0,
    Math.min(
      p.lifespan,
      (preview ?? current) +
        pixels / Math.max(scene.clientHeight, 1) * p.lifespan,
    ),
  );
  renderScene();
}, { passive: false });

if ("serviceWorker" in navigator) {
  void navigator.serviceWorker.register("/sw.js").then(async (registration) => {
    await navigator.serviceWorker.ready;
    if (!blocked && !status.textContent) message(t("offlineReady"));
    await registration.update();
  }).catch(() => {
    if (!blocked && !status.textContent) message(t("offlineUnavailable"));
  });
} else if (!blocked) message(t("offlineUnavailable"));
