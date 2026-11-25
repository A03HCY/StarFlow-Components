/**
 * <sf-page>
 *   <sf-topbar slot="header">…</sf-topbar>
 *   …内容…
 *   <div slot="footer">…</div>
 * </sf-page>
 *
 * 只做一件事：把视口高度分好 —— 撑满一屏、内容区吃掉剩余高度、页脚贴底。
 * 刻意不让 main 自己滚：嵌套滚动条对着屏幕阅读器和触控板都是坑，
 * 让文档滚，sticky 顶栏照样贴住（见 demo_nav 的组合）。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-height: 100dvh;
      font-family: var(--sf-font-sans);
      background: var(--sf-color-bg);
      color: var(--sf-color-text);
    }

    .header { flex: none; }
    .header:empty { display: none; }

    .main { flex: 1 1 auto; min-height: 0; }

    .footer { flex: none; }
    .footer:empty { display: none; }
  </style>

  <div class="header" part="header"><slot name="header"></slot></div>
  <div class="main" part="main"><slot></slot></div>
  <div class="footer" part="footer"><slot name="footer"></slot></div>
`;

class SfPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
  }
}

if (!customElements.get('sf-page')) {
  customElements.define('sf-page', SfPage);
}

export { SfPage };
