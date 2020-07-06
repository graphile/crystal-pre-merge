import {
  GraphQLFieldResolver,
  defaultFieldResolver,
  GraphQLOutputType,
  GraphQLNonNull,
  GraphQLList,
  isScalarType,
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLScalarType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLInputObjectType,
} from "graphql";
import { assert } from "console";
import { executePlanFromResolver } from "./crystal";

/**
 * Gives access to the properties of an object whilst also tracking which keys
 * were accessed.
 *
 * @remarks
 * We could have used an ES6 proxy for this, but performance is terrible, and
 * this more verbose approach encourages you to avoid .get()s where possible.
 */
class Snitch<T extends object> {
  public accessedKeys: Set<keyof T>;

  constructor(private obj: T) {
    this.accessedKeys = new Set();
  }

  get<TKey extends keyof T>(key: TKey): T[TKey] {
    this.accessedKeys.add(key);
    return this.obj[key];
  }
}

type ParentPlan = any;
type Plan = any;
type ArgPlan = any;
type PlanDependencies =
  | string[]
  | ((
      pp: Plan,
      args: { [key: string]: unknown },
      context: Snitch<GraphileEngine.GraphileResolverContext>,
    ) => void);

declare global {
  namespace GraphileEngine {
    interface GraphQLObjectTypeGraphileExtension {
      parentPlan?: ParentPlan;
      plan?: Plan;
    }

    interface GraphQLFieldGraphileExtension {
      dependencies?: PlanDependencies;
      argPlan?: ArgPlan;
    }
  }
}

export const makeGraphileObjectExtension = () => ({});
export const makeGraphileObjectFieldExtension = () => ({});

const $$plan = Symbol("plan");
const $$data = Symbol("data");

function identityWrapper<T>(plan: any, arg: T): T {
  return arg;
}

function graphileWrap(plan: any, data: any) {
  // Short-circuit nulls, undefineds, NaNs, etc
  if (data == null || Number.isNaN(data)) {
    return null;
  }
  return {
    [$$plan]: plan,
    [$$data]: data,
  };
}

function graphileWrap1(plan: any, data: any) {
  // Short-circuit nulls, undefineds, NaNs, etc
  if (data == null || Number.isNaN(data)) {
    return null;
  }
  const list = Array.isArray(data) ? data : [data];
  return list.map((entry) => graphileWrap(plan, entry));
}

function graphileWrap2(plan: any, data: any) {
  // Short-circuit nulls, undefineds, NaNs, etc
  if (data == null || Number.isNaN(data)) {
    return null;
  }
  const list = Array.isArray(data) ? data : [data];
  return list.map((entry) => graphileWrap1(plan, entry));
}

function graphileWrapN(listDepth: number) {
  if (listDepth <= 0) {
    return graphileWrap;
  } else {
    return (plan: any, data: any): any => {
      // Short-circuit nulls, undefineds, NaNs, etc
      if (data == null || Number.isNaN(data)) {
        return null;
      }
      const list = Array.isArray(data) ? data : [data];
      return list.map((entry) => graphileWrapN(listDepth - 1)(plan, entry));
    };
  }
}

export function makeGraphileWrapResolver() {
  // Cached on a per-schema basis, so no need for a WeakMap
  let typeToWrapperMap = new Map<GraphQLOutputType, any>();

  function makeWrapper(type: GraphQLOutputType) {
    const wrapper = typeToWrapperMap.get(type);
    if (wrapper) {
      return wrapper;
    }

    // Unwrap type
    let unwrappedType = type;
    let listDepth = 0;
    while (true) {
      if (unwrappedType instanceof GraphQLNonNull) {
        unwrappedType = unwrappedType.ofType;
      } else if (unwrappedType instanceof GraphQLList) {
        listDepth++;
        unwrappedType = unwrappedType.ofType;
      } else {
        break;
      }
    }

    // This should be a named type now.
    assert(
      unwrappedType.name,
      "Expected type to be a named type after unwrapping all GraphQLNonNull and GraphQLList elements, but received unnamed type.",
    );

    let newWrapper: any;

    if (isScalarType(unwrappedType)) {
      // We never wrap resolver results of scalars
      newWrapper = identityWrapper;
    } else if (!unwrappedType?.extensions?.graphile) {
      // Non-graphile types don't have our `resolver`-wrapper, so don't wrap
      // the data being fed to them otherwise we risk them getting confused.
      newWrapper = identityWrapper;
    } else {
      switch (listDepth) {
        case 0:
          newWrapper = graphileWrap;
          break;
        case 1:
          newWrapper = graphileWrap1;
          break;
        case 2:
          newWrapper = graphileWrap2;
          break;
        default:
          newWrapper = graphileWrapN(listDepth);
      }
    }
    typeToWrapperMap.set(type, newWrapper);
    return newWrapper;
  }

  return function graphileWrapResolver<
    TSource,
    TContext,
    TArgs = { [argName: string]: any }
  >(
    config: GraphQLFieldConfig<TSource, TContext, TArgs>,
  ): GraphQLFieldConfig<TSource, TContext, TArgs> {
    const { resolve, type, extensions } = config;
    let realResolver = resolve || defaultFieldResolver;

    const wrap = makeWrapper(type);
    const graphileResolver: GraphQLFieldResolver<
      TSource,
      TContext,
      TArgs
    > = function (graphileParent: any, args, context, info) {
      const { data, plan } = executePlanFromResolver(
        graphileParent,
        args,
        context,
        info,
      );

      const result =
        data && typeof data.then === "function"
          ? data.then((d: any) => realResolver(d, args, context, info))
          : realResolver(data, args, context, info);

      if (result && typeof result.then === "function") {
        return result.then((data: any) => wrap(plan, data));
      } else {
        return wrap(plan, result);
      }
    };
    return {
      ...config,
      resolve: graphileResolver,
    };
  };
}
