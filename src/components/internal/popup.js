import { place, isOutside } from './floating.js';

/**
 * 浮层的开/关状态机。
 *
 * 到表单这批，popover / dropdown / select / multiselect 四个组件都要同一套东西：
 * 点锚点切换、点外面关、Esc 关并把焦点还回去、滚动/缩放时重定位、aria-expanded 同步。
 * 复制四遍就是 150 行同样的代码，所以抽出来。tooltip 不进来 —— 它是 hover 触发、
 * 不抢焦点、不响应外部点击，语义不同。
 *
 * 约定：开合状态落在 host 的 [open] 属性上，CSS 用 :host([open]) 控制显隐，
 * 这样组件不需要在 JS 里动 style。
 */
export class Popup {
  /**
   * @param {HTMLElement} host      承载 [open] 属性和事件的元素
   * @param {object} options
   * @param {Element} [options.floating]  真正浮起来的元素，默认就是 host
   * @param {string}  [options.placement]
   * @param {number}  [options.gap]
   * @param {boolean} [options.manual]    不绑锚点点击
   * @param {string}  [options.haspopup]  aria-haspopup 的值
   * @param {(e:{focusFirst:boolean})=>void} [options.onOpen]
   * @param {()=>void} [options.onClose]
   */
  constructor(host, options = {}) {
    this.host = host;
    this.floating = options.floating || host;
    this.placement = options.placement || 'bottom-start';
    this.gap = options.gap ?? 6;
    this.manual = options.manual ?? false;
    this.haspopup = options.haspopup || 'dialog';
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;
    this.anchor = null;
  }

  get isOpen() {
    return this.host.hasAttribute('open');
  }

  setAnchor(el) {
    if (this.anchor === el) return;
    this.#unbindAnchor();
    this.anchor = el || null;
    if (!this.anchor) return;
    // manual 不在这里判断：属性可能在绑定之后才被设置，放到点击时再读
    this.anchor.addEventListener('click', this.#onAnchorClick);
    this.anchor.setAttribute('aria-haspopup', this.haspopup);
    this.anchor.setAttribute('aria-expanded', String(this.isOpen));
  }

  open({ focusFirst = false } = {}) {
    if (this.isOpen || !this.anchor) return false;
    this.host.setAttribute('open', '');
    // 先让 CSS 把浮层显示出来，再量尺寸
    place(this.anchor, this.floating, { placement: this.placement, gap: this.gap });

    document.addEventListener('pointerdown', this.#onDocumentPointerDown, true);
    document.addEventListener('keydown', this.#onDocumentKeyDown, true);
    window.addEventListener('scroll', this.#onReflow, true);
    window.addEventListener('resize', this.#onReflow);

    this.anchor.setAttribute('aria-expanded', 'true');
    this.onOpen?.({ focusFirst });
    this.host.dispatchEvent(new CustomEvent('sf-open', { bubbles: true, composed: true }));
    return true;
  }

  close({ restoreFocus = false } = {}) {
    if (!this.isOpen) return;
    this.host.removeAttribute('open');
    this.#detachGlobal();
    this.anchor?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) this.anchor?.focus();
    this.onClose?.();
    this.host.dispatchEvent(new CustomEvent('sf-close', { bubbles: true, composed: true }));
  }

  toggle(options) {
    this.isOpen ? this.close() : this.open(options);
  }

  destroy() {
    this.close();
    this.#unbindAnchor();
  }

  #detachGlobal() {
    document.removeEventListener('pointerdown', this.#onDocumentPointerDown, true);
    document.removeEventListener('keydown', this.#onDocumentKeyDown, true);
    window.removeEventListener('scroll', this.#onReflow, true);
    window.removeEventListener('resize', this.#onReflow);
  }

  #unbindAnchor() {
    this.anchor?.removeEventListener('click', this.#onAnchorClick);
    this.anchor?.removeAttribute('aria-haspopup');
    this.anchor?.removeAttribute('aria-expanded');
  }

  #onAnchorClick = () => {
    if (this.manual) return;
    this.toggle();
  };

  #onDocumentPointerDown = (event) => {
    if (isOutside(event, [this.host, this.anchor])) this.close();
  };

  #onDocumentKeyDown = (event) => {
    if (event.key !== 'Escape' || !this.isOpen) return;
    event.stopPropagation();
    this.close({ restoreFocus: true });
  };

  #onReflow = () => {
    if (this.isOpen && this.anchor) {
      place(this.anchor, this.floating, { placement: this.placement, gap: this.gap });
    }
  };
}
