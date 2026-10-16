/* Independent CDS 2.0 reference controls. MIT upstream inspiration: f504349.
 * No network calls or persistence. Include components.css and the documented markup.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ClaudeCDS2 = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  var LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'];
  var META = {
    low: { label: 'Low', detail: '简短问答与轻量任务' },
    medium: { label: 'Medium', detail: '日常整理与常规任务' },
    high: { label: 'High', detail: '兼顾速度和深入程度' },
    xhigh: { label: 'Extra', detail: '复杂问题与细致分析' },
    max: { label: 'Max', detail: '需要充分展开的困难任务' }
  };

  function normalize(config) {
    config = config || {};
    var levels = config.levels === undefined ? LEVELS.slice() : config.levels;
    if (!Array.isArray(levels) || !levels.length || levels.some(function (x) {
      return LEVELS.indexOf(x) === -1;
    }) || new Set(levels).size !== levels.length) {
      throw new TypeError('levels must be a nonempty unique subset of known effort levels');
    }
    levels = LEVELS.filter(function (x) { return levels.indexOf(x) !== -1; });
    var recommended = config.recommended === undefined ?
      (levels.indexOf('high') !== -1 ? 'high' : levels[0]) : config.recommended;
    if (levels.indexOf(recommended) === -1) throw new TypeError('recommended must be available');
    return { levels: levels, recommended: recommended, locked: !!config.locked };
  }

  function createEffortState(options) {
    options = options || {};
    var config = normalize(options);
    var value = config.levels.indexOf(options.value) !== -1 ? options.value : config.recommended;
    return {
      get: function () {
        return { value: value, levels: config.levels.slice(), recommended: config.recommended,
          locked: config.locked, warning: value === 'max' };
      },
      select: function (next) {
        if (config.locked || config.levels.indexOf(next) === -1 || next === value) return false;
        value = next;
        return true;
      },
      configure: function (next) {
        // Validate before mutation. Changing model capabilities cannot retain an unsupported level.
        var checked = normalize(Object.assign({}, config, next));
        config = checked;
        if (config.levels.indexOf(value) === -1) value = config.recommended;
        return this.get();
      }
    };
  }

  var instanceId = 0;
  function bindEffortPicker(root, options) {
    options = options || {};
    if (!root || root.tagName !== 'DETAILS' || !root.querySelector('summary') ||
        !root.querySelector('[data-effort-options]') || !root.querySelector('[data-effort-value]') ||
        !root.querySelector('[data-effort-note]') || !root.querySelector('[data-effort-done]')) {
      throw new TypeError('Use the documented details/summary effort picker markup');
    }
    var doc = root.ownerDocument;
    var state = createEffortState(options);
    var summary = root.querySelector('summary');
    var list = root.querySelector('[data-effort-options]');
    var note = root.querySelector('[data-effort-note]');
    var name = 'cds2-effort-' + (++instanceId);
    var disposed = false;
    var previousPlacement = root.getAttribute('data-placement');
    var observer = typeof doc.defaultView.ResizeObserver === 'function' ?
      new doc.defaultView.ResizeObserver(position) : null;

    function position() {
      if (!root.open || disposed) return;
      var rect = summary.getBoundingClientRect();
      var panel = root.querySelector('.cds2-effort-panel');
      if (!panel) return;
      var below = doc.defaultView.innerHeight - rect.bottom - 16;
      root.dataset.placement = below >= Math.min(panel.scrollHeight, 350) || below > rect.top ? 'bottom' : 'top';
      panel.style.maxHeight = Math.max(96, (root.dataset.placement === 'bottom' ? below : rect.top - 16)) + 'px';
    }
    function close(restore) {
      root.open = false;
      if (restore) summary.focus({ preventScroll: true });
    }
    function render() {
      var data = state.get();
      var focusedValue = root.contains(doc.activeElement) && doc.activeElement.value;
      root.querySelector('[data-effort-value]').textContent = META[data.value].label;
      list.replaceChildren();
      list.disabled = data.locked;
      data.levels.forEach(function (value) {
        var label = doc.createElement('label');
        label.className = 'cds2-effort-option';
        var radio = doc.createElement('input');
        radio.type = 'radio'; radio.name = name; radio.value = value;
        radio.checked = value === data.value;
        var text = doc.createElement('span');
        var title = doc.createElement('strong');
        title.textContent = META[value].label;
        if (value === data.recommended) {
          var badge = doc.createElement('small'); badge.textContent = '推荐'; title.append(badge);
        }
        var description = doc.createElement('span'); description.textContent = META[value].detail;
        text.append(title, description); label.append(radio, text); list.append(label);
      });
      note.textContent = data.locked ? '当前配置已锁定推理档位。' : data.warning ?
        'Max 可能增加耗时和用量；实际效果取决于接入的模型。' : '所选档位作为参数交给业务层；此示例不调用模型。';
      note.dataset.warning = String(data.warning && !data.locked);
      if (focusedValue && data.levels.indexOf(focusedValue) !== -1 && !data.locked) {
        list.querySelector('input[value="' + focusedValue + '"]').focus({ preventScroll: true });
      }
      position();
    }
    function emit() {
      if (typeof options.onChange === 'function') options.onChange(state.get());
    }
    function change(event) {
      if (event.target.matches('input[type=radio]') && state.select(event.target.value)) {
        render(); emit();
      }
    }
    function keydown(event) {
      if (event.key === 'Escape' && root.open) {
        event.preventDefault(); event.stopPropagation(); close(true);
      }
    }
    function outside(event) { if (!root.contains(event.target)) close(false); }
    function focusout(event) { if (event.relatedTarget && !root.contains(event.relatedTarget)) close(false); }
    function done() { close(true); }
    var doneButton = root.querySelector('[data-effort-done]');
    list.addEventListener('change', change);
    root.addEventListener('keydown', keydown);
    root.addEventListener('toggle', position);
    root.addEventListener('focusout', focusout);
    doneButton.addEventListener('click', done);
    doc.addEventListener('pointerdown', outside);
    doc.defaultView.addEventListener('resize', position);
    if (observer) observer.observe(root);
    render();
    return {
      get: function () { return state.get(); },
      configure: function (next) {
        if (disposed) throw new Error('Picker was disposed');
        var before = state.get().value;
        state.configure(next); render();
        if (before !== state.get().value) emit();
        return state.get();
      },
      dispose: function () {
        if (disposed) return;
        disposed = true; close(false);
        list.removeEventListener('change', change);
        root.removeEventListener('keydown', keydown);
        root.removeEventListener('toggle', position);
        root.removeEventListener('focusout', focusout);
        doneButton.removeEventListener('click', done);
        doc.removeEventListener('pointerdown', outside);
        doc.defaultView.removeEventListener('resize', position);
        if (observer) observer.disconnect();
        if (previousPlacement === null) root.removeAttribute('data-placement');
        else root.setAttribute('data-placement', previousPlacement);
      }
    };
  }
  return { createEffortState: createEffortState, bindEffortPicker: bindEffortPicker };
});
