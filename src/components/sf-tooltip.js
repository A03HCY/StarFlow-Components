import { place } from './internal/floating.js';

/**
 * <sf-tooltip content="提示文字"><sf-icon-button …></sf-tooltip>
 *
 * 包一层触发器的形态：host 是 inline-flex，鼠标进出和焦点都落在 host 上。
 * 气泡本身 pointer-events: none —— 否则鼠标移到气泡上会触发 pointerleave，闪。
 *
 * 显隐用 visibility + opacity（而不是 display: none）：需要能在不可见时量到尺寸，
 * 否则第一次弹出会先闪在左上角再跳过去。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host { display: inline-flex; }

    .bubble {
      position: fixed;
      left: 0;
      top: 0;
      z-index: var(--sf-z-tooltip);
      max-width: var(--sf-tooltip-max-width, 260px);
      box-sizing: border-box;
      padding: 5px 9px;
      border-radius: var(--sf-radius-sm);
      background: var(--sf-tooltip-bg, var(--sf-color-text));
      color: var(--sf-tooltip-fg, var(--sf-color-bg));
      font-family: var(--sf-font-sans);
      font-size: var(--sf-font-size-xs);
      line-height: var(--sf-line-height-normal);
      box-shadow: var(--sf-shadow-sm);
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition:
        opacity var(--sf-duration-fast) var(--sf-ease),
        visibility var(--sf-duration-fast) var(--sf-ease);
    }

    :host([open]) .bubble { opacity: 1; visibility: visible; }
  </style>
  <span class="bubble" role="tooltip" part="bubble">
    <slot name="content"><span class="text"></span></slot>
  </span>
  <slot></slot>
`;

let uid = 0;

class SfTooltip extends HTMLElement {
  static observedAttributes = ['content'];

  #bubble;
  #text;
  #timer = 0;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.#bubble = this.shadowRoot.querySelector('.bubble');
    this.#text = this.shadowRoot.querySelector('.text');
  }

  connectedCallback() {
    if (!this.#bubble.id) this.#bubble.id = `sf-tooltip-${++uid}`;

    const trigger = this.firstElementChild;
    if (trigger && !trigger.hasAttribute('aria-describedby')) {
      trigger.setAttribute('aria-describedby', this.#bubble.id);
    }

    this.#renderText();
    this.addEventListener('pointerenter', this.#onEnter);
    this.addEventListener('pointerleave', this.#onLeave);
    this.addEventListener('pointerdown', this.#onLeave);
    this.addEventListener('focusin', this.#onEnter);
    this.addEventListener('focusout', this.#onLeave);
    this.addEventListener('keydown', this.#onKeyDown);
  }

  disconnectedCallback() {
    clearTimeout(this.#timer);
    this.removeEventListener('pointerenter', this.#onEnter);
    this.removeEventListener('pointerleave', this.#onLeave);
    this.removeEventListener('pointerdown', this.#onLeave);
    this.removeEventListener('focusin', this.#onEnter);
    this.removeEventListener('focusout', this.#onLeave);
    this.removeEventListener('keydown', this.#onKeyDown);
    this.#stopTracking();
  }

  attributeChangedCallback() {
    this.#renderText();
  }

  /* 用箭头函数字段：私有方法是不可写的，构造函数里再 bind 会直接抛 TypeError */
  #onEnter = () => {
    if (this.hasAttribute('disabled')) return;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.#show(), this.#delay());
  };

  #onLeave = () => {
    clearTimeout(this.#timer);
    this.#hide();
  };

  #onKeyDown = (event) => {
    if (event.key === 'Escape' && this.hasAttribute('open')) {
      event.stopPropagation();
      this.#hide();
    }
  };

  #onReflow = () => {
    if (!this.hasAttribute('open')) return;
    place(this, this.#bubble, { placement: this.#placement(), gap: 6 });
  };

  #renderText() {
    if (this.#text) this.#text.textContent = this.getAttribute('content') || '';
  }

  #delay() {
    const raw = this.getAttribute('delay');
    return raw === null ? 120 : Number(raw) || 0;
  }

  #placement() {
    return this.getAttribute('placement') || 'top';
  }

  #show() {
    if (this.hasAttribute('open')) return;
    this.setAttribute('open', '');
    // 先显示再量，否则拿到的是 0×0
    place(this, this.#bubble, { placement: this.#placement(), gap: 6 });
    window.addEventListener('scroll', this.#onReflow, true);
    window.addEventListener('resize', this.#onReflow);
  }

  #hide() {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.#stopTracking();
  }

  #stopTracking() {
    window.removeEventListener('scroll', this.#onReflow, true);
    window.removeEventListener('resize', this.#onReflow);
  }
}

if (!customElements.get('sf-tooltip')) {
  customElements.define('sf-tooltip', SfTooltip);
}

export { SfTooltip };
