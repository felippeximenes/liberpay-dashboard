export interface WeeklySnapshot {
  week: string;
  generatedAt: string;
  ga4: {
    visitors: number;
    newUsers: number;
    leads: number;
    bySource: {
      [source: string]: number;
    };
    topPages: Array<{ page: string; views: number }>;
  };
  pipedrive: {
    leadsCreated: number;
    dealsCreated: number;
    dealsWon: number;
    totalValue: number;
  };
  mailpoet: {
    newSubscribers: number;
    totalSubscribers: number;
    openRate: number;
    automationsActive: number;
  };
  conversion: {
    transactions: number | null;
    revenue: number | null;
  };
  previousWeek?: WeeklySnapshot;
}
