import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { TokenService } from './token.service';
import { User } from '../models/user.interface';
import { Buffer } from 'buffer';

const OAUTH_CLIENT = 'express-client'
const OAUTH_SECRET = 'express-secret'

const API_URL = 'https://localhost:3000'


const HTTP_OPTIONS = {
  headers: new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: 'Basic ' + Buffer.from(OAUTH_CLIENT + ':' + OAUTH_SECRET).toString('base64')
  })
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  redirectUrl = ''

  private static handleError(error: HttpErrorResponse): any {
    if (error.error instanceof ErrorEvent){
      console.error('An error occured:', error.error.message)
    } else {
      console.error(`Status: ${error.status} \n Error: ${error.error}` )
    }
    return throwError(()=> new Error('Something bad happened.'))
  }

  private static log(message: string): any {
    console.log(message)
  }

  constructor( private http: HttpClient, private tokenService: TokenService) { }

  login(user: User): Observable<any>{
    
    this.tokenService.removeToken()
    this.tokenService.removeRefreshToken()

    const body = new HttpParams()
      .set('email', user.email)
      .set('password', user.password)
      .set('grant_type', 'password')

    return this.http.post<any>(API_URL + 'oauth/token', body, HTTP_OPTIONS)
      .pipe(
        tap(res => {
          this.tokenService.setToken(res.access_token),
          this.tokenService.setRefreshToken(res.refresh_token)
        }),
        catchError(AuthService.handleError)
      )
  }

  refreshToken(refreshData: any): Observable<any> {
    this.tokenService.removeToken()
    this.tokenService.removeRefreshToken()

    const body = new HttpParams()
    .set('refresh_token', refreshData.refresh_token)
    .set('grant_type', 'refresh_token')

    return this.http.post<any>(API_URL + 'oauth/token', body, HTTP_OPTIONS)
      .pipe(
        tap(res => {
          this.tokenService.setToken(res.access_token),
          this.tokenService.setRefreshToken(res.refresh_token)
        }),
        catchError(AuthService.handleError)
      )  
    }

  logout(): void {
    this.tokenService.removeToken();
    this.tokenService.removeRefreshToken();
  }

  register(data: any): Observable<any> {
    return this.http.post<any>(API_URL + 'oauth/signup', data)
      .pipe(
        tap(_ => AuthService.log('register')),
        catchError(AuthService.handleError)
      );
  }

  secured(): Observable<any> {
    return this.http.get<any>(API_URL + 'secret')
      .pipe(catchError(AuthService.handleError));
  }
}
