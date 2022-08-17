import chalk from "chalk";
import debugFactory from "debug";

import { crystalPrint, crystalPrintPathIdentity } from "./crystalPrint.js";
import { exportAsMany } from "./exportAs.js";
import {
  CrystalPlans,
  EnumPlans,
  FieldPlans,
  InputObjectPlans,
  InterfaceOrUnionPlans,
  makeCrystalSchema,
  ObjectPlans,
  ScalarPlans,
} from "./makeCrystalSchema.js";
import { PrintPlanGraphOptions } from "./mermaid.js";

// TODO: doing this here feels "naughty".
debugFactory.formatters.c = crystalPrint;
debugFactory.formatters.p = (pathIdentity) =>
  chalk.bold.yellow(crystalPrintPathIdentity(pathIdentity));

import { ROOT_PATH } from "./constants.js";
import { dataplannerEnforce } from "./dataplannerEnforce.js";
import { defer, Deferred } from "./deferred.js";
// Handy for debugging
import { isDev, noop } from "./dev.js";
import { OperationPlan } from "./engine/OperationPlan.js";
import { CrystalError, isCrystalError } from "./error.js";
import { DataPlannerExecuteOptions, execute } from "./execute.js";
import { InputStep } from "./input.js";
import {
  $$bypassGraphQL,
  $$data,
  $$eventEmitter,
  $$extensions,
  $$idempotent,
  $$verbatim,
  ArgumentApplyPlanResolver,
  ArgumentInputPlanResolver,
  BaseEventMap,
  BaseGraphQLArguments,
  BaseGraphQLContext,
  BaseGraphQLRootValue,
  BaseGraphQLVariables,
  CrystalResultsList,
  CrystalResultStreamList,
  CrystalSubscriber,
  CrystalValuesList,
  DataPlannerArgumentExtensions,
  DataPlannerEnumValueExtensions,
  DataPlannerFieldExtensions,
  DataPlannerInputFieldExtensions,
  DataPlannerObjectTypeExtensions,
  EnumValueApplyPlanResolver,
  EventCallback,
  EventMapKey,
  ExecutionEventEmitter,
  ExecutionEventMap,
  ExecutionExtra,
  FieldArgs,
  FieldPlanResolver,
  GraphileArgumentConfig,
  GraphileFieldConfig,
  GraphileFieldConfigArgumentMap,
  GraphileInputFieldConfig,
  InputObjectFieldApplyPlanResolver,
  InputObjectFieldInputPlanResolver,
  InputObjectTypeInputPlanResolver,
  NodeIdCodec,
  NodeIdHandler,
  OutputPlanForType,
  PolymorphicData,
  PromiseOrDirect,
  ScalarPlanResolver,
  StepOptimizeOptions,
  StepStreamOptions,
  TypedEventEmitter,
} from "./interfaces.js";
import { polymorphicWrap, resolveType } from "./polymorphic.js";
import {
  $$crystalWrapped,
  crystalResolve,
  CrystalWrapDetails,
  dataplannerResolver,
  dataplannerSubscriber,
  isCrystalWrapped,
} from "./resolvers.js";
import {
  assertListCapableStep,
  BaseStep,
  ExecutableStep,
  isExecutableStep,
  isListCapableStep,
  isModifierStep,
  isObjectLikeStep,
  isStreamableStep,
  ListCapableStep,
  ModifierStep,
  ObjectLikeStep,
  PolymorphicStep,
  StreamableStep,
} from "./step.js";
import { __InputListStep } from "./steps/__inputList.js";
import {
  __InputObjectStep,
  __InputStaticLeafStep,
  __ItemStep,
  __ListTransformStep,
  __TrackedObjectStep,
  __ValueStep,
  access,
  AccessStep,
  ActualKeyByDesiredKey,
  connection,
  ConnectionCapableStep,
  ConnectionStep,
  constant,
  ConstantStep,
  context,
  debugPlans,
  each,
  EdgeCapableStep,
  EdgeStep,
  filter,
  FilterPlanMemo,
  first,
  FirstStep,
  groupBy,
  GroupByPlanMemo,
  lambda,
  LambdaStep,
  last,
  LastStep,
  list,
  listen,
  ListenStep,
  ListStep,
  listTransform,
  ListTransformItemPlanCallback,
  ListTransformOptions,
  ListTransformReduce,
  makeMapper,
  map,
  MapStep,
  node,
  NodeStep,
  object,
  ObjectPlanMeta,
  ObjectStep,
  operationPlan,
  PageInfoCapableStep,
  partitionByIndex,
  reverse,
  reverseArray,
  ReverseStep,
  setter,
  SetterCapableStep,
  SetterStep,
  specFromNodeId,
} from "./steps/index.js";
import { stripAnsi } from "./stripAnsi.js";
import { subscribe } from "./subscribe.js";
import {
  arrayOfLength,
  arraysMatch,
  getEnumValueConfig,
  GraphileInputFieldConfigMap,
  GraphileInputObjectType,
  GraphileObjectType,
  inputObjectFieldSpec,
  InputObjectTypeSpec,
  isPromiseLike,
  newGraphileFieldConfigBuilder,
  newInputObjectTypeBuilder,
  newObjectTypeBuilder,
  objectFieldSpec,
  objectSpec,
  ObjectTypeFields,
  ObjectTypeSpec,
  planGroupsOverlap,
  stepADependsOnStepB,
} from "./utils.js";

