import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { COMPILER_OPTIONS, CompilerFactory, Compiler } from '@angular/core';
import { JitCompilerFactory } from '@angular/platform-browser-dynamic';

export function createCompiler(fn: CompilerFactory): Compiler {     
     return fn.createCompiler();
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [
    {
      provide: COMPILER_OPTIONS,
      useValue: {},
      multi: true
    },
    {
      provide: CompilerFactory,
      useClass: JitCompilerFactory,
      deps: [COMPILER_OPTIONS]
    },
    {
      provide: Compiler,
      useFactory: createCompiler,
      deps: [CompilerFactory]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
