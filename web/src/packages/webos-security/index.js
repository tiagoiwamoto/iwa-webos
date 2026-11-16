import osjs from 'osjs';
import {name as applicationName} from './metadata.json';
import {serverApp} from '../_shared/server-app.js';

osjs.register(applicationName, serverApp('security',
  {width: 700, height: 460}));
