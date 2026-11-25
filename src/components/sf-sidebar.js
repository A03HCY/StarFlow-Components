/**
 * <sf-sidebar>
 *   <div slot="brand">…</div>
 *   <a href="#" aria-current="page">概览</a>
 *   <a href="#">组件</a>
 *   <div slot="footer">…</div>
 * </sf-sidebar>
 *
 * 导航项就是普通的 <a> / <button>，组件负责排版和选中态（认 aria-current="page"），
 * 不做 sf-sidebar-item —— 现在就把图标/徽标/分组的形态定死，用起来反而别扭。
 *
 * 所以也还没有折叠态：折叠要隐藏文字，而文字在光 DOM 里，组件看不见。
 * 真要做折叠，那时再引入 sf-sidebar-item（带 icon/label 两个槽），不是现在。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: block;
      flex: none;
      width: var(--sf-sidebar-width, 220px);
      font-family: var(--sf-font-sans);
    }

    .side {
      display: flex;
      flex-direction: column;
      gap: var(--sf-space-1);
      box-sizing: border-box;
      min-height: 100%;
      padding: var(--sf-space-3);
      background: var(--sf-color-surface);
      border-right: var(--sf-border-width) solid var(--sf-color-border);
    }

    :host([plain]) .side {
      background: transparent;
      border-right: 0;
    }

    .brand { padding: 0 var(--sf-space-2) var(--sf-space-2); }
    .brand:empty { display: none; }

    .nav {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }

    .footer { padding-top: var(--sf-space-2); border-top: var(--sf-border-width) solid var(--sf-color-border); }
    .footer:empty { display: none; }

    ::slotted(a),
    ::slotted(button) {
      display: flex;
      align-items: center;
      gap: var(--sf-space-2);
      box-sizing: border-box;
      width: 100%;
      padding: 7px 10px;
      border: 0;
      border-radius: var(--sf-radius-sm);
      background: transparent;
      color: var(--sf-color-text-muted);
      font-family: inherit;
      font-size: var(--sf-font-size-sm);
      font-weight: var(--sf-font-weight-regular);
      text-align: left;
      text-decoration: none;
      cursor: pointer;
      transition:
        background-color var(--sf-duration-fast) var(--sf-ease),
        color var(--sf-duration-fast) var(--sf-ease);
    }

    ::slotted(a:hover),
    ::slotted(button:hover) {
      background: var(--sf-color-surface-hover);
      color: var(--sf-color-text);
    }

    ::slotted(a:focus-visible),
    ::slotted(button:focus-visible) {
      outline: none;
      box-shadow: var(--sf-shadow-focus);
    }

    /* 选中态跟着 aria-current 走，不需要额外的 class */
    ::slotted([aria-current="page"]) {
      background: var(--sf-color-accent-subtle);
      color: var(--sf-color-accent);
      font-weight: var(--sf-font-weight-medium);
    }

    /* 只对"直接放进 sidebar 的 svg"生效；放在 <a> 里的图标够不到
       （::slotted 只匹配宿主直接子元素），那种必须自己在标签上写 width/height */
    ::slotted(svg) { width: 16px; height: 16px; flex: none; }

    /* 分组小标题 */
    ::slotted([data-section]) {
      padding: var(--sf-space-3) 10px 4px;
      font-size: 10px;
      font-weight: var(--sf-font-weight-semibold);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--sf-color-text-subtle);
    }
  </style>

  <aside class="side" part="sidebar">
    <div class="brand"><slot name="brand"></slot></div>
    <nav class="nav" part="nav"><slot></slot></nav>
    <div class="footer"><slot name="footer"></slot></div>
  </aside>
`;

class SfSidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
  }
}

if (!customElements.get('sf-sidebar')) {
  customElements.define('sf-sidebar', SfSidebar);
}

export { SfSidebar };
