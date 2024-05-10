<script lang="ts">
  import { WasabeeMe, WasabeeOp } from '../model';
  import { deleteOpPromise } from '../server';

  import type { OpPermItem } from '../model/operation';

  import { loadMeAndOps } from '../sync';
  import { meStore, opsStore } from '../stores';

  let toDelete: OpID | null = null;
  let me: WasabeeMe;
  $: if ($meStore) me = $meStore; // shortcut

  if ($meStore) opsStore.updateFromMe($meStore);

  type Op = {
    ID: OpID;
    comment: string;
    own: boolean;
    name: string;
    teamlist: OpPermItem[];
  };
  let ops: Op[] = [];
  $: {
    const os: WasabeeOp[] = [];
    const lsk = new Set($opsStore.success);
    for (const id of lsk) {
      const op = WasabeeOp.load(id);
      if (!op || !op.ID) continue;
      os.push(op);
    }
    os.sort((a, b) => a.name.localeCompare(b.name));
    ops = os.map((op) => ({
      ID: op.ID,
      comment: op.comment,
      own: op.creator == me.id,
      name: op.name,
      teamlist: op.teamlist,
    }));
  }

  let teamMap: Map<TeamID, string> = new Map();
  $: {
    for (const t of me.Teams) {
      teamMap.set(t.ID, t.Name);
    }
    teamMap = teamMap;
  }

  async function refresh() {
    await loadMeAndOps();
  }

  function filterTeamsID(teams: OpPermItem[]) {
    return Array.from(
      new Set(teams.map((t) => t.teamid).filter((id) => teamMap.has(id)))
    );
  }
  function getTeamName(id: TeamID) {
    return teamMap.get(id);
  }
  async function deleteOp(op: Op) {
    if (toDelete !== op.ID) toDelete = op.ID;
    else {
      try {
        await deleteOpPromise(op.ID);
        await refresh();
      } catch (e) {
        console.log(e);
      }
      toDelete = null;
    }
  }
</script>

<div class="container">
  <div class="row">
    <div class="col">
      <h1>
        Operations
        <button on:click={refresh} class="btn btn-primary">↻</button>
      </h1>
      <table class="table table-striped">
        <thead class="thead">
          <tr>
            <th scope="col">Operation</th>
            <th scope="col">Comment</th>
            <th scope="col">Teams</th>
            <th>Commands</th>
          </tr>
        </thead>
        <tbody id="ops">
          {#each ops as op (op.ID)}
            <tr>
              <td>
                <a href={'#/operation/' + op.ID + '/list'}>{op.name}</a>
              </td>
              <td>{op.comment}</td>
              <td>
                {#each filterTeamsID(op.teamlist) as teamid, i (teamid)}
                  {#if i > 0}, {/if}
                  <a href={'#/team/' + teamid + '/list'}>
                    {getTeamName(teamid)}
                  </a>
                {/each}
              </td>
              <td>
                {#if op.own}
                  <button
                    on:click={() => deleteOp(op)}
                    class="btn btn-danger btn-sm"
                  >
                    {#if toDelete === op.ID}
                      <span>Confirm?</span>
                    {:else}
                      <span>Delete</span>
                    {/if}
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
