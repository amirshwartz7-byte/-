import type { ApartmentSize } from "../types";

// כל המחירים כאן הם הערכות התחלתיות לבדיקת שוק - עדכנו אותם בקובץ הזה בלבד.

export type ServicePackageId = "basic" | "full" | "premium";

export interface ServiceStepTemplate {
  key: string;
  label: string;
  emoji: string;
  /** ימים ביחס לתאריך המעבר (שלילי = לפני) */
  offsetDays: number;
}

export interface ServicePackage {
  id: ServicePackageId;
  name: string;
  tagline: string;
  highlight?: boolean;
  prices: Record<ApartmentSize, number>;
  includes: string[];
  steps: ServiceStepTemplate[];
}

export interface ServiceAddon {
  id: string;
  label: string;
  emoji: string;
  price: number;
  step: ServiceStepTemplate;
}

export const apartmentSizeOptions: { value: ApartmentSize; label: string }[] = [
  { value: "1", label: "חדר 1" },
  { value: "2", label: "2 חדרים" },
  { value: "3", label: "3 חדרים" },
  { value: "4", label: "4 חדרים" },
  { value: "5+", label: "5+ / בית פרטי" },
];

const basicSteps: ServiceStepTemplate[] = [
  { key: "kickoff", label: "שיחת תיאום ותכנון המעבר", emoji: "📞", offsetDays: -30 },
  { key: "internet", label: "תיאום ניתוק וחיבור אינטרנט", emoji: "📡", offsetDays: -14 },
  { key: "moving", label: "הובלה", emoji: "🚚", offsetDays: 0 },
  { key: "cleaning_old", label: "ניקיון הדירה הישנה", emoji: "🧽", offsetDays: 1 },
];

const fullSteps: ServiceStepTemplate[] = [
  ...basicSteps.slice(0, 2),
  { key: "packing", label: "אריזת הדירה", emoji: "📦", offsetDays: -2 },
  { key: "cleaning_new", label: "ניקיון הדירה החדשה", emoji: "✨", offsetDays: -1 },
  { key: "moving", label: "הובלה", emoji: "🚚", offsetDays: 0 },
  { key: "locksmith", label: "החלפת צילינדר בדירה החדשה", emoji: "🔑", offsetDays: 0 },
  { key: "unpacking", label: "פריקה וסידור", emoji: "🏠", offsetDays: 1 },
  { key: "assembly", label: "הרכבת רהיטים", emoji: "🛠️", offsetDays: 1 },
  { key: "cleaning_old", label: "ניקיון הדירה הישנה", emoji: "🧽", offsetDays: 1 },
  { key: "address", label: "עדכון כתובת ברשויות, בנק ודואר", emoji: "📮", offsetDays: 3 },
];

const premiumSteps: ServiceStepTemplate[] = [
  ...fullSteps.slice(0, 2),
  { key: "pest", label: "הדברה בדירה החדשה", emoji: "🌿", offsetDays: -7 },
  ...fullSteps.slice(2),
  { key: "essentials", label: "הבית מוכן: קניות בסיס ומצעים", emoji: "🛒", offsetDays: 0 },
  { key: "closets", label: "ארגון ארונות מקצועי", emoji: "👕", offsetDays: 2 },
  { key: "handyman", label: "הנדימן: וילונות, מדפים ותליות", emoji: "🔧", offsetDays: 5 },
];

