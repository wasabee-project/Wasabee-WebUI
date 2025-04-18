<script lang="ts">
  import { replace } from 'svelte-spa-router';
  import type { Writable } from 'svelte/store';
  import { createEventDispatcher } from 'svelte';

  import {
    renameTeamPromise,
    deleteTeamPromise,
    createJoinLinkPromise,
    deleteJoinLinkPromise,
    rocksPromise,
    pullRocks,
    configV,
    pullV,
    sendAnnounce,
    changeTeamOwnerPromise,
  } from '../../server';

  import type { WasabeeTeam } from '../../model/';
  import { getServer } from '../../config';
  import {
    Button,
    Input,
    InputGroup,
    InputGroupText,
  } from '@sveltestrap/sveltestrap';

  const dispatch = createEventDispatcher();

  export let teamStore: Writable<WasabeeTeam>;
  let team: WasabeeTeam;
  $: team = $teamStore;

  function refresh(force = true) {
    dispatch('routeEvent', { refresh: force });
  }

  refresh(false);

  let teamName = '';
  let announcement = '';
  let newOwner = '';

  function renameTeam() {
    renameTeamPromise(team.id, teamName).then(
      () => {
        team.name = teamName;
      },
      (reject) => {
        console.log(reject);
      },
    );
  }
  function deleteTeam() {
    deleteTeamPromise(team.id).then(
      () => {
        replace('/');
      },
      (reject) => {
        console.log(reject);
      },
    );
  }
  function generateJoinLink() {
    createJoinLinkPromise(team.id).then(
      (json) => {
        team.jlt = json.Key;
      },
      (reject) => {
        console.log(reject);
      },
    );
  }
  function removeJoinLink() {
    deleteJoinLinkPromise(team.id).then(
      () => {
        team.jlt = '';
      },
      (reject) => {
        console.log(reject);
      },
    );
  }
  function updateRocks() {
    rocksPromise(team.id, team.rc, team.rk).then(
      () => {},
      (reject) => {
        console.log(reject);
      },
    );
  }
  function getRocks() {
    pullRocks(team.id).then(
      () => {
        refresh();
      },
      (reject) => {
        console.log(reject);
      },
    );
  }
  async function updateV() {
    try {
      await configV(team.id, team.vt, team.vr);
    } catch (e) {
      console.log(e);
    }
  }
  function getV() {
    pullV(team.id).then(
      () => {
        refresh();
      },
      (reject) => {
        console.log(reject);
      },
    );
  }
  function sendAnnouncement() {
    sendAnnounce(team.id, announcement);
    announcement = '';
  }
  function changeOwner() {
    changeTeamOwnerPromise(team.id, newOwner).then(
      () => {
        refresh();
      },
      (reject) => {
        newOwner = '';
        console.log(reject);
      },
    );
  }
</script>

{#if team}
  <h1 id="teamName">{team.name}</h1>
  <div class="card mb-2">
    <div class="card-header">Join Link</div>
    {#if team.jlt}
      <div class="card-body">
        <a
          href={'?server=' +
            getServer() +
            '#/team/' +
            team.id +
            '/join/' +
            team.jlt}>Copy this link</a
        >
        to share with agents
        <Button color="danger" size="sm" on:click={removeJoinLink}
          >remove</Button
        >
      </div>
    {:else}
      <div class="card-body">
        <Button color="info" on:click={generateJoinLink}
          >Generate Join Link</Button
        >
      </div>
    {/if}
  </div>
  <div class="card mb-2">
    <div class="card-header">Admin Functions</div>
    <div class="card-body">
      <div>
        <InputGroup
          ><InputGroupText>Rename Team</InputGroupText>
          <Input on:change={renameTeam} bind:value={teamName} /></InputGroup
        >
      </div>
      <div>
        <hr />
        <InputGroup>
          <InputGroupText>Delete this team</InputGroupText><Button
            on:click={deleteTeam}>Delete</Button
          >
        </InputGroup>
      </div>
    </div>
  </div>

  <div class="card mb-2">
    <div class="card-header">enlightened.rocks Integration</div>
    <div class="card-body">
      <div>
        <InputGroup>
          <InputGroupText>Rocks Community Identifier:</InputGroupText>
          <Input
            type="text"
            bind:value={team.rc}
            placeholder="afdviaren.com"
            on:change={updateRocks}
          /></InputGroup
        >
      </div>
      <div>
        <InputGroup>
          <InputGroupText>Rocks Community API Key:</InputGroupText>
          <Input
            type="text"
            bind:value={team.rk}
            placeholder="VnNfDerpL1nKsppMerZvwaXX"
            on:change={updateRocks}
          />
          <span class="dim small">24 letter string</span></InputGroup
        >
      </div>
      <div class="dim small">
        If you want this team to have its membership populated from an .rocks
        community, you will need to get the community ID and API key from the
        community's settings and add them here. Do not do this unless you trust
        the enl.rocks community.
      </div>
      <Button on:click={getRocks}>
        Pull associated enl.rocks community members onto this team
      </Button>
    </div>
  </div>
  <div class="card mb-2">
    <div class="card-header">Send Announcement</div>
    <div class="card-body">
      <Input type="textarea" bind:value={announcement} />
      <Button on:click={sendAnnouncement}>Send</Button>
    </div>
  </div>
  <div class="card mb-2">
    <div class="card-header">Change Ownership</div>
    <div class="card-body">
      <Input
        type="text"
        placeholder="new owner"
        bind:value={newOwner}
        on:change={changeOwner}
      />
      <div class="dim small">
        agent name or googleID -- once you change ownership, you can no longer
        manage this team
      </div>
    </div>
  </div>
  <div class="card mb-2">
    <div class="card-header">Team Info</div>
    <div class="card-body">
      Wasabee Team ID: <span id="teamid">{team.id}</span>
    </div>
  </div>
{/if}
