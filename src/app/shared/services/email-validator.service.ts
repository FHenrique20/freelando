import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailValidatorService {
  private emailsCadastros = [
    'usuario1@examplo.com'
  ]

  verificarEmailExistente(email: string): Observable<boolean>{
    return of(this.emailsCadastros.includes(email.toLowerCase())).pipe(delay(1500))
  }
  constructor() { }
}
