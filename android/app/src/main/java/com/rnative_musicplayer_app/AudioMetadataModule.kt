package com.rnative_musicplayer_app

import android.media.MediaMetadataRetriever
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class AudioMetadataModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "AudioMetadata"
    }

    @ReactMethod
    fun getDuration(filePath: String, promise: Promise) {
        val retriever = MediaMetadataRetriever()
        try {
            retriever.setDataSource(filePath)
            val durationStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
            val durationMs = durationStr?.toLongOrNull() ?: 0L
            promise.resolve(durationMs.toDouble())
        } catch (e: Exception) {
            Log.e("AudioMetadataModule", "Failed to get duration", e)
            promise.reject("ERROR", "Could not retrieve duration", e)
        } finally {
            retriever.release()
        }
    }
}
