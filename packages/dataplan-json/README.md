# @dataplan/json

[![GitHub Sponsors](https://img.shields.io/github/sponsors/benjie?label=GitHub%20sponsors)](https://github.com/sponsors/benjie)
[![Patreon sponsor button](https://img.shields.io/badge/sponsor-via%20Patreon-orange.svg)](https://patreon.com/benjie)
[![Discord chat room](https://img.shields.io/discord/489127045289476126.svg)](http://discord.gg/graphile)
[![Follow](https://img.shields.io/badge/twitter-@DataPlannerHQ-blue.svg)](https://twitter.com/DataPlannerHQ)

_**A cutting-edge planning and execution engine for GraphQL**_

DataPlanner understands GraphQL and (with your help) it understands your
business logic; this allows it to orchestrate a GraphQL request's data
requirements in an extremely efficient manner, leading to excellent performance, reduced server load, and happier customers.

*@dataplan/json is plan classes for encoding/decoding JSON*

<!-- SPONSORS_BEGIN -->

## Crowd-funded open-source software

To help us develop this software sustainably under the MIT license, we ask all
individuals and businesses that use it to help support its ongoing maintenance
and development via sponsorship.

### [Click here to find out more about sponsors and sponsorship.](https://www.graphile.org/sponsor/)

And please give some love to our featured sponsors 🤩:

<table><tr>
<td align="center"><a href="https://surge.io/"><img src="https://graphile.org/images/sponsors/surge.png" width="90" height="90" alt="Surge" /><br />Surge</a> *</td>
<td align="center"><a href="https://storyscript.com/?utm_source=postgraphile"><img src="https://graphile.org/images/sponsors/storyscript.png" width="90" height="90" alt="Story.ai" /><br />Story.ai</a> *</td>
<td align="center"><a href="http://chads.website"><img src="https://graphile.org/images/sponsors/chadf.png" width="90" height="90" alt="Chad Furman" /><br />Chad Furman</a> *</td>
<td align="center"><a href="https://www.the-guild.dev/"><img src="https://graphile.org/images/sponsors/theguild.png" width="90" height="90" alt="The Guild" /><br />The Guild</a> *</td>
</tr><tr>
<td align="center"><a href="https://www.fanatics.com/"><img src="https://graphile.org/images/sponsors/fanatics.png" width="90" height="90" alt="Fanatics" /><br />Fanatics</a> *</td>
<td align="center"><a href="https://www.enzuzo.com/"><img src="https://graphile.org/images/sponsors/enzuzo.png" width="90" height="90" alt="Enzuzo" /><br />Enzuzo</a> *</td>
</tr></table>

<em>\* Sponsors the entire Graphile suite</em>

<!-- SPONSORS_END -->

## About

DataPlanner can be used as an alternative to the "execute" method of GraphQL.js for the very best performance results, or can be used from within the "execute" method via our automatic resolver-planner bridging (you can install this into an existing schema with the `dataplannerEnforce` method below).

When DataPlanner sees a GraphQL request for the first time it will "plan" the request: figuring out the data requirements, the steps that need to be taken, and how to write the results to the response. This "first draft" plan will be optimised and rewritten to give the best achievable performance (for example removing redundant or duplicate processing steps, rewriting and merging processing steps, etc). Finally, the plan will be executed, and the data returned to the client. Future requests that are compatible with this plan can be executed immediately without a need to re-plan.


