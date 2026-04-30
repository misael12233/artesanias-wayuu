import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveHostFromExpo() {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.manifest2?.extra?.expoGo?.debuggerHost ??
    null;

  if (!hostUri) {
    return null;
  }

  return hostUri.split(':')[0];
}

export function getApiBaseUrl() {
  const expoHost = resolveHostFromExpo();

  if (expoHost) {
    return `http://${expoHost}:3001`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001';
  }

  return 'http://localhost:3001';
}

export const API_BASE_URL = getApiBaseUrl();
