/**
 * @format
 */

import { enableScreens } from 'react-native-screens';
import { AppRegistry } from 'react-native';

enableScreens(true);
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
