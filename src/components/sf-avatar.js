/**
 * <sf-avatar src="…" name="张三" size="lg" shape="square">
 *
 * 只有两条路径：有 src 显示图片，图挂了或者没 src 就退回首字母/汉字。
 * 不做 slot —— 要放图标的话用 div 更直接，硬塞进来会让"名字缩写"这条逻辑含糊。
 */

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      --sf-avatar-size: 32px;
      --sf-avatar-bg: var(--sf-color-accent-subtle);
      --sf-avatar-fg: var(--sf-color-accent);

      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
      box-sizing: border-box;
      width: var(--sf-avatar-size);
      height: var(--sf-avatar-size);
      border-radius: 50%;
      overflow: hidden;
      background: var(--sf-avatar-bg);
      color: var(--sf-avatar-fg);
      font-family: var(--sf-font-sans);
      font-size: calc(var(--sf-avatar-size) * 0.4);
      font-weight: var(--sf-font-weight-medium);
      line-height: 1;
      user-select: none;
      vertical-align: middle;
    }

    /* 有图时把底色让出来，不然图边缘会透出一圈蓝 */
    :host([data-image]) { background: var(--sf-color-surface-sunken); }

    :host([size="sm"]) { --sf-avatar-size: 24px; }
    :host([size="lg"]) { --sf-avatar-size: 40px; }
    :host([shape="square"]) { border-radius: var(--sf-radius-md); }

    img { width: 100%; height: 100%; object-fit: cover; display: block; }
    img[hidden] { display: none; }

    .initials { display: none; }
    :host(:not([data-image])) .initials { display: block; }
  </style>
  <img part="image" alt="" hidden>
  <span class="initials" part="initials" aria-hidden="true"></span>
`;

/**
 * 张三 → 张三；Ada Lovelace → AL；Zhang → ZH
 * 24px 的圆里塞两个汉字会挤成一团，所以小号只取一个字。
 */
function toInitials(name, maxChars = 2) {
  const text = (name || '').trim();
  if (!text) return '';
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 1 && maxChars > 1) return (words[0][0] + words[1][0]).toUpperCase();
  if (/[\u4e00-\u9fa5]/.test(text)) return text.length > maxChars ? text.slice(-maxChars) : text;
  return text.slice(0, maxChars).toUpperCase();
}

class SfAvatar extends HTMLElement {
  static observedAttributes = ['src', 'name', 'alt'];

  #img;
  #initials;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
    this.#img = this.shadowRoot.querySelector('img');
    this.#initials = this.shadowRoot.querySelector('.initials');
    this.#img.addEventListener('error', () => this.#showInitials());
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  #render() {
    const src = this.getAttribute('src');
    const name = this.getAttribute('name') || '';
    this.#img.alt = this.getAttribute('alt') ?? name;
    this.#initials.textContent = toInitials(name, this.getAttribute('size') === 'sm' ? 1 : 2);

    if (!src) {
      this.#showInitials();
      return;
    }
    this.#img.src = src;
    this.#img.hidden = false;
    this.toggleAttribute('data-image', true);
  }

  #showInitials() {
    this.#img.hidden = true;
    this.#img.removeAttribute('src');
    this.toggleAttribute('data-image', false);
  }
}

if (!customElements.get('sf-avatar')) {
  customElements.define('sf-avatar', SfAvatar);
}

export { SfAvatar, toInitials };
