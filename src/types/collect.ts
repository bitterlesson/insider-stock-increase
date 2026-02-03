export interface CollectResult {
  success: boolean;
  processed: number;
  newEvents: number;
  errors: string[];
  emailSent: boolean;
  message?: string;
}

export interface CollectProgress {
  current: number;
  total: number;
}
