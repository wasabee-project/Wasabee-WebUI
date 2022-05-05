import { writable } from 'svelte/store';
import { WasabeeAgent, WasabeeMe, WasabeeOp, WasabeeTeam } from './model';
import { opPromise } from './server';

function AgentsStore() {
  const { subscribe, set, update } = writable<Record<GoogleID, WasabeeAgent>>(
    {}
  );

  return {
    subscribe,
    set,
    updateAgent(agent: WasabeeAgent) {
      update((r) => ({ ...r, [agent.id]: agent }));
    },
    reset: () => set({}),
  };
}

export const agentsStore = AgentsStore();

function TeamsStore() {
  const { subscribe, set, update } = writable<Record<TeamID, WasabeeTeam>>({});

  return {
    subscribe,
    set,
    updateTeam(team: WasabeeTeam) {
      update((r) => ({ ...r, [team.id]: team }));
    },
    reset: () => set({}),
  };
}

export const teamsStore = TeamsStore();

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
      if (me) {
        const loaded = me.Ops.map((o) => o.ID).filter((id) =>
          WasabeeOp.load(id)
        );
        set({
          success: loaded,
          pending: me.Ops.map((o) => o.ID).filter((id) => !loaded.includes(id)),
          failed: [],
        });
        for (const op of me.Ops) {
          opPromise(op.ID)
            .then((op) => {
              op.store();
              update((ops) => ({
                success: ops.success.filter((o) => o !== op.ID).concat(op.ID),
                pending: ops.pending.filter((o) => o !== op.ID),
                failed: ops.failed,
              }));
            })
            .catch(() => {
              update((ops) => ({
                success: ops.success.filter((o) => o !== op.ID),
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
