import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { SharedService } from './app/shared.service';


platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
