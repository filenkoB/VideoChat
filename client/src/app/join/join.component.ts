import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-join',
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.scss']
})
export class JoinComponent {
  public name = "";

  constructor(private readonly _router: Router) {}

  public onSubmit() {
    document.cookie = "name=" + this.name;
    this._router.navigate(["/conference"]);
  }
}
