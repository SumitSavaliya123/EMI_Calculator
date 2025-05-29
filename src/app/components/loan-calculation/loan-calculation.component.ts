import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import Chart from 'chart.js/auto';
import ChartDataLabels, { Context } from 'chartjs-plugin-datalabels';
import { CeilPipe } from '../../pipes/ceil.pipe';
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
  loanAmountLabels = ['0', '50L', '100L', '150L', '200L'];
  interestRateLabels = ['5', '7.5', '10', '12.5', '15', '17.5', '20'];
  yearTenureLabels = ['0', '5', '10', '15', '20', '25', '30'];
  monthTenureLabels = ['0', '60', '120', '180', '240', '300', '360'];
  chart: Chart | undefined;

  @ViewChild('loanChart', { static: true }) loanChart!: ElementRef;

  ngOnInit() {
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

  calculateEMI() {
    const P = this.loanAmount;
    const R = this.interestRate / (12 * 100);
    const N = this.tenureInMonths;

    if (R === 0 || N === 0) {
      this.emi = 0;
      this.totalPayment = 0;
      this.totalInterest = 0;
      return;
    }

    this.emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    this.totalPayment = this.emi * N;
    this.totalInterest = this.totalPayment - P;

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
            backgroundColor: '#fff', //White BG
            borderColor: '#f7931e', // Orange border
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
