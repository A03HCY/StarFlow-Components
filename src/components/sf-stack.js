/**
 * <sf-stack gap="4" align="center">…</sf-stack>
 * <sf-stack direction="row" justify="between">…</sf-stack>
 *
 * 一维排布。gap 只接受间距刻度里的数字（0/1/2/3/4/5/6/8/10/12/16），
 * 传别的值会被忽略并回落到默认 —— 免得有人在组件里写魔法数。
 *
 * 它确实只是"给子元素套一层 flex 的 div"。值在于：gap 走 token、
 * 对齐用词而不是 flex 关键字、不用每次重写 display:flex + gap。
 * 如果某个地方用普通 div 更顺手，直接用 div，不必为了统一而统一。
 */

const ALIGN = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

const JUSTIFY = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

const GAPS = new Set([0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16]);

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--_gap, var(--sf-space-3));
      align-items: var(--_align, stretch);
      justify-content: var(--_justify, flex-start);
    }

    :host([direction="row"]) { flex-direction: row; }
    :host([wrap]) { flex-wrap: wrap; }
  </style>
  <slot></slot>
`;

class SfStack extends HTMLElement {
  static observedAttributes = ['gap', 'align', 'justify'];

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
    const gap = Number(this.getAttribute('gap'));
    if (GAPS.has(gap)) this.style.setProperty('--_gap', `var(--sf-space-${gap})`);
    else this.style.removeProperty('--_gap');

    const align = ALIGN[this.getAttribute('align')];
    if (align) this.style.setProperty('--_align', align);
    else this.style.removeProperty('--_align');

    const justify = JUSTIFY[this.getAttribute('justify')];
    if (justify) this.style.setProperty('--_justify', justify);
    else this.style.removeProperty('--_justify');
  }
}

if (!customElements.get('sf-stack')) {
  customElements.define('sf-stack', SfStack);
}

export { SfStack };
