
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  token: string;
  faActive: BehaviorSubject<boolean>;
  logged: BehaviorSubject<boolean>;
  constructor(private http: HttpClient)
  {
    this.token = "";
    this.faActive = new BehaviorSubject<boolean>(false);
    this.logged = new BehaviorSubject<boolean>(false);
  }

  getSign(code: string): Observable<any> {
    const params = {
      code
    };
    return this.http.post<any>('api/auth/sign', params, { 'headers': new HttpHeaders() });
  }

  setToken(newToken: string) {
    this.token = newToken;
  }

  getToken(): string {
    return this.token;
  }

  checkCode(login_42: string, code2FA: string): Observable<any> {
    const params = {
      login_42,
      code2FA
    };
    return this.http.post<any>('api/auth/checkCode', params, { 'headers': new HttpHeaders() });
  }

  get42URL(): Observable<any>
  {
    return this.http.post<any>('api/auth/get42URL', {});
  }
}

@Injectable({
  providedIn: 'root'
})
export class InterceptorService implements HttpInterceptor {

  constructor(private authService: AuthService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    let request = req;

    if (token) {
      request = req.clone({
        setHeaders: {
          Authorization: `bearer ${ token }`
        }
      });
    }

    return next.handle(request);/*.pipe(
      catchError((err) => {
        if (err instanceof HttpErrorResponse) {
            if (err.status === 401) {
            // redirect user to the logout page
         }
      }
      return throwError(err);
    }))*/
  }
}