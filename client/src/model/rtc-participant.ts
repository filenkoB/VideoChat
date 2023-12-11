import { Participant } from "./participant";

export class RtcParticipant extends Participant {
    constructor(public stream: MediaStream, id: string, name: string) {
        super(id, name);
    }
}