export const servicePackages: ServicePackage[] = [
  {
    id: "basic",
    name: "בסיס",
    tagline: "ההובלה והניקיון עלינו",
    prices: { "1": 3900, "2": 4900, "3": 5900, "4": 7400, "5+": 8900 },
    includes: [
      "הובלה עם ספק בדוק ומבוטח",
      "ניקיון הדירה הישנה",
      "תיאום ניתוק וחיבור אינטרנט",
      "מעקב באפליקציה",
    ],
    steps: basicSteps,
  },
  {
    id: "full",
    name: "מלא",
    tagline: "אתם רק מקבלים מפתח",
    highlight: true,
    prices: { "1": 7900, "2": 9900, "3": 12400, "4": 14900, "5+": 17900 },
    includes: [
      "כל מה שבחבילת בסיס",
      "אריזה, פריקה וסידור",
      "הרכבת רהיטים",
      "ניקיון הדירה החדשה",
      "החלפת צילינדר",
      "עדכוני כתובת ברשויות",
      "מנהל מעבר צמוד",
    ],
    steps: fullSteps,
  },
  {
    id: "premium",
    name: "פרימיום",
    tagline: "הבית מוכן מהיום הראשון",
    prices: { "1": 12900, "2": 15900, "3": 19400, "4": 22900, "5+": 26900 },
    includes: [
      "כל מה שבחבילה המלאה",
      "הדברה לפני הכניסה",
      "ארגון ארונות מקצועי",
      "הנדימן לתליות וסידורים",
      "קניות בסיס ומצעים ליום הראשון",
    ],
    steps: premiumSteps,
  },
];

export const serviceAddons: ServiceAddon[] = [
  {
    id: "storage",
    label: "חודש אחסון",
    emoji: "🏬",
    price: 950,
    step: { key: "storage", label: "אחסון זמני", emoji: "🏬", offsetDays: 0 },
  },
  {
    id: "pest",
    label: "הדברה",
    emoji: "🌿",
    price: 650,
    step: { key: "pest", label: "הדברה בדירה החדשה", emoji: "🌿", offsetDays: -7 },
  },
  {
    id: "heavy",
    label: "פריט כבד (פסנתר, כספת)",
    emoji: "🎹",
    price: 900,
    step: { key: "heavy", label: "הובלת פריט כבד", emoji: "🎹", offsetDays: 0 },
  },
  {
    id: "closets",
    label: "ארגון ארונות",
    emoji: "👕",
    price: 1200,
    step: { key: "closets", label: "ארגון ארונות מקצועי", emoji: "👕", offsetDays: 2 },
  },
];

export const INTERCITY_SURCHARGE = 1500;

export function getPackage(id: string): ServicePackage | undefined {
  return servicePackages.find((p) => p.id === id);
}

/** תוספות שכבר כלולות בחבילה לא מוצעות ולא מחויבות */
export function availableAddons(packageId: ServicePackageId): ServiceAddon[] {
  const pkg = getPackage(packageId);
  const included = new Set(pkg?.steps.map((s) => s.key));
  return serviceAddons.filter((a) => !included.has(a.step.key));
}

export interface QuoteInput {
  packageId: ServicePackageId;
  apartmentSize: ApartmentSize;
  addonIds: string[];
  intercity: boolean;
}

export function calculateQuote({
  packageId,
  apartmentSize,
  addonIds,
  intercity,
}: QuoteInput): number {
  const pkg = getPackage(packageId);
  if (!pkg) return 0;
  const addonsTotal = availableAddons(packageId)
    .filter((a) => addonIds.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);
  return pkg.prices[apartmentSize] + addonsTotal + (intercity ? INTERCITY_SURCHARGE : 0);
}

/** שלבי תוכנית המעבר ללקוח: שלבי החבילה + תוספות, ממוינים לפי זמן */
export function buildServiceSteps(
  packageId: ServicePackageId,
  addonIds: string[]
): ServiceStepTemplate[] {
  const pkg = getPackage(packageId);
  if (!pkg) return [];
  const addonSteps = availableAddons(packageId)
    .filter((a) => addonIds.includes(a.id))
    .map((a) => a.step);
  return [...pkg.steps, ...addonSteps].sort((a, b) => a.offsetDays - b.offsetDays);
}

export function formatShekels(amount: number): string {
  return `₪${Math.round(amount).toLocaleString("he-IL")}`;
}

/** מספר וואטסאפ של העסק בפורמט בינלאומי (למשל 972501234567), מוגדר ב-.env */
export const businessWhatsapp =
  (import.meta.env.VITE_BUSINESS_WHATSAPP as string | undefined)?.replace(/\D/g, "") ?? "";

export function whatsappLink(text: string): string | null {
  if (!businessWhatsapp) return null;
  return `https://wa.me/${businessWhatsapp}?text=${encodeURIComponent(text)}`;
}
