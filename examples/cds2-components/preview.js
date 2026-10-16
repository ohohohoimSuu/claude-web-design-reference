'use strict';
(function () {
  var $ = function (selector) { return document.querySelector(selector); };
  var queueVisible = false;
  var hasAttachment = false;
  var picker = ClaudeCDS2.bindEffortPicker($('#effort-picker'), { onChange: renderState });
  function renderState() {
    var state = picker.get();
    $('#state-output').textContent = [
      '{', '  "effort": ' + JSON.stringify(state.value) + ',',
      '  "available": ' + JSON.stringify(state.levels) + ',',
      '  "locked": ' + state.locked + ',',
      '  "attachment": ' + hasAttachment + ',',
      '  "failedCount": ' + (queueVisible ? 2 : 0), '}'
    ].join('\n');
  }
  var input = $('#study-message');
  var send = $('#study-send');
  function updateSend() { send.disabled = !input.value.trim(); }
  var composer = ClaudeRefV2.bindComposer(input, function (message) {
    var payload = { message: message, effort: picker.get().value, attachments: hasAttachment ? ['项目说明.md'] : [] };
    $('#receipt').textContent = '本地已接收：' + JSON.stringify(payload);
    return true;
  }, { minHeight:104, maxHeight:240 });
  input.addEventListener('input', updateSend);
  // The binding handles Enter; defer the visual disabled state until submission resolves.
  input.addEventListener('keydown', function () { queueMicrotask(updateSend); });
  send.addEventListener('click', async function () { await composer.submit(); updateSend(); });
  $('#theme-toggle').addEventListener('click', function () {
    var dark = document.body.dataset.theme !== 'dark';
    document.body.dataset.theme = dark ? 'dark' : 'light';
    this.textContent = dark ? '切换浅色' : '切换深色';
  });
  $('#effort-lock').addEventListener('change', function () {
    picker.configure({ locked:this.checked }); renderState();
  });
  $('#capability-select').addEventListener('change', function () {
    picker.configure({ levels:this.value === 'limited' ? ['low','high'] : ['low','medium','high','xhigh','max'], recommended:'high' });
    renderState();
  });
  function showQueue(value) {
    queueVisible = value; $('#queue-banner').hidden = !value;
    $('#queue-toggle').textContent = value ? '收起失败状态' : '查看失败状态'; renderState();
  }
  $('#queue-toggle').addEventListener('click', function () { showQueue(!queueVisible); });
  $('#retry-queue').addEventListener('click', function () {
    showQueue(false); $('#receipt').textContent = '重试演示完成，示例计数已清零。没有发送网络请求。';
  });
  function attachment(value) { hasAttachment = value; $('#attachments').hidden = !value; $('#add-attachment').disabled = value; renderState(); }
  $('#add-attachment').addEventListener('click', function () { attachment(true); });
  $('#remove-attachment').addEventListener('click', function () { attachment(false); $('#add-attachment').focus(); });
  function play(element) { element.classList.remove('is-playing'); void element.offsetWidth; element.classList.add('is-playing'); }
  $('#pill-trigger').addEventListener('click', function () { play(this); });
  $('#replay-motion').addEventListener('click', function () { ['#pill-trigger','#cascade','#skeleton'].forEach(function (id) { play($(id)); }); });
  renderState();
})();
