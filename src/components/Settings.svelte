<script lang="ts">
  import { Button, Input, InputGroup } from '@sveltestrap/sveltestrap';
  import { getConfig } from '../config';
  import type { WasabeeMe } from '../model';
  import { notifyOnError } from '../notify';
  import { importVteams, setVAPIkey } from '../server';
  import { meStore } from '../stores';

  let botname: string = getConfig().botname;
  let vimportmode: string = 'team';

  $: me = $meStore as WasabeeMe; // shortcut

  function vimport() {
    notifyOnError(importVteams(vimportmode));
  }
</script>

<div class="container">
  <h1>Settings</h1>
  <div class="card mb-2">
    <div class="card-header">Agent Info</div>
    <div class="card-body">
      <div>
        <span class="font-weight-bolder">Wasabee Name:</span>
        <span class="agent-name">{me.name}</span>
      </div>
      <div>
        <span class="font-weight-bolder">V Name:</span>
        <span class="agent-name">{me.vname}</span>
      </div>
      <div>
        <a href="https://v.enl.one/" target="_new">V Status</a>:
        <span id="vstatus">
          {#if me.Vverified}
            <a href={'https://v.enl.one/profile/' + me.enlid} target="_new"
              >verified</a
            >
          {:else}
            unverified
          {/if}
        </span>
      </div>
      <div>
        <span class="font-weight-bolder">Rocks Name:</span>
        <span class="agent-name">{me.rocksname}</span>
      </div>
      <div>
        <a href="https://enl.rocks/" target="_new">enl.rocks Status</a>:
        <span id="rocksstatus">{me.rocks ? 'verified' : 'not verified'}</span>
        <p>
          <em
            ><a
              href="#tooltip"
              class="tooltip-display"
              data-toggle="tooltip"
              title=".Rocks verification typically only takes place in relationship to anomolies. Lack of verification does not mean you don't have a .rocks account, it just means you've not been verified at an anomaly event"
              >What is .Rocks verification?</a
            ></em
          >
        </p>
      </div>
      <div>
        <span class="font-weight-bolder">Google ID:</span>
        <span class="agent-name">{me.id}</span>
      </div>
      <div>
        <span class="font-weight-bolder">Level:</span>
        <span class="agent-name">{me.level}</span>
        <p>
          <em
            >This information comes from
            <a href="https://v.enl.one/">V</a> and/or
            <a href="https://enlightened.rocks">.rocks</a>. If you have an
            UnverifiedAgent_ name, please ensure your .Rocks and V information
            is correct.</em
          >
        </p>
      </div>
      <div>
        <span class="font-weight-bolder">Intel Name:</span>
        <span class="agent-name">{me.intelname}</span>
      </div>
      <p>
        <em
          >This information is set by the IITC plugin. It should not be trusted
          for authorization.</em
        >
      </p>
      <div>
        <p>
          <span class="font-weight-bolder">Community Name [deprecated]:</span>
          <span class="agent-name">{me.communityname}</span>
        </p>
      </div>
    </div>
  </div>
  <div class="card mb-2">
    <div class="card-header">Telegram</div>
    <div class="card-body">
      {#if me.Telegram}
        <div id="telegramContent">
          {#if me.Telegram.Verified}
            <div>
              Telgram ID: {me.Telegram.ID} (verified)
            </div>
          {:else if me.Telegram.Authtoken}
            <div>
              <strong>Step 2:</strong> Tell the bot (<a
                href={'tg://resolve?domain=' + botname}>{botname}</a
              >)
              <a
                href={'https://telegram.me/' +
                  botname +
                  '?start=' +
                  me.Telegram.Authtoken}>{me.Telegram.Authtoken}</a
              >
              to conclude verification.
            </div>
          {:else}
            <div>
              <strong>Step 1:</strong> Tell the bot (<a
                href={'tg://resolve?domain=' + botname}>{botname}</a
              >)
              <a href={'https://telegram.me/' + botname + '?start=' + me.lockey}
                >{me.lockey}</a
              >
              to start the verification process. If you have sent this to the bot
              and this step still shows here, log out and back in.
            </div>
          {/if}
        </div>
      {:else}
        <div>
          Tell the bot (<a href={'tg://resolve?domain=' + botname}
            >{{
              botname,
            }}</a
          >)
          <a href={'https://telegram.me/' + botname + '?start=' + me.lockey}
            >{me.lockey}</a
          >
          to start the verification process.
        </div>
      {/if}
    </div>
  </div>
  <div class="card mb-2">
    <div class="card-header">One Time Token</div>
    <div class="card-body">
      <code id="ott">{me.lockey}</code>
      <div class="small dim">
        Use this to log into Wasabee-IITC if Google Oauth2 and Webview both fail
      </div>
    </div>
  </div>
  <div class="card mb-2">
    <div class="card-header">V API token</div>
    <div class="card-body">
      <div id="vapidiv">
        <Input
          type="text"
          id="vapi"
          placeholder="0123456789abcdef0123456789abcdef0123456789"
          bind:value={me.vapi}
          on:change={() => setVAPIkey(me.vapi || '')}
        />
      </div>
      <div class="small dim">
        If you need to sync V teams with Wasabee, enter a valid V API token.
      </div>
    </div>
  </div>
  <div class="card mb-2">
    <div class="card-header">V team import</div>
    <div class="card-body">
      <div id="vapidiv">
        <InputGroup>
          <Input type="select" name="vimportmode" bind:value={vimportmode}>
            <option value="team">Create one Wasabee team per V team</option>
            <option value="role">
              Create one Wasabee team per V team/role pair
            </option>
          </Input>
          <Button id="vimport" value="V team import" on:click={vimport}
            >V team import</Button
          ></InputGroup
        >
      </div>
      <div class="small dim">
        This can potentially create a large number of Wasabee teams at once.
        Only use this if you are sure you need it.
      </div>
    </div>
  </div>
</div>

<style>
  #ott {
    font-size: 100%;
  }
</style>
