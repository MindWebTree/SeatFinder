import { ChangeDetectionStrategy, Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { CounsellingService } from '../../../../core/services/counselling.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthDialogComponent } from '../../../auth/components/auth-dialog/auth-dialog';
import {
  CATEGORY_OPTIONS,
  CLINICAL_TYPE_OPTIONS,
  COURSE_TYPE_OPTIONS,
  CourseDto,
  INSTITUTE_TYPE_OPTIONS,
  QUOTA_OPTIONS,
  SeatFinderRequest,
  StateDto
} from '../../../../core/models/counselling.models';

const OPEN_ONLY_CATEGORIES = new Set(['Open', 'OC', 'General']);

@Component({
  selector: 'app-seat-filters',
  standalone: true,
  imports: [FormsModule, MatSelectModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './seat-filters.html'
})
export class SeatFiltersComponent implements OnInit {
  private readonly counsellingService = inject(CounsellingService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  protected readonly categories = CATEGORY_OPTIONS;
  protected readonly instituteTypes = INSTITUTE_TYPE_OPTIONS;
  protected readonly quotaOptions = QUOTA_OPTIONS;
  protected readonly courseTypes = COURSE_TYPE_OPTIONS;
  protected readonly clinicalTypes = CLINICAL_TYPE_OPTIONS;
  protected readonly states = signal<StateDto[]>([]);
  protected readonly courses = signal<CourseDto[]>([]);

  protected readonly quota = signal<string>(QUOTA_OPTIONS[0].value);
  protected readonly rank = signal<number | null>(null);
  protected readonly rankError = signal<boolean>(false);
  protected readonly category = signal<string>('Open');

  // Multi-select now: each holds an array of selected values.
  protected readonly selectedInstituteTypes = signal<string[]>([...INSTITUTE_TYPE_OPTIONS]);
  protected readonly selectedCourseIds = signal<number[]>([]);
  protected readonly selectedStateIds = signal<number[]>([]);   // used for All India (multi)
  protected readonly selectedStateId = signal<number | null>(null); // used for State Quota (single)
  protected readonly stateError = signal<boolean>(false);

  // New course-type filters
  protected readonly selectedCourseType = signal<string | null>(null);
  protected readonly selectedClinicalTypes = signal<string[]>([]);

  /** True when the State Quota tab is active. */
  protected readonly isStateQuota = computed(() => this.quota() === 'State Quota');

  /** Matches the backend's eligibility rule: Open/OC/General candidates can only take Open seats. */
  protected readonly eligibilityHint = computed(() =>
    OPEN_ONLY_CATEGORIES.has(this.category())
      ? `As ${this.category()} you can take Open seats only.`
      : `As ${this.category()} you can take Open or ${this.category()} seats.`
  );

  protected readonly courseSummary = computed(() => {
    const n = this.selectedCourseIds().length;
    return n === 0 ? 'All courses' : n === 1
      ? this.courses().find((c) => c.courseId === this.selectedCourseIds()[0])?.courseName ?? '1 selected'
      : `${n} courses selected`;
  });

  protected readonly stateSummary = computed(() => {
    if (this.isStateQuota()) {
      const id = this.selectedStateId();
      return id ? (this.states().find((s) => s.stateId === id)?.stateName ?? 'Selected') : 'Select state';
    }
    const n = this.selectedStateIds().length;
    return n === 0 ? 'All India' : n === 1
      ? this.states().find((s) => s.stateId === this.selectedStateIds()[0])?.stateName ?? '1 selected'
      : `${n} states selected`;
  });

  /** Called when the quota tab changes — clears state selection and error. */
  protected onQuotaChange(value: string): void {
    this.quota.set(value);
    this.selectedStateIds.set([]);
    this.selectedStateId.set(null);
    this.stateError.set(false);
  }

  readonly search = output<SeatFinderRequest>();

  ngOnInit(): void {
    this.counsellingService.getStates().subscribe({
      next: (states) => this.states.set(states),
      error: (err) => console.error('Failed to load states (dropdown will stay empty):', err)
    });
    this.loadCourses();
  }

  /** Reload the courses list whenever the type/clinicaltype filter changes. */
  protected onCourseTypeChange(value: string | null): void {
    this.selectedCourseType.set(value);
    this.selectedCourseIds.set([]);
    this.loadCourses();
  }

  protected onClinicalTypeChange(values: string[]): void {
    this.selectedClinicalTypes.set(values ?? []);
    this.selectedCourseIds.set([]);
    this.loadCourses();
  }

  private loadCourses(): void {
    const type = this.selectedCourseType();
    const clinicaltypes = this.selectedClinicalTypes();
    this.counsellingService.getCourses({
      type: type ?? undefined,
      clinicaltype: clinicaltypes.length ? clinicaltypes.join(',') : undefined
    }).subscribe({
      next: (courses) => this.courses.set(courses),
      error: (err) => console.error('Failed to load courses (dropdown will stay empty):', err)
    });
  }

  protected submit(): void {
    const rankValue = this.rank();
    if (!rankValue || rankValue < 1) {
      this.rankError.set(true);
      return;
    }
    this.rankError.set(false);

    // State is required when State Quota is selected.
    if (this.isStateQuota() && !this.selectedStateId()) {
      this.stateError.set(true);
      return;
    }
    this.stateError.set(false);

    if (!this.authService.isLoggedIn()) {
      const ref = this.dialog.open(AuthDialogComponent, {
        data: { states: this.states(), neetRank: this.rank(), category: this.category() },
        panelClass: 'auth-dialog-panel'
      });
      ref.afterClosed().subscribe((success) => {
        if (success) this.runSearch();
      });
      return;
    }
    this.runSearch();
  }

  private runSearch(): void {
    const rankValue = this.rank();
    if (!rankValue || rankValue < 1) { this.rankError.set(true); return; }

    const stateIds = this.isStateQuota()
      ? (this.selectedStateId() ? String(this.selectedStateId()) : undefined)
      : (this.selectedStateIds().length ? this.selectedStateIds().join(',') : undefined);

    this.search.emit({
      rank: rankValue,
      category: this.category(),
      instituteTypes: this.selectedInstituteTypes().length ? this.selectedInstituteTypes().join(',') : undefined,
      courseIds: this.selectedCourseIds().length ? this.selectedCourseIds().join(',') : undefined,
      stateIds,
      quota: this.quota()
    });
  }
}
