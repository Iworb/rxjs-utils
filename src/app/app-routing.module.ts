import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CombineLatestMapExampleComponent } from './combine-latest-map-example/combine-latest-map-example.component';
import { DownloadExampleComponent } from './download-example/download-example.component';
import { UntilDestroyedExampleComponent } from './until-destroyed-example/until-destroyed-example.component';

export const routes: Routes = [
  { path: 'combineLatestMap', component: CombineLatestMapExampleComponent },
  { path: 'download', component: DownloadExampleComponent },
  { path: 'untilDestroyed', component: UntilDestroyedExampleComponent },
  { path: '**', redirectTo: 'combineLatestMap', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
