import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
	return new Promise(resolve => {
		SQLite.openDatabase(
			{ name: "rn_music_database", location: "default" },
			(db) => {
				console.log("Successfully opened database")
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
	"added_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
		),
		db.executeSql(`
CREATE TABLE IF NOT EXISTS playlists (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"name" TEXT NOT NULL,
	"description" TEXT DEFAULT "",
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
	"song_id" INTEGER UNIQUE NOT NULL,
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY ("song_id") REFERENCES songs("id")
);`
		)
	])
	console.log("db init result:", results)
	return true
}