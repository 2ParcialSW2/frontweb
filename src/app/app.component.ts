import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'frontSi2';

  constructor(public router: Router) { }

  isLoginRoute(): boolean {
    return this.router.url === '/login' || this.router.url === '/mrp';;
  }
  isRegisterRoute(): boolean {
    return this.router.url === '/registro';
  }
  ocultarSidebar(): boolean {
    return this.isLoginRoute() || this.isRegisterRoute();
  }
}
