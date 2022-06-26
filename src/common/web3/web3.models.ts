export interface GetAddressResult {
  isValid: boolean;
  address?: string;
  error?: Error;
}

export interface GetResult {
  isValid: boolean;
  error?: Error;
}
