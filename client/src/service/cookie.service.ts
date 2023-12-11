export class CookieHelper {
    public static getFromCookies(name: string): string|null {
        let matches = document.cookie.match(new RegExp(
          "(?:^|; )" + `${name}`.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ))
        return matches ? decodeURIComponent(matches![1]) : null;
    }
}