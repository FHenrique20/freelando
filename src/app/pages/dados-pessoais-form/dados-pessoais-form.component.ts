import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, AbstractControlOptions, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Router } from '@angular/router';
import { CadastroService } from '../../shared/services/cadastro.service';
import { BehaviorSubject, Observable, of, startWith, switchMap, tap } from 'rxjs';
import { Cidade, Estado, IbgeService } from '../../shared/services/ibge.service';
import { cpfValidator } from '../../shared/validators/cpf.validator';
import { emailExistenteValidator } from '../../shared/validators/emailExistente.validator';
import { EmailValidatorService } from '../../shared/services/email-validator.service';

export const senhasIguaisValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const senha = control.get('senha');
  const confirmaSenha = control.get('confirmaSenha');

  if (senha && confirmaSenha && senha.value !== confirmaSenha.value) {
    return { senhasNaoIguais: true };
  }
  return null;
};
@Component({
  selector: 'app-dados-pessoais-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent
  ],
  templateUrl: './dados-pessoais-form.component.html',
  styleUrls: ['./dados-pessoais-form.component.scss']
})
export class DadosPessoaisFormComponent implements OnInit {
  dadosPessoaisForm!: FormGroup;

  estado$!: Observable<Estado[]>
  cidades$!: Observable<Cidade[]>

  carregandoCidades$ = new BehaviorSubject<boolean>(false)
  
  // estados = [
  //   { sigla: 'AC', nome: 'Acre'},
  //   { sigla: 'AL', nome: 'Alagoas'},
  //   { sigla: 'AP', nome: 'Amapá'},
  //   { sigla: 'AM', nome: 'Amazonas'},
  //   { sigla: 'BA', nome: 'Bahia'},
  //   { sigla: 'CE', nome: 'Ceará'},
  //   { sigla: 'DF', nome: 'Distrito Federal'},
  //   { sigla: 'ES', nome: 'Espírito Santo'},
  //   { sigla: 'GO', nome: 'Goiás'},
  //   { sigla: 'MA', nome: 'Maranhão'},
  //   { sigla: 'MT', nome: 'Mato Grosso'},
  //   { sigla: 'MS', nome: 'Mato Grosso do Sul'},
  //   { sigla: 'MG', nome: 'Minas Gerais'},
  //   { sigla: 'PA', nome: 'Pará'},
  //   { sigla: 'PB', nome: 'Paraíba'},
  //   { sigla: 'PR', nome: 'Paraná'},
  //   { sigla: 'PE', nome: 'Pernambuco'},
  //   { sigla: 'PI', nome: 'Piauí'},
  //   { sigla: 'RJ', nome: 'Rio de Janeiro'},
  //   { sigla: 'RN', nome: 'Rio Grande do Norte'},
  //   { sigla: 'RS', nome: 'Rio Grande do Sul'},
  //   { sigla: 'RO', nome: 'Rondônia'},
  //   { sigla: 'RR', nome: 'Roraima'},
  //   { sigla: 'SC', nome: 'Santa Catarina'},
  //   { sigla: 'SP', nome: 'São Paulo'},
  //   { sigla: 'SE', nome: 'Sergipe'},
  //   { sigla: 'TO', nome: 'Tocantins'}
  // ]

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cadastroService: CadastroService,        
    private ibgeService: IbgeService,
    private emailService: EmailValidatorService
  ) {

  }

  ngOnInit(): void {
    const formOptions: AbstractControlOptions = {
      validators: senhasIguaisValidator
    }

    this.dadosPessoaisForm = this.fb.group({
      nomeCompleto: ['', Validators.required],
      cpf: ['', [Validators.required, cpfValidator]],
      estado: ['', Validators.required],
      cidade: ['', Validators.required],
      email: ['', [Validators.required, Validators.email], [emailExistenteValidator(this.emailService)]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmaSenha: ['', Validators.required]
    }, formOptions)

    this.carregarEstados()
    this.configurarListernerEstado()
  }

  onAnterior(): void {
    this.salvarDadosAtuais()
    this.router.navigate(['/cadastro/area-atuacao'])
  }

  onProximo(): void {
    if(this.dadosPessoaisForm.valid) {
      this.salvarDadosAtuais()
      this.router.navigate(['/cadastro/perfil'])
    } else {
      this.dadosPessoaisForm.markAllAsTouched()
    }
  }
  private carregarEstados():void {
    this.estado$ = this.ibgeService.getEstados()  
  }

  private resetarCidade(): void {
    this.dadosPessoaisForm.get('cidade')?.setValue('')
  }

  private configurarListernerEstado(): void  {
    const estadoControl = this.dadosPessoaisForm.get('estado')

    if (estadoControl) {
      this.cidades$ = estadoControl.valueChanges.pipe(
        startWith(''), tap(()=> {
          this.resetarCidade()
          this.carregandoCidades$.next(true)
        }),
        switchMap(uf => {
          if (uf) {
            return this.ibgeService.getCidadesEstados(uf).pipe(
              tap(() => this.carregandoCidades$.next(false))
            )
          }

          this.carregandoCidades$.next(false)
          return of([])
        })
      )
    }
  }
  private salvarDadosAtuais() {
    const formValue = this.dadosPessoaisForm.value

    this;this.cadastroService.updateCadastroData({
      nomeCompleto: formValue.nomeCompleto,
      estado: formValue.estado,
      cidade: formValue.cidade,
      email: formValue.email,
      senha: formValue.senha,
    })

  }
}
