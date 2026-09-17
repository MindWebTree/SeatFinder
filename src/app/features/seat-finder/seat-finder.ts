import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { CounsellingService } from '../../core/services/counselling.service';
import { AuthService } from '../../core/services/auth.service';
import { SeatFinderRequest, SeatFinderResponse } from '../../core/models/counselling.models';
import { SeatFiltersComponent } from './components/seat-filters/seat-filters';
import { SeatCardComponent } from './components/seat-card/seat-card';

type LoadState = 'idle' | 'loading' | 'error' | 'success';

const PAGE_SIZE = 50;

@Component({
  selector: 'app-seat-finder',
  standalone: true,
  imports: [SeatFiltersComponent, SeatCardComponent, SlicePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seat-finder.html'
})
export class SeatFinderComponent {
  private readonly counsellingService = inject(CounsellingService);
  private readonly authService = inject(AuthService);

  /** Reactive: updates immediately when token changes (login / logout). */
  protected readonly loggedInName = computed(() => this.authService.getLoggedInName());

  protected readonly state = signal<LoadState>('idle');
  protected readonly result = signal<SeatFinderResponse | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly lastQuota = signal<string | undefined>(undefined);

  // Client-side pagination: how many records to show in each section.
  protected readonly visibleBefore = signal(PAGE_SIZE);
  protected readonly visibleReach = signal(PAGE_SIZE);
  protected readonly pageSize = PAGE_SIZE;

  protected onSearch(request: SeatFinderRequest): void {
    this.state.set('loading');
    this.errorMessage.set('');
    this.lastQuota.set(request.quota);
    // Reset pagination on every new search.
    this.visibleBefore.set(PAGE_SIZE);
    this.visibleReach.set(PAGE_SIZE);

    this.counsellingService.searchSeats(request).subscribe({
      next: (response) => {
        this.result.set(response);
        this.state.set('success');
      },
      error: (err) => {
        this.result.set(null);
        this.state.set('error');
        this.errorMessage.set(
          err?.status === 401
            ? 'Your session has expired or the backend requires login for this endpoint.'
            : 'Something went wrong while searching. Please try again.'
        );
      }
    });
  }

  protected logout(): void {
    this.authService.logout();
  }
}
