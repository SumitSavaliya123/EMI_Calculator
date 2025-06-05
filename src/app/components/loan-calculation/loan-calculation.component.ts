import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import Chart from 'chart.js/auto';
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels';
import { CeilPipe } from '../../pipes/ceil.pipe';
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { SliderInputComponent } from '../slider-input/slider-input.component';

Chart.register(ChartDataLabels);

@Component({
  selector: 'app-loan-calculation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSliderModule,
    SliderInputComponent,
    CeilPipe,
    BarChartComponent,
  ],
  templateUrl: './loan-calculation.component.html',
  styleUrls: ['./loan-calculation.component.scss'],
})
export class LoanCalculationComponent implements OnInit {
  loanAmount = 400000;
  interestRate = 8.5;
  loanTenure = 5;
  tenureUnit: 'Yr' | 'Mo' = 'Yr';
  emi = 0;
  totalInterest = 0;
  totalPayment = 0;
  loanStartMonth!: string;
  prepaymentAmount = 0;
  minPrepaymentMonth: string = '';
  prepaymentOption: 'reduceTenure' | 'reduceEMI' = 'reduceTenure';
  prepaymentStartMonth: string = '2025-09';
  originalEmi = 0;
  originalTotalInterest = 0;
  originalTenureInMonths = 0;
  reducedTenureInMonths = 0;
  applyPrepayment = false;
  loanAmountLabels = ['0', '50L', '100L', '150L', '200L'];
  interestRateLabels = ['5', '7.5', '10', '12.5', '15', '17.5', '20'];
  yearTenureLabels = ['0', '5', '10', '15', '20', '25', '30'];
  monthTenureLabels = ['0', '60', '120', '180', '240', '300', '360'];
  chart: Chart | undefined;

  @ViewChild('loanChart', { static: true }) loanChart!: ElementRef;

  ngOnInit() {
    const now = new Date();
    this.loanStartMonth = new Date().toISOString().slice(0, 7);
    const minPrepayDate = new Date(now.getFullYear(), now.getMonth() + 2);
    this.minPrepaymentMonth = minPrepayDate.toISOString().slice(0, 7);
    this.calculateEMI();
  }

  get tenureInMonths(): number {
    return this.tenureUnit === 'Yr' ? this.loanTenure * 12 : this.loanTenure;
  }

  setTenureUnit(unit: 'Yr' | 'Mo') {
    if (unit === this.tenureUnit) return;

    if (unit === 'Mo') {
      this.loanTenure = Math.round(this.loanTenure * 12);
    } else {
      this.loanTenure = +(this.loanTenure / 12).toFixed(2);
    }

    this.tenureUnit = unit;
    this.calculateEMI();
  }

  onPrepaymentStartMonthChange(newMonth: string) {
    this.prepaymentStartMonth = newMonth;
    if (this.applyPrepayment) {
      this.calculateEMI();
    }
  }

  onPrepaymentOptionChange() {
    this.applyPrepayment = true;
    this.calculateEMI();
  }

  onPrepaymentAmountChange(amount: number) {
    this.prepaymentAmount = amount;
    this.applyPrepayment = true;
    this.calculateEMI();
  }

  calculateEMI() {
    const P = this.loanAmount;
    const R = this.interestRate / (12 * 100);
    const N = this.tenureInMonths;

    if (R === 0 || N === 0) {
      this.emi = 0;
      this.totalPayment = 0;
      this.totalInterest = 0;
      this.updateChart();
      return;
    }

    // Base calculation without prepayment
    this.originalEmi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    this.originalTotalInterest = this.originalEmi * N - P;
    this.originalTenureInMonths = N;
    this.reducedTenureInMonths = N;

    // Default values without prepayment
    this.emi = this.originalEmi;
    this.totalInterest = this.originalTotalInterest;
    this.totalPayment = this.emi * N;

    if (this.applyPrepayment && this.prepaymentAmount > 0) {
      // Calculate prepayment month index
      const loanStartDate = new Date(`${this.loanStartMonth}-01`);
      const prepaymentDate = new Date(`${this.prepaymentStartMonth}-01`);
      let prepaymentMonthIndex = 0;

      if (prepaymentDate > loanStartDate) {
        const startYear = loanStartDate.getFullYear();
        const startMonth = loanStartDate.getMonth();
        const endYear = prepaymentDate.getFullYear();
        const endMonth = prepaymentDate.getMonth();
        prepaymentMonthIndex =
          (endYear - startYear) * 12 + (endMonth - startMonth);
      }

      // Simulate EMI schedule up to prepayment month
      let balance = this.loanAmount;
      let totalInterestPaid = 0;
      let monthIndex = 0;
      let prepaymentApplied = false;
      let emi = this.originalEmi;

      while (balance > 0.5 && monthIndex < 1000) {
        if (monthIndex === prepaymentMonthIndex && !prepaymentApplied) {
          balance -= this.prepaymentAmount;
          prepaymentApplied = true;

          if (this.prepaymentOption === 'reduceTenure') {
            // EMI remains the same, tenure reduces naturally
            emi = this.originalEmi;
          } else {
            // Recalculate EMI for the remaining months
            const remainingMonths = this.tenureInMonths - monthIndex;
            if (remainingMonths > 0) {
              emi =
                (balance * R * Math.pow(1 + R, remainingMonths)) /
                (Math.pow(1 + R, remainingMonths) - 1);
            }
          }
        }

        const interest = balance * R;
        const principal = emi - interest;
        balance -= principal;

        if (balance < 0 && balance > -1) balance = 0;

        totalInterestPaid += interest;
        monthIndex++;

        if (balance <= 0) break;
      }

      // Update metrics based on the new schedule
      this.reducedTenureInMonths = monthIndex;
      this.emi =
        this.prepaymentOption === 'reduceTenure' ? this.originalEmi : emi;
      this.totalInterest = totalInterestPaid;
      this.totalPayment =
        this.emi * prepaymentMonthIndex +
        this.emi * (this.reducedTenureInMonths - prepaymentMonthIndex) +
        this.prepaymentAmount;
    }

    this.updateChart();
  }

  updateChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(this.loanChart.nativeElement, {
      type: 'pie',
      data: {
        labels: ['Principal Loan Amount', 'Total Interest'],
        datasets: [
          {
            data: [this.loanAmount, this.totalInterest],
            backgroundColor: ['#76A82B', '#F7931E'],
            borderColor: '#eeeeee',
            borderWidth: 10,
            hoverOffset: 8,
            hoverBorderColor: '#eeeeee',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            backgroundColor: '#fff',
            borderColor: '#f7931e',
            borderWidth: 1,
            bodyColor: '#000',
            callbacks: {
              title: () => '',
              label: (context) => {
                const label = context.label || '';
                const data = context.chart.data.datasets[0].data as number[];
                const value = context.raw as number;
                return `${label}: ${this.getPercentage(value, data)}%`;
              },
            },
          },
          datalabels: {
            color: '#fff',
            font: {
              weight: 'bold',
              size: 14,
            },
            formatter: (value: number, ctx: Context) => {
              const data = ctx.chart.data.datasets[0].data as number[];
              return `${this.getPercentage(value, data)}%`;
            },
          },
        },
      },
      plugins: [ChartDataLabels],
    });
  }

  private getPercentage(value: number, data: number[]): string {
    const total = data.reduce((sum, val) => sum + val, 0);
    return ((value / total) * 100).toFixed(1);
  }
}
