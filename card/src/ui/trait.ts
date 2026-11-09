import { css } from 'lit';

/** The « Trait » style (2 November, the same as Hestia Confort's cards): Manrope everywhere, large thin figures, tinted
 *  surfaces instead of lines, radii nested in the card's, short motion that stops out of view. The charter's colours do
 *  not change. Loaded after every other style of the card. */
export const traitStyles = css`
  /* The card, its panels, heads, labels, values and stats come from the shared charter (hestia-charte); here only what is Weather's. */
  ha-card { --nw-ease:cubic-bezier(.23,1,.32,1); }
  .mini-axis { font-size:var(--nw-fs-label); color:var(--nw-fg2); font-variant-numeric:tabular-nums; }

  /* « En ce moment »: a soft veil behind it, so leaves, rain and snow never cross the figures; no source pill (in its tooltip). */
  /* « En ce moment » in the charter's glass frame (3 November): readable over leaves, rain and clouds, without a shadow. */
  .nw-hero > .nw-now.nw-glass { padding:10px 12px 10px 14px; gap:4px; }
  /* Smaller on a phone, next to the title: the sky keeps its room. */
  @container (max-width:650px) { .nw-hero > .nw-now.nw-glass { padding:8px 10px 8px 12px; gap:2px; } }

  /* Large figures: thin and tight (Manrope 300, the variable font). */
  .nw-now .temp:not(.nw-temp) { font-weight:300; letter-spacing:-.05em; }
  .nw-tile strong { font-weight:650; }

  /* Motion: brief entrances without blur, nothing moves while the card is out of view. */
  @keyframes nw-rise { from { opacity:0; transform:translateY(6px); } }
  .nw-hero .nw-bulletin { animation-duration:.3s; }
  :host([offscreen]) *, :host([offscreen]) *::before, :host([offscreen]) *::after { animation-play-state:paused !important; }
  /* The same for the timeline and the radar, drawn in their own shadow: they read --nw-motion. */
  :host([offscreen]) { --nw-motion:paused; }
`;
