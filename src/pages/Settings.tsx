import React, { useEffect, useState } from 'react'
import { BackHandler, Image, Pressable, ScrollView, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useTheme } from '../contexts/useTheme'
import { getComicNueueFont } from '../utilities/basic';
import { BaseButtonFolder } from '../components/ButtonFolder';
import { usePages } from '../App';
import HomeHeader from '../components/HomeHeader';
import { exportDatabase, importDatabase } from '../services/databaseService';
import { CachesDirectoryPath, readFile, stat, writeFile } from 'react-native-fs';

import Share from 'react-native-share'
import { pick } from '@react-native-documents/picker';

function Settings() {
	const { background, surface, secondary, onSecondary } = useTheme();
	const { setPage, setBackPressTarget } = usePages();

	function Button({ onPress = () => { }, src = require("../assets/images/add.png"), label = "" }) {
		return <Pressable
			onPress={onPress}
			style={{
				marginTop: 32, marginHorizontal: 20,
				paddingVertical: 12, paddingHorizontal: 16,
				flexDirection: 'row', alignItems: "center", gap: 15,
				borderRadius: 16,
				backgroundColor: secondary,
			}}
		>
			<Image
				style={{ width: 40, objectFit: "contain", aspectRatio: 1, tintColor: onSecondary }}
				source={src}
			/>
			<Text
				style={{
					fontSize: 30,
					fontFamily: getComicNueueFont("bold"),
					color: onSecondary
				}}
				children={label}
			/>
		</Pressable>
	}

	async function onExport() {
		const exportData = await exportDatabase();
		const path = `${CachesDirectoryPath}/music-export.json`
		await writeFile(path, JSON.stringify(exportData, null, 2), "utf8");
		await Share.open({
			url: `file://${path}`,
			type: "application/json",
			filename: "music-export",
			saveToFiles: true,
		})
	}

	async function onImport() {
		try {
			const result = await pick({
				type: ["application/json"]
			})
			const fileUri = result[0].uri
			const filePath = fileUri.startsWith("content://")
				? await stat(fileUri).then(stat => stat.originalFilepath).catch(err => {
					console.log("stat err:", err)
					return fileUri
				})
				: fileUri;

			const json = await readFile(filePath, "utf8");
			const importData = JSON.parse(json)

			if ('version' in importData == false || 'tables' in importData == false) {
				throw new Error("Invalid backup file")
			}

			console.log("data", importData)

			await importDatabase(importData)
			console.log("Database restored sucessfully")
			return true
		} catch (error) {

			console.error("Import failed:", error);
			throw error;
		}
	}

	return (
		<LinearGradient
			start={{ x: 0.0, y: 0.25 }}
			end={{ x: 0, y: 0.75 }}
			colors={[surface, background]}
			style={{ height: 64, flex: 1 }}
		>
			<ScrollView>
				<Button
					onPress={() => {
						onExport()
					}}
					label='Export data'
				/>
				<Button
					onPress={() => {
						onImport()
					}}
					label='Import data'
				/>
			</ScrollView>
		</LinearGradient >
	)
}

export default Settings