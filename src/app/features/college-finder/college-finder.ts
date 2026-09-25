import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CollegeFinderService, CFSearchRequest } from '../../core/services/college-finder.service';
import { CFSearchResponse } from '../../core/models/counselling.models';
import { CfFiltersComponent } from './components/cf-filters/cf-filters';
import { CfCollegeCardComponent } from './components/cf-college-card/cf-college-card';
import { CfCollegeDetailDialogComponent } from './components/cf-college-detail-dialog/cf-college-detail-dialog';

type LoadState = 'idle' | 'loading' | 'error' | 'success';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-college-finder',
  standalone: true,
  imports: [CfFiltersComponent, CfCollegeCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './college-finder.html',
})
export class CollegeFinderComponent {
  private readonly service = inject(CollegeFinderService);
  private readonly dialog = inject(MatDialog);

  protected readonly state = signal<LoadState>('idle');
  protected readonly result = signal<CFSearchResponse | null>(null);
  protected readonly errorMessage = signal('');

  /** Keep the last request so we can load more pages. */
  private lastRequest: CFSearchRequest | null = null;
  protected readonly loadingMore = signal(false);

  protected onSearch(request: CFSearchRequest): void {
    this.lastRequest = request;
    this.state.set('loading');
    this.errorMessage.set('');

    this.service.search({ ...request, page: 1, pageSize: PAGE_SIZE }).subscribe({
      next: (res) => {
        this.result.set(res);
        this.state.set('success');
      },
      error: () => {
        this.result.set(null);
        this.state.set('error');
        this.errorMessage.set('Something went wrong while searching. Please try again.');
      },
    });
  }

  protected loadMore(): void {
    const res = this.result();
    if (!res || !this.lastRequest) return;
    this.loadingMore.set(true);

    const nextPage = res.page + 1;
    this.service.search({ ...this.lastRequest, page: nextPage, pageSize: PAGE_SIZE }).subscribe({
      next: (more) => {
        // Append items to existing result
        this.result.set({ ...more, items: [...res.items, ...more.items] });
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }

  protected openDetail(collegeGuid: string): void {
    this.dialog.open(CfCollegeDetailDialogComponent, {
      data: { collegeGuid },
      panelClass: 'auth-dialog-panel',
      maxWidth: '100vw',
    });
  }
}
