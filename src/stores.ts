import { writable } from 'svelte/store';
import type { WasabeeMe } from './model';
import { opPromise } from './server';

function MeStore() {
  const { subscribe, set, update } = writable<WasabeeMe>(null);

  return {
    subscribe,
    set,
    update,
  };
}

function OpsStore() {
  const { subscribe, set, update } = writable<
    Record<'success' | 'pending' | 'failed', OpID[]>
  >({
    success: [],
    pending: [],
    failed: [],
  });

  return {
    subscribe,
    updateFromMe: (me: WasabeeMe) => {
      set({
        success: [],
        pending: me.Ops.map((o) => o.ID),
        failed: [],
      });
      if (me) {
        for (const op of me.Ops) {
          opPromise(op.ID)
            .then((op) => {
              update((ops) => ({
                success: ops.success.filter((o) => o !== op.ID).concat(op.ID),
                pending: ops.pending.filter((o) => o !== op.ID),
                failed: ops.failed,
              }));
            })
            .catch(() => {
              update((ops) => ({
                success: ops.success,
                pending: ops.pending.filter((o) => o !== op.ID),
                failed: [...ops.failed, op.ID],
              }));
            });
        }
      }
    },
    updateOp: (opID: string) => {
      update((ops) => ({
        success: ops.success.filter((o) => o !== opID).concat(opID),
        pending: ops.pending.filter((o) => o !== opID),
        failed: ops.failed.filter((o) => o !== opID),
      }));
    },
  };
}

export const opsStore = OpsStore();
