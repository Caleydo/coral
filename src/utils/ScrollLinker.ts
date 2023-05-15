export class ScrollLinker {
  isSyncingScrollA: boolean;

  isSyncingScrollB: boolean;

  constructor(private divA: HTMLDivElement, private divB: HTMLDivElement, private enabled = true) {
    divA.addEventListener('scroll', (e) => this.handleScrollA(e));
    divB.addEventListener('scroll', (e) => this.handleScrollB(e));
  }

  private handleScrollA(e: Event) {
    if (!this.isSyncingScrollA && this.enabled) {
      this.isSyncingScrollB = true;
      this.divB.scrollTop = (e.target as HTMLDivElement).scrollTop;
    }
    this.isSyncingScrollA = false;
  }

  private handleScrollB(e: Event) {
    if (!this.isSyncingScrollB && this.enabled) {
      this.isSyncingScrollA = true;
      this.divA.scrollTop = (e.target as HTMLDivElement).scrollTop;
    }
    this.isSyncingScrollB = false;
  }

  public enable() {
    this.enabled = true;
    this.divB.scrollTop = this.divA.scrollTop; // sync position
  }

  public disable() {
    this.enabled = false;
  }

  public destroy() {
    this.divA.removeEventListener('scroll', (e) => this.handleScrollA(e));
    this.divA.removeEventListener('scroll', (e) => this.handleScrollA(e));
    this.divB.addEventListener('scroll', (e) => this.handleScrollB(e));
  }
}
