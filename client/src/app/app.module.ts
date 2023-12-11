import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { ConferenceMainComponent } from './conference-main/conference-main.component';
import { ParticipantComponent } from './participant/participant.component';
import { InputControlsComponent } from './input-controls/input-controls.component';
import { JoinComponent } from './join/join.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { routes } from './routes';

@NgModule({
  declarations: [
    AppComponent,
    ConferenceMainComponent,
    ParticipantComponent,
    InputControlsComponent,
    JoinComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
