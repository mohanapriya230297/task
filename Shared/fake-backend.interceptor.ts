import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpResponse,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { Observable, of ,throwError } from 'rxjs';
import { delay, mergeMap, materialize, dematerialize } from 'rxjs/operators';

let users = JSON.parse(localStorage.getItem('users')) || [];

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
 
 const { url, method, headers, body } = request;

 return of(null)
     .pipe(mergeMap(handleRoute))
     .pipe(materialize()) 
     .pipe(delay(500))
     .pipe(dematerialize());
    

 function handleRoute() {
     switch (true) {
         case url.endsWith('/users/authenticate') && method === 'POST':
             return authenticate();
             case url.endsWith('/users/signUp') && method === 'POST':
              return signUp();
          case url.endsWith('/users') && method === 'GET':
              return getUsers();
          case url.endsWith('/users') && method === 'GET':
                return updateUser();   
          case url.match(/\/users\/\d+$/) && method === 'DELETE':
              return deleteUser();
         default:
  
    return next.handle(request);
  }
}
function authenticate() {
  const { email, password } = body;
  const user = users.find(x => x.email === email && x.password === password);
  if (!user) return error('Email or password is incorrect');
  return ok({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      gender:user.gender,
      mobile: user.mobile,
      pan: user.pan,
      token: 'fake-jwt-token'
  })
}

function signUp() {
  const user = body
  if (users.find(x => x.email === user.email)) {
      return error('Email "' + user.email + '" is already taken')
  }
  user.id = users.length ? Math.max(...users.map(x => x.id)) + 1 : 1;
  users.push(user);
  localStorage.setItem('users', JSON.stringify(users));
  return ok();
}

function getUsers() {
  if (!isLoggedIn()) return unauthorized();
  return ok(users);
}

function updateUser() {
  const user = body
  if (users.find(x => x.email === user.email)) {
      return error('Email "' + user.email + '" is already taken')
  }
  users.push(user);
  localStorage.setItem('users', JSON.stringify(users));
  users = JSON.parse(localStorage.getItem('users'));
  console.log('value is----', user);
  return ok();
}

function deleteUser() {
  if (!isLoggedIn()) return unauthorized();
  users = users.filter(x => x.id !== idFromUrl());
  localStorage.setItem('users', JSON.stringify(users));
  return ok();
}


function ok(body?) {
  return of(new HttpResponse({ status: 200, body }))
}

function error(message) {
  return throwError({ error: { message } });
}
function unauthorized() {
  return throwError({ status: 401, error: { message: 'Unauthorised' } });
}

function isLoggedIn() {
  return headers.get('Authorization') === 'Bearer fake-jwt-token';
}

function idFromUrl() {
  const urlParts = url.split('/');
  return parseInt(urlParts[urlParts.length - 1]);
}
}
}

export const fakeBackendProvider = {
provide: HTTP_INTERCEPTORS,
useClass: FakeBackendInterceptor,
multi: true
};
