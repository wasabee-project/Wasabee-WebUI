<script lang="ts">
  import type { WasabeeAgent } from '../model';

  import { scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  export let agent: WasabeeAgent;

  let hovering = false;

  const enter = () => (hovering = true);
  const leave = () => (hovering = false);
</script>

<div class="relative" on:mouseenter={enter} on:mouseleave={leave}>
  {agent.name}

  {#if hovering}
    <div
      in:scale={{ duration: 150, easing: quintOut, opacity: 0 }}
      class="shadow popover p-2"
    >
      <h3 class="font-weight-bolder">
        {agent.name}
      </h3>

      <div>
        <span class="font-weight-bolder">Wasabee Name:</span>
        <span class="agent-name">{agent.name}</span>
      </div>
      {#if agent.communityname}
        <div>
          <p>
            <span class="font-weight-bolder">Community Name:</span>
            <span class="agent-name">{agent.communityname}</span>
          </p>
        </div>
      {/if}
      {#if agent.vname}
        <div>
          <span class="font-weight-bolder">V Name:</span>
          <span class="agent-name">{agent.vname}</span>
        </div>
        <div>
          <a href="https://v.enl.one/" target="_new">V Status</a>:
          <span id="vstatus">
            {#if agent.Vverified}
              <a
                v-if="me.Vverified"
                href={'https://v.enl.one/profile/' + agent.enlid}
                target="_new">verified</a
              >
            {:else}
              unverified
            {/if}
          </span>
        </div>
      {/if}
      {#if agent.rocksname}
        <div>
          <span class="font-weight-bolder">Rocks Name:</span>
          <span class="agent-name">{agent.rocksname}</span>
          <span>(L{agent.level})</span>
        </div>
        <div>
          <a href="https://enl.rocks/" target="_new">enl.rocks Status</a>:
          <span id="rocksstatus"
            >{agent.rocks ? 'verified' : 'not verified'}</span
          >
        </div>
      {/if}
      {#if agent.intelname}
        <div>
          <span class="font-weight-bolder">Intel Name:</span>
          <span class="agent-name">{agent.intelname}</span>
        </div>
      {/if}
      <div>
        <span class="font-weight-bolder">Google ID:</span>
        <span class="agent-name">{agent.id}</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .relative {
    position: relative;
  }
</style>
