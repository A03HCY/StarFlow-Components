/**
 * <sf-radio name="plan" value="pro" checked>专业版</sf-radio>
 *
 * 分组靠 name，但原生 radio 只能在同一棵 DOM 树里互斥 ——
 * 每个组件各自有 shadow root，浏览器不会把它们连成一组，所以要自己维护一张表。
 * 方向键在组内移动也一并实现了，否则读屏用户会发现"按方向键不动"。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      font-family: var(--sf-font-sans);
      vertical-align: middle;
    }

    .wrap {
      display: inline-flex;
      align-items: center;
      gap: var(--sf-space-2);
      cursor: pointer;
      user-select: none;
    }

    input {
      position: absolute;
      width: 16px;
      height: 16px;
      margin: 0;
      opacity: 0;
      pointer-events: none;
    }

    .box {
      flex: none;
      display: grid;
      place-items: center;
      box-sizing: border-box;
      width: 16px;
      height: 16px;
      background: var(--sf-color-surface);
      border: var(--sf-border-width) solid var(--sf-color-border-strong);
      border-radius: 50%;
      transition:
        border-color var(--sf-duration-fast) var(--sf-ease),
        background-color var(--sf-duration-fast) var(--sf-ease);
    }

    .box::after {
      content: "";
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--sf-color-accent);
      transform: scale(0);
      transition: transform var(--sf-duration-fast) var(--sf-ease);
    }

    input:checked + .box { border-color: var(--sf-color-accent); }
    input:checked + .box::after { transform: scale(1); }
    input:focus-visible + .box { box-shadow: var(--sf-shadow-focus); }

    .label {
      font-size: var(--sf-font-size-sm);
      color: var(--sf-color-text);
      line-height: var(--sf-line-height-normal);
    }

    :host([disabled]) .wrap {
      opacity: 0.45;
      pointer-events: none;
    }
  </style>
  <label class="wrap" part="wrap">
    <input type="radio" part="input">
    <span class="box" part="box" aria-hidden="true"></span>
    <span class="label" part="label"><slot></slot></span>
  </label>
`;

/** name → 同组元素。组件分布在不同的 shadow root 里，浏览器不会自动连成一组 */
const groups = new Map();

function groupOf(name) {
  if (!name) return [];
  if (!groups.has(name)) groups.set(name, new Set());
  return [...groups.get(name)];
}

class SfRadio extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ['checked', 'disabled', 'name', 'value'];

  #initialChecked = null;
  #internals;
  #input;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.#input = this.shadowRoot.querySelector('input');

    this.#input.addEventListener('change', () => {
      this.toggleAttribute('checked', this.#input.checked);
      this.#syncGroup();
      this.#sync();
      this.dispatchEvent(new Event('change', { bubbles: true }));
    });

    this.#input.addEventListener('keydown', this.#onKeyDown);
  }

  connectedCallback() {
    if (this.#initialChecked === null) this.#initialChecked = this.hasAttribute('checked');
    const name = this.getAttribute('name');
    if (name) {
      if (!groups.has(name)) groups.set(name, new Set());
      groups.get(name).add(this);
    }
    this.#render();
  }

  disconnectedCallback() {
    const name = this.getAttribute('name');
    groups.get(name)?.delete(this);
  }

  attributeChangedCallback(name) {
    if (name === 'checked' && this.#input.checked === this.hasAttribute('checked')) return;
    this.#render();
  }

  formResetCallback() {
    if (this.#initialChecked !== null) this.checked = this.#initialChecked;
  }

  get checked() {
    return this.#input.checked;
  }

  set checked(next) {
    this.toggleAttribute('checked', Boolean(next));
    this.#render();
    if (next) this.#syncGroup();
  }

  get value() {
    return this.getAttribute('value') ?? '';
  }

  #render() {
    const input = this.#input;
    input.checked = this.hasAttribute('checked');
    input.disabled = this.hasAttribute('disabled');
    input.name = this.getAttribute('name') || '';
    this.#sync();
  }

  #syncGroup() {
    if (!this.checked) return;
    for (const radio of groupOf(this.getAttribute('name'))) {
      if (radio !== this && radio.checked) radio.checked = false;
    }
  }

  #sync() {
    this.#internals.setFormValue(this.#input.checked ? this.value : null);
  }

  #onKeyDown = (event) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    const siblings = groupOf(this.getAttribute('name')).filter((r) => !r.hasAttribute('disabled'));
    if (siblings.length < 2) return;

    event.preventDefault();
    const index = siblings.indexOf(this);
    const next = siblings[(index + step + siblings.length) % siblings.length];
    next.checked = true;
    next.shadowRoot.querySelector('input').focus();
  };
}

if (!customElements.get('sf-radio')) {
  customElements.define('sf-radio', SfRadio);
}

export { SfRadio };
