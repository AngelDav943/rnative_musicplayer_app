/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { BackHandler, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { PlayerProvider } from './contexts/usePlayer';
import LinearGradient from 'react-native-linear-gradient';
import { ThemeProvider, useTheme } from './contexts/useTheme';
import { createContext, useContext, useEffect, useState } from 'react';
import HomePage from './pages/HomePage';
import CategoriesPage from './pages/CategoriesPage';
import SongsPage from './pages/SongsPage';
import PlaylistsPage from './pages/PlaylistsPage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from './contexts/useDatabase';

const pagesContext = createContext<any>(null);

const pages = {
  "home": <HomePage />,
  "categories": <CategoriesPage />,
  "songs": <SongsPage />,
  "playlists": <PlaylistsPage />
} as const

interface pagesProviderUtils {
  setPage: React.Dispatch<React.SetStateAction<keyof typeof pages>>
  setBackPressTarget: React.Dispatch<React.SetStateAction<keyof typeof pages | null>>
}

export const usePages: () => pagesProviderUtils = () => {
  return useContext(pagesContext);
}

function App() {
  // const { background } = useTheme();
  const [currentPage, setPage] = useState<keyof typeof pages>("home")
  const [backPressTarget, setBackPressTarget] = useState<keyof typeof pages | null>(null);

  function handleBackPress() {
    console.log("backpress", backPressTarget)
    if (backPressTarget !== null) {
      setPage(backPressTarget)
      setBackPressTarget(null)
      return true
    }
    return false
  }

  useEffect(() => {
    const backEvent = BackHandler.addEventListener('hardwareBackPress', handleBackPress)

    return () => {
      backEvent.remove()
    }
  }, [backPressTarget])

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <DatabaseProvider>
          <pagesContext.Provider value={{ setPage, setBackPressTarget }}>
            <PlayerProvider>
              {pages[currentPage]}
            </PlayerProvider>
          </pagesContext.Provider>
        </DatabaseProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
export default App;
