# @grafserv/envelop

<span class="badge-patreon"><a href="https://patreon.com/benjie" title="Support Graphile development on Patreon"><img src="https://img.shields.io/badge/sponsor-via%20Patreon-orange.svg" alt="Patreon sponsor button" /></a></span>
[![Discord chat room](https://img.shields.io/discord/489127045289476126.svg)](http://discord.gg/graphile)
[![Package on npm](https://img.shields.io/npm/v/grafserv.svg?style=flat)](https://www.npmjs.com/package/grafserv)
![MIT license](https://img.shields.io/npm/l/grafserv.svg)
[![Follow](https://img.shields.io/badge/twitter-@GraphileHQ-blue.svg)](https://twitter.com/GraphileHQ)

Envelop is a plugin system for GraphQL execution made by the fine folks over at
The Guild. It enables the GraphQL methods such as `parse`, `validate` and
`execute` to be augmented with additional behaviors, so that we don't have to
keep reinventing the wheel. This plugin integrates Envelop into Grafserv so that
your Grafserv instance can use plugins from the Envelop ecosystem.

<!-- SPONSORS_BEGIN -->

## Crowd-funded open-source software

To help us develop this software sustainably under the MIT license, we ask all
individuals and businesses that use it to help support its ongoing maintenance
and development via sponsorship.

### [Click here to find out more about sponsors and sponsorship.](https://www.graphile.org/sponsor/)

And please give some love to our featured sponsors 🤩:

<table><tr>
<td align="center"><a href="https://surge.io/"><img src="https://graphile.org/images/sponsors/surge.png" width="90" height="90" alt="Surge" /><br />Surge</a> *</td>
<td align="center"><a href="https://www.netflix.com/"><img src="https://graphile.org/images/sponsors/Netflix.png" width="90" height="90" alt="Netflix" /><br />Netflix</a> *</td>
<td align="center"><a href="https://www.the-guild.dev/"><img src="https://graphile.org/images/sponsors/theguild.png" width="90" height="90" alt="The Guild" /><br />The Guild</a> *</td>
<td align="center"><a href="https://qwick.com/"><img src="https://graphile.org/images/sponsors/qwick.png" width="90" height="90" alt="Qwick" /><br />Qwick</a> *</td>
</tr><tr>
<td align="center"><a href="http://chads.website"><img src="https://graphile.org/images/sponsors/chadf.png" width="90" height="90" alt="Chad Furman" /><br />Chad Furman</a> *</td>
<td align="center"><a href="https://dovetailapp.com/"><img src="https://graphile.org/images/sponsors/dovetail.png" width="90" height="90" alt="Dovetail" /><br />Dovetail</a> *</td>
<td align="center"><a href="https://www.enzuzo.com/"><img src="https://graphile.org/images/sponsors/enzuzo.png" width="90" height="90" alt="Enzuzo" /><br />Enzuzo</a> *</td>
<td align="center"><a href="https://stellate.co/"><img src="https://graphile.org/images/sponsors/Stellate.png" width="90" height="90" alt="Stellate" /><br />Stellate</a> *</td>
</tr></table>

<em>\* Sponsors the entire Graphile suite</em>

<!-- SPONSORS_END -->

## Installation

```sh
yarn add @grafserv/envelop
# or: npm install --save @grafserv/envelop
```

## Usage

Import `GrafservEnvelopPlugin` from `@grafserv/envelop` and then add it to the
`plugins` list in your `graphile.config.ts` (or equivalent) file, along with
your envelop factory:

```ts
import "graphile-config";
import GrafservEnvelopPlugin from "@grafserv/envelop";
import { envelop, useLogger } from "@envelop/core";

export const getEnveloped = envelop({
  plugins: [
    // Log requests
    useLogger(),

    // Don't leak error details to API consumers
    useMaskedErrors(),
  ],
});

const preset: GraphileConfig.Preset = {
  plugins: [GrafservEnvelopPlugin],
  grafserv: {
    getEnveloped,
  },
};

export default preset;
```
