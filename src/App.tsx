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
import { PortalProvider } from './contexts/PortalProvider';

const pagesContext = createContext<any>(null);

const pages = {
  "home": <HomePage />,
  "categories": <CategoriesPage />,
  "songs": <SongsPage />,
  "playlist": <PlaylistsPage />
} as const

interface pagesProviderUtils {
  setPage: (page: keyof typeof pages, state?: any) => void
  setBackPressTarget: React.Dispatch<React.SetStateAction<keyof typeof pages | null>>
  state: any | null
}

export const usePages: () => pagesProviderUtils = () => {
  return useContext(pagesContext);
}

function App() {
  // const { background } = useTheme();
  const [stateData, setStateData] = useState<any | null>(null);
  const [currentPage, setPage] = useState<keyof typeof pages>("home")
  const [backPressTarget, setBackPressTarget] = useState<keyof typeof pages | null>(null);

  function updateCurrentPage(target: keyof typeof pages, state: any) {
    setStateData(state)
    setPage(target)
  }

  function handleBackPress() {
    console.log("backpress", backPressTarget)
    if (backPressTarget !== null) {
      setPage(backPressTarget)
      setStateData(null)
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
      <DatabaseProvider>
        <pagesContext.Provider value={{ setPage: updateCurrentPage, setBackPressTarget, state: stateData }}>
          <PlayerProvider>
            <PortalProvider>
              {pages[currentPage]}
            </PortalProvider>
          </PlayerProvider>
        </pagesContext.Provider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}
export default App;
