import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CombineLatestMapExampleComponent } from './combine-latest-map-example/combine-latest-map-example.component';
import { DownloadExampleComponent } from './download-example/download-example.component';
import { SidenavService } from './services';
import { UntilDestroyedExampleComponent } from './until-destroyed-example/until-destroyed-example.component';
import { UntilDestroyedComponent } from './until-destroyed-example/until-destroyed/until-destroyed.component';

@NgModule({
  declarations: [
    AppComponent,
    CombineLatestMapExampleComponent,
    UntilDestroyedExampleComponent,
    UntilDestroyedComponent,
    DownloadExampleComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,

    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    NgxJsonViewerModule,
  ],
  providers: [
    SidenavService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
