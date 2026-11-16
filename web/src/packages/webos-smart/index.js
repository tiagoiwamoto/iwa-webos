import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {serverApp} from '../_shared/server-app.js';

osjs.register(applicationName, serverApp('smart',
  {width: 760, height: 440}));
