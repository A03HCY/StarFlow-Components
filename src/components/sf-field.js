/**
 * <sf-field label="邮箱" hint="我们不会公开" error="" required>
 *   <sf-input type="email"></sf-input>
 * </sf-field>
 *
 * 表单里最常被手写的其实是这里：label + 必填星号 + 说明 + 错误。
 * 它不接管控件的值，只负责"围绕控件的那圈东西"，所以标签、说明都走属性，
 * 控件本身仍由调用方放进默认插槽。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--sf-font-sans);
    }

    .label {
      display: block;
      margin-bottom: 6px;
      font-size: var(--sf-font-size-sm);
      font-weight: var(--sf-font-weight-medium);
      color: var(--sf-color-text);
      cursor: default;
    }

    .req {
      margin-left: 2px;
      color: var(--sf-color-danger);
    }
    :host(:not([required])) .req { display: none; }

    .hint,
    .error {
      margin: 6px 0 0;
      font-size: var(--sf-font-size-xs);
      line-height: var(--sf-line-height-normal);
    }
    .hint { color: var(--sf-color-text-muted); }
    .error { color: var(--sf-color-danger); }

    :host(:not([label])) .label { display: none; }
    :host(:not([hint])) .hint { display: none; }
    :host(:not([error])) .error { display: none; }
    /* 有错误时说明文字让位，两个都显示只会互相打脸 */
    :host([error]) .hint { display: none; }
  </style>
  <label class="label" part="label">
    <span class="text"></span><span class="req" aria-hidden="true">*</span>
  </label>
  <div class="control"><slot></slot></div>
  <p class="hint" part="hint"></p>
  <p class="error" part="error" role="alert"></p>
`;

class SfField extends HTMLElement {
  static observedAttributes = ['label', 'hint', 'error', 'required'];

  #label;
  #hint;
  #error;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.#label = this.shadowRoot.querySelector('.text');
    this.#hint = this.shadowRoot.querySelector('.hint');
    this.#error = this.shadowRoot.querySelector('.error');

    // <label for> 跨不过 shadow 边界，点标题就手动把焦点交给第一个控件
    this.shadowRoot.querySelector('.label').addEventListener('click', () => this.#focusControl());
    this.shadowRoot.querySelector('slot').addEventListener('slotchange', () => this.#syncControl());
  }

  connectedCallback() {
    this.#render();
    this.#syncControl();
  }

  attributeChangedCallback() {
    this.#render();
  }

  #render() {
    this.#label.textContent = this.getAttribute('label') || '';
    this.#hint.textContent = this.getAttribute('hint') || '';
    this.#error.textContent = this.getAttribute('error') || '';
  }

  #control() {
    return this.querySelector(':scope > *');
  }

  #focusControl() {
    const control = this.#control();
    if (control && typeof control.focus === 'function') control.focus();
    else control?.querySelector?.('input, textarea, select')?.focus();
  }

  #syncControl() {
    const control = this.#control();
    if (!control) return;
    const label = this.getAttribute('label');
    if (label && !control.hasAttribute('aria-label') && !control.hasAttribute('aria-labelledby')) {
      control.setAttribute('aria-label', label);
    }
    if (this.hasAttribute('required')) control.setAttribute('aria-required', 'true');
    else control.removeAttribute('aria-required');
  }
}

if (!customElements.get('sf-field')) {
  customElements.define('sf-field', SfField);
}

export { SfField };
