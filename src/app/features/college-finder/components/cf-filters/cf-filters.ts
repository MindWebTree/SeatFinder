import {
  ChangeDetectionStrategy, Component, computed, inject,
  OnInit, output, signal
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

  // ── Multi-Course Selection ────────────────────────────────────────────────
  /** Null = "All Courses". Array of GUIDs = specific selection. */
  protected readonly selectedCourseGuids = signal<string[] | null>(null);
  /** Whether the course picker sheet is open. */
  protected readonly showCoursePicker = signal(false);
  /** Search text inside the course picker. */
  protected readonly courseSearch = signal('');

  // ── Other Filters ────────────────────────────────────────────────────────
  protected readonly selectedStateGuid = signal<string | null>(null);
  protected readonly selectedManagement = signal<ManagementOption>('All');
  // College picker
  protected readonly collegeSearch = signal<string>('');
  protected readonly selectedCollegeGuid = signal<string | null>(null);
  protected readonly showCollegePicker = signal<boolean>(false);

  // ── Load states ───────────────────────────────────────────────────────────
  protected readonly statesLoading = signal(false);
  protected readonly collegesLoading = signal(false);

  // ── Derived ───────────────────────────────────────────────────────────────

  /** Courses grouped by type (MD / MS). */
  protected readonly coursesByType = computed(() => {
    const map = new Map<string, CFCourseDto[]>();
    for (const c of this.courses()) {
      const group = c.courseType || 'Other';
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(c);
    }
    return map;
  });

  /** Sorted group keys for display. */
  protected readonly courseGroups = computed(() =>
    [...this.coursesByType().keys()].sort()
  );

  /** Whether "All Courses" is active. */
  protected readonly isAllCourses = computed(() => this.selectedCourseGuids() === null);

  /** Effective list of selected GUIDs for API calls (empty array = all). */
  private get effectiveGuids(): string[] {
    return this.selectedCourseGuids() ?? [];
  }

  /** Display label for the course trigger button. */
  protected readonly courseLabel = computed(() => {
    const guids = this.selectedCourseGuids();
    if (guids === null) return 'All Courses';
    if (guids.length === 0) return 'Select course(s)';
    if (guids.length === 1) {
      return this.courses().find((c) => c.courseGuid === guids[0])?.shortName ?? '1 course';
    }
    return `${guids.length} courses selected`;
  });

  /** Courses filtered by the inline search inside the picker. */
  protected readonly filteredCourses = computed(() => {
    const q = this.courseSearch().toLowerCase().trim();
    if (!q) return this.courses();
    return this.courses().filter(
      (c) =>
        c.courseName.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q)
    );
  });

  protected readonly selectedState = computed(() =>
    this.states().find((s) => s.stateGuid === this.selectedStateGuid()) ?? null
  );

  protected readonly selectedCollege = computed(() =>
    this.colleges().find((c) => c.collegeGuid === this.selectedCollegeGuid()) ?? null
  );

  /** Colleges filtered by the inline search inside the picker. */
  protected readonly filteredColleges = computed(() => {
    const q = this.collegeSearch().toLowerCase().trim();
    if (!q) return this.colleges();
    return this.colleges().filter((c) => c.collegeName.toLowerCase().includes(q));
  });

  /** Can search when at least one course is chosen OR "All Courses" is selected. */
  protected readonly canSearch = computed(() =>
    this.isAllCourses() || (this.selectedCourseGuids()?.length ?? 0) > 0
  );

  ngOnInit(): void {
    this.service.getCourses().subscribe({
      next: (data) => {
        this.courses.set(data);
        // Auto-load states & colleges for the default "All Courses" selection
        this._loadStatesAndColleges([]);
      },
      error: (err) => console.error('Failed to load CF courses:', err),
    });
  }

  // ── Course Picker ─────────────────────────────────────────────────────────

  protected openCoursePicker(): void {
    this.courseSearch.set('');
    this.showCoursePicker.set(true);
  }

  protected closeCoursePicker(): void {
    this.showCoursePicker.set(false);
  }

  /** Toggle a single course GUID in the selection. */
  protected toggleCourse(guid: string): void {
    const current = this.selectedCourseGuids();
    if (current === null) {
      // Was "All" → switch to single selection
      this.selectedCourseGuids.set([guid]);
    } else {
      const idx = current.indexOf(guid);
      if (idx === -1) {
        this.selectedCourseGuids.set([...current, guid]);
      } else {
        const next = current.filter((g) => g !== guid);
        // If nothing left, go back to null (All Courses)
        this.selectedCourseGuids.set(next.length > 0 ? next : null);
      }
    }
  }

  protected isCourseSelected(guid: string): boolean {
    const current = this.selectedCourseGuids();
    return current !== null && current.includes(guid);
  }

  protected selectAllCourses(): void {
    this.selectedCourseGuids.set(null);
  }

  /** Apply the course picker selection and reload states/colleges. */
  protected applyCoursePicker(): void {
    this.showCoursePicker.set(false);
    this.selectedStateGuid.set(null);
    this.selectedCollegeGuid.set(null);
    this.states.set([]);
    this.colleges.set([]);
    this._loadStatesAndColleges(this.effectiveGuids);
  }

  protected clearCourses(): void {
    this.selectedCourseGuids.set(null);
    this.selectedStateGuid.set(null);
    this.selectedCollegeGuid.set(null);
    this.states.set([]);
    this.colleges.set([]);
  }

  // ── State / Management / College ──────────────────────────────────────────

  protected onStateChange(guid: string | null): void {
    this.selectedStateGuid.set(guid);
    this.selectedCollegeGuid.set(null);
    this.colleges.set([]);
    this.loadColleges(this.effectiveGuids, guid ?? undefined);
  }

  protected onManagementChange(val: ManagementOption): void {
    this.selectedManagement.set(val);
    this.selectedCollegeGuid.set(null);
    this.loadColleges(this.effectiveGuids, this.selectedStateGuid() ?? undefined);
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

  // ── Submit / Reset ────────────────────────────────────────────────────────

  protected submit(): void {
    const guids = this.effectiveGuids;
    const category = this.selectedManagement() !== 'All' ? this.selectedManagement() : undefined;

    this.search.emit({
      // Join GUIDs as comma-separated for service layer (service will split again)
      courseGuid: guids.join(','),
      stateGuid: this.selectedStateGuid() ?? undefined,
      category,
      collegeGuid: this.selectedCollegeGuid() ?? undefined,
    });
  }

  protected resetFilters(): void {
    this.selectedCourseGuids.set(null);
    this.selectedStateGuid.set(null);
    this.selectedManagement.set('All');
    this.selectedCollegeGuid.set(null);
    this.states.set([]);
    this.colleges.set([]);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Shared helper: fetches states for the given courseGuids (empty = all),
   * then kicks off a colleges fetch for "All states" once states arrive.
   * Used by both ngOnInit (initial page load / refresh) and applyCoursePicker.
   */
  private _loadStatesAndColleges(courseGuids: string[]): void {
    this.statesLoading.set(true);
    this.service.getStates(courseGuids).subscribe({
      next: (data) => {
        this.states.set(data);
        this.statesLoading.set(false);
        this.loadColleges(courseGuids, undefined);
      },
      error: () => this.statesLoading.set(false),
    });
  }

  private loadColleges(courseGuids: string[], stateGuid?: string): void {
    const cat = this.selectedManagement() !== 'All' ? this.selectedManagement() : undefined;
    this.collegesLoading.set(true);
    this.service.getColleges(courseGuids, stateGuid, cat).subscribe({
      next: (data) => {
        this.colleges.set(data);
        this.collegesLoading.set(false);
      },
      error: () => this.collegesLoading.set(false),
    });
  }

  /** Returns the shortName for a given course GUID — used in the selected-pills template. */
  protected getShortName(guid: string): string {
    return this.courses().find((c) => c.courseGuid === guid)?.shortName ?? guid.slice(0, 8);
  }
}
