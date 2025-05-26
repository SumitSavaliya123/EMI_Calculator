import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-slider-input',
  standalone: true,
  templateUrl: './slider-input.component.html',
  styleUrls: ['./slider-input.component.scss'],
  imports: [FormsModule, MatSliderModule, MatInputModule, CommonModule],
  providers: [DecimalPipe],
})
export class SliderInputComponent {
  @Input() label!: string;
  @Input() suffix!: string;
  @Input() min!: number;
  @Input() max!: number;
  @Input() step: number = 1;
  @Input() sliderLabels: (number | string)[] = [];
  @Input() showTenureToggle: boolean = false;
  @Input() tenureUnit: 'Yr' | 'Mo' = 'Yr';
  @Input() model!: number;
  @Output() tenureUnitChange = new EventEmitter<'Yr' | 'Mo'>();
  @Output() modelChange = new EventEmitter<number>();
  @Output() valueChanged = new EventEmitter<void>();

  constructor(private decimalPipe: DecimalPipe) {}

  onInputChange(val: string | number) {
    const numValue = typeof val === 'string' ? +val.replace(/,/g, '') : val;
    this.modelChange.emit(+numValue);
    this.valueChanged.emit();
  }

  onBlur(event: FocusEvent) {
    const target = event.target as HTMLInputElement;
    const numValue = +target.value.replace(/,/g, '');
    target.value = this.decimalPipe.transform(numValue) || '';
  }

  toggleTenureUnit(unit: 'Yr' | 'Mo') {
    if (unit !== this.tenureUnit) {
      this.tenureUnit = unit;
      this.tenureUnitChange.emit(unit);
    }
  }
}
