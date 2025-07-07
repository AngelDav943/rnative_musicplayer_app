import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { AudioPro, AudioProContentType } from "react-native-audio-pro";
import { exists, readDir, ReadDirItem } from "react-native-fs";
import { databaseInit, getDatabase } from "../utilities/database";
import { getNameAndExtension, hasStoragePerms } from "../utilities/basic";
import { DB_song, song } from "../types/song";
import { setting } from "../types/settings";
import { ResultSet, SQLiteDatabase } from "react-native-sqlite-storage";
import { scanSongFolder, scanSongDB } from "../utilities/songDatabase";

const databaseContext = createContext<any>(null);

interface ProviderUtils {
	getDB: () => Promise<SQLiteDatabase>
}

export const useDatabase: () => ProviderUtils = () => {
	return useContext(databaseContext);
}

export function DatabaseProvider({ children }: { children: ReactNode }) {
	const [db, setDB] = useState<SQLiteDatabase | null>(null);

	async function getDB() {
		const database = db == null ? await getDatabase() : db
		if (db == null) {
			setDB(database)
		}
		return database
	}

	const exportUtils: ProviderUtils = { getDB }

	async function init() {
		if (db == null) {
			const db = await getDatabase();
			setDB(db)
		}
	}

	useEffect(() => {
		init()

		return () => {
			if (db) db.close()
		}
	}, [])

	return (
		<databaseContext.Provider value={{ ...exportUtils }}>
			{children}
		</databaseContext.Provider>
	)
}