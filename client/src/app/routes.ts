import { Routes } from '@angular/router';
import { JoinComponent } from './join/join.component';
import { ConferenceMainComponent } from './conference-main/conference-main.component';
import { ConferenceGuard } from 'src/guards/conference.guard';

export const routes: Routes = [
    { path: "", component: JoinComponent },
    { path: "conference", component: ConferenceMainComponent, canActivate: [ConferenceGuard] }
]