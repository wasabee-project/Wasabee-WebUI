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
          <span class="font-weight-bolder">Community Name:</span>
          <span class="agent-name">{agent.communityname}</span>
        </div>
      {/if}
      {#if agent.rocksname}
        <div>
          <span class="font-weight-bolder">Rocks Name:</span>
          <a
            target="_new"
            href={'https://enlightened.rocks/u/' + agent.id}
            class="agent-name">{agent.rocksname} {agent.rocks ? '✅' : '❌'}</a
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
  .popover {
    width: max-content;
  }
  a {
    text-decoration: underline dotted;
  }
</style>
