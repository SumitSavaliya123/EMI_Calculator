export interface YearlyEmi {
  year: string;
  principal: number;
  interest: number;
  balance: number;
  monthlyEmi?: MonthlyEmi[];
}

export interface MonthlyEmi {
  month: string;
  principal: number;
  interest: number;
  balance: number;
}
