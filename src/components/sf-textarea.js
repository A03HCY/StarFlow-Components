/**
 * <sf-textarea placeholder="说点什么" rows="3"></sf-textarea>
 *
 * 和 sf-input 同构，差别只有三点：
 * 高度交给 rows 和 resize 决定（不锁 --sf-control-height）、内边距要上下都有、
 * 换行需要 line-height 而不是单行居中。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      width: 100%;
      box-sizing: border-box;
      vertical-align: middle;
      font-family: var(--sf-font-sans);
    }

    .box {
      display: flex;
      width: 100%;
      box-sizing: border-box;
      padding: var(--sf-space-2) var(--sf-space-3);
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

    textarea {
      flex: 1;
      width: 100%;
      min-width: 0;
      padding: 0;
      border: 0;
      outline: none;
      background: transparent;
      font-family: inherit;
      font-size: var(--sf-font-size-sm);
      line-height: var(--sf-line-height-normal);
      color: var(--sf-color-text);
      resize: vertical;
    }
    textarea::placeholder { color: var(--sf-color-text-subtle); }

    :host([disabled]) .box {
      background: var(--sf-color-surface-sunken);
      border-color: var(--sf-color-border);
      pointer-events: none;
    }
  </style>
  <div class="box" part="box"><textarea part="input"></textarea></div>
`;

class SfTextarea extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ['value', 'placeholder', 'rows', 'disabled', 'readonly', 'invalid'];

  #internals;
  #input;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.#input = this.shadowRoot.querySelector('textarea');

    this.#input.addEventListener('input', () => this.#sync());
    this.#input.addEventListener('change', () => {
      this.#sync();
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

  focus(options) {
    this.#input.focus(options);
  }

  formResetCallback() {
    this.#render();
  }

  #render() {
    const input = this.#input;
    input.placeholder = this.getAttribute('placeholder') || '';
    input.rows = Number(this.getAttribute('rows')) || 3;
    input.disabled = this.hasAttribute('disabled');
    input.readOnly = this.hasAttribute('readonly');

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

if (!customElements.get('sf-textarea')) {
  customElements.define('sf-textarea', SfTextarea);
}

export { SfTextarea };
