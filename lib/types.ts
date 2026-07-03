export type Category =
  | 'Food'
  | 'Travel'
  | 'Bills'
  | 'Shopping'
  | 'Entertainment'
  | 'Health'
  | 'Groceries'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Food',
  'Travel',
  'Bills',
  'Shopping',
  'Entertainment',
  'Health',
  'Groceries',
  'Other',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#2a78d6',
  Travel: '#1baf7a',
  Bills: '#eda100',
  Shopping: '#008300',
  Entertainment: '#4a3aa7',
  Health: '#e05c5c',
  Groceries: '#f97316',
  Other: '#71717a',
};

export interface Transaction {
  date: string;   // ISO date string YYYY-MM-DD
  amount: number;
  category: Category;
}

export interface CategoryStat {
  category: Category;
  total: number;
  percent: number;
  color: string;
}

export interface DailyPoint {
  day: number;       // 1-based day of month
  cumulative: number;
}

export interface DashboardData {
  transactions: Transaction[];
  totalSpent: number;
  categoryStats: CategoryStat[];
  dailyPoints: DailyPoint[];
}

export interface MonthSummary {
  yearMonth: string;
  label: string;
  total: number;
  byCategory: Record<Category, number>;
}

export interface Budget {
  monthly_limit: number | null;
}

export interface SheetConfig {
  sheet_id: string;
  sheet_url: string;
}
