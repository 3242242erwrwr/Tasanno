plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.example.tasanno.orders"
    compileSdk {
        version = release(37)
    }

    defaultConfig {
        applicationId = "com.example.tasanno.orders"
        minSdk = 24
        targetSdk = 37
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
}
