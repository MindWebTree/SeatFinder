import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  CourseDto,
  CourseFilterRequest,
  SeatFinderRequest,
  SeatFinderResponse,
  StateDto
} from '../models/counselling.models';

@Injectable({ providedIn: 'root' })
export class CounsellingService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/counselling`;

  searchSeats(request: SeatFinderRequest): Observable<SeatFinderResponse> {
    let params = new HttpParams()
      .set('Rank', request.rank)
      .set('Category', request.category);

    if (request.instituteTypes) {
      params = params.set('InstituteTypes', request.instituteTypes);
    }
    if (request.courseIds) {
      params = params.set('CourseIds', request.courseIds);
    }
    if (request.stateIds) {
      params = params.set('StateIds', request.stateIds);
    }
    if (request.quota) {
      params = params.set('Quota', request.quota);
    }
    if (request.rounds) {
      params = params.set('Rounds', request.rounds);
    }

    return this.http
      .get<ApiResponse<SeatFinderResponse>>(`${this.base}/seat-finder`, { params })
      .pipe(map((res) => res.data));
  }

  getStates(): Observable<StateDto[]> {
    return this.http
      .get<ApiResponse<StateDto[]>>(`${this.base}/states`)
      .pipe(map((res) => res.data));
  }

  getCourses(filter?: CourseFilterRequest): Observable<CourseDto[]> {
    let params = new HttpParams();
    if (filter?.type) {
      params = params.set('type', filter.type);
    }
    if (filter?.clinicaltype) {
      params = params.set('clinicaltype', filter.clinicaltype);
    }
    return this.http
      .get<ApiResponse<CourseDto[]>>(`${this.base}/courses`, { params })
      .pipe(map((res) => res.data));
  }
}
