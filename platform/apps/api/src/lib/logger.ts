/**
 * Structured logger. Two output modes:
 *
 *   - Local dev (no AWS_LAMBDA_FUNCTION_NAME): coloured single-line format.
 *   - Lambda: JSON line per log entry — picked up by CloudWatch Logs Insights.
 *
 * Per-request logger (createRequestLogger) carries context (requestId, route,
 * userSub) so log output is enrichment-free at call sites.
 */
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

const isLocal = !process.env.AWS_LAMBDA_FUNCTION_NAME;

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  gray: '\x1b[90m',
} as const;

const levelColors: Record<LogLevel, string> = {
  DEBUG: colors.gray,
  INFO: colors.green,
  WARN: colors.yellow,
  ERROR: colors.red,
};

class Logger {
  private context: Record<string, unknown> = {};

  setContext(ctx: Record<string, unknown>) {
    this.context = { ...this.context, ...ctx };
  }

  clearContext() {
    this.context = {};
  }

  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
  ) {
    const timestamp = new Date().toISOString();
    const merged = { ...this.context, ...data };

    if (isLocal) {
      const color = levelColors[level];
      const levelStr = `${color}${level.padEnd(5)}${colors.reset}`;
      const dataStr = Object.keys(merged).length
        ? ` ${colors.gray}${JSON.stringify(merged)}${colors.reset}`
        : '';
      const output = `${colors.gray}${timestamp}${colors.reset} ${levelStr} ${message}${dataStr}`;
      if (level === 'ERROR') console.error(output);
      else if (level === 'WARN') console.warn(output);
      else console.log(output);
    } else {
      const entry: LogEntry = { level, message, timestamp, ...merged };
      const output = JSON.stringify(entry);
      if (level === 'ERROR') console.error(output);
      else if (level === 'WARN') console.warn(output);
      else console.log(output);
    }
  }

  debug(message: string, data?: Record<string, unknown>) {
    if (process.env.LOG_LEVEL === 'DEBUG' || isLocal) {
      this.log('DEBUG', message, data);
    }
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log('INFO', message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log('WARN', message, data);
  }

  error(message: string, error?: unknown, data?: Record<string, unknown>) {
    const errorData =
      error instanceof Error
        ? {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          }
        : error
          ? { error }
          : {};
    this.log('ERROR', message, { ...errorData, ...data });
  }
}

export type { Logger };

/** Module-scoped logger for places without a request context (cron, scripts). */
export const logger = new Logger();

/** Per-request logger — created by the requestLogger middleware. */
export function createRequestLogger() {
  return new Logger();
}
