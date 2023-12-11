import { Component, OnDestroy, ViewChild } from '@angular/core';
import { Participant } from 'src/model/participant';
import { SignalRService } from 'src/service/signalr.service';
import { Subscription } from 'rxjs';
import { RtcParticipant } from 'src/model/rtc-participant';
import { RtcService } from 'src/service/rtc.service';
import { SignalEvent } from 'src/model/signal-event';
import { ParticipantComponent } from '../participant/participant.component';
import { ToggleEvent } from 'src/model/toggle-event';
import { ConferencePeer } from 'src/model/conference-peer';
import { CookieHelper } from 'src/service/cookie.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-conference-main',
  templateUrl: './conference-main.component.html',
  styleUrls: ['./conference-main.component.scss']
})
export class ConferenceMainComponent implements OnDestroy {
  @ViewChild("localParticipant") public localParticipant! : ParticipantComponent;

  private _subscriptions = new Subscription();
  private sharingUserId?: string;
  public sharing = false;

  public userId!: string;
  public userName!: string;

  public localStream = new MediaStream();
  public sharingStream = new MediaStream();

  public participants: RtcParticipant[] = [];
  public peers: any = {};

  constructor(private readonly _signalR: SignalRService, private readonly _rtcService: RtcService,
    private readonly _router: Router) {
    this.userName = CookieHelper.getFromCookies("name")!;
    this._signalR.startConnection(this.userId, this.userName);
    this._initEvents();
  }

  private _initEvents(): void {
    this._subscriptions.add(this._signalR.onConnected$.subscribe(this._onConnectedHandler.bind(this)));
    this._subscriptions.add(this._signalR.getParticipants$.subscribe(this._getParticipantsHandler.bind(this)));
    this._subscriptions.add(this._signalR.onNewConnection$.subscribe(this._onNewConnectionHandler.bind(this)));
    this._subscriptions.add(this._signalR.onRemoveConnection$.subscribe(this._handleRemoveConnection.bind(this)));
    this._subscriptions.add(this._signalR.onSignal$.subscribe(this._handleSignal.bind(this)));
    this._subscriptions.add(this._signalR.onToggleSharing$.subscribe(this._handleSharing.bind(this)))
  }

  private async _handleSharing(event: ToggleEvent) {
    this.sharing = event.isActive;
  }

  private _handleRemoveConnection(participant: Participant) {
    let index = this.participants.findIndex(p => p.id === participant.id);
    this.participants.splice(index, 1);
    this.peers[participant.id].close();
    delete this.peers[participant.id];
  }

  private async _handleSignal(signalEvent: SignalEvent) {
    let signal = JSON.parse(signalEvent.message);
    let peer = this.peers[signalEvent.userIdSrc] as ConferencePeer;
    if(signal.sdp){     
      await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));   
      if(signal.sdp.type == 'offer') {     
        let answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        await this._signalR.sendSignal(signalEvent.userIdDest, signalEvent.userIdSrc, JSON.stringify({ "sdp": peer.localDescription }));
      }
    }
    if(signal.ice) {
      await peer.addIceCandidate(new RTCIceCandidate(signal.ice));
    }
  }

  private async _createOffer(peer: ConferencePeer, participant: Participant) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await this._signalR.sendSignal(this.userId, participant.id, JSON.stringify({ "sdp": peer.localDescription! }));
  }

  private async _onNewConnectionHandler(participant: Participant) {
    let outputStream = new MediaStream();
    this.participants.push(new RtcParticipant(outputStream, participant.id, participant.name));
    let peer = this.peers[participant.id] = this._rtcService.createPeer(this.localStream, outputStream, this.sharingStream, this.userId, participant.id);
    this._signalR.sendToggleEvent("ToggleMicrophone", this.localParticipant.isMicroActive);
    this._signalR.sendToggleEvent("ToggleVideo", this.localParticipant.isVideoActive);
    this._signalR.sendToggleEvent("ToggleSharing", this.sharing);
    await this._createOffer(peer, participant);
  }

  private async _onConnectedHandler(userId: string) {
    this.userId = userId;
    (await this._rtcService.getMediaStream()).getTracks().forEach(track => {
      this.localStream.addTrack(track);
    });
    this.participants.push(new RtcParticipant(this.localStream, this.userId, this.userName));
    await this._signalR.getParticipants();
    await this._signalR.sendOnNewConnection(new Participant(this.userId, this.userName));
    this._signalR.sendToggleEvent("ToggleSharing", false);
  }

  private async _getParticipantsHandler(participants: Participant[]) {
    for (let p of participants) {
      let outputStream = new MediaStream();
      this.participants.push(new RtcParticipant(outputStream, p.id, p.name));
      this.peers[p.id] = this._rtcService.createPeer(this.localStream, outputStream, this.sharingStream, this.userId, p.id);
    }
  }

  private async _offerOthers(): Promise<void> {
    for (let participant of this.participants.slice(1)) {
      let peer = this.peers[participant.id] as ConferencePeer;
      await this._createOffer(peer, participant);
    }
  }
  
  private async _onStartVideo() {
    let stream = await this._rtcService.getVideoStream();
    this.localParticipant.onStartVideo.next(stream);
    let webcamTrack = this.localStream.getVideoTracks()[0];
    for (let participant of this.participants.slice(1)) {
      let peer = this.peers[participant.id] as ConferencePeer;
      peer.addTrack(webcamTrack, this.localStream);
      await this._createOffer(peer, participant);
    }
  }

  private async _onTurnOnMicro() {
    this.localParticipant.onStartMicro.next();
    await this._offerOthers();
  }

  private async _onTurnOffMicro() {
    this.localParticipant.onStopMicro.next();
  }

  private _onStopVideo() {
    this.localParticipant.onStopVideo.next();
  }

  public onSwitchVideo(isActive: boolean) {
    isActive ? this._onStartVideo() : this._onStopVideo();
  }

  public onSwitchMicro(isActive: boolean) {
    isActive ? this._onTurnOnMicro() : this._onTurnOffMicro();
  }

  public async onSwitchSharing(isActive: boolean) {
    if (isActive) {
      this.sharingUserId = this.userId;
      this.sharingStream = await this._rtcService.getSharingTrack();
      if (!this.sharingStream) {
        return;
      }
      this.sharing = true;
      for (let participant of this.participants.slice(1)) {
        let peer = this.peers[participant.id] as ConferencePeer;
        peer.addTrack(this.sharingStream.getVideoTracks()[0], this.sharingStream);
        await this._createOffer(peer, participant);
      }
    } else {
      this.sharing = false;
      for (let participant of this.participants.slice(1)) {
        let peer = this.peers[participant.id] as ConferencePeer;
        peer.removeTrack(this.sharingStream.getVideoTracks()[0]);
        await this._createOffer(peer, participant);
      }
      this.sharingStream.removeTrack(this.sharingStream.getVideoTracks()[0]);
    }
    this._signalR.sendToggleEvent("ToggleSharing", isActive);
  }

  public async onLeave(): Promise<void> {
    await this._signalR.leave();
    this._router.navigate(["/"]);
  }

  public ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
    this.participants = [];
    for (let key in this.peers) {
      delete this.peers[key];
    }
  }
}
