export interface YearlyEmi {
  year: string;
  principal: number;
  interest: number;
  balance: number;
  monthlyEmi?: MonthlyEmi[];
  prepayment?: number;
}

export interface MonthlyEmi {
  month: string;
  principal: number;
  interest: number;
  balance: number;
  prepayment?: number;
  totalPayment?: number;
  emi?: number;
}
