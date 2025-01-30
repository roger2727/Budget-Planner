export interface ExpenseSource {
    id: string;
    name: string;
    frequency: 'weekly' | 'fortnightly' | 'monthly' | 'annually' | 'quarterly';
    amount: number;
    userId: string;
    isDefault: boolean;
    category: string;
  }