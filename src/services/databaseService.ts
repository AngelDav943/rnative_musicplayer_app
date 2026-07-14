import { DownloadDirectoryPath, writeFile } from 'react-native-fs';
import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let database: SQLiteDatabase | null = null

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
	if (database) return database
	return new Promise(resolve => {
		SQLite.openDatabase(
			{ name: "rn_music_database", location: "default" },
			(db) => {
				console.log("Successfully opened database")
				database = db
				resolve(db)
			},
			error => { console.error("Error while opening the local database, message:", error) }
		);
	})
}

export async function databaseInit() {
	const db = await getDatabase();

	const results = await Promise.allSettled([
		db.executeSql(`
CREATE TABLE IF NOT EXISTS songs (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"path" TEXT UNIQUE NOT NULL,
	"name" TEXT NOT NULL,
	"duration" TEXT DEFAULT "0",
	"added_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
		),
		db.executeSql(`
CREATE TABLE IF NOT EXISTS playlists (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"name" TEXT NOT NULL,
	"description" TEXT DEFAULT "",
	"color" TEXT DEFAULT "",
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
		),
		db.executeSql(`
CREATE TABLE IF NOT EXISTS playlist_song (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"song_id" INTEGER NOT NULL,
	"playlist_id" INTEGER NOT NULL,
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY ("song_id") REFERENCES songs("id"),
	FOREIGN KEY ("playlist_id") REFERENCES playlists("id")
	UNIQUE("song_id", "playlist_id")
);`
		),
		db.executeSql(`
CREATE TABLE IF NOT EXISTS settings (
	"key" TEXT PRIMARY KEY NOT NULL,
	"value" TEXT NOT NULL
);`
		),
		db.executeSql(`
CREATE TABLE IF NOT EXISTS tags (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"name" TEXT NOT NULL,
	"color" TEXT DEFAULT "#4d5fff",
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
		),
		db.executeSql(`
CREATE TABLE IF NOT EXISTS song_tag (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"song_id" INTEGER NOT NULL,
	"playlist_id" INTEGER NOT NULL,
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY ("song_id") REFERENCES songs("id"),
	FOREIGN KEY ("playlist_id") REFERENCES playlists("id")
);`
		),
		db.executeSql(`
CREATE TABLE IF NOT EXISTS recent_songs (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"song_id" INTEGER NOT NULL,
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY ("song_id") REFERENCES songs("id")
);`
		)
	])
	console.log("db init result:", results)
	return true
}

async function getTableData(db: SQLiteDatabase, table: string) {
	const [result] = await db.executeSql(`SELECT * FROM ${table}`);

	const rows = [];

	for (let i = 0; i < result.rows.length; i++) {
		rows.push(result.rows.item(i));
	}

	return rows;
}

export async function exportDatabase() {
	const db = await getDatabase();

	const tables = [
		"songs",
		"playlists",
		"playlist_song",
		"settings",
		"tags",
		"song_tag",
		"recent_songs",
	];

	const data: Record<string, any[]> = {};

	for (const table of tables) {
		data[table] = await getTableData(db, table);
	}

	return {
		version: 1,
		exportedAt: new Date().toISOString(),
		tables: data,
	};
}

export async function importDatabase(data: any) {
	const db = await getDatabase();

	await db.transaction(async tx => {
		try {

			// Disable FK checks while importing
			tx.executeSql("PRAGMA foreign_keys = OFF");

			tx.executeSql("DELETE FROM recent_songs");
			tx.executeSql("DELETE FROM song_tag");
			tx.executeSql("DELETE FROM playlist_song");
			tx.executeSql("DELETE FROM tags");
			tx.executeSql("DELETE FROM playlists");
			tx.executeSql("DELETE FROM songs");
			tx.executeSql("DELETE FROM settings");

			const tables = [
				"songs",
				"playlists",
				"playlist_song",
				"settings",
				"tags",
				"song_tag",
				"recent_songs",
			];

			console.log("hello")

			for (const table of tables) {
				// console.log("table:", table, data.tables[table])
				const rows = data.tables[table] ?? []

				for (const row of rows) {
					const columns = Object.keys(row);

					const placeholders = columns.map(() => "?").join(",");

					const values = columns.map(c => row[c]);

					await db.executeSql(
						`INSERT INTO ${table} (${columns.join(",")}) VALUES (${placeholders})`,
						values
					);
				}
			}

			await tx.executeSql("PRAGMA foreign_keys = ON");
		} catch (err) {
			console.error("importDb erro:", err)
		}

	})
}

export async function exportDatabaseToJson() {
	try {
		const backup = await exportDatabase();

		const json = JSON.stringify(backup, null, 2);

		const path = `${DownloadDirectoryPath}/music-backup.json`;

		await writeFile(path, json, "utf8");

		console.log(`Backup saved to ${path}`);

		return path;
	} catch (err) {
		console.error("Failed to export database:", err);
		throw err;
	}
}