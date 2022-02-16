<script lang="ts">
  import type { WasabeeOp } from '../model';

  export let portalId: PortalID;
  export let operation: WasabeeOp;

  $: portal = operation.getPortal(portalId);
</script>

<a
  href={'https://intel.ingress.com/?z=14&pll=' + portal.lat + ',' + portal.lng}
  target="_blank">{portal.name}</a
>
