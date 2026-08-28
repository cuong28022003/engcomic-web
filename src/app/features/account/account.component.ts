import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { UserStateService } from '@core/services/user-state.service';
import { CurrentUser, UserStats } from '@models/index';
import { AvatarFrameComponent } from '@shared/components';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, AvatarFrameComponent],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {
  private auth = inject(AuthService);
  private userState = inject(UserStateService);
  private route = inject(ActivatedRoute);

  userId = '';
  currentUser: CurrentUser | null = null;
  userStats: UserStats | null = null;

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.userId = params['userId'] || this.auth.currentUser?.userId || '';
    });
    this.currentUser = this.auth.currentUser;
    this.userState.userStats$.subscribe((s) => (this.userStats = s));
  }
}
