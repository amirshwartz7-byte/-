import { supabase } from "./supabaseClient";
import { buildServiceSteps, type ServicePackageId } from "../data/servicePackages";
import type {
  ApartmentSize,
  ServiceItem,
  ServiceItemStatus,
  ServiceRequest,
  ServiceRequestStatus,
} from "../types";

interface ServiceRequestRow {
  id: string;
  user_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  from_city: string | null;
  to_city: string | null;
  move_date: string | null;
  apartment_size: string;
  package_id: string;
  addons: string[] | null;
  quoted_price: number;
  final_price: number | null;
  status: ServiceRequestStatus;
  notes: string | null;
  created_at: string;
}

interface ServiceItemRow {
  id: string;
  request_id: string;
  key: string;
  label: string;
  emoji: string | null;
  scheduled_date: string | null;
  vendor_name: string | null;
  status: ServiceItemStatus;
  sort: number;
}

export const serviceStatusLabels: Record<
  ServiceRequestStatus,
  { label: string; className: string }
> = {
  new: { label: "בקשה חדשה", className: "bg-blue-50 text-blue-600" },
  contacted: { label: "בתיאום", className: "bg-amber-50 text-amber-600" },
  booked: { label: "הוזמן", className: "bg-violet-50 text-violet-600" },
  in_progress: { label: "בביצוע", className: "bg-brand-50 text-brand-600" },
  completed: { label: "הושלם", className: "bg-green-50 text-green-600" },
  cancelled: { label: "בוטל", className: "bg-gray-100 text-gray-500" },
};

export const serviceItemStatusLabels: Record<ServiceItemStatus, string> = {
  pending: "ממתין לתיאום",
  scheduled: "מתואם",
  done: "בוצע",
};

function mapRequest(row: ServiceRequestRow): ServiceRequest {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? "",
    fromCity: row.from_city ?? "",
    toCity: row.to_city ?? "",
    moveDate: row.move_date,
    apartmentSize: row.apartment_size as ApartmentSize,
    packageId: row.package_id,
    addons: row.addons ?? [],
    quotedPrice: Number(row.quoted_price),
    finalPrice: row.final_price === null ? null : Number(row.final_price),
    status: row.status,
    notes: row.notes ?? "",
    createdAt: row.created_at,
  };
}

function mapItem(row: ServiceItemRow): ServiceItem {
  return {
    id: row.id,
    requestId: row.request_id,
    key: row.key,
    label: row.label,
    emoji: row.emoji ?? "📌",
    scheduledDate: row.scheduled_date,
    vendorName: row.vendor_name ?? "",
    status: row.status,
    sort: row.sort,
  };
}

export interface NewServiceRequest {
  userId: string | null;
  name: string;
  phone: string;
  email: string;
  fromCity: string;
  toCity: string;
  moveDate: string | null;
  apartmentSize: ApartmentSize;
  packageId: ServicePackageId;
  addons: string[];
  quotedPrice: number;
}

/**
 * גם גולשים לא מחוברים יכולים לשלוח בקשה, ולכן לא קוראים את השורה חזרה
 * (RLS מאפשר להם insert בלבד).
 */
export async function submitServiceRequest(
  req: NewServiceRequest
): Promise<string | null> {
  if (!supabase) return "החיבור למסד הנתונים לא הוגדר";
  const { error } = await supabase.from("service_requests").insert({
    user_id: req.userId,
    name: req.name,
    phone: req.phone,
    email: req.email || null,
    from_city: req.fromCity || null,
    to_city: req.toCity || null,
    move_date: req.moveDate || null,
    apartment_size: req.apartmentSize,
    package_id: req.packageId,
    addons: req.addons,
    quoted_price: req.quotedPrice,
  });
  return error ? error.message : null;
}

/** הבקשה העדכנית של המשתמש המחובר (RLS מחזיר רק את שלו), כולל שלבי התוכנית */
export async function fetchMyLatestRequest(
  userId: string
): Promise<{ request: ServiceRequest; items: ServiceItem[] } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const request = mapRequest(data as ServiceRequestRow);
  const items = await fetchServiceItems(request.id);
  return { request, items };
}

export async function fetchServiceItems(requestId: string): Promise<ServiceItem[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("service_items")
    .select("*")
    .eq("request_id", requestId)
    .order("sort");
  return (data as ServiceItemRow[] | null)?.map(mapItem) ?? [];
}

// ---------- admin ----------

export async function fetchAllRequests(): Promise<{
  requests: ServiceRequest[];
  error: string | null;
}> {
  if (!supabase) return { requests: [], error: null };
  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return { requests: [], error: error.message };
  return {
    requests: (data as ServiceRequestRow[]).map(mapRequest),
    error: null,
  };
}

export async function updateServiceRequest(
  id: string,
  patch: Partial<{
    status: ServiceRequestStatus;
    finalPrice: number | null;
    notes: string;
    userId: string | null;
  }>
): Promise<string | null> {
  if (!supabase) return null;
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.finalPrice !== undefined) row.final_price = patch.finalPrice;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.userId !== undefined) row.user_id = patch.userId;
  const { error } = await supabase.from("service_requests").update(row).eq("id", id);
  return error ? error.message : null;
}

/** מחפש משתמש רשום עם אותו אימייל, כדי לשייך אליו בקשה שנשלחה בלי התחברות */
export async function findProfileIdByEmail(email: string): Promise<string | null> {
  if (!supabase || !email) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", email.trim())
    .limit(1)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/** חישוב ב-UTC כדי שמעבר שעון קיץ לא יזיז את התאריך ביום */
function shiftISODate(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** יוצר את תוכנית המעבר מתבנית החבילה. לא עושה כלום אם כבר קיימת תוכנית */
export async function createPlanFromPackage(
  request: ServiceRequest
): Promise<{ items: ServiceItem[]; error: string | null }> {
  if (!supabase) return { items: [], error: null };
  const existing = await fetchServiceItems(request.id);
  if (existing.length > 0) return { items: existing, error: null };

  const steps = buildServiceSteps(request.packageId as ServicePackageId, request.addons);
  const rows = steps.map((s, i) => ({
    request_id: request.id,
    key: s.key,
    label: s.label,
    emoji: s.emoji,
    scheduled_date: request.moveDate
      ? shiftISODate(request.moveDate, s.offsetDays)
      : null,
    status: "pending",
    sort: i,
  }));
  const { data, error } = await supabase.from("service_items").insert(rows).select();
  if (error) return { items: [], error: error.message };
  return {
    items: (data as ServiceItemRow[]).map(mapItem).sort((a, b) => a.sort - b.sort),
    error: null,
  };
}

export async function updateServiceItem(
  id: string,
  patch: Partial<{ status: ServiceItemStatus; vendorName: string; scheduledDate: string | null }>
): Promise<string | null> {
  if (!supabase) return null;
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.vendorName !== undefined) row.vendor_name = patch.vendorName;
  if (patch.scheduledDate !== undefined) row.scheduled_date = patch.scheduledDate;
  const { error } = await supabase.from("service_items").update(row).eq("id", id);
  return error ? error.message : null;
}
