# Validation — 2026-10-15

- JavaScript syntax: `node --check dist/assets/chat.js` passed.
- Chrome desktop: homepage, actual bundled Inter font, 672 px composer and 20 px radius inspected. No browser console warnings/errors captured in final check.
- Chat: selected Opus, added a built-in attachment, sent a JavaScript question, observed generating and completed states with a code block. A draft typed during generation remained after completion.
- Copy reply, search with Cmd+K, filtered conversation results, Escape close, and theme switching verified through UI.
- Mobile layout: tested in a same-origin iframe with a real 390 × 844 CSS-pixel viewport. Root clientWidth and scrollWidth both 390. Drawer opened and closed on conversation selection; final aria-expanded=false and hidden sidebar inert verified.
- Screenshots: light desktop home, dark desktop chat, light mobile conversation.
- Jev assisted model/attachment navigation: 4 successful UI actions. Codex handled text input, DOM checks, screenshots and independent verification.

The Chrome viewport override did not change the tab dimensions, so the narrow-frame preview was used for mobile layout validation. This is not a physical-device or virtual-keyboard test. The temporary QA wrapper is excluded from deployment.

No real AI backend, authentication, multi-device sync, or real-device keyboard behavior is claimed. Responses are deterministic demo content.

## Repository integration

The approved index.html, chat.css and chat.js are copied without visual or behavior changes. Local font files and the shared dependencies are included. The v2 verification record applies only to its own handbook.

Portable HTML and the single-file Agent guide are generated from these sources. Package checks cover relative links, font payloads, synchronized code, syntax and the existing shared-helper tests. Browser verification of this integrated distribution was completed on 2026-10-15:

- Source entry: Chrome rendered the homepage with actual Inter font, 672 px composer, 1654 px root width and equal scroll width.
- Dark source entry: seeded code conversation rendered, one code block, no horizontal overflow. New desktop light/dark screenshots were captured from this repository.
- Portable HTML served locally: zero external script tags, zero external stylesheet links; all three embedded font payloads match the originals. Sent a demo message, observed completion with a code block, and retained the exact draft typed during generation. No captured console warnings/errors.
- Portable HTML at 390 × 844 CSS pixels in a same-origin iframe: clientWidth=scrollWidth=390; theme switching and drawer open/select/close verified; closed drawer reported aria-expanded=false and inert sidebar. New mobile screenshot captured.
- Jev integration run: 3 decisions, 1 executed action (open the sample code conversation), one low-confidence handoff; Codex handled theme selection, text input, frame interactions and all independent assertions. API time 3915 ms; loop time 4327 ms. No raw page content was sent to Jev.
- Original index.html, chat.css and chat.js remained byte-identical to the approved hosted demo. Packaging adds documentation and generated distribution only.

The portable file was browser-tested over localhost. Its no-external-resource property was checked structurally; file:// clipboard/storage behavior and physical-device behavior remain unverified. Source and portable versions share the same browser-origin localStorage during localhost tests.
