"use strict";
const assert = require("node:assert/strict");
const api = require("./interaction-examples.js");
let checks = 0;
function test(name, fn) {
  fn();
  checks += 1;
  process.stdout.write("PASS " + name + "\n");
}
const enter = (changes = {}) => ({ key: "Enter", ...changes });
const ready = { value: "你好" };

test("IME composition and post-composition Enter are blocked", () => {
  let time = 0;
  const guard = api.createCompositionGuard({ now: () => time });
  guard.start();
  assert.equal(guard.shouldSubmit(enter(), ready), false);
  guard.end();
  assert.equal(guard.shouldSubmit(enter(), ready), false);
  time = 49;
  assert.equal(guard.shouldSubmit(enter(), ready), false);
  time = 50;
  assert.equal(guard.shouldSubmit(enter(), ready), true);
  assert.equal(guard.shouldSubmit(enter({ isComposing: true }), ready), false);
  assert.equal(guard.shouldSubmit(enter({ keyCode: 229 }), ready), false);
  assert.equal(guard.shouldSubmit(enter({ which: 229 }), ready), false);
});
test("empty, repeated, pending, modified and consumed Enter never submits", () => {
  const guard = api.createCompositionGuard();
  assert.equal(guard.shouldSubmit(enter(), { value: " \n\t" }), false);
  for (const flags of [{ repeat: true }, { shiftKey: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true }, { defaultPrevented: true }]) {
    assert.equal(guard.shouldSubmit(enter(flags), ready), false);
  }
  for (const flags of [{ disabled: true }, { pending: true }, { suggestionsOpen: true }]) {
    assert.equal(guard.shouldSubmit(enter(), { ...ready, ...flags }), false);
  }
  assert.equal(guard.shouldSubmit({ key: "a" }, ready), false);
});
test("mid-sentence mention replacement keeps the complete suffix and caret", () => {
  const text = "请问 @设计 后续内容保留";
  const caret = text.indexOf(" 后续");
  const trigger = api.findSuggestionTrigger(text, caret);
  assert.deepEqual({ from: trigger.from, to: trigger.to, query: trigger.query }, { from: 3, to: caret, query: "设计" });
  assert.deepEqual(api.replaceSuggestion(text, trigger, "@设计助手"), { text: "请问 @设计助手 后续内容保留", caret: 8 });
  assert.equal(api.replaceSuggestion(text + "！", trigger, "@助手"), null);
  assert.equal(api.replaceSuggestion(text, { ...trigger, from: 0 }, "@助手"), null);
});
test("suggestion boundaries reject emails, invalid carets and stale offsets", () => {
  assert.equal(api.findSuggestionTrigger("hello@example.com", 17), null);
  assert.equal(api.findSuggestionTrigger("@A ", 3), null);
  assert.equal(api.findSuggestionTrigger("x", 2), null);
  assert.equal(api.findSuggestionTrigger("x", -1), null);
  assert.equal(api.findSuggestionTrigger("x", 0.5), null);
  assert.equal(api.findSuggestionTrigger("@", 1).query, "");
  assert.equal(api.findSuggestionTrigger("/summarize", 10).symbol, "/");
  const trigger = api.findSuggestionTrigger("@alex尾部", 3);
  assert.deepEqual(api.replaceSuggestion("@alex尾部", trigger, "@Alice"), { text: "@Aliceex尾部", caret: 6 });
});
const metrics = (top, height = 1000, viewport = 400) => ({ scrollTop: top, scrollHeight: height, clientHeight: viewport });
test("user upward scrolling releases pinning even within the bottom threshold", () => {
  let time = 0;
  const pin = api.createScrollPinning({ now: () => time });
  pin.onScroll(metrics(600), { source: "programmatic" });
  assert.equal(pin.onScroll(metrics(590)).pinned, false);
  assert.equal(pin.onContentChange(metrics(590, 1030)).shouldAutoScroll, false);
  time = 149;
  assert.equal(pin.onScroll(metrics(600, 1030)).pinned, false);
  time = 150;
  assert.equal(pin.onScroll(metrics(601, 1030)).pinned, true);
});
test("cooldown expiration alone does not steal user scroll position", () => {
  let time = 0;
  const pin = api.createScrollPinning({ now: () => time });
  pin.onScroll(metrics(600), { source: "programmatic" });
  pin.onUserIntent("up");
  time = 1000;
  assert.equal(pin.onContentChange(metrics(590, 1000)).shouldAutoScroll, false);
  assert.equal(pin.onContentChange(metrics(200, 1400)).showJumpButton, true);
  assert.equal(pin.jumpToBottom().shouldAutoScroll, true);
  assert.equal(pin.onScroll(metrics(1000, 1400), { source: "programmatic" }).showJumpButton, false);
});
test("jump visibility and pinning use strict 120px and inclusive 40px boundaries", () => {
  const pin = api.createScrollPinning();
  assert.equal(pin.getState(metrics(480)).showJumpButton, false);
  assert.equal(pin.getState(metrics(479)).showJumpButton, true);
  assert.equal(pin.onScroll(metrics(559)).pinned, false);
  assert.equal(pin.onScroll(metrics(560)).pinned, true);
  assert.equal(pin.getState(metrics(0, 100, 400)).distanceToBottom, 0);
  assert.throws(() => pin.getState({ scrollTop: NaN, scrollHeight: 1, clientHeight: 1 }), TypeError);
});
test("roving handles no selection, empty groups, wrapping, Home and End", () => {
  const options = { count: 4 };
  assert.equal(api.nextRovingIndex(-1, "ArrowRight", options), 0);
  assert.equal(api.nextRovingIndex(-1, "ArrowLeft", options), 3);
  assert.equal(api.nextRovingIndex(3, "ArrowRight", options), 0);
  assert.equal(api.nextRovingIndex(0, "ArrowLeft", options), 3);
  assert.equal(api.nextRovingIndex(2, "Home", options), 0);
  assert.equal(api.nextRovingIndex(2, "End", options), 3);
  assert.equal(api.nextRovingIndex(2, "ArrowDown", options), 2);
  assert.equal(api.nextRovingIndex(0, "Home", { count: 0 }), -1);
  assert.equal(api.nextRovingIndex(3, "ArrowRight", { count: 4, loop: false }), 3);
});
test("grid respects column stride, incomplete rows, same-row wrapping and RTL", () => {
  const options = { count: 8, orientation: "grid", columns: 3 };
  assert.equal(api.nextRovingIndex(1, "ArrowDown", options), 4);
  assert.equal(api.nextRovingIndex(4, "ArrowUp", options), 1);
  assert.equal(api.nextRovingIndex(2, "ArrowUp", options), 5);
  assert.equal(api.nextRovingIndex(5, "ArrowDown", options), 2);
  assert.equal(api.nextRovingIndex(7, "ArrowRight", options), 6);
  assert.equal(api.nextRovingIndex(6, "ArrowLeft", options), 7);
  assert.equal(api.nextRovingIndex(4, "ArrowRight", { ...options, rtl: true }), 3);
  assert.equal(api.nextRovingIndex(4, "ArrowDown", { ...options, rtl: true }), 7);
  assert.equal(api.nextRovingIndex(5, "ArrowDown", { ...options, loop: false }), 5);
});
test("DOM bindings fail clearly without appropriate native elements", () => {
  assert.throws(() => api.bindComposer(null, () => {}), TypeError);
  assert.throws(() => api.bindDialog(null), TypeError);
});
test("dialog initial-focus selection prioritizes visible autofocus over earlier buttons", () => {
  // Minimal selection/handler contract only: this does not simulate browser behavior.
  let focused = null;
  let keydown = null;
  const control = (name, visible = true) => ({
    disabled: false, tabIndex: 0,
    matches: () => false, closest: () => null,
    getClientRects: () => visible ? [{}] : [],
    focus: () => { focused = name; }
  });
  const destructive = control("delete");
  const hiddenAutofocus = control("hidden", false);
  const safeAutofocus = control("cancel");
  const all = [destructive, hiddenAutofocus, safeAutofocus];
  const attrs = new Map([["aria-label", "确认操作"]]);
  const dialog = {
    tagName: "DIALOG", open: false,
    ownerDocument: {
      activeElement: null,
      defaultView: { getComputedStyle: () => ({ visibility: "visible" }) }
    },
    getAttribute: key => attrs.has(key) ? attrs.get(key) : null,
    setAttribute: (key, value) => attrs.set(key, value),
    removeAttribute: key => attrs.delete(key),
    contains: node => all.includes(node),
    querySelector: () => null,
    querySelectorAll: selector => selector === "[autofocus]:not([disabled])" ? [hiddenAutofocus, safeAutofocus] : all,
    addEventListener: (type, listener) => { if (type === "keydown") keydown = listener; },
    removeEventListener: (type, listener) => { if (type === "keydown" && keydown === listener) keydown = null; },
    focus: () => { focused = "dialog"; },
    showModal() { this.open = true; }, close() { this.open = false; }
  };
  const binding = api.bindDialog(dialog, { initialFocus: "#unavailable" });
  assert.equal(binding.showModal(), true);
  assert.equal(focused, "cancel");
  const tab = (active, shiftKey = false) => {
    dialog.ownerDocument.activeElement = active;
    let prevented = false;
    keydown({ key: "Tab", shiftKey, preventDefault: () => { prevented = true; } });
    return prevented;
  };
  assert.equal(tab(safeAutofocus), true);
  assert.equal(focused, "delete");
  assert.equal(tab(destructive, true), true);
  assert.equal(focused, "cancel");
  assert.equal(tab(null), true);
  assert.equal(focused, "delete");
  destructive.disabled = true;
  safeAutofocus.closest = () => ({}); // Newly inert subtree must be excluded.
  assert.equal(tab(null), true);
  assert.equal(focused, "dialog");
  binding.dispose();
  assert.equal(keydown, null);
});
process.stdout.write("\n" + checks + " state/selection contract tests passed. DOM focus and layout require real-browser verification.\n");
