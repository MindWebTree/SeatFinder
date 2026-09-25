// Mirrors CounsellingApp.Application.DTOs on the backend exactly.

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface StateDto {
  stateId: number;
  stateGuid: string;
  stateName: string;
}

export interface CourseDto {
  courseId: number;
  courseGuid: string;
  courseName: string;
  courseType: string;
  clinicalType?: string;
}

export interface CourseFilterRequest {
  type?: string;         // e.g. 'DNB' | 'MD' | 'MS' | 'Diploma' | 'Other'
  clinicaltype?: string; // comma-separated, e.g. 'Clinical,Para-clinical'
}

export interface SeatDto {
  seatId: number;
  seatGuid: string;
  collegeName: string;
  instituteType: 'Govt' | 'Private' | 'Deemed';
  stateName: string;
  courseName: string;
  seatCategory: string;
  totalSeats: number;
  round1ClosingRank: number | null;
  round2ClosingRank: number | null;
  round3ClosingRank: number | null;
  rankDifference: number;
  strayVacancyClosingRank: number | null;
}

export interface SeatFinderResponse {
  totalMatches: number;
  closedJustBeforeYou: SeatDto[];
  withinReach: SeatDto[];
}

export interface SeatFinderRequest {
  rank: number;
  category: string;
  instituteTypes?: string;   // comma-separated: "Govt,Private"
  courseIds?: string;        // comma-separated: "1,2,3"
  stateIds?: string;         // comma-separated: "5,12"
  quota?: string;
  rounds?: string;           // null = all; otherwise comma-separated: "1,2" | "3" etc.
}

export const ROUND_OPTIONS = [
  { label: 'Round 1', value: 1 },
  { label: 'Round 2', value: 2 },
  { label: 'Round 3', value: 3 },
  { label: 'Stray Round', value: 4 },
] as const;

export type RoundValue = typeof ROUND_OPTIONS[number]['value'];

export const QUOTA_OPTIONS = [
  { label: 'All Quotas', value: '' },
  { label: 'All India Quota', value: 'All India' },
  { label: 'State Quota', value: 'State Quota' },
  { label: 'Army Quota', value: 'Armed Forces Medical' },
  { label: 'DNB Quota', value: 'DNB Quota' },
  { label: 'Self-Financed Merit Seat', value: 'Self-Financed Merit Seat' },
  { label: 'Non-Resident Indian', value: 'Non-Resident Indian' },
  { label: 'Delhi University Quota', value: 'Delhi University Quota' },
  { label: 'IP University Quota', value: 'IP University Quota' },
  { label: 'Aligarh Muslim University', value: 'Aligarh Muslim University' },
  { label: 'Banaras Hindu University', value: 'Banaras Hindu University' },
  { label: 'Jain Minority Quota', value: 'Jain Minority Quota' },
  { label: 'Muslim Minority Quota', value: 'Muslim Minority Quota' }
] as const;

// export const CATEGORY_OPTIONS = ['Open', 'OBC', 'SC', 'ST', 'EWS'] as const;
export const CATEGORY_OPTIONS = [
  'Open',
  'OBC',
  'SC',
  'ST',
  'EWS',
  'Open PwD',
  'OBC PwD',
  'SC PwD',
  'ST PwD',
  'EWS PwD'
] as const;
// export const INSTITUTE_TYPE_OPTIONS = ['Govt', 'Private', 'Deemed'] as const;
export const INSTITUTE_TYPE_OPTIONS = ['Govt', 'Private', 'Deemed', 'DNB Hospital', 'Self Financed'] as const;

export const COURSE_TYPE_OPTIONS = ['DNB', 'MD', 'MS', 'Diploma', 'Other'] as const;
export type CourseType = typeof COURSE_TYPE_OPTIONS[number];

export const CLINICAL_TYPE_OPTIONS = ['Clinical', 'Para-clinical', 'Non-clinical'] as const;
export type ClinicalType = typeof CLINICAL_TYPE_OPTIONS[number];

// ── College Finder DTOs ────────────────────────────────────────────────────────

export interface CFCourseDto {
  courseGuid: string;
  courseName: string;
  shortName: string;
  courseType: string;
  collegeCount: number;
  totalSeats: number;
}

export interface CFStateDto {
  stateGuid: string;
  stateName: string;
  collegeCount: number;
  totalSeats: number;
}

export interface CFCollegeListItemDto {
  collegeGuid: string;
  collegeName: string;
  city: string;
  stateName: string;
  category: string;
  seats: number;
}

export interface CFSearchItemDto {
  collegeGuid: string;
  collegeName: string;
  city: string;
  stateName: string;
  courseName: string;
  courseShortName: string;
  seats: number;
  category: string;
  nmcStatus: string;
  university: string;
}

export interface CFSearchResponse {
  totalCount: number;
  totalSeats: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  items: CFSearchItemDto[];
}

export interface CFCollegeCourseDto {
  courseGuid: string;
  courseName: string;
  courseShortName: string;
  courseType: string;
  seats: number;
  category: string;
  university: string;
  nmcStatus: string;
  lastLopDate: string | null;
}

export interface CFCollegeDetailDto {
  collegeGuid: string;
  nmcCode: string;
  collegeName: string;
  city: string;
  fullName: string;
  stateName: string;
  ownership: string;
  yearOfInception: number | null;
}

export interface CFCollegeDetailResponse {
  college: CFCollegeDetailDto;
  courses: CFCollegeCourseDto[];
  totalSeats: number;
}
