/**
 * <sf-tag closable tone="accent">前端</sf-tag>
 *
 * 只是"标签"，不可交互（要可点击请用 sf-button 的 ghost 变体或 badge）。
 * closable 时右侧出现 ×，点击派发 sf-remove —— 组件不自己移除自己，
 * 因为移除通常还要同步改数据，让调用方决定。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--sf-space-1);
      box-sizing: border-box;
      height: 22px;
      padding: 0 var(--sf-space-2);
      border: var(--sf-border-width) solid transparent;
      border-radius: var(--sf-radius-sm);
      background: var(--sf-color-surface-sunken);
      color: var(--sf-color-text-muted);
      font-family: var(--sf-font-sans);
      font-size: var(--sf-font-size-xs);
      line-height: 1;
      white-space: nowrap;
      vertical-align: middle;
    }

    /* tag 的文字压在自家 subtle 底上，对比度约 3.9:1 —— 只在 ≥12px 用，别塞正文 */
    :host([tone="accent"]) { background: var(--sf-color-accent-subtle); color: var(--sf-color-accent); }
    :host([tone="success"]) { background: var(--sf-color-success-subtle); color: var(--sf-color-success); }
    :host([tone="warning"]) { background: var(--sf-color-warning-subtle); color: var(--sf-color-warning); }
    :host([tone="danger"]) { background: var(--sf-color-danger-subtle); color: var(--sf-color-danger); }

    :host([outline]) {
      background: transparent;
      border-color: var(--sf-color-border-strong);
      color: var(--sf-color-text-muted);
    }

    .close {
      all: unset;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 3px;
      color: inherit;
      opacity: 0.6;
      cursor: pointer;
    }
    .close:hover { opacity: 1; background: color-mix(in oklab, currentColor 14%, transparent); }
    .close:focus-visible { opacity: 1; box-shadow: var(--sf-shadow-focus); }

    :host(:not([closable])) .close { display: none; }
  </style>
  <slot></slot>
  <button class="close" part="close" type="button" aria-label="移除">
    <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    </svg>
  </button>
`;

class SfTag extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.shadowRoot.querySelector('.close').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('sf-remove', { bubbles: true, composed: true }));
    });
  }
}

if (!customElements.get('sf-tag')) {
  customElements.define('sf-tag', SfTag);
}

export { SfTag };
