export function motionPreferenceQuery(
  host: Pick<Window, "matchMedia"> = globalThis,
) {
  return host.matchMedia("(prefers-reduced-motion: reduce)");
}
