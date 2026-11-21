package com.syedali.upupandaway

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import android.app.Activity

/**
 * Up Up & Away! - Android wrapper.
 *
 * Runs the exact web build (same server, same saves in localStorage,
 * same private-room multiplayer + voice) in a fullscreen WebView and
 * injects touch-controls.js: a joystick + buttons that drive the game's
 * own Input class (verified against js/main.js), plus a pointer-lock
 * patch, because Android WebView has no pointer lock.
 */
class MainActivity : Activity() {

    private lateinit var webView: WebView
    private var pendingMicRequest: PermissionRequest? = null

    companion object {
        const val BASE_URL = "https://up-up-and-away.up-up-and-away-server.workers.dev/"
        private const val MIC_REQ = 42
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        hideSystemBars()

        webView = WebView(this)
        setContentView(webView)

        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
            cacheMode = WebSettings.LOAD_DEFAULT
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            loadWithOverviewMode = true
            useWideViewPort = true
            // WebRTC voice chat needs this in WebView
            javaScriptCanOpenWindowsAutomatically = true
        }

        webView.webChromeClient = object : WebChromeClient() {
            // getUserMedia (voice chat) arrives here
            override fun onPermissionRequest(request: PermissionRequest) {
                val wantsAudio = request.resources.any {
                    it == PermissionRequest.RESOURCE_AUDIO_CAPTURE
                }
                if (!wantsAudio) {
                    request.deny()
                    return
                }
                if (ContextCompat.checkSelfPermission(
                        this@MainActivity, Manifest.permission.RECORD_AUDIO
                    ) == PackageManager.PERMISSION_GRANTED
                ) {
                    request.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                } else {
                    pendingMicRequest = request
                    ActivityCompat.requestPermissions(
                        this@MainActivity,
                        arrayOf(Manifest.permission.RECORD_AUDIO),
                        MIC_REQ
                    )
                }
            }
        }

        val touchJs = assets.open("touch-controls.js").bufferedReader().use { it.readText() }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView, request: WebResourceRequest
            ): Boolean {
                val url = request.url.toString()
                // Keep the game itself inside the app; send everything else out.
                return if (url.startsWith(BASE_URL) || url.contains("workers.dev")) {
                    false
                } else {
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    true
                }
            }

            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                view.evaluateJavascript(touchJs, null)
            }
        }

        val startUrl = intent?.data?.toString()?.takeIf { it.startsWith(BASE_URL) }
            ?: BASE_URL
        if (savedInstanceState == null) {
            webView.loadUrl(startUrl)
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        intent.data?.toString()?.takeIf { it.startsWith(BASE_URL) }?.let {
            webView.loadUrl(it)
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<out String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == MIC_REQ) {
            val req = pendingMicRequest ?: return
            pendingMicRequest = null
            if (grantResults.isNotEmpty() &&
                grantResults[0] == PackageManager.PERMISSION_GRANTED
            ) {
                req.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
            } else {
                req.deny()
            }
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        hideSystemBars()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // In-game pause is ESC/P; keep Back from killing a climb mid-run.
        // Double purpose: if a web page can go back (menus don't navigate),
        // use it, otherwise ignore.
        if (webView.canGoBack()) webView.goBack()
    }

    private fun hideSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior =
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility =
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
                View.SYSTEM_UI_FLAG_FULLSCREEN or
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
    }
}
