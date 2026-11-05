// A line that scrolls in a loop when it does not fit: a sentence of the card is never cut by « … ».
// The element has no shadow of its own: `marqueeStyles` below, loaded by each shadow that shows one, moves it, so the card's
// « still » and « offscreen » pause it too. The element only measures and says whether the text overflows.
// Used by the vigilance pill, the alert bubble and the points of « Événements » (ticker.ts, frise.ts), through `scrolling()` in parts.ts.
import { css } from 'lit';

/** Speed of the scrolling, in pixels per second: slow enough to be read while it moves. */
const SPEED = 40;
/** Gap between the end of the text and its next round, in pixels (the same as `.run` padding below). */
const GAP = 40;
/** Share of each round spent still, the start of the text in place (the keyframes of `nw-run` below). */
const STILL = 0.2;

/** Sent (bubbling, within the shadow) when a line starts or stops scrolling: `detail` is the length of one round in ms, 0 when still. */
export const MARQUEE_EVENT = 'nw-marquee';

/** The length of one round of a line in ms, 0 when it does not scroll. */
export const roundOf = (el: Element | null | undefined): number => (el as { round?: number } | null | undefined)?.round ?? 0;

/** Defined only in a browser: the tests render templates in Node, where it is not needed. */
const Marquee = typeof HTMLElement === 'undefined' ? undefined : class HestiaWeatherMarquee extends HTMLElement {
  private observer?: ResizeObserver;
  /** One round in ms, 0 when the line fits. */
  public round = 0;

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
      if (moving) { this.removeAttribute('moving'); this.tell(0); }
      return;
    }
    const roundPx = text + GAP, seconds = Math.round(roundPx / SPEED / (1 - STILL) * 10) / 10;
    this.style.setProperty('--nw-run', `${roundPx}px`);
    this.style.setProperty('--nw-run-time', `${seconds}s`);
    if (!moving) this.setAttribute('moving', '');
    if (seconds * 1000 !== this.round) this.tell(seconds * 1000);
  }

  private tell(round: number): void {
    this.round = round;
    this.dispatchEvent(new CustomEvent(MARQUEE_EVENT, { bubbles: true, detail: round }));
  }
};

if (Marquee && !customElements.get('hestia-weather-marquee')) customElements.define('hestia-weather-marquee', Marquee);

/** The scrolling line, for every shadow that shows one. Still at the start of each round, faded at the edges, paused under the pointer;
 *  the second copy follows the first only while it moves. Without motion, the line never scrolls: it takes two lines at most. */
export const marqueeStyles = css`
  hestia-weather-marquee { display:block; min-width:0; overflow:hidden; white-space:nowrap; }
  hestia-weather-marquee .run { display:inline-block; }
  hestia-weather-marquee .run + .run { display:none; }
  hestia-weather-marquee[moving] { mask-image:linear-gradient(90deg, transparent, #000 6px, #000 calc(100% - 18px), transparent); }
  hestia-weather-marquee[moving] .run { padding-right:${GAP}px; animation:nw-run var(--nw-run-time, 12s) linear infinite; animation-play-state:var(--nw-motion, running); }
  hestia-weather-marquee[moving] .run + .run { display:inline-block; }
  @media (hover:hover) { :hover > hestia-weather-marquee[moving] .run { animation-play-state:paused; } }
  @keyframes nw-run { 0%, ${STILL * 100}% { transform:translateX(0); } 100% { transform:translateX(calc(-1 * var(--nw-run, 0px))); } }
  @media (prefers-reduced-motion:reduce) {
    hestia-weather-marquee, hestia-weather-marquee[moving] { display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; white-space:normal; mask-image:none; }
    hestia-weather-marquee .run, hestia-weather-marquee[moving] .run { display:inline; padding:0; animation:none; }
    hestia-weather-marquee .run + .run, hestia-weather-marquee[moving] .run + .run { display:none; } }
`;
