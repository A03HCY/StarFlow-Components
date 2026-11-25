/**
 * <sf-steps current="1">
 *   <sf-step title="填写信息" description="账号与密码"></sf-step>
 *   <sf-step title="验证邮箱"></sf-step>
 *   <sf-step title="完成"></sf-step>
 * </sf-steps>
 *
 * 状态由父级算好写到子级的 data-status 上，子级只管画 ——
 * 这样"第几步"只有一个真相源（父级的 current），子级不用各自推断。
 *
 * 连接线画在每一步内部（点后面的那段），最后一步隐藏，
 * 比在父级用 ::slotted(x)::before 去画靠谱（那个语法根本链不起来）。
 * 只做横向：竖向要换一套结构，等真需要再说。
 */

const stepTemplate = document.createElement('template');

stepTemplate.innerHTML = `
  <style>
    /* 用 column flex 而不是 grid：grid 的单列 auto 轨道不会铺满，
       连接线（flex:1）就撑不满两步之间的空隙 */
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 8px;
      min-width: 0;
      font-family: var(--sf-font-sans);
    }

    .head { display: flex; align-items: center; gap: var(--sf-space-2); }

    .dot {
      flex: none;
      display: grid;
      place-items: center;
      box-sizing: border-box;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: var(--sf-border-width) solid var(--sf-color-border-strong);
      background: var(--sf-color-surface);
      color: var(--sf-color-text-muted);
      font-size: 11px;
      font-weight: var(--sf-font-weight-medium);
      font-variant-numeric: tabular-nums;
    }

    .line {
      flex: 1;
      height: var(--sf-border-width);
      background: var(--sf-color-border);
    }
    :host(:last-of-type) .line { display: none; }

    .check { display: none; width: 12px; height: 12px; }

    .body { display: grid; gap: 2px; min-width: 0; }
    .title {
      font-size: var(--sf-font-size-sm);
      font-weight: var(--sf-font-weight-medium);
      color: var(--sf-color-text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .desc {
      font-size: var(--sf-font-size-xs);
      color: var(--sf-color-text-subtle);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    :host(:not([description])) .desc { display: none; }

    /* 已完成 */
    :host([data-status="done"]) .dot {
      background: var(--sf-color-accent);
      border-color: var(--sf-color-accent);
      color: var(--sf-color-on-accent);
    }
    :host([data-status="done"]) .num { display: none; }
    :host([data-status="done"]) .check { display: block; }
    :host([data-status="done"]) .line { background: var(--sf-color-accent); }

    /* 当前 */
    :host([data-status="current"]) .dot {
      border-color: var(--sf-color-accent);
      color: var(--sf-color-accent);
      font-weight: var(--sf-font-weight-semibold);
    }
    :host([data-status="current"]) .title { color: var(--sf-color-text); }
  </style>

  <div class="head">
    <span class="dot" part="dot">
      <span class="num"></span>
      <svg class="check" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2 6.2l2.6 2.6L10 3.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
    <span class="line" part="line"></span>
  </div>
  <div class="body">
    <span class="title"></span>
    <span class="desc"></span>
  </div>
`;

class SfStep extends HTMLElement {
  static observedAttributes = ['title', 'description', 'number'];

  #title;
  #desc;
  #num;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(stepTemplate.content.cloneNode(true));
    this.#title = this.shadowRoot.querySelector('.title');
    this.#desc = this.shadowRoot.querySelector('.desc');
    this.#num = this.shadowRoot.querySelector('.num');
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  #render() {
    this.#title.textContent = this.getAttribute('title') || '';
    this.#desc.textContent = this.getAttribute('description') || '';
    this.#num.textContent = this.getAttribute('number') || '';
  }
}

if (!customElements.get('sf-step')) {
  customElements.define('sf-step', SfStep);
}

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: flex;
      /* 不留 gap：连接线画在每一步内部，gap 会在两步之间留个断口 */
      gap: 0;
      width: 100%;
    }
  </style>
  <slot></slot>
`;

class SfSteps extends HTMLElement {
  static observedAttributes = ['current'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.shadowRoot.querySelector('slot').addEventListener('slotchange', () => this.#sync());
    this.#sync();
  }

  attributeChangedCallback(name) {
    if (name === 'current') this.#sync();
  }

  get current() {
    return Number(this.getAttribute('current')) || 0;
  }

  set current(index) {
    this.setAttribute('current', String(index));
  }

  #sync() {
    const steps = [...this.querySelectorAll('sf-step')];
    // 不往上钳：current 等于长度时表示"全部完成"，此时没有 current 步
    const current = Math.max(this.current, 0);

    steps.forEach((step, index) => {
      step.setAttribute('number', String(index + 1));
      step.setAttribute('data-status', index < current ? 'done' : index === current ? 'current' : 'todo');
      if (index === current) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
  }
}

if (!customElements.get('sf-steps')) {
  customElements.define('sf-steps', SfSteps);
}

export { SfSteps, SfStep };
