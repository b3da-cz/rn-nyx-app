package net.b3da.nnn

import android.app.Activity
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class ShareReceiverModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    override fun initialize() {
        super.initialize()
        reactContext.addActivityEventListener(this)
    }

    override fun invalidate() {
        reactContext.removeActivityEventListener(this)
        super.invalidate()
    }

    override fun getName(): String = "ShareReceiver"

    @ReactMethod
    fun getInitialShare(promise: Promise) {
        try {
            val activity = reactContext.currentActivity
            val intent = activity?.intent
            if (intent != null) {
                val data = ShareUtils.extractShareData(intent, reactContext)
                promise.resolve(data)
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            promise.reject("E_SHARE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun clearInitialShare(promise: Promise) {
        try {
            val activity = reactContext.currentActivity
            val intent = activity?.intent
            if (intent != null && (intent.action == Intent.ACTION_SEND || intent.action == Intent.ACTION_SEND_MULTIPLE)) {
                intent.action = null
                intent.removeExtra(Intent.EXTRA_TEXT)
                intent.removeExtra(Intent.EXTRA_STREAM)
                intent.removeExtra(Intent.EXTRA_SUBJECT)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("E_CLEAR_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    override fun onNewIntent(intent: Intent) {
        try {
            val data = ShareUtils.extractShareData(intent, reactContext)
            if (data != null) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onShareReceived", data)
            }
        } catch (e: Exception) {
            Log.e("ShareReceiverModule", "Error in onNewIntent: ${e.message}", e)
        }
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {}
}
