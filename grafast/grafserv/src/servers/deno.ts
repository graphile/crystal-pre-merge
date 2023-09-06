import {
  convertHandlerResultToResult,
  GrafservBase,
  normalizeRequest,
} from "grafserv";

import type {
  GrafservBodyJSON,
  GrafservConfig,
  RequestDigest,
  Result,
} from "grafserv";

declare global {
  namespace Grafast {
    interface RequestContext {
      ctx: Deno.ServeHandlerInfo;
    }
  }
}

function getDigest(req: Request, ctx: Deno.ServeHandlerInfo): RequestDigest {
  return {
    httpVersionMajor: 2,
    httpVersionMinor: 0,
    isSecure: new URL(req.url).protocol === "https",
    method: req.method,
    path: new URL(req.url).pathname,
    headers: Object.fromEntries(req.headers.entries()),
    getQueryParams() {
      return Object.fromEntries(new URL(req.url).searchParams) as Record<
        string,
        string | string[]
      >;
    },
    async getBody() {
      return {
        type: "json",
        json: await req.json(),
      } as GrafservBodyJSON;
    },
    requestContext: { ctx },
  };
}

export class DenoGrafserv extends GrafservBase {
  constructor(config: GrafservConfig) {
    super(config);
  }
  public async handler(req: Request, ctx: Deno.ServeHandlerInfo) {
    const digest = getDigest(req, ctx);

    const normalizedRequest = normalizeRequest(digest);

    const handlerResult = await this.graphqlHandler(
      normalizedRequest,
      this.graphiqlHandler
    );
    const result = await convertHandlerResultToResult(handlerResult);
    return this.send(req, result);
  }

  public send(_req: Request, result: Result | null) {
    if (result === null) return new Response(null, { status: 404 });

    switch (result.type) {
      case "error": {
        console.error(result.error);
        return new Response(
          JSON.stringify(
            Object.assign(result.error, { status: result.statusCode })
          ),
          { status: result.statusCode, headers: result.headers }
        );
      }
      case "buffer": {
        console.log("ok");
        return new Response(result.buffer, {
          status: result.statusCode,
          headers: result.headers,
        });
      }
      case "json": {
        return new Response(JSON.stringify(result.json), {
          status: result.statusCode,
          headers: result.headers,
        });
      }
      case "noContent": {
        return new Response(null, {
          status: result.statusCode,
          headers: result.headers,
        });
      }
      default: {
        const never = result as never;
        console.log("Unhandled:");
        console.dir(never);
        return new Response("Server hasn't implemented this yet", {
          status: 503,
          headers: { "Content-Type": "text/plain" },
        });
      }
    }
  }
}

export function grafserv(config: GrafservConfig) {
  return new DenoGrafserv(config);
}
