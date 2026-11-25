/**
 * <sf-container size="md">…</sf-container>
 *
 * 管两件事：最大宽度居中、左右留出页面留白（窄屏留白会收窄）。
 * 之所以做成组件而不是一个 .container 工具类：这个库没有工具类层，
 * 与其让每个人记住类名和像素，不如 import 进来就能用，宽度档位也统一。
 *
 * 宽度是 --sf-container-width，需要某个页面特殊宽度时覆盖这一个变量即可。
 */

const SIZES = { sm: '640px', md: '880px', lg: '1120px', full: '100%' };

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: block;
      box-sizing: border-box;
      width: 100%;
      max-width: var(--sf-container-width, 880px);
      margin-inline: auto;
      padding-inline: var(--sf-space-6);
    }

    :host([bleed]) { padding-inline: 0; }

    @media (max-width: 640px) {
      :host { padding-inline: var(--sf-space-4); }
    }
  </style>
  <slot></slot>
`;

class SfContainer extends HTMLElement {
  static observedAttributes = ['size'];

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
    const size = SIZES[this.getAttribute('size')];
    if (size) this.style.setProperty('--sf-container-width', size);
    else this.style.removeProperty('--sf-container-width');
  }
}

if (!customElements.get('sf-container')) {
  customElements.define('sf-container', SfContainer);
}

export { SfContainer };
