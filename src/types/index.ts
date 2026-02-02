// ============================================
// LaserPark PWA - TypeScript Interfaces
// ============================================

// --- Enums ---
export type UserRole = 'super_admin' | 'manager' | 'staff';
export type CategoryType = 'revenue' | 'expense';
export type PaymentMethod = 'cash' | 'wave' | 'orange_money';
export type StockMovementType = 'entry' | 'exit' | 'adjustment';
export type ClosureStatus = 'pending' | 'validated' | 'locked';

// --- Park ---
export interface Park {
  id: string;
  name: string;
  country: string;
  city: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- User ---
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  park_id: string | null; // null for super_admin
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Category ---
export interface Category {
  id: string;
  park_id: string;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  impacts_stock: boolean;
  stock_item_id?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// --- Activity (Caisse Live) ---
export type ActivityStatus = 'active' | 'cancelled';

export interface Activity {
  id: string;
  park_id: string;
  category_id: string;
  amount: number;
  quantity: number;
  payment_method: PaymentMethod;
  comment?: string;
  created_by: string;
  activity_date: string;
  created_at: string;
  status: ActivityStatus;
  cancelled_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  // Joined data
  category?: Category;
  user?: User;
}

// --- Expense ---
export interface Expense {
  id: string;
  park_id: string;
  category_id: string;
  amount: number;
  payment_method: PaymentMethod;
  comment?: string;
  attachment_url?: string;
  created_by: string;
  expense_date: string;
  created_at: string;
  // Joined data
  category?: Category;
  user?: User;
}

// --- Stock Item ---
export interface StockItem {
  id: string;
  park_id: string;
  name: string;
  category?: string;
  quantity: number;
  min_threshold: number;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Stock Movement ---
export interface StockMovement {
  id: string;
  stock_item_id: string;
  park_id: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  activity_id?: string;
  created_by: string;
  created_at: string;
  // Joined data
  stock_item?: StockItem;
  user?: User;
}

// --- Daily Closure ---
export interface DailyClosure {
  id: string;
  park_id: string;
  closure_date: string;
  total_revenue: number;
  total_expenses: number;
  net_result: number;
  cash_total: number;
  wave_total: number;
  orange_money_total: number;
  // Cash counting
  cash_counted?: number;
  cash_expected?: number;
  cash_difference?: number;
  // Stats
  activities_count: number;
  expenses_count: number;
  revenue_by_category?: Record<string, number>;
  revenue_by_payment?: Record<string, number>;
  expenses_by_category?: Record<string, number>;
  status: ClosureStatus;
  created_by: string;
  validated_by?: string;
  validated_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Audit Log ---
export interface AuditLog {
  id: string;
  park_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  created_at: string;
}

// --- Dashboard Stats ---
export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netResult: number;
  revenueByPayment: Record<PaymentMethod, number>;
  revenueByCategory: { name: string; amount: number; color?: string }[];
  activityCount: number;
  lowStockAlerts: StockItem[];
}

// --- Form Types ---
export interface ActivityFormData {
  category_id: string;
  amount: number;
  quantity: number;
  payment_method: PaymentMethod;
  comment?: string;
}

export interface ExpenseFormData {
  category_id: string;
  amount: number;
  payment_method: PaymentMethod;
  comment?: string;
}

export interface CategoryFormData {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  impacts_stock: boolean;
  stock_item_id?: string;
}

export interface StockItemFormData {
  name: string;
  category?: string;
  quantity: number;
  min_threshold: number;
  unit: string;
}

// --- Auth ---
export interface AuthState {
  user: User | null;
  session: { access_token: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// --- Payment Method Labels ---
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Espèces',
  wave: 'Wave',
  orange_money: 'Orange Money',
};

export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  cash: '#10b981',
  wave: '#3b82f6',
  orange_money: '#f97316',
};
