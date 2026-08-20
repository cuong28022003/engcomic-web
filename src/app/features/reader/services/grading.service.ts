import { Injectable } from '@angular/core';
import { GradedQuestion, PartBreakdown, UserAnswerItem } from '../models';

@Injectable({
  providedIn: 'root'
})
export class GradingService {

  grade(
    userAnswers: Map<number, { answer?: string; flagged?: boolean }>,
    answerKeys: Array<{ number: number; part: number; correctAnswer: string }>
  ): {
    rawScore: number;
    totalQuestions: number;
    accuracyPercentage: number;
    results: GradedQuestion[];
    partBreakdown: PartBreakdown[];
  } {
    let rawScore = 0;
    const totalQuestions = answerKeys.length;
    const results: GradedQuestion[] = [];
    const partStats = new Map<number, { correct: number; total: number }>();

    for (const q of answerKeys) {
      if (!partStats.has(q.part)) {
        partStats.set(q.part, { correct: 0, total: 0 });
      }
      const stat = partStats.get(q.part)!;
      stat.total++;

      const uAns = userAnswers.get(q.number);
      const userChoice = uAns?.answer ? uAns.answer.trim().toUpperCase() : undefined;
      const flagged = uAns?.flagged || false;
      const isCorrect = !!userChoice && userChoice === q.correctAnswer.toUpperCase();

      if (isCorrect) {
        rawScore++;
        stat.correct++;
      }

      results.push({
        questionNumber: q.number,
        part: q.part,
        userAnswer: userChoice,
        correctAnswer: q.correctAnswer.toUpperCase(),
        isCorrect,
        flagged
      });
    }

    const partBreakdown: PartBreakdown[] = Array.from(partStats.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([part, stat]) => ({
        part,
        correctCount: stat.correct,
        totalCount: stat.total,
        accuracyPercentage: stat.total > 0 ? Math.round((stat.correct / stat.total) * 1000) / 10 : 0
      }));

    const accuracyPercentage = totalQuestions > 0 ? Math.round((rawScore / totalQuestions) * 1000) / 10 : 0;

    return {
      rawScore,
      totalQuestions,
      accuracyPercentage,
      results,
      partBreakdown
    };
  }
}