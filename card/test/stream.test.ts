import { afterEach, describe, expect, it, vi } from 'vitest';
import { follow, GRACE_MS, keepUnchanged, type StreamMessage } from '../src/stream';
import type { HassConnection } from '../src/types';
import type { WeatherView } from '../src/view';

/** A connection that counts its subscriptions and lets the test send the integration's messages. */
function connection() {
  const sends: ((m: StreamMessage) => void)[] = [];
  let stops = 0;
  const conn = {
    subscribeMessage: vi.fn(async (callback: (m: StreamMessage) => void) => { sends.push(callback); return async () => { stops++; }; }),
  } as unknown as HassConnection & { subscribeMessage: ReturnType<typeof vi.fn> };
  return { conn, send: (m: StreamMessage) => sends.forEach(s => s(m)), stops: () => stops };
}
const message = (view: Record<string, unknown>) => ({ version: 1, integration: 'x', entryId: 'e', title: 'Gardanne', view: view as unknown as WeatherView });
const flush = () => new Promise(r => setTimeout(r, 0));

afterEach(() => { vi.useRealTimers(); });

describe('one subscription shared by the cards of a page', () => {
  it('subscribes once for every card of a place and language, and gives each the same view', async () => {
    const { conn, send } = connection();
    const seen: unknown[][] = [[], [], []];
    for (const list of seen) follow(conn, 'e', 'fr', m => list.push(m), () => {});
    send(message({ wind: { now: 1 } }));
    expect(conn.subscribeMessage).toHaveBeenCalledTimes(1);
    expect(seen.map(l => l.length)).toEqual([1, 1, 1]);
    expect(seen[0][0]).toBe(seen[2][0]);
    follow(conn, 'e', 'en', () => {}, () => {});
    expect(conn.subscribeMessage).toHaveBeenCalledTimes(2);
  });

  it('gives a card that joins later the last view at once', async () => {
    const { conn, send } = connection();
    follow(conn, 'e', 'fr', () => {}, () => {});
    send(message({ wind: { now: 1 } }));
    const late: unknown[] = [];
    follow(conn, 'e', 'fr', m => late.push(m), () => {});
    await flush();
    expect(late).toHaveLength(1);
  });

  it('keeps the unchanged parts as the same objects', () => {
    const before = { wind: { now: 1 }, air: { today: [1] } } as unknown as WeatherView;
    const after = keepUnchanged({ wind: { now: 2 }, air: { today: [1] } } as unknown as WeatherView, before);
    expect(after.air).toBe(before.air);
    expect(after.wind).not.toBe(before.wind);
  });

  it('closes a moment after the last card leaves, not while a dashboard redraws its cards', async () => {
    vi.useFakeTimers();
    const { conn, stops } = connection();
    const leave = follow(conn, 'e', 'fr', () => {}, () => {});
    leave();
    follow(conn, 'e', 'fr', () => {}, () => {})();
    await vi.advanceTimersByTimeAsync(GRACE_MS - 1);
    expect(stops()).toBe(0);
    await vi.advanceTimersByTimeAsync(2);
    expect(stops()).toBe(1);
    expect(conn.subscribeMessage).toHaveBeenCalledTimes(1);
  });

  it('closes on « reload » so that each card follows the place again', async () => {
    const { conn, send, stops } = connection();
    const seen: StreamMessage[] = [];
    follow(conn, 'e', 'fr', m => seen.push(m), () => {});
    send({ version: 1, reload: true });
    await flush();
    expect(seen).toEqual([{ version: 1, reload: true }]);
    expect(stops()).toBe(1);
    follow(conn, 'e', 'fr', () => {}, () => {});
    expect(conn.subscribeMessage).toHaveBeenCalledTimes(2);
  });

  it('asks for the changes only, and pastes them on the last view', async () => {
    const { conn, send } = connection();
    const seen: StreamMessage[] = [];
    follow(conn, 'e', 'fr', m => seen.push(m), () => {});
    expect(conn.subscribeMessage.mock.calls[0][1]).toMatchObject({ changes: true });
    const air = { today: [1] };
    send(message({ wind: { now: 1 }, air, lightning: { step: 0 } }));
    send({ version: 1, integration: 'x', entryId: 'e', title: 'Gardanne', changes: { wind: { now: 2 } }, removed: ['lightning'] } as unknown as StreamMessage);
    const last = seen[1] as unknown as { view: Record<string, unknown> };
    expect(last.view).toEqual({ wind: { now: 2 }, air: { today: [1] } });
    expect(last.view.air).toBe(air);
    expect('changes' in last).toBe(false);
  });

  it('asks for the whole view again from an integration that does not know the changes', async () => {
    const calls: Record<string, unknown>[] = [];
    const conn = { subscribeMessage: vi.fn((_: unknown, m: Record<string, unknown>) => { calls.push(m);
      return m.changes ? Promise.reject({ code: 'invalid_format' }) : Promise.resolve(async () => {}); }) } as unknown as HassConnection;
    follow(conn, 'e', 'fr', () => {}, () => {});
    await flush();
    follow(conn, 'e', 'fr', () => {}, () => {});
    expect(calls.map(c => c.changes)).toEqual([true, undefined]);
  });

  it('tells every card when the integration refuses', async () => {
    const conn = { subscribeMessage: vi.fn(() => Promise.reject({ code: 'not_found' })) } as unknown as HassConnection;
    const errors: unknown[] = [];
    follow(conn, 'x', 'fr', () => {}, e => errors.push(e));
    follow(conn, 'x', 'fr', () => {}, e => errors.push(e));
    await flush();
    expect(errors).toEqual([{ code: 'not_found' }, { code: 'not_found' }]);
  });
});
