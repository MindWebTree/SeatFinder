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
}

export const QUOTA_OPTIONS = [
  { label: 'All India Quota', value: 'All India' },
  { label: 'State Quota', value: 'State Quota' }
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
export const INSTITUTE_TYPE_OPTIONS = ['Govt', 'Private', 'Deemed'] as const;

export const COURSE_TYPE_OPTIONS = ['DNB', 'MD', 'MS', 'Diploma', 'Other'] as const;
export type CourseType = typeof COURSE_TYPE_OPTIONS[number];

export const CLINICAL_TYPE_OPTIONS = ['Clinical', 'Para-clinical', 'Non-clinical'] as const;
export type ClinicalType = typeof CLINICAL_TYPE_OPTIONS[number];
