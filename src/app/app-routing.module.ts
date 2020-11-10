import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CombineLatestMapExampleComponent } from './combine-latest-map-example/combine-latest-map-example.component';

export const routes: Routes = [
  { path: 'combineLatestMap', component: CombineLatestMapExampleComponent },
  { path: '**', redirectTo: 'combineLatestMap', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
