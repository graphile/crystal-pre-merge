# Deno

```ts
import { grafserv } from "npm:grafserv/deno/v1";
import preset from "./graphile.config.mjs";
import schema from "./schema.mjs";

// Create a Grafserv instance
const serv = grafserv({ schema, preset });

// Create a Deno server with our handler.
Deno.serve({ port: preset.grafserv.port ?? 5678 }, serv.handler);
```
