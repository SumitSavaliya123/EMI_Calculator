import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { MonthlyEmi, YearlyEmi } from '../../models/yearly-emi';

Chart.register(ChartDataLabels);

@Component({
  selector: 'app-bar-chart',
  imports: [CommonModule, FormsModule],
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss'],
})
export class BarChartComponent implements OnChanges {
  @Input() loanAmount: number = 0;
  @Input() interestRate: number = 0;
  @Input() tenureInMonths: number = 0;
  @Input() originalEmi: number = 0;
  @Input() prepaymentAmount: number = 0;
  @Input() prepaymentOption: 'reduceTenure' | 'reduceEMI' = 'reduceTenure';
  @Input() prepaymentStartMonth: string = new Date().toISOString().slice(0, 7);
  @Input() startDate: string = new Date().toISOString().slice(0, 7);

  @ViewChild('barChart', { static: true }) barChart!: ElementRef;

  stackedBarChart: Chart | undefined;
  yearViewType: 'calendar' | 'financial' = 'calendar';
  emiSchedule: YearlyEmi[] = [];
  expandedIndex: number | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['loanAmount'] ||
      changes['interestRate'] ||
      changes['tenureInMonths'] ||
      changes['emi'] ||
      changes['prepaymentAmount'] ||
      changes['prepaymentOption'] ||
      changes['prepaymentStartMonth'] ||
      changes['startDate']
    ) {
      this.generateBarChart();
    }
  }

  onStartDateChange(newDate: string) {
    this.startDate = newDate;
    this.generateBarChart();
  }

  onYearViewTypeChange(newYearType: 'calendar' | 'financial') {
    this.yearViewType = newYearType;
    this.generateBarChart();
  }

  toggleExpand(index: number) {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  generateBarChart() {
    if (this.stackedBarChart) {
      this.stackedBarChart.destroy();
    }

    const schedule = this.getYearlyEMISchedule();
    this.emiSchedule = schedule;
    const labels = schedule.map((s) => s.year);
    const principalData = schedule.map((s) => s.principal);
    const interestData = schedule.map((s) => s.interest);
    const balanceData = schedule.map((s) => s.balance);

    let dynamicBarThickness = 50;
    if (labels.length >= 10 && labels.length < 20) {
      dynamicBarThickness = Math.max(35, 100 / labels.length);
    } else if (labels.length >= 20) {
      dynamicBarThickness = Math.max(15, 100 / labels.length);
    }

    this.stackedBarChart = new Chart(this.barChart.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Principal',
            data: principalData,
            backgroundColor: '#76A82B',
            stack: 'stack1',
            barThickness: dynamicBarThickness,
            order: 2,
            datalabels: { display: false },
          },
          {
            label: 'Interest',
            data: interestData,
            backgroundColor: '#F7931E',
            stack: 'stack1',
            barThickness: dynamicBarThickness,
            order: 3,
            datalabels: { display: false },
          },
          {
            type: 'line',
            label: 'Balance',
            data: balanceData,
            borderColor: '#C2185B',
            backgroundColor: '#C2185B',
            yAxisID: 'balanceAxis',
            tension: 0.4,
            pointRadius: 4,
            fill: false,
            order: 1,
            clip: false,
            datalabels: { display: false },
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            displayColors: false,
            backgroundColor: '#fff',
            borderColor: (context) => {
              if (
                !context.tooltip.dataPoints ||
                context.tooltip.dataPoints.length === 0
              ) {
                return '#000';
              }
              const datasetLabel = context.tooltip.dataPoints[0].dataset.label;
              if (datasetLabel === 'Principal') return '#76A82B';
              if (datasetLabel === 'Interest') return '#F7931E';
              if (datasetLabel === 'Balance') return '#C2185B';
              return '#000';
            },
            borderWidth: 1,
            bodyColor: '#000',
            titleColor: 'black',
            callbacks: {
              title: (tooltipItems) => `Year: ${tooltipItems[0].label}`,
              label: (context) => {
                const datasetLabel = context.dataset.label;
                const value = Math.ceil(context.raw as number);
                const formattedValue = `₹${value.toLocaleString('en-IN')}`;

                if (datasetLabel === 'Principal') {
                  return `Principal: ${formattedValue}`;
                } else if (datasetLabel === 'Interest') {
                  return `Interest: ${formattedValue}`;
                } else if (datasetLabel === 'Balance') {
                  const loanPaidPercentage = (
                    ((this.loanAmount - value) / this.loanAmount) *
                    100
                  ).toFixed(2);
                  return [
                    `Balance: ${formattedValue}`,
                    `Loan Paid To Date: ${loanPaidPercentage}%`,
                  ];
                }
                return '';
              },
              afterBody: (tooltipItems) => {
                const datasetLabel = tooltipItems[0].dataset.label;
                if (datasetLabel === 'Balance') {
                  return [];
                }
                const chart = tooltipItems[0].chart;
                const dataIndex = tooltipItems[0].dataIndex;
                const principal = Math.ceil(
                  (chart.data.datasets.find((d) => d.label === 'Principal')
                    ?.data?.[dataIndex] as number) ?? 0
                );
                const interest = Math.ceil(
                  (chart.data.datasets.find((d) => d.label === 'Interest')
                    ?.data?.[dataIndex] as number) ?? 0
                );
                const total = principal + interest;
                return [`Total Payment: ₹${total.toLocaleString('en-IN')}`];
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            ticks: { autoSkip: false },
          },
          y: {
            beginAtZero: true,
            position: 'right',
            title: {
              display: true,
              text: 'EMI Payment / Year',
              color: 'black',
              padding: 10,
            },
          },
          balanceAxis: {
            position: 'left',
            beginAtZero: true,
            title: {
              display: true,
              text: 'Balance',
              color: 'black',
              padding: 10,
            },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }

  getYearlyEMISchedule(): YearlyEmi[] {
    const schedule: YearlyEmi[] = [];
    let balance = this.loanAmount;
    const R = this.interestRate / (12 * 100);
    let emi = this.originalEmi;
    let currentDate = new Date(`${this.startDate}-01`);
    let prepaymentApplied = false;
    let monthIndex = 0;

    // Calculate the month index where prepayment should be applied
    const prepaymentDate = new Date(`${this.prepaymentStartMonth}-01`);
    let prepaymentMonthIndex = 0;
    const startDateObj = new Date(`${this.startDate}-01`);
    if (prepaymentDate > startDateObj) {
      const startYear = startDateObj.getFullYear();
      const startMonth = startDateObj.getMonth();
      const endYear = prepaymentDate.getFullYear();
      const endMonth = prepaymentDate.getMonth();
      prepaymentMonthIndex =
        (endYear - startYear) * 12 + (endMonth - startMonth);
    }

    while (balance > 0.5 && monthIndex < 1000) {
      // Apply prepayment at the specified month
      if (monthIndex === prepaymentMonthIndex && !prepaymentApplied) {
        balance -= this.prepaymentAmount;
        prepaymentApplied = true;

        if (this.prepaymentOption === 'reduceTenure') {
          // EMI remains the same, tenure reduces naturally as balance decreases
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

      // Calculate interest for the current month
      const interest = balance * R;

      // Check if this is the final payment
      let principal = 0;
      if (balance * (1 + R) < emi) {
        // Final payment case - just pay the remaining balance plus interest
        principal = balance;
        emi = principal + interest; // Adjust EMI to exact remaining amount
      } else {
        // Normal case
        principal = emi - interest;
      }

      balance -= principal;

      if (balance < 0 && balance > -1) balance = 0;

      const year =
        this.yearViewType === 'calendar'
          ? currentDate.getFullYear().toString()
          : (() => {
              const fyStart =
                currentDate.getMonth() + 1 >= 4
                  ? currentDate.getFullYear()
                  : currentDate.getFullYear() - 1;
              return `FY${(fyStart + 1).toString().slice(-2)}`;
            })();

      const month = currentDate.toLocaleString('default', { month: 'short' });

      let yearData = schedule.find((s) => s.year === year);
      if (!yearData) {
        yearData = {
          year,
          principal: 0,
          interest: 0,
          balance: 0,
          monthlyEmi: [],
          prepayment:
            monthIndex === prepaymentMonthIndex && prepaymentApplied
              ? this.prepaymentAmount
              : 0,
        };
        schedule.push(yearData);
      }

      yearData.principal += principal;
      yearData.interest += interest;
      yearData.balance = balance;
      yearData.monthlyEmi?.push({
        month,
        principal,
        interest,
        balance,
        emi,
        prepayment:
          monthIndex === prepaymentMonthIndex && prepaymentApplied
            ? this.prepaymentAmount
            : 0,
      });

      // Update prepayment amount for the year if applicable
      if (Number(prepaymentDate?.getFullYear()) == Number(year)) {
        yearData.prepayment = this.prepaymentAmount;
      }

      currentDate.setMonth(currentDate.getMonth() + 1);
      monthIndex++;
    }

    return schedule;
  }

  trackByYear(index: number, item: YearlyEmi): string {
    return item.year;
  }

  trackByMonth(index: number, item: MonthlyEmi): string {
    return item.month;
  }
}
