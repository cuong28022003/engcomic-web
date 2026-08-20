import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MistakeItem } from '../../models';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-mistake-item',
  standalone: true,
  imports: [CommonModule, FormsModule, TimeAgoPipe],
  templateUrl: './mistake-item.component.html',
  styleUrls: ['./mistake-item.component.scss']
})
export class MistakeItemComponent {
  @Input() mistake!: MistakeItem;

  @Output() saveExplanation = new EventEmitter<{ id: string; explanation: string }>();
  @Output() markResolved = new EventEmitter<string>();
  @Output() deleteMistake = new EventEmitter<string>();

  isExpanded = false;
  editExplanation = '';

  ngOnInit() {
    this.editExplanation = this.mistake?.explanation || '';
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  onSave() {
    this.saveExplanation.emit({
      id: this.mistake.id,
      explanation: this.editExplanation
    });
  }

  onResolve() {
    this.markResolved.emit(this.mistake.id);
  }

  onDelete() {
    this.deleteMistake.emit(this.mistake.id);
  }
}