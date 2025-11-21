import { CREDIT_TRANSACTION_TYPE } from '../types';

export type CreditCommand = {
  userId: string;
  type: CREDIT_TRANSACTION_TYPE;
  amount: number;
  description: string;
  expireDays?: number;
  paymentId?: string;
  periodKey?: number;
};

export type CreditCommandError = {
  userId: string;
  type: CREDIT_TRANSACTION_TYPE;
  error: unknown;
};

export type CommandExecutionResult = {
  total: number;
  processed: number;
  skipped: number;
  errors: CreditCommandError[];
  flagEnabled: boolean;
};
