/**
 * <sf-page-header title="概览" description="最近 7 天的构建情况">
 *   <div slot="breadcrumbs">项目 / 概览</div>
 *   <sf-button slot="actions" size="sm">新建</sf-button>
 * </sf-page-header>
 *
 * 页面头：面包屑 / 标题 + 描述 / 右侧操作。
 * 没内容的部分会自动收起，不留空白 —— 所以不需要在页面里到处写条件渲染。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--sf-font-sans);
    }

    .crumbs {
      margin-bottom: var(--sf-space-2);
      font-size: var(--sf-font-size-xs);
      color: var(--sf-color-text-subtle);
    }
    :host(:not([data-crumbs])) .crumbs { display: none; }

    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--sf-space-4);
    }

    .text { min-width: 0; display: grid; gap: 4px; }

    .title {
      margin: 0;
      font-size: var(--sf-font-size-2xl);
      line-height: var(--sf-line-height-tight);
      font-weight: var(--sf-font-weight-semibold);
      letter-spacing: -0.01em;
      color: var(--sf-color-text);
    }

    .desc {
      margin: 0;
      max-width: 62ch;
      font-size: var(--sf-font-size-sm);
      color: var(--sf-color-text-muted);
    }
    :host(:not([description])) .desc { display: none; }

    .actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sf-space-2); }
    :host(:not([data-actions])) .actions { display: none; }
  </style>

  <div class="crumbs" part="breadcrumbs"><slot name="breadcrumbs"></slot></div>
  <div class="row">
    <div class="text">
      <h1 class="title"></h1>
      <p class="desc"></p>
    </div>
    <div class="actions" part="actions"><slot name="actions"></slot></div>
  </div>
`;

class SfPageHeader extends HTMLElement {
  static observedAttributes = ['title', 'description'];

  #title;
  #desc;
  #slots;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.#title = this.shadowRoot.querySelector('.title');
    this.#desc = this.shadowRoot.querySelector('.desc');

    this.#slots = {
      crumbs: this.shadowRoot.querySelector('slot[name="breadcrumbs"]'),
      actions: this.shadowRoot.querySelector('slot[name="actions"]'),
    };
    this.#slots.crumbs.addEventListener('slotchange', () => this.#syncSlots());
    this.#slots.actions.addEventListener('slotchange', () => this.#syncSlots());
  }

  connectedCallback() {
    this.#render();
    this.#syncSlots();
  }

  attributeChangedCallback() {
    this.#render();
  }

  #render() {
    this.#title.textContent = this.getAttribute('title') || '';
    this.#desc.textContent = this.getAttribute('description') || '';
  }

  #syncSlots() {
    const has = (slot) => slot.assignedNodes({ flatten: true }).some(
      (node) => node.nodeType === Node.ELEMENT_NODE || node.textContent.trim()
    );
    this.toggleAttribute('data-crumbs', has(this.#slots.crumbs));
    this.toggleAttribute('data-actions', has(this.#slots.actions));
  }
}

if (!customElements.get('sf-page-header')) {
  customElements.define('sf-page-header', SfPageHeader);
}

export { SfPageHeader };
