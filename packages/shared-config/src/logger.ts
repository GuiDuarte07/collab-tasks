import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from "nest-winston";
import { format, transports } from "winston";
import * as fs from "node:fs";
import * as path from "node:path";

export interface LoggerConfig {
  serviceName: string;
  isProd?: boolean;
  logToFile?: boolean;
  logDir?: string;
  prettyConsole?: boolean;
  logLevel?: string;
  consoleLogLevel?: string;
  fileLogLevel?: string;
}

export function createLogger(config: LoggerConfig): any {
  const {
    serviceName,
    isProd = process.env.NODE_ENV === "production",
    logToFile = process.env.LOG_TO_FILE === "1" ||
      process.env.LOG_TO_FILE === "true",
    logDir = process.env.LOG_DIR || "logs",
    prettyConsole = process.env.LOG_PRETTY === "1" ||
      process.env.LOG_PRETTY === "true" ||
      !isProd,
    logLevel = process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
    consoleLogLevel = process.env.CONSOLE_LOG_LEVEL ??
      (isProd ? "info" : "debug"),
    fileLogLevel = process.env.FILE_LOG_LEVEL ?? (isProd ? "info" : "debug"),
  } = config;

  if (logToFile) {
    const full = path.resolve(process.cwd(), logDir);
    fs.mkdirSync(full, { recursive: true });
  }

  return WinstonModule.createLogger({
    level: logLevel,
    defaultMeta: { service: serviceName },
    transports: [
      new transports.Console({
        level: consoleLogLevel,
        format: prettyConsole
          ? format.combine(
              format.timestamp(),
              nestWinstonModuleUtilities.format.nestLike(serviceName, {
                colors: true,
                prettyPrint: true,
              })
            )
          : format.combine(format.timestamp(), format.json()),
      }),
      ...(logToFile
        ? [
            new transports.File({
              filename: path.join(logDir, "error.log"),
              level: "error",
              format: format.combine(format.timestamp(), format.json()),
            }),
            new transports.File({
              filename: path.join(logDir, "combined.log"),
              level: fileLogLevel,
              format: format.combine(format.timestamp(), format.json()),
            }),
          ]
        : []),
    ],
  });
}
