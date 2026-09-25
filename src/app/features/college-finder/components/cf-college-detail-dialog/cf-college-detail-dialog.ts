import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CollegeFinderService } from '../../../../core/services/college-finder.service';
import { CFCollegeDetailResponse } from '../../../../core/models/counselling.models';

type LoadState = 'loading' | 'error' | 'success';

@Component({
  selector: 'app-cf-college-detail-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cf-college-detail-dialog.html',
})
export class CfCollegeDetailDialogComponent implements OnInit {
  private readonly service = inject(CollegeFinderService);
  private readonly dialogRef = inject(MatDialogRef<CfCollegeDetailDialogComponent>);
  protected readonly data = inject<{ collegeGuid: string }>(MAT_DIALOG_DATA);

  protected readonly state = signal<LoadState>('loading');
  protected readonly detail = signal<CFCollegeDetailResponse | null>(null);

  ngOnInit(): void {
    this.service.getCollegeDetail(this.data.collegeGuid).subscribe({
      next: (res) => {
        this.detail.set(res);
        this.state.set('success');
      },
      error: () => this.state.set('error'),
    });
  }

  protected close(): void {
    this.dialogRef.close();
  }

  protected categoryChip(cat: string): string {
    switch (cat?.toLowerCase()) {
      case 'govt': return 'bg-blue-500/15 text-blue-300';
      case 'private': return 'bg-violet-500/15 text-violet-300';
      case 'deemed': return 'bg-teal-500/15 text-teal-300';
      default: return 'bg-slate-500/15 text-slate-300';
    }
  }

  protected statusChip(status: string): string {
    return status?.toLowerCase() === 'recognized'
      ? 'bg-emerald/10 text-emerald'
      : 'bg-amber/10 text-amber';
  }
}
