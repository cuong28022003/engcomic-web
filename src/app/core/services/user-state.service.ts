import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserStats, StreakReward, GachaCharacter } from '@models/index';

@Injectable({ providedIn: 'root' })
export class UserStateService {
  // User stats (XP, diamonds, streak, premium)
  private _userStats$ = new BehaviorSubject<UserStats | null>(null);
  readonly userStats$ = this._userStats$.asObservable();

  // Reward milestones (7, 14, 30 days streak)
  private _streakRewards$ = new BehaviorSubject<StreakReward[]>([
    { milestone: 7, claimedDate: null },
    { milestone: 14, claimedDate: null },
    { milestone: 30, claimedDate: null },
  ]);
  readonly streakRewards$ = this._streakRewards$.asObservable();

  // Selected characters for fighting game
  private _selectedCharacters$ = new BehaviorSubject<GachaCharacter[]>([]);
  readonly selectedCharacters$ = this._selectedCharacters$.asObservable();

  // Adult mode toggle
  private _adultMode$ = new BehaviorSubject<boolean>(false);
  readonly adultMode$ = this._adultMode$.asObservable();

  // Getters
  get userStats(): UserStats | null {
    return this._userStats$.getValue();
  }

  get selectedCharacters(): GachaCharacter[] {
    return this._selectedCharacters$.getValue();
  }

  get adultMode(): boolean {
    return this._adultMode$.getValue();
  }

  // Actions
  setUserStats(stats: UserStats): void {
    this._userStats$.next(stats);
  }

  updateUserStats(partial: Partial<UserStats>): void {
    const current = this._userStats$.getValue();
    if (current) {
      this._userStats$.next({ ...current, ...partial });
    }
  }

  clearUserStats(): void {
    this._userStats$.next(null);
  }

  setSelectedCharacters(characters: GachaCharacter[]): void {
    this._selectedCharacters$.next(characters);
  }

  updateStreakReward(milestone: number, claimedDate: string): void {
    const current = this._streakRewards$.getValue();
    const updated = current.map((r) =>
      r.milestone === milestone ? { ...r, claimedDate } : r
    );
    this._streakRewards$.next(updated);
  }

  resetStreakRewards(): void {
    this._streakRewards$.next([
      { milestone: 7, claimedDate: null },
      { milestone: 14, claimedDate: null },
      { milestone: 30, claimedDate: null },
    ]);
  }

  toggleAdultMode(): void {
    this._adultMode$.next(!this._adultMode$.getValue());
  }

  setAdultMode(enabled: boolean): void {
    this._adultMode$.next(enabled);
  }
}
