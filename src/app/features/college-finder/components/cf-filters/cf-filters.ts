import {
  ChangeDetectionStrategy, Component, computed, inject,
  OnInit, output, signal, effect
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CollegeFinderService } from '../../../../core/services/college-finder.service';
import {
  CFCourseDto,
  CFStateDto,
  CFCollegeListItemDto,
} from '../../../../core/models/counselling.models';
import { CFSearchRequest } from '../../../../core/services/college-finder.service';

export const MANAGEMENT_OPTIONS = ['All', 'AIQ', 'State', 'Private', 'Deemed'] as const;
export type ManagementOption = typeof MANAGEMENT_OPTIONS[number];

@Component({
  selector: 'app-cf-filters',
  standalone: true,
  imports: [FormsModule, MatSelectModule, MatFormFieldModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cf-filters.html',
})
export class CfFiltersComponent implements OnInit {
  private readonly service = inject(CollegeFinderService);

  readonly search = output<CFSearchRequest>();

  // ── Data ──────────────────────────────────────────────────────────────────
  protected readonly courses = signal<CFCourseDto[]>([]);
  protected readonly states = signal<CFStateDto[]>([]);
  protected readonly colleges = signal<CFCollegeListItemDto[]>([]);
  protected readonly managementOptions = MANAGEMENT_OPTIONS;

  // ── Filters ───────────────────────────────────────────────────────────────
  protected readonly selectedCourseGuid = signal<string | null>(null);
  protected readonly selectedStateGuid = signal<string | null>(null);
  protected readonly selectedManagement = signal<ManagementOption>('All');
  // College picker internal search
  protected readonly collegeSearch = signal<string>('');
  protected readonly selectedCollegeGuid = signal<string | null>(null);
  protected readonly showCollegePicker = signal<boolean>(false);

  // ── Load states ───────────────────────────────────────────────────────────
  protected readonly statesLoading = signal(false);
  protected readonly collegesLoading = signal(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  protected readonly selectedCourse = computed(() =>
    this.courses().find((c) => c.courseGuid === this.selectedCourseGuid()) ?? null
  );

  protected readonly selectedState = computed(() =>
    this.states().find((s) => s.stateGuid === this.selectedStateGuid()) ?? null
  );

  protected readonly selectedCollege = computed(() =>
    this.colleges().find((c) => c.collegeGuid === this.selectedCollegeGuid()) ?? null
  );

  /** Colleges filtered by the inline search text inside the picker. */
  protected readonly filteredColleges = computed(() => {
    const q = this.collegeSearch().toLowerCase().trim();
    if (!q) return this.colleges();
    return this.colleges().filter((c) => c.collegeName.toLowerCase().includes(q));
  });

  protected readonly canSearch = computed(() => !!this.selectedCourseGuid());

  ngOnInit(): void {
    this.service.getCourses().subscribe({
      next: (data) => this.courses.set(data),
      error: (err) => console.error('Failed to load CF courses:', err),
    });
  }

  // ── Events ────────────────────────────────────────────────────────────────

  protected onCourseChange(guid: string | null): void {
    this.selectedCourseGuid.set(guid);
    this.selectedStateGuid.set(null);
    this.selectedCollegeGuid.set(null);
    this.states.set([]);
    this.colleges.set([]);

    if (!guid) return;

    this.statesLoading.set(true);
    this.service.getStates(guid).subscribe({
      next: (data) => {
        this.states.set(data);
        this.statesLoading.set(false);
        // Auto-load colleges for "All states"
        this.loadColleges(guid, undefined);
      },
      error: () => this.statesLoading.set(false),
    });
  }

  protected onStateChange(guid: string | null): void {
    this.selectedStateGuid.set(guid);
    this.selectedCollegeGuid.set(null);
    this.colleges.set([]);

    const courseGuid = this.selectedCourseGuid();
    if (!courseGuid) return;
    this.loadColleges(courseGuid, guid ?? undefined);
  }

  protected onManagementChange(val: ManagementOption): void {
    this.selectedManagement.set(val);
    this.selectedCollegeGuid.set(null);
    // Reload college list with new category filter
    const courseGuid = this.selectedCourseGuid();
    if (!courseGuid) return;
    this.loadColleges(courseGuid, this.selectedStateGuid() ?? undefined);
  }

  protected clearCourse(): void {
    this.onCourseChange(null);
  }

  protected clearState(): void {
    this.onStateChange(null);
  }

  protected openCollegePicker(): void {
    this.collegeSearch.set('');
    this.showCollegePicker.set(true);
  }

  protected closeCollegePicker(): void {
    this.showCollegePicker.set(false);
  }

  protected selectCollege(guid: string | null): void {
    this.selectedCollegeGuid.set(guid);
    this.showCollegePicker.set(false);
  }

  protected submit(): void {
    const courseGuid = this.selectedCourseGuid();
    if (!courseGuid) return;

    const category = this.selectedManagement() !== 'All' ? this.selectedManagement() : undefined;

    this.search.emit({
      courseGuid,
      stateGuid: this.selectedStateGuid() ?? undefined,
      category,
      collegeGuid: this.selectedCollegeGuid() ?? undefined,
    });
  }

  protected resetFilters(): void {
    this.selectedCourseGuid.set(null);
    this.selectedStateGuid.set(null);
    this.selectedManagement.set('All');
    this.selectedCollegeGuid.set(null);
    this.states.set([]);
    this.colleges.set([]);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private loadColleges(courseGuid: string, stateGuid?: string): void {
    const cat = this.selectedManagement() !== 'All' ? this.selectedManagement() : undefined;
    this.collegesLoading.set(true);
    this.service.getColleges(courseGuid, stateGuid, cat).subscribe({
      next: (data) => {
        this.colleges.set(data);
        this.collegesLoading.set(false);
      },
      error: () => this.collegesLoading.set(false),
    });
  }
}
