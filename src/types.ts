export type ApartmentSize = "1" | "2" | "3" | "4" | "5+";

export type TaskStage = "2mo" | "1mo" | "week" | "afterWeek";

export type ProviderCategory =
  | "moving"
  | "cleaning"
  | "internet"
  | "handyman";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  moveDate: string | null;
  fromCity: string;
  toCity: string;
  apartmentSize: ApartmentSize | null;
  onboardingComplete: boolean;
  isAdmin: boolean;
}

export interface TaskItem {
  id: string;
  templateId?: string;
  title: string;
  description: string;
  stage: TaskStage;
  offsetDays: number;
  category: ProviderCategory | "docs" | "utilities" | "general";
  linkedProviderCategory?: ProviderCategory;
  done: boolean;
  custom: boolean;
  dueDate?: string;
}

export interface Provider {
  id: string;
  category: ProviderCategory;
  name: string;
  rating: number;
  priceTag: "$" | "$$" | "$$$";
  avgPrice: number;
  dealTag?: string;
  description: string;
  phone: string;
  logoEmoji: string;
}

export type LeadStatus = "sent" | "contacted" | "closed";

export interface Lead {
  id: string;
  providerId: string;
  category: ProviderCategory;
  status: LeadStatus;
  createdAt: string;
  closedPrice?: number;
}

export interface BudgetCategory {
  key: ProviderCategory | "other";
  label: string;
  planned: number;
  actual: number;
}

export interface Budget {
  totalBudget: number;
  categories: BudgetCategory[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  topic: string;
  description: string;
  emoji: string;
  link?: string;
}

export interface TaskTemplateContent {
  id: string;
  title: string;
  description: string;
  stage: TaskStage;
  offsetDays: number;
  category: ProviderCategory | "docs" | "utilities" | "general";
  linkedProviderCategory?: ProviderCategory;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  fromCity: string;
  toCity: string;
  moveDate: string | null;
  progress: number;
  createdAt: string;
}

export interface AppState {
  user: UserProfile;
  tasks: TaskItem[];
  leads: Lead[];
  budget: Budget;
  packageSelections: Partial<Record<ProviderCategory, string>>;
  providers: Provider[];
  taskTemplateContent: TaskTemplateContent[];
}
