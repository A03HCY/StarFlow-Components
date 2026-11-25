/**
 * <sf-tabs selected="0">
 *   <sf-tab label="概览">…面板内容…</sf-tab>
 *   <sf-tab label="活动" count="3">…</sf-tab>
 * </sf-tabs>
 *
 * 标签条由 sf-tabs 渲染在 shadow 里，面板是光 DOM 里的 sf-tab。
 * 这样标签的排版、下划线、roving tabindex 都在组件内，业务只写面板内容。
 *
 * 键盘：左右键切换（自动激活），Home / End 跳首尾。
 */

const tabTemplate = document.createElement('template');

tabTemplate.innerHTML = `
  <style>
    :host { display: block; }
    :host([hidden]) { display: none; }
    .panel { padding-top: var(--sf-space-4); }
  </style>
  <div class="panel" part="panel"><slot></slot></div>
`;

class SfTab extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(tabTemplate.content.cloneNode(true));
  }

  connectedCallback() {
    this.setAttribute('role', 'tabpanel');
  }

  get label() {
    return this.getAttribute('label') ?? '';
  }
}

if (!customElements.get('sf-tab')) {
  customElements.define('sf-tab', SfTab);
}

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--sf-font-sans);
    }

    .strip {
      display: flex;
      gap: var(--sf-space-1);
      border-bottom: var(--sf-border-width) solid var(--sf-color-border);
      overflow-x: auto;
    }

    .tab {
      appearance: none;
      flex: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-bottom: -1px;
      padding: 8px 10px;
      border: 0;
      border-bottom: 2px solid transparent;
      background: transparent;
      color: var(--sf-color-text-muted);
      font: inherit;
      font-size: var(--sf-font-size-sm);
      font-weight: var(--sf-font-weight-medium);
      white-space: nowrap;
      cursor: pointer;
      transition:
        color var(--sf-duration-fast) var(--sf-ease),
        border-color var(--sf-duration-fast) var(--sf-ease);
    }

    .tab:hover { color: var(--sf-color-text); }
    .tab[aria-selected="true"] {
      color: var(--sf-color-accent);
      border-bottom-color: var(--sf-color-accent);
    }
    .tab:focus-visible {
      outline: none;
      box-shadow: var(--sf-shadow-focus);
      border-radius: var(--sf-radius-xs) var(--sf-radius-xs) 0 0;
    }

    .count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      border-radius: var(--sf-radius-full);
      background: var(--sf-color-surface-sunken);
      color: var(--sf-color-text-muted);
      font-size: 10px;
      font-weight: var(--sf-font-weight-semibold);
      font-variant-numeric: tabular-nums;
    }
    .tab[aria-selected="true"] .count {
      background: var(--sf-color-accent-subtle);
      color: var(--sf-color-accent);
    }
  </style>
  <div class="strip" role="tablist" part="strip"></div>
  <slot></slot>
`;

class SfTabs extends HTMLElement {
  static observedAttributes = ['selected'];

  #strip;
  #tabs = [];
  #buttons = [];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.#strip = this.shadowRoot.querySelector('.strip');
    this.addEventListener('keydown', this.#onKeyDown);
  }

  connectedCallback() {
    this.shadowRoot.querySelector('slot').addEventListener('slotchange', () => this.#rebuild());
    this.#rebuild();
  }

  attributeChangedCallback(name) {
    if (name === 'selected') this.#apply();
  }

  get selected() {
    return Number(this.getAttribute('selected')) || 0;
  }

  set selected(index) {
    this.setAttribute('selected', String(index));
  }

  select(index) {
    if (index < 0 || index >= this.#tabs.length || index === this.selected) return;
    this.setAttribute('selected', String(index));
    this.dispatchEvent(new CustomEvent('sf-change', {
      bubbles: true,
      composed: true,
      detail: { index, value: this.#tabs[index]?.getAttribute('value') },
    }));
    this.#buttons[index]?.focus();
  }

  #rebuild() {
    const tabs = [...this.querySelectorAll('sf-tab')];
    if (tabs.length === this.#tabs.length && tabs.every((t, i) => t === this.#tabs[i])) return;

    this.#tabs = tabs;
    this.#strip.replaceChildren();
    const base = this.id || 'sf-tabs';

    this.#buttons = tabs.map((tab, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tab';
      button.setAttribute('role', 'tab');
      button.id = `${base}-tab-${index}`;
      button.textContent = tab.getAttribute('label') || `标签 ${index + 1}`;

      const count = tab.getAttribute('count');
      if (count) {
        const badge = document.createElement('span');
        badge.className = 'count';
        badge.textContent = count;
        button.append(badge);
      }

      if (!tab.id) tab.id = `${base}-panel-${index}`;
      button.setAttribute('aria-controls', tab.id);
      button.addEventListener('click', () => this.select(index));

      this.#strip.append(button);
      return button;
    });

    this.#apply();
  }

  #apply() {
    if (!this.#tabs.length) return;
    const index = Math.min(Math.max(this.selected, 0), this.#tabs.length - 1);

    this.#tabs.forEach((tab, i) => { tab.hidden = i !== index; });
    this.#buttons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
    });
  }

  #onKeyDown = (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    const last = this.#tabs.length - 1;

    if (step) {
      event.preventDefault();
      this.select((this.selected + step + last + 1) % (last + 1));
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      this.select(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      this.select(last);
    }
  };
}

if (!customElements.get('sf-tabs')) {
  customElements.define('sf-tabs', SfTabs);
}

export { SfTabs, SfTab };
