/**
 * <sf-icon-button label="更多操作">…svg…</sf-icon-button>
 *
 * 和 sf-button 的区别只有一点：没有文字，所以必须给 label（可访问名称）。
 * 变体和 sf-button 同构，也只是换同一批变量的值。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      --sf-icon-button-size: var(--sf-control-height-md);
      --sf-icon-button-bg: transparent;
      --sf-icon-button-fg: var(--sf-color-text-muted);
      --sf-icon-button-radius: var(--sf-radius-sm);

      display: inline-flex;
      vertical-align: middle;
    }

    :host([size="sm"]) { --sf-icon-button-size: var(--sf-control-height-sm); --sf-icon-button-radius: var(--sf-radius-xs); }
    /* 40px 只有这里用，先写死；第二处出现再提到 --sf-control-height-lg */
    :host([size="lg"]) { --sf-icon-button-size: 40px; --sf-icon-button-radius: var(--sf-radius-md); }

    /* solid 用在有底色的工具条上，透明底会看不出来 */
    :host([variant="solid"]) {
      --sf-icon-button-bg: var(--sf-color-surface);
      --sf-icon-button-fg: var(--sf-color-text);
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: var(--sf-icon-button-size);
      height: var(--sf-icon-button-size);
      padding: 0;
      border: 0;
      border-radius: var(--sf-icon-button-radius);
      background: var(--sf-icon-button-bg);
      color: var(--sf-icon-button-fg);
      /* 图标是 1em，尺寸跟着按钮走。这句必须写在 button 上：
         ::slotted 的元素是按扁平树继承的（父级是插槽所在的 button），
         写到 :host 上图标收不到，会掉回浏览器默认的 13.33px。 */
      font-size: calc(var(--sf-icon-button-size) * 0.5);
      line-height: 1;
      cursor: pointer;
      transition:
        background-color var(--sf-duration-fast) var(--sf-ease),
        color var(--sf-duration-fast) var(--sf-ease);
    }

    button:hover { background: var(--sf-color-surface-hover); color: var(--sf-color-text); }
    button:focus-visible { outline: none; box-shadow: var(--sf-shadow-focus); }

    ::slotted(svg) { width: 1em; height: 1em; display: block; fill: currentColor; }

    :host([disabled]) button {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }
  </style>
  <button part="button" type="button"><slot></slot></button>
`;

class SfIconButton extends HTMLElement {
  static observedAttributes = ['label', 'disabled'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.#sync();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  #sync() {
    const button = this.shadowRoot?.querySelector('button');
    if (!button) return;
    button.setAttribute('aria-label', this.getAttribute('label') || '');
    button.disabled = this.hasAttribute('disabled');
  }
}

if (!customElements.get('sf-icon-button')) {
  customElements.define('sf-icon-button', SfIconButton);
}

export { SfIconButton };
