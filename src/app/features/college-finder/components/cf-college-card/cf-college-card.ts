import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CFSearchItemDto } from '../../../../core/models/counselling.models';

@Component({
  selector: 'app-cf-college-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cf-college-card.html',
})
export class CfCollegeCardComponent {
  readonly item = input.required<CFSearchItemDto>();
  readonly viewDetail = output<string>();

  protected readonly categoryChip = computed(() => {
    switch (this.item().category?.toLowerCase()) {
      case 'govt': return 'bg-blue-500/15 text-blue-300';
      case 'private': return 'bg-violet-500/15 text-violet-300';
      case 'deemed': return 'bg-teal-500/15 text-teal-300';
      default: return 'bg-slate-500/15 text-slate-300';
    }
  });

  protected readonly statusChip = computed(() => {
    return this.item().nmcStatus?.toLowerCase() === 'recognized'
      ? 'bg-emerald/10 text-emerald'
      : 'bg-amber/10 text-amber';
  });

  protected onViewDetail(): void {
    this.viewDetail.emit(this.item().collegeGuid);
  }
}
