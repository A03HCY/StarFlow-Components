/**
 * <sf-grid min-size="240px" gap="4">…</sf-grid>
 * <sf-grid columns="3" gap="4">…</sf-grid>
 *
 * 两种模式：
 * - 不给 columns：auto-fit + minmax(min-size, 1fr)，按容器宽度自己决定几列
 * - 给 columns：固定列数，此时 min-size 失效（minmax(0,1fr)，避免内容把格子撑破）
 *
 * 卡片栅格就用 <sf-grid min-size="280px">，不单独做 CardGrid ——
 * 那只是换了个默认最小宽度，多一个组件就多一层查表。
 */

const GAPS = new Set([0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16]);

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: grid;
      box-sizing: border-box;
      width: 100%;
      grid-template-columns: repeat(var(--_cols, auto-fit), minmax(var(--_min, 200px), 1fr));
      gap: var(--_gap, var(--sf-space-4));
    }
  </style>
  <slot></slot>
`;

class SfGrid extends HTMLElement {
  static observedAttributes = ['columns', 'min-size', 'gap'];

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
    const columns = Number(this.getAttribute('columns'));
    if (Number.isInteger(columns) && columns > 0) {
      this.style.setProperty('--_cols', String(columns));
      // 固定列时把最小宽度让开，否则窄容器里会横向溢出
      this.style.setProperty('--_min', '0');
    } else {
      this.style.removeProperty('--_cols');
      this.style.setProperty('--_min', this.getAttribute('min-size') || '200px');
    }

    const gap = Number(this.getAttribute('gap'));
    if (GAPS.has(gap)) this.style.setProperty('--_gap', `var(--sf-space-${gap})`);
    else this.style.removeProperty('--_gap');
  }
}

if (!customElements.get('sf-grid')) {
  customElements.define('sf-grid', SfGrid);
}

export { SfGrid };
