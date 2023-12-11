import { Component, ElementRef, Input, ViewChild, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { RtcParticipant } from 'src/model/rtc-participant';
import { SignalRService } from 'src/service/signalr.service';

@Component({
  selector: 'app-participant',
  templateUrl: './participant.component.html',
  styleUrls: ['./participant.component.scss']
})
export class ParticipantComponent implements OnDestroy {
  @ViewChild("video") public videoEl! : ElementRef;
  @Input() public participant!: RtcParticipant;
  @Input() public muted = false;

  private _subscriptions = new Subscription();

  public onStartVideo = new Subject<MediaStream>();
  private _onStartVideo$ = this.onStartVideo.asObservable();

  public onStopVideo = new Subject<void>();
  private _onStopVideo$ = this.onStopVideo.asObservable();

  public onStartMicro = new Subject<void>();
  private _onStartMicro$ = this.onStartMicro.asObservable();

  public onStopMicro = new Subject<void>();
  private _onStopMicro$ = this.onStopMicro.asObservable();

  public isMicroActive = false;
  public isVideoActive = false;

  private _toggleVideo(isActive: boolean) {
    this.isVideoActive = isActive;
    this._signal.sendToggleEvent("ToggleVideo", isActive);
  }

  private _toggleMicrophone(isActive: boolean) {
    this.isMicroActive = isActive;
    this._signal.sendToggleEvent("ToggleMicrophone", isActive);
  }

  constructor(private readonly _signal: SignalRService) {
    this._subscriptions.add(this._onStartMicro$.subscribe(() => {
      this.participant.stream.getAudioTracks()[0].enabled = true;
      this._toggleMicrophone(true);
    }));
    this._subscriptions.add(this._onStopMicro$.subscribe(() => {
      this.participant.stream.getAudioTracks()[0].enabled = false;
      this._toggleMicrophone(false);
    }));
    this._subscriptions.add(this._onStartVideo$.subscribe((stream: MediaStream) => {
      if (!this.participant.stream.getVideoTracks()[0]) {
        this.participant.stream.addTrack(stream.getVideoTracks()[0]);
      } else {
        this.participant.stream.getVideoTracks()[0].enabled = true;
      }
      this._toggleVideo(true);
    }));
    this._subscriptions.add(this._onStopVideo$.subscribe(() => {
      this.participant.stream.getVideoTracks()[0].enabled = false;
      this._toggleVideo(false);
    }));
    this._subscriptions.add(this._signal.onToggleVideo$.subscribe((event) => {
      if (this.participant.id !== event.userId) {
        return;
      }
      this.isVideoActive = event.isActive;
    }));
    this._subscriptions.add(this._signal.onToggleMicrophone$.subscribe((event) => {
      if (this.participant.id !== event.userId) {
        return;
      }
      this.isMicroActive = event.isActive;
    }));
  }

  public ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }
}
