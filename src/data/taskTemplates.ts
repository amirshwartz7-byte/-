import type { ProviderCategory, TaskStage } from "../types";

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  stage: TaskStage;
  offsetDays: number; // negative = days before trip date, positive = days after
  category: ProviderCategory | "docs" | "general";
  linkedProviderCategory?: ProviderCategory;
}

export const taskTemplates: TaskTemplate[] = [
  // שלב 1: חודשיים לפני
  {
    id: "t01",
    title: "קביעת תקציב לחופשת הסקי",
    description:
      "הגדירו תקציב גג לחופשת הסקי כדי לעקוב אחרי ההוצאות בהמשך התהליך. אפשר להשתמש במחשבון התקציב באפליקציה.",
    stage: "2mo",
    offsetDays: -60,
    category: "general",
  },
  {
    id: "t02",
    title: "השוואת הצעות טיסות והעברות",
    description:
      "מומלץ לקבל לפחות 3 הצעות מחיר לטיסות ולהעברה מהשדה לאתר. שימו לב לתוספת ציוד סקי במחיר הכרטיס.",
    stage: "2mo",
    offsetDays: -55,
    category: "flights",
    linkedProviderCategory: "flights",
  },
  {
    id: "t03",
    title: "בדיקת דרכון ותוקף ויזה",
    description:
      "ודאו שהדרכון בתוקף לפחות 6 חודשים מיום החזרה, ובדקו אם נדרשת ויזה ליעד שבחרתם.",
    stage: "2mo",
    offsetDays: -55,
    category: "docs",
  },
  {
    id: "t04",
    title: "הזמנת לינה באתר מוקדם",
    description:
      "אתרי הסקי הפופולריים מתמלאים מהר - הזמינו מלון או צ'לט מראש כדי לקבל את המחיר והמיקום הטובים ביותר.",
    stage: "2mo",
    offsetDays: -50,
    category: "lodging",
    linkedProviderCategory: "lodging",
  },
  {
    id: "t05",
    title: "בדיקת ביטוח נסיעות לספורט חורף",
    description:
      "ודאו שהביטוח מכסה במפורש ספורט חורף (סקי/סנובורד מחוץ למסלולים מסומנים לרוב אינו מכוסה).",
    stage: "2mo",
    offsetDays: -45,
    category: "docs",
  },
  {
    id: "t06",
    title: "הרשמה מוקדמת לשיעורי סקי/סנובורד",
    description:
      "אם אתם מתחילים או רוצים לשפר רמה, מומלץ לתאם מדריך פרטי או בית ספר מראש - הביקוש גבוה בעונה.",
    stage: "2mo",
    offsetDays: -40,
    category: "lessons",
    linkedProviderCategory: "lessons",
  },

  // שלב 2: חודש לפני
  {
    id: "t07",
    title: "סגירת חבילת הטיול הסופית",
    description:
      "לאחר השוואת המחירים, סגרו טיסות, לינה והעברות וקבלו אישור בכתב על כל ההזמנות.",
    stage: "1mo",
    offsetDays: -30,
    category: "flights",
    linkedProviderCategory: "flights",
  },
  {
    id: "t08",
    title: "הזמנת/השכרת ציוד סקי מראש",
    description:
      "מגלשיים, מגפיים וקסדה - הזמינו מראש כדי להבטיח מידה נכונה ולחסוך בתור באתר.",
    stage: "1mo",
    offsetDays: -25,
    category: "equipment",
    linkedProviderCategory: "equipment",
  },
  {
    id: "t09",
    title: "רכישת סקי פאס מראש",
    description:
      "כרטיסי מסלולים (Ski Pass) לרוב זולים יותר ברכישה מקוונת מראש לעומת רכישה באתר עצמו.",
    stage: "1mo",
    offsetDays: -20,
    category: "general",
  },
  {
    id: "t10",
    title: "עדכון ביטוח בריאות לחו״ל",
    description: "ודאו שהביטוח הרפואי בתוקף ומכסה טיפולים בחו\"ל וגם פינוי רפואי במקרה פציעה.",
    stage: "1mo",
    offsetDays: -18,
    category: "docs",
  },
  {
    id: "t11",
    title: "תרגול כושר גופני להכנה לסקי",
    description:
      "חיזוק רגליים וליבה מפחית משמעותית סיכון לפציעות. 3-4 שבועות של אימונים קלים עושים הבדל גדול.",
    stage: "1mo",
    offsetDays: -15,
    category: "general",
  },
  {
    id: "t12",
    title: "בדיקת ביגוד תרמי וחורפי",
    description:
      "מעיל ומכנסי סקי אטומים למים, שכבות תרמיות, כפפות ומשקפי סקי - עדיף לבדוק ולהשלים חוסרים מראש.",
    stage: "1mo",
    offsetDays: -12,
    category: "equipment",
  },

  // שלב 3: שבוע לפני הנסיעה
  {
    id: "t13",
    title: "אריזת תיק ציוד הסקי",
    description:
      "ארזו את הביגוד התרמי, המשקפיים, הכפפות וקרם ההגנה. אם שכרתם ציוד באתר - סמנו זאת ברשימה.",
    stage: "week",
    offsetDays: -6,
    category: "general",
  },
  {
    id: "t14",
    title: "הדפסת/הורדת מסמכי טיסה וביטוח",
    description:
      "שמרו עותק דיגיטלי ומודפס של כרטיסי הטיסה, פוליסת הביטוח ואישורי המלון בטלפון ובתיק.",
    stage: "week",
    offsetDays: -5,
    category: "docs",
  },
  {
    id: "t15",
    title: "בדיקת תחזית שלג ומזג אוויר באתר",
    description:
      "עקבו אחר תחזית השלג והטמפרטורות באתר בימים שלפני הנסיעה, כדי להתאים את הביגוד והציפיות.",
    stage: "week",
    offsetDays: -3,
    category: "general",
  },
  {
    id: "t16",
    title: "טעינת אפליקציית מסלולים ומפת האתר",
    description:
      "רוב אתרי הסקי מציעים אפליקציה עם מפת מסלולים, מצב רכבלים בזמן אמת ותחזית - הורידו לפני הטיסה.",
    stage: "week",
    offsetDays: -2,
    category: "general",
  },
  {
    id: "t17",
    title: "יום הנסיעה - צ'ק אין וטיסה",
    description:
      "הגיעו לשדה מוקדם, ודאו שציוד הסקי נרשם כראוי ובדקו שהעברה מהשדה לאתר מתואמת.",
    stage: "week",
    offsetDays: 0,
    category: "flights",
  },

  // שלב 4: אחרי החזרה
  {
    id: "t18",
    title: "החזרת ציוד מושכר ובדיקת פיקדון",
    description:
      "ודאו שהחזרתם את הציוד השכור בזמן ובמצב תקין, ושחררו/בדקו את הפיקדון שהופקד.",
    stage: "afterWeek",
    offsetDays: 2,
    category: "equipment",
    linkedProviderCategory: "equipment",
  },
  {
    id: "t19",
    title: "ניקוי וייבוש ציוד אישי",
    description:
      "אם קניתם ציוד אישי - נגבו ויבשו היטב לפני האחסון כדי למנוע עובש ולשמור על אורך חיי הציוד.",
    stage: "afterWeek",
    offsetDays: 3,
    category: "general",
  },
  {
    id: "t20",
    title: "הגשת תביעת ביטוח (אם נדרש)",
    description:
      "אם היה נזק, פציעה או עיכוב טיסה - הגישו תביעה לחברת הביטוח בהקדם, לרוב יש חלון זמן מוגבל.",
    stage: "afterWeek",
    offsetDays: 4,
    category: "docs",
  },
  {
    id: "t21",
    title: "שיתוף חוויות וכתיבת ביקורת",
    description:
      "דרגו וכתבו חוות דעת על הספקים שעבדתם איתם - זה עוזר לקהילת פאודר קלאב לבחור נכון בפעם הבאה.",
    stage: "afterWeek",
    offsetDays: 6,
    category: "general",
  },
];
