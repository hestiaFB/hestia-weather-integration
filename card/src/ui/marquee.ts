// A line that scrolls in a loop when it does not fit: the official vigilance is never cut by « … ».
// The element has no shadow of its own: the card's charter styles it (charter.ts, `.nw-alert`). It only measures
// and says whether the text overflows; the charter moves it, so the card's « still » and « offscreen » pause it too.

/** Speed of the scrolling, in pixels per second: slow enough to be read while it moves. */
const SPEED = 40;
/** Gap between the end of the text and its next round, in pixels (the same as `.run` padding in the charter). */
const GAP = 40;
/** Share of each round spent still, the start of the text in place (the keyframes of `nw-run` in the charter). */
const STILL = 0.2;

/** Defined only in a browser: the tests render templates in Node, where it is not needed. */
const Marquee = typeof HTMLElement === 'undefined' ? undefined : class HestiaWeatherMarquee extends HTMLElement {
  private observer?: ResizeObserver;

  public connectedCallback(): void {
    this.observer ??= new ResizeObserver(() => this.measure());
    this.observer.observe(this);
    const run = this.firstElementChild;
    if (run) this.observer.observe(run);
  }

  public disconnectedCallback(): void {
    this.observer?.disconnect();
  }

  private measure(): void {
    const run = this.firstElementChild as HTMLElement | null;
    if (!run || !this.clientWidth) return;
    const moving = this.hasAttribute('moving');
    const text = run.offsetWidth - (moving ? GAP : 0);
    // One pixel of tolerance: a text that just fits stays still.
    if (text <= this.clientWidth + 1) {
      if (moving) this.removeAttribute('moving');
      return;
    }
    const round = text + GAP;
    this.style.setProperty('--nw-run', `${round}px`);
    this.style.setProperty('--nw-run-time', `${(round / SPEED / (1 - STILL)).toFixed(1)}s`);
    if (!moving) this.setAttribute('moving', '');
  }
};

if (Marquee && !customElements.get('hestia-weather-marquee')) customElements.define('hestia-weather-marquee', Marquee);
