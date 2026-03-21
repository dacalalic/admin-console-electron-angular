import { Injectable } from '@angular/core';

export type RendererLogLevel = 'info' | 'warn' | 'error';

export interface RendererLogContext {
  [key: string]: string | number | boolean | null | undefined;
}

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  info(source: string, message: string, context?: RendererLogContext): void {
    this.write('info', source, message, context);
  }

  warn(source: string, message: string, context?: RendererLogContext): void {
    this.write('warn', source, message, context);
  }

  error(source: string, message: string, context?: RendererLogContext): void {
    this.write('error', source, message, context);
  }

  private write(
    level: RendererLogLevel,
    source: string,
    message: string,
    context?: RendererLogContext,
  ): void {
    const payload = {
      level,
      source,
      message,
      context: context ?? {},
    };

    if (typeof window.electronApi?.log === 'function') {
      void window.electronApi.log(payload).catch(() => {
        this.fallbackConsole(level, source, message, context);
      });
      return;
    }

    this.fallbackConsole(level, source, message, context);
  }

  private fallbackConsole(
    level: RendererLogLevel,
    source: string,
    message: string,
    context?: RendererLogContext,
  ): void {
    const formatted = `[${source}] ${message}`;

    if (level === 'error') {
      console.error(formatted, context ?? {});
      return;
    }

    if (level === 'warn') {
      console.warn(formatted, context ?? {});
      return;
    }

    console.info(formatted, context ?? {});
  }
}
