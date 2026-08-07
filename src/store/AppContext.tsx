import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type {
  AppState,
  Budget,
  BudgetCategory,
  Lead,
  LeadStatus,
  Provider,
  ProviderCategory,
  TaskItem,
  TaskTemplateContent,
  UserProfile,
} from "../types";
import { generateTasksFromTripDate } from "../utils/taskGenerator";
import { providerCategoryLabels } from "../data/providers";
import { supabase } from "../lib/supabaseClient";

const defaultCategoryDefs: { key: ProviderCategory | "other"; label: string }[] =
  [
    ...(Object.keys(providerCategoryLabels) as ProviderCategory[]).map(
      (key) => ({ key, label: providerCategoryLabels[key].label })
    ),
    { key: "other" as const, label: "שונות" },
  ];

const emptyUser: UserProfile = {
  id: "",
  email: "",
  name: "",
  tripDate: null,
  departureCity: "",
  resort: "",
  skiLevel: null,
  onboardingComplete: false,
  isAdmin: false,
};

const defaultState: AppState = {
  user: emptyUser,
  tasks: [],
  leads: [],
  budget: { totalBudget: 0, categories: [] },
  packageSelections: {},
  providers: [],
  taskTemplateContent: [],
};

// ---------- row <-> app type mappers ----------

interface ProfileRow {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  departure_city: string | null;
  resort: string | null;
  trip_date: string | null;
  ski_level: string | null;
  onboarding_complete: boolean;
  is_admin: boolean;
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email ?? "",
    name: row.name ?? "",
    phone: row.phone ?? undefined,
    departureCity: row.departure_city ?? "",
    resort: row.resort ?? "",
    tripDate: row.trip_date,
    skiLevel: (row.ski_level as UserProfile["skiLevel"]) ?? null,
    onboardingComplete: row.onboarding_complete,
    isAdmin: row.is_admin,
  };
}

interface TaskRow {
  id: string;
  template_id: string | null;
  title: string;
  description: string | null;
  stage: TaskItem["stage"];
  offset_days: number;
  category: TaskItem["category"];
  linked_provider_category: ProviderCategory | null;
  done: boolean;
  custom: boolean;
  due_date: string | null;
}

function mapTask(row: TaskRow): TaskItem {
  return {
    id: row.id,
    templateId: row.template_id ?? undefined,
    title: row.title,
    description: row.description ?? "",
    stage: row.stage,
    offsetDays: row.offset_days,
    category: row.category,
    linkedProviderCategory: row.linked_provider_category ?? undefined,
    done: row.done,
    custom: row.custom,
    dueDate: row.due_date ?? undefined,
  };
}

interface ProviderRow {
  id: string;
  category: ProviderCategory;
  name: string;
  rating: number;
  price_tag: Provider["priceTag"];
  avg_price: number;
  deal_tag: string | null;
  description: string | null;
  phone: string | null;
  logo_emoji: string | null;
}

function mapProvider(row: ProviderRow): Provider {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    rating: row.rating,
    priceTag: row.price_tag,
    avgPrice: row.avg_price,
    dealTag: row.deal_tag ?? undefined,
    description: row.description ?? "",
    phone: row.phone ?? "",
    logoEmoji: row.logo_emoji ?? "🏢",
  };
}

interface LeadRow {
  id: string;
  provider_id: string;
  category: ProviderCategory;
  status: LeadStatus;
  created_at: string;
  closed_price: number | null;
}

function mapLead(row: LeadRow): Lead {
  return {
    id: row.id,
    providerId: row.provider_id,
    category: row.category,
    status: row.status,
    createdAt: row.created_at,
    closedPrice: row.closed_price ?? undefined,
  };
}

interface TemplateRow {
  id: string;
  title: string;
  description: string;
  stage: TaskItem["stage"];
  offset_days: number;
  category: TaskItem["category"];
  linked_provider_category: ProviderCategory | null;
}

function mapTemplate(row: TemplateRow): TaskTemplateContent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    stage: row.stage,
    offsetDays: row.offset_days,
    category: row.category,
    linkedProviderCategory: row.linked_provider_category ?? undefined,
  };
}

// ---------- context ----------

interface AuthResult {
  error: string | null;
  needsEmailConfirm?: boolean;
}

