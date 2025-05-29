import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ceil',
})
export class CeilPipe implements PipeTransform {
  transform(value: number): string {
    const rounded = Math.ceil(value);
    return rounded.toLocaleString('en-IN');
  }
}
