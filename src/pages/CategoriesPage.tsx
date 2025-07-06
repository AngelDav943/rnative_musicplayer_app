import React, { useState } from 'react'
import { Text, View } from 'react-native'
import { ReadDirItem, readDir } from 'react-native-fs';
import { hasStoragePerms, mergeGroupsIntersection } from '../utilities';


function CategoriesPage() {

	const [files, setFiles] = useState<ReadDirItem[]>([]);
	async function readDirectory() {
		if (await hasStoragePerms() == false) return
		try {

			const files: ReadDirItem[] = []
			const dir = await readDir("/storage/emulated/0/Music")
			dir.forEach(item => {
				if (item.isFile()) files.push(item)
			})


			const groups: Record<string, ReadDirItem[]> = {}
			files.forEach(file => {
				const [name, ext] = file.name.split(".")
				const words = name.split(/[\s\-_\.]+/)
				for (const word of words) {
					const cleanedWord = word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
					if (cleanedWord.length == 0) continue;

					if (groups[word] == undefined) {
						groups[word] = []
					}

					groups[word].push(file)
				}
			})

			const filteredGroups: Record<string, ReadDirItem[]> = {}
			for (const key in groups) {
				const element = groups[key];
				if (element.length > 1) filteredGroups[key] = element
			}

			const couldPair: Array<string[]> = [];
			for (const name in filteredGroups) {
				const group = filteredGroups[name];
				for (const targetName in filteredGroups) {
					if (targetName == name) continue;
					const targetGroup = filteredGroups[targetName];

					const setA = new Set(group);
					const setB = new Set(targetGroup);
					if (setA.size !== setB.size) continue

					let shouldPair = true;
					for (const item of setA) {
						if (!setB.has(item)) shouldPair = false;
					}

					if (shouldPair && couldPair.find(item => item[0] == targetName && item[1] == name) == undefined) {
						couldPair.push([name, targetName])
					}
				}
			}

			let resultGroup: Record<string, ReadDirItem[]> = {}
			for (const pair of couldPair) {
				resultGroup[pair.join(" ")] = mergeGroupsIntersection(filteredGroups, pair)
			}

			console.log("COULD PAIR", couldPair)
			console.log("GROUPS", resultGroup)

			setFiles(files)
			console.log("hii", files)
		} catch (error) {
			console.error(error)
		}
	}

	return (
		<View>
			<Text>Categories</Text>
		</View>
	)
}

export default CategoriesPage