import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { Observable } from "rxjs";
import { CookieHelper } from "src/service/cookie.service";

@Injectable({ providedIn: "root" })
export class ConferenceGuard implements CanActivate {
  constructor(private readonly router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) : Observable<boolean|UrlTree>|Promise<boolean|UrlTree>|boolean|UrlTree {
    if (CookieHelper.getFromCookies("name")) {
        return true;
    }
    this.router.navigate(["/"]);
    return false;
  }
}