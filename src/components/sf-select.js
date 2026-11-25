/**
 * <sf-select placeholder="请选择">
 *   <sf-option value="a">选项 A</sf-option>
 *   <sf-option value="b" disabled>选项 B</sf-option>
 * </sf-select>
 *
 * 触发器就是宿主本身（role=combobox + tabindex），浮层是 shadow 里的 .list。
 * 这样 aria-expanded 落在宿主上，Popup 那套开合逻辑不用为它特例。
 *
 * 选项是光 DOM 里的子元素，不重新渲染 —— 业务改 <sf-option> 就等于改了数据源，
 * 组件只负责把 aria-selected 和选中态同步过去。
 */

import { Popup } from './internal/popup.js';
import './sf-option.js';

const selectTemplate = document.createElement('template');

selectTemplate.innerHTML = `
  <style>
    :host {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: var(--sf-space-2);
      box-sizing: border-box;
      width: 100%;
      height: var(--sf-control-height-md);
      padding: 0 var(--sf-space-3);
      background: var(--sf-color-surface);
      border: var(--sf-border-width) solid var(--sf-color-border-strong);
      border-radius: var(--sf-radius-sm);
      font-family: var(--sf-font-sans);
      font-size: var(--sf-font-size-sm);
      color: var(--sf-color-text);
      cursor: pointer;
      outline: none;
      user-select: none;
      transition:
        border-color var(--sf-duration-fast) var(--sf-ease),
        box-shadow var(--sf-duration-fast) var(--sf-ease);
    }

    :host([size="sm"]) { height: var(--sf-control-height-sm); }

    :host(:focus-visible) {
      border-color: var(--sf-color-accent);
      box-shadow: var(--sf-shadow-focus);
    }
    :host([open]) { border-color: var(--sf-color-accent); }

    :host([disabled]) {
      background: var(--sf-color-surface-sunken);
      border-color: var(--sf-color-border);
      color: var(--sf-color-text-subtle);
      pointer-events: none;
    }

    .value {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    :host(:not([value])) .value { color: var(--sf-color-text-subtle); }

    .caret {
      flex: none;
      width: 12px;
      height: 12px;
      color: var(--sf-color-text-muted);
      transition: transform var(--sf-duration-fast) var(--sf-ease);
    }
    :host([open]) .caret { transform: rotate(180deg); }

    .list {
      position: fixed;
      left: 0;
      top: 0;
      z-index: var(--sf-z-dropdown);
      display: none;
      box-sizing: border-box;
      min-width: 100%;
      max-height: var(--sf-select-max-height, 280px);
      overflow: auto;
      padding: var(--sf-space-1);
      background: var(--sf-color-surface);
      border: var(--sf-border-width) solid var(--sf-color-border);
      border-radius: var(--sf-radius-md);
      box-shadow: var(--sf-shadow-lg);
    }
    :host([open]) .list { display: block; }
  </style>
  <span class="value" part="value"></span>
  <svg class="caret" part="caret" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <div class="list" role="listbox" part="list"><slot></slot></div>
`;

