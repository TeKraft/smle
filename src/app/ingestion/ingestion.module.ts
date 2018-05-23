import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { CommonSmleModule } from '../common/common.module';
import { CreateNewButtonComponent } from './create-new-button/create-new-button.component';
import { LoginViewComponent } from './login-view/login-view.component';
import { LogoutButtonComponent } from './logout-button/logout-button.component';
import { PublishButtonComponent } from './publish-button/publish-button.component';
import { PublishModalComponent } from './publish-modal/publish-modal.component';
import { AuthGuard, AuthService } from './services/auth.service';
import { CncService } from './services/cnc.service';
import { IngestionHandlerService } from './services/handler.service';
import { StreamsComponent } from './streams/streams.component';

const ROUTES: Routes = [
  { path: '', component: StreamsComponent, canActivate: [AuthGuard] },
  { path: 'streams', component: StreamsComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginViewComponent }
];

@NgModule({
  declarations: [
    StreamsComponent,
    PublishButtonComponent,
    PublishModalComponent,
    CreateNewButtonComponent,
    LoginViewComponent,
    LogoutButtonComponent
  ],
  entryComponents: [
    PublishModalComponent
  ],
  exports: [
    PublishButtonComponent,
    CreateNewButtonComponent,
    LogoutButtonComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    CommonSmleModule,
    RouterModule.forRoot(ROUTES)
  ],
  providers: [
    CncService,
    AuthService,
    AuthGuard,
    IngestionHandlerService
  ]
})
export class IngestionModule { }