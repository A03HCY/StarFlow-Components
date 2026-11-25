import { Popup } from './internal/popup.js';

/**
 * <sf-dropdown>
 *   <sf-button slot="trigger">操作</sf-button>
 *   <div role="menuitem" data-value="rename">重命名</div>
 *   <div role="separator"></div>
 *   <div role="menuitem" data-danger>删除</div>
 * </sf-dropdown>
 *
 * 菜单项的排版由组件负责（::slotted 只作用到项本身，够用），
 * 但没有 sf-menu-item 这种子组件 —— 项就是带 role 的普通元素，
 * 因为菜单项形态差异太大（图标、快捷键、副标题），先给死反而不好用。
 *
 * 打开/关闭/点外面关/重定位统一交给 internal/popup.js，
 * 这里只负责菜单特有的部分：roving focus、方向键、选中派发。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host { display: inline-flex; }

    .menu {
      position: fixed;
      left: 0;
      top: 0;
      z-index: var(--sf-z-dropdown);
      display: none;
      box-sizing: border-box;
      min-width: 180px;
      max-height: var(--sf-dropdown-max-height, 320px);
      overflow: auto;
      padding: var(--sf-space-1);
      background: var(--sf-color-surface);
      color: var(--sf-color-text);
      border: var(--sf-border-width) solid var(--sf-color-border);
      border-radius: var(--sf-radius-md);
      box-shadow: var(--sf-shadow-lg);
      font-family: var(--sf-font-sans);
      font-size: var(--sf-font-size-sm);
    }

    :host([open]) .menu { display: block; }

    ::slotted([role="menuitem"]) {
      display: flex;
      align-items: center;
      gap: var(--sf-space-2);
      padding: 7px 10px;
      border-radius: var(--sf-radius-sm);
      color: var(--sf-color-text);
      cursor: pointer;
      outline: none;
      white-space: nowrap;
    }
    ::slotted([role="menuitem"]:hover),
    ::slotted([role="menuitem"]:focus) { background: var(--sf-color-surface-hover); }
    ::slotted([role="menuitem"][aria-disabled="true"]) {
      color: var(--sf-color-text-subtle);
      pointer-events: none;
    }
    ::slotted([role="menuitem"][data-danger]) { color: var(--sf-color-danger); }
    ::slotted([role="separator"]) {
      display: block;
      height: var(--sf-border-width);
      margin: 4px 0;
      background: var(--sf-color-border);
    }
  </style>
  <slot name="trigger"></slot>
  <div class="menu" role="menu" part="menu"><slot></slot></div>
`;

class SfDropdown extends HTMLElement {
  static observedAttributes = ['placement'];

  #popup;
  #menu;
  #items = [];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.#menu = this.shadowRoot.querySelector('.menu');
    this.#popup = new Popup(this, {
      floating: this.#menu,
      gap: 4,
      haspopup: 'menu',
      onOpen: ({ focusFirst }) => {
        this.#collect();
        if (focusFirst) this.#items[0]?.focus();
      },
    });
  }

  get open() {
    return this.hasAttribute('open');
  }

  connectedCallback() {
    const trigger = this.querySelector('[slot="trigger"]');
    if (trigger) {
      this.#popup.setAnchor(trigger);
      trigger.addEventListener('keydown', this.#onTriggerKeyDown);
    }
    this.#menu.addEventListener('click', this.#onItemClick);
    this.addEventListener('keydown', this.#onKeyDown);
    this.#syncPlacement();
  }

  disconnectedCallback() {
    this.querySelector('[slot="trigger"]')?.removeEventListener('keydown', this.#onTriggerKeyDown);
    this.#menu?.removeEventListener('click', this.#onItemClick);
    this.removeEventListener('keydown', this.#onKeyDown);
    this.#popup.destroy();
  }

  attributeChangedCallback(name) {
    if (name === 'placement') this.#syncPlacement();
  }

  show(options) {
    this.#popup.open(options);
  }

  hide(options) {
    this.#popup.close(options);
  }

  toggle(options) {
    this.#popup.toggle(options);
  }

  #syncPlacement() {
    this.#popup.placement = this.getAttribute('placement') || 'bottom-start';
  }

  #collect() {
    this.#items = [...this.querySelectorAll('[role="menuitem"]')].filter(
      (item) => item.getAttribute('aria-disabled') !== 'true'
    );
    this.#items.forEach((item) => { item.tabIndex = -1; });
  }

  #select(item) {
    const detail = { value: item.dataset.value ?? item.textContent.trim(), item };
    this.#popup.close({ restoreFocus: true });
    this.dispatchEvent(new CustomEvent('sf-select', { bubbles: true, composed: true, detail }));
  }

  #move(step) {
    if (!this.#items.length) return;
    const current = this.#items.indexOf(document.activeElement);
    const next = current === -1 ? 0 : (current + step + this.#items.length) % this.#items.length;
    this.#items[next].focus();
  }

  #onTriggerKeyDown = (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'Enter' && event.key !== ' ') return;
    if (this.open) return;
    event.preventDefault();
    this.show({ focusFirst: true });
  };

  #onItemClick = (event) => {
    const item = event
      .composedPath()
      .find((node) => node.nodeType === Node.ELEMENT_NODE && node.getAttribute?.('role') === 'menuitem');
    if (!item || item.getAttribute('aria-disabled') === 'true') return;
    this.#select(item);
  };

  #onKeyDown = (event) => {
    if (!this.open) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.#move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.#move(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.#items[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        this.#items.at(-1)?.focus();
        break;
      case 'Tab':
        this.hide();
        break;
      default:
        break;
    }
  };
}

if (!customElements.get('sf-dropdown')) {
  customElements.define('sf-dropdown', SfDropdown);
}

export { SfDropdown };
