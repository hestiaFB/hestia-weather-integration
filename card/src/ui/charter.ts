import { css, unsafeCSS } from 'lit';
import charte from './hestia-charte';

/** The pieces of the charter shared by every Hestia-FB card (hestia-ecosysteme/charte, copied by copier.sh): the « i », the glass frame,
 *  the value's dot, the scale drawn as the timeline. Without the charter's tokens: Weather keeps its own (same values), and a part
 *  drawn over the hero keeps the dark sky's colours. Loaded before Weather's own pieces. */
export const shared = unsafeCSS(charte.replace(/:host \{[\s\S]*?\n\}\n/, ''));

/**
 * THE CHARTER: the only place where the card's look is decided.
 * Every view is built from these tokens and pieces; changing one here changes it in the tile, the unfolded tile and the full card.
 *
 * Base colours (background, texts, accent) follow the Home Assistant theme. Meaning colours (rain, wind, heat…) belong to the card,
 * so their meaning never changes from one theme to another, but a theme can still replace them with --hestia-rain-color, --hestia-level1-color…
 */
export const tokens = css`
  :host {
    /* Theme colours, with fallbacks for themes that leave them out. */
    --nw-fg: var(--primary-text-color, #212121);
    --nw-fg2: var(--secondary-text-color, #727272);
    --nw-bg: var(--ha-card-background, var(--card-background-color, #fff));
    --nw-accent: var(--primary-color, #03a9f4);

    /* Outlines and radii: one radius for every box (tiles, bubbles, panels), one for pills. */
    --nw-line: color-mix(in srgb, var(--nw-fg) 13%, transparent);
    --nw-line-soft: color-mix(in srgb, var(--nw-fg) 8%, transparent);
    --nw-radius-card: var(--ha-card-border-radius, 12px);
    --nw-radius: 14px;
    --nw-radius-pill: 999px;

    /* Glass over the sky: the brief bubble and the timeline's labels. */
    --nw-glass-strong: color-mix(in srgb, var(--nw-bg) 84%, transparent);
    --nw-blur: blur(6px) saturate(1.2);
    /* Frosted glass of the banner's timeline: clearer, so the animated sky shows through, and blurred more to stay readable. */
    --nw-glass-clear: color-mix(in srgb, var(--nw-bg) 45%, transparent);
    --nw-frost: blur(14px) saturate(1.6);

    /* Spacing */
    --nw-pad-bubble: 6px 14px 7px 10px;
    --nw-pad-panel: 18px 20px;

    /* Type scale: six sizes for the whole card, nothing else.
       label 10 (small capitals) · small 12 · text 13 · title 17 · value 30 · temperature 42 */
    --nw-fs-label: 11px; --nw-fs-small: 12px; --nw-fs-text: 14px; --nw-fs-title: 17px; --nw-fs-case: 21px; --nw-fs-value: 34px; --nw-fs-temp: 58px;
    --nw-label-spacing: .6px;

    /* Meaning colours, « Aube » palette: OKLCH, same lightness and chroma, only the hue changes, so they always match.
       Pastel for surfaces; text in these colours uses the ink mix below, darker on light themes, lighter on dark ones. */
    --nw-rain: var(--hestia-rain-color, oklch(.8 .07 190));
    --nw-wind: var(--hestia-wind-color, oklch(.79 .075 280));
    --nw-heat: var(--hestia-heat-color, oklch(.83 .085 42));
    --nw-cold: var(--hestia-cold-color, oklch(.85 .05 220));
    --nw-calm: var(--hestia-calm-color, oklch(.83 .075 150));
    --nw-pressure: var(--hestia-pressure-color, oklch(.78 .07 315));
    --nw-level1: var(--hestia-level1-color, oklch(.88 .1 96));
    --nw-level2: var(--hestia-level2-color, oklch(.81 .105 64));
    --nw-level3: var(--hestia-level3-color, oklch(.74 .115 18));
    /* How much of the meaning colour goes into a coloured text: 34 % keeps even the light yellow readable (contrast 4.5:1) on its tinted pill. */
    --nw-ink: 34%;

    /* Motion */
    --nw-ease: cubic-bezier(.2, .8, .2, 1);
    --nw-expand: .45s;
  }
`;

/** The pieces every view is made of. */
export const pieces = css`
  ha-icon { display:flex; line-height:0; }
  button { font:inherit; color:inherit; }
  [data-entity] { cursor:pointer; }
  [data-entity]:focus-visible, button:focus-visible { outline:2px solid var(--nw-accent); outline-offset:2px; }
  .sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }


  /* Coloured text, always readable: the meaning colour mixed into the text colour. */
  .nw-ink { font-size:var(--nw-fs-small); font-weight:600; color:color-mix(in oklab, var(--c) var(--nw-ink), var(--nw-fg)); }

  /* The day's bulletin: medium weight, never bold. Home Assistant's Roboto comes in 400, 500 and 700: a 600 shows as bold. */
  .nw-bulletin { margin:0; font-size:var(--nw-fs-text); font-weight:500; line-height:1.5; max-width:62ch; }

  /* Source pill: one rule for the whole card. Same shape as the info pill, only the tint differs. */
  .nw-badge { display:inline-flex; align-items:center; font-size:var(--nw-fs-small); line-height:18px; font-weight:500; white-space:nowrap;
    padding:3px 10px; border-radius:var(--nw-radius-pill); border:1px solid var(--nw-line); background:color-mix(in srgb, var(--nw-bg) 70%, transparent); color:var(--nw-fg);
    max-width:100%; overflow:hidden; text-overflow:ellipsis; box-sizing:border-box; }
  /* Info pill: tinted background, icon and text in the colour, value in bold. */
  .nw-chip { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:var(--nw-radius-pill); font-size:var(--nw-fs-small); line-height:18px; font-weight:600;
    white-space:nowrap; border:1px solid transparent; background:color-mix(in oklab, var(--c) 24%, transparent); color:color-mix(in oklab, var(--c) var(--nw-ink), var(--nw-fg)); }
  .nw-chip ha-icon { --mdc-icon-size:14px; } .nw-chip b { font-weight:700; }
  .nw-chips { display:flex; flex-wrap:wrap; gap:8px; }

  /* « En ce moment »: condition, temperature, source, with a halo that keeps them readable on any sky. */
  .nw-now { display:flex; flex-direction:column; align-items:flex-end; text-align:right; gap:2px; }
  /* The tile's figures over the sky keep a soft halo; the banner's sit in the charter's glass frame, without it. */
  .nw-now:not(.nw-glass) { text-shadow:0 0 14px var(--nw-bg), 0 0 5px var(--nw-bg), 0 0 2px var(--nw-bg); }
  .nw-now .nw-label { color:color-mix(in srgb, var(--nw-fg) 75%, transparent); }
  .nw-now :is(.nw-chip, .nw-badge) { text-shadow:none; color:var(--nw-fg); background:color-mix(in srgb, var(--nw-bg) 86%, transparent); border-color:var(--nw-line); backdrop-filter:var(--nw-blur); }
  .nw-now .nw-chip ha-icon { color:color-mix(in oklab, var(--c) 70%, var(--nw-fg)); }
  .nw-now .cond { display:flex; align-items:center; gap:6px; font-weight:650; font-size:var(--nw-fs-text); }
  .nw-now .cond ha-icon { --mdc-icon-size:17px; }
  /* The tile's temperature; the full card's is the charter's .nw-temp. */
  .nw-now .temp:not(.nw-temp) { font-size:var(--nw-fs-value); font-weight:700; letter-spacing:-1px; line-height:1.05; white-space:nowrap; }
  .nw-now .temp small { font-size:var(--nw-fs-text); font-weight:400; vertical-align:super; margin-left:2px; letter-spacing:0; }
  /* Today's low and high: a quiet line under the temperature. */
  .nw-now .range { display:flex; gap:10px; font-size:var(--nw-fs-small); font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap;
    color:color-mix(in srgb, currentColor 82%, transparent); }
  /* Storm and downpour clouds stay dark whatever the theme: the text on them turns white, the pills keep the theme. */
  .dark-sky .nw-now:not(.nw-glass) { color:#fff; text-shadow:0 1px 5px #0b1a2b99; }
  .dark-sky .nw-now:not(.nw-glass) .nw-label { color:rgba(255,255,255,.88); }

  .nw-sub { margin:-8px 0 0; font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .nw-empty { margin:0; padding:14px 0; text-align:center; font-size:var(--nw-fs-small); color:var(--nw-fg2); }

  /* Legend: always centred under its chart. */
  .nw-legend { display:flex; justify-content:center; flex-wrap:wrap; gap:6px 16px; font-size:var(--nw-fs-small); color:var(--nw-fg2); margin-top:auto; }
  .nw-legend span { display:inline-flex; align-items:center; gap:6px; }
  .nw-legend i { width:14px; height:4px; border-radius:2px; background:var(--c); }
  .nw-legend i.sq { width:10px; height:10px; border-radius:3px; }
  .nw-legend i.dash { background:repeating-linear-gradient(90deg, color-mix(in oklab, var(--c) 60%, transparent) 0 3px, transparent 3px 5px); }

  /* A panel's look is the charter's (.nw-panel); its parts one under the other, 14 px apart. */
  .nw-panel { display:flex; flex-direction:column; gap:14px; }
  /* Main value of a panel: the figure is the charter's .nw-value; here its row and caption. Panels, heads, labels, stats: the shared charter. */
  .metric-row { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px 14px; }
  .metric { display:flex; flex-direction:column; gap:4px; min-width:0; border:0; background:none; padding:0; text-align:left; }
  .metric small { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .metric small b { color:var(--nw-fg); }

  /* Small history chart: the same frame for rain, wind and pressure. */
  .mini { display:flex; flex-direction:column; gap:4px; }
  .mini-top { font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .mini-plot { position:relative; height:52px; margin:16px 0 14px; }
  .mini-plot svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
  .mini-axis { display:flex; justify-content:space-between; }
  /* A value posed on a chart: above its point, below it when the point touches the top. */
  .pill { position:absolute; transform:translate(-50%, -130%); font-size:var(--nw-fs-small); font-weight:700; padding:2px 8px; border-radius:var(--nw-radius-pill);
    background:var(--nw-bg); border:1px solid var(--nw-line); box-shadow:0 2px 6px #0001; white-space:nowrap; }
  .pill.low { transform:translate(-50%, 40%); }

  /* Folding details at the bottom of a panel. */
  .nw-details { font-size:var(--nw-fs-small); color:var(--nw-fg2); border-top:1px solid var(--nw-line-soft); padding-top:10px; margin-top:auto; }
  .nw-details summary { cursor:pointer; list-style:none; display:flex; align-items:center; gap:6px; font-weight:600; }
  .nw-details summary::-webkit-details-marker { display:none; }
  .nw-details summary ha-icon { --mdc-icon-size:16px; transition:transform .2s; }
  .nw-details[open] summary ha-icon { transform:rotate(90deg); }
  .nw-details ul { margin:8px 0 0; padding:0; list-style:none; display:grid; gap:6px; }
  .nw-details li { display:flex; justify-content:space-between; gap:12px; font-size:var(--nw-fs-text); color:var(--nw-fg); }
  .nw-details li b { text-align:right; }
  .nw-details p { margin:8px 0 0; }

  /* The « i » button comes from the shared charter (hestia-charte); its explanation bubble: one sentence, then an example. */
  .nw-pop { position:fixed; inset:auto; margin:0; width:min(320px, calc(100vw - 24px)); max-height:min(70vh, 480px); overflow:auto; box-sizing:border-box;
    padding:12px 14px; border-radius:var(--nw-radius); border:1px solid var(--nw-line); background:var(--nw-bg); color:var(--nw-fg);
    box-shadow:0 12px 32px #0b1a2b26; font-size:var(--nw-fs-text); line-height:1.45; font-weight:400;
    white-space:normal; text-align:left; letter-spacing:0; text-transform:none; text-shadow:none; }
  .nw-pop > b { display:block; margin-bottom:4px; }
  .nw-pop .ex { margin-top:8px; padding-top:8px; border-top:1px solid var(--nw-line); font-size:var(--nw-fs-small); color:var(--nw-fg2); }
  .nw-pop .ex::before { content:var(--nw-example-word, 'Exemple'); display:block; font-size:var(--nw-fs-label); font-weight:700; letter-spacing:var(--nw-label-spacing); text-transform:uppercase; margin-bottom:2px; }
  .nw-pop a { color:var(--nw-accent); }
`;

/** The bubble: icon over two lines, label above the text. Same shape for the brief and the alerts. Shared with the ticker. */
export const bubbles = css`
  .nw-bubble { display:inline-grid; grid-template-columns:auto minmax(0,1fr); column-gap:10px; align-items:center; max-width:100%; box-sizing:border-box; margin:0;
    padding:var(--nw-pad-bubble); border-radius:var(--nw-radius); background:var(--nw-glass-strong); border:1px solid var(--nw-line); backdrop-filter:var(--nw-blur);
    color:var(--nw-fg); transition:opacity .35s, transform .35s; }
  .nw-bubble ha-icon { --mdc-icon-size:18px; display:flex; line-height:0; grid-row:1/3; color:var(--nw-fg2); }
  /* A touch of colour: only the icon takes the colour of the bubble's theme. */
  .nw-bubble[data-theme] ha-icon { color:color-mix(in oklab, var(--c) 70%, var(--nw-fg)); }
  .nw-bubble .nw-label { grid-column:2; font-size:var(--nw-fs-label); line-height:13px; font-weight:700; letter-spacing:var(--nw-label-spacing); text-transform:uppercase; color:var(--nw-fg2); white-space:nowrap; }
  .nw-bubble b { grid-column:2; font-size:var(--nw-fs-text); line-height:16px; font-weight:500; min-width:0; }
  .nw-bubble.out { opacity:0; transform:translateY(-5px); }
  /* Alert: the same bubble, tinted by its level, with a breathing halo (a fixed shadow whose opacity pulses: no repaint). */
  .nw-bubble--alert { --al:var(--nw-level1); position:relative; border-color:color-mix(in oklab, var(--al) 60%, transparent);
    background:linear-gradient(100deg, color-mix(in oklab, var(--nw-bg) 72%, var(--al)), color-mix(in oklab, var(--nw-bg) 90%, var(--al)));
    box-shadow:0 0 6px 0 color-mix(in oklab, var(--al) 32%, transparent), 0 4px 18px -10px color-mix(in oklab, var(--al) 65%, transparent); }
  .nw-bubble--alert::after { content:''; position:absolute; inset:-1px; border-radius:inherit; box-shadow:0 0 16px 2px color-mix(in oklab, var(--al) 55%, transparent);
    opacity:0; animation:nw-glow 5.2s ease-in-out infinite; animation-play-state:var(--nw-motion, running); pointer-events:none; }
  .nw-bubble--alert ha-icon { color:color-mix(in oklab, var(--al) 70%, var(--nw-fg)); }
  .nw-bubble--alert .nw-label { color:color-mix(in oklab, var(--al) var(--nw-ink), var(--nw-fg)); }
  /* Official vigilance in the banner: a compact pill, its icon in a disc of the level's colour, the same outline and halo as the alert bubble. */
  .nw-alert { --al:var(--nw-level1); position:relative; display:flex; align-items:center; gap:8px; width:100%; max-width:100%; box-sizing:border-box; margin:0;
    padding:3px 14px 3px 3px; border-radius:var(--nw-radius-pill); font-size:var(--nw-fs-text); line-height:18px; color:var(--nw-fg);
    background:color-mix(in srgb, var(--al) 30%, color-mix(in srgb, var(--nw-bg) 55%, transparent)); border:1px solid color-mix(in oklab, var(--al) 60%, transparent);
    backdrop-filter:var(--nw-blur); box-shadow:0 0 6px 0 color-mix(in oklab, var(--al) 32%, transparent), 0 4px 18px -10px color-mix(in oklab, var(--al) 65%, transparent); }
  .nw-alert::after { content:''; position:absolute; inset:-1px; border-radius:inherit; box-shadow:0 0 16px 2px color-mix(in oklab, var(--al) 55%, transparent);
    opacity:0; animation:nw-glow 5.2s ease-in-out infinite; animation-play-state:var(--nw-motion, running); pointer-events:none; }
  .nw-alert .dot { display:grid; place-items:center; width:24px; height:24px; flex:none; border-radius:50%; background:var(--al); color:#2b2620; }
  .nw-alert .dot ha-icon { --mdc-icon-size:14px; display:flex; line-height:0; }
  /* Its words keep one line: when they do not fit they scroll (ui/marquee.ts). */
  .nw-alert hestia-weather-marquee { flex:1; }
  .nw-alert b { font-weight:650; }
  /* The level's colour, after the pieces that set the yellow of level 1. */
  .nw-level2 { --al:var(--nw-level2); } .nw-level3 { --al:var(--nw-level3); }
  @keyframes nw-glow { 50% { opacity:1; } }
  @media (prefers-reduced-motion:reduce) { .nw-bubble { transition:none; } .nw-bubble--alert::after, .nw-alert::after { animation:none; } }
`;
