/**
 * Shared Toolkit Errors
 */

export class ToolkitError extends Error {
  public readonly code: string;
  public readonly cause?: unknown;

  constructor(message: string, code = 'TOOLKIT_ERROR', cause?: unknown) {
    super(message);
    this.name = 'ToolkitError';
    this.code = code;
    this.cause = cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends ToolkitError {
  public readonly errors: string[];

  constructor(message: string, errors: string[] = []) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.errors = errors.length > 0 ? errors : [message];
  }
}

export class RenderError extends ToolkitError {
  constructor(message: string, cause?: unknown) {
    super(message, 'RENDER_ERROR', cause);
    this.name = 'RenderError';
  }
}

export class BrowserError extends ToolkitError {
  constructor(message: string) {
    super(message, 'BROWSER_UNSUPPORTED');
    this.name = 'BrowserError';
  }
}
