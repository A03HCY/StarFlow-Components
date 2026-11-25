/**
 * <sf-switch name="notify" checked>接收通知</sf-switch>
 *
 * 用 <button role="switch"> 而不是 input[type=checkbox]：
 * 开关在视觉和语义上都不是"打勾"，role=switch + aria-checked 才是读屏该听到的。
 * 文字放在按钮内部，整块可点，可访问名称也由它提供。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      font-family: var(--sf-font-sans);
      vertical-align: middle;
    }

    button {
      display: inline-flex;
      align-items: center;
      gap: var(--sf-space-2);
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--sf-color-text);
      font-family: inherit;
      font-size: var(--sf-font-size-sm);
      line-height: var(--sf-line-height-normal);
      cursor: pointer;
    }

    .track {
      position: relative;
      flex: none;
      width: 34px;
      height: 20px;
      box-sizing: border-box;
      border-radius: var(--sf-radius-full);
      background: var(--sf-color-surface-sunken);
      border: var(--sf-border-width) solid var(--sf-color-border-strong);
      transition:
        background-color var(--sf-duration-base) var(--sf-ease),
        border-color var(--sf-duration-base) var(--sf-ease);
    }

    .thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--sf-color-text-muted);
      transition:
        transform var(--sf-duration-base) var(--sf-ease),
        background-color var(--sf-duration-base) var(--sf-ease);
    }

    :host([checked]) .track {
      background: var(--sf-color-accent);
      border-color: var(--sf-color-accent);
    }
    :host([checked]) .thumb {
      background: var(--sf-color-on-accent);
      transform: translateX(14px);
    }

    button:focus-visible { outline: none; }
    button:focus-visible .track { box-shadow: var(--sf-shadow-focus); }

    :host([disabled]) button {
      opacity: 0.45;
      cursor: not-allowed;
    }
  </style>
  <button part="switch" type="button" role="switch" aria-checked="false">
    <span class="track" part="track"><span class="thumb" part="thumb"></span></span>
    <span class="label"><slot></slot></span>
  </button>
`;

class SfSwitch extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ['checked', 'disabled', 'value'];

  #initialChecked = null;
  #internals;
  #button;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.#button = this.shadowRoot.querySelector('button');
    this.#button.addEventListener('click', () => {
      if (this.hasAttribute('disabled')) return;
      this.checked = !this.checked;
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

  attributeChangedCallback() {
    this.#render();
  }

  get checked() {
    return this.hasAttribute('checked');
  }

  set checked(next) {
    this.toggleAttribute('checked', Boolean(next));
    this.#render();
  }

  get value() {
    return this.getAttribute('value') ?? 'on';
  }

  #render() {
    const on = this.hasAttribute('checked');
    this.#button.setAttribute('aria-checked', String(on));
    this.#button.disabled = this.hasAttribute('disabled');
    this.#internals.setFormValue(on ? this.value : null);
  }
}

if (!customElements.get('sf-switch')) {
  customElements.define('sf-switch', SfSwitch);
}

export { SfSwitch };