export { isAsyncIterable } from "iterall";
export {
  __InputListStep,
  __InputObjectStep,
  __InputStaticLeafStep,
  __ItemStep,
  __ListTransformStep,
  __TrackedObjectStep,
  __ValueStep,
  $$bypassGraphQL,
  $$crystalWrapped,
  $$data,
  $$eventEmitter,
  $$extensions,
  $$idempotent,
  $$verbatim,
  access,
  AccessStep,
  ActualKeyByDesiredKey,
  ArgumentApplyPlanResolver,
  ArgumentInputPlanResolver,
  arrayOfLength,
  arraysMatch,
  assertListCapableStep,
  BaseEventMap,
  BaseGraphQLArguments,
  BaseGraphQLContext,
  BaseGraphQLRootValue,
  BaseGraphQLVariables,
  BaseStep,
  connection,
  ConnectionCapableStep,
  ConnectionStep,
  constant,
  ConstantStep,
  context,
  CrystalError,
  CrystalPlans,
  crystalPrint,
  crystalPrintPathIdentity,
  crystalResolve,
  CrystalResultsList,
  CrystalResultStreamList,
  CrystalSubscriber,
  CrystalValuesList,
  CrystalWrapDetails,
  DataPlannerArgumentExtensions,
  dataplannerEnforce,
  DataPlannerEnumValueExtensions,
  DataPlannerExecuteOptions,
  DataPlannerFieldExtensions,
  DataPlannerInputFieldExtensions,
  DataPlannerObjectTypeExtensions,
  dataplannerResolver,
  dataplannerSubscriber,
  debugPlans,
  defer,
  Deferred,
  each,
  EdgeCapableStep,
  EdgeStep,
  EnumPlans,
  EnumValueApplyPlanResolver,
  EventCallback,
  EventMapKey,
  ExecutableStep,
  execute,
  ExecutionEventEmitter,
  ExecutionEventMap,
  ExecutionExtra,
  FieldArgs,
  FieldPlanResolver,
  FieldPlans,
  filter,
  FilterPlanMemo,
  first,
  FirstStep,
  getEnumValueConfig,
  GraphileArgumentConfig,
  GraphileFieldConfig,
  GraphileFieldConfigArgumentMap,
  GraphileInputFieldConfig,
  GraphileInputFieldConfigMap,
  GraphileInputObjectType,
  GraphileObjectType,
  groupBy,
  GroupByPlanMemo,
  InputObjectFieldApplyPlanResolver,
  InputObjectFieldInputPlanResolver,
  inputObjectFieldSpec,
  InputObjectPlans,
  InputObjectTypeInputPlanResolver,
  InputObjectTypeSpec,
  InputStep,
  InterfaceOrUnionPlans,
  isCrystalError,
  isCrystalWrapped,
  isDev,
  isExecutableStep,
  isListCapableStep,
  isModifierStep,
  isObjectLikeStep,
  isPromiseLike,
  isStreamableStep,
  lambda,
  LambdaStep,
  last,
  LastStep,
  list,
  ListCapableStep,
  listen,
  ListenStep,
  ListStep,
  listTransform,
  ListTransformItemPlanCallback,
  ListTransformOptions,
  ListTransformReduce,
  makeCrystalSchema,
  makeMapper,
  map,
  MapStep,
  ModifierStep,
  newGraphileFieldConfigBuilder,
  newInputObjectTypeBuilder,
  newObjectTypeBuilder,
  node,
  NodeIdCodec,
  NodeIdHandler,
  NodeStep,
  noop,
  object,
  objectFieldSpec,
  ObjectLikeStep,
  ObjectPlanMeta,
  ObjectPlans,
  objectSpec,
  ObjectStep,
  ObjectTypeFields,
  ObjectTypeSpec,
  OperationPlan,
  operationPlan,
  OutputPlanForType,
  PageInfoCapableStep,
  partitionByIndex,
  planGroupsOverlap,
  PolymorphicData,
  PolymorphicStep,
  polymorphicWrap,
  PrintPlanGraphOptions,
  PromiseOrDirect,
  resolveType,
  reverse,
  reverseArray,
  ReverseStep,
  ROOT_PATH,
  ScalarPlanResolver,
  ScalarPlans,
  setter,
  SetterCapableStep,
  SetterStep,
  specFromNodeId,
  stepADependsOnStepB,
  StepOptimizeOptions,
  StepStreamOptions,
  StreamableStep,
  stripAnsi,
  subscribe,
  TypedEventEmitter,
};

