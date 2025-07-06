import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, Image } from 'react-native'
import { ReadDirItem, readDir } from 'react-native-fs';
import { hasStoragePerms } from '../utilities';
import { AudioPro } from 'react-native-audio-pro';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/useTheme';

function SongsPage() {
	const { background, onBackground, surface, secondary } = useTheme();

	const [files, setFiles] = useState<ReadDirItem[]>([]);
	async function readDirectory() {
		if (await hasStoragePerms() == false) return
		try {
			const files: ReadDirItem[] = []
			const dir = await readDir("/storage/emulated/0/Music")
			dir.forEach(item => {
				if (item.isFile()) files.push(item)
			})
			setFiles(files)
		} catch (error) {
			console.error(error)
		}
	}

	async function onClick(path: string, fileName: string) {
		try {
			const [name, ext] = fileName
				.replace("_", " ")
				.replace(/([a-z0-9])([A-Z])/g, (_, a, b) => `${a} ${b}`)
				.split(".")

			// const fileContent = await readFile(path, 'base64');

			console.log("filepath", `file://${path}`,)
			AudioPro.play({
				id: path,
				artwork: require("../assets/images/gradient.png"),
				// artwork: "https://angeldav.net/images/boxly.png",
				url: `file://${path}`,
				title: name,
			})
		} catch (error) {
			console.warn("err", error)
		}
	}

	useEffect(() => {
		readDirectory()
	}, [])

	return (
		<LinearGradient
			start={{ x: 0.0, y: 0.25 }}
			end={{ x: 0, y: 0.75 }}
			colors={[surface, background]}
			style={{ height: 64, flex: 1 }}
		>
			<ScrollView style={{ paddingVertical: 64, paddingHorizontal: 16 }}>
				{files.map(file => {
					const [name, ext] = file.name
						.replace("_", " ")
						.replace(/([a-z0-9])([A-Z])/g, (_, a, b) => `${a} ${b}`)
						.split(".")

					return (
						<Pressable
							key={file.path}
							onPress={() => onClick(file.path, file.name)}
							style={{
								paddingVertical: 10, paddingHorizontal: 14, backgroundColor: secondary,
								marginBottom: 5, flexDirection: "row", borderRadius: 16, alignItems: "center",
								gap: 16
							}}
						>
							<Image
								style={{ width: 40, height: undefined, aspectRatio: 1 }}
								source={require("../assets/images/note_2.png")}
							/>
							<Text style={{ color: "white", fontWeight: "bold", flexWrap: 'wrap' }}>{name}</Text>
						</Pressable>
					)
				})}
			</ScrollView>
		</LinearGradient>
	)
}

export default SongsPage