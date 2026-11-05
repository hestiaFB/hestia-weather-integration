// One subscription to the integration per place and language, shared by every Hestia Weather card of the page
// (docs/PLAN-OPTIMISATION.md, points 1 and 11). Eighteen cards of one place used to receive eighteen copies of each view.
import type { HassConnection } from './types';
import type { ChangesMessage, ViewMessage, WeatherView } from './view';

export type StreamMessage = ViewMessage | { version: number; reload: true };
export interface StreamError { code?: string; message?: string }
interface Listener { message: (m: StreamMessage) => void; error: (e: StreamError) => void }

interface Stream {
  listeners: Set<Listener>;
  /** The last view, given at once to a card that joins later. */
  last?: ViewMessage;
  stop?: Promise<() => Promise<void>>;
  /** A stream nobody listens to any more closes after a moment: a dashboard redrawing its cards keeps it. */
  closing?: ReturnType<typeof setTimeout>;
}

/** How long a stream without cards stays open. */
export const GRACE_MS = 5_000;
const streams = new WeakMap<HassConnection, Map<string, Stream>>();
/** Connections whose integration does not know `changes` (one older than the card): they get the whole view each time. */
const whole = new WeakSet<HassConnection>();

/** The parts of the new view equal to the last one are the last one's objects: a card whose parts did not change
 *  sees the same objects and need not redraw. */
export function keepUnchanged(view: WeatherView, last?: WeatherView): WeatherView {
  if (!last) return view;
  const kept: Record<string, unknown> = { ...view };
  for (const key of Object.keys(kept)) {
    const before = (last as unknown as Record<string, unknown>)[key];
    if (before !== undefined && JSON.stringify(before) === JSON.stringify(kept[key])) kept[key] = before;
  }
  return kept as unknown as WeatherView;
}

function close(connection: HassConnection, key: string, stream: Stream): void {
  if (streams.get(connection)?.get(key) === stream) streams.get(connection)!.delete(key);
  clearTimeout(stream.closing);
  void stream.stop?.then(stop => stop()).catch(() => { /* already closed */ });
}

/** Follows the view of a place (`entryId`, or the only place) in a language. Returns what stops following. */
export function follow(connection: HassConnection, entryId: string | undefined, language: string | undefined,
  message: Listener['message'], error: Listener['error']): () => void {
  const key = `${entryId ?? ''}|${language ?? ''}`;
  let byKey = streams.get(connection);
  if (!byKey) streams.set(connection, byKey = new Map());
  let stream = byKey.get(key);
  const listener: Listener = { message, error };
  if (!stream) {
    const created: Stream = { listeners: new Set() };
    stream = created;
    byKey.set(key, created);
    const changes = !whole.has(connection);
    created.stop = connection.subscribeMessage<StreamMessage | ChangesMessage>(m => {
      if ('reload' in m) {
        // The place restarts with new settings: each card follows it again a moment later.
        close(connection, key, created);
        for (const l of [...created.listeners]) l.message(m);
        return;
      }
      let view: WeatherView;
      if ('changes' in m) {
        // Only the parts that changed: the others stay the last view's very objects.
        if (!created.last) return;
        const merged: Record<string, unknown> = { ...created.last.view, ...m.changes };
        for (const key of m.removed ?? []) delete merged[key];
        view = merged as unknown as WeatherView;
      } else view = keepUnchanged(m.view, created.last?.view);
      const { changes: _, removed: __, ...head } = m as ChangesMessage;
      const shared: ViewMessage = { ...(head as Omit<ViewMessage, 'view'>), view };
      created.last = shared;
      for (const l of [...created.listeners]) l.message(shared);
    }, { type: 'hestia_weather/subscribe', language, ...(entryId ? { entry_id: entryId } : {}), ...(changes ? { changes: true } : {}) });
    created.stop.catch((e: StreamError) => {
      if (byKey!.get(key) === created) byKey!.delete(key);
      // An integration older than the card refuses `changes`: the cards ask again, for the whole view.
      if (changes && e?.code === 'invalid_format') whole.add(connection);
      for (const l of [...created.listeners]) l.error(e);
    });
  } else {
    clearTimeout(stream.closing); stream.closing = undefined;
    const last = stream.last;
    if (last) queueMicrotask(() => { if (stream!.listeners.has(listener)) message(last); });
  }
  const joined = stream;
  joined.listeners.add(listener);
  return () => {
    if (!joined.listeners.delete(listener) || joined.listeners.size) return;
    clearTimeout(joined.closing);
    joined.closing = setTimeout(() => { if (!joined.listeners.size) close(connection, key, joined); }, GRACE_MS);
  };
}
