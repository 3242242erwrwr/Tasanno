package com.example.tasanno.orders

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {

    private lateinit var mWebView: WebView
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private val FILECHOOSER_RESULTCODE = 1001

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WebView.setWebContentsDebuggingEnabled(true)

        mWebView = WebView(this).apply {
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val url = request?.url?.toString() ?: return false
                    if (url.startsWith("tel:") || url.startsWith("mailto:")) {
                        try {
                            val intent = Intent(Intent.ACTION_DIAL, Uri.parse(url))
                            startActivity(intent)
                            return true
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                    return false
                }
            }
            webChromeClient = object : WebChromeClient() {
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
