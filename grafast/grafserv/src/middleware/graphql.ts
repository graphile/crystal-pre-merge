import { LRU } from "@graphile/lru";
import { createHash } from "crypto";
import type { PromiseOrDirect } from "grafast";
import {
  $$extensions,
  execute as grafastExecute,
  hookArgs,
  isAsyncIterable,
  isPromiseLike,
} from "grafast";
import {
  DocumentNode,
  ExecutionArgs,
  getOperationAST,
  GraphQLSchema,
} from "graphql";
import { GraphQLError, parse, Source, validate } from "graphql";
import { makeAcceptMatcher } from "../accept.js";

import {
  $$normalizedHeaders,
  GrafservBody,
  HandlerResult,
  JSONValue,
  NormalizedRequestDigest,
  RequestDigest,
} from "../interfaces.js";
import type { OptionsFromConfig } from "../options.js";
import { parse as parseQueryString } from "node:querystring";

let lastString: string;
let lastHash: string;
const calculateQueryHash = (queryString: string): string => {
  if (queryString !== lastString) {
    lastString = queryString;
    lastHash = createHash("sha1").update(queryString).digest("base64");
  }
  return lastHash;
};

function makeParseAndValidateFunction(schema: GraphQLSchema) {
  type ParseAndValidateResult =
    | { document: DocumentNode; errors?: undefined }
    | { document?: undefined; errors: readonly GraphQLError[] };
  const parseAndValidationCache = new LRU<string, ParseAndValidateResult>({
    maxLength: 500,
  });
  let lastParseAndValidateQuery: string;
  let lastParseAndValidateResult: ParseAndValidateResult;
  function parseAndValidate(query: string): ParseAndValidateResult {
    if (lastParseAndValidateQuery === query) {
      return lastParseAndValidateResult;
    }
    const hash = query.length > 500 ? calculateQueryHash(query) : query;

    const cached = parseAndValidationCache.get(hash);
    if (cached) {
      lastParseAndValidateQuery = query;
      lastParseAndValidateResult = cached;
      return cached;
    }

    const source = new Source(query, "GraphQL HTTP Request");
    let document;
    try {
      document = parse(source);
    } catch (e) {
      const result = {
        errors: [
          new GraphQLError(
            e.message,
            null,
            undefined,
            undefined,
            undefined,
            e,
            undefined,
          ),
        ],
      };
      parseAndValidationCache.set(hash, result);
      lastParseAndValidateQuery = query;
      lastParseAndValidateResult = result;
      return result;
    }
    const errors = validate(schema, document);
    const result: ParseAndValidateResult = errors.length
      ? { errors }
      : { document };
    parseAndValidationCache.set(hash, result);
    lastParseAndValidateQuery = query;
    lastParseAndValidateResult = result;
    return result;
  }
  return parseAndValidate;
}

interface ValidatedBody {
  query: string;
  operationName: string | undefined;
  variableValues: Record<string, any> | undefined;
  extensions: Record<string, any> | undefined;
}

function processAndValidateQueryParams(
  params: Record<string, string | string[] | undefined>,
): ValidatedBody {
  const query = params.query;
  if (typeof query !== "string") {
    throw new Error("query must be a string");
  }
  const operationName = params.operationName ?? undefined;
  if (operationName != null && typeof operationName !== "string") {
    throw new Error("operationName, if given, must be a string");
  }
  const variablesString = params.variables ?? undefined;
  const variableValues =
    typeof variablesString === "string"
      ? JSON.parse(variablesString)
      : undefined;
  if (
    variableValues != null &&
    (typeof variableValues !== "object" || Array.isArray(variableValues))
  ) {
    throw new Error("Invalid variables; expected JSON-encoded object");
  }
  const extensionsString = params.extensions ?? undefined;
  const extensions =
    typeof extensionsString === "string"
      ? JSON.parse(extensionsString)
      : undefined;
  if (
    extensions != null &&
    (typeof extensions !== "object" || Array.isArray(extensions))
  ) {
    throw new Error("Invalid extensions; expected JSON-encoded object");
  }
  return {
    query,
    operationName,
    variableValues,
    extensions,
  };
}

