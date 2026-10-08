package net.b3da.nnn

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.zoontek.rnbootsplash.RNBootSplash

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Nnn"

  override fun onCreate(savedInstanceState: Bundle?) {
    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(null)
  }

  override fun invokeDefaultOnBackPressed() {
    // Avoid calling super.invokeDefaultOnBackPressed() because ReactActivity permanently
    // disables mBackPressedCallback without re-enabling it when the app is moved to the background.
    moveTaskToBack(true)
  }

  override fun onResume() {
    super.onResume()
    try {
      val field = ReactActivity::class.java.getDeclaredField("mBackPressedCallback")
      field.isAccessible = true
      val callback = field.get(this) as? androidx.activity.OnBackPressedCallback
      callback?.isEnabled = true
    } catch (_: Throwable) {
    }
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
