import { getTheme, getResolvedTheme, setTheme } from '../src/tokens/theme.js';

/**
 * 演示页外壳的交互部分：主题切换按钮。
 * 页面里只要有一个 .seg 和 #resolved 就能用；没有也不报错。
 */
export function initShell() {
  const seg = document.querySelector('.seg');
  const resolved = document.getElementById('resolved');

  if (!seg) return;

  const sync = () => {
    seg.querySelectorAll('button[data-theme]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.theme === getTheme()));
    });
    if (resolved) resolved.textContent = getResolvedTheme();
  };

  seg.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-theme]');
    if (!btn) return;
    setTheme(btn.dataset.theme);
  });

  document.addEventListener('sf-themechange', sync);
  sync();
}