interface AppContextValue {
  state: AppState;
  session: Session | null;
  authLoading: boolean;
  dataLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  completeOnboarding: (data: {
    tripDate: string;
    departureCity: string;
    resort: string;
    skiLevel: UserProfile["skiLevel"];
  }) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  addCustomTask: (task: Omit<TaskItem, "id" | "custom" | "done">) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  requestLead: (providerId: string, category: ProviderCategory) => Promise<void>;
  updateLeadStatus: (
    leadId: string,
    status: LeadStatus,
    closedPrice?: number
  ) => Promise<void>;
  setTotalBudget: (amount: number) => Promise<void>;
  setCategoryPlanned: (key: string, amount: number) => Promise<void>;
  setPackageSelection: (
    category: ProviderCategory,
    providerId: string
  ) => Promise<void>;
  clearPackageSelection: (category: ProviderCategory) => Promise<void>;
  addProvider: (provider: Omit<Provider, "id">) => Promise<void>;
  updateProvider: (id: string, patch: Partial<Provider>) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  updateTaskTemplateContent: (content: TaskTemplateContent) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function authErrorToHebrew(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "אימייל או סיסמה שגויים";
  }
  if (message.includes("User already registered")) {
    return "כבר קיים חשבון עם האימייל הזה, נסו להתחבר";
  }
  if (message.includes("Password should be at least")) {
    return "הסיסמה חייבת להכיל לפחות 6 תווים";
  }
  if (message.includes("Unable to validate email")) {
    return "כתובת האימייל אינה תקינה";
  }
  return message;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    if (!session) {
      setState(defaultState);
      return;
    }
    void loadAllData(session.user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  async function loadAllData(userId: string) {
    if (!supabase) return;
    setDataLoading(true);
    try {
      const [profileRes, providersRes, templatesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("providers").select("*").order("name"),
        supabase.from("task_templates").select("*").order("offset_days"),
      ]);

      if (profileRes.error || !profileRes.data) {
        console.error("Failed to load profile", profileRes.error);
        setDataLoading(false);
        return;
      }

      const providers = (providersRes.data as ProviderRow[] | null)?.map(
        mapProvider
      ) ?? [];
      const taskTemplateContent =
        (templatesRes.data as TemplateRow[] | null)?.map(mapTemplate) ?? [];

      await ensureBudgetSeeded(userId);

      const [tasksRes, leadsRes, budgetRes, budgetCatRes, pkgRes] =
        await Promise.all([
          supabase
            .from("tasks")
            .select("*")
            .eq("user_id", userId)
            .order("due_date"),
          supabase.from("leads").select("*").eq("user_id", userId),
          supabase
            .from("budgets")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase.from("budget_categories").select("*").eq("user_id", userId),
          supabase
            .from("package_selections")
            .select("*")
            .eq("user_id", userId),
        ]);

      const tasks = (tasksRes.data as TaskRow[] | null)?.map(mapTask) ?? [];
      const leads = (leadsRes.data as LeadRow[] | null)?.map(mapLead) ?? [];
      const categories: BudgetCategory[] =
        (budgetCatRes.data as
          | { key: string; label: string; planned: number; actual: number }[]
          | null
        )?.map((c) => ({
          key: c.key as BudgetCategory["key"],
          label: c.label,
          planned: c.planned,
          actual: c.actual,
        })) ?? [];
      const budget: Budget = {
        totalBudget: (budgetRes.data as { total_budget: number } | null)
          ?.total_budget ?? 0,
        categories,
      };
      const packageSelections: Partial<Record<ProviderCategory, string>> = {};
      (
        pkgRes.data as
          | { category: ProviderCategory; provider_id: string }[]
          | null
      )?.forEach((row) => {
        packageSelections[row.category] = row.provider_id;
      });

      setState({
        user: mapProfile(profileRes.data as ProfileRow),
        tasks,
        leads,
        budget,
        packageSelections,
        providers,
        taskTemplateContent,
      });
    } finally {
      setDataLoading(false);
    }
  }

  async function ensureBudgetSeeded(userId: string) {
    if (!supabase) return;
    const { data: existing } = await supabase
      .from("budget_categories")
      .select("key")
      .eq("user_id", userId);
    if (existing && existing.length > 0) return;

    await supabase.from("budgets").upsert(
      { user_id: userId, total_budget: 0 },
      { onConflict: "user_id" }
    );
    await supabase.from("budget_categories").insert(
      defaultCategoryDefs.map((c) => ({
        user_id: userId,
        key: c.key,
        label: c.label,
        planned: 0,
        actual: 0,
      }))
    );
  }

