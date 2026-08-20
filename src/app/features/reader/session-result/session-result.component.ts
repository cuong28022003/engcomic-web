import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { GradedQuestion, SubmitSessionResponse } from '../models';

@Component({
  selector: 'app-session-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './session-result.component.html',
  styleUrls: ['./session-result.component.scss']
})
export class SessionResultComponent implements OnInit {
  testId = '';
  result: SubmitSessionResponse | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.testId = params.get('testId') || '';
    });

    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state && nav.extras.state['result']) {
      this.result = nav.extras.state['result'];
    } else if (history.state && history.state.result) {
      this.result = history.state.result;
    }
  }

  get wrongQuestions(): GradedQuestion[] {
    return this.result?.results ? this.result.results.filter(r => !r.isCorrect) : [];
  }

  formatDuration(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m} phút ${s} giây`;
  }
}