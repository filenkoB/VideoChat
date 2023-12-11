import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-input-controls',
  templateUrl: './input-controls.component.html',
  styleUrls: ['./input-controls.component.scss']
})
export class InputControlsComponent {
  public isMicroActive = false;
  public isVideoActive = false;
  public isSharingActive = false;

  @Input() public sharing = false;

  @Output("switchvideo") public switchVideo = new EventEmitter<boolean>();
  @Output("switchmicro") public switchMicro = new EventEmitter<boolean>();
  @Output("switchsharing") public switchSharing = new EventEmitter<boolean>();
  @Output("leave") public leave = new EventEmitter<void>();

  public async onMicroBtnClick() {
    this.isMicroActive = !this.isMicroActive;
    this.switchMicro.emit(this.isMicroActive);
  }

  public async onVideoBtnClick() {
    this.isVideoActive = !this.isVideoActive;
    this.switchVideo.emit(this.isVideoActive);
  }

  public onSharingBtnClick() {
    if (this.sharing && !this.isSharingActive) {
      return;
    }
    this.isSharingActive = !this.isSharingActive;
    this.switchSharing.emit(this.isSharingActive);
  }

  public onLeaveBtnClick() {
    this.leave.emit();
  }
}
