import React from 'react'
import { DimensionValue, Image, ImageSourcePropType, Pressable, ScrollView, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useTheme } from '../contexts/useTheme'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getComicNueueFont } from '../utilities';
import ButtonFolder, { BaseButtonFolder } from '../components/ButtonFolder';
import { usePages } from '../App';

function HomePage() {
	const { background, onBackground, surface, onSurface, secondary } = useTheme();
	const { setPage, setBackPressTarget } = usePages();

	return (
		<LinearGradient
			start={{ x: 0.0, y: 0.25 }}
			end={{ x: 0, y: 0.75 }}
			colors={[surface, background]}
			style={{ height: 64, flex: 1 }}
		>
			<ScrollView>
				<SafeAreaView style={{ flex: 1 }}>

					<View>
						<View
							style={{
								paddingVertical: 10, paddingHorizontal: 20,
								flexDirection: 'row', alignItems: "center", gap: 15
							}}
						>
							<Image
								style={{ width: 80, objectFit: "contain", aspectRatio: 1, tintColor: onSurface }}
								source={require("../assets/images/note_queue.png")}
							/>
							<Text
								style={{
									fontSize: 35,
									fontFamily: getComicNueueFont("bold"),
									color: onSurface
								}}
								children="Playlists"
							/>
						</View>
						<ScrollView horizontal={true} style={{ paddingBottom: 32 }}>
							<View style={{ paddingHorizontal: 20, flexDirection: "row", gap: 10, alignItems: "center" }}>
								<ButtonFolder width={210} color='#094813' />
								<ButtonFolder width={210} variation={3} color='#318fff' />
								<ButtonFolder width={210} variation={2} color='#ff7800' />
								<View style={{ width: 10 }} />
								<BaseButtonFolder
									label=''
									color=" rgb(24, 192, 52)"
									iconSize={"70%"}
									iconTop={0}
									iconSource={require("../assets/images/new_queue.png")}
									width={160}
									iconOpacity={0.6}
								/>
							</View>
						</ScrollView>
					</View>
					<Text>
						Lorem ipsum dolor sit, amet consectetur adipisicing elit. Natus sunt quidem laudantium debitis,
						quas illum accusantium sit nostrum praesentium et vero modi dolorum illo quibusdam libero saepe inventore similique deserunt!
					</Text>
					<Text>
						Lorem ipsum dolor sit, amet consectetur adipisicing elit. Natus sunt quidem laudantium debitis,
						quas illum accusantium sit nostrum praesentium et vero modi dolorum illo quibusdam libero saepe inventore similique deserunt!
					</Text>
					<Text>
						Lorem ipsum dolor sit, amet consectetur adipisicing elit. Natus sunt quidem laudantium debitis,
						quas illum accusantium sit nostrum praesentium et vero modi dolorum illo quibusdam libero saepe inventore similique deserunt!
					</Text>
					<Text>
						Lorem ipsum dolor sit, amet consectetur adipisicing elit. Natus sunt quidem laudantium debitis,
						quas illum accusantium sit nostrum praesentium et vero modi dolorum illo quibusdam libero saepe inventore similique deserunt!
					</Text>
					<Pressable
						onPress={() => {
							setBackPressTarget("home")
							setPage("songs")
						}}
						style={{
							backgroundColor: secondary,
							padding: 16,
							borderRadius: 16,
							margin: 16
						}}
					>
						<Text>Open songs</Text>
					</Pressable>

				</SafeAreaView>
			</ScrollView>
		</LinearGradient>
	)
}

export default HomePage