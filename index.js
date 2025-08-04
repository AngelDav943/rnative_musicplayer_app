/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import { setupListeners, setupPlayer } from './src/services/audioService';
import { databaseInit, initDatabase } from './src/services/databaseService';
import { setupService } from './src/services/rtcService';
import { registerGlobals } from 'react-native-webrtc';

setupPlayer()
setupListeners()
databaseInit()
registerGlobals()
setupService()

AppRegistry.registerComponent(appName, () => App);
