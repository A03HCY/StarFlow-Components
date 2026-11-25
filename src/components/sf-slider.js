/**
 * <sf-slider min="0" max="100" step="1" value="40" show-value></sf-slider>
 *
 * 用原生 input[type=range]：拖动、方向键、读屏都是免费的。
 * 只有外观要自己画 —— 已填充的那段用 background 渐变做，
 * 百分比由 JS 写进 --_pct（内部变量，前面带下划线，不属于公开 token）。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--sf-space-3);
      width: 100%;
      font-family: var(--sf-font-sans);
      vertical-align: middle;
    }

    input {
      flex: 1;
      min-width: 0;
      height: 20px;
      margin: 0;
      background: transparent;
      appearance: none;
      -webkit-appearance: none;
      cursor: pointer;
    }

    input::-webkit-slider-runnable-track {
      height: 4px;
      border-radius: var(--sf-radius-full);
      background: linear-gradient(
        to right,
        var(--sf-color-accent) var(--_pct, 0%),
        var(--sf-color-surface-sunken) var(--_pct, 0%)
      );
    }

    input::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      margin-top: -5px;
      border-radius: 50%;
      background: var(--sf-color-surface);
      border: 2px solid var(--sf-color-accent);
      box-shadow: var(--sf-shadow-sm);
    }

    input::-moz-range-track {
      height: 4px;
      border-radius: var(--sf-radius-full);
      background: var(--sf-color-surface-sunken);
    }
    input::-moz-range-progress {
      height: 4px;
      border-radius: var(--sf-radius-full);
      background: var(--sf-color-accent);
    }
    input::-moz-range-thumb {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--sf-color-surface);
      border: 2px solid var(--sf-color-accent);
    }

    input:focus-visible { outline: none; }
    input:focus-visible::-webkit-slider-thumb { box-shadow: var(--sf-shadow-focus); }
    input:focus-visible::-moz-range-thumb { box-shadow: var(--sf-shadow-focus); }

    .value {
      flex: none;
      min-width: 2.5em;
      font-family: var(--sf-font-mono);
      font-size: var(--sf-font-size-xs);
      color: var(--sf-color-text-muted);
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    :host(:not([show-value])) .value { display: none; }
    :host([disabled]) input { opacity: 0.45; cursor: not-allowed; }
  </style>
  <input type="range" part="input">
  <span class="value" part="value"></span>
`;

class SfSlider extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ['min', 'max', 'step', 'value', 'disabled', 'show-value'];

  #internals;
  #input;
  #value;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.#input = this.shadowRoot.querySelector('input');
    this.#value = this.shadowRoot.querySelector('.value');

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
    return Number(this.#input.value);
  }

  set value(next) {
    this.#input.value = String(next);
    this.#sync();
  }

  formResetCallback() {
    this.#render();
  }

  #render() {
    const input = this.#input;
    input.min = this.getAttribute('min') || '0';
    input.max = this.getAttribute('max') || '100';
    input.step = this.getAttribute('step') || '1';
    input.disabled = this.hasAttribute('disabled');

    const attr = this.getAttribute('value');
    if (attr !== null && input.value !== attr) input.value = attr;

    this.#sync();
  }

  #sync() {
    const input = this.#input;
    const min = Number(input.min);
    const max = Number(input.max);
    const pct = max > min ? ((Number(input.value) - min) / (max - min)) * 100 : 0;

    input.style.setProperty('--_pct', `${pct}%`);
    this.#value.textContent = input.value;
    this.#internals.setFormValue(input.value);
  }
}

if (!customElements.get('sf-slider')) {
  customElements.define('sf-slider', SfSlider);
}

export { SfSlider };
