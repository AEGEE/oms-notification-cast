# oms-node-ms-example
This service provides an example of how a microservice could look like when written in node.js. It comes with some commonly used helpers and with some configurations. This repo was branched off oms-applications when that service was in a very immature state, as an example to copy into your newly started microservice.

The middlewares are not exactly written in the usual way you would write middlewares, but as it is typical to invoke several requests to other services we showed a way how to parallely fire those requests with the proposed promise-based middleware. If for example your service needs some userdata from the core and a event from oms-events, then these request can be executed in parallel by passing them as array to the joinResults function. That function basically does nothing than waiting for all Promises to be finished before continuing in the restify middleware pipeline. Of course you can also rewrite everything to your needs though.

Also some communication helpers are provided, which can query the registry and make it easier to find other services. Those helpers will cache any registry response until the service-lifetime ended, making these calls quite fast on all but the first lookups.

Notice that the core communication does not yet work, as the core does not yet connect to the registry. However we hope that will happen soon.

If you have further questions on how to start a microservice, feel free to ask in the slack!