class SfSelect extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ['value', 'placeholder', 'disabled'];

  #internals;
  #list;
  #valueEl;
  #popup;
  #options = [];
  #active = -1;
  #initialValue = null;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.attachShadow({ mode: 'open' }).append(selectTemplate.content.cloneNode(true));
    this.#list = this.shadowRoot.querySelector('.list');
    this.#valueEl = this.shadowRoot.querySelector('.value');

    this.#popup = new Popup(this, {
      floating: this.#list,
      gap: 4,
      manual: true, // 点击自己处理：列表内部的点击不该触发 toggle
      haspopup: 'listbox',
      onOpen: () => this.#onOpen(),
    });
    this.#popup.setAnchor(this);

    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeyDown);
    this.#list.addEventListener('click', this.#onOptionClick);
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'combobox');
    this.setAttribute('aria-expanded', 'false');
    if (this.tabIndex < 0) this.tabIndex = 0;
    if (!this.hasAttribute('value')) {
      const preselected = this.querySelector('sf-option[selected]');
      if (preselected) this.setAttribute('value', preselected.value);
    }
    if (this.#initialValue === null) this.#initialValue = this.getAttribute('value');
    this.#render();
  }

  disconnectedCallback() {
    this.#popup.destroy();
  }

  attributeChangedCallback() {
    this.#render();
  }

  get value() {
    return this.getAttribute('value') ?? '';
  }

  set value(next) {
    if (next) this.setAttribute('value', next);
    else this.removeAttribute('value');
  }

  formResetCallback() {
    // setter 会改属性，所以不能靠属性恢复初始值，得单独记一份
    if (this.#initialValue === null) this.#render();
    else this.setAttribute('value', this.#initialValue);
  }

  #render() {
    this.#collect();
    const selected = this.#options.find((opt) => opt.value === this.value);
    this.#valueEl.textContent = selected ? selected.label : this.getAttribute('placeholder') || '';
    this.#options.forEach((opt) => {
      opt.setAttribute('aria-selected', String(opt.value === this.value));
    });
    this.#internals.setFormValue(this.value || null);
  }

  #collect() {
    this.#options = [...this.querySelectorAll('sf-option')];
  }

  #openList() {
    // 列表是 fixed 的，min-width:100% 会按视口算，所以这里手动对齐触发器宽度。
    // 必须在打开（也就是 place）之前设置，否则位置会按旧宽度算。
    this.#list.style.minWidth = `${Math.round(this.getBoundingClientRect().width)}px`;
    this.#popup.open();
  }

  #onOpen() {
    this.#collect();
    const current = this.#options.findIndex((opt) => opt.value === this.value && !opt.disabled);
    this.#setActive(current >= 0 ? current : this.#options.findIndex((opt) => !opt.disabled));
  }

  #setActive(index) {
    if (index < 0 || index >= this.#options.length) return;
    this.#options.forEach((opt, i) => opt.toggleAttribute('data-active', i === index));
    this.#active = index;
    const opt = this.#options[index];
    this.setAttribute('aria-activedescendant', opt.id);
    opt.scrollIntoView({ block: 'nearest' });
  }

  #move(step) {
    if (!this.#options.length) return;
    let index = this.#active;
    for (let i = 0; i < this.#options.length; i += 1) {
      index = (index + step + this.#options.length) % this.#options.length;
      if (!this.#options[index].disabled) break;
    }
    this.#setActive(index);
  }

  #commit(option) {
    if (!option || option.disabled) return;
    this.value = option.value;
    this.#popup.close({ restoreFocus: true });
    this.dispatchEvent(new CustomEvent('sf-change', {
      bubbles: true,
      composed: true,
      detail: { value: option.value, option },
    }));
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #onClick = (event) => {
    if (this.hasAttribute('disabled')) return;
    // 点在列表里由 #onOptionClick 处理，这里不再 toggle，否则选完又打开
    if (event.composedPath().includes(this.#list)) return;
    this.#popup.isOpen ? this.#popup.close() : this.#openList();
  };

  #onOptionClick = (event) => {
    const option = event.composedPath().find((node) => node.localName === 'sf-option');
    if (option) this.#commit(option);
  };

  #onKeyDown = (event) => {
    if (this.hasAttribute('disabled')) return;
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.#popup.isOpen) this.#commit(this.#options[this.#active]);
        else this.#openList();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (this.#popup.isOpen) this.#move(1);
        else this.#openList();
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (this.#popup.isOpen) this.#move(-1);
        else this.#openList();
        break;
      case 'Home':
        if (!this.#popup.isOpen) return;
        event.preventDefault();
        this.#setActive(0);
        break;
      case 'End':
        if (!this.#popup.isOpen) return;
        event.preventDefault();
        this.#setActive(this.#options.length - 1);
        break;
      case 'Tab':
        this.#popup.close();
        break;
      default:
        break;
    }
  };
}

if (!customElements.get('sf-select')) {
  customElements.define('sf-select', SfSelect);
}

export { SfSelect };
