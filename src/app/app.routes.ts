import { Routes } from '@angular/router';
import { SeatFinderComponent } from './features/seat-finder/seat-finder';

export const routes: Routes = [
  { path: '', component: SeatFinderComponent },
  { path: '**', redirectTo: '' }
];
