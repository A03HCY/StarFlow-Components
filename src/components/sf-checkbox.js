/**
 * <sf-checkbox checked name="agree">我已阅读</sf-checkbox>
 *
 * 视觉是 shadow 里的 span，行为仍由原生 <input type="checkbox"> 承担：
 * 空格切换、读屏角色、不确定态都是浏览器给的，自己写容易漏。
 * 原生 change 不跨 shadow，所以手动转发一份。
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
      border-radius: var(--sf-radius-xs);
      transition:
        background-color var(--sf-duration-fast) var(--sf-ease),
        border-color var(--sf-duration-fast) var(--sf-ease);
    }

    /* 对勾用边框拼，不引图标 */
    .box::after {
      content: "";
      width: 4px;
      height: 8px;
      margin-top: -2px;
      border: solid var(--sf-color-on-accent);
      border-width: 0 2px 2px 0;
      transform: rotate(45deg) scale(0);
      transition: transform var(--sf-duration-fast) var(--sf-ease);
    }

    input:checked + .box {
      background: var(--sf-color-accent);
      border-color: var(--sf-color-accent);
    }
    input:checked + .box::after { transform: rotate(45deg) scale(1); }

    /* 不确定态：一根横杠，不画对勾 */
    input:indeterminate + .box {
      background: var(--sf-color-accent);
      border-color: var(--sf-color-accent);
    }
    input:indeterminate + .box::after {
      width: 8px;
      height: 2px;
      margin: 0;
      border: 0;
      background: var(--sf-color-on-accent);
      transform: none;
    }

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
    :host(:not(:defined)) .label:empty { display: none; }
  </style>
  <label class="wrap" part="wrap">
    <input type="checkbox" part="input">
    <span class="box" part="box" aria-hidden="true"></span>
    <span class="label" part="label"><slot></slot></span>
  </label>
`;

class SfCheckbox extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ['checked', 'indeterminate', 'disabled', 'value'];

  #initialChecked = null;
  #internals;
  #input;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.#input = this.shadowRoot.querySelector('input');

    this.#input.addEventListener('change', () => {
      // 用户的点击/空格：把状态写回属性，这样外面看属性也是对的
      this.toggleAttribute('checked', this.#input.checked);
      this.#sync();
      this.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  connectedCallback() {
    if (this.#initialChecked === null) this.#initialChecked = this.hasAttribute('checked');
    this.#render();
  }

  formResetCallback() {
    if (this.#initialChecked !== null) this.checked = this.#initialChecked;
  }

  attributeChangedCallback(name) {
    // checked 是从内部写回属性的，别在这里回写 input，否则会打断点击
    if (name === 'checked' && this.#input.checked === this.hasAttribute('checked')) return;
    this.#render();
  }

  get checked() {
    return this.#input.checked;
  }

  set checked(next) {
    this.toggleAttribute('checked', Boolean(next));
    this.#render();
  }

  get value() {
    return this.getAttribute('value') ?? 'on';
  }

  #render() {
    const input = this.#input;
    input.checked = this.hasAttribute('checked');
    input.indeterminate = this.hasAttribute('indeterminate');
    input.disabled = this.hasAttribute('disabled');
    this.#sync();
  }

  #sync() {
    this.#internals.setFormValue(this.#input.checked ? this.value : null);
  }
}

if (!customElements.get('sf-checkbox')) {
  customElements.define('sf-checkbox', SfCheckbox);
}

export { SfCheckbox };
