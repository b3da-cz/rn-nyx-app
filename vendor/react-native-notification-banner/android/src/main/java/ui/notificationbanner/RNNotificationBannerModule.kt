package ui.notificationbanner

import android.graphics.Color
import android.graphics.drawable.Drawable
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.tapadoo.alerter.Alerter

class RNNotificationBannerModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var onClickCallback: Callback? = null
  private var onHideCallback: Callback? = null

  override fun getName(): String = "RNNotificationBanner"

  @Suppress("FunctionName") // method names are part of the JS API
  @ReactMethod
  fun Show(props: ReadableMap, onClick: Callback, onHide: Callback) {
    val title = props.getString("title")
    val titleColorValue = props.getString("titleColor")
    val subTitle = props.getString("subTitle")
    val subTitleColorValue = props.getString("subTitleColor")
    val duration = props.getInt("duration")
    val enableProgress = props.getBoolean("enableProgress")
    val tintColorValue = props.getString("tintColor")
    val dismissable = props.getBoolean("dismissable")
    val isSwipeToDismissEnabled = props.getBoolean("isSwipeToDismissEnabled")
    val withIcon = props.getBoolean("withIcon")
    val icon = if (props.hasKey("icon")) props.getMap("icon") else null

    onClickCallback = onClick
    onHideCallback = onHide

    var iconDrawable: Drawable? = null
    if (withIcon && icon != null && icon.toHashMap().isNotEmpty()) {
      try {
        // react-native-image-helper renders vector-icon fonts to a Drawable;
        // loaded via reflection to avoid a compile-time dependency.
        val clazz = Class.forName("prscx.imagehelper.RNImageHelperModule")
        val method = clazz.getDeclaredMethod("GenerateImage", ReadableMap::class.java)
        iconDrawable = method.invoke(null, icon) as? Drawable
      } catch (e: Exception) {
        // image-helper unavailable -> banner without icon
      }
    }

    // Alerter needs an Activity to attach to; without one there is nothing to show.
    val activity = reactApplicationContext.currentActivity ?: return

    val alerter = Alerter.create(activity)
    alerter.setTitle(title ?: "")
    alerter.setText(subTitle ?: "")

    if (iconDrawable != null && !enableProgress) {
      alerter.setIcon(iconDrawable)
    } else {
      alerter.hideIcon()
    }

    if (!tintColorValue.isNullOrEmpty()) {
      alerter.setBackgroundColorInt(Color.parseColor(tintColorValue))
    }

    if (!dismissable) {
      alerter.setDismissable(false)
    }

    if (isSwipeToDismissEnabled) {
      alerter.enableSwipeToDismiss()
    }

    alerter.setOnClickListener {
      onClickCallback?.let {
        it.invoke()
        onClickCallback = null
        onHideCallback = null
      }
    }

    alerter.setOnHideListener {
      onHideCallback?.let {
        it.invoke()
        onHideCallback = null
        onClickCallback = null
      }
    }

    if (enableProgress) {
      alerter.enableProgress(true)
      alerter.setProgressColorInt(Color.WHITE)
    }

    if (duration != 0) {
      alerter.setDuration(duration.toLong())
    }

    val activeAlert = alerter.show() ?: return

    val hexColor = Regex("^#(?:[0-9a-fA-F]{3}){1,2}$")
    if (titleColorValue != null && hexColor.matches(titleColorValue)) {
      activeAlert.getTitle().setTextColor(Color.parseColor(titleColorValue))
    }
    if (subTitleColorValue != null && hexColor.matches(subTitleColorValue)) {
      activeAlert.getText().setTextColor(Color.parseColor(subTitleColorValue))
    }
  }

  @Suppress("FunctionName") // method names are part of the JS API
  @ReactMethod
  fun Dismiss() {
    reactApplicationContext.currentActivity?.let { Alerter.clearCurrent(it) }
  }
}
