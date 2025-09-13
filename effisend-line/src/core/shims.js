import { fetch as expoFetch } from 'expo/fetch';

global.fetch = expoFetch;