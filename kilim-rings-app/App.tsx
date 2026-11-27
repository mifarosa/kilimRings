import React, { useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/AppContext';
import { LEVEL_COUNT } from './src/engine/levels';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { MapScreen } from './src/screens/MapScreen';
import { SettingsModal } from './src/screens/SettingsModal';
import { C } from './src/theme';

const noSelect = { userSelect: 'none' } as object; // web preview only; ignored on iOS

type Route = { name: 'home' } | { name: 'map' } | { name: 'game'; idx: number };

function Root() {
  const { save } = useApp();
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [settings, setSettings] = useState(false);

  const firstOpen = () => Math.min(LEVEL_COUNT - 1, save.unlocked);

  return (
    <View style={[{ flex: 1, backgroundColor: C.bg }, noSelect]}>
      <View style={{ flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        {route.name === 'home' && (
          <HomeScreen onPlay={() => setRoute({ name: 'game', idx: firstOpen() })} onMap={() => setRoute({ name: 'map' })} onSettings={() => setSettings(true)} />
        )}
        {route.name === 'map' && <MapScreen onBack={() => setRoute({ name: 'home' })} onPick={(idx) => setRoute({ name: 'game', idx })} />}
        {route.name === 'game' && (
          <GameScreen idx={route.idx} onBack={() => setRoute({ name: 'home' })} onMap={() => setRoute({ name: 'map' })} onGoto={(idx) => setRoute({ name: 'game', idx })} />
        )}
      </View>
      <SettingsModal visible={settings} onClose={() => setSettings(false)} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}
