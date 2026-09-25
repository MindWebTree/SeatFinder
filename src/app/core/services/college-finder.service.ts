import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  CFCourseDto,
  CFStateDto,
  CFCollegeListItemDto,
  CFSearchResponse,
  CFCollegeDetailResponse,
} from '../models/counselling.models';

export interface CFSearchRequest {
  courseGuid: string;
  stateGuid?: string;
  category?: string;
  collegeGuid?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class CollegeFinderService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/college-finder`;

  /** Step 1 – All courses (no params required). */
  getCourses(): Observable<CFCourseDto[]> {
    return this.http
      .get<ApiResponse<CFCourseDto[]>>(`${this.base}/courses`)
      .pipe(map((res) => res.data));
  }

  /** Step 2 – States available for a given course. */
  getStates(courseGuid: string): Observable<CFStateDto[]> {
    const params = new HttpParams().set('courseGuid', courseGuid);
    return this.http
      .get<ApiResponse<CFStateDto[]>>(`${this.base}/states`, { params })
      .pipe(map((res) => res.data));
  }

  /** Step 3 – Colleges for a given course + state combo (for the dropdown). */
  getColleges(courseGuid: string, stateGuid?: string, category?: string, search?: string): Observable<CFCollegeListItemDto[]> {
    let params = new HttpParams().set('courseGuid', courseGuid);
    if (stateGuid) params = params.set('stateGuid', stateGuid);
    if (category) params = params.set('category', category);
    if (search) params = params.set('search', search);
    return this.http
      .get<ApiResponse<CFCollegeListItemDto[]>>(`${this.base}/colleges`, { params })
      .pipe(map((res) => res.data));
  }

  /** Step 4 – Paginated search results. */
  search(req: CFSearchRequest): Observable<CFSearchResponse> {
    let params = new HttpParams().set('CourseGuid', req.courseGuid);
    if (req.stateGuid) params = params.set('StateGuid', req.stateGuid);
    if (req.category) params = params.set('Category', req.category);
    if (req.collegeGuid) params = params.set('CollegeGuid', req.collegeGuid);
    if (req.page != null) params = params.set('Page', req.page);
    if (req.pageSize != null) params = params.set('PageSize', req.pageSize);
    return this.http
      .get<ApiResponse<CFSearchResponse>>(`${this.base}/search`, { params })
      .pipe(map((res) => res.data));
  }

  /** College detail – full college info + all offered courses. */
  getCollegeDetail(collegeGuid: string): Observable<CFCollegeDetailResponse> {
    return this.http
      .get<ApiResponse<CFCollegeDetailResponse>>(`${this.base}/colleges/${collegeGuid}`)
      .pipe(map((res) => res.data));
  }
}
