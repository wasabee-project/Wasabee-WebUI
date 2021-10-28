<script lang="ts">
  import { WasabeeAgent, WasabeeMe, WasabeeOp } from '../model';

  import {
    SetTeamState,
    SetTeamShareWD,
    SetTeamLoadWD,
    deleteTeamPromise,
    leaveTeamPromise,
    newTeamPromise,
  } from '../server';

  import { loadMeAndOps } from '../sync';

  import type { MeTeam } from '../model/me';

  let me: WasabeeMe = WasabeeMe.get();
  let newTeamName: string = '';
  let toDelete: TeamID | null = null;

  let teamsOps: { [teamId: TeamID]: { [opId: OpID]: string } };

  $: {
    const teams = {};
    const ops = me.Ops.map((o) => [o.ID, o.Name]);
    ops.sort((a, b) => a[1].localeCompare(b[1]));
    for (const id of ops.map((d) => d[0])) {
      const op = WasabeeOp.load(id);
      if (!op || !op.teamlist) continue;
      for (const opteam of op.teamlist) {
        teams[opteam.teamid] = teams[opteam.teamid] || {};
        teams[opteam.teamid][op.ID] = op.name;
      }
    }
    teamsOps = teams;
  }

  async function refresh() {
    await loadMeAndOps();
    me = WasabeeMe.get();
  }

  async function createTeam() {
    if (!newTeamName) {
      return;
    }
    try {
      await newTeamPromise(newTeamName);
      refresh();
    } catch (e) {
      console.log(e);
    }
  }
  async function setTeamState(team: MeTeam) {
    try {
      await SetTeamState(team.ID, team.State ? 'On' : 'Off');
    } catch (e) {
      console.log(e);
    }
  }
  async function setTeamShareWD(team: MeTeam) {
    try {
      await SetTeamShareWD(team.ID, team.ShareWD ? 'On' : 'Off');
    } catch (e) {
      console.log(e);
    }
  }
  async function setTeamLoadWD(team: MeTeam) {
    try {
      await SetTeamLoadWD(team.ID, team.LoadWD ? 'On' : 'Off');
    } catch (e) {
      console.log(e);
    }
  }
  // function uniqueOps (ops: WasabeeOp[]) {
  //   const m = new Map();
  //   for (const op of ops) {
  //     if (!m.has(op.ID)) m.set(op.ID, op);
  //   }
  //   return m.values();
  // }
  function isOwner(team: MeTeam) {
    return team.Owner == me.id;
  }
  function getOwner(team: MeTeam) {
    const agent = WasabeeAgent.get(team.Owner);
    return agent ? agent.name : team.Owner;
  }
  async function deleteTeam(t: MeTeam) {
    if (toDelete !== t.ID) toDelete = t.ID;
    else {
      try {
        await deleteTeamPromise(t.ID);
        refresh();
      } catch (e) {
        console.log(e);
      }
      toDelete = null;
    }
  }
  async function leaveTeam(t: MeTeam) {
    if (toDelete !== t.ID) toDelete = t.ID;
    else {
      try {
        await leaveTeamPromise(t.ID);
        refresh();
      } catch (e) {
        console.log(e);
      }
      toDelete = null;
    }
  }
</script>

<div class="container">
  <div class="row">
    <h1>
      Teams <button class="btn btn-primary" on:click={refresh}>↻</button>
    </h1>
    <table class="table table-striped">
      <thead class="thead">
        <tr>
          <th>Team</th>
          <th>Owner</th>
          <th>Share Location</th>
          <th>Share WD Keys</th>
          <th>Load WD Keys</th>
          <th>Ops</th>
          <th />
        </tr>
      </thead>
      <tbody id="teams">
        {#if !me.Teams.length}
          <tr>
            <td colspan="6">
              You are not on any teams, have your operator add you with this
              GoogleID: {me.id}
            </td>
          </tr>
        {:else}
          {#each me.Teams as team (team.ID)}
            <tr>
              <td>
                <a href={'#/team/' + team.ID + '/list'}>
                  {team.Name}
                </a>
              </td>
              <td>
                {getOwner(team)}
              </td>
              <td>
                <input
                  type="checkbox"
                  bind:checked={team.State}
                  on:change={() => setTeamState(team)}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  bind:checked={team.ShareWD}
                  on:change={() => setTeamShareWD(team)}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  bind:checked={team.LoadWD}
                  on:change={() => setTeamLoadWD(team)}
                />
              </td>
              <td>
                {#if teamsOps[team.ID]}
                  {#each Object.entries(teamsOps[team.ID]) as [opID, opName], i (opID)}
                    {#if i > 0}, {/if}
                    <a href={'#/operation/' + opID + '/list'}>
                      {opName}
                    </a>
                  {/each}
                {/if}
              </td>
              <td>
                {#if isOwner(team)}
                  <button
                    on:click={() => deleteTeam(team)}
                    class="btn btn-danger btn-sm"
                  >
                    {#if toDelete === team.ID}<span>Confirm?</span>
                    {:else}<span>Delete</span>{/if}
                  </button>
                {:else}
                  <button
                    on:click={() => leaveTeam(team)}
                    class="btn btn-warning btn-sm"
                  >
                    {#if toDelete === team.ID}<span>Confirm?</span>
                    {:else}<span>Leave</span>{/if}
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
    <div class="col">
      <label
        >New Team:
        <input
          type="text"
          placeholder="New Team"
          bind:value={newTeamName}
        /></label
      >
      <button class="btn btn-info" on:click={createTeam}>New Team</button>
    </div>
  </div>
</div>
