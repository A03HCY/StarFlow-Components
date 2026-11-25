/**
 * StarFlow theme runtime
 *
 * 只做一件事：把「用户偏好」翻译成 <html data-sf-theme="light|dark">。
 * CSS 只认这个属性，不认识 localStorage，也不认识 prefers-color-scheme。
 * 这样主题逻辑只有一处，组件里不用再写任何 @media (prefers-color-scheme)。
 */

const STORAGE_KEY = 'sf-theme';
const ATTR = 'data-sf-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';
const MODES = ['light', 'dark', 'system'];

const query = window.matchMedia(DARK_QUERY);

function readPreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return MODES.includes(stored) ? stored : 'system';
  } catch {
    // 隐私模式下 localStorage 会抛异常，跟随系统即可
    return 'system';
  }
}

let preference = readPreference();

function resolve(mode) {
  return mode === 'system' ? (query.matches ? 'dark' : 'light') : mode;
}

function paint() {
  const resolved = resolve(preference);
  document.documentElement.setAttribute(ATTR, resolved);
  document.dispatchEvent(
    new CustomEvent('sf-themechange', {
      detail: { theme: preference, resolvedTheme: resolved },
    })
  );
}

/** 用户偏好：'light' | 'dark' | 'system' */
export function getTheme() {
  return preference;
}

/** 实际生效的主题：'light' | 'dark' */
export function getResolvedTheme() {
  return document.documentElement.getAttribute(ATTR) || resolve(preference);
}

/** 设置偏好并落盘，返回实际生效的主题 */
export function setTheme(mode) {
  if (!MODES.includes(mode)) {
    throw new RangeError(`[starflow] 未知主题 "${mode}"，可选：${MODES.join(' | ')}`);
  }
  preference = mode;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // 存不下就算了，本次会话仍然生效
  }
  paint();
  return resolve(preference);
}

// 偏好是 system 时，系统切换要跟着变
query.addEventListener('change', () => {
  if (preference === 'system') paint();
});

// 页面里没有内联引导脚本时就地补一次（有的话值一样，不必重绘）
if (!document.documentElement.hasAttribute(ATTR)) paint();