exportAsMany({
  crystalPrint,
  crystalPrintPathIdentity,
  makeCrystalSchema,
  OperationPlan,
  ROOT_PATH,
  defer,
  dataplannerEnforce,
  execute,
  subscribe,
  __InputListStep,
  __InputObjectStep,
  __InputStaticLeafStep,
  assertListCapableStep,
  isExecutableStep,
  isListCapableStep,
  isModifierStep,
  isObjectLikeStep,
  isStreamableStep,
  __ItemStep,
  __ListTransformStep,
  __TrackedObjectStep,
  __ValueStep,
  access,
  AccessStep,
  operationPlan,
  connection,
  ConnectionStep,
  constant,
  ConstantStep,
  context,
  isCrystalError,
  debugPlans,
  each,
  groupBy,
  filter,
  partitionByIndex,
  listTransform,
  first,
  node,
  specFromNodeId,
  NodeStep,
  FirstStep,
  last,
  LastStep,
  lambda,
  LambdaStep,
  list,
  ListStep,
  makeMapper,
  map,
  MapStep,
  object,
  ObjectStep,
  reverse,
  reverseArray,
  ReverseStep,
  setter,
  SetterStep,
  listen,
  ListenStep,
  polymorphicWrap,
  resolveType,
  $$crystalWrapped,
  isCrystalWrapped,
  dataplannerResolver,
  crystalResolve,
  dataplannerSubscriber,
  stripAnsi,
  arraysMatch,
  inputObjectFieldSpec,
  newGraphileFieldConfigBuilder,
  newInputObjectTypeBuilder,
  newObjectTypeBuilder,
  objectFieldSpec,
  objectSpec,
  arrayOfLength,
  stepADependsOnStepB,
  planGroupsOverlap,
  isPromiseLike,
  isDev,
  noop,
  getEnumValueConfig,
});
