export class ConferencePeer {
    private readonly _peerConnectionConfig =  {
        iceServers: [
          { urls: "stun:stun.services.mozilla.com" },
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun.awt.be:3478" },
          { urls: "stun:stun.b2b2c.ca:3478" },
          { urls: "stun:stun.bahnhof.net:3478" },
          { urls: "stun:stun.barracuda.com:3478" },
          { urls: "stun:stun.bluesip.net:3478" },
          { urls: "stun:stun.bmwgs.cz:3478" },
          { urls: "stun:stun.botonakis.com:3478" },
          { urls: "stun:stun.budgetphone.nl:3478" },
          { urls: "stun:stun.cablenet-as.net:3478" }
        ]
    };

    private _peer?: RTCPeerConnection;

    private _participantStreamId?: string;

    public get localDescription() : RTCSessionDescription {
        return this._peer!.localDescription!;
    }

    constructor(
        private readonly _input: MediaStream,
        private _output: MediaStream,
        private _sharingStream: MediaStream
    ) {
        this._initPeer();
    }

    private _onTrack(event: RTCTrackEvent) {
        if (!this._participantStreamId) {
            this._participantStreamId = event.streams[0].id;
        }
        let stream = event.streams[0];
        let tracks = stream.getTracks();
        if (stream.id === this._participantStreamId) {
            tracks.forEach(track => {
                this._output.addTrack(track);
            });
        } else {
            this._sharingStream.getTracks().forEach(track => {
                this._sharingStream.removeTrack(track);
            })
            tracks.forEach(track => {
                this._sharingStream.addTrack(track);
            });
        }
    } 

    private _initPeer() {
        this._peer = new RTCPeerConnection(this._peerConnectionConfig);
        this._input.getTracks().forEach((track) => {
            this._peer!.addTrack(track, this._input);
        });
        this._sharingStream.getTracks().forEach((track) => {
            this._peer!.addTrack(track, this._sharingStream);
        });

        this._peer.ontrack = this._onTrack.bind(this);
    }

    public async onCandidate(): Promise<RTCPeerConnectionIceEvent> {
        return new Promise((resolve, reject) => {
            this._peer!.onicecandidate = (event) => {
                if (event.candidate != null) {
                    resolve(event);
                }
            }
        });
    }

    public async createOffer(): Promise<RTCSessionDescriptionInit> {
        return this._peer?.createOffer()!;
    }

    public removeTrack(track: MediaStreamTrack): void {
        let sender = this._peer?.getSenders().find(s => s!.track!.id === track.id);
        this._peer?.removeTrack(sender!);
    }

    public async createAnswer(): Promise<RTCSessionDescriptionInit> {
        return this._peer?.createAnswer()!;
    }

    public async setLocalDescription(description: any): Promise<void> {
        return this._peer?.setLocalDescription(description);
    }

    public addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): RTCRtpSender {
        return this._peer?.addTrack(track, ...streams)!;
    }

    public async setRemoteDescription(description: any): Promise<void> {
        return this._peer?.setRemoteDescription(description)!;
    }

    public async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        return this._peer?.addIceCandidate(candidate)!;
    }

    public close(): void {
        this._peer?.close();
    }
}