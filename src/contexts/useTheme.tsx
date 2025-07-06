import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { StatusBar, useColorScheme } from "react-native";
import { AudioPro, AudioProContentType } from "react-native-audio-pro";
import { ReadDirItem } from "react-native-fs";

const themeContext = createContext<any>(null);

interface ProviderUtils {
	background: string;
	surface: string;
	secondary: string;
	primary: string;
	error: string;
	onBackground: string;
	onSurface: string;
	onSecondary: string;
	onPrimary: string;
	onError: string;
	inversePrimary: string;
}

export const useTheme: () => ProviderUtils = () => {
	return useContext(themeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const isLightMode = useColorScheme() === 'light';

	const exportUtils: ProviderUtils = isLightMode ? {
		background: " rgba(202, 219, 233, 1)",
		surface: " rgba(176, 198, 247, 1)",
		secondary: " rgba(135, 122, 219, 1)",
		primary: " rgba(117, 172, 255, 1)",
		error: " rgba(187, 53, 53, 1)",
		onBackground: " rgb(246, 248, 252)",
		onSurface: " rgba(77, 95, 255, 1)",
		onSecondary: " rgba(177, 193, 225, 1)",
		onPrimary: " rgba(201, 214, 250, 1)",
		onError: " rgba(255, 207, 207, 1)",
		inversePrimary: " rgba(255, 216, 110, 1))",
	} : {
		background: " rgba(32, 32, 32, 1.0)",
		surface: " rgba(77, 84, 97, 1)",
		secondary: " rgba(105, 95, 172, 1)",
		primary: " rgba(117, 125, 229, 1)",
		error: " rgba(187, 53, 53, 1)",
		onBackground: " rgba(255, 255, 255, 1.0)",
		onSurface: " rgba(255, 255, 255, 1.0)",
		onSecondary: " rgba(177, 193, 225, 1)",
		onPrimary: " rgba(201, 214, 250, 1)",
		onError: " rgba(255, 207, 207, 1)",
		inversePrimary: " rgba(255, 216, 110, 1))",
	}

	return (
		<themeContext.Provider value={{ ...exportUtils }}>
			<StatusBar
				barStyle={isLightMode ? 'dark-content' : 'light-content'}
				backgroundColor={"#00000000"}
				translucent={true}
			/>
			{children}
		</themeContext.Provider>
	)
}