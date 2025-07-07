import React from 'react'
import { View, Image, Text, ImageSourcePropType } from 'react-native'
import { getComicNueueFont } from '../utilities/basic'
import { useTheme } from '../contexts/useTheme';

function HomeHeader({ icon, label }: { icon: ImageSourcePropType, label: string }) {
	const { background, onBackground, surface, onSurface, secondary, onSecondary } = useTheme();

	return <View
		style={{
			paddingVertical: 10, paddingHorizontal: 20,
			flexDirection: 'row', alignItems: "center", gap: 15
		}}
	>
		<Image
			style={{ width: 64, objectFit: "contain", aspectRatio: 1, tintColor: onSurface }}
			source={icon}
		/>
		<Text
			style={{
				fontSize: 35,
				fontFamily: getComicNueueFont("bold"),
				color: onSurface
			}}
			children={label}
		/>
	</View>
}

export default HomeHeader