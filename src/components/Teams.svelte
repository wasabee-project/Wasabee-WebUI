<script lang="ts">
  import { WasabeeOp } from '../model';

  import {
    SetTeamState,
    SetTeamShareWD,
    SetTeamLoadWD,
    deleteTeamPromise,
    leaveTeamPromise,
    newTeamPromise,
  } from '../server';

  import { loadMeAndOps } from '../sync';

  import type { MeTeam, WasabeeMe } from '../model/me';

  import { agentsStore, meStore, opsStore } from '../stores';
  import {
    Button,
    Input,
    InputGroup,
    InputGroupText,
  } from '@sveltestrap/sveltestrap';

  let newTeamName: string = '';
  let toDelete: TeamID | null = null;

  let teamsOps: { [teamId: TeamID]: [OpID, string][] };

  let me: WasabeeMe;
  $: if ($meStore) me = $meStore; // shortcut

  $: {
    const teams: { [teamid: TeamID]: [OpID, string][] } = {};
    for (const id of $opsStore.success) {
      const op = WasabeeOp.load(id);
      if (!op || !op.teamlist) continue;
      const pair = [op.ID, op.name] as [OpID, string];
      for (const opteam of op.teamlist) {
        teams[opteam.teamid] = teams[opteam.teamid] || [];
        if (!teams[opteam.teamid].includes(pair))
          teams[opteam.teamid].push(pair);
      }
    }
    teamsOps = teams;
  }

  async function refresh() {
    await loadMeAndOps();
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
      Teams <Button on:click={refresh}>↻</Button>
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
                {$agentsStore[team.Owner]
                  ? $agentsStore[team.Owner].name
                  : team.Owner}
              </td>
              <td>
                <Input
                  type="checkbox"
                  bind:checked={team.State}
                  on:change={() => setTeamState(team)}
                />
              </td>
              <td>
                <Input
                  type="checkbox"
                  bind:checked={team.ShareWD}
                  on:change={() => setTeamShareWD(team)}
                />
              </td>
              <td>
                <Input
                  type="checkbox"
                  bind:checked={team.LoadWD}
                  on:change={() => setTeamLoadWD(team)}
                />
              </td>
              <td>
                {#if teamsOps[team.ID]}
                  {#each teamsOps[team.ID] as [opID, opName], i (opID)}
                    {#if i > 0},
                    {/if}
                    <a href={'#/operation/' + opID + '/list'}>
                      {opName}
                    </a>
                  {/each}
                {/if}
              </td>
              <td>
                {#if isOwner(team)}
                  <Button
                    on:click={() => deleteTeam(team)}
                    color="danger"
                    size="sm"
                  >
                    {#if toDelete === team.ID}<span>Confirm?</span>
                    {:else}<span>Delete</span>{/if}
                  </Button>
                {:else}
                  <Button
                    on:click={() => leaveTeam(team)}
                    color="warning"
                    size="sm"
                  >
                    {#if toDelete === team.ID}<span>Confirm?</span>
                    {:else}<span>Leave</span>{/if}
                  </Button>
                {/if}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
    <div class="col">
      <InputGroup>
        <InputGroupText>New Team:</InputGroupText>
        <Input type="text" placeholder="New Team" bind:value={newTeamName} />
        <Button color="info" on:click={createTeam}>New Team</Button>
      </InputGroup>
    </div>
  </div>
</div>

<style>
  /* #teams button {
    width: 100%;
  } */
</style>
