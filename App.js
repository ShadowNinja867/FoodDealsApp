import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FoodDealsMap } from './src/components/FoodDealsMap';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <FoodDealsMap />
    </SafeAreaProvider>
  );
}
