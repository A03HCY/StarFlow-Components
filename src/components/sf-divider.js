/**
 * <sf-divider>  /  <sf-divider vertical>  /  <sf-divider>分组</sf-divider>
 *
 * 有文字时两侧各一条线，没文字时只留一条 —— 两条线之间没有 gap 的话会变成 3px 粗线，
 * 所以没文字要把第二条隐藏掉，而不是让它塌陷。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: flex;
      align-items: center;
      gap: var(--sf-space-3);
      width: 100%;
      font-family: var(--sf-font-sans);
    }

    :host([vertical]) {
      display: inline-flex;
      flex-direction: column;
      width: auto;
      height: 100%;
      min-height: 20px;
      align-self: stretch;
      gap: var(--sf-space-2);
    }

    .line { flex: 1 1 auto; background: var(--sf-color-border); }
    :host(:not([vertical])) .line { height: var(--sf-border-width); }
    :host([vertical]) .line { width: var(--sf-border-width); }

    .text {
      flex: none;
      font-size: var(--sf-font-size-xs);
      color: var(--sf-color-text-muted);
      white-space: nowrap;
    }

    /* 没文字：把右侧那条线去掉，否则 gap 会在中间留个缺口 */
    :host(:not([data-label])) .text,
    :host(:not([data-label])) .line:last-child { display: none; }
  </style>
  <span class="line"></span>
  <span class="text"><slot></slot></span>
  <span class="line"></span>
`;

class SfDivider extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.shadowRoot.querySelector('slot').addEventListener('slotchange', () => this.#sync());
  }

  connectedCallback() {
    this.#sync();
  }

  #sync() {
    const hasLabel = [...this.childNodes].some(
      (n) => n.nodeType === Node.ELEMENT_NODE || n.textContent.trim()
    );
    this.toggleAttribute('data-label', hasLabel);
    this.setAttribute('role', 'separator');
    this.setAttribute(
      'aria-orientation',
      this.hasAttribute('vertical') ? 'vertical' : 'horizontal'
    );
  }
}

if (!customElements.get('sf-divider')) {
  customElements.define('sf-divider', SfDivider);
}

export { SfDivider };
