import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.syedali.upupandaway"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.syedali.upupandaway"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
    }

    // Release signing is read from local.properties / environment ONLY.
    // No keystore is bundled with this project and none is generated here.
    // To make a Play Store AAB: create YOUR keystore once in Android Studio
    // (Build > Generate Signed App Bundle), keep it backed up offline, and set:
    //   RELEASE_STORE_FILE, RELEASE_STORE_PASSWORD, RELEASE_KEY_ALIAS, RELEASE_KEY_PASSWORD
    // in local.properties (never commit that file).
    signingConfigs {
        create("release") {
            val localProps = Properties().apply {
                val f = rootProject.file("local.properties")
                if (f.exists()) f.inputStream().use { load(it) }
            }
            fun secret(name: String): String =
                System.getenv(name) ?: localProps.getProperty(name) ?: ""
            val storePath = secret("RELEASE_STORE_FILE")
            if (storePath.isNotEmpty()) {
                storeFile = rootProject.file(storePath)
                storePassword = secret("RELEASE_STORE_PASSWORD")
                keyAlias = secret("RELEASE_KEY_ALIAS")
                keyPassword = secret("RELEASE_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            val hasKey = (System.getenv("RELEASE_STORE_FILE") ?: "").isNotEmpty() ||
                rootProject.file("local.properties").let { f ->
                    f.exists() && f.readText().contains("RELEASE_STORE_FILE")
                }
            if (hasKey) signingConfig = signingConfigs.getByName("release")
        }
        debug {
            // Debug builds use the standard Android debug key automatically.
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.webkit:webkit:1.11.0")
}
