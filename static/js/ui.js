/* UI helpers: copy-to-clipboard, format time. */
window.LCC = window.LCC || {};

(function (LCC) {
  LCC.copy = async function (text) {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_e) {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed'; el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      try { document.execCommand('copy'); } catch (__e) { /* ignore */ }
      document.body.removeChild(el);
      return true;
    }
  };

  LCC.formatTime = function (ts) {
    try { return new Date(ts).toLocaleString(); } catch (_e) { return String(ts); }
  };

  // Delegate copy/favorite buttons inside generated command cards.
  document.addEventListener('click', function (event) {
    const action = event.target?.dataset?.action;
    if (!action) return;
    const wrap = event.target.closest('.generated');
    if (!wrap) return;
    const code = wrap.querySelector('code[data-cmd]');
    if (!code) return;
    const cmd = code.getAttribute('data-cmd') || code.textContent.trim();
    const type = code.getAttribute('data-type') || 'command';
    if (action === 'copy') {
      LCC.copy(cmd).then(ok => {
        if (!ok) return;
        const original = event.target.textContent;
        event.target.textContent = 'Copied';
        setTimeout(() => { event.target.textContent = original; }, 1500);
      });
    } else if (action === 'favorite') {
      LCC.favorites.toggle(cmd, type);
      event.target.classList.toggle('is-active', LCC.favorites.has(cmd));
    }
  });

  // After every successful build, record the command in history.
  document.body.addEventListener('htmx:afterSwap', function (event) {
    if (!event.detail || !event.detail.target) return;
    const target = event.detail.target;
    if (!target.id || !target.id.startsWith('generated-')) return;
    const code = target.querySelector('code[data-cmd]');
    if (!code) return;
    const cmd = code.getAttribute('data-cmd') || '';
    const type = code.getAttribute('data-type') || target.id.replace('generated-', '');
    if (cmd) LCC.history.add(cmd, type);
  });
})(window.LCC);
