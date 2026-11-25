/**
 * <sf-skeleton>  /  <sf-skeleton variant="rect" style="--sf-skeleton-height: 96px">
 *
 * 尺寸走三个实例级变量（width / height / radius）：占位块的大小天然由业务决定，
 * 每个尺寸都做成预设反而用不上。
 * 对读屏器隐藏 —— 骨架屏只是视觉占位，念出来是噪音。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: block;
      width: var(--sf-skeleton-width, 100%);
      height: var(--sf-skeleton-height, 12px);
      border-radius: var(--sf-skeleton-radius, var(--sf-radius-sm));
      /* 底色用 surface-hover（两套主题下都比卡片"偏一点"），
         扫光用 border 色 —— 亮色下是略深的一道，暗色下是略浅的一道，都不抢眼。
         直接拿 surface-sunken 当底色的话，暗色里会变成比卡片还黑的洞。 */
      background-color: var(--sf-color-surface-hover);
      background-image: linear-gradient(
        90deg,
        transparent 20%,
        var(--sf-color-border) 40%,
        transparent 60%
      );
      background-size: 400% 100%;
      animation: sf-shimmer 1.4s ease infinite;
    }

    :host([variant="rect"]) {
      height: var(--sf-skeleton-height, 96px);
      border-radius: var(--sf-skeleton-radius, var(--sf-radius-md));
    }

    :host([variant="circle"]) {
      width: var(--sf-skeleton-size, 32px);
      height: var(--sf-skeleton-size, 32px);
      border-radius: 50%;
    }

    /* 1.4s 是节奏，不是设计变量；系统要减少动效时直接停 */
    @keyframes sf-shimmer {
      from { background-position: 100% 50%; }
      to { background-position: 0 50%; }
    }

    @media (prefers-reduced-motion: reduce) {
      :host { animation: none; }
    }
  </style>
`;

class SfSkeleton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.setAttribute('aria-hidden', 'true');
  }
}

if (!customElements.get('sf-skeleton')) {
  customElements.define('sf-skeleton', SfSkeleton);
}

export { SfSkeleton };