function processAndValidateJSON(params: JSONValue): ValidatedBody {
  if (!params) {
    throw new Error("No body");
  }
  if (typeof params !== "object" || Array.isArray(params)) {
    throw new Error("Invalid body; expected object");
  }
  const query = params.query;
  if (typeof query !== "string") {
    throw new Error("query must be a string");
  }
  const operationName = params.operationName ?? undefined;
  if (operationName != null && typeof operationName !== "string") {
    throw new Error("operationName, if given, must be a string");
  }
  const variableValues = params.variables ?? undefined;
  if (
    variableValues != null &&
    (typeof variableValues !== "object" || Array.isArray(variableValues))
  ) {
    throw new Error("Invalid variables; expected JSON-encoded object");
  }
  const extensions = params.extensions ?? undefined;
  if (
    extensions != null &&
    (typeof extensions !== "object" || Array.isArray(extensions))
  ) {
    throw new Error("Invalid extensions; expected JSON-encoded object");
  }
  return {
    query,
    operationName,
    variableValues,
    extensions,
  };
}

function processAndValidateBody(
  request: NormalizedRequestDigest,
  body: GrafservBody,
): ValidatedBody {
  const contentType = request[$$normalizedHeaders]["content-type"];
  if (!contentType) {
    throw Object.assign(
      new Error("Could not determine the Content-Type of the request"),
      { statusCode: 400 },
    );
  }
  const semi = contentType.indexOf(";");
  const ct = semi >= 0 ? contentType.slice(0, semi).trim() : contentType.trim();
  // TODO: we should probably at least look at the parameters... e.g. throw if encoding !== utf-8
  switch (ct) {
    case "application/json": {
      switch (body.type) {
        case "buffer": {
          return processAndValidateJSON(
            JSON.parse(body.buffer.toString("utf8")),
          );
        }
        case "text": {
          return processAndValidateJSON(JSON.parse(body.text));
        }
        case "json": {
          return processAndValidateJSON(body.json);
        }
        default: {
          const never: never = body;
          throw new Error(`Do not understand type ${(never as any).type}`);
        }
      }
    }
    case "application/x-www-form-urlencoded": {
      switch (body.type) {
        case "buffer": {
          return processAndValidateQueryParams(
            parseQueryString(body.buffer.toString("utf8")),
          );
        }
        case "text": {
          return processAndValidateQueryParams(parseQueryString(body.text));
        }
        case "json": {
          if (
            body.json == null ||
            typeof body.json !== "object" ||
            Array.isArray(body.json)
          ) {
            throw new Error(`Invalid body`);
          }
          return processAndValidateQueryParams(
            body.json as Record<string, any>,
          );
        }
        default: {
          const never: never = body;
          throw new Error(`Do not understand type ${(never as any).type}`);
        }
      }
    }
    case "application/graphql": {
      // TODO: I have a vague feeling that people that do this pass variables via the query string?
      switch (body.type) {
        case "text": {
          return {
            query: body.text,
            operationName: undefined,
            variableValues: undefined,
            extensions: undefined,
          };
        }
        case "buffer": {
          return {
            query: body.buffer.toString("utf8"),
            operationName: undefined,
            variableValues: undefined,
            extensions: undefined,
          };
        }
        case "json": {
          return processAndValidateJSON(body.json);
        }
        default: {
          const never: never = body;
          throw new Error(`Do not understand type ${(never as any).type}`);
        }
      }
    }
    default: {
      throw new Error(`Do not understand content type`);
    }
  }
}

export const APPLICATION_JSON = "application/json;charset=utf-8";
export const APPLICATION_GRAPHQL_RESPONSE_JSON =
  "application/graphql-response+json;charset=utf-8";
export const TEXT_HTML = "text/html;charset=utf-8";

/** https://graphql.github.io/graphql-over-http/draft/#sec-Legacy-Watershed */
const isAfterWatershed = Date.now() >= +new Date(2025, 0, 1);
const GRAPHQL_TYPES = isAfterWatershed
  ? [APPLICATION_GRAPHQL_RESPONSE_JSON, APPLICATION_JSON]
  : [APPLICATION_JSON, APPLICATION_GRAPHQL_RESPONSE_JSON];

const graphqlAcceptMatcher = makeAcceptMatcher([...GRAPHQL_TYPES]);

const graphqlOrHTMLAcceptMatcher = makeAcceptMatcher([
  ...GRAPHQL_TYPES,
  // Must be lowest priority, otherwise GraphiQL may override GraphQL in some
  // situations
  TEXT_HTML,
]);

