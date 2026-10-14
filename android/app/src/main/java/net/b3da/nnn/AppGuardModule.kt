package net.b3da.nnn

import android.content.pm.PackageManager
import android.view.WindowManager
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.concurrent.atomic.AtomicBoolean

class AppGuardModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "AppGuard"

  companion object {
    var secure: Boolean = false
  }

  @ReactMethod
  fun hasFingerprint(promise: Promise) {
    val has = reactContext.packageManager.hasSystemFeature(PackageManager.FEATURE_FINGERPRINT)
    promise.resolve(has)
  }

  @ReactMethod
  fun authenticate(title: String, cancel: String, promise: Promise) {
    val activity = reactContext.currentActivity as? FragmentActivity
    if (activity == null) {
      promise.resolve(false)
      return
    }
    activity.runOnUiThread {
      val settled = AtomicBoolean(false)
      fun finish(ok: Boolean) {
        if (settled.compareAndSet(false, true)) {
          promise.resolve(ok)
        }
      }
      val prompt =
          BiometricPrompt(
              activity,
              ContextCompat.getMainExecutor(activity),
              object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                  finish(true)
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                  finish(false)
                }
              },
          )
      val info =
          BiometricPrompt.PromptInfo.Builder()
              .setTitle(title)
              .setNegativeButtonText(cancel)
              .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
              .build()
      try {
        prompt.authenticate(info)
      } catch (_: Throwable) {
        finish(false)
      }
    }
  }

  @ReactMethod
  fun setSecure(enabled: Boolean) {
    secure = enabled
    val activity = reactContext.currentActivity ?: return
    activity.runOnUiThread { applySecure(activity, enabled) }
  }
}

fun applySecure(activity: android.app.Activity, enabled: Boolean) {
  if (enabled) {
    activity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
  } else {
    activity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
  }
}
