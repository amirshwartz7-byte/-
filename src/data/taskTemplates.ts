import type { ProviderCategory, TaskStage } from "../types";

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  stage: TaskStage;
  offsetDays: number; // negative = days before move date, positive = days after
  category: ProviderCategory | "docs" | "utilities" | "general";
  linkedProviderCategory?: ProviderCategory;
}

export const taskTemplates: TaskTemplate[] = [
  // שלב 1: חודשיים לפני
  {
    id: "t01",
    title: "קביעת תקציב מעבר",
    description:
      "הגדירו תקציב גג למעבר הדירה כדי לעקוב אחרי ההוצאות בהמשך התהליך. אפשר להשתמש במחשבון התקציב באפליקציה.",
    stage: "2mo",
    offsetDays: -60,
    category: "general",
  },
  {
    id: "t02",
    title: "השוואת הצעות מחברות הובלה",
    description:
      "מומלץ לקבל לפחות 3 הצעות מחיר מחברות הובלה שונות. שימו לב לגודל המשאית, מספר עובדים וביטוח על התכולה.",
    stage: "2mo",
    offsetDays: -55,
    category: "moving",
    linkedProviderCategory: "moving",
  },
  {
    id: "t03",
    title: "מיון וגריעת פריטים (דהגה)",
    description:
      "עברו על כל חדר ומיינו פריטים ל'לוקח', 'תורם' ו'זורק'. מעבר דירה הוא ההזדמנות הכי טובה לצמצם עודפים.",
    stage: "2mo",
    offsetDays: -50,
    category: "general",
  },
  {
    id: "t04",
    title: "בדיקת חוזה שכירות / מכר",
    description:
      "ודאו שקראתם את כל סעיפי החוזה החדש, כולל תאריך מסירת מפתח, פיקדון ותנאי ביטול.",
    stage: "2mo",
    offsetDays: -55,
    category: "docs",
  },
  {
    id: "t05",
    title: "עדכון בית ספר / גן לילדים",
    description:
      "אם עוברים עיר, יש להתחיל תהליך רישום/העברה של הילדים למוסדות חינוך חדשים מוקדם ככל האפשר.",
    stage: "2mo",
    offsetDays: -45,
    category: "docs",
  },
  {
    id: "t06",
    title: "איסוף הצעות ממדביר",
    description:
      "מומלץ לבצע הדברה בדירה החדשה לפני ההובלה, כשהיא עדיין ריקה מרהיטים.",
    stage: "2mo",
    offsetDays: -40,
    category: "cleaning",
    linkedProviderCategory: "cleaning",
  },

  // שלב 2: חודש לפני
  {
    id: "t07",
    title: "סגירת חברת הובלה",
    description:
      "לאחר השוואת המחירים, סגרו את חברת ההובלה וקבעו תאריך ושעה מדויקים. בקשו אישור בכתב.",
    stage: "1mo",
    offsetDays: -30,
    category: "moving",
    linkedProviderCategory: "moving",
  },
  {
    id: "t08",
    title: "הזמנת חומרי אריזה",
    description:
      "קרטונים, נייר בועות, סקוץ' ופלסטיק עטיפה. עדיף להזמין כמות גדולה מהמשוער.",
    stage: "1mo",
    offsetDays: -28,
    category: "moving",
    linkedProviderCategory: "moving",
  },
  {
    id: "t09",
    title: "הזמנת ניקיון לדירה הישנה",
    description:
      "תאמו חברת ניקיון לניקיון יסודי של הדירה הישנה לאחר הפינוי, בהתאם לדרישות בעל הבית.",
    stage: "1mo",
    offsetDays: -25,
    category: "cleaning",
    linkedProviderCategory: "cleaning",
  },
  {
    id: "t10",
    title: "תיאום ניתוק/חיבור אינטרנט וכבלים",
    description:
      "הזמינו ניתוק בכתובת הישנה וחיבור מראש בכתובת החדשה, כדי לא להישאר בלי אינטרנט.",
    stage: "1mo",
    offsetDays: -21,
    category: "internet",
    linkedProviderCategory: "internet",
  },
  {
    id: "t11",
    title: "עדכון כתובת בבנק ובחברות האשראי",
    description:
      "עדכנו את הכתובת החדשה בבנק, בחברות האשראי ובחברת הביטוח.",
    stage: "1mo",
    offsetDays: -20,
    category: "docs",
  },
  {
    id: "t12",
    title: "בדיקת מנעולן לדירה החדשה",
    description:
      "משיקולי ביטחון מומלץ להחליף צילינדר/מנעול בדירה החדשה מיד עם קבלת המפתח.",
    stage: "1mo",
    offsetDays: -18,
    category: "handyman",
    linkedProviderCategory: "handyman",
  },
  {
    id: "t13",
    title: "עדכון ביטוח דירה ותכולה",
    description: "ודאו שהביטוח מכסה את הדירה החדשה ואת התכולה גם בזמן ההובלה עצמה.",
    stage: "1mo",
    offsetDays: -15,
    category: "docs",
  },

  // שלב 3: שבוע המעבר
  {
    id: "t14",
    title: "אריזת קופסת חירום",
    description:
      "הכינו קופסה עם פריטים חיוניים ליום הראשון: תרופות, מטענים, מסמכים, כלי מטבח בסיסיים ומצרכי היגיינה.",
    stage: "week",
    offsetDays: -6,
    category: "general",
  },
  {
    id: "t15",
    title: "אריזת שאר הדירה",
    description:
      "סמנו כל קופסה עם החדר היעד והתוכן הכללי, כדי להקל על הפריקה בדירה החדשה.",
    stage: "week",
    offsetDays: -5,
    category: "general",
  },
  {
    id: "t16",
    title: "העברת קריאות מונים (חשמל, מים, גז)",
    description:
      "צלמו את מצב המונים בדירה הישנה והחדשה ביום המעבר ודווחו לחברות הרלוונטיות.",
    stage: "week",
    offsetDays: -2,
    category: "utilities",
  },
  {
    id: "t17",
    title: "עדכון כתובת בדואר ישראל",
    description: "הגדירו העברת דואר זמנית מהכתובת הישנה לחדשה.",
    stage: "week",
    offsetDays: -3,
    category: "docs",
  },
  {
    id: "t18",
    title: "הכנת מזומן לטיפ למובילים",
    description:
      "מקובל לתת טיפ לצוות המוביל בסוף העבודה. הכינו מראש סכום מתאים במזומן.",
    stage: "week",
    offsetDays: -1,
    category: "moving",
  },
  {
    id: "t19",
    title: "יום המעבר - קבלת מפתח ופיקוח על ההובלה",
    description:
      "היו נוכחים בזמן הפריקה והטעינה, וודאו שכל התכולה נספרה והגיעה בשלמותה.",
    stage: "week",
    offsetDays: 0,
    category: "moving",
  },

  // שלב 4: שבוע אחרי המעבר
  {
    id: "t20",
    title: "עדכון כתובת ברשויות (רשות מקומית, ביטוח לאומי, משרד הפנים)",
    description:
      "יש חובה חוקית לעדכן כתובת במשרד הפנים תוך 30 יום ממועד המעבר.",
    stage: "afterWeek",
    offsetDays: 3,
    category: "docs",
  },
  {
    id: "t21",
    title: "פריקה וארגון סופי של הבית",
    description: "התחילו מהחדרים החיוניים - מטבח וחדרי שינה, והמשיכו בהדרגה.",
    stage: "afterWeek",
    offsetDays: 4,
    category: "general",
  },
  {
    id: "t22",
    title: "הכרת השכונה החדשה",
    description:
      "מצאו סופרמרקט, בית מרקחת, רופא משפחה וגני משחקים קרובים לבית החדש.",
    stage: "afterWeek",
    offsetDays: 6,
    category: "general",
  },
  {
    id: "t23",
    title: "תיקונים קטנים בבית החדש",
    description:
      "וילונות, מדפים, הרכבת רהיטים - זה הזמן להזמין הנדימן לכל התיקונים שנצברו.",
    stage: "afterWeek",
    offsetDays: 7,
    category: "handyman",
    linkedProviderCategory: "handyman",
  },
];
