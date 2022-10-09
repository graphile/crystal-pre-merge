import type { GrafastResultsList, GrafastValuesList } from "../interfaces.js";
import { UnbatchedExecutableStep } from "../step.js";
import { arrayOfLength } from "../utils.js";

export class ErrorStep extends UnbatchedExecutableStep {
  static $$export = {
    moduleName: "grafast",
    exportName: "ErrorStep",
  };
  isSyncAndSafe = false;
  error: Error;
  constructor(error: Error) {
    super();
    if (!(error instanceof Error)) {
      throw new Error(
        `${error} error must be an Error (passed value is not an instanceof Error)`,
      );
    }
    this.error = error;
  }

  execute(values: GrafastValuesList<any>): GrafastResultsList<any> {
    return arrayOfLength(values[0].length, this.error);
  }
  executeSingle(): any {
    return this.error;
  }
}

export function error(error: Error): ErrorStep {
  return new ErrorStep(error);
}
