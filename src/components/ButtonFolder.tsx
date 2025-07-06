import { ImageSourcePropType, DimensionValue, View, Image, Text, Pressable, GestureResponderEvent } from "react-native"
import { getComicNueueFont } from "../utilities"

export function BaseButtonFolder({
	width = 300,
	color = "purple",
	label, iconSource, iconSize,
	iconTop, iconLeft, iconRight, iconOpacity = 0.3,
	onPress
}: {
	width?: number
	color?: string,
	label: string
	iconSource?: ImageSourcePropType, iconSize?: DimensionValue,
	iconTop?: number, iconRight?: number, iconLeft?: number, iconOpacity?: number,
	onPress?: ((event: GestureResponderEvent) => void)
}
) {
	return <Pressable
		onPress={onPress}
		style={{
			position: "relative", width, height: width, borderRadius: 16,
			aspectRatio: 1, backgroundColor: color, overflow: 'hidden',

			justifyContent: "center",
			alignItems: "center",
		}}
	>
		<Image
			width={width}
			height={width}
			source={iconSource}
			style={{
				width: iconSize, height: undefined, tintColor: "white",
				top: iconTop, right: iconRight, left: iconLeft,
				resizeMode: "cover", aspectRatio: 1, opacity: iconOpacity
			}}
		/>
		<View
			style={{
				position: "absolute",
				width: "100%", height: "100%",
				justifyContent: "flex-end",
				alignItems: "center",
				paddingBottom: width / 5,
				paddingHorizontal: 16
			}}
		>
			<Text
				children={label}
				style={{
					textAlign: "center",
					fontSize: width / 9,
					fontFamily: getComicNueueFont("bold"),
					lineHeight: 30,
					color: "white",
					maxHeight: width / 3.5
				}}
			/>
		</View>
	</Pressable>
}

export default function ButtonFolder({
	width = 300,
	color = "purple",
	label = "Sample Name",
	variation = 1,
	onPress
}: {
	width?: number
	color?: string
	label?: string
	variation?: number
	onPress?: ((event: GestureResponderEvent) => void)
}) {
	switch (variation) {
		case 1:
			return <BaseButtonFolder
				label={label}
				color={color}
				width={width}
				onPress={onPress}
				iconSource={require("../assets/images/note_1.png")}
				iconSize={"125%"}
				iconTop={-width / 5}
				iconRight={-width / 4}
			/>

		case 2:
			return <BaseButtonFolder
				label={label}
				color={color}
				width={width}
				onPress={onPress}
				iconSize={"110%"}
				iconSource={require("../assets/images/note_2.png")}
				iconTop={-width / 7}
				iconLeft={-width / 4}
			/>

		case 3:
			return <BaseButtonFolder
				label={label}
				color={color}
				width={width}
				onPress={onPress}
				iconSize={"110%"}
				iconSource={require("../assets/images/note_queue.png")}
				iconTop={-width / 8}
				iconLeft={-width / 4}
			/>

		default:
			break;
	}
}