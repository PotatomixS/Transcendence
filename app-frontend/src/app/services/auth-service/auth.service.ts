
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators'

export interface Code {
  code: string;
}

export interface AuthResponse {
  access_token: string;
  error: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  token: string;
  constructor(private http: HttpClient)
  {
    this.token = "";
  }

  getSign(code: string): Observable<AuthResponse> {
    const params: Code = {
      code
    };
    return this.http.post<AuthResponse>('api/auth/sign', params, { 'headers': new HttpHeaders() });
  }

  setToken(newToken: string) {
    this.token = newToken;
  }

  getToken(): string {
    return this.token;
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

/*import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Code {
  code: string
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  getSign(code: string): Observable<Code> {
      const headers = new HttpHeaders(
      {
      });
      const params: Code = {
        code
      };
      return this.http.post<Code>('api/auth/sign', params, { 'headers': headers });
  }
}*/
