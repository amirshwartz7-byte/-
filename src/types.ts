export type SkiLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type TaskStage = "2mo" | "1mo" | "week" | "afterWeek";

export type ProviderCategory = "flights" | "lodging" | "lessons" | "equipment";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  tripDate: string | null;
  departureCity: string;
  resort: string;
  skiLevel: SkiLevel | null;
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
  category: ProviderCategory | "docs" | "general";
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

export interface Guide {
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
  category: ProviderCategory | "docs" | "general";
  linkedProviderCategory?: ProviderCategory;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  departureCity: string;
  resort: string;
  tripDate: string | null;
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
