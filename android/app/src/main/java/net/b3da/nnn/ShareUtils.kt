package net.b3da.nnn

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.provider.OpenableColumns
import android.util.Log
import android.webkit.MimeTypeMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import java.io.File
import java.io.FileOutputStream

object ShareUtils {

    fun extractShareData(intent: Intent, context: Context): WritableMap? {
        val action = intent.action ?: return null
        if (action != Intent.ACTION_SEND && action != Intent.ACTION_SEND_MULTIPLE) {
            return null
        }

        val map = Arguments.createMap()
        val extraText = intent.getStringExtra(Intent.EXTRA_TEXT)
        val extraSubject = intent.getStringExtra(Intent.EXTRA_SUBJECT)
        val text = when {
            !extraText.isNullOrEmpty() && !extraSubject.isNullOrEmpty() && extraText != extraSubject -> "$extraSubject\n$extraText"
            !extraText.isNullOrEmpty() -> extraText
            !extraSubject.isNullOrEmpty() -> extraSubject
            else -> null
        }

        var streamUri: Uri? = null
        if (action == Intent.ACTION_SEND) {
            streamUri = intent.getParcelableExtra(Intent.EXTRA_STREAM) as? Uri
            if (streamUri == null && intent.clipData != null && intent.clipData!!.itemCount > 0) {
                streamUri = intent.clipData!!.getItemAt(0).uri
            }
        } else if (action == Intent.ACTION_SEND_MULTIPLE) {
            val uris = intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)
            if (!uris.isNullOrEmpty()) {
                streamUri = uris[0]
            } else if (intent.clipData != null && intent.clipData!!.itemCount > 0) {
                streamUri = intent.clipData!!.getItemAt(0).uri
            }
        }

        if (streamUri != null) {
            val mimeType = intent.type ?: "*/*"
            val fileMap = copyUriToCache(streamUri, context, mimeType)
            if (fileMap != null) {
                map.putString("type", "file")
                map.putMap("file", fileMap)
                if (!text.isNullOrEmpty()) {
                    map.putString("text", text)
                }
                return map
            }
        }

        if (!text.isNullOrEmpty()) {
            map.putString("type", "text")
            map.putString("text", text)
            return map
        }

        return null
    }

    private fun copyUriToCache(uri: Uri, context: Context, mimeType: String): WritableMap? {
        try {
            val contentResolver = context.contentResolver
            var fileName = "shared_file"
            var fileSize: Long = 0

            contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val nameIdx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    if (nameIdx != -1) {
                        val name = cursor.getString(nameIdx)
                        if (!name.isNullOrEmpty()) fileName = name
                    }
                    val sizeIdx = cursor.getColumnIndex(OpenableColumns.SIZE)
                    if (sizeIdx != -1) {
                        fileSize = cursor.getLong(sizeIdx)
                    }
                }
            }

            var resolvedType = contentResolver.getType(uri) ?: mimeType
            if (resolvedType == "*/*" && fileName.contains(".")) {
                val inferred = MimeTypeMap.getSingleton().getMimeTypeFromExtension(fileName.substringAfterLast(".").lowercase())
                if (!inferred.isNullOrEmpty()) resolvedType = inferred
            }
            if (!fileName.contains(".") && resolvedType.contains("/")) {
                val ext = MimeTypeMap.getSingleton().getExtensionFromMimeType(resolvedType)
                if (!ext.isNullOrEmpty()) fileName = "$fileName.$ext"
            }

            val shareDir = File(context.cacheDir, "shared_temp").apply { if (!exists()) mkdirs() }
            val safeName = "${System.currentTimeMillis()}_${fileName.replace("[^a-zA-Z0-9._-]".toRegex(), "_")}"
            val destFile = File(shareDir, safeName)
            contentResolver.openInputStream(uri)?.use { input -> FileOutputStream(destFile).use { input.copyTo(it) } }
            if (fileSize <= 0) fileSize = destFile.length()
            var thumbnailUri: String? = null
            if (resolvedType.startsWith("video/")) {
                try {
                    val retriever = MediaMetadataRetriever()
                    retriever.setDataSource(destFile.path)
                    val bitmap = retriever.frameAtTime
                    retriever.release()
                    if (bitmap != null) {
                        val thumbFile = File(shareDir, "thumb_${safeName}.jpg")
                        FileOutputStream(thumbFile).use { out ->
                            bitmap.compress(Bitmap.CompressFormat.JPEG, 80, out)
                        }
                        thumbnailUri = Uri.fromFile(thumbFile).toString()
                    }
                } catch (e: Exception) {
                    Log.w("ShareUtils", "Video thumb error: ${e.message}")
                }
            } else if (resolvedType.startsWith("image/")) {
                thumbnailUri = Uri.fromFile(destFile).toString()
            }

            val map = Arguments.createMap()
            map.putString("uri", Uri.fromFile(destFile).toString())
            map.putString("name", fileName)
            map.putString("type", resolvedType)
            map.putDouble("size", fileSize.toDouble())
            if (thumbnailUri != null) {
                map.putString("thumbnailUri", thumbnailUri)
            }
            return map
        } catch (e: Exception) {
            Log.e("ShareUtils", "Failed to cache shared uri: ${e.message}", e)
            return null
        }
    }
}
