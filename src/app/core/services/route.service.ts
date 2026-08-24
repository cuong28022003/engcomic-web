import { Injectable, inject } from '@angular/core';
import { Router, RoutesRecognized } from '@angular/router';
import { filter, pairwise } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private router = inject(Router);
  private previousUrl: string | undefined = undefined;

  constructor() {
    this.router.events.pipe(
      filter((e): e is RoutesRecognized => e instanceof RoutesRecognized),
      pairwise()
    ).subscribe((events: [RoutesRecognized, RoutesRecognized]) => {
      this.previousUrl = events[0].urlAfterRedirects;
    });
  }

  getPreviousUrl(): string | undefined {
    return this.previousUrl;
  }

  getCurrentUrl(): string {
    return this.router.url;
  }
}
