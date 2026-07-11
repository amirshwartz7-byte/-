import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  AppState,
  BudgetCategory,
  Lead,
  LeadStatus,
  Provider,
  ProviderCategory,
  TaskItem,
  TaskTemplateContent,
  UserProfile,
} from "../types";
import {
  defaultTaskTemplateContent,
  generateTasksFromMoveDate,
} from "../utils/taskGenerator";
import { providerCategoryLabels, providers as seedProviders } from "../data/providers";

const STORAGE_KEY = "done-app-state-v2";

const defaultBudgetCategories: BudgetCategory[] = [
  ...(Object.keys(providerCategoryLabels) as ProviderCategory[]).map(
    (key) => ({
      key,
      label: providerCategoryLabels[key].label,
      planned: 0,
      actual: 0,
    })
  ),
  { key: "other", label: "שונות", planned: 0, actual: 0 },
];

const defaultState: AppState = {
  user: {
    name: "",
    authMethod: null,
    moveDate: null,
    fromCity: "",
    toCity: "",
    apartmentSize: null,
    onboardingComplete: false,
  },
  tasks: [],
  leads: [],
  budget: {
    totalBudget: 0,
    categories: defaultBudgetCategories,
  },
  packageSelections: {},
  providers: seedProviders,
  taskTemplateContent: defaultTaskTemplateContent(),
};

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch {
    return defaultState;
  }
}

interface AppContextValue {
  state: AppState;
  setUser: (patch: Partial<UserProfile>) => void;
  completeOnboarding: (data: {
    moveDate: string;
    fromCity: string;
    toCity: string;
    apartmentSize: UserProfile["apartmentSize"];
  }) => void;
  toggleTask: (id: string) => void;
  addCustomTask: (task: Omit<TaskItem, "id" | "custom" | "done">) => void;
  deleteTask: (id: string) => void;
  requestLead: (providerId: string, category: ProviderCategory) => void;
  updateLeadStatus: (
    leadId: string,
    status: LeadStatus,
    closedPrice?: number
  ) => void;
  setTotalBudget: (amount: number) => void;
  setCategoryPlanned: (key: string, amount: number) => void;
  setPackageSelection: (category: ProviderCategory, providerId: string) => void;
  clearPackageSelection: (category: ProviderCategory) => void;
  addProvider: (provider: Omit<Provider, "id">) => void;
  updateProvider: (id: string, patch: Partial<Provider>) => void;
  deleteProvider: (id: string) => void;
  updateTaskTemplateContent: (content: TaskTemplateContent) => void;
  resetApp: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setUser: AppContextValue["setUser"] = (patch) => {
    setState((s) => ({ ...s, user: { ...s.user, ...patch } }));
  };

  const completeOnboarding: AppContextValue["completeOnboarding"] = (
    data
  ) => {
    setState((s) => ({
      ...s,
      user: {
        ...s.user,
        ...data,
        onboardingComplete: true,
      },
      tasks: generateTasksFromMoveDate(data.moveDate, s.taskTemplateContent),
    }));
  };

  const toggleTask = (id: string) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t
      ),
    }));
  };

  const addCustomTask: AppContextValue["addCustomTask"] = (task) => {
    setState((s) => ({
      ...s,
      tasks: [
        ...s.tasks,
        {
          ...task,
          id: `custom-${Date.now()}`,
          custom: true,
          done: false,
        },
      ],
    }));
  };

  const deleteTask = (id: string) => {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  };

  const requestLead: AppContextValue["requestLead"] = (
    providerId,
    category
  ) => {
    setState((s) => {
      const already = s.leads.find(
        (l) => l.providerId === providerId && l.status !== "closed"
      );
      if (already) return s;
      const lead: Lead = {
        id: `lead-${Date.now()}`,
        providerId,
        category,
        status: "sent",
        createdAt: new Date().toISOString(),
      };
      return { ...s, leads: [...s.leads, lead] };
    });
  };

  const updateLeadStatus: AppContextValue["updateLeadStatus"] = (
    leadId,
    status,
    closedPrice
  ) => {
    setState((s) => {
      const lead = s.leads.find((l) => l.id === leadId);
      if (!lead) return s;
      const updatedLeads = s.leads.map((l) =>
        l.id === leadId ? { ...l, status, closedPrice } : l
      );
      let categories = s.budget.categories;
      if (status === "closed" && closedPrice !== undefined) {
        categories = categories.map((c) =>
          c.key === lead.category
            ? { ...c, actual: c.actual + closedPrice }
            : c
        );
      }
      return {
        ...s,
        leads: updatedLeads,
        budget: { ...s.budget, categories },
      };
    });
  };

  const setTotalBudget = (amount: number) => {
    setState((s) => ({
      ...s,
      budget: { ...s.budget, totalBudget: amount },
    }));
  };

  const setCategoryPlanned = (key: string, amount: number) => {
    setState((s) => ({
      ...s,
      budget: {
        ...s.budget,
        categories: s.budget.categories.map((c) =>
          c.key === key ? { ...c, planned: amount } : c
        ),
      },
    }));
  };

  const setPackageSelection: AppContextValue["setPackageSelection"] = (
    category,
    providerId
  ) => {
    setState((s) => {
      const provider = s.providers.find((p) => p.id === providerId);
      return {
        ...s,
        packageSelections: { ...s.packageSelections, [category]: providerId },
        budget: provider
          ? {
              ...s.budget,
              categories: s.budget.categories.map((c) =>
                c.key === category ? { ...c, planned: provider.avgPrice } : c
              ),
            }
          : s.budget,
      };
    });
    requestLead(providerId, category);
  };

  const clearPackageSelection = (category: ProviderCategory) => {
    setState((s) => {
      const next = { ...s.packageSelections };
      delete next[category];
      return { ...s, packageSelections: next };
    });
  };

  const addProvider: AppContextValue["addProvider"] = (provider) => {
    setState((s) => ({
      ...s,
      providers: [
        ...s.providers,
        { ...provider, id: `provider-${Date.now()}` },
      ],
    }));
  };

  const updateProvider: AppContextValue["updateProvider"] = (id, patch) => {
    setState((s) => ({
      ...s,
      providers: s.providers.map((p) =>
        p.id === id ? { ...p, ...patch } : p
      ),
    }));
  };

  const deleteProvider = (id: string) => {
    setState((s) => ({
      ...s,
      providers: s.providers.filter((p) => p.id !== id),
    }));
  };

  const updateTaskTemplateContent: AppContextValue["updateTaskTemplateContent"] =
    (content) => {
      setState((s) => ({
        ...s,
        taskTemplateContent: s.taskTemplateContent.map((c) =>
          c.id === content.id ? content : c
        ),
        tasks: s.tasks.map((t) =>
          t.id === content.id && !t.custom
            ? { ...t, title: content.title, description: content.description }
            : t
        ),
      }));
    };

  const resetApp = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(defaultState);
  };

  return (
    <AppContext.Provider
      value={{
        state,
        setUser,
        completeOnboarding,
        toggleTask,
        addCustomTask,
        deleteTask,
        requestLead,
        updateLeadStatus,
        setTotalBudget,
        setCategoryPlanned,
        setPackageSelection,
        clearPackageSelection,
        addProvider,
        updateProvider,
        deleteProvider,
        updateTaskTemplateContent,
        resetApp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
