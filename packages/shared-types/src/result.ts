import { AppError } from "./error";

export class Result<T = void> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: AppError;

  private constructor(ok: boolean, data?: T, error?: AppError) {
    this.ok = ok;
    this.data = data;
    this.error = error;
  }

  static ok(): Result<void>;
  static ok<T>(data: T): Result<T>;
  static ok(data?: unknown): Result<any> {
    return new Result(true, data as any, undefined);
  }

  static err<T = void>(error: AppError): Result<T> {
    return new Result<T>(false, undefined, error);
  }

  toObject(): { ok: true; data?: T } | { ok: false; error: AppError } {
    return this.ok
      ? { ok: true, data: this.data }
      : { ok: false, error: this.error as AppError };
  }
}
