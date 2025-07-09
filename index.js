/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import { setupListeners, setupPlayer } from './src/services/audioService';
import { databaseInit, initDatabase } from './src/services/databaseService';

setupPlayer()
setupListeners()
databaseInit()

AppRegistry.registerComponent(appName, () => App);
