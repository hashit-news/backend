export class ProblemDetail {
  status: number;
  title: string;
  type: string;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}

export class ErrorDetail {
  message: string;
  error?: {
    type?: string;
    instance?: string;
    detail?: string;
  };
}
