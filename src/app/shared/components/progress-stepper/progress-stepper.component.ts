import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-stepper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-stepper.component.html',
  styleUrls: ['./progress-stepper.component.scss']
})
export class ProgressStepperComponent {
  readonly steps = input<string[]>([]);
  readonly currentStep = input<number>(0);
  readonly stepChange = output<number>();

  onStepClick(index: number): void {
    this.stepChange.emit(index);
  }
}