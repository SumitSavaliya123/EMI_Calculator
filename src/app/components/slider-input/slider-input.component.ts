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

  private previousValidValue: number = this.min;

  constructor(private decimalPipe: DecimalPipe) {}

  onKeyDown(event: KeyboardEvent) {
    const allowedKeys = [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '.',
      'Backspace',
      'Delete',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
    ];

    if (!allowedKeys.includes(event.key) && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
    }
  }

  onInputChange(val: string | number) {
    const stringValue =
      typeof val === 'string' ? val.replace(/,/g, '') : val.toString();
    const numValue = parseFloat(stringValue);

    if (isNaN(numValue)) {
      this.modelChange.emit(this.previousValidValue);
      return;
    }

    const clampedValue = Math.min(Math.max(numValue, this.min), this.max);

    if (clampedValue !== this.previousValidValue) {
      this.previousValidValue = clampedValue;
      this.modelChange.emit(clampedValue);
      this.valueChanged.emit();
    }
  }

  onBlur(event: FocusEvent) {
    const target = event.target as HTMLInputElement;
    const numValue = this.previousValidValue;
    target.value = this.decimalPipe.transform(numValue) || '';
  }

  toggleTenureUnit(unit: 'Yr' | 'Mo') {
    if (unit !== this.tenureUnit) {
      this.tenureUnit = unit;
      this.tenureUnitChange.emit(unit);
    }
  }
}
