/**
 * <sf-option value="a">选项 A</sf-option>
 *
 * 只给 sf-select / sf-multiselect 用。选中态、高亮、禁用都靠宿主属性驱动，
 * 所以 select 那边只需要改属性，不用碰这层 DOM。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--sf-space-2);
      padding: 7px 10px;
      border-radius: var(--sf-radius-sm);
      font-family: var(--sf-font-sans);
      font-size: var(--sf-font-size-sm);
      color: var(--sf-color-text);
      cursor: pointer;
      outline: none;
      white-space: nowrap;
    }

    :host([data-active]) { background: var(--sf-color-surface-hover); }
    :host([aria-selected="true"]) {
      color: var(--sf-color-accent);
      font-weight: var(--sf-font-weight-medium);
    }

    :host([disabled]) {
      color: var(--sf-color-text-subtle);
      pointer-events: none;
    }

    .check { flex: none; display: none; width: 14px; height: 14px; }
    :host([aria-selected="true"]) .check { display: block; }
  </style>
  <span class="label"><slot></slot></span>
  <svg class="check" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8.5l3.2 3.2L13 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

let seq = 0;

class SfOption extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.setAttribute('role', 'option');
    if (!this.hasAttribute('aria-selected')) this.setAttribute('aria-selected', 'false');
    if (!this.id) this.id = `sf-option-${++seq}`;
  }

  get value() {
    return this.getAttribute('value') ?? this.textContent.trim();
  }

  get label() {
    return this.textContent.trim();
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }
}

if (!customElements.get('sf-option')) {
  customElements.define('sf-option', SfOption);
}

export { SfOption };
