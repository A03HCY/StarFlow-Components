/**
 * 浮层定位。只算 fixed 坐标，不碰显隐、不碰事件 ——
 * tooltip / popover / dropdown 各自管自己的开关，共用的只有这段数学。
 */

const MARGIN = 8;
const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

/**
 * @param {Element} anchor    贴着谁
 * @param {Element} floating  浮层（调用前必须已经可见，否则量到的尺寸是 0）
 * @param {{placement?: string, gap?: number}} opts
 * @returns {string} 最终方位，可能因为放不下被翻转过
 */
export function place(anchor, floating, { placement = 'top', gap = 8 } = {}) {
  const a = anchor.getBoundingClientRect();
  const f = floating.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;

  const [side, align = 'center'] = placement.split('-');

  const room = {
    top: a.top - MARGIN,
    bottom: vh - a.bottom - MARGIN,
    left: a.left - MARGIN,
    right: vw - a.right - MARGIN,
  };
  const need = {
    top: f.height + gap,
    bottom: f.height + gap,
    left: f.width + gap,
    right: f.width + gap,
  };

  // 放不下就翻到对面，对面也放不下就留在原地（宁可压住锚点，也不跳到一个更奇怪的位置）
  let final = side;
  if (room[side] < need[side] && room[OPPOSITE[side]] >= need[OPPOSITE[side]]) {
    final = OPPOSITE[side];
  }

  let x;
  let y;
  if (final === 'top' || final === 'bottom') {
    y = final === 'top' ? a.top - f.height - gap : a.bottom + gap;
    x =
      align === 'start' ? a.left
      : align === 'end' ? a.right - f.width
      : a.left + a.width / 2 - f.width / 2;
  } else {
    x = final === 'left' ? a.left - f.width - gap : a.right + gap;
    y =
      align === 'start' ? a.top
      : align === 'end' ? a.bottom - f.height
      : a.top + a.height / 2 - f.height / 2;
  }

  const maxX = Math.max(MARGIN, vw - f.width - MARGIN);
  const maxY = Math.max(MARGIN, vh - f.height - MARGIN);
  x = Math.min(Math.max(MARGIN, x), maxX);
  y = Math.min(Math.max(MARGIN, y), maxY);

  floating.style.left = `${Math.round(x)}px`;
  floating.style.top = `${Math.round(y)}px`;
  floating.dataset.placement = final;
  return final;
}

/** 事件是否发生在给定的几个元素之外（穿过 shadow 边界比较） */
export function isOutside(event, elements) {
  const path = event.composedPath();
  return !elements.some((el) => el && path.includes(el));
}

/** 按 id 找锚点，找不到就返回 null，让调用方自己决定要不要报错 */
export function resolveAnchor(host) {
  const id = host.getAttribute('anchor');
  return id ? document.getElementById(id) : null;
}
