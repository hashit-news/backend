export interface ProblemDetail {
  status: number;
  title: string;
  type: string;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}

export interface ErrorDetail {
  message: string;
  error?: {
    type?: string;
    instance?: string;
    detail?: string;
  };
}
