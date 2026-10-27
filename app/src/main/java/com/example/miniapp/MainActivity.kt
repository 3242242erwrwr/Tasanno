package com.example.miniapp

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity

class MainActivity : ComponentActivity() {

    private lateinit var mWebView: WebView
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private val FILECHOOSER_RESULTCODE = 1001

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WebView.setWebContentsDebuggingEnabled(true)

        mWebView = WebView(this).apply {
            webViewClient = WebViewClient()
            webChromeClient = object : WebChromeClient() {
                override fun onJsAlert(view: WebView?, url: String?, message: String?, result: android.webkit.JsResult?): Boolean {
                    result?.confirm()
                    return true
                }

                override fun onShowFileChooser(
                    webView: WebView?,
                    filePathCallbackParam: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    filePathCallback?.onReceiveValue(null)
                    filePathCallback = filePathCallbackParam

                    val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "image/*"
                    }

                    try {
                        startActivityForResult(Intent.createChooser(intent, "Rasm Tanlang"), FILECHOOSER_RESULTCODE)
                    } catch (e: Exception) {
                        filePathCallback = null
                        return false
                    }
                    return true
                }
            }

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                cacheMode = WebSettings.LOAD_DEFAULT
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                useWideViewPort = true
                loadWithOverviewMode = true
            }

            loadUrl("file:///android_asset/www/index.html")
        }

        setContentView(mWebView)
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (filePathCallback != null) {
                val results = if (resultCode == RESULT_OK && data != null) {
                    val dataString = data.dataString
                    val clipData = data.clipData
                    if (clipData != null) {
                        val count = clipData.itemCount
                        Array(count) { i -> clipData.getItemAt(i).uri }
                    } else if (dataString != null) {
                        arrayOf(Uri.parse(dataString))
                    } else null
                } else null

                filePathCallback?.onReceiveValue(results)
                filePathCallback = null
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data)
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (::mWebView.isInitialized && mWebView.canGoBack()) {
            mWebView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
