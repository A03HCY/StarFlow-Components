/**
 * <sf-panel heading="最近活动">
 *   <sf-button slot="actions" size="sm" variant="ghost">全部</sf-button>
 *   …正文…
 *   <div slot="footer">…</div>
 * </sf-panel>
 *
 * 带三段槽位的表面：标题 + 右侧操作 / 正文 / 页脚。
 * 没有标题也没有操作时头部整条收起，没有页脚时页脚收起 —— 不用在页面里写条件。
 * flush 去掉正文内边距（放表格、列表这种要贴边的场景）。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      background: var(--sf-color-surface);
      border: var(--sf-border-width) solid var(--sf-color-border);
      border-radius: var(--sf-radius-lg);
      overflow: hidden;
      font-family: var(--sf-font-sans);
      color: var(--sf-color-text);
    }

    :host([plain]) {
      background: transparent;
      border-color: transparent;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--sf-space-3);
      padding: var(--sf-space-3) var(--sf-space-4);
      border-bottom: var(--sf-border-width) solid var(--sf-color-border);
    }
    :host(:not([data-header])) .header { display: none; }

    .heading {
      margin: 0;
      font-size: var(--sf-font-size-sm);
      font-weight: var(--sf-font-weight-semibold);
      letter-spacing: -0.01em;
    }
    :host(:not([heading])) .heading { display: none; }

    .actions { display: flex; align-items: center; gap: var(--sf-space-2); }

    .body { flex: 1 1 auto; min-height: 0; padding: var(--sf-space-4); }
    :host([flush]) .body { padding: 0; }

    .footer {
      flex: none;
      display: flex;
      align-items: center;
      gap: var(--sf-space-2);
      padding: var(--sf-space-3) var(--sf-space-4);
      border-top: var(--sf-border-width) solid var(--sf-color-border);
      font-size: var(--sf-font-size-sm);
    }
    :host(:not([data-footer])) .footer { display: none; }
  </style>

  <div class="header" part="header">
    <h2 class="heading"></h2>
    <div class="actions" part="actions"><slot name="actions"></slot></div>
  </div>
  <div class="body" part="body"><slot></slot></div>
  <div class="footer" part="footer"><slot name="footer"></slot></div>
`;

class SfPanel extends HTMLElement {
  static observedAttributes = ['heading'];

  #heading;
  #slots;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.#heading = this.shadowRoot.querySelector('.heading');
    this.#slots = {
      actions: this.shadowRoot.querySelector('slot[name="actions"]'),
      footer: this.shadowRoot.querySelector('slot[name="footer"]'),
    };
    this.#slots.actions.addEventListener('slotchange', () => this.#syncSlots());
    this.#slots.footer.addEventListener('slotchange', () => this.#syncSlots());
  }

  connectedCallback() {
    this.#render();
    this.#syncSlots();
  }

  attributeChangedCallback() {
    this.#render();
  }

  #render() {
    this.#heading.textContent = this.getAttribute('heading') || '';
    this.#syncSlots();
  }

  #syncSlots() {
    const has = (slot) => slot.assignedNodes({ flatten: true }).some(
      (node) => node.nodeType === Node.ELEMENT_NODE || node.textContent.trim()
    );
    this.toggleAttribute('data-header', Boolean(this.getAttribute('heading')) || has(this.#slots.actions));
    this.toggleAttribute('data-footer', has(this.#slots.footer));
  }
}

if (!customElements.get('sf-panel')) {
  customElements.define('sf-panel', SfPanel);
}

export { SfPanel };
