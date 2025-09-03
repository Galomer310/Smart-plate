export type PlanInfo = {
  enrollDate: string;   // ISO
  startDate: string;    // ISO (diet starts next day)
  endDate: string;      // ISO (start + dietDays - 1)
  dietDays: number;     // total days (e.g., 21)
  todayDietDay: number; // 0 if not started, else 1..dietDays (can exceed)
  expired: boolean;
};
