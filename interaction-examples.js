/* Claude-inspired reference v2 — independently written interaction examples.
 * Patterns informed by Caho1/open-claude-ui (MIT), commit f4947c6.
 * Not an official Claude implementation. No network, model, or tool calls.
 * Requires a modern browser for DOM bindings; pure helpers also run in Node.
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ClaudeRefV2 = api;
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";

  function createCompositionGuard(options) {
    options = options || {};
    var now = options.now || Date.now;
    var cooldownMs = options.cooldownMs == null ? 50 : options.cooldownMs;
    var composing = false;
    var endedAt = -Infinity;
    return {
      start: function () { composing = true; },
      end: function () { composing = false; endedAt = now(); },
      shouldSubmit: function (event, state) {
        state = state || {};
        return event.key === "Enter" && !event.shiftKey && !event.altKey &&
          !event.ctrlKey && !event.metaKey && !event.repeat &&
          !event.defaultPrevented && !event.isComposing &&
          event.keyCode !== 229 && event.which !== 229 && !composing &&
          now() - endedAt >= cooldownMs && !state.disabled &&
          !state.pending && !state.suggestionsOpen &&
          typeof state.value === "string" && state.value.trim().length > 0;
      }
    };
  }

  // Range is [from, to); the full snapshot prevents applying stale suggestions.
  function findSuggestionTrigger(text, caret) {
    if (typeof text !== "string" || !Number.isInteger(caret) ||
        caret < 0 || caret > text.length) return null;
    var match = /(?:^|\s)([@/])([^\s@/]*)$/u.exec(text.slice(0, caret));
    if (!match) return null;
    var from = caret - match[1].length - match[2].length;
    return { sourceText: text, from: from, to: caret, symbol: match[1], query: match[2] };
  }

  function replaceSuggestion(text, trigger, replacement) {
    if (!trigger || typeof text !== "string" || typeof replacement !== "string" ||
        text !== trigger.sourceText || !Number.isInteger(trigger.from) ||
        !Number.isInteger(trigger.to) || trigger.from < 0 ||
        trigger.to < trigger.from || trigger.to > text.length ||
        (trigger.symbol !== "@" && trigger.symbol !== "/") ||
        typeof trigger.query !== "string" ||
        text.slice(trigger.from, trigger.to) !== trigger.symbol + trigger.query) return null;
    return {
      text: text.slice(0, trigger.from) + replacement + text.slice(trigger.to),
      caret: trigger.from + replacement.length
    };
  }

  function createScrollPinning(options) {
    options = options || {};
    var now = options.now || Date.now;
    var cooldownMs = options.cooldownMs == null ? 150 : options.cooldownMs;
    var nearBottomPx = options.nearBottomPx == null ? 40 : options.nearBottomPx;
    var jumpThresholdPx = options.jumpThresholdPx == null ? 120 : options.jumpThresholdPx;
    var pinned = options.initiallyPinned !== false;
    var lastTop = null;
    var releasedAt = -Infinity;
    var latest = { scrollTop: 0, scrollHeight: 0, clientHeight: 0 };

    function measure(metrics) {
      if (metrics) {
        ["scrollTop", "scrollHeight", "clientHeight"].forEach(function (key) {
          if (!Number.isFinite(metrics[key])) throw new TypeError("Invalid scroll metric: " + key);
        });
        latest = {
          scrollTop: Math.max(0, metrics.scrollTop),
          scrollHeight: Math.max(0, metrics.scrollHeight),
          clientHeight: Math.max(0, metrics.clientHeight)
        };
      }
      return Math.max(0, latest.scrollHeight - latest.clientHeight - latest.scrollTop);
    }
    function release() { pinned = false; releasedAt = now(); }
    function getState(metrics) {
      var distance = measure(metrics);
      var remaining = Math.max(0, cooldownMs - (now() - releasedAt));
      return {
        pinned: pinned,
        shouldAutoScroll: pinned && remaining === 0,
        showJumpButton: distance > jumpThresholdPx,
        distanceToBottom: distance,
        cooldownRemainingMs: remaining
      };
    }
    return {
      // Call on wheel/touch/keyboard intent before browser scrolling can occur.
      onUserIntent: function (direction) {
        if (direction === "up") release();
        return getState();
      },
      // Mark application-driven scrolling explicitly; it must not release pinning.
      onScroll: function (metrics, event) {
        event = event || {};
        var distance = measure(metrics);
        var upward = lastTop !== null && latest.scrollTop < lastTop - 0.5;
        if (event.source !== "programmatic") {
          if (upward) release();
          else if (distance <= nearBottomPx && now() - releasedAt >= cooldownMs) pinned = true;
          else if (distance > nearBottomPx) pinned = false;
        }
        lastTop = latest.scrollTop;
        return getState();
      },
      // Call after content changes. Never re-enable pinning merely because time elapsed.
      onContentChange: function (metrics) { return getState(metrics); },
      // After this explicit user action the caller should scroll to the actual bottom.
      jumpToBottom: function () {
        pinned = true;
        releasedAt = -Infinity;
        lastTop = Math.max(0, latest.scrollHeight - latest.clientHeight);
        return getState();
      },
      getState: getState
    };
  }

  function nextRovingIndex(index, key, options) {
    options = options || {};
    var count = options.count;
    if (!Number.isInteger(count) || count <= 0) return -1;
    var orientation = options.orientation || "horizontal";
    var loop = options.loop !== false;
    var columns = Math.max(1, Math.floor(options.columns || 1));
    var rtl = !!options.rtl;
    if (key === "Home") return 0;
    if (key === "End") return count - 1;
    var horizontal = orientation === "horizontal" || orientation === "grid";
    var vertical = orientation === "vertical" || orientation === "grid";
    var step = horizontal && key === "ArrowRight" ? (rtl ? -1 : 1) :
      horizontal && key === "ArrowLeft" ? (rtl ? 1 : -1) :
      vertical && key === "ArrowDown" ? 1 : vertical && key === "ArrowUp" ? -1 : 0;
    var validIndex = Number.isInteger(index) && index >= 0 && index < count;
    if (!step) return validIndex ? index : -1;
    if (!validIndex) return step > 0 ? 0 : count - 1;
    if (orientation === "grid") {
      if (key === "ArrowUp" || key === "ArrowDown") {
        var column = index % columns;
        var candidate = index + step * columns;
        if (candidate >= 0 && candidate < count) return candidate;
        if (!loop) return index;
        return step > 0 ? column : column + Math.floor((count - 1 - column) / columns) * columns;
      }
      var rowStart = Math.floor(index / columns) * columns;
      var rowEnd = Math.min(rowStart + columns - 1, count - 1);
      var adjacent = index + step;
      if (adjacent >= rowStart && adjacent <= rowEnd) return adjacent;
      return loop ? (step > 0 ? rowStart : rowEnd) : index;
    }
    var next = index + step;
    return loop ? (next + count) % count : Math.max(0, Math.min(count - 1, next));
  }

  function bindComposer(textarea, onSubmit, options) {
    options = options || {};
    if (!textarea || textarea.tagName !== "TEXTAREA" || typeof onSubmit !== "function") {
      throw new TypeError("bindComposer requires a textarea and an onSubmit function");
    }
    var guard = createCompositionGuard(options);
    var pending = false;
    var disposed = false;
    var originalBusy = textarea.getAttribute("aria-busy");
    var originalHeight = textarea.style.height;
    var originalOverflow = textarea.style.overflowY;
    var minHeight = options.minHeight == null ? 48 : options.minHeight;
    var maxHeight = options.maxHeight == null ? 240 : options.maxHeight;
    function resize() {
      if (disposed) return;
      textarea.style.height = "auto";
      var view = textarea.ownerDocument.defaultView;
      var style = view.getComputedStyle(textarea);
      var padding = parseFloat(style.paddingTop || 0) + parseFloat(style.paddingBottom || 0);
      var border = parseFloat(style.borderTopWidth || 0) + parseFloat(style.borderBottomWidth || 0);
      var desired = textarea.scrollHeight + (style.boxSizing === "border-box" ? border : -padding);
      textarea.style.height = Math.min(maxHeight, Math.max(minHeight, desired)) + "px";
      textarea.style.overflowY = desired > maxHeight ? "auto" : "hidden";
    }
    function restoreBusy() {
      if (originalBusy === null) textarea.removeAttribute("aria-busy");
      else textarea.setAttribute("aria-busy", originalBusy);
    }
    async function submit() {
      if (disposed || pending || textarea.disabled || textarea.readOnly) return false;
      var originalValue = textarea.value;
      var value = originalValue;
      if (!guard.shouldSubmit({ key: "Enter" }, { value: value })) return false;
      pending = true;
      textarea.setAttribute("aria-busy", "true");
      try {
        var accepted = await onSubmit(value);
        if (disposed) return false;
        if (accepted === false) return false;
        if (textarea.value === originalValue) textarea.value = "";
        resize();
        return true;
      } catch (error) {
        if (!disposed) {
          if (typeof options.onError === "function") options.onError(error);
          else {
            var EventClass = textarea.ownerDocument.defaultView.CustomEvent;
            textarea.dispatchEvent(new EventClass("composererror", { bubbles: true, detail: error }));
          }
        }
        return false;
      } finally {
        pending = false;
        if (!disposed) restoreBusy();
      }
    }
    function onKeyDown(event) {
      if (guard.shouldSubmit(event, {
        value: textarea.value, pending: pending,
        disabled: textarea.disabled || textarea.readOnly,
        suggestionsOpen: typeof options.suggestionsOpen === "function" && options.suggestionsOpen()
      })) {
        event.preventDefault();
        void submit();
      }
    }
    textarea.addEventListener("compositionstart", guard.start);
    textarea.addEventListener("compositionend", guard.end);
    textarea.addEventListener("keydown", onKeyDown);
    textarea.addEventListener("input", resize);
    resize();
    return {
      submit: submit,
      resize: resize,
      isPending: function () { return pending; },
      dispose: function () {
        if (disposed) return;
        disposed = true;
        textarea.removeEventListener("compositionstart", guard.start);
        textarea.removeEventListener("compositionend", guard.end);
        textarea.removeEventListener("keydown", onKeyDown);
        textarea.removeEventListener("input", resize);
        textarea.style.height = originalHeight;
        textarea.style.overflowY = originalOverflow;
        restoreBusy();
      }
    };
  }

  function bindDialog(dialog, options) {
    options = options || {};
    if (!dialog || dialog.tagName !== "DIALOG" || typeof dialog.showModal !== "function") {
      throw new TypeError("Use a native <dialog> in a browser that supports showModal()");
    }
    var doc = dialog.ownerDocument;
    var previousFocus = null;
    var disposed = false;
    var originalTabIndex = dialog.getAttribute("tabindex");
    function checkName() {
      var label = (dialog.getAttribute("aria-label") || "").trim();
      var ids = (dialog.getAttribute("aria-labelledby") || "").trim().split(/\s+/);
      var labelledText = ids.map(function (id) {
        var node = id && doc.getElementById(id);
        return node ? node.textContent.trim() : "";
      }).join(" ").trim();
      if (!label && !labelledText) throw new Error("Dialog needs aria-label or a nonempty aria-labelledby target");
    }
    function restoreFocus() {
      var target = previousFocus;
      previousFocus = null;
      if (target && target.isConnected && typeof target.focus === "function") target.focus({ preventScroll: true });
    }
    function visibleTarget(target) {
      return target && dialog.contains(target) && !target.disabled &&
        !target.matches(":disabled") && !target.closest("[inert], [hidden]") &&
        target.getClientRects().length > 0 &&
        ["hidden", "collapse"].indexOf(doc.defaultView.getComputedStyle(target).visibility) === -1;
    }
    function onKeyDown(event) {
      if (!dialog.open || event.key !== "Tab" || event.ctrlKey || event.metaKey || event.altKey) return;
      // Recompute every time: controls may be added, hidden, disabled or made inert.
      var items = Array.prototype.filter.call(dialog.querySelectorAll("*"), function (node) {
        return node.tabIndex >= 0 && visibleTarget(node);
      });
      if (!items.length) {
        event.preventDefault();
        dialog.setAttribute("tabindex", "-1");
        dialog.focus({ preventScroll: true });
        return;
      }
      var index = items.indexOf(doc.activeElement);
      if (index === -1 || (!event.shiftKey && index === items.length - 1) || (event.shiftKey && index === 0)) {
        event.preventDefault();
        items[event.shiftKey ? items.length - 1 : 0].focus({ preventScroll: true });
      }
    }
    function onClose() {
      // Ignore a queued close from the previous opening if the dialog reopened.
      if (dialog.open) return;
      restoreFocus();
      if (typeof options.onClose === "function") options.onClose(dialog.returnValue);
    }
    checkName();
    dialog.addEventListener("close", onClose);
    dialog.addEventListener("keydown", onKeyDown);
    return {
      showModal: function () {
        if (disposed) throw new Error("Dialog binding was disposed");
        if (dialog.open) return false;
        checkName();
        previousFocus = doc.activeElement;
        dialog.returnValue = "";
        dialog.showModal();
        var target = typeof options.initialFocus === "string" ? dialog.querySelector(options.initialFocus) : options.initialFocus;
        if (!visibleTarget(target)) {
          target = Array.prototype.find.call(dialog.querySelectorAll("[autofocus]:not([disabled])"), visibleTarget);
        }
        if (!target) {
          var candidates = dialog.querySelectorAll("button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex='0']");
          target = Array.prototype.find.call(candidates, visibleTarget);
        }
        if (!target) {
          dialog.setAttribute("tabindex", "-1");
          target = dialog;
        }
        target.focus({ preventScroll: true });
        return true;
      },
      close: function (returnValue) {
        if (!disposed && dialog.open) dialog.close(returnValue == null ? "" : String(returnValue));
      },
      dispose: function () {
        if (disposed) return;
        disposed = true;
        dialog.removeEventListener("close", onClose);
        dialog.removeEventListener("keydown", onKeyDown);
        if (dialog.open) dialog.close();
        restoreFocus();
        if (originalTabIndex === null) dialog.removeAttribute("tabindex");
        else dialog.setAttribute("tabindex", originalTabIndex);
      }
    };
  }

  return {
    createCompositionGuard: createCompositionGuard,
    findSuggestionTrigger: findSuggestionTrigger,
    replaceSuggestion: replaceSuggestion,
    createScrollPinning: createScrollPinning,
    nextRovingIndex: nextRovingIndex,
    bindComposer: bindComposer,
    bindDialog: bindDialog
  };
});
