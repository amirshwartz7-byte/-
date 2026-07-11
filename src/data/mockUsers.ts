export interface MockUser {
  id: string;
  name: string;
  email: string;
  fromCity: string;
  toCity: string;
  moveDate: string;
  progress: number;
  signedUp: string;
}

export const mockUsers: MockUser[] = [
  {
    id: "u1",
    name: "נועה כהן",
    email: "noa.cohen@example.com",
    fromCity: "תל אביב-יפו",
    toCity: "רמת גן",
    moveDate: "2026-08-15",
    progress: 65,
    signedUp: "2026-06-02",
  },
  {
    id: "u2",
    name: "איתי לוי",
    email: "itay.levi@example.com",
    fromCity: "חיפה",
    toCity: "כרמיאל",
    moveDate: "2026-09-01",
    progress: 30,
    signedUp: "2026-06-20",
  },
  {
    id: "u3",
    name: "שירה מזרחי",
    email: "shira.m@example.com",
    fromCity: "באר שבע",
    toCity: "אשדוד",
    moveDate: "2026-07-25",
    progress: 90,
    signedUp: "2026-05-10",
  },
  {
    id: "u4",
    name: "דניאל אברהם",
    email: "daniel.a@example.com",
    fromCity: "ירושלים",
    toCity: "מודיעין-מכבים-רעות",
    moveDate: "2026-10-05",
    progress: 10,
    signedUp: "2026-07-01",
  },
  {
    id: "u5",
    name: "מאיה שגיא",
    email: "maya.sagi@example.com",
    fromCity: "נתניה",
    toCity: "הרצליה",
    moveDate: "2026-08-02",
    progress: 48,
    signedUp: "2026-06-15",
  },
];