export const makeGraphQLHandler = (
  resolvedPreset: GraphileConfig.ResolvedPreset,
  dynamicOptions: OptionsFromConfig,
  schemaOrPromise: PromiseOrDirect<GraphQLSchema> | null,
) => {
  if (schemaOrPromise == null) {
    const err = Promise.reject(
      new GraphQLError(
        "The schema is currently unavailable",
        null,
        null,
        null,
        null,
        null,
        {
          statusCode: 503,
        },
      ),
    );
    return () => err;
  }

  let schema: GraphQLSchema;
  let parseAndValidate: ReturnType<typeof makeParseAndValidateFunction>;
  let wait: PromiseLike<void> | null;

  if (isPromiseLike(schemaOrPromise)) {
    wait = schemaOrPromise.then((_schema) => {
      if (_schema == null) {
        throw new GraphQLError(
          "The schema is current unavailable.",
          null,
          null,
          null,
          null,
          null,
          {
            statusCode: 503,
          },
        );
      }
      schema = _schema;
      parseAndValidate = makeParseAndValidateFunction(schema);
      wait = null;
    });
  } else {
    schema = schemaOrPromise;
    parseAndValidate = makeParseAndValidateFunction(schema);
  }

  const outputDataAsString = dynamicOptions.outputDataAsString;

  return async (
    request: NormalizedRequestDigest,
    graphiqlHandler?: (
      request: NormalizedRequestDigest,
    ) => Promise<HandlerResult | null>,
  ): Promise<HandlerResult | null> => {
    const accept = request[$$normalizedHeaders].accept;
    // Do they want HTML, or do they want GraphQL?
    const chosenContentType =
      request.method === "GET" &&
      dynamicOptions.graphiqlOnGraphQLGET &&
      graphiqlHandler
        ? graphqlOrHTMLAcceptMatcher(accept)
        : graphqlAcceptMatcher(accept);

    if (chosenContentType === TEXT_HTML) {
      // They want HTML -> Ruru
      return graphiqlHandler!(request);
    } else if (
      chosenContentType === APPLICATION_JSON ||
      chosenContentType === APPLICATION_GRAPHQL_RESPONSE_JSON
    ) {
      // They want GraphQL
      if (
        request.method === "POST" ||
        (dynamicOptions.graphqlOverGET && request.method === "GET")
      ) {
        /* continue */
      } else {
        // TODO: should we raise 501? Forbidden for GET/HEAD.

        // Unsupported method.
        return null;
      }
    } else {
      // Who knows what they want?
      return null;
    }

    // If we get here, we're handling a GraphQL request
    const isLegacy = chosenContentType === APPLICATION_JSON;

    if (wait) {
      await wait;
    }
    const body =
      request.method === "POST"
        ? processAndValidateBody(request, await request.getBody(dynamicOptions))
        : processAndValidateQueryParams(await request.getQueryParams());

    const { query, operationName, variableValues } = body;

    const { errors, document } = parseAndValidate(query);

    if (errors) {
      return {
        type: "graphql",
        request,
        dynamicOptions,
        statusCode: 200,
        contentType: chosenContentType,
        payload: { errors },
      };
    }

    if (request.method !== "POST") {
      // Forbid mutation
      const operation = getOperationAST(document, operationName);
      if (operation?.operation === "mutation") {
        const error = new GraphQLError(
          "Mutations may only take place over POST requests.",
          operation,
        );
        return {
          type: "graphql",
          request,
          dynamicOptions,
          // Note: the GraphQL-over-HTTP spec currently mandates 405, even for legacy clients:
          // https://graphql.github.io/graphql-over-http/draft/#sel-FALJRPCE2BCGoBitR
          statusCode: 405,
          contentType: chosenContentType,
          payload: {
            errors: [error],
          },
        };
      }
    }

    const args: ExecutionArgs = {
      schema,
      document,
      rootValue: null,
      contextValue: Object.create(null),
      variableValues,
      operationName,
    };

    await hookArgs(
      args,
      {
        request,
      },
      resolvedPreset,
    );

    try {
      const result = await grafastExecute(args, resolvedPreset);
      if (isAsyncIterable(result)) {
        return {
          type: "graphqlIncremental",
          request,
          dynamicOptions,
          statusCode: 200,
          iterator: result,
          outputDataAsString,
        };
      }
      return {
        type: "graphql",
        request,
        dynamicOptions,
        statusCode: 200,
        contentType: chosenContentType,
        payload: result,
        outputDataAsString,
      };
    } catch (e) {
      console.error(e);
      return {
        type: "graphql",
        request,
        dynamicOptions,
        statusCode: isLegacy ? 200 : 500,
        contentType: chosenContentType,
        payload: {
          errors: [new GraphQLError(e.message)],
          extensions: (args.rootValue as any)?.[$$extensions],
        },
      };
    }
  };
};