  const signUp: AppContextValue["signUp"] = async (email, password, name) => {
    if (!supabase) return { error: "החיבור למסד הנתונים לא הוגדר" };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) return { error: authErrorToHebrew(error.message) };
    if (data.user && name) {
      await supabase
        .from("profiles")
        .update({ name })
        .eq("id", data.user.id);
    }
    return { error: null, needsEmailConfirm: !data.session };
  };

  const signIn: AppContextValue["signIn"] = async (email, password) => {
    if (!supabase) return { error: "החיבור למסד הנתונים לא הוגדר" };
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: authErrorToHebrew(error.message) };
    return { error: null };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setState(defaultState);
  };

  const completeOnboarding: AppContextValue["completeOnboarding"] = async (
    data
  ) => {
    if (!supabase || !session) return;
    const userId = session.user.id;
    await supabase
      .from("profiles")
      .update({
        trip_date: data.tripDate,
        departure_city: data.departureCity,
        resort: data.resort,
        ski_level: data.skiLevel,
        onboarding_complete: true,
      })
      .eq("id", userId);

    const newTasks = generateTasksFromTripDate(
      data.tripDate,
      state.taskTemplateContent
    );
    const { data: inserted } = await supabase
      .from("tasks")
      .insert(
        newTasks.map((t) => ({
          user_id: userId,
          template_id: t.templateId,
          title: t.title,
          description: t.description,
          stage: t.stage,
          offset_days: t.offsetDays,
          category: t.category,
          linked_provider_category: t.linkedProviderCategory ?? null,
          done: false,
          custom: false,
          due_date: t.dueDate,
        }))
      )
      .select();

    setState((s) => ({
      ...s,
      user: {
        ...s.user,
        ...data,
        onboardingComplete: true,
      },
      tasks: (inserted as TaskRow[] | null)?.map(mapTask) ?? [],
    }));
  };

  const toggleTask = async (id: string) => {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    const newDone = !task.done;
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: newDone } : t)),
    }));
    if (!supabase) return;
    const { error } = await supabase
      .from("tasks")
      .update({ done: newDone })
      .eq("id", id);
    if (error) console.error("toggleTask failed", error);
  };

  const addCustomTask: AppContextValue["addCustomTask"] = async (task) => {
    if (!supabase || !session) return;
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: session.user.id,
        template_id: null,
        title: task.title,
        description: task.description,
        stage: task.stage,
        offset_days: task.offsetDays,
        category: task.category,
        linked_provider_category: task.linkedProviderCategory ?? null,
        done: false,
        custom: true,
        due_date: task.dueDate ?? null,
      })
      .select()
      .single();
    if (error || !data) {
      console.error("addCustomTask failed", error);
      return;
    }
    setState((s) => ({ ...s, tasks: [...s.tasks, mapTask(data as TaskRow)] }));
  };

  const deleteTask = async (id: string) => {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
    if (!supabase) return;
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) console.error("deleteTask failed", error);
  };

  const requestLead: AppContextValue["requestLead"] = async (
    providerId,
    category
  ) => {
    if (!supabase || !session) return;
    const already = state.leads.find(
      (l) => l.providerId === providerId && l.status !== "closed"
    );
    if (already) return;
    const { data, error } = await supabase
      .from("leads")
      .insert({
        user_id: session.user.id,
        provider_id: providerId,
        category,
        status: "sent",
      })
      .select()
      .single();
    if (error || !data) {
      console.error("requestLead failed", error);
      return;
    }
    setState((s) => ({ ...s, leads: [...s.leads, mapLead(data as LeadRow)] }));
  };

  const updateLeadStatus: AppContextValue["updateLeadStatus"] = async (
    leadId,
    status,
    closedPrice
  ) => {
    const lead = state.leads.find((l) => l.id === leadId);
    if (!lead) return;

    setState((s) => ({
      ...s,
      leads: s.leads.map((l) =>
        l.id === leadId ? { ...l, status, closedPrice } : l
      ),
      budget:
        status === "closed" && closedPrice !== undefined
          ? {
              ...s.budget,
              categories: s.budget.categories.map((c) =>
                c.key === lead.category
                  ? { ...c, actual: c.actual + closedPrice }
                  : c
              ),
            }
          : s.budget,
    }));

    if (!supabase || !session) return;
    const { error } = await supabase
      .from("leads")
      .update({ status, closed_price: closedPrice ?? null })
      .eq("id", leadId);
    if (error) console.error("updateLeadStatus failed", error);

    if (status === "closed" && closedPrice !== undefined) {
      const category = state.budget.categories.find(
        (c) => c.key === lead.category
      );
      const newActual = (category?.actual ?? 0) + closedPrice;
      const { error: catError } = await supabase
        .from("budget_categories")
        .update({ actual: newActual })
        .eq("user_id", session.user.id)
        .eq("key", lead.category);
      if (catError) console.error("budget update failed", catError);
    }
  };

  const setTotalBudget = async (amount: number) => {
    setState((s) => ({ ...s, budget: { ...s.budget, totalBudget: amount } }));
    if (!supabase || !session) return;
    const { error } = await supabase
      .from("budgets")
      .upsert(
        { user_id: session.user.id, total_budget: amount },
        { onConflict: "user_id" }
      );
    if (error) console.error("setTotalBudget failed", error);
  };

  const setCategoryPlanned = async (key: string, amount: number) => {
    setState((s) => ({
      ...s,
      budget: {
        ...s.budget,
        categories: s.budget.categories.map((c) =>
          c.key === key ? { ...c, planned: amount } : c
        ),
      },
    }));
    if (!supabase || !session) return;
    const { error } = await supabase
      .from("budget_categories")
      .update({ planned: amount })
      .eq("user_id", session.user.id)
      .eq("key", key);
    if (error) console.error("setCategoryPlanned failed", error);
  };

  const setPackageSelection: AppContextValue["setPackageSelection"] = async (
    category,
    providerId
  ) => {
    const provider = state.providers.find((p) => p.id === providerId);
    setState((s) => ({
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
    }));

    if (supabase && session) {
      const { error } = await supabase.from("package_selections").upsert(
        { user_id: session.user.id, category, provider_id: providerId },
        { onConflict: "user_id,category" }
      );
      if (error) console.error("setPackageSelection failed", error);
      if (provider) {
        const { error: catError } = await supabase
          .from("budget_categories")
          .update({ planned: provider.avgPrice })
          .eq("user_id", session.user.id)
          .eq("key", category);
        if (catError) console.error("update planned failed", catError);
      }
    }

    await requestLead(providerId, category);
  };

  const clearPackageSelection = async (category: ProviderCategory) => {
    setState((s) => {
      const next = { ...s.packageSelections };
      delete next[category];
      return { ...s, packageSelections: next };
    });
    if (!supabase || !session) return;
    const { error } = await supabase
      .from("package_selections")
      .delete()
      .eq("user_id", session.user.id)
      .eq("category", category);
    if (error) console.error("clearPackageSelection failed", error);
  };

  const addProvider: AppContextValue["addProvider"] = async (provider) => {
    const id = `provider-${Date.now()}`;
    const newProvider: Provider = { ...provider, id };
    setState((s) => ({ ...s, providers: [...s.providers, newProvider] }));
    if (!supabase) return;
    const { error } = await supabase.from("providers").insert({
      id,
      category: provider.category,
      name: provider.name,
      rating: provider.rating,
      price_tag: provider.priceTag,
      avg_price: provider.avgPrice,
      deal_tag: provider.dealTag ?? null,
      description: provider.description,
      phone: provider.phone,
      logo_emoji: provider.logoEmoji,
    });
    if (error) console.error("addProvider failed", error);
  };

  const updateProvider: AppContextValue["updateProvider"] = async (
    id,
    patch
  ) => {
    setState((s) => ({
      ...s,
      providers: s.providers.map((p) =>
        p.id === id ? { ...p, ...patch } : p
      ),
    }));
    if (!supabase) return;
    const dbPatch: Record<string, unknown> = {};
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.rating !== undefined) dbPatch.rating = patch.rating;
    if (patch.priceTag !== undefined) dbPatch.price_tag = patch.priceTag;
    if (patch.avgPrice !== undefined) dbPatch.avg_price = patch.avgPrice;
    if (patch.dealTag !== undefined) dbPatch.deal_tag = patch.dealTag ?? null;
    if (patch.description !== undefined)
      dbPatch.description = patch.description;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone;
    if (patch.logoEmoji !== undefined) dbPatch.logo_emoji = patch.logoEmoji;
    const { error } = await supabase
      .from("providers")
      .update(dbPatch)
      .eq("id", id);
    if (error) console.error("updateProvider failed", error);
  };

  const deleteProvider = async (id: string) => {
    setState((s) => ({
      ...s,
      providers: s.providers.filter((p) => p.id !== id),
    }));
    if (!supabase) return;
    const { error } = await supabase.from("providers").delete().eq("id", id);
    if (error) console.error("deleteProvider failed", error);
  };

  const updateTaskTemplateContent: AppContextValue["updateTaskTemplateContent"] =
    async (content) => {
      setState((s) => ({
        ...s,
        taskTemplateContent: s.taskTemplateContent.map((c) =>
          c.id === content.id ? content : c
        ),
      }));
      if (!supabase) return;
      const { error } = await supabase
        .from("task_templates")
        .update({ title: content.title, description: content.description })
        .eq("id", content.id);
      if (error) console.error("updateTaskTemplateContent failed", error);
    };

  return (
    <AppContext.Provider
      value={{
        state,
        session,
        authLoading,
        dataLoading,
        signUp,
        signIn,
        signOut,
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
