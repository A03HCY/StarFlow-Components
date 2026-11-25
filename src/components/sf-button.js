/**
 * <sf-button>
 *
 * 第三层（Component Token）的样板。
 *
 * 约定：
 * 1. 组件 token 只在 :host 上声明一次，不进全局样式表 —— 组件删了，它的 token 跟着消失，
 *    不会在 tokens.css 里留下没人用的孤儿变量。
 * 2. 变体（variant / size）不另写一套样式，只换同一批变量的值，
 *    所以下面「属性 → 变量」的映射只写一遍。这是第三层最大的价值。
 * 3. 外部按实例覆盖时只碰 --sf-button-*，不去改语义层的公共变量
 *    （改 --sf-color-accent 会影响全站，改 --sf-button-bg 只影响这一个按钮）。
 *
 * 覆盖会生效的写法（文档规则优先于 :host，这点和直觉相反但已实测）：
 *   sf-button { --sf-button-bg: xxx }        ← 类型选择器就能赢，不需要 !important
 *   <sf-button style="--sf-button-bg: xxx">  ← 行内最优先
 * 不生效的写法：
 *   .toolbar { --sf-button-bg: xxx }         ← 祖先上的值会被 :host 的声明挡住（继承输给声明）
 * 要批量改，就写 .toolbar sf-button { ... }，命中按钮本身而不是祖先。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      /* ---- 组件 token：8 个公开钩子 ---- */
      --sf-button-bg: var(--sf-color-accent);
      --sf-button-bg-hover: var(--sf-color-accent-hover);
      --sf-button-fg: var(--sf-color-on-accent);
      --sf-button-border: transparent;
      --sf-button-height: var(--sf-control-height-md);
      --sf-button-padding-x: var(--sf-space-3);
      --sf-button-radius: var(--sf-radius-sm);
      --sf-button-font-size: var(--sf-font-size-sm);

      display: inline-flex;
      vertical-align: middle;
    }

    /* 变体 = 换值，不换结构 */
    :host([variant="ghost"]) {
      --sf-button-bg: var(--sf-color-surface);
      --sf-button-bg-hover: var(--sf-color-surface-hover);
      --sf-button-fg: var(--sf-color-text);
      --sf-button-border: var(--sf-color-border-strong);
    }

    :host([size="sm"]) {
      --sf-button-height: var(--sf-control-height-sm);
      --sf-button-padding-x: var(--sf-space-2);
      --sf-button-font-size: var(--sf-font-size-xs);
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--sf-space-1);
      box-sizing: border-box;
      height: var(--sf-button-height);
      padding: 0 var(--sf-button-padding-x);
      border: var(--sf-border-width) solid var(--sf-button-border);
      border-radius: var(--sf-button-radius);
      background: var(--sf-button-bg);
      color: var(--sf-button-fg);
      font-family: var(--sf-font-sans);
      font-size: var(--sf-button-font-size);
      font-weight: var(--sf-font-weight-medium);
      line-height: 1;
      white-space: nowrap;
      cursor: pointer;
      transition:
        background-color var(--sf-duration-fast) var(--sf-ease),
        border-color var(--sf-duration-fast) var(--sf-ease),
        color var(--sf-duration-fast) var(--sf-ease);
    }

    button:hover {
      background: var(--sf-button-bg-hover);
    }

    button:focus-visible {
      outline: none;
      box-shadow: var(--sf-shadow-focus);
    }

    :host([disabled]) button {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }
  </style>
  <button part="button" type="button"><slot></slot></button>
`;

class SfButton extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ['disabled', 'type'];

  #internals;

  constructor() {
    super();
    // 里面的 <button> 在 shadow 里，和外部 <form> 没有关联，
    // 所以 type=submit/reset 得自己调 form 的方法
    this.#internals = this.attachInternals();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.shadowRoot.querySelector('button').addEventListener('click', this.#onClick);
  }

  connectedCallback() {
    this.#syncDisabled();
  }

  attributeChangedCallback() {
    this.#syncDisabled();
  }

  #onClick = () => {
    const type = this.getAttribute('type') || 'button';
    const form = this.#internals.form;
    if (!form || this.hasAttribute('disabled')) return;
    if (type === 'submit') form.requestSubmit();
    if (type === 'reset') form.reset();
  };

  #syncDisabled() {
    const button = this.shadowRoot?.querySelector('button');
    if (button) button.disabled = this.hasAttribute('disabled');
  }
}

if (!customElements.get('sf-button')) {
  customElements.define('sf-button', SfButton);
}

export { SfButton };
