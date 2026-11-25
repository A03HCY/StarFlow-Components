import { Popup } from './internal/popup.js';
import { resolveAnchor } from './internal/floating.js';

/**
 * <sf-button id="more">更多</sf-button>
 * <sf-popover anchor="more">…任意内容…</sf-popover>
 *
 * 锚点用 id 引用，而不是把触发器包进来 —— 浮层不参与触发器的布局，
 * 触发器是普通按钮，想换成 icon-button 也不用改结构。
 *
 * 定位用 fixed + z-index（不用原生 popover）：容器有 overflow 时也不会被裁掉，
 * 层级仍然走 --sf-z-* 这套 token，不出现"CSS 算的和 token 定的两套数"。
 *
 * manual 属性 = 不响应锚点点击，由调用方自己 show()/hide()。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      position: fixed;
      left: 0;
      top: 0;
      z-index: var(--sf-z-dropdown);
      display: none;
      box-sizing: border-box;
      min-width: 200px;
      max-width: var(--sf-popover-max-width, 320px);
      padding: var(--sf-space-4);
      background: var(--sf-color-surface);
      color: var(--sf-color-text);
      border: var(--sf-border-width) solid var(--sf-color-border);
      border-radius: var(--sf-radius-lg);
      box-shadow: var(--sf-shadow-lg);
      font-family: var(--sf-font-sans);
      font-size: var(--sf-font-size-md);
      line-height: var(--sf-line-height-normal);
    }

    :host([open]) { display: block; }
  </style>
  <slot></slot>
`;

class SfPopover extends HTMLElement {
  static observedAttributes = ['anchor', 'placement'];

  #popup;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.#popup = new Popup(this, { gap: 6, haspopup: 'dialog' });
  }

  get open() {
    return this.hasAttribute('open');
  }

  get anchor() {
    return this.#popup.anchor;
  }

  /** 直接给元素，省掉 id；dropdown/select 内部就是这么接的 */
  set anchor(el) {
    this.#popup.setAnchor(el || null);
  }

  connectedCallback() {
    this.#popup.manual = this.hasAttribute('manual');
    this.#syncPlacement();
    const el = resolveAnchor(this);
    if (el) this.#popup.setAnchor(el);
  }

  disconnectedCallback() {
    this.#popup.destroy();
  }

  attributeChangedCallback(name) {
    if (name === 'anchor') {
      const el = resolveAnchor(this);
      if (el) this.#popup.setAnchor(el);
    }
    if (name === 'placement') this.#syncPlacement();
  }

  show() {
    this.#popup.open();
  }

  hide({ restoreFocus = false } = {}) {
    this.#popup.close({ restoreFocus });
  }

  toggle() {
    this.#popup.toggle();
  }

  #syncPlacement() {
    this.#popup.placement = this.getAttribute('placement') || 'bottom-start';
  }
}

if (!customElements.get('sf-popover')) {
  customElements.define('sf-popover', SfPopover);
}

export { SfPopover };
