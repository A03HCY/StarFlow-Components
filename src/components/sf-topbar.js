/**
 * <sf-topbar>
 *   <div slot="brand">…</div>
 *   <nav>…</nav>
 *   <div slot="end">…</div>
 * </sf-topbar>
 *
 * 三段式：brand / 中间默认槽 / 右侧 end。默认 sticky + 半透明模糊，
 * 加 no-sticky 关掉。高度走 --sf-topbar-height，真需要更高时改一个变量就够。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--sf-font-sans);
    }

    .bar {
      position: sticky;
      top: 0;
      z-index: var(--sf-z-sticky);
      display: flex;
      align-items: center;
      gap: var(--sf-space-4);
      box-sizing: border-box;
      height: var(--sf-topbar-height, 56px);
      padding: 0 var(--sf-space-6);
      background: color-mix(in oklab, var(--sf-color-bg) 84%, transparent);
      backdrop-filter: saturate(1.4) blur(14px);
      border-bottom: var(--sf-border-width) solid var(--sf-color-border);
      color: var(--sf-color-text);
    }

    :host([no-sticky]) .bar {
      position: static;
      backdrop-filter: none;
      background: var(--sf-color-bg);
    }

    .brand { display: flex; align-items: center; gap: var(--sf-space-3); flex: none; }
    .brand:empty { display: none; }
    .mid { flex: 1; min-width: 0; display: flex; align-items: center; gap: var(--sf-space-2); }
    .end { flex: none; display: flex; align-items: center; gap: var(--sf-space-2); }
    .end:empty { display: none; }
  </style>

  <header class="bar" part="bar">
    <div class="brand"><slot name="brand"></slot></div>
    <div class="mid"><slot></slot></div>
    <div class="end"><slot name="end"></slot></div>
  </header>
`;

class SfTopbar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
  }
}

if (!customElements.get('sf-topbar')) {
  customElements.define('sf-topbar', SfTopbar);
}

export { SfTopbar };
