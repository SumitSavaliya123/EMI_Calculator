import { Component } from '@angular/core';
import { LoanCalculationComponent } from '../../components/loan-calculation/loan-calculation.component';

@Component({
  selector: 'app-home',
  imports: [LoanCalculationComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {}
