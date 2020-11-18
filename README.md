#  Plugin-based architecture in angular

## Step 1: Create the core application project

### 1.1: Install @angular/cli and rollup.js
```bash
$ npm install @angular/cli -g 
$ npm install rollup@0.55.1 -g
```

### 1.2: Make core-app
```bash
$ ng new core-app
```

### 1.3: Install SystemJS library
.../core-app:
```bash
$ npm install systemjs@0.21.4
```

### 1.4: Add systemjs bundle script under the scripts section in the angular.json file

.../core-app/angular.json:
```
"scripts": [
    "./node_modules/systemjs/dist/system.js"
]
```

### 1.5: we need to provide the JitCompilerFactory to the browser using the following code in our app.module.ts file

.../core-app/src/app/app.module.ts:
```
import { COMPILER_OPTIONS, CompilerFactory, Compiler } from '@angular/core';
import { JitCompilerFactory } from '@angular/platform-browser-dynamic';

export function createCompiler(fn: CompilerFactory): Compiler {     
    return fn.createCompiler();
}
```
and add this to providers array:
```
providers: [{
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
}]
```

### 1.6: In the core application’s main.ts file we would need to set the existing vendor modules into SystemJS registry

.../core-app/src/main.ts:
```
declare const SystemJS;

import * as angularCore from '@angular/core';
import * as angularCommon from '@angular/common';

SystemJS.set('@angular/core', SystemJS.newModule(angularCore));
SystemJS.set('@angular/common', SystemJS.newModule(angularCommon));
```

### 1.7: Open your app.component.ts and let’s code the following

.../core-app/src/app/app.component.ts:
```
import {
  AfterViewInit, Component, Compiler, Injector, ViewChild,
  ViewContainerRef
} from '@angular/core';

declare const SystemJS: any;

@Component({
  selector: 'app-root',
  template: '<div #content></div>'
})
export class AppComponent implements AfterViewInit {
  @ViewChild('content', { read: ViewContainerRef }) content: ViewContainerRef;

  constructor(private _compiler: Compiler, private _injector: Injector) { }

  ngAfterViewInit() {
    this.loadPlugins();
  }

  private async loadPlugins() {
    // import external module bundle
    const module = await SystemJS.import("assets/plugins/plugin-a.bundle.js");

    // compile module
    const moduleFactory = await this._compiler
      .compileModuleAsync<any>(module["AppModule"]);

    // resolve component factory
    const moduleRef = moduleFactory.create(this._injector);

    //get the custom made provider name 'plugins' 
    const componentProvider = moduleRef.injector.get('plugins');

    //from plugins array load the component on position 0 
    const componentFactory = moduleRef.componentFactoryResolver
      .resolveComponentFactory<any>(
        componentProvider[0][0].component
      );

    // compile component 
    var pluginComponent = this.content.createComponent(componentFactory);

    //sending @Input() values 
    //pluginComponent.instance.anyInput = "inputValue"; 

    //accessing the component template view
    //(pluginComponent.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
  }
}
```

* Note: you can change imported external module address to load another plugin project

## Step 2: Create a simple plugin project

### 2.1: Create a folder named “plugins” and inside that one create a folder named “plugin-a” & In the “plugin-a” folder create a package.json file having the following structure

.../plugins/plugin-a/package.json:
```
{
    "name": "plugin-a",
    "version": "1.0.0",
    "license": "MIT",
    "scripts": {
        "build": "rollup -c"
    },
    "dependencies": {
        "@angular/common": "5.2.0",
        "@angular/core": "5.2.0",
        "rollup": "0.55.1",
        "rxjs": "5.5.6"
    },
    "devDependencies": {
        "rollup-plugin-angular": "^0.5.3",
        "rollup-plugin-commonjs": "8.3.0",
        "rollup-plugin-node-resolve": "3.0.2",
        "rollup-plugin-typescript": "0.8.1",
        "rollup-plugin-typescript2": "0.10.0",
        "typescript": "2.5.3"
    }
}
```

### 2.2: Run npm install inside the folder

.../plugins/plugin-a:
```bash
$ npm install
```

### 2.3: Create a tsconfig.json file having the following code

.../plugins/plugin-a/tsconfig.json:
```
{
    "compileOnSave": false,
    "compilerOptions": {
        "baseUrl": "./",
        "outDir": "./dist/out-tsc",
        "sourceMap": true,
        "declaration": false,
        "module": "es2015",
        "moduleResolution": "node",
        "emitDecoratorMetadata": true,
        "experimentalDecorators": true,
        "target": "es5",
        "typeRoots": [
            "node_modules/@types"
        ],
        "lib": [
            "es2017",
            "dom"
        ]
    }
}
```

### 2.4: Create src/app folders inside plugin-a and then a simple component file

.../plugins/plugin-a/src/app/plugin-a.component.ts:
```
import { Component } from '@angular/core';

@Component({
    selector: 'Plugin-a-component',
    template: `<h3>plugin-a</h3>`
})
export class PluginAComponent {
    constructor() { }
}
```

### 2.5: Create and configure our plugin module file

.../plugins/plugin-a/src/app/plugin-a.module.ts:
```
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PluginAComponent } from './plugin-a.component';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [PluginAComponent],
    entryComponents: [PluginAComponent],
    providers: [{
        provide: 'plugins',
        useValue: [{
            name: 'plugin-a-component',
            component: PluginAComponent
        }],
        multi: true
    }]
})
export class AppModule { }
```

* Note: It is important that the class name is 'AppModule'

### 2.6: Create the main.ts file which will export the AppModule

.../plugins/plugin-a/src/main.ts:
```
export { AppModule } from './app/plugin-a.module';
```

### 2.7: Creating a rollup.config.js file to the plugin-a folder which will describe the rollup bundle configurations

.../plugins/plugin-a/rollup.config.js:
```
import angular from 'rollup-plugin-angular';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';

export default [{
    input: 'src/main.ts',
    output: {
        file: '../../core-app/src/assets/plugins/plugin-a.bundle.js',
        format: 'umd',
        name: 'plugin-a',
    },
    plugins: [
        angular(),
        resolve({
            jsnext: true,
            main: true,
            // pass custom options to the resolve plugin
            customResolveOptions: {
                moduleDirectory: 'node_modules'
            }
        }),
        typescript({
            typescript: require('typescript')
        }),
        commonjs()
    ],
    external: [
        '@angular/core',
        '@angular/common'
    ]
}]
```

* Note: you can change your output file name here

### 2.8: Run npm run build and navigate to core-app/src/assets/plugins to see the plugin-a.bundle.js file

.../plugins/plugin-a:
```bash
$ npm run build
```

* Note: you must build after each change in plugin project

### 2.9: Run 'ng serve' to see result

.../core-app:
```bash
$ ng serve
```

## Note: If you are downloading this project, first, you need to Run 'npm install' inside the all of project folders

.../core-app:
```bash
$ npm install
```

.../plugins/plugin-a:
```bash
$ npm install
```

.../plugins/plugin-b:
```bash
$ npm install
```

![Image of Yaktocat](readmeImage/img1.png)
![Image of Yaktocat](readmeImage/img2.png)
