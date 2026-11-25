/**
 * <sf-split-pane ratio="0.3" min-size="160px">
 *   <div slot="start">…</div>
 *   <div slot="end">…</div>
 * </sf-split-pane>
 *
 * 左右两栏 + 中间可拖的分隔条。用命名槽而不是"第一个/第二个孩子"：
 * 顺序变化时不会把两栏搞反，也不会把注释节点算进去。
 *
 * 比例有两条约束：
 * - 拖动时按 min-size 夹住，两侧都不会被挤成 0
 * - 键盘左右键调 2%，Home/End 到两端 —— 只用鼠标能拖的东西对键盘用户等于不存在
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: flex;
      box-sizing: border-box;
      width: 100%;
      overflow: hidden;
      font-family: var(--sf-font-sans);
    }

    .start {
      flex: 0 0 calc(var(--_ratio, 0.3) * 100%);
      min-width: 0;
      overflow: auto;
    }

    .end {
      flex: 1 1 0;
      min-width: 0;
      overflow: auto;
    }

    .divider {
      flex: none;
      position: relative;
      width: 9px;
      margin: 0 -4px;
      cursor: col-resize;
      background: transparent;
      border: 0;
      padding: 0;
      z-index: 1;
    }

    .divider::before {
      content: "";
      position: absolute;
      inset: 0 auto 0 50%;
      width: var(--sf-border-width);
      background: var(--sf-color-border);
      transition: background-color var(--sf-duration-fast) var(--sf-ease);
    }

    .divider:hover::before,
    .divider:focus-visible::before {
      background: var(--sf-color-accent);
      width: 2px;
    }
    .divider:focus-visible { outline: none; }
  </style>

  <div class="start" part="start"><slot name="start"></slot></div>
  <div class="divider" part="divider" role="separator" tabindex="0" aria-orientation="vertical"></div>
  <div class="end" part="end"><slot name="end"></slot></div>
`;

class SfSplitPane extends HTMLElement {
  static observedAttributes = ['ratio', 'min-size'];

  #divider;
  #dragging = false;
  #current = 0.3;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.#divider = this.shadowRoot.querySelector('.divider');
    this.#divider.addEventListener('pointerdown', this.#onPointerDown);
    this.#divider.addEventListener('keydown', this.#onKeyDown);
  }

  connectedCallback() {
    this.#apply();
    this.#divider.setAttribute('aria-valuenow', String(Math.round(this.ratio * 100)));
  }

  attributeChangedCallback() {
    this.#apply();
  }

  get ratio() {
    const raw = Number(this.getAttribute('ratio'));
    return Number.isFinite(raw) && raw > 0 && raw < 1 ? raw : 0.3;
  }

  set ratio(next) {
    this.setAttribute('ratio', String(next));
  }

  disconnectedCallback() {
    window.removeEventListener('pointermove', this.#onPointerMove);
    window.removeEventListener('pointerup', this.#onPointerUp);
  }

  #apply() {
    this.#current = this.ratio;
    this.style.setProperty('--_ratio', String(this.ratio));
    this.#divider?.setAttribute('aria-valuenow', String(Math.round(this.ratio * 100)));
  }

  #minRatio() {
    const min = parseFloat(this.getAttribute('min-size')) || 120;
    const width = this.getBoundingClientRect().width || 1;
    return Math.min(0.45, min / width);
  }

  #set(next, commit) {
    const min = this.#minRatio();
    const ratio = Math.min(Math.max(next, min), 1 - min);
    this.#current = ratio;
    this.style.setProperty('--_ratio', String(ratio));
    this.#divider.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
    // 拖动过程只改变量，松手才写回属性，避免每一帧都触发属性回调
    if (commit) this.setAttribute('ratio', ratio.toFixed(3));
    this.dispatchEvent(new CustomEvent('sf-resize', {
      bubbles: true,
      composed: true,
      detail: { ratio },
    }));
  }

  #onPointerDown = (event) => {
    event.preventDefault();
    this.#dragging = true;
    // 合成事件没有真实指针，捕获会抛 NotFoundError，捕获失败不影响拖动本身
    try { this.#divider.setPointerCapture(event.pointerId); } catch { /* noop */ }
    window.addEventListener('pointermove', this.#onPointerMove);
    window.addEventListener('pointerup', this.#onPointerUp);
  };

  #onPointerMove = (event) => {
    if (!this.#dragging) return;
    const rect = this.getBoundingClientRect();
    this.#set((event.clientX - rect.left) / rect.width, false);
  };

  #onPointerUp = () => {
    this.#dragging = false;
    window.removeEventListener('pointermove', this.#onPointerMove);
    window.removeEventListener('pointerup', this.#onPointerUp);
    // 拖动过程中只在变量上改，属性还是旧值，所以这里提交 #current
    this.setAttribute('ratio', this.#current.toFixed(3));
  };

  #onKeyDown = (event) => {
    const step = 0.02;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.#set(this.ratio - step, true);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.#set(this.ratio + step, true);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.#set(0, true);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.#set(1, true);
    }
  };
}

if (!customElements.get('sf-split-pane')) {
  customElements.define('sf-split-pane', SfSplitPane);
}

export { SfSplitPane };
