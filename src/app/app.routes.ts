import { Routes } from '@angular/router';
import { SeatFinderComponent } from './features/seat-finder/seat-finder';
import { CollegeFinderComponent } from './features/college-finder/college-finder';

export const routes: Routes = [
  { path: '', component: SeatFinderComponent },
  { path: 'colleges', component: CollegeFinderComponent },
  { path: '**', redirectTo: '' }
];
