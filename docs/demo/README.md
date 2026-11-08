# Sandtime demo image

`sandtime-en.png` is an unedited screenshot of this application, captured on
2026-10-27 in an isolated local origin at 907 × 850 CSS pixels. It uses only a
synthetic person named Demo person, birth date 2000-01-01, and a chosen lifespan
of 80 years. Time values are the capture-time display, not fixed examples or a
predicted lifespan. The interface language is English.

The origin initially had no local storage. The person was added through the
application UI; the stored state survived reload byte for byte. The served
`app.js` matched the independently built selected source:

- Selected source seal:
  `2840ee75537767fba507aadda1c273875b901e1904ed0200b7e57553f289a6e0`
- Built bundle SHA-256:
  `ba770db6015259c01a06b3f4be0dca422df01000213621958fbe3901aef1d510`
- Screenshot SHA-256:
  `0b2f997673f40b7f085a796a66a7c1969be1ad103c18c7e94639befd4b6ad752`

This proves the illustrated UI and this isolated save/reload path. It does not
prove every import, browser, device or owner-installed service. No owner
profile, real birth record, Prometheus data or existing service was used.

Reproduce with `deno task build` and `deno task preview`, then add the same
synthetic person in a fresh origin, choose light theme and close Settings. Use
the existing font and artwork notices in the repository; the screenshot does not
grant rights to third-party components beyond their existing licenses.
