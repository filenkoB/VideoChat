import { Injectable } from "@angular/core";
import { Participant } from "src/model/participant";
import { Subject } from "rxjs";
import { HubConnection, HubConnectionBuilder, HttpTransportType } from "@microsoft/signalr";
import constants from "src/constants";
import { ToggleEvent } from "src/model/toggle-event";
import { SignalEvent } from "src/model/signal-event";

@Injectable({ providedIn: "root" })
export class SignalRService {
    private _connection?: HubConnection;
    
    private _getParticipants = new Subject<Participant[]>()
    public getParticipants$ = this._getParticipants.asObservable();

    private _onToggleMicrophone = new Subject<ToggleEvent>();
    public onToggleMicrophone$ = this._onToggleMicrophone.asObservable();

    private _onToggleVideo = new Subject<ToggleEvent>();
    public onToggleVideo$ = this._onToggleVideo.asObservable();

    private _onToggleSharing = new Subject<ToggleEvent>();
    public onToggleSharing$ = this._onToggleSharing.asObservable();

    private _onConnected = new Subject<string>();
    public onConnected$ = this._onConnected.asObservable();

    private _onNewConnection = new Subject<Participant>();
    public onNewConnection$ = this._onNewConnection.asObservable();

    private _onRemoveConnection = new Subject<Participant>();
    public onRemoveConnection$ = this._onRemoveConnection.asObservable();

    private _onSignal = new Subject<SignalEvent>();
    public onSignal$ = this._onSignal.asObservable();

    private _initListeners(): void {
        if (!this._connection) {
            return;
        }
        this._connection.on("Connected", (userId: string) => this._onConnected.next(userId));
        this._connection.on("OnToggleMicrophone",
            (event: ToggleEvent) => this._onToggleMicrophone.next(event));
        this._connection.on("OnNewConnection",
            (participant: Participant) => this._onNewConnection.next(participant));
        this._connection.on("OnRemoveConnection",
            (participant: Participant) => this._onRemoveConnection.next(participant));
        this._connection.on("Signal", (signalEvent: SignalEvent) => this._onSignal.next(signalEvent));
        this._connection.on("OnToggleVideo", (event: ToggleEvent) => this._onToggleVideo.next(event));
        this._connection.on("OnToggleSharing", (event: ToggleEvent) => this._onToggleSharing.next(event));
    }

    public async startConnection(userId: string, userName: string) {
        this._connection = new HubConnectionBuilder()
            .withUrl(constants.serverUrl + "/conference").build()
        await this._connection.start();
        this._initListeners();
        console.log("Connect", userName);
        this._connection.send("Connect", { id: userId, name: userName });
    }

    public async getParticipants(): Promise<void> {
        let participants = await this._connection?.invoke<Participant[]>("GetParticipants");
        if (participants) {
            this._getParticipants.next(participants);
        }
    }

    public async sendOnNewConnection(participant: Participant) {
        await this._connection?.send('OnNewConnection', participant);
    }

    async sendSignal(userIdSrc: string, userIdDest: string, message: string) {
        await this._connection?.send('Signal', userIdSrc, userIdDest, message);
    }

    async sendToggleEvent(event: string, isActive: boolean) {
        await this._connection?.send(event, isActive);
    }

    async leave() {
        await this._connection?.send("Leave");
    }
}