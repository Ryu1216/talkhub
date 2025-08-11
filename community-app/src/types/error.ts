export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly code?: string;

  constructor(type: ErrorType, message: string, code?: string) {
    super(message);
    this.type = type;
    this.code = code;
    this.name = 'AppError';
  }
}