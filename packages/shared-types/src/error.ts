export class AppError {
  message: string;
  statusCode?: number;

  constructor(message: string, statusCode?: number);
  constructor(err: unknown, defaults?: { statusCode?: number });
  constructor(arg1: string | unknown, arg2?: number | { statusCode?: number }) {
    if (typeof arg1 === "string") {
      this.message = arg1;
      this.statusCode = typeof arg2 === "number" ? arg2 : undefined;
      return;
    }

    const defaults =
      typeof arg2 === "object" && arg2 !== null && "statusCode" in (arg2 as any)
        ? (arg2 as { statusCode?: number })
        : {};

    let msg = "Unknown error";
    let status: number | undefined = defaults.statusCode;
    const err = arg1;

    if (typeof err === "string") {
      msg = err;
    } else if (err instanceof Error) {
      msg = err.message;
      const anyErr = err as any;
      if (typeof anyErr.statusCode === "number") status = anyErr.statusCode;
      else if (typeof anyErr.status === "number") status = anyErr.status;
    } else if (typeof err === "object" && err !== null) {
      const anyErr = err as any;
      if (typeof anyErr.message === "string") msg = anyErr.message;
      if (typeof anyErr.statusCode === "number") status = anyErr.statusCode;
      else if (typeof anyErr.status === "number") status = anyErr.status;
    }

    this.message = msg;
    this.statusCode = status;
  }

  toObject(): { message: string; statusCode?: number } {
    return { message: this.message, statusCode: this.statusCode };
  }
}
