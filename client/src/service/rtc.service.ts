import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { SignalRService } from "./signalr.service";
import { ConferencePeer } from "src/model/conference-peer";

@Injectable({ providedIn: "root" })
export class RtcService {
  private _onIceCandidate = new Subject<RTCPeerConnectionIceEvent>();
  public onIceCandidate$ = this._onIceCandidate.asObservable();

  constructor(private readonly _signalR: SignalRService) {}

  public createPeer(stream: MediaStream, outputStream: MediaStream, sharing: MediaStream, userSrcId: string, userDestId: string): ConferencePeer {
    let peer = new ConferencePeer(stream, outputStream, sharing);
    peer.onCandidate().then((event) => {
      this._signalR.sendSignal(userSrcId, userDestId, JSON.stringify({ "ice": event.candidate }));
    });
    return peer;
  }

  public async getVideoStream(): Promise<MediaStream> {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        width: { max: 800 },
        height: { max: 600 }
      },
      audio: false
    });
  }

  public async getSharingTrack(): Promise<MediaStream> {
    let options = {
      video: {
        width: { max: 1270 },
        height: { max: 720 }
      }
    };
    return await navigator.mediaDevices.getDisplayMedia(options);
  }

  public async getMediaStream(): Promise<MediaStream> {
    let stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 48000,
        channelCount: 2,
        echoCancellation: true,
        noiseSuppression: true
      },
      video: false
    });
    stream.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
    return stream;
  }
}