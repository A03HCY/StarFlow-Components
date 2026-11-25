/**
 * <sf-badge count="12">  /  <sf-badge dot>  /  <sf-badge tone="danger">3</sf-badge>
 *
 * 计数徽章走实心底色（要跳出来）；文字对比度靠 --sf-color-on-accent，
 * 它在两套主题下分别是白和近黑，正好对上实心底色的明度。
 * dot 模式是给头像/图标做红点用的，没有文字。
 *
 * 这一层没有自己的 token：默认色和 tone 都能直接用 L2 表达，再加反而是多一层查表。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: var(--sf-radius-full);
      background: var(--sf-color-accent);
      color: var(--sf-color-on-accent);
      font-family: var(--sf-font-sans);
      font-size: 11px;
      font-weight: var(--sf-font-weight-semibold);
      font-variant-numeric: tabular-nums;
      line-height: 1;
      white-space: nowrap;
      user-select: none;
      vertical-align: middle;
    }

    :host([tone="success"]) { background: var(--sf-color-success); }
    :host([tone="warning"]) { background: var(--sf-color-warning); }
    :host([tone="danger"]) { background: var(--sf-color-danger); }
    :host([tone="neutral"]) {
      background: var(--sf-color-surface-sunken);
      color: var(--sf-color-text-muted);
    }

    :host([dot]) {
      min-width: 8px;
      width: 8px;
      height: 8px;
      padding: 0;
    }

    :host([hidden]) { display: none; }
  </style>
  <slot></slot>
`;

class SfBadge extends HTMLElement {
  static observedAttributes = ['count', 'max'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  #render() {
    const raw = this.getAttribute('count');
    if (raw === null) return; // 用 slot 内容，不动它
    const count = Number(raw);
    if (!Number.isFinite(count)) return;
    const max = Number(this.getAttribute('max'));
    this.textContent = max > 0 && count > max ? `${max}+` : String(count);
  }
}

if (!customElements.get('sf-badge')) {
  customElements.define('sf-badge', SfBadge);
}

export { SfBadge };
