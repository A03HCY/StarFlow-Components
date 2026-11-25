/**
 * <sf-input placeholder="you@example.com" value="" type="text">
 *   <svg slot="prefix">…</svg>
 * </sf-input>
 *
 * 里面是原生 <input>：键盘、输入法、选中、密码管理都由浏览器负责，不重造。
 * 外面套一层 box 承担边框和焦点环 —— 原生 input 的 :focus 没法画外发光。
 *
 * 表单：formAssociated + setFormValue，所以 <form> 提交时能拿到值、new FormData 里有它。
 * change 事件不跨 shadow 边界（composed: false），必须手动转发一次，否则外面监听不到。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      --sf-input-height: var(--sf-control-height-md);
      display: inline-flex;
      width: 100%;
      box-sizing: border-box;
      vertical-align: middle;
      font-family: var(--sf-font-sans);
    }

    :host([size="sm"]) { --sf-input-height: var(--sf-control-height-sm); }

    .box {
      display: flex;
      align-items: center;
      gap: var(--sf-space-2);
      width: 100%;
      height: var(--sf-input-height);
      box-sizing: border-box;
      padding: 0 var(--sf-space-3);
      background: var(--sf-color-surface);
      border: var(--sf-border-width) solid var(--sf-color-border-strong);
      border-radius: var(--sf-radius-sm);
      transition:
        border-color var(--sf-duration-fast) var(--sf-ease),
        box-shadow var(--sf-duration-fast) var(--sf-ease);
    }

    .box:focus-within {
      border-color: var(--sf-color-accent);
      box-shadow: var(--sf-shadow-focus);
    }

    :host([invalid]) .box { border-color: var(--sf-color-danger); }
    :host([invalid]) .box:focus-within {
      border-color: var(--sf-color-danger);
      box-shadow: 0 0 0 var(--sf-ring-width) color-mix(in oklab, var(--sf-color-danger) 40%, transparent);
    }

    input {
      flex: 1;
      min-width: 0;
      height: 100%;
      padding: 0;
      border: 0;
      outline: none;
      background: transparent;
      font-family: inherit;
      font-size: var(--sf-font-size-sm);
      color: var(--sf-color-text);
    }
    input::placeholder { color: var(--sf-color-text-subtle); }

    :host([disabled]) .box {
      background: var(--sf-color-surface-sunken);
      border-color: var(--sf-color-border);
      pointer-events: none;
    }
    :host([disabled]) input { color: var(--sf-color-text-subtle); }

    /* 别给插槽内容设 display：套在 <svg> 上会破坏它的固有尺寸，
       图标会撑成整块。居中交给 .box 的 align-items 就够了。 */
    ::slotted([slot="prefix"]),
    ::slotted([slot="suffix"]) {
      flex: none;
      color: var(--sf-color-text-muted);
      font-size: 16px;
    }
    ::slotted(svg) { width: 1em; height: 1em; }
  </style>
  <div class="box" part="box">
    <slot name="prefix"></slot>
    <input part="input">
    <slot name="suffix"></slot>
  </div>
`;

class SfInput extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ['value', 'placeholder', 'type', 'disabled', 'readonly', 'name', 'invalid', 'autocomplete'];

  #internals;
  #input;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.#input = this.shadowRoot.querySelector('input');

    this.#input.addEventListener('input', () => this.#sync());
    this.#input.addEventListener('change', () => {
      this.#sync();
      // change 不跨 shadow 边界，转发一份出去
      this.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  get value() {
    return this.#input.value;
  }

  set value(next) {
    this.#input.value = next ?? '';
    this.#sync();
  }

  get form() {
    return this.#internals.form;
  }

  focus(options) {
    this.#input.focus(options);
  }

  /** 表单 reset：值从属性来，重新渲染一次就回到初始状态 */
  formResetCallback() {
    this.#render();
  }

  select() {
    this.#input.select();
  }

  #render() {
    const input = this.#input;
    input.type = this.getAttribute('type') || 'text';
    input.placeholder = this.getAttribute('placeholder') || '';
    input.disabled = this.hasAttribute('disabled');
    input.readOnly = this.hasAttribute('readonly');
    input.autocomplete = this.getAttribute('autocomplete') || 'off';

    // value 属性只在和当前值不同时写，避免打断输入法和光标位置
    const attr = this.getAttribute('value') ?? '';
    if (input.value !== attr) input.value = attr;

    if (this.hasAttribute('invalid')) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');

    this.#sync();
  }

  #sync() {
    this.#internals.setFormValue(this.#input.value);
  }
}

if (!customElements.get('sf-input')) {
  customElements.define('sf-input', SfInput);
}

export { SfInput };
