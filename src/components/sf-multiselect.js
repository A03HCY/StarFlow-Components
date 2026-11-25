import { Popup } from './internal/popup.js';
import './sf-option.js';

/**
 * <sf-multiselect name="tags" placeholder="选择标签">
 *   <sf-option value="a">前端</sf-option>
 *   <sf-option value="b">后端</sf-option>
 * </sf-multiselect>
 *
 * 和 sf-select 的差别不只是"能多选"：
 * 选中不关闭列表（要连选）、已选项变成小 chip、回车在已选项上是取消不是确认。
 * 这些差异散落在每个方法里，所以单独一个文件，而不是给 select 加个 multiple 分支。
 *
 * 表单值是多个同名条目，所以 setFormValue 传 FormData，而不是字符串。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: var(--sf-space-2);
      box-sizing: border-box;
      width: 100%;
      min-height: var(--sf-control-height-md);
      padding: 3px var(--sf-space-2) 3px var(--sf-space-3);
      background: var(--sf-color-surface);
      border: var(--sf-border-width) solid var(--sf-color-border-strong);
      border-radius: var(--sf-radius-sm);
      font-family: var(--sf-font-sans);
      font-size: var(--sf-font-size-sm);
      color: var(--sf-color-text);
      cursor: pointer;
      outline: none;
      transition:
        border-color var(--sf-duration-fast) var(--sf-ease),
        box-shadow var(--sf-duration-fast) var(--sf-ease);
    }

    :host([size="sm"]) { min-height: var(--sf-control-height-sm); }

    :host(:focus-visible) {
      border-color: var(--sf-color-accent);
      box-shadow: var(--sf-shadow-focus);
    }
    :host([open]) { border-color: var(--sf-color-accent); }

    :host([disabled]) {
      background: var(--sf-color-surface-sunken);
      border-color: var(--sf-color-border);
      pointer-events: none;
    }

    .chips {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
      padding: 3px 0;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      height: 20px;
      padding: 0 2px 0 6px;
      border-radius: var(--sf-radius-xs);
      background: var(--sf-color-accent-subtle);
      color: var(--sf-color-accent);
      font-size: 11px;
      line-height: 1;
      white-space: nowrap;
    }

    .chip .x {
      all: unset;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 3px;
      cursor: pointer;
      opacity: 0.7;
    }
    .chip .x:hover { opacity: 1; background: color-mix(in oklab, currentColor 16%, transparent); }

    .placeholder {
      font-size: var(--sf-font-size-sm);
      color: var(--sf-color-text-subtle);
    }
    :host([data-has-value]) .placeholder { display: none; }

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

  <div class="chips" part="chips">
    <span class="placeholder"></span>
  </div>
  <svg class="caret" part="caret" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <div class="list" role="listbox" aria-multiselectable="true" part="list"><slot></slot></div>
`;

class SfMultiSelect extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ['placeholder', 'disabled', 'size'];

  #internals;
  #popup;
  #list;
  #chips;
  #placeholder;
  #options = [];
  #values = new Set();
  #active = -1;
  #seeded = false;
  #initialValues = null;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.#list = this.shadowRoot.querySelector('.list');
    this.#chips = this.shadowRoot.querySelector('.chips');
    this.#placeholder = this.shadowRoot.querySelector('.placeholder');

    this.#popup = new Popup(this, {
      floating: this.#list,
      gap: 4,
      manual: true,
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
    if (!this.#seeded) {
      this.#seeded = true;
      this.querySelectorAll('sf-option[selected]').forEach((opt) => this.#values.add(opt.value));
      this.#initialValues = [...this.#values];
    }
    this.#render();
  }

  disconnectedCallback() {
    this.#popup.destroy();
  }

  attributeChangedCallback() {
    this.#render();
  }

  get values() {
    return [...this.#values];
  }

  formResetCallback() {
    if (this.#initialValues) this.values = this.#initialValues;
  }

  set values(next) {
    this.#values = new Set(next ?? []);
    this.#render();
  }

  #render() {
    this.#options = [...this.querySelectorAll('sf-option')];
    this.#placeholder.textContent = this.getAttribute('placeholder') || '';

    // 选项可能被外部改过（增删），以 #values 为准重新对齐
    const available = new Set(this.#options.map((opt) => opt.value));
    for (const value of [...this.#values]) {
      if (!available.has(value)) this.#values.delete(value);
    }

    this.#options.forEach((opt) => {
      opt.setAttribute('aria-selected', String(this.#values.has(opt.value)));
    });

    this.#renderChips();
    this.toggleAttribute('data-has-value', this.#values.size > 0);
    this.#syncForm();
  }

  #renderChips() {
    this.#chips.querySelectorAll('.chip').forEach((chip) => chip.remove());

    for (const value of this.#values) {
      const option = this.#options.find((opt) => opt.value === value);
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.dataset.value = value;

      const label = document.createElement('span');
      label.textContent = option ? option.label : value;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'x';
      remove.dataset.remove = value;
      remove.setAttribute('aria-label', `移除 ${label.textContent}`);
      remove.innerHTML = '<svg viewBox="0 0 12 12" width="9" height="9" fill="none" aria-hidden="true"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

      chip.append(label, remove);
      this.#chips.append(chip);
    }
  }

  #syncForm() {
    const name = this.getAttribute('name') || '';
    const data = new FormData();
    for (const value of this.#values) data.append(name, value);
    this.#internals.setFormValue(this.#values.size ? data : null);
  }

  #openList() {
    this.#list.style.minWidth = `${Math.round(this.getBoundingClientRect().width)}px`;
    this.#popup.open();
  }

  #onOpen() {
    this.#options = [...this.querySelectorAll('sf-option')];
    const first = this.#options.findIndex((opt) => !opt.disabled);
    const selected = this.#options.findIndex((opt) => this.#values.has(opt.value) && !opt.disabled);
    this.#setActive(selected >= 0 ? selected : first);
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

  #toggleValue(value) {
    if (this.#values.has(value)) this.#values.delete(value);
    else this.#values.add(value);
    this.#render();
    this.dispatchEvent(new CustomEvent('sf-change', {
      bubbles: true,
      composed: true,
      detail: { values: this.values },
    }));
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #onClick = (event) => {
    if (this.hasAttribute('disabled')) return;
    const path = event.composedPath();

    // chip 上的 × ：移除，不碰列表
    const removeBtn = path.find((node) => node.dataset?.remove);
    if (removeBtn) {
      this.#toggleValue(removeBtn.dataset.remove);
      return;
    }
    if (path.includes(this.#list)) return;
    this.#popup.isOpen ? this.#popup.close() : this.#openList();
  };

  #onOptionClick = (event) => {
    const option = event.composedPath().find((node) => node.localName === 'sf-option');
    if (option && !option.disabled) this.#toggleValue(option.value);
  };

  #onKeyDown = (event) => {
    if (this.hasAttribute('disabled')) return;

    if (event.key === 'Backspace' && !this.#popup.isOpen && this.#values.size) {
      event.preventDefault();
      const last = [...this.#values].at(-1);
      this.#toggleValue(last);
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.#popup.isOpen) {
          this.#openList();
        } else if (this.#options[this.#active]) {
          this.#toggleValue(this.#options[this.#active].value);
        }
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

if (!customElements.get('sf-multiselect')) {
  customElements.define('sf-multiselect', SfMultiSelect);
}

export { SfMultiSelect };
