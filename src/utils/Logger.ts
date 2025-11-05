type LogLevel = "debug" | "info" | "warn" | "error" | "none";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

export class Logger {
  private readonly context: string;
  private readonly level: LogLevel;

  constructor(context: string) {
    this.context = context;

    const envLevel =
      (import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined) ?? "info";
    this.level = envLevel;

    this.info(`Logger initialized with level: ${this.level}`);
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  debug(message: string): void {
    if (!this.shouldLog("debug")) return;
    console.debug(`%c[${this.context}] ${message}`, "color: gray");
  }

  info(message: string): void {
    if (!this.shouldLog("info")) return;
    console.info(`%c[${this.context}] ${message}`, "color: dodgerblue");
  }

  warn(message: string): void {
    if (!this.shouldLog("warn")) return;
    console.warn(`%c[${this.context}] ${message}`, "color: orange");
  }

  error(message: string, error?: unknown): void {
    if (!this.shouldLog("error")) return;
    console.error(
      `%c[${this.context}] ${message}`,
      "color: red",
      error ? error : ""
    );
  }
}