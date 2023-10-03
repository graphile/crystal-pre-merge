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
      denov1: {
        ctx: Deno.ServeHandlerInfo;
      };
    }
  }
}

/* This block is to trick TypeScript into compiling; really we need the Deno types in Node.js so we can build the package. */
declare global {
  const Response: any;
  namespace Deno {
    export type ServeHandlerInfo = any;
  }
  type Request = any;
}

function getDigest(req: Request, ctx: Deno.ServeHandlerInfo): RequestDigest {
  const url = new URL(req.url);
  return {
    // TODO: figure out the actual HTTP version
    httpVersionMajor: 2,
    httpVersionMinor: 0,
    isSecure: url.protocol === "https",
    method: req.method,
    path: url.pathname,
    headers: Object.fromEntries(req.headers.entries()),
    getQueryParams() {
      // TODO: on duplicate keys, this should convert to an array instead
      return Object.fromEntries(url.searchParams) as Record<
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
    requestContext: {
      denov1: {
        ctx,
      },
    },
  };
}

export class DenoGrafserv extends GrafservBase {
  handler = async (req: Request, ctx: Deno.ServeHandlerInfo) => {
    const digest = getDigest(req, ctx);

    const normalizedRequest = normalizeRequest(digest);

    const handlerResult = await this.graphqlHandler(
      normalizedRequest,
      this.graphiqlHandler,
    );
    const result = await convertHandlerResultToResult(handlerResult);
    return this.send(req, result);
  };

  public send(_req: Request, result: Result | null) {
    if (result === null) return new Response(null, { status: 404 });

    switch (result.type) {
      case "error": {
        console.error(result.error);
        return new Response(
          JSON.stringify(
            Object.assign(result.error, { status: result.statusCode }),
          ),
          { status: result.statusCode, headers: result.headers },
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
