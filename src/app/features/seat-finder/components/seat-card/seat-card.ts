import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SeatDto } from '../../../../core/models/counselling.models';

/** 'nearMiss' = closed just before you (amber). 'reach' = within reach (emerald). */
export type SeatCardVariant = 'nearMiss' | 'reach';

@Component({
  selector: 'app-seat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seat-card.html'
})
export class SeatCardComponent {
  readonly seat = input.required<SeatDto>();
  readonly variant = input<SeatCardVariant>('reach');

  protected readonly accentClasses = computed(() =>
    this.variant() === 'nearMiss'
      ? { border: 'border-l-amber', text: 'text-amber', chip: 'bg-amber/10 text-amber' }
      : { border: 'border-l-emerald', text: 'text-emerald', chip: 'bg-emerald/10 text-emerald' }
  );

  protected readonly instituteTypeChip = computed(() => {
    switch (this.seat().instituteType) {
      case 'Govt':
        return 'bg-blue-500/10 text-blue-300';
      case 'Private':
        return 'bg-violet-500/10 text-violet-300';
      case 'Deemed':
        return 'bg-teal-500/10 text-teal-300';
      default:
        return 'bg-slate-500/10 text-slate-300';
    }
  });
}
