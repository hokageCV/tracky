// src/domUtility.ts
export class DomUtility {
  private elements: NodeListOf<HTMLElement>;

  constructor(selector: string) {
    this.elements = document.querySelectorAll(selector);
  }

  addClass(className: string): this {
    this.elements.forEach((el) => el.classList.add(className));
    return this;
  }

  removeClass(className: string): this {
    this.elements.forEach((el) => el.classList.remove(className));
    return this;
  }

  on(event: string, handler: (event: Event) => void): this {
    this.elements.forEach((el) => el.addEventListener(event, handler));
    return this;
  }
}

export const $ = (selector: string): DomUtility => {
  return new DomUtility(selector);
};
