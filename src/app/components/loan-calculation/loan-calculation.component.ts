import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { SliderInputComponent } from '../slider-input/slider-input.component';
import { CeilPipe } from '../../pipes/ceil.pipe';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

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
  chart: any;

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

    // Update or create chart
    this.updateChart();
  }

  updateChart() {
    const data = {
      labels: ['Principal Amount', 'Interest'],
      datasets: [
        {
          data: [this.loanAmount, this.totalInterest],
          backgroundColor: ['#76A82B', '#F7931E'],
          borderColor: '#eeeeee',
          borderWidth: 10,
          hoverOffset: 8,
        },
      ],
    };

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(this.loanChart.nativeElement, {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          datalabels: {
            color: '#fff',
            font: {
              weight: 'bold',
              size: 14,
            },
            formatter: (value, ctx) => {
              const total = ctx.chart.data.datasets[0].data.reduce(
                (sum: any, val: any) => sum + val,
                0
              );
              const percentage = ((value / total) * 100).toFixed(1);
              return `${percentage}%`;
            },
          },
        },
      },
      plugins: [ChartDataLabels],
    });
  }
}
