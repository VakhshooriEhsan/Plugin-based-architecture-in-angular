import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PluginBComponent } from './plugin-b.component';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [PluginBComponent],
    entryComponents: [PluginBComponent],
    providers: [{
        provide: 'plugins',
        useValue: [{
            name: 'plugin-b-component',
            component: PluginBComponent
        }],
        multi: true
    }]
})
export class AppModule { }
