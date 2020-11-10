import { Component } from '@angular/core';
import { routes } from './app-routing.module';
import { SidenavService } from './services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  routes = routes.filter((r) => r.path !== '**');

  constructor(
    public sidenavService: SidenavService,
  ) {
  }
}
