# Documentation (/docs)

Kashier lets you accept payments in Egypt through a simple API, a hosted
checkout, ready-made store plugins, and in-person terminals. Everything can be
tested for free in the test environment before you go live.

<Callout title="Building with an AI assistant?">
  These docs are ready for Cursor, Claude Code, ChatGPT, and other coding
  agents. Point yours at [`/llms.txt`](/llms.txt) for a map of every page, or
  hand it the full [OpenAPI spec](/openapi.yaml). Every page also has a **Copy
  Markdown** button and an **Open** menu for ChatGPT and Claude. See
  [Build with AI](/docs/get-started/ai-tools) for ready-to-use prompts.
</Callout>

## Which integration should I use? [#which-integration-should-i-use]

| Integration path                                                                                                                                         | When to use it                                                                                                 | Time to launch                                                                       | Technical level                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------- |
| [Payment sessions](/docs/accept-payments/payment-sessions) / [embedded checkout](/docs/accept-payments/payment-sessions#step-2-send-the-customer-to-pay) | A checkout page hosted by Kashier, or embedded in your own page, reached by a single backend API call          | Hours to days — needs a backend call to create a payment session                     | Low                                    |
| [Direct API integration](/docs/direct-api)                                                                                                               | Full control over your own card form, saved-card tokens, 3D Secure, wallets, and installments                  | Days — the most integration work of any path here                                    | High — also changes your PCI DSS scope |
| [E-commerce plugins](/docs/plugins)                                                                                                                      | You run WooCommerce, Shopify, Magento, PrestaShop, or another supported store platform and want no custom code | Fastest — install and configure a pre-built plugin                                   | None to low                            |
| [In-person payments (POS)](/docs/pos)                                                                                                                    | You want to drive Kashier POS terminals from your own Android app or backend                                   | Requires physical terminals plus setup (IP whitelisting, APK signing for app-to-app) | Medium to high                         |

Need something in between? [Payment links](/docs/accept-payments/payment-links) let you accept a payment with no code at all, and [recurring payments](/docs/accept-payments/recurring) charge customers on a schedule.

## Choose your integration path [#choose-your-integration-path]

<Cards>
  <Card title="Get started" href="/docs/get-started" description="Create a test account, grab your API keys, and make your first test payment." />

  <Card title="Build with AI" href="/docs/get-started/ai-tools" description="Feed these docs to Cursor, Claude Code, or ChatGPT with llms.txt, per-page Markdown, and the OpenAPI spec." />

  <Card title="Accept payments" href="/docs/accept-payments" description="Payment sessions, hosted checkout, payment links, Apple Pay, and recurring payments." />

  <Card title="Direct API integration" href="/docs/direct-api" description="Build your own checkout with card tokens, 3D Secure, wallets, and installments." />

  <Card title="E-commerce plugins" href="/docs/plugins" description="Connect WooCommerce, Shopify, Magento, and other store platforms without code." />

  <Card title="Webhooks" href="/docs/webhooks" description="Receive server-to-server notifications for payment events." />

  <Card title="Payouts" href="/docs/payouts" description="Send money to bank accounts and wallets." />

  <Card title="In-person payments" href="/docs/pos" description="Integrate Kashier POS terminals with your app." />

  <Card title="Dashboard API" href="/docs/dashboard-api" description="Automate dashboard operations like payment links and refunds from your server." />
</Cards>

## Environments [#environments]

Kashier has separate test and live environments. Use the test environment with
test API keys while you build — no real money moves. See
[API keys](/docs/get-started/api-keys) for how the two modes work.

# Android SDK license (/docs/accept-payments/android-sdk-license)

**Copyright © Kashier. All rights reserved.**

This Kashier Android SDK License ("License") governs the use of the Kashier Native Android SDK ("SDK") provided by Kashier.

<Callout title="Note">
  This page reproduces the license that ships as the `LICENSE` file inside the SDK distribution. It applies to the [Kashier Android SDK](/docs/accept-payments/android-sdk).
</Callout>

## 1. License grant [#1-license-grant]

Subject to this License and any applicable Kashier agreements or terms of service, Kashier grants you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to download, integrate, and use the SDK solely for the purpose of enabling Kashier payment services within applications that you develop or operate.

You may distribute your application containing or depending on the SDK as necessary to provide Kashier payment functionality to your users.

## 2. Ownership [#2-ownership]

The SDK is proprietary software owned by Kashier and/or its licensors.

All rights, title, and interest in and to the SDK, including all intellectual property rights, remain with Kashier and its licensors.

No ownership rights are transferred to you under this License.

## 3. Restrictions [#3-restrictions]

Except where expressly permitted by applicable law or separately authorized in writing by Kashier, you may not:

- sell, license, sublicense, rent, lease, or distribute the SDK as a standalone product;
- modify or create derivative works of the SDK;
- reverse engineer, decompile, disassemble, or otherwise attempt to derive the SDK's source code;
- remove or alter proprietary notices, trademarks, copyright notices, or other notices contained in the SDK;
- use the SDK to provide or facilitate payment services other than through Kashier;
- use the SDK in violation of applicable laws, regulations, Kashier agreements, or Kashier documentation.

## 4. Kashier services [#4-kashier-services]

The SDK is intended to facilitate access to Kashier payment services.

Use of Kashier payment services may be subject to separate merchant agreements, account requirements, service terms, policies, technical requirements, and applicable fees.

This License does not grant access to Kashier payment services independently of those requirements.

## 5. Updates and changes [#5-updates-and-changes]

Kashier may update, modify, replace, or discontinue versions of the SDK from time to time.

New versions of the SDK may contain changes necessary for security, compliance, compatibility, or functionality.

You are responsible for maintaining an SDK version supported by Kashier.

## 6. Third-party software [#6-third-party-software]

The SDK may include or depend upon third-party software components that are subject to their own license terms.

Nothing in this License modifies any rights or obligations applicable to such third-party components.

## 7. Confidentiality and security [#7-confidentiality-and-security]

You must not attempt to access, expose, extract, or misuse confidential information, credentials, cryptographic material, security controls, or implementation details associated with the SDK or Kashier services.

You are responsible for securely implementing and operating your integration in accordance with Kashier documentation and applicable security requirements.

## 8. Disclaimer [#8-disclaimer]

To the maximum extent permitted by applicable law, the SDK is provided "as is" and "as available."

Kashier makes no warranties, express or implied, except to the extent expressly provided under a separate written agreement with Kashier.

## 9. Limitation of liability [#9-limitation-of-liability]

To the maximum extent permitted by applicable law, Kashier shall not be liable for indirect, incidental, special, consequential, or punitive damages arising out of or related to the use of the SDK, except where liability cannot legally be excluded or limited.

Any additional liability terms agreed between you and Kashier under a separate written agreement will take precedence where applicable.

## 10. Termination [#10-termination]

Kashier may terminate or suspend this License if you materially violate its terms or applicable Kashier agreements.

Upon termination, you must stop using the SDK except to the extent otherwise agreed in writing by Kashier or required by applicable law.

## 11. Applicable agreements [#11-applicable-agreements]

This License supplements any applicable Kashier merchant agreement, developer agreement, terms of service, privacy policy, or other agreement between you and Kashier.

If there is a conflict between this License and a separately executed written agreement with Kashier, the separately executed agreement will control to the extent of that conflict.

## 12. Contact [#12-contact]

Questions regarding this License may be directed to Kashier through the official contact channels published by Kashier.

## Package metadata [#package-metadata]

| Field                             | Value                                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| License name for package metadata | Kashier Proprietary SDK License                                                                 |
| Distribution                      | Repository distribution permitted solely for integration and use with Kashier payment services. |
| Source availability               | The SDK is proprietary and closed-source unless otherwise expressly stated by Kashier.          |

# Android SDK (/docs/accept-payments/android-sdk)

A native Kotlin SDK that drops a complete, Kashier-hosted payment experience into your Android app. Your app hands the SDK a session ID created by your backend; the SDK renders the payment sheet, collects card or wallet details, handles 3-D Secure, and returns a single typed outcome.

Your app never touches card numbers, CVVs, or Kashier API credentials.

| Field               | Value                                                                     |
| ------------------- | ------------------------------------------------------------------------- |
| Artifact            | `io.kashier:kashier-android-sdk`                                          |
| Latest version      | `1.0.0`                                                                   |
| Distribution        | Maven Central                                                             |
| Audience            | Merchant developers integrating Kashier payments into native Android apps |
| Minimum Android API | `24`                                                                      |

## SDK overview [#sdk-overview]

### What it does [#what-it-does]

- Renders the Kashier payment sheet as a self-contained Activity inside your app.
- Supports **card** payments (new card and saved cards) and **wallet** payments.
- Handles **3-D Secure** in an in-SDK WebView, including OTP challenges.
- Reconciles in-flight payments automatically, and reports a **pending** outcome rather than guessing when settlement is still running.
- Ships English and Arabic UI with full right-to-left layout for Arabic.
- Returns exactly one terminal outcome per launch, as a typed sealed result.

### What it does not do [#what-it-does-not-do]

- **No Apple Pay.** Apple Pay is iOS-only and is not part of this SDK.
- **No session creation.** Sessions are created by your backend.
- **No merchant credentials in the app.** The SDK reads a server-provided hash from the session; it performs no client-side cryptography.
- **No logging.** The published AAR contains no logging interceptor and never writes request URLs, headers, bodies, hashes, card data, or customer data to logcat.

### Payment method availability [#payment-method-availability]

The SDK renders `card` and `wallet`, filtered by the session's allowed-methods list. &#x2A;_An empty allowed-methods list means all supported methods are shown._* Your app cannot select the method — it is a server-side decision made when the session is created.

<img alt="Kashier payment sheet on Android showing the store name, amount, a Wallet method tile, and an expanded Card section with an Add New Card button" src="__img0" />

_The payment sheet your users see. Method tiles are driven entirely by the session._

### Architecture at a glance [#architecture-at-a-glance]

```text
Your Activity
  │  KashierSDK.initialize(KashierConfig(mode, language))      // once per process
  │  registerForActivityResult(KashierPaymentContract())       // in onCreate
  │  launcher.launch(KashierPaymentRequest(sessionId))
  ▼
Kashier payment Activity (internal, not exported)
  ├── GET session  →  payment sheet (card / wallet)
  ├── card    →  POST order  →  3-D Secure WebView  →  reconcile
  └── wallet  →  request-to-pay →  poll (max 5 min) →  reconcile
  ▼
KashierResult  →  Succeeded | Failed | Pending | Cancelled | Unavailable
```

## Requirements [#requirements]

| Requirement                       | Value                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------ |
| Minimum Android API               | **24** (Android 7.0)                                                           |
| Compiled against                  | Android API **36**                                                             |
| Java compatibility                | **17** (source and target)                                                     |
| Kotlin (SDK build)                | `2.1.20`                                                                       |
| Android Gradle Plugin (SDK build) | `8.11.1`                                                                       |
| Gradle (SDK build)                | `8.14.3`                                                                       |
| Host Activity type                | `androidx.activity.ComponentActivity` or a subclass (e.g. `AppCompatActivity`) |
| Network                           | Internet access (permission is merged in automatically)                        |
| Backend                           | A server that creates Kashier payment sessions                                 |

Your app module must compile with Java 17 compatibility:

```kotlin
android {
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}
```

The versions above are the toolchain the SDK itself is built with. Newer Android Gradle Plugin and Kotlin versions that still support Java 17 and `compileSdk 36` are expected to work.

### What is a session ID? [#what-is-a-session-id]

A session ID identifies a payment your **backend** created with Kashier before the user reaches checkout. It encodes the amount, currency, order reference, allowed payment methods, customer details, and the server-computed payment hash.

The SDK takes the session ID as its only input. It never creates sessions and never needs your Kashier API credentials. Create sessions server-to-server using the Kashier merchant API, then pass the returned session ID to your app over your own authenticated channel.

<Callout title="Note">
  Backend integration is out of scope for this guide. See the [Payment Sessions API documentation](/docs/accept-payments/payment-sessions) for backend details.
</Callout>

## Installation and setup [#installation-and-setup]

### Add the dependency [#add-the-dependency]

The SDK is published on Maven Central as &#x2A;*`io.kashier:kashier-android-sdk`**. Integration is a single dependency — no extra repository, no manual AAR handling.

`mavenCentral()` is already present in default Android Studio templates. If your project pins its repositories, make sure it is declared:

```kotlin
// settings.gradle.kts
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
}
```

Then add the dependency:

```kotlin
// app/build.gradle.kts
dependencies {
    implementation("io.kashier:kashier-android-sdk:1.0.0")

    // Required: the SDK's public API takes an androidx ComponentActivity, and the SDK
    // declares its androidx dependencies as `implementation` (they are not exported).
    implementation("androidx.activity:activity:1.9.3")
}
```

`1.0.0` is the current public release. Pin an exact version — published versions are immutable.

Everything else the SDK needs at runtime — its Compose UI, networking, and coroutines dependencies — resolves transitively from Maven Central. The AAR also ships its own R8 / ProGuard rules, so there is nothing to add to your ProGuard configuration (see [R8, ProGuard and security](#r8-proguard-and-security)).

### Android project setup [#android-project-setup]

#### Permissions — nothing to declare [#permissions--nothing-to-declare]

The SDK's manifest declares `android.permission.INTERNET`, which is merged into your app automatically. Nothing else is required.

The SDK deliberately does **not** request `ACCESS_NETWORK_STATE`. Its connectivity check is a DNS reachability probe, so your app is not forced to hold a network-state permission.

#### Activities — nothing to declare [#activities--nothing-to-declare]

The SDK's payment Activity is declared in the SDK manifest and merged in automatically. It is `android:exported="false"` with no intent filters — it can only be started through the SDK's own contract. Do not declare, reference, or attempt to start it yourself.

#### Compose is not required in your app [#compose-is-not-required-in-your-app]

The SDK's UI is built with Jetpack Compose internally, but no Compose type appears on its public API. The Kashier demo app uses plain Android views. Your app can use views, Compose, or both.

#### Right-to-left [#right-to-left]

The SDK pins its own locale and layout direction from `KashierConfig.language` — Arabic renders full RTL regardless of the device locale, and English renders LTR regardless of an Arabic device. The SDK never mutates your app's configuration or windows.

You do **not** need `android:supportsRtl="true"` for the SDK's sheet to render correctly. Set it only if your own screens need RTL.

#### ProGuard / R8 [#proguard--r8]

Nothing to add. See [R8, ProGuard and security](#r8-proguard-and-security).

## Quick start [#quick-start]

The smallest complete integration. It initializes the SDK, registers the result contract in `onCreate`, launches a payment, and handles **every** terminal outcome.

```kotlin
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import io.kashier.sdk.KashierConfig
import io.kashier.sdk.KashierLanguage
import io.kashier.sdk.KashierMode
import io.kashier.sdk.KashierPaymentContract
import io.kashier.sdk.KashierPaymentRequest
import io.kashier.sdk.KashierResult
import io.kashier.sdk.KashierSDK
import io.kashier.sdk.KashierUnavailableReason

class CheckoutActivity : ComponentActivity() {

    private lateinit var paymentLauncher: ActivityResultLauncher<KashierPaymentRequest>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. Initialize once per process, before any launch.
        if (!KashierSDK.isInitialized()) {
            KashierSDK.initialize(
                KashierConfig(
                    mode = KashierMode.TEST,
                    language = KashierLanguage.EN,
                )
            )
        }

        // 2. Register in onCreate — the Activity Result API forbids later registration.
        paymentLauncher = registerForActivityResult(KashierPaymentContract()) { result ->
            when (result) {
                is KashierResult.Succeeded -> {
                    // Display-safe. Confirm with your backend before fulfilling the order.
                    showReceipt(result.result.orderId, result.result.transactionId)
                }

                is KashierResult.Failed -> {
                    // result.error.message is English; result.error.messageAr is Arabic.
                    showError(result.error.message)
                }

                is KashierResult.Pending -> {
                    // Terminal: no success or failure will follow this launch.
                    // result.pending.orderId is the authoritative reference.
                    showPending(result.pending.orderId, result.pending.message)
                }

                is KashierResult.Cancelled -> {
                    returnToCheckout()
                }

                is KashierResult.Unavailable -> {
                    // The outcome could not be determined — do NOT assume failure.
                    when (result.reason) {
                        KashierUnavailableReason.processDeath,
                        KashierUnavailableReason.malformedResult,
                        KashierUnavailableReason.configMissing,
                        -> reconcileWithBackend(result.requestId)
                    }
                }
            }
        }
    }

    // 3. Launch with a session ID your backend created.
    private fun startPayment(sessionId: String) {
        paymentLauncher.launch(KashierPaymentRequest(sessionId))
    }
}
```

<Callout title="Blank session IDs throw">
  `KashierPaymentRequest` throws `IllegalArgumentException` if `sessionId` is blank. Validate the value you got from your backend before constructing it, or use the [compatibility wrapper](#launching-a-payment), which reports a blank session ID as a `validationFailed` callback instead of throwing.
</Callout>

## SDK configuration [#sdk-configuration]

```kotlin
KashierSDK.initialize(
    KashierConfig(
        mode = KashierMode.LIVE,
        language = KashierLanguage.AR,
    )
)
```

### KashierConfig [#kashierconfig]

| Property   | Type              | Meaning                                                            |
| ---------- | ----------------- | ------------------------------------------------------------------ |
| `mode`     | `KashierMode`     | `TEST` or `LIVE` — selects the Kashier environment                 |
| `language` | `KashierLanguage` | `EN` or `AR` — language and layout direction of the SDK payment UI |

### KashierMode [#kashiermode]

| Value              | API base URL                  | Payment-processing base URL   |
| ------------------ | ----------------------------- | ----------------------------- |
| `KashierMode.TEST` | `https://test-api.kashier.io` | `https://test-fep.kashier.io` |
| `KashierMode.LIVE` | `https://api.kashier.io`      | `https://fep.kashier.io`      |

Both URLs are readable as `mode.baseUrl` and `mode.fepBaseUrl`.

### Initialization contract [#initialization-contract]

These rules are enforced by the SDK — read them carefully:

- Call `initialize` **once**, before any payment launch.
- Calling `initialize` again with an **equal** config is a harmless no-op.
- Calling `initialize` again with a **different** config &#x2A;*throws `IllegalStateException`**. Dynamic reconfiguration — for example toggling `TEST` → `LIVE`, or switching language at runtime — is not supported.
- Configuration is **process-scoped and in-memory only**. It does not survive process death.
- `KashierSDK.isInitialized()` returns `true` once initialization succeeded.

The safest place to initialize is `Application.onCreate()` or a guarded call in your checkout Activity, as shown in the quick start.

If you launch a payment before initializing, the compatibility wrapper reports `unknownError` with the message `"KashierSDK.initialize() must be called before startPayment()."`.

## Launching a payment [#launching-a-payment]

The SDK offers two launch surfaces. &#x2A;*Both must be registered in `onCreate`**, before the host Activity reaches `STARTED` — this is an Activity Result API rule, and AndroidX throws `IllegalStateException` on late registration.

### Canonical Activity Result API (recommended) [#canonical-activity-result-api-recommended]

Typed, exhaustive, and lifecycle-safe. Use this for new integrations.

```kotlin
private lateinit var launcher: ActivityResultLauncher<KashierPaymentRequest>

override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    launcher = registerForActivityResult(KashierPaymentContract()) { result: KashierResult ->
        handle(result)
    }
}

fun pay(sessionId: String) = launcher.launch(KashierPaymentRequest(sessionId))
```

On this path the result is **typed-only**: `KashierPaymentResult.transactionData` and `KashierPaymentError.details` are always `null`. Raw backend response maps never cross the Activity-Result boundary.

### Compatibility wrapper (callback style) [#compatibility-wrapper-callback-style]

A listener-based surface with callback semantics matching Kashier's other SDKs. Useful if you are porting an existing integration or prefer callbacks to a sealed result.

```kotlin
private lateinit var launcher: KashierLauncher

override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    launcher = KashierSDK.register(
        this,
        { result -> showReceipt(result) },              // onSuccess
        { error -> showError(error.message) },           // onFailure
        { pending -> showPending(pending.orderId) },     // onPending (nullable)
    )
}

fun pay(sessionId: String) = launcher.start(sessionId)
```

`launcher.start(sessionId)` **never throws**. Failures arrive on the failure listener:

| Situation                       | Callback                                                     |
| ------------------------------- | ------------------------------------------------------------ |
| SDK not initialized             | `onFailure(unknownError)`                                    |
| Blank `sessionId`               | `onFailure(validationFailed, "sessionId must not be blank")` |
| Another payment already running | `onFailure(validationFailed, "payment already in progress")` |

### Wrapper callback semantics [#wrapper-callback-semantics]

| Outcome                | Wrapper behavior                                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Success                | `onSuccess` fires **after** the user taps Done on the success sheet                                                                                                      |
| Failure                | `onFailure` fires **after** the failure sheet is dismissed                                                                                                               |
| User cancellation      | `onFailure(KashierErrorCode.userCancelled)`                                                                                                                              |
| Pending                | `onPending` fires **before** the pending modal renders. The terminal result is **not** re-fired. If `onPending` is `null`, a pending payment produces **zero** callbacks |
| Undeterminable outcome | `onFailure(unknownError, "Payment outcome unavailable (<reason>). Reconcile via your backend/webhook.")`                                                                 |

At most **one** merchant callback fires per payment.

<Callout title="Difference between the two surfaces">
  On the canonical Activity Result API, `Pending` is **always** delivered — after the pending modal's Done — even when no pending listener exists.
</Callout>

### Wrapper registration rules [#wrapper-registration-rules]

- A second `register(...)` on the **same Activity instance** is idempotent: it returns the existing launcher with the **originally supplied** listeners. To change listeners, register on a fresh Activity instance.
- Registration is cleaned up automatically at `ON_DESTROY`. There is no `unregister`, and no callback fires after destruction.
- A `KashierLauncher` must **not** be reused across Activity instances. Obtain a fresh one in each Activity's `onCreate`.
- `onPending` may run while your Activity is **STOPPED** — it fires before the pending modal, while the SDK Activity is still in front. Treat it as a background callback and defer UI work behind your usual stopped-state guards.

### Concurrency [#concurrency]

The SDK holds a **process-scoped single-payment lock**. Launching a second payment while one is active is rejected with `validationFailed` and the message `"payment already in progress"` — it does not cancel or corrupt the running payment.

## Handling payment results [#handling-payment-results]

`KashierResult` is a sealed interface with five variants. **Every variant is terminal** — a launch produces exactly one of them, and nothing follows.

Every variant carries a non-null `requestId` identifying the launch. `Succeeded`, `Failed`, and `Pending` always carry a real ID; `Cancelled` and `Unavailable` may carry `KashierRequestId.UNKNOWN` (the empty string) when identity could not be recovered.

| Variant       | Payload                            | Meaning                                                                | Your action                                                |
| ------------- | ---------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| `Succeeded`   | `result: KashierPaymentResult`     | Payment completed successfully                                         | Confirm server-side, then fulfil                           |
| `Failed`      | `error: KashierPaymentError`       | Payment failed or was rejected                                         | Show `error.message`; allow a retry with a **new** session |
| `Pending`     | `pending: KashierPaymentPending`   | Settlement still running; **no** later success/failure for this launch | Show "processing"; reconcile via backend/webhook           |
| `Cancelled`   | —                                  | User dismissed the sheet or pressed back                               | Return to checkout                                         |
| `Unavailable` | `reason: KashierUnavailableReason` | Outcome could not be determined                                        | **Do not assume failure** — reconcile via backend/webhook  |

<img alt="Payment Successful sheet with a green check icon and a summary listing Amount, Transaction ID and the masked card number, above a Done button" src="__img1" />

_The success sheet. `Succeeded` reaches your app only after the user taps **Done** — the fields shown here map to `KashierPaymentResult`. The transaction ID is masked in this screenshot._

### Which identifiers are authoritative [#which-identifiers-are-authoritative]

| Field                                 | Use                                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `KashierPaymentResult.orderId`        | Kashier order ID (system order ID) — the reference to reconcile against                              |
| `KashierPaymentResult.orderReference` | Your own merchant order reference                                                                    |
| `KashierPaymentResult.transactionId`  | Transaction reference for support and receipts                                                       |
| `KashierPaymentPending.orderId`       | **Authoritative** for a pending payment                                                              |
| `KashierPaymentPending.transactionId` | May be an **empty string** for a card pending — the reconcile response carries no transaction ID yet |
| `KashierResult.requestId`             | Correlates the outcome with the launch inside your app (SDK-local, not a Kashier identifier)         |

### When backend reconciliation is required [#when-backend-reconciliation-is-required]

Always treat your backend and Kashier webhooks as the source of truth before releasing goods. Reconciliation is **mandatory** for:

- `Pending` — the SDK explicitly stopped waiting.
- `Unavailable` — including after process death.
- Any case where your app was killed before the result was delivered.

### KashierPaymentResult fields [#kashierpaymentresult-fields]

<Accordions type="multiple">
  <Accordion title="Payment result fields">
    | Field                 | Type                 | Notes                                                                                                                                                |
    | --------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `sessionId`           | `String`             | The session this payment used                                                                                                                        |
    | `status`              | `String`             | Backend status string, e.g. `"SUCCESS"`, `"CAPTURED"`                                                                                                |
    | `orderId`             | `String?`            | Kashier order ID                                                                                                                                     |
    | `orderReference`      | `String?`            | Merchant order reference                                                                                                                             |
    | `transactionId`       | `String?`            | Transaction reference                                                                                                                                |
    | `authorizationNumber` | `String?`            | Issuer authorization number                                                                                                                          |
    | `amount`              | `Double?`            | **Approximate display value.** Invalid or missing backend values map to `null`. Do not use for accounting — use your backend's amount                |
    | `currency`            | `String?`            | Currency of the charge                                                                                                                               |
    | `card`                | `KashierCardInfo?`   | Display-safe card details                                                                                                                            |
    | `message`             | `String?`            | Localized message, English                                                                                                                           |
    | `messageAr`           | `String?`            | Localized message, Arabic                                                                                                                            |
    | `transactionData`     | `Map<String, Any?>?` | Full raw backend response. &#x2A;*Always `null` on the Activity Result API.** Sensitive — see [R8, ProGuard and security](#r8-proguard-and-security) |
  </Accordion>
</Accordions>

`KashierCardInfo` exposes `brand`, `maskedNumber` (e.g. `541674******7777`), and `wallet`. It never carries a full PAN, CVV, or card token, so it is safe to show on receipts.

### KashierPaymentPending fields [#kashierpaymentpending-fields]

| Field           | Type      | Notes                                |
| --------------- | --------- | ------------------------------------ |
| `orderId`       | `String`  | Authoritative reference              |
| `transactionId` | `String`  | May be empty                         |
| `message`       | `String`  | Localized to the configured language |
| `messageEn`     | `String?` | English message                      |
| `messageAr`     | `String?` | Arabic message                       |

## Card and saved cards [#card-and-saved-cards]

Shown when the session allows `card`.

### New-card flow [#new-card-flow]

1. The user opens the card form and enters number, expiry, CVV, and cardholder name.
2. The SDK validates locally before any network call: **Number** — exactly 16 digits and a valid Luhn checksum. **Expiry** — month `1–12`, not in the past. **CVV** and **cardholder name** — required.
3. Brand is detected from the number prefix and shown inline: Visa `4…`; Mastercard `51–55` or `2221–2720`; Meeza BIN range `507803–507960`.
4. The SDK posts the order. If the gateway requires 3-D Secure, the SDK opens its own WebView (see [3-D Secure](#3-d-secure)); otherwise it goes straight to the result sheet.

<img alt="Add Card sheet with card number, expiry and CVV fields, a cardholder name field, a Save this card for future payments checkbox, and a Pay button" src="__img2" />

_The new-card form as it appears in `KashierMode.LIVE` for a session that permits card saving. In `KashierMode.TEST` the save-card checkbox is hidden and a "Use Testing Data" button is added above the form — see [Testing and going live](#testing-and-going-live)._

Invalid input is reported inline inside the SDK sheet and never reaches your callbacks. API errors that are not 3-D Secure handoffs are shown inline on the form so the user can correct and retry without losing the session.

### Saving a card after payment [#saving-a-card-after-payment]

The "save card" checkbox appears only when **all** of these hold:

- the session does not hide card saving, **and**
- the session carries customer data, **and**
- the SDK is **not** in `TEST` mode.

If the session forces card saving, the checkbox is pre-selected.

### What your app sees [#what-your-app-sees]

| Situation                           | Result                                                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| Approved                            | `Succeeded` — after the user taps Done                                             |
| Declined by the issuer              | `Failed(paymentDeclined)`, with `error.responseCode` when the gateway supplies one |
| Authorization rejected (HTTP 403)   | `Failed(authorizationFailed)`                                                      |
| 3-D Secure failed                   | `Failed(authenticationFailed)`                                                     |
| Still settling after reconciliation | `Pending`                                                                          |
| User dismissed the sheet            | `Cancelled`                                                                        |

### Reconciliation safety net [#reconciliation-safety-net]

After a 3-D Secure challenge the SDK polls the order until it reaches a terminal state:

- **Post-OTP:** 8 attempts — `5s, 5s, 5s, 5s, 10s, 10s, 10s, 10s` (first at +5 s, ≈60 s total).
- **After cancel, or a stuck `INITIATED` order:** 5 attempts — `0s, 5s, 10s, 15s, 30s`.

If polling exhausts while the server still reports a non-terminal state, the SDK reports `Pending`. If **every** attempt errored, it reports a failure instead — the SDK never claims "pending" without a real server response.

Only one terminal result can ever be emitted; a late redirect and an in-flight reconcile cannot both fire a callback.

### PCI scope [#pci-scope]

Card data is entered only inside the SDK's own UI, is held in memory for the duration of the request, and is never persisted, logged, or exposed to your app. Your app never sees a PAN, a CVV, or a card token.

### Saved cards [#saved-cards]

Saved cards let a returning customer pay without re-entering their card number.

#### When saved cards are fetched [#when-saved-cards-are-fetched]

The SDK fetches saved cards only when **all** of these hold:

- `card` is an allowed method for the session, **and**
- the session has saved-card retrieval enabled, **and**
- the session carries a non-empty customer reference.

Otherwise the sheet goes directly to the new-card form. If the fetch fails, the SDK degrades silently to the new-card form — your app sees nothing and no error is surfaced.

#### Presentation [#presentation]

- With saved cards present, the card section renders as an **accordion** listing each card with its brand icon, masked number, and expiry.
- Selecting a card reveals an **inline CVV field** on that row.
- An "Add card" entry opens the standard new-card form.
- While the fetch is in flight the section shows a loading state; if the customer has no saved cards, the section renders empty and the user proceeds with a new card.

<img alt="Payment sheet with the card section expanded into an accordion showing a selected Visa card ending 7585 with an inline CVV field, a Mastercard ending 6802, and an Add New Card row" src="__img3" />

_The saved-card accordion. Selecting a card reveals its inline CVV field; the card numbers are masked by the gateway and no card token is ever exposed._

#### Paying with a saved card [#paying-with-a-saved-card]

Paying with a saved card **requires the CVV to be re-entered**. It must be exactly 3 digits; otherwise the SDK reports `invalidCardDetails` ("Invalid CVV.") inline and no network call is made. From there the flow is identical to a new card, including 3-D Secure.

<img alt="Saved-card accordion showing a red CVV Validation Error banner beneath the card list and a disabled Pay button" src="__img4" />

_A CVV that is not exactly 3 digits is rejected inside the sheet. No network call is made and your app receives no callback — the user simply corrects the field._

#### Deleting a saved card [#deleting-a-saved-card]

- **Swipe** a saved-card row to reveal the delete action.
- A confirmation dialog appears before anything is deleted.
- A failed deletion shows a snackbar inside the SDK sheet and surfaces as `cardDeletionFailed` internally. Your app is not notified — the flow continues normally.

#### Security [#security]

Card tokens are never logged, never persisted by the SDK, and never appear in the SDK's accessibility semantics. Your app never receives a card token; the only card data it can see is the display-safe `KashierCardInfo` on a successful result.

## Wallet payments [#wallet-payments]

Shown when the session allows `wallet`.

### Flow [#flow]

1. The user picks the wallet method and enters an Egyptian mobile number. The SDK validates the format `01[0125]` followed by 8 digits (11 digits total) and keeps the Pay button disabled until it matches.

<img alt="Wallet phone-number entry sheet showing the amount, a phone field hinting 01XXXXXXXXX, and a disabled Pay button" src="__img5" />

2. The SDK sends one request-to-pay. &#x2A;_This request is never retried automatically._*
3. The user approves the payment in their wallet app.
4. The SDK shows a 3-step progress sheet and polls for the outcome on a fixed schedule.

### Polling schedule [#polling-schedule]

| Phase    | Intervals                             | Fires at            |
| -------- | ------------------------------------- | ------------------- |
| Phase 1  | 12 × 10 s                             | 10 s → 120 s        |
| Phase 2  | 30 s, 45 s, 60 s                      | 150 s, 195 s, 255 s |
| Hard cap | **5 minutes (300 s)** from poll start | —                   |

No request is ever armed past the cap. Longer phase-2 intervals are defined in the schedule but are unreachable under the 5-minute cap.

### Controls on the waiting sheet [#controls-on-the-waiting-sheet]

| Control         | When it appears                                                       | What it does                                                                                                           |
| --------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Reload**      | While polling                                                         | Immediately re-checks the payment status. Errors are shown inline on the sheet; polling continues either way           |
| **I have paid** | Only after the 5-minute cap is reached with the payment still pending | Emits the terminal `Pending` result                                                                                    |
| **Cancel**      | Throughout                                                            | While polling, returns to the phone-input step and aborts the attempt. At exhaustion, ends the flow as `userCancelled` |

<img alt="Wallet waiting sheet with a three-step progress indicator reading Notifying, Processing, Successful Payment, above a Reload Payment Status button and a Cancel action" src="__img6" />

_The waiting sheet while polling. Note **Reload Payment Status** — there is no resend control._

There is no "resend" button. If the request-to-pay needs to be re-sent, the user cancels back to the phone-input step and starts again — which creates a new order.

<Callout type="warn" title="No duplicate-charge prevention">
  The SDK makes **no duplicate-charge prevention claim** for repeated wallet attempts. Duplicate protection is a backend concern.
</Callout>

### Exhaustion and reconciliation [#exhaustion-and-reconciliation]

When the 5-minute cap is reached with the payment still pending, the SDK stops polling and shows the "I have paid" button. Tapping it emits a terminal `Pending` result. Your app should then wait for the Kashier webhook or query your backend — `pending.orderId` is the authoritative reference.

### What your app sees [#what-your-app-sees-1]

| Situation                                       | Result                     |
| ----------------------------------------------- | -------------------------- |
| Wallet approved and reconciled                  | `Succeeded`                |
| Wallet declined / reconcile failure             | `Failed`                   |
| Request-to-pay could not be initiated           | `Failed(walletInitFailed)` |
| 5-minute cap reached, user tapped "I have paid" | `Pending`                  |
| User cancelled                                  | `Cancelled`                |

## 3-D Secure [#3-d-secure]

3-D Secure is handled entirely inside the SDK — your app has nothing to implement.

### What the user sees [#what-the-user-sees]

1. A full-screen in-SDK WebView loads the issuer's authentication page.
2. If the issuer requires a challenge, the OTP screen renders inside that WebView.
3. On completion the SDK shows a verifying state while it confirms the outcome, then the result sheet.

<img alt="Full-screen 3-D Secure WebView headed Verifying your payment, containing the issuer bank's Enter Your Code page with an empty one-time-password field and Submit, Resend Code and Cancel buttons" src="__img7" />

_A 3-D Secure OTP challenge inside the SDK's WebView. The page content is served by the cardholder's bank — its layout and wording vary by issuer. Transaction identifiers are masked in this screenshot._

### How completion is detected [#how-completion-is-detected]

The SDK recognises the end of the challenge from the merchant redirect, from terminal query parameters on the redirect URL, from gateway redirect URLs that require a reconcile, and from issuer page markers. Timers keep the experience responsive: an OTP loader after 10 s, a reconcile handoff after 20 s, a frictionless-verify fallback after 15 s, plus short DOM probes.

### Cancel, timeout, retry [#cancel-timeout-retry]

| Action                   | Behavior                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------- |
| **Cancel** the challenge | `userCancelled` immediately, with no reconciliation                                   |
| **Timeout**              | Full-screen timeout sheet; `paymentTimeout` is reported only after the user taps Done |
| **Try Again**            | Restarts the challenge and emits **no** callback to your app                          |

<img alt="Full-screen 3-D Secure timeout sheet reading Still confirming your payment, with guidance to check payment status shortly, above a Done button" src="__img8" />

_The timeout sheet. `paymentTimeout` reaches your app only after the user taps Done._

### Security [#security-1]

HTTP redirects are disabled at the network layer — any 3xx on an API call is treated as an error, not followed. Issuer-controlled content (URLs, console output, page text) is never logged.

## Lifecycle and process death [#lifecycle-and-process-death]

### Registration [#registration]

Register &#x2A;*in `onCreate`**, before the Activity reaches `STARTED`. This applies to both launch surfaces. Late registration is rejected by AndroidX with `IllegalStateException`.

### Activity vs Fragment [#activity-vs-fragment]

`KashierSDK.register(...)` requires a `ComponentActivity`. From a Fragment, either:

- use the canonical contract — `Fragment.registerForActivityResult(KashierPaymentContract())` works normally; or
- call `KashierSDK.register(requireActivity(), …)` and keep the launcher's lifetime tied to that Activity.

### Threading [#threading]

Register and launch from the **main thread**. Result callbacks are delivered on the main thread by the Activity Result API. The `onPending` wrapper callback may arrive while your Activity is `STOPPED` — guard UI work accordingly.

### Configuration changes and rotation [#configuration-changes-and-rotation]

Rotation of the SDK's payment Activity is handled internally: the in-flight session and flow state are retained across recreation. Card-entry fields are intentionally **not** retained.

Your own Activity is recreated normally; because you register in `onCreate`, the launcher is re-established and the pending result is delivered to the new instance.

### Process death [#process-death]

If Android kills your process mid-payment:

- **No automatic replay.** The SDK never re-submits a payment.
- **No crash.** Teardown is safe.
- If AndroidX restored a pending result, it is delivered **typed-only** — raw maps are `null`.
- If only the launch identity survived, you receive `Unavailable(KashierUnavailableReason.processDeath)`. On the compatibility wrapper this surfaces as `onFailure(unknownError)`; a not-yet-fired `onPending` may be lost entirely.
- Otherwise nothing is delivered.

<Callout type="warn" title="Reconcile after process death">
  In every process-death case, **reconcile through your backend or Kashier webhooks**. A payment may well have succeeded.
</Callout>

### Multiple concurrent payments [#multiple-concurrent-payments]

Not supported by design. A second launch while one is active is rejected with `validationFailed` and the message `"payment already in progress"`.

### Malformed results [#malformed-results]

If the returned payload is present but corrupt or of an unknown version, you receive `Unavailable(malformedResult)`. `parseResult` never throws.

## Kotlin and Java integration [#kotlin-and-java-integration]

### Kotlin [#kotlin]

Use an exhaustive `when` so new result variants become compile errors rather than silent bugs:

```kotlin
private fun handle(result: KashierResult) = when (result) {
    is KashierResult.Succeeded   -> onPaid(result.result)
    is KashierResult.Failed      -> onFailed(result.error)
    is KashierResult.Pending     -> onPending(result.pending)
    is KashierResult.Cancelled   -> onCancelled()
    is KashierResult.Unavailable -> onUnavailable(result.reason, result.requestId)
}
```

Building an error with the SDK's built-in English/Arabic default messages:

```kotlin
val error = KashierPaymentError.fromCode(KashierErrorCode.networkError)
println(error.message)    // "A network error occurred. Please check your connection."
println(error.messageAr)  // "حدث خطأ في الشبكة. يرجى التحقق من اتصالك."
```

Reading the environment URLs, if you need them for diagnostics:

```kotlin
val api = KashierMode.LIVE.baseUrl      // https://api.kashier.io
val fep = KashierMode.LIVE.fepBaseUrl   // https://fep.kashier.io
```

### Java [#java]

The public API is fully usable from Java. Entry points are `@JvmStatic`, model constructors are `@JvmOverloads`, and all three listeners are functional interfaces, so Java lambdas work.

```java
package com.example.checkout;

import android.os.Bundle;

import androidx.activity.ComponentActivity;
import androidx.activity.result.ActivityResultLauncher;
import androidx.annotation.Nullable;

import io.kashier.sdk.KashierConfig;
import io.kashier.sdk.KashierLanguage;
import io.kashier.sdk.KashierLauncher;
import io.kashier.sdk.KashierMode;
import io.kashier.sdk.KashierPaymentContract;
import io.kashier.sdk.KashierPaymentRequest;
import io.kashier.sdk.KashierResult;
import io.kashier.sdk.KashierSDK;

public final class CheckoutActivity extends ComponentActivity {

    private ActivityResultLauncher<KashierPaymentRequest> launcher;
    private KashierLauncher wrapperLauncher;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (!KashierSDK.isInitialized()) {
            KashierSDK.initialize(new KashierConfig(KashierMode.TEST, KashierLanguage.EN));
        }

        // 1) Canonical Activity Result API.
        launcher = registerForActivityResult(new KashierPaymentContract(), (KashierResult result) -> {
            if (result instanceof KashierResult.Succeeded) {
                String txId = ((KashierResult.Succeeded) result).getResult().getTransactionId();
                showReceipt(txId);
            } else if (result instanceof KashierResult.Failed) {
                showError(((KashierResult.Failed) result).getError().getMessage());
            } else if (result instanceof KashierResult.Pending) {
                showPending(((KashierResult.Pending) result).getPending().getOrderId());
            } else if (result instanceof KashierResult.Cancelled) {
                returnToCheckout();
            } else if (result instanceof KashierResult.Unavailable) {
                reconcileWithBackend(((KashierResult.Unavailable) result).getReason().name());
            }
        });

        // 2) Compatibility wrapper — onPending may be null, in which case a pending
        //    payment produces no callback at all.
        wrapperLauncher = KashierSDK.register(
                this,
                result -> showReceipt(result.getTransactionId()),
                error -> showError(error.getMessage()),
                pending -> showPending(pending.getOrderId()));
    }

    private void pay(String sessionId) {
        launcher.launch(new KashierPaymentRequest(sessionId));
        // or: wrapperLauncher.start(sessionId);
    }
}
```

Java notes:

- `KashierResult` is a Kotlin sealed interface — use `instanceof` and cast; there is no exhaustiveness check.
- `KashierSDK.register` takes all four parameters in Java; pass `null` for `onPending` if you do not need it.
- `KashierPaymentError.fromCode(...)` is available as a static method, with overloads for the optional arguments.
- `new KashierPaymentRequest(sessionId)` throws `IllegalArgumentException` on a blank session ID.

## API reference [#api-reference]

Everything below is the entire supported surface. Anything in `io.kashier.sdk.internal` is **not** API: it carries no compatibility guarantee and is renamed or removed by R8 in your app.

### KashierSDK [#kashiersdk]

| Member          | Signature                                                                                                                                                              | Notes                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `initialize`    | `fun initialize(config: KashierConfig)`                                                                                                                                | Throws `IllegalStateException` if already initialized with a different config |
| `isInitialized` | `fun isInitialized(): Boolean`                                                                                                                                         | —                                                                             |
| `register`      | `fun register(activity: ComponentActivity, onSuccess: KashierSuccessListener, onFailure: KashierFailureListener, onPending: KashierPendingListener?): KashierLauncher` | Call in `onCreate`                                                            |

### KashierConfig [#kashierconfig-1]

```kotlin
data class KashierConfig(val mode: KashierMode, val language: KashierLanguage)
```

### KashierMode [#kashiermode-1]

```kotlin
enum class KashierMode(val baseUrl: String, val fepBaseUrl: String) // TEST, LIVE
```

### KashierLanguage [#kashierlanguage]

```kotlin
enum class KashierLanguage // EN, AR
```

### KashierPaymentContract [#kashierpaymentcontract]

```kotlin
class KashierPaymentContract : ActivityResultContract<KashierPaymentRequest, KashierResult>
```

`parseResult` never throws. Precedence:

1. `RESULT_CANCELED`, null intent, or an absent result payload → `Cancelled`
2. payload present but corrupt, of an unknown version, or missing `requestId` → `Unavailable(malformedResult)`
3. well-formed payload → the typed outcome

### KashierPaymentRequest [#kashierpaymentrequest]

```kotlin
data class KashierPaymentRequest(val sessionId: String) : Parcelable
```

Throws `IllegalArgumentException` when `sessionId` is blank. `toString()` is redacted.

### KashierResult [#kashierresult]

```kotlin
sealed interface KashierResult { val requestId: String }
```

| Variant       | Signature                                                                     |
| ------------- | ----------------------------------------------------------------------------- |
| `Succeeded`   | `data class Succeeded(requestId: String, result: KashierPaymentResult)`       |
| `Failed`      | `data class Failed(requestId: String, error: KashierPaymentError)`            |
| `Pending`     | `data class Pending(requestId: String, pending: KashierPaymentPending)`       |
| `Cancelled`   | `data class Cancelled(requestId: String)`                                     |
| `Unavailable` | `data class Unavailable(requestId: String, reason: KashierUnavailableReason)` |

`KashierResult` is intentionally **not** `Parcelable`.

### KashierUnavailableReason [#kashierunavailablereason]

| Value             | Meaning                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `processDeath`    | The OS killed the process mid-flow; only the launch identity survived                                  |
| `malformedResult` | The delivered payload was corrupt, of an unknown version, or missing its request ID                    |
| `configMissing`   | **Reserved.** The current SDK never emits it — a missing-config relaunch is reported as `processDeath` |

### KashierRequestId [#kashierrequestid]

```kotlin
object KashierRequestId { const val UNKNOWN: String = "" }
```

### KashierPaymentResult [#kashierpaymentresult]

```kotlin
data class KashierPaymentResult @JvmOverloads constructor(
    val sessionId: String,
    val status: String,
    val orderId: String? = null,
    val orderReference: String? = null,
    val transactionId: String? = null,
    val authorizationNumber: String? = null,
    val amount: Double? = null,
    val currency: String? = null,
    val card: KashierCardInfo? = null,
    val message: String? = null,
    val messageAr: String? = null,
    val transactionData: Map<String, Any?>? = null,
)
```

See [Handling payment results](#handling-payment-results) for field semantics. `toString()` deliberately excludes `transactionData`.

### KashierPaymentError [#kashierpaymenterror]

```kotlin
data class KashierPaymentError @JvmOverloads constructor(
    val code: KashierErrorCode,
    val message: String,
    val messageAr: String? = null,
    val responseCode: String? = null,
    val details: Any? = null,
) {
    companion object {
        @JvmStatic @JvmOverloads
        fun fromCode(
            code: KashierErrorCode,
            message: String? = null,
            messageAr: String? = null,
            responseCode: String? = null,
            details: Any? = null,
        ): KashierPaymentError
    }
}
```

`fromCode` fills in the SDK's built-in English/Arabic default message for the code. `message` is always non-null and English. `toString()` deliberately excludes `details`.

### KashierPaymentPending [#kashierpaymentpending]

```kotlin
data class KashierPaymentPending @JvmOverloads constructor(
    val orderId: String,
    val transactionId: String,
    val message: String,
    val messageEn: String? = null,
    val messageAr: String? = null,
)
```

### KashierCardInfo [#kashiercardinfo]

```kotlin
data class KashierCardInfo @JvmOverloads constructor(
    val brand: String? = null,
    val maskedNumber: String? = null,
    val wallet: String? = null,
) : Parcelable
```

Display-safe: never carries a full PAN, CVV, or card token.

### KashierErrorCode [#kashiererrorcode]

See [Error handling](#error-handling) for all 18 values.

### KashierLauncher [#kashierlauncher]

```kotlin
interface KashierLauncher { fun start(sessionId: String) }
```

Never throws; failures reach the registered failure listener.

### Listeners [#listeners]

```kotlin
fun interface KashierSuccessListener { fun onSuccess(result: KashierPaymentResult) }
fun interface KashierFailureListener { fun onFailure(error: KashierPaymentError) }
fun interface KashierPendingListener { fun onPending(pending: KashierPaymentPending) }
```

## Error handling [#error-handling]

`KashierPaymentError` carries:

| Field          | Meaning                                                                         |
| -------------- | ------------------------------------------------------------------------------- |
| `code`         | `KashierErrorCode` — machine-readable classification                            |
| `message`      | Human-readable English message (never null)                                     |
| `messageAr`    | Arabic message, when available                                                  |
| `responseCode` | Issuer/processor response code (e.g. `"57"`), when available                    |
| `details`      | Raw error details. &#x2A;_Always `null` on the Activity Result API._* Sensitive |

### Error codes [#error-codes]

<Accordions type="multiple">
  <Accordion title="Error codes">
    | Code                       | Trigger                                                                                     | Retryable                         | Recommended handling                             |
    | -------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------ |
    | `sessionExpired`           | Session fetch returned HTTP 410                                                             | New session required              | Ask your backend for a fresh session             |
    | `sessionNotFound`          | Session fetch returned HTTP 404                                                             | New session required              | Verify the session ID; create a fresh one        |
    | `userCancelled`            | User dismissed the sheet, pressed back, or cancelled 3-D Secure                             | Yes                               | Return to checkout silently                      |
    | `validationFailed`         | Blank session ID, or a launch while another payment is active                               | Yes, once the active payment ends | Guard your launch entry point                    |
    | `paymentDeclined`          | Gateway reported a failed transaction; `responseCode` is populated when supplied            | Yes, with another instrument      | Show the issuer message; offer another card      |
    | `authorizationFailed`      | HTTP 403 on an order operation                                                              | Usually not from the app          | Check merchant/gateway configuration server-side |
    | `networkError`             | Connectivity preflight failed, or a transport error occurred                                | Yes                               | Prompt to check connectivity and retry           |
    | `paymentTimeout`           | 3-D Secure flow timed out; delivered after the timeout sheet's Done                         | Yes                               | Reconcile, then allow a fresh attempt            |
    | `walletInitFailed`         | Wallet request-to-pay could not be initiated                                                | Yes, user-driven                  | Shown inline by the SDK                          |
    | `cardRetrievalFailed`      | Saved-card fetch failed                                                                     | Handled internally                | None — the SDK falls back to the new-card form   |
    | `cardDeletionFailed`       | Saved-card deletion failed                                                                  | Yes                               | None — the SDK shows a snackbar                  |
    | `invalidCardDetails`       | Invalid card number, name, expiry, or CVV                                                   | Yes                               | None — the SDK shows inline validation           |
    | `authenticationFailed`     | 3-D Secure authentication failed                                                            | Yes                               | Suggest retrying or another card                 |
    | `unknownError`             | Unclassified failure; also "SDK not initialized" and the wrapper's mapping of `Unavailable` | Depends                           | Reconcile with your backend before deciding      |
    | `applePayNotAvailable`     | —                                                                                           | —                                 | **Never emitted on Android**                     |
    | `applePayConfigError`      | —                                                                                           | —                                 | **Never emitted on Android**                     |
    | `merchantValidationFailed` | —                                                                                           | —                                 | **Never emitted on Android**                     |
    | `tokenProcessingFailed`    | —                                                                                           | —                                 | **Never emitted on Android**                     |
  </Accordion>
</Accordions>

<Callout title="Apple Pay codes on Android">
  The last four values exist only so the enum matches Kashier's other SDKs. No Android code path produces them. Handle them in an `else` branch; do not build UX around them.
</Callout>

### Localized error copy [#localized-error-copy]

The SDK's own sheets are already localized by `KashierConfig.language`. For errors you surface yourself, use `message` (English) and `messageAr` (Arabic), or map `code` to your own strings — recommended if your app supports languages beyond English and Arabic.

### Diagnostics [#diagnostics]

The SDK writes **nothing** to logcat, by design. To diagnose a payment, correlate on the server side using `orderId` / `orderReference` / `transactionId` from the result, and use `responseCode` for issuer declines.

## R8, ProGuard and security [#r8-proguard-and-security]

### R8 / ProGuard [#r8--proguard]

**You do not need to add any rules.**

The SDK ships its consumer rules inside the AAR. They keep exactly the public API — every class listed in [API reference](#api-reference), plus the attributes consumers need (`Signature`, `InnerClasses`, `EnclosingMethod`, annotations) — and deliberately do **not** keep `io.kashier.sdk.internal.*`, so internal classes stay eligible for renaming and removal in your minified build.

Do not add rules such as `-keep class io.kashier.sdk.** { *; }`. Broad wildcards defeat the SDK's encapsulation and keep code that is meant to be stripped.

This is verified by an automated check in the SDK repository, which builds a minified consumer app and asserts that every public class survives under its original name while `io.kashier.sdk.internal` types do not. The single unavoidable exception is the manifest-declared payment Activity, since Android component names cannot be renamed.

### Your responsibilities [#your-responsibilities]

- **Create sessions on your backend.** Never create a payment session from the app.
- **Never embed Kashier API credentials or your merchant ID in the app.** The SDK does not need them and never asks for them.
- **Reconcile server-side before fulfilling.** Treat webhooks and your backend as the source of truth — especially for `Pending` and `Unavailable`.
- **Treat the session ID as a capability.** It authorizes a payment. Do not log it, persist it in analytics, or embed it in URLs or crash reports.
- **Never log `transactionData` or `details`.** They may contain the full raw backend response. They are provided in-process only, on the compatibility wrapper path, and are always `null` on the Activity Result API. The SDK's own `toString()` implementations already exclude them.
- **Do not collect card data yourself.** The SDK's UI is the only place PAN and CVV are entered.

### What the SDK guarantees [#what-the-sdk-guarantees]

- Card data is never persisted, never logged, and never stored in SDK fields — it exists only as request arguments in memory.
- No logging interceptor exists in the published AAR; no URLs, headers, bodies, hashes, tokens, or customer data are ever written to logs.
- The payment hash comes from the session, is forwarded verbatim, and is scoped to the specific Kashier host and paths that require it. There is no client-side cryptography.
- HTTP redirects are disabled; any 3xx on an API call is an error.
- The SDK's payment Activity is not exported and has no intent filters.
- Saved state contains only the launch's request identifier — never card data, tokens, customer data, or response payloads.
- Saved-card tokens never appear in the SDK's accessibility semantics.
- `KashierCardInfo` is display-safe by construction.

## Testing and going live [#testing-and-going-live]

### Test mode [#test-mode]

```kotlin
KashierSDK.initialize(KashierConfig(KashierMode.TEST, KashierLanguage.EN))
```

Test mode points the SDK at `https://test-api.kashier.io` / `https://test-fep.kashier.io` and changes two UI behaviors on the card form:

- A &#x2A;*"Use Testing Data"** button appears above the form and prefills it with card number `4508 7500 1574 1019`, expiry `06/27`, CVV `100`, and name `John Doe`.
- The "save card" checkbox is **hidden** (it is shown only in `LIVE` mode, and only when the session permits card saving and carries customer data).

These two differences are the quickest way to confirm which mode you are in: the card-form screenshot in [Card and saved cards](#card-and-saved-cards) shows the `LIVE` appearance — checkbox present, no testing-data button.

Test sessions come from your Kashier test-mode merchant account. Obtain approving, declining, and 3-D Secure test instruments, and test wallet numbers, from your Kashier integration contact — they vary per merchant configuration.

### What to exercise [#what-to-exercise]

| Path               | How                                                                         |
| ------------------ | --------------------------------------------------------------------------- |
| Card success       | Session allowing `card`; approving test card                                |
| Card decline       | Declining test card → `Failed(paymentDeclined)`                             |
| Card validation    | Submit invalid number / expiry / CVV → inline errors, no callback           |
| 3-D Secure success | Session/card that triggers a challenge; enter the correct OTP               |
| 3-D Secure failure | Wrong OTP → challenge rejects; no crash                                     |
| 3-D Secure cancel  | Cancel the challenge → `Cancelled`                                          |
| Saved cards        | Session with saved-card retrieval enabled and a customer reference          |
| Saved-card delete  | Swipe a row, confirm                                                        |
| Wallet success     | Session allowing `wallet`; approve in the wallet app                        |
| Wallet pending     | Do not approve; wait out the 5-minute cap; tap "I have paid" → `Pending`    |
| Cancellation       | Dismiss the sheet / press back → `Cancelled`                                |
| Concurrency        | Launch twice quickly → second attempt `validationFailed`                    |
| Rotation           | Rotate mid-payment; the flow survives                                       |
| Process death      | Enable "Don't keep activities"; verify `Unavailable(processDeath)`          |
| Localization + RTL | Switch to `KashierLanguage.AR`; verify Arabic copy and right-to-left layout |

### Demo app [#demo-app]

Kashier provides a demo Android app that exercises the SDK end to end. It collects a session ID, lets you pick `TEST`/`LIVE` and `EN`/`AR`, and exposes both launch surfaces side by side so you can compare their result semantics against the same session — useful for seeing the expected behaviour of a path before you implement it, and for checking whether an issue is in the SDK or in your integration.

Request the demo build from your Kashier integration contact.

### Going-live checklist [#going-live-checklist]

- `KashierMode.LIVE` is used in release builds, and `TEST` never ships to production.
- `KashierSDK.initialize(...)` is called exactly once, before any launch.
- Both launch surfaces are registered in `onCreate`.
- Every `KashierResult` variant is handled — including `Pending`, `Cancelled`, and `Unavailable`.
- Backend/webhook reconciliation is live and is the source of truth for fulfilment.
- No Kashier API credentials or merchant IDs exist anywhere in the app or its resources.
- Session IDs are not logged, persisted, or sent to analytics/crash reporting.
- `transactionData` and `details` are never logged or persisted.
- No `-keep class io.kashier.sdk.**` wildcard was added to your ProGuard configuration.
- Release build tested with R8 enabled, end to end.
- Arabic locale and RTL layout verified if you ship `KashierLanguage.AR`.
- Process-death behavior verified with "Don't keep activities".
- Retry paths create a **new** session rather than reusing a consumed one.

## Frequently asked questions [#frequently-asked-questions]

**Can I choose which payment method the sheet shows?**

No. Methods come from the session's allowed-methods list, decided by your backend when the session is created. An empty list means all supported methods are shown.

**Can I theme the payment sheet from my app?**

There is no public theming API. The SDK applies its own design system; a brand color carried by the session recolors the result-sheet action buttons only.

**Is Apple Pay supported?**

No. Apple Pay is iOS-only. Four Apple-Pay-related values exist in `KashierErrorCode` purely so the enum matches Kashier's other SDKs; no Android code path emits them.

**Can I call `initialize` again to switch between TEST and LIVE, or change language?**

No. Re-initializing with a different config throws `IllegalStateException`. Decide mode and language at process start.

**Why is `amount` in `KashierPaymentResult` nullable and only "approximate"?**

It is a display convenience. Invalid or missing backend values map to `null` rather than throwing. Use your backend's amount for anything financial.

**Why is `transactionData` always `null`?**

On the Activity Result API, raw backend maps deliberately never cross the process boundary. They are available best-effort, in-process only, on the compatibility wrapper path — and they are sensitive, so do not log them.

**Do I need to handle `configMissing`?**

Handle it for exhaustiveness, but the current SDK never emits it. A relaunch without configuration is by definition process death and is reported as `processDeath`.

**What happens if the user backgrounds the app during a wallet payment?**

Polling continues while the SDK Activity lives, up to the 5-minute cap. If the process is killed, reconcile via your backend.

**Is there a "resend" button on the wallet waiting screen?**

No. The waiting screen offers **Reload** (re-check status) while polling, and "I have paid" plus Cancel once the 5-minute cap is reached. To send a new request-to-pay, the user cancels back to the phone-input step.

**Can I run two payments at once?**

No. The second launch is rejected with `validationFailed` and the message `"payment already in progress"`.

**Does the SDK require Jetpack Compose in my app?**

No. The SDK uses Compose internally; no Compose type is on its public API. The Kashier demo app uses plain Android views.

**Which ProGuard rules do I add?**

None. The SDK ships its own consumer rules inside the AAR.

**Is `Pending` really terminal?**

Yes. No success or failure follows it for that launch. Reconcile via backend or webhook.

**Does the SDK need `android:supportsRtl="true"`?**

Not for the SDK's own sheet — it pins its layout direction internally. Set it only if your own screens need RTL.

## UI screens reference [#ui-screens-reference]

The SDK renders these screens. Your app does not build or control any of them; this reference exists so you know what your users will see and which screen produces which result.

| Screen                           | When it appears                        | Exit paths                                                                                                   |
| -------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Landing sheet**                | After the session loads                | Wallet tile → wallet phone input; card tile / accordion → card form or saved-card pay; dismiss → `Cancelled` |
| **Card form**                    | New-card entry                         | Pay → 3-D Secure or result; back → landing; dismiss → `Cancelled`                                            |
| **Card form, test mode**         | Card form while `KashierMode.TEST`     | Adds the "Use Testing Data" button; hides "save card"                                                        |
| **Card form, validation errors** | Invalid field on submit                | Inline errors; no network call, no callback                                                                  |
| **Saved-card accordion**         | Saved cards available for the session  | Select a card → inline CVV → Pay; swipe → delete confirmation; "Add card" → card form                        |
| **Saved-card loading / empty**   | While fetching, or with no saved cards | Falls through to the new-card path                                                                           |
| **Delete confirmation dialog**   | Swipe on a saved-card row              | Confirm → delete (snackbar on failure); cancel → accordion                                                   |
| **Wallet phone input**           | Wallet method chosen                   | Pay → waiting sheet; back → landing                                                                          |
| **Wallet waiting**               | Request-to-pay sent                    | Reload; Cancel → phone input; terminal reconcile → result                                                    |
| **Wallet pending exhausted**     | 5-minute cap reached, still pending    | "I have paid" → `Pending`; Cancel → `Cancelled`                                                              |
| **3-D Secure WebView**           | Issuer requires authentication         | Completion → verifying; cancel → `Cancelled`                                                                 |
| **3-D Secure verifying**         | Challenge finished, outcome confirming | Automatic → result or pending                                                                                |
| **3-D Secure timeout**           | Authentication timed out               | Done → `Failed(paymentTimeout)`; Try Again → restart, no callback                                            |
| **Success sheet**                | Payment approved                       | Done → `Succeeded`                                                                                           |
| **Failure sheet**                | Payment failed                         | Dismiss → `Failed`; Try Again → back into the flow, no callback                                              |
| **Pending modal**                | Settlement still running               | Done → `Pending`                                                                                             |

Every screen renders in English (LTR) or Arabic (RTL) according to `KashierConfig.language`.

Screenshots for the landing sheet, card form, saved-card accordion, CVV validation, wallet phone entry, wallet waiting, 3-D Secure challenge, 3-D Secure timeout, and the success sheet appear in their respective sections above. All were captured against a test merchant account with transaction identifiers masked.

Screens not yet illustrated: the delete-confirmation dialog, the wallet pending-exhausted state, the pending modal, and the failure sheet. Their behaviour is described in the table above.

## Support and license [#support-and-license]

### Support [#support]

- Developer portal: [developers.kashier.io](https://developers.kashier.io)
- For integration issues, include: SDK mode (`TEST`/`LIVE`), Android API level, device model, the `KashierErrorCode`, the `responseCode` if present, and the **order ID** or **order reference**.
- **Never** share session IDs, card data, OTPs, raw `transactionData`, or raw `details` in a support request.

### License [#license]

The Kashier Native Android SDK is proprietary software owned by Kashier. It is distributed under the **Kashier Proprietary SDK License**: [read the full license](/docs/accept-payments/android-sdk-license).

The same license text ships as the `LICENSE` file inside the SDK distribution, and the license name and URL above are declared in the published Maven POM.

In summary — the full license text governs, this is not a substitute for it:

- You may download, integrate, and distribute the SDK inside your own application **solely** to enable Kashier payment services.
- You may **not** redistribute the SDK as a standalone product, modify it, create derivative works, or reverse engineer, decompile, or disassemble it.
- You may **not** remove or alter Kashier's proprietary, trademark, or copyright notices, or use the SDK to provide payment services other than through Kashier.
- Third-party components bundled with or required by the SDK remain subject to their own license terms.
- Use of Kashier payment services is additionally governed by your merchant agreement and the applicable Kashier terms of service.

# Apple Pay (/docs/accept-payments/apple-pay)

Accept Apple Pay on Kashier's hosted checkout page, on your own website with the Kashier SDK, or inside your own iOS app. Customers on Apple devices pay with the card saved in their Apple Wallet.

<Callout title="Note">
  An Apple Pay payment settles over the card rail (MPGS), so refunds, void and authorize/capture behave the same as a card payment. `enable3DS` is forced to `false` - the device cryptogram already carries the authentication, so no separate 3D Secure step runs. Google Pay is not supported.
</Callout>

## Choose your setup [#choose-your-setup]

Pick the row that matches where your customers pay.

| Where customers pay                       | Apple Developer account | What you set up                                                                                                                                                                 | Guide                                                                                                                       |
| ----------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Kashier's hosted checkout page            | Not needed              | Nothing                                                                                                                                                                         | [Kashier hosted checkout page](#kashier-hosted-checkout-page)                                                               |
| Your website, with Kashier's certificates | Not needed              | Share your website domain with Kashier and host the file Kashier sends you                                                                                                      | [Use Kashier's Apple Pay certificates](#use-kashiers-apple-pay-certificates)                                                |
| Your iOS app                              | **Required**            | Your Merchant ID and Payment Processing Certificate, uploaded in the Kashier dashboard                                                                                          | [Accept Apple Pay in your iOS app](#accept-apple-pay-in-your-ios-app)                                                       |
| Your website, with your own certificates  | **Required**            | Your Merchant ID, Payment Processing Certificate and Merchant Identity Certificate, uploaded in the Kashier dashboard, and your domain verified in your Apple Developer account | [Accept Apple Pay on your website with your own certificates](#accept-apple-pay-on-your-website-with-your-own-certificates) |

What each setup needs:

|                                | Hosted checkout page | Website, Kashier's certificates | iOS app    | Website, your own certificates               |
| ------------------------------ | -------------------- | ------------------------------- | ---------- | -------------------------------------------- |
| Merchant ID                    | Kashier's            | Kashier's                       | Yours      | Yours                                        |
| Payment Processing Certificate | Kashier's            | Kashier's                       | Yours      | Yours                                        |
| Merchant Identity Certificate  | Kashier's            | Kashier's                       | Not needed | Yours                                        |
| Domain verification            | Not needed           | Done by Kashier                 | Not needed | Done by you, in your Apple Developer account |
| Action needed from Kashier     | None                 | Register your domain            | None       | None                                         |

<Callout title="iOS apps always use your own Apple Pay account">
  Apple only lets an app offer Apple Pay with a Merchant ID that belongs to the same Apple Developer account as the app. To accept Apple Pay in your iOS app, register your own Merchant ID and upload your own Payment Processing Certificate to Kashier. Kashier's certificates cannot be used inside your app.
</Callout>

You can combine setups. For example, your iOS app can use your own certificates while your website keeps using Kashier's certificates. Kashier reads which certificate each Apple Pay payment was encrypted for and decrypts it with the matching key. If you never turn on your own certificates, nothing changes for you.

## Kashier hosted checkout page [#kashier-hosted-checkout-page]

If you send customers to Kashier's hosted checkout page (the `sessionUrl` of a [payment session](/docs/accept-payments/payment-sessions)), Apple Pay is offered on that page with no setup on your side.

## Use Kashier's Apple Pay certificates [#use-kashiers-apple-pay-certificates]

Use this setup to show the Apple Pay button on your own website without an Apple Developer account. Kashier registers your domain with Apple under Kashier's Apple Pay account.

### Prerequisites [#prerequisites]

Before implementing the Kashier Apple Pay integration, ensure you have:

1. A website with HTTPS enabled
2. Provided your website domain to Kashier's team so it can be verified with Apple
3. The Kashier SDK script

### Step 1: Domain registration [#step-1-domain-registration]

Share your website URL with the Kashier support team so Kashier can register your domain with Apple.

### Step 2: Certificate installation [#step-2-certificate-installation]

After receiving the Apple Pay domain-association file from Kashier:

1. Access your website's root directory
2. Create a `.well-known` directory if it does not exist
3. Upload the file to this directory
4. Ensure the file is accessible at: `https://your-domain.com/.well-known/apple-developer-merchantid-domain-association.txt`

<Callout title="Tip">
  Apple requests the file at `/.well-known/apple-developer-merchantid-domain-association` (without `.txt`). Serving the same file at both paths avoids verification failures.
</Callout>

Then add the SDK to your checkout page as described in [Website implementation](#website-implementation).

## Use your own Apple Pay certificates [#use-your-own-apple-pay-certificates]

If you have an Apple Developer account, you can run Apple Pay under your own Merchant ID and certificates. Apple then encrypts payments for your own Payment Processing Certificate, and Kashier decrypts them with the private key you upload. You need this setup to accept Apple Pay in your iOS app, and you can also use it on your website.

### What you need [#what-you-need]

| Item                                               | iOS app    | Website  | What it is for                                                             |
| -------------------------------------------------- | ---------- | -------- | -------------------------------------------------------------------------- |
| Merchant ID                                        | Required   | Required | Your Apple Pay merchant identifier, for example `merchant.com.yourcompany` |
| Payment Processing Certificate and its private key | Required   | Required | Kashier uses them to decrypt your Apple Pay payments                       |
| Merchant Identity Certificate and its private key  | Not needed | Required | Proves to Apple that your website may start an Apple Pay session           |
| Domain verified with Apple                         | Not needed | Required | Apple only shows Apple Pay on domains verified under your Merchant ID      |

You create all of these in your Apple Developer account (**Certificates, Identifiers & Profiles**). You also need a computer with OpenSSL (macOS includes it) to create the private keys.

### Create your Merchant ID and certificates [#create-your-merchant-id-and-certificates]

1. **Merchant ID.** In **Certificates, Identifiers & Profiles > Identifiers > Merchant IDs**, find or create your Merchant ID, for example `merchant.com.yourcompany`.
2. **Payment Processing Certificate (required).** Create it for that Merchant ID from a certificate signing request (CSR) whose private key is an EC P-256 (`prime256v1`) key.
3. **Merchant Identity Certificate (website only).** Create it for the same Merchant ID. Skip it if you accept Apple Pay only in your iOS app.

<Accordions type="multiple">
  <Accordion title="Creating the certificates with OpenSSL">
    Keep every `.key` file private. You upload it to Kashier only.

    **Payment Processing Certificate (required)**

    ```bash
    # 1. EC P-256 private key
    openssl ecparam -genkey -name prime256v1 -noout -out payment_processing.key
    # 2. Certificate signing request (enter a 2-letter Country Name, for example EG)
    openssl req -new -key payment_processing.key -out payment_processing.csr
    # 3. Upload the CSR in Apple Developer: Merchant IDs > your Merchant ID >
    #    Apple Pay Payment Processing Certificate > Create Certificate, then download apple_pay.cer
    # 4. Optional: convert the certificate to PEM
    openssl x509 -inform DER -in apple_pay.cer -out payment_certificate.pem
    ```

    **Merchant Identity Certificate (website only)**

    ```bash
    # 1. RSA 2048 private key
    openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out merchant_identity.key
    # 2. Certificate signing request
    openssl req -new -key merchant_identity.key -out merchant_identity.csr
    # 3. Upload the CSR in Apple Developer: Merchant IDs > your Merchant ID >
    #    Apple Pay Merchant Identity Certificate > Create Certificate, then download merchant_id.cer
    # 4. Optional: convert the certificate to PEM
    openssl x509 -inform DER -in merchant_id.cer -out merchant_certificate.pem
    ```

    You can upload the downloaded `.cer` files as they are, or the converted `.pem` files.

  </Accordion>
</Accordions>

### Upload your certificates to Kashier [#upload-your-certificates-to-kashier]

In the Kashier dashboard, open **Settings > Device Payment Configuration > Apple Pay**:

1. Turn on **Use my own certificates**.
2. Enter your **Merchant ID** exactly as it appears in your Apple Developer account, including `merchant.`.
3. Under **Payment Processing Certificate**, upload the certificate and its private key. This pair is required.
4. For your website only: under **Merchant Identity Certificate**, upload the certificate and its private key. Skip this for an iOS app.
5. Select **Save changes**.

When the setup is complete, the Apple Pay status shows **Using your certificates** and your Merchant ID. Until the Merchant ID and the Payment Processing pair are saved, Kashier's setup stays in use.

| File                           | Accepted formats                        |
| ------------------------------ | --------------------------------------- |
| Payment Processing Certificate | `.cer` or `.pem`                        |
| Payment Processing Private Key | `.key` or `.pem`, unencrypted, EC P-256 |
| Merchant Identity Certificate  | `.cer` or `.pem`                        |
| Merchant Identity Private Key  | `.key` or `.pem`, unencrypted           |

- Each file can be at most 64 KB.
- Private keys must not be password-protected.
- Each certificate is uploaded together with its own private key, and the key must match the certificate.
- Certificates must not be expired and must belong to the Merchant ID you entered.
- To change the Merchant ID, upload a new Payment Processing pair created for the new Merchant ID at the same time.

<Callout title="Your private keys">
  Kashier stores your private keys encrypted and never shows them again, in the dashboard or in the API. Keep your own copy somewhere safe.
</Callout>

## Accept Apple Pay in your iOS app [#accept-apple-pay-in-your-ios-app]

To accept Apple Pay inside your own iOS app, you need your Merchant ID and your Payment Processing Certificate and private key. The Merchant Identity Certificate and domain verification are for websites only, so skip them.

1. [Create your Merchant ID and Payment Processing Certificate](#create-your-merchant-id-and-certificates) in your Apple Developer account.
2. [Upload them to Kashier](#upload-your-certificates-to-kashier) and check that the status shows **Using your certificates**.
3. In Xcode, add the **Apple Pay** capability to your app target and select the same Merchant ID.
4. Pass the same Merchant ID to the Kashier SDK you use:
   - **iOS SDK:** `KashierConfig(appleMerchantID:)`. See [iOS SDK > Apple Pay](/docs/accept-payments/ios-sdk#apple-pay).
   - **Flutter SDK:** `KashierSDK.initialize(appleMerchantId:)`. See the [Flutter SDK Apple Pay integration guide](/docs/accept-payments/flutter-sdk#apple-pay-integration-guide).
   - **Your own PassKit integration:** send the Apple Pay token unmodified as `paymentMethod.card.applePay = { token }` in the checkout pay request.

The Merchant ID in your app, in the SDK and in the Kashier dashboard must be the same. Kashier then decrypts the payments from your app with your Payment Processing private key.

## Accept Apple Pay on your website with your own certificates [#accept-apple-pay-on-your-website-with-your-own-certificates]

1. [Create your Merchant ID, Payment Processing Certificate and Merchant Identity Certificate](#create-your-merchant-id-and-certificates) in your Apple Developer account.
2. Verify your website domain in your Apple Developer account, under the same Merchant ID (**Merchant Domains > Add Domain**). Use the domain-association file Apple gives you in your own account, not the file Kashier sends for the standard setup, and host it at `https://your-domain.com/.well-known/apple-developer-merchantid-domain-association`. No action is needed from Kashier.
3. [Upload both certificate pairs to Kashier](#upload-your-certificates-to-kashier).
4. Add the SDK to your checkout page as described in [Website implementation](#website-implementation).

<Callout type="warn" title="A domain can belong to only one Apple developer account">
  Apple lets a domain be registered under one Apple developer team only. If your domain is already registered with Kashier for the standard setup, ask Kashier support to remove it first, or use a different subdomain for your checkout page.
</Callout>

## Website implementation [#website-implementation]

The code below is the same whether your website uses Kashier's certificates or your own.

### Basic integration [#basic-integration]

Add the following code to your checkout page:

```html
<!-- Apple Pay Button Container -->
<div id="kashier-sdk-id"></div>

<!-- Optional Success Response Container -->
<div id="kashier-success-id"></div>

<!-- Optional Failure Response Container -->
<div id="kashier-failure-id"></div>

<!-- Kashier SDK Script -->
<script src="https://payments.kashier.io/kashier-sdk.js"></script>

<!-- Initialization Script -->
<script>
  kashierSDK.load({
    data: {
      mode: "test", // Use 'live' for production
      sessionId: "YOUR_SESSION_ID",
    },
    onSuccess: (response) => console.log(response),
    onFailure: (error) => console.log(error),
    locale: "en",
  });
</script>
```

### HTML elements [#html-elements]

| Element ID         | Required | Description                                                      |
| ------------------ | -------- | ---------------------------------------------------------------- |
| kashier-sdk-id     | Yes      | Container where the Apple Pay button will be rendered            |
| kashier-success-id | No       | Optional container for displaying successful payment information |
| kashier-failure-id | No       | Optional container for displaying payment failure information    |

### Configuration options [#configuration-options]

The `kashierSDK.load()` method accepts a configuration object with the following properties:

#### Required parameters [#required-parameters]

| Parameter      | Type   | Description                                                                                                                                           |
| -------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| data.mode      | String | Environment mode: 'test' or 'live'                                                                                                                    |
| data.sessionId | String | Unique payment session identifier provided by Kashier's payment session creation API. See [payment sessions](/docs/accept-payments/payment-sessions). |

#### Optional parameters [#optional-parameters]

| Parameter | Type     | Description                                                            |
| --------- | -------- | ---------------------------------------------------------------------- |
| locale    | String   | Language for the Apple Pay button: `'en'` (English) or `'ar'` (Arabic) |
| onSuccess | Function | Callback function that executes after successful payment completion    |
| onFailure | Function | Callback function that executes after payment failure                  |

## Managing your certificates [#managing-your-certificates]

In **Settings > Device Payment Configuration > Apple Pay** you can:

- **View** your saved Merchant ID and the date your certificates became active.
- **Replace** a certificate or private key: select **Replace** on the file, upload the new one, and save.
- **Remove the Merchant Identity Certificate**: Apple Pay on your website stops using your own identity. Payments in your iOS app are not affected.
- **Switch back to Kashier's setup**: turn off **Use my own certificates** and save. Your uploaded files are kept, so you can turn it on again later.

When you switch back to Kashier's setup:

- Apple Pay in your iOS app stops working until you turn your own certificates on again.
- If your website used your own certificates, it needs the standard setup again: your domain registered with Kashier, and the domain-association file Kashier sends you. Because a domain can belong to only one Apple developer account, remove the domain from your own Apple account first.

## Renewing your certificates [#renewing-your-certificates]

Apple certificates expire, so renew them before the expiry date. Kashier holds one active Payment Processing pair at a time:

1. Create the new certificate in your Apple Developer account, but do not activate it yet.
2. Upload the new certificate and private key to Kashier in **Settings > Device Payment Configuration > Apple Pay**.
3. Activate the new certificate in your Apple Developer account.

Do steps 2 and 3 back to back. Between them, payments encrypted for the certificate Kashier no longer holds fail. For the Merchant Identity Certificate, upload the new pair to Kashier before the old certificate expires.

## Troubleshooting [#troubleshooting]

| Problem                                             | Likely cause                                                                           | What to do                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Apple Pay is not offered in your iOS app            | The Merchant ID in Xcode, in the SDK and in the Kashier dashboard are not the same     | Use the same Merchant ID in all three places                                                    |
|                                                     | `appleMerchantID` / `appleMerchantId` is not passed to the SDK                         | Pass your Merchant ID when you initialize the SDK                                               |
| The Apple Pay sheet does not open on your website   | Your domain is not verified under the same Apple developer account as your Merchant ID | Verify the domain under that Merchant ID with Apple's domain-association file from your account |
|                                                     | Your Merchant Identity Certificate has expired or was removed                          | Create a new identity certificate and upload it with its key                                    |
| The payment fails with "Apple Pay token is invalid" | The Payment Processing Certificate active at Apple is not the one uploaded to Kashier  | Upload the pair that is active at Apple                                                         |
|                                                     | The certificate was renewed or rotated at Apple without uploading it to Kashier first  | Upload the new pair to Kashier, as in [Renewing your certificates](#renewing-your-certificates) |
|                                                     | **Use my own certificates** is turned off                                              | Turn it on and save                                                                             |

## Support [#support]

For technical support, contact Kashier support at:

- Email: [techsupport@kashier.io](mailto:techsupport@kashier.io)

# Authorize and capture (/docs/accept-payments/authorize-capture)

You can use an authorized transaction to hold the amount of the order or service. You can either manually capture a partial or full amount of the order payment. Order amounts can also be released back to customers.

## How it works [#how-it-works]

- You will be notified when the order has been authorized via your dashboard, and in the case of [Payment Sessions](/docs/accept-payments/payment-sessions), the Status response will be AUTHORIZED, and the webhook event will be "authorize."
- You can use the manual release or manual capture operations in the endpoint.

<Callout title="Note">
  Approval is needed. The Authorization Capture feature can be enabled by contacting your account manager or customer success.
</Callout>

## Capture [#capture]

The amount of the order is either captured fully or partially. Capture is done by sending a PUT request with the order ID `orderId` in the URL as a parameter, and inserting a transaction ID and amount in the body.

In case you are still in the development phase, you will need to call our API using the following testing endpoint API URL:

| Endpoint | Value                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------ |
| URL      | [https://test-fep.kashier.io/v3/orders/:orderId](https://test-fep.kashier.io/v3/orders/:orderId) |
| Method   | PUT                                                                                              |

Meanwhile, whenever you are ready for production, you should use the following production API endpoint URL instead:

| Endpoint | Value                                                                                  |
| -------- | -------------------------------------------------------------------------------------- |
| URL      | [https://fep.kashier.io/v3/orders/:orderId](https://fep.kashier.io/v3/orders/:orderId) |
| Method   | PUT                                                                                    |

### Headers [#headers]

| Key           | Description                                                                                                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

<Callout title="This call takes your secret key, not a hash">
  Capture, void and refund authenticate with the `Authorization` **secret key** — the same credential the [Dashboard API](/docs/dashboard-api/authentication) uses. That differs from the pay call on the same host: creating a payment (`POST /v3/orders`) is gated by a [`Kashier-Hash`](/docs/direct-api/hashing) header and takes no secret key. `PUT /v3/orders/:orderId` takes no `Kashier-Hash`, so there is nothing to compute here.
</Callout>

```bash
curl -X 'PUT' 'https://test-fep.kashier.io/v3/orders/:orderId'
      -H 'Authorization: your_secretKey'
      -H 'accept: application/json'
      -H 'Content-Type: application/json'
      -d '{"apiOperation":"CAPTURE","transaction":{"amount":3}}'
```

<ApiTryIt
  method="PUT"
  url="https://test-fep.kashier.io/v3/orders/:orderId"
  body="{
  apiOperation: 'CAPTURE',
  transaction: { amount: 3 },
}"
  sendApiKey="false"
/>

### Body structure [#body-structure]

```json
{
  "apiOperation": "CAPTURE",
  "transaction": {
    "amount": 3
  }
}
```

Full parameter and response reference → [Refund, void, or capture an order](/docs/api-reference/order-operations/updateOrder).

<Callout title="Capture promptly">
  Capture an authorized amount as soon as you are ready to take the money. An authorization is a hold placed by the issuing bank, and holds do not last indefinitely — how long yours stays capturable depends on the issuer and on your account configuration, so confirm the window that applies to you with your Kashier account manager rather than assuming one.
</Callout>

## Release [#release]

Releasing an authorized amount is a **void** of the authorize transaction — there is no separate release operation. Send a PUT request to the same endpoint with `apiOperation` set to `VOID`, the order ID `orderId` in the URL, and the `transactionId` of the authorized transaction as `transaction.targetTransactionId` in the body. Include `transaction.amount` to release only part of the hold.

The `transactionId` is returned in the callback URL, webhook, and response body.

```json
{
  "apiOperation": "VOID",
  "transaction": {
    "targetTransactionId": "TX-1902526801"
  }
}
```

Kashier also releases the remainder of a hold for you automatically after a partial capture when you send `autoVoid: true` on the capture.

Full contract → [Void](/docs/accept-payments/void)

# Connected accounts (/docs/accept-payments/connected-accounts)

This feature gives the ability for authorized platforms to make payments on behalf of other Kashier merchants that are enabled for connected accounts. A platform is an aggregator of multiple merchants or service providers. Examples: Amazon, Talabat. A connected account refers to the merchants on the platform, such as McDonald's, KFC.

## Account requirements [#account-requirements]

- Connected account: The connected account should be an existing Kashier merchant that is enabled for live payments. It must authorize the connection to the platform.
- Platform account: The platform should be an existing Kashier merchant. No need for a bank account or live payment acceptance, but the connected accounts must authorize the platform to collect payments on their behalf (i.e., by displaying the connected account's payment UI on the platform app).

## Making payments on behalf of connected accounts [#making-payments-on-behalf-of-connected-accounts]

Learn how to add the right information to your [Payment Sessions](/docs/accept-payments/payment-sessions) so you can make payments on behalf of your connected accounts.

You can make a payment on behalf of a connected account by passing the connected account's merchant ID as `connectedAccount.merchantId` on the [Payment Sessions](/docs/accept-payments/payment-sessions) request. The value is the connected account's own MID and must carry the `MID-` prefix:

```json
{
  "connectedAccount": {
    "merchantId": "MID-XXXXX-XXX"
  }
}
```

Both the platform and sub-merchant can view transactions and export them from the [Merchant Portal](https://merchant.kashier.io).

# Currency conversion (/docs/accept-payments/currency-conversion)

Kashier exposes a lightweight exchange-rate lookup you can use to price cross-currency amounts before creating a payment — for example, quoting a customer a price in USD while the actual charge settles in EGP.

<Callout title="This is a rate lookup, not a currency conversion feature">
  This endpoint only reads a rate. It does not convert a payment, does not change
  how a payment session behaves, and is not switched on or off per merchant —
  calling it has no effect on anything else in your account. If you are looking for
  customer-facing display currencies on checkout, that is a separate, separately
  gated product feature; ask your account manager whether it is available to you.
</Callout>

<Callout title="Public endpoint">
  Unlike the rest of the payments API, this endpoint is **public and unauthenticated** — no `Authorization` or `api-key` header is required. You can call it directly from a browser or server without a merchant secret key.
</Callout>

## Get exchange rate [#get-exchange-rate]

| Endpoint | Value                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v3/payment/exchange-rate](https://test-api.kashier.io/v3/payment/exchange-rate) |
| LIVE-URL | [https://api.kashier.io/v3/payment/exchange-rate](https://api.kashier.io/v3/payment/exchange-rate)           |
| Method   | GET                                                                                                          |

### Query parameters [#query-parameters]

| Key  | Description                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------ |
| from | Source currency code (e.g. `USD`). Optional — defaults to `USD`. Returned as `base`.             |
| to   | Target currency code (e.g. `EGP`). Optional — defaults to `EGP`. Becomes the key inside `rates`. |

```bash
curl --location 'https://test-api.kashier.io/v3/payment/exchange-rate?from=USD&to=EGP'
```

<ApiTryIt title="Try it — get exchange rate" method="GET" url="https://test-api.kashier.io/v3/payment/exchange-rate?from=USD&to=EGP" sendApiKey="false" />

### Response [#response]

```json
{
  "success": true,
  "timestamp": 1787654094144,
  "base": "USD",
  "date": "2026-08-25",
  "rates": {
    "EGP": 50.76884413
  }
}
```

| Field       | Description                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `success`   | `true` when a rate was resolved.                                                                                                           |
| `timestamp` | When the rate was produced, in milliseconds since the epoch.                                                                               |
| `base`      | The source currency — echoes `from`.                                                                                                       |
| `date`      | The rate's date, `YYYY-MM-DD`.                                                                                                             |
| `rates`     | An object with a single key: the `to` currency, mapped to the rate. Multiply an amount in `base` by this number to get the amount in `to`. |

So `1 USD = 50.76884413 EGP` in the example above.

<Callout title="This response is not in the usual Kashier envelope">
  Successful responses here are passed through from the upstream rate provider, so they have **no** `status`/`response`/`messages` wrapper — unlike the rest of the API. Errors *are* wrapped in the standard envelope. Parse the two shapes separately.
</Callout>

### Supported currencies [#supported-currencies]

`from` and `to` accept ISO 4217 codes, and the range is wide — the rate comes
from an upstream FX provider, not from a short Kashier list. `EGP`, `USD`, `EUR`,
`GBP`, `SAR`, `AED`, `KWD`, `JPY`, `CAD`, `CHF`, and `AUD` all resolve, and so do
many others. An unrecognised code is rejected rather than silently defaulted (see
[Errors](#errors)).

<Callout type="warn" title="A rate you can look up is not a currency you can charge in">
  This endpoint quoting `USD → JPY&#x60; does not mean Kashier can take a payment in
  JPY. Payment sessions accept &#x2A;*`EGP`, `USD`, `GBP`, and `EUR`** only — see
  [create payment session](/docs/api-reference/payment-sessions/createPaymentSession).
  Use this endpoint to price or display a cross-currency amount; charge in a
  currency your account actually supports.
</Callout>

### Errors [#errors]

An unknown `to` currency returns **404**:

```json
{
  "error": { "cause": "Invalid Data" },
  "messages": {
    "en": "The Exchange Rate Service is temporarily unavailable. Please try again.",
    "ar": "حدث خطأ ما"
  },
  "status": "FAILURE"
}
```

An unknown `from` currency, or an upstream outage, returns **503**:

```json
{
  "error": { "cause": "Service unavailable" },
  "messages": {
    "en": "Exchange rate is temporarily unavailable. Please try again later",
    "ar": "سعر الصرف غير متاح مؤقتًا. يرجى المحاولة مرة أخرى لاحقًا"
  },
  "status": "FAILURE"
}
```

Note that the 404 message says "temporarily unavailable" even though the cause is an invalid currency code — branch on the status code and `error.cause`, not on the message text.

## Supported display currencies [#supported-display-currencies]

When currency conversion is on for your account, the hosted payment page shows a dropdown of display currencies. These are the 151 codes it lists. To pre-select one, pass it as `currencyConversionDefault` when you [create a payment session](/docs/accept-payments/payment-sessions). The field is display only: it never changes the amount, currency or amount charged.

`AED` · `AFN` · `ALL` · `AMD` · `ANG` · `AOA` · `ARS` · `AUD` · `AWG` · `AZN` · `BAM` · `BBD` · `BDT` · `BGN` · `BHD` · `BIF` · `BMD` · `BND` · `BOB` · `BRL` · `BSD` · `BTN` · `BWP` · `BYN` · `BZD` · `CAD` · `CDF` · `CHF` · `CLP` · `CNY` · `COP` · `CRC` · `CUC` · `CVE` · `CZK` · `DJF` · `DKK` · `DOP` · `DZD` · `EGP` · `ERN` · `ETB` · `EUR` · `FJD` · `FKP` · `GBP` · `GEL` · `GHS` · `GIP` · `GMD` · `GNF` · `GTQ` · `GYD` · `HKD` · `HNL` · `HTG` · `HUF` · `IDR` · `INR` · `IQD` · `IRR` · `ISK` · `JMD` · `JOD` · `JPY` · `KES` · `KGS` · `KHR` · `KMF` · `KPW` · `KRW` · `KWD` · `KYD` · `KZT` · `LAK` · `LBP` · `LKR` · `LRD` · `LSL` · `LYD` · `MAD` · `MDL` · `MGA` · `MKD` · `MMK` · `MNT` · `MOP` · `MRO` · `MUR` · `MVR` · `MWK` · `MXN` · `MYR` · `MZN` · `NAD` · `NGN` · `NIO` · `NOK` · `NPR` · `NZD` · `OMR` · `PAB` · `PEN` · `PGK` · `PHP` · `PKR` · `PLN` · `PYG` · `QAR` · `RON` · `RSD` · `RUB` · `RWF` · `SAR` · `SBD` · `SCR` · `SDG` · `SEK` · `SGD` · `SHP` · `SLL` · `SOS` · `SRD` · `STD` · `SYP` · `SZL` · `THB` · `TJS` · `TMT` · `TND` · `TOP` · `TRY` · `TTD` · `TWD` · `TZS` · `UAH` · `UGX` · `USD` · `UYU` · `UZS` · `VEF` · `VND` · `VUV` · `WST` · `XAF` · `XCD` · `XOF` · `XPF` · `YER` · `ZAR` · `ZMW`

Matching ignores case. A code that is not in this list is ignored and the page starts on USD.

# Customers (/docs/accept-payments/customers)

The Customers module in Kashier's API allows merchants to store, manage, and retrieve customer information. It enables the creation of customer profiles and links them to transactions at checkout. Merchants can update customer details, track payment history, and personalize the experience. This module simplifies recurring payments and improves customer insights for both businesses and customers.

## Customer object structure [#customer-object-structure]

The customer interface.

```json
{
  "_id": "67ba0311bf4f31001203c6c2",
  "name": "John Doe",
  "phoneNumber": "01XXXXXXXXX",
  "emailAddress": "",
  "customerId": "C-XXXXXXXXXXXXX",
  "merchantId": "MID-XXXXX-XXX",
  "customFields": [
    {
      "name": "custom-key-1",
      "value": "custom-value-1"
    },
    {
      "name": "custom-key-2",
      "value": "custom-value-2"
    }
  ],
  "createdByUserId": "5f8d0d55b54764421b7156c3",
  "__v": 0,
  "createdAt": "2025-02-22T17:02:10.098Z",
  "updatedAt": "2025-02-25T12:31:40.474Z",
  "id": "67ba0311bf4f31001203c6c2"
}
```

## List all customers [#list-all-customers]

Retrieve a list of all customers.

| Endpoint | Value                                                                                                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TEST URL | [https://test-api.kashier.io/v2/customers?page=1\&limit=20\&sortType=-1\&sortBy=name](https://test-api.kashier.io/v2/customers?page=1&limit=20&sortType=-1&sortBy=name) |
| LIVE URL | [https://api.kashier.io/v2/customers?page=1\&limit=20\&sortType=-1\&sortBy=name](https://api.kashier.io/v2/customers?page=1&limit=20&sortType=-1&sortBy=name)           |
| Method   | GET                                                                                                                                                                     |

### Query parameters [#query-parameters]

All of these are optional — call the route with no query string to get the first page with the defaults.

| Key                     | Description                                               |
| ----------------------- | --------------------------------------------------------- |
| `page`                  | Page number. Default `1`.                                 |
| `limit`                 | Records per page. Default `20`.                           |
| `sortBy`                | Sort field: `name` or `createdAt`.                        |
| `sortType`              | Sort order: `1` ascending, `-1` descending. Default `-1`. |
| `search`                | Search term.                                              |
| `searchBy`              | Field to search in, for example `name`.                   |
| `startDate` / `endDate` | Date range filter, `YYYY-MM-DD`.                          |
| `labels`                | Comma-separated label names.                              |
| `branchIds`             | Comma-separated branch IDs.                               |

```bash
curl --location 'https://test-api.kashier.io/v2/customers?page=1&limit=20&sortType=-1&sortBy=name'
      --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt title="Try it — list customers" method="GET" url="https://test-api.kashier.io/v2/customers?page=1&limit=20&sortType=-1&sortBy=name" sendApiKey="false" />

### Headers [#headers]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

Full parameter and response reference → [List all customers](/docs/api-reference/customers/listCustomers).

## Get customer details [#get-customer-details]

Retrieve details of a specific customer.

| Endpoint | Value                                                                                        |
| -------- | -------------------------------------------------------------------------------------------- |
| TEST URL | [https://test-api.kashier.io/v2/customers/:id](https://test-api.kashier.io/v2/customers/:id) |
| LIVE URL | [https://api.kashier.io/v2/customers/:id](https://api.kashier.io/v2/customers/:id)           |
| Method   | GET                                                                                          |

```bash
curl --location 'https://test-api.kashier.io/v2/customers/:id'
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt title="Try it — customer details" method="GET" url="https://test-api.kashier.io/v2/customers/:id" sendApiKey="false" />

### Headers [#headers-1]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

Full parameter and response reference → [Get customer details](/docs/api-reference/customers/getCustomer).

## Add new customer [#add-new-customer]

Add a new customer.

| Endpoint | Value                                                                                |
| -------- | ------------------------------------------------------------------------------------ |
| TEST URL | [https://test-api.kashier.io/v2/customers](https://test-api.kashier.io/v2/customers) |
| LIVE URL | [https://api.kashier.io/v2/customers](https://api.kashier.io/v2/customers)           |
| Method   | POST                                                                                 |

```bash
curl --location 'https://test-api.kashier.io/v2/customers'
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
  --data-raw '{
      "name": "John doe",
      "phoneNumber": "01123456789",
      "emailAddress": "john.doe@example.com",
      "customFields": [
          {
              "name": "custom-key-1",
              "value": "custom-value-1"
          }
      ],
      "preferredCommunicationChannel":"sms"
  }'
```

<ApiTryIt
  title="Try it — add customer"
  method="POST"
  url="https://test-api.kashier.io/v2/customers"
  body="{
  name: 'John doe',
  phoneNumber: '01123456789',
  emailAddress: 'john.doe@example.com',
  customFields: [
    {
      name: 'custom-key-1',
      value: 'custom-value-1',
    },
  ],
  preferredCommunicationChannel: 'sms',
}"
  sendApiKey="false"
/>

### Headers [#headers-2]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

Full parameter and response reference → [Add a new customer](/docs/api-reference/customers/createCustomer).

## Update customer [#update-customer]

Update a customer.

| Endpoint | Value                                                                                        |
| -------- | -------------------------------------------------------------------------------------------- |
| TEST URL | [https://test-api.kashier.io/v2/customers/:id](https://test-api.kashier.io/v2/customers/:id) |
| LIVE URL | [https://api.kashier.io/v2/customers/:id](https://api.kashier.io/v2/customers/:id)           |
| Method   | PUT                                                                                          |

```bash
curl --location --request PUT 'https://test-api.kashier.io/v2/customers/:id'
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
  --data-raw '{
      "name": "John doe",
      "phoneNumber": "01123456789",
      "emailAddress": "john.doe@example.com",
      "customFields": [
          {
              "name": "custom-key-1",
              "value": "custom-value-1"
          }
      ],
      "preferredCommunicationChannel":"sms"
  }'
```

<ApiTryIt
  title="Try it — update customer"
  method="PUT"
  url="https://test-api.kashier.io/v2/customers/:id"
  body="{
  name: 'John doe',
  phoneNumber: '01123456789',
  emailAddress: 'john.doe@example.com',
  customFields: [
    {
      name: 'custom-key-1',
      value: 'custom-value-1',
    },
  ],
  preferredCommunicationChannel: 'sms',
}"
  sendApiKey="false"
/>

### Headers [#headers-3]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

Full parameter and response reference → [Update a customer](/docs/api-reference/customers/updateCustomer).

## Delete customer [#delete-customer]

Delete a customer.

| Endpoint | Value                                                                                        |
| -------- | -------------------------------------------------------------------------------------------- |
| TEST URL | [https://test-api.kashier.io/v2/customers/:id](https://test-api.kashier.io/v2/customers/:id) |
| LIVE URL | [https://api.kashier.io/v2/customers/:id](https://api.kashier.io/v2/customers/:id)           |
| Method   | DELETE                                                                                       |

```bash
curl --location --request DELETE 'https://test-api.kashier.io/v2/customers/:id'
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt title="Try it — delete customer" method="DELETE" url="https://test-api.kashier.io/v2/customers/:id" sendApiKey="false" />

### Headers [#headers-4]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

Full parameter and response reference → [Delete a customer](/docs/api-reference/customers/deleteCustomer).

## Bulk import [#bulk-import]

The process for importing customers from an Excel sheet requires two sequential API calls.

### Upload Excel file API [#upload-excel-file-api]

- Purpose: Upload and validate the Excel file containing customer data
- Response:
  - If errors are found in the data, they will be returned for correction.
  - If validation passes, the API returns a `correlationId`
- The `correlationId` serves as a reference to your validated data

| Endpoint | Value                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------- |
| TEST URL | [https://test-api.kashier.io/v2/customers/import](https://test-api.kashier.io/v2/customers/import) |
| LIVE URL | [https://api.kashier.io/v2/customers/import](https://api.kashier.io/v2/customers/import)           |
| Method   | POST                                                                                               |

```bash
curl --location --request POST 'https://test-api.kashier.io/v2/customers/import'
      --header 'Authorization: YOUR_TEST_SECRET_KEY'
      --form 'file=@"/home/boody/Downloads/customers.xlsx"'
```

#### Headers [#headers-5]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

Full parameter and response reference → [Upload a customers sheet for review](/docs/api-reference/customers/importCustomers).

### Save customers API [#save-customers-api]

- Purpose: Permanently save the validated customer data to the system
- Required: Include the `correlationId` as a query string parameter
- This API finalizes the import process using the previously validated data

| Endpoint | Value                                                                                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TEST URL | [https://test-api.kashier.io/v2/customers/savecustomers?correlationId=:correlationId](https://test-api.kashier.io/v2/customers/savecustomers?correlationId=:correlationId) |
| LIVE URL | [https://api.kashier.io/v2/customers/savecustomers?correlationId=:correlationId](https://api.kashier.io/v2/customers/savecustomers?correlationId=:correlationId)           |
| Method   | GET                                                                                                                                                                        |

```bash
curl --location 'https://test-api.kashier.io/v2/customers/savecustomers?correlationId={{correlationId}}'
      --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt title="Try it — save imported customers" method="GET" url="https://test-api.kashier.io/v2/customers/savecustomers?correlationId=:correlationId" sendApiKey="false" />

#### Headers [#headers-6]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

Full parameter and response reference → [Save the uploaded customers](/docs/api-reference/customers/saveImportedCustomers).

This two-step approach ensures data integrity by separating validation from the actual import process.

# Flutter SDK (/docs/accept-payments/flutter-sdk)

A complete, code-accurate guide to installing, configuring, and shipping Kashier payments in a Flutter app — Apple Pay, mobile wallets, and cards — from a single API call.

| Field    | Value                                                                                  |
| -------- | -------------------------------------------------------------------------------------- |
| Version  | 0.1.1                                                                                  |
| Audience | Merchant developers integrating Kashier payments into Flutter apps                     |
| Package  | [pub.dev/packages/kashier\_flutter\_sdk](https://pub.dev/packages/kashier_flutter_sdk) |

## SDK overview and prerequisites [#sdk-overview-and-prerequisites]

The Kashier Flutter SDK is a drop-in payment library that lets your Flutter app accept payments from Egyptian customers through Apple Pay, mobile wallets (Vodafone Cash and others), and credit / debit cards (with 3-D Secure and saved cards) — all from a single API call.

The SDK ships its own pre-built payment sheet UI. You hand it a session ID from your backend, and it picks the right method, renders the right screens, handles 3DS WebViews, polls for wallet reconciliation, and calls back with a typed result.

### What you can do [#what-you-can-do]

- Accept Apple Pay payments on iOS using your own Apple Pay Merchant ID (per-merchant — see the Apple Pay section).
- Accept mobile wallet payments (Vodafone Cash and other R2P-compatible Egyptian wallets) with built-in polling.
- Accept card payments (new card, saved card, 3-D Secure) without ever touching raw card data — the SDK handles tokenization and the 3DS WebView.
- Switch between test and live environments at initialization time.
- Render the SDK UI in Arabic or English, switchable at runtime.

### Supported platforms [#supported-platforms]

| Requirement           | Minimum                                        |
| --------------------- | ---------------------------------------------- |
| Flutter               | 3.22.0                                         |
| Dart                  | 3.4.0                                          |
| iOS deployment target | 14.0                                           |
| Android               | inherits Flutter default minSdk (typically 21) |
| Apple device          | iPhone with Face ID or Touch ID for Apple Pay  |
| Account               | Active Kashier merchant account                |

### Method and platform matrix [#method-and-platform-matrix]

| Payment method                   | iOS | Android                  |
| -------------------------------- | --- | ------------------------ |
| Apple Pay                        | Yes | No (degrades gracefully) |
| Mobile wallet (Vodafone Cash, …) | Yes | Yes                      |
| Card (new)                       | Yes | Yes                      |
| Card (saved)                     | Yes | Yes                      |
| 3-D Secure                       | Yes | Yes                      |

The SDK's native layer is iOS-only (Swift + PassKit for Apple Pay). Wallet and card flows are pure Dart (HTTP + WebView) and run on both platforms.

### Architecture at a glance [#architecture-at-a-glance]

```text
┌────────────────────────────────────────────────────────┐
│  Your Flutter App                                       │
│  └── KashierPaymentProvider  ◀─ wraps MaterialApp      │
│       └── MaterialApp / Router                          │
└────────────────────────────────────────────────────────┘
                       │
                       ▼  KashierSDK.startPayment(sessionId, …)
┌────────────────────────────────────────────────────────┐
│  Kashier SDK (Dart)                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Apple Pay    │  │ Wallet       │  │ Card + 3DS   │   │
│  │ Handler      │  │ Handler      │  │ Handler      │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│         │                                               │
│         ▼ MethodChannel                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │ KashierBridge (iOS only) → PassKit (Apple Pay)   │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
                       │
                       ▼  HTTPS
┌────────────────────────────────────────────────────────┐
│  Kashier API + FEP (test or live)                       │
└────────────────────────────────────────────────────────┘
```

- Apple Pay crosses the native bridge three times (DOWN: present sheet with merchant ID, UP: encrypted token, DOWN: finalize sheet).
- Wallet and card flows are pure Dart with HTTP + WebView — no native bridge needed.

### Prerequisites [#prerequisites]

1. An active Kashier merchant account.
2. Your Kashier API credentials (available in your Kashier Dashboard).
3. A backend server capable of creating payment sessions on Kashier's API.
4. For Apple Pay only: your own Apple Pay Merchant ID and a payment processing certificate.

### What is a session ID? [#what-is-a-session-id]

A session ID is a unique identifier created by your backend that represents a single payment transaction. Your backend calls Kashier's [Payment Sessions API](/docs/accept-payments/payment-sessions) with the amount, currency, allowed methods, and customer details, and Kashier returns a session ID.

Your Flutter app then passes only that session ID to the SDK — no API key, no Kashier merchant ID, no card data ever lives in the mobile binary.

```text
Your Backend ──POST /sessions──▶ Kashier API
                                      │
              session_id ◀────────────┘
                  │
                  ▼
            Your Flutter app
                  │
                  ▼ KashierSDK.startPayment(sessionId)
            Kashier SDK
```

Backend integration is out of scope for this guide. See the [Payment Sessions API documentation](/docs/accept-payments/payment-sessions) for backend details.

## Installation and setup [#installation-and-setup]

### Add the dependency [#add-the-dependency]

Add the SDK from [pub.dev](https://pub.dev/packages/kashier_flutter_sdk) to your `pubspec.yaml`:

```yaml
dependencies:
  kashier_flutter_sdk: ^0.1.1
```

Then install:

```bash
flutter pub get
```

The SDK pulls in these transitive dependencies (no action needed — listed for transparency):

| Package                     | Version | Used for                  |
| --------------------------- | ------- | ------------------------- |
| http                        | ^1.2.0  | Kashier API / FEP calls   |
| webview\_flutter            | ^4.0.0  | 3DS challenge container   |
| flutter\_inappwebview       | ^6.0.0  | 3DS WebView               |
| connectivity\_plus          | ^7.1.1  | Pre-flight offline checks |
| flutter\_svg                | ^2.0.10 | Sheet iconography         |
| plugin\_platform\_interface | ^2.0.2  | Platform channel contract |
| meta                        | ^1.16.0 | `@internal` annotations   |

### iOS setup [#ios-setup]

Open `ios/Podfile` and ensure the platform is at least iOS 14.0:

```ruby
platform :ios, '14.0'
```

Install the iOS pods:

```bash
cd ios && pod install
```

Apple Pay requires per-merchant configuration (your own Apple Merchant ID, an Xcode entitlement, and a payment processing certificate). Follow the runbook in the Apple Pay section before enabling it.

### Android setup [#android-setup]

The SDK requires only the standard INTERNET permission, which is already part of the default Flutter `AndroidManifest.xml`. No extra setup is needed.

Apple Pay is iOS-only. The SDK has no native Android code — wallet and card flows are pure Dart. On Android, `KashierSDK.isApplePayAvailable()` returns false and the unified payment sheet automatically hides the Apple Pay option.

### Wrap your app with KashierPaymentProvider [#wrap-your-app-with-kashierpaymentprovider]

The SDK renders its payment sheet on its own overlay, outside your app's Navigator. To enable that overlay, wrap your `MaterialApp` (or `CupertinoApp` / `MaterialApp.router`) with `KashierPaymentProvider`:

```dart
import 'package:flutter/material.dart';
import 'package:kashier_flutter_sdk/kashier_flutter_sdk.dart';

void main() {
  runApp(
    KashierPaymentProvider(
      child: MaterialApp(
        home: HomeScreen(),
      ),
    ),
  );
}
```

This works with any navigation solution: Navigator 2.0, GoRouter, AutoRoute, nested navigators, etc.

Why this is required: because the provider holds the overlay, you can call `KashierSDK.startPayment(...)` from anywhere — no BuildContext required. The SDK manages its own UI lifecycle and never pushes onto your routes.

### Initialize the SDK [#initialize-the-sdk]

Call `KashierSDK.initialize()` once before starting any payment — typically at app startup or in the `initState` of the screen that triggers payment:

```dart
KashierSDK.initialize(
  mode: KashierMode.test,                       // or KashierMode.live
  language: KashierLanguage.en,                 // or KashierLanguage.ar
  appleMerchantId: 'merchant.com.yourcompany.app', // iOS Apple Pay only
);
```

| Parameter       | Type            | Required | Default | Description                                                                                                                                                      |
| --------------- | --------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mode            | KashierMode     | yes      | —       | test (sandbox) or live (production)                                                                                                                              |
| language        | KashierLanguage | no       | en      | UI language for the payment sheet                                                                                                                                |
| appleMerchantId | String?         | no       | null    | Your own Apple Pay Merchant ID. Required only to enable Apple Pay; must match the Merchant ID in your Xcode entitlement. When omitted, Apple Pay is not offered. |

Switching language at runtime: call `initialize()` again with the new `KashierLanguage`. There is no separate setter — re-initialization is the supported pattern. It disposes the previous API client and re-registers payment handlers.

## Quick start [#quick-start]

End-to-end integration in under 60 lines:

```dart
import 'package:flutter/material.dart';
import 'package:kashier_flutter_sdk/kashier_flutter_sdk.dart';

void main() {
  runApp(
    KashierPaymentProvider(
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: CheckoutScreen(),
    );
  }
}

class CheckoutScreen extends StatefulWidget {
  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  @override
  void initState() {
    super.initState();
    KashierSDK.initialize(
      mode: KashierMode.test,
      language: KashierLanguage.en,
      appleMerchantId: 'merchant.com.yourcompany.app', // omit if not using Apple Pay
    );
  }

  void _pay() {
    KashierSDK.startPayment(
      sessionId: 'sess_abc123', // from your backend
      onSuccess: (KashierPaymentResult result) {
        print('Paid: ${result.transactionId}');
      },
      onPending: (KashierPaymentPending pending) {
        print('Unconfirmed — reconcile server-side: ${pending.orderId}');
      },
      onFailure: (KashierPaymentError error) {
        if (error.code == KashierErrorCode.userCancelled) return;
        print('Failed: ${error.message}');
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ElevatedButton(
          onPressed: _pay,
          child: const Text('Pay'),
        ),
      ),
    );
  }
}
```

That's the entire integration. The SDK reads the session, renders the method-selection sheet (Apple Pay, Wallet, Card — whichever the session and device support), runs the chosen flow, and fires exactly one callback when done.

<img alt="Unified payment method selection sheet" src="__img0" />

A complete runnable sample lives in `example/lib/main.dart`.

## Apple Pay integration guide [#apple-pay-integration-guide]

Apple Pay is iOS-only. Unlike wallet and card, it requires one-time per-merchant setup: you bring your own Apple Pay Merchant ID and pass it to `initialize()`. The unified payment sheet is the recommended path because it handles availability, fallback, and method selection automatically. Use the standalone Apple Pay button only if you want to launch Apple Pay directly without showing a method picker.

### The per-merchant model [#the-per-merchant-model]

Each merchant uses their own Apple Pay Merchant ID — there is no shared/bundled Kashier identifier. The ID you register with Apple is:

1. Passed to the SDK via `KashierSDK.initialize(appleMerchantId: …)`.
2. Carried DOWN to native PassKit and set as `PKPaymentRequest.merchantIdentifier`.
3. Backed by your own Apple Pay Payment Processing Certificate so Kashier can decrypt the resulting token for your account.

If `appleMerchantId` is null or empty, the SDK cannot build a valid Apple Pay request — `isApplePayAvailable()` returns false and Apple Pay is hidden from the sheet.

### Enable and configure runbook [#enable-and-configure-runbook]

Complete these steps once per merchant app.

1. Register an Apple Pay Merchant ID. Apple Developer portal → Certificates, Identifiers & Profiles → Identifiers → Merchant IDs → +. Use a reverse-DNS identifier, e.g. `merchant.com.yourcompany.app`.

2. Create a Payment Processing Certificate in your own Apple Developer account (Merchant IDs → your Merchant ID → Apple Pay Payment Processing Certificate), from a CSR with an EC P-256 private key. Then, in the Kashier dashboard under **Settings > Device Payment Configuration > Apple Pay**, turn on **Use my own certificates**, enter your Merchant ID and upload the certificate with its private key — see [Upload your certificates to Kashier](/docs/accept-payments/apple-pay#upload-your-certificates-to-kashier). Native apps need only the processing certificate; the Merchant Identity Certificate and domain verification are not needed for apps.

3. Add the Apple Pay capability in Xcode. Open `ios/Runner.xcworkspace` → select the Runner target → Signing & Capabilities → + Capability → Apple Pay, then check your Merchant ID. This writes the entitlement into `ios/Runner/Runner.entitlements`:

```xml
<key>com.apple.developer.in-app-payments</key>
<array>
  <string>merchant.com.yourcompany.app</string>
</array>
```

4. Pass the Merchant ID to the SDK. The value here must match the entitlement exactly:

```dart
KashierSDK.initialize(
  mode: KashierMode.live,
  appleMerchantId: 'merchant.com.yourcompany.app',
);
```

5. Verify availability on a physical device with a card in Apple Wallet:

```dart
final ok = await KashierSDK.isApplePayAvailable(); // expect true
```

If `isApplePayAvailable()` returns false after setup, check (in order): you passed `appleMerchantId`; it matches the entitlement; you're on a real device (not Simulator); a supported card is in Apple Wallet.

### Check availability [#check-availability]

```dart
final available = await KashierSDK.isApplePayAvailable();
if (available) {
  // Render Apple Pay button or include in payment sheet
} else {
  // Fall back to other methods
}
```

`isApplePayAvailable()` returns false when:

- `appleMerchantId` was not supplied to `initialize()` (or is empty).
- Running on Android or any non-iOS platform.
- Running on iOS Simulator (no real Wallet).
- The user has not added any supported card to Apple Wallet.
- The device hardware does not support Apple Pay.

### Display the Apple Pay button (optional, direct-launch) [#display-the-apple-pay-button-optional-direct-launch]

The SDK ships a styled `KashierApplePayButton` widget for merchants who want to skip the method-selection sheet:

```dart
KashierApplePayButton(
  onPressed: () {
    KashierSDK.startPayment(
      sessionId: 'sess_abc123',
      onSuccess: (result) { /* … */ },
      onFailure: (error) { /* … */ },
    );
  },
  height: 50,        // optional, default 50
  cornerRadius: 10,  // optional, default 10
)
```

<img alt="Apple Pay button in the sheet" src="__img1" />

The button label flips automatically between English (Pay with Pay) and Arabic (ادفع مع Pay). The Apple logo glyph (U+F8FF) renders correctly on Apple devices.

The button is a Flutter widget (not the native PKPaymentButton) so it renders identically across iOS versions and respects your theme. Tapping it does not start a payment automatically — wire that in `onPressed`, typically by calling `KashierSDK.startPayment(...)`.

### End-to-end Apple Pay flow [#end-to-end-apple-pay-flow]

The validation handshake has been removed — the flow now crosses the native bridge three times:

| #   | Direction    | Bridge call                  | Payload                                                                             |
| --- | ------------ | ---------------------------- | ----------------------------------------------------------------------------------- |
| 1   | Dart → Swift | presentApplePay              | amount, currency, storeName, supportedNetworks, merchantId                          |
| 2   | Swift → Dart | token callback               | `{ paymentData, paymentMethod{displayName, network, type}, transactionIdentifier }` |
| 3   | Dart → Swift | completePaymentAuthorization | `{ success: bool }` (finalizes the sheet)                                           |

Native PassKit builds the PKPaymentRequest with `merchantIdentifier = merchantId`, `countryCode = "EG"`, `merchantCapabilities = .capability3DS`, and the resolved networks (visa, mastercard, meeza, amex).

### Callbacks [#callbacks]

| Event                                              | Callback fired                    | Notes                                                                      |
| -------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------- |
| FEP returns 200                                    | `onSuccess(KashierPaymentResult)` | `result.card.wallet == "APPLE_PAY"`                                        |
| User taps Cancel in Apple Pay sheet                | onFailure                         | code == userCancelled. Don't show error UI — the user knows they cancelled |
| Token processing failure                           | onFailure                         | tokenProcessingFailed — FEP could not process the token                    |
| Misconfiguration / Simulator / missing merchant ID | onFailure                         | applePayConfigError or applePayNotAvailable                                |

Apple Pay never fires `onPending`.

### Platform fallback [#platform-fallback]

On Android (or any non-iOS platform), `KashierApplePayButton` still renders but `onPressed` will surface applePayNotAvailable from `startPayment`. Use `isApplePayAvailable()` to gate the button, or rely on the unified payment sheet which hides Apple Pay automatically on unsupported platforms.

## Unified payment sheet [#unified-payment-sheet]

The recommended integration path. One call, every method, automatic device gating.

```dart
KashierSDK.startPayment(
  sessionId: 'sess_abc123',
  onSuccess: (result) { /* … */ },
  onFailure: (error) { /* … */ },
  onPending: (pending) { /* … */ },  // terminal, for card + wallet flows
);
```

The SDK:

1. Fetches session details from Kashier (`GET /sessions/{id}`).
2. Computes which methods to show by intersecting registered methods, session-allowed methods, and device capability.
3. Renders the method-selection sheet on its own overlay.
4. Runs the chosen flow (Apple Pay / Wallet / Card) end-to-end.
5. Calls one of `onSuccess`, `onFailure`, or `onPending`. For both card and wallet, `onPending` is terminal.

### How method visibility is decided [#how-method-visibility-is-decided]

A method appears in the sheet only if all three are true:

| Check                  | Source                             | Notes                                                       |
| ---------------------- | ---------------------------------- | ----------------------------------------------------------- |
| Registered in SDK      | `KashierSDK._registerHandler(...)` | applePay, wallet, card all registered in v1                 |
| Allowed by the session | `session.allowedMethods`           | Empty list = all methods allowed                            |
| Available on device    | `isAvailable()`                    | e.g., Apple Pay → merchant ID set + PassKit + cards present |

Special case: Apple Pay is unlocked when `allowedMethods` contains either "applePay" or "card" — Apple Pay is treated as a card method on the backend.

### Session knobs that affect the sheet [#session-knobs-that-affect-the-sheet]

Set these on your backend when creating the session (see [Payment Sessions API](/docs/accept-payments/payment-sessions)):

| Field             | Type                   | Effect                                                                                                |
| ----------------- | ---------------------- | ----------------------------------------------------------------------------------------------------- |
| allowedMethods    | comma-separated string | Which methods appear: "APPLEPAY,WALLET,CARD". Omit or send empty to allow all.                        |
| supportedNetworks | list                   | Card networks for Apple Pay (visa, mastercard, meeza). Defaults to all three.                         |
| enable3DS         | bool                   | Whether card payments require 3-D Secure                                                              |
| saveCard          | string                 | "optional" (checkbox shown), "forced" (always saves), "hidden" (no save UI), or omit (same as hidden) |
| retrieveSavedCard | bool                   | Whether to fetch the customer's saved cards into the picker                                           |
| brandColor        | hex string             | Accent color for the payment sheet (see below)                                                        |
| customer          | object                 | Customer info displayed and posted with the card payment                                              |

`brandColor` formats accepted: 6-digit RRGGBB or 8-digit AARRGGBB, with or without a leading # (e.g., "#FF5733", "FF5733", "#CCFF5733"). A 6-digit value is treated as fully opaque. Null, empty, or unparseable values fall back to the Kashier primary color #001F5F.

### Localization [#localization]

Sheet headers, button labels, success / failure copy, error messages, and pending copy all flip to Arabic when the SDK is initialized with `KashierLanguage.ar`. Supported languages: en, ar.

### Sheet lifecycle [#sheet-lifecycle]

- The sheet appears above your existing UI on the `KashierPaymentProvider` overlay.
- Only one sheet can be visible at a time.
- The sheet dismisses itself when the flow completes (success, failure, or user dismissal).
- For wallet payments, the sheet remains visible while polling.

## Wallet payment integration guide [#wallet-payment-integration-guide]

Mobile-wallet payments (Vodafone Cash and other Egyptian R2P-compatible wallets) are an out-of-band flow: your customer enters their phone number in the SDK, then completes the payment in their wallet's own app. The SDK polls Kashier for reconciliation and fires `onSuccess` or `onFailure` when the wallet confirms. If reconcile polling runs the full 5 minutes without a terminal result, the SDK shows an "I have paid" button; tapping it fires the terminal `onPending` callback.

<img alt="Wallet phone-number entry" src="__img2" />

### Wallet flow [#wallet-flow]

```text
1. User picks "Wallet" in the unified sheet.
2. Sheet shows phone-number input.
3. SDK calls INITIATE_R2P (POST /v3/orders, apiOperation=INITIATE_R2P) — no callback fires yet.
4. User opens their wallet app and approves the charge.
5. SDK polls reconcile on a fixed schedule capped at 5 minutes total:
     - Phase 1: 12 attempts, 10s apart (120s).
     - Phase 2: increasing intervals (30s, 45s, 60s, …) until the 5-min cap.
6. Outcome:
     a. Confirmed → onSuccess(KashierPaymentResult)
     b. Declined → onFailure(KashierPaymentError)
     c. Still pending at the 5-min cap → SDK shows an "I have paid" button.
        Customer taps it → terminal onPending(KashierPaymentPending) fires
        (if implemented) and the sheet closes. Cancel → onFailure(userCancelled).
```

<img alt="Wallet waiting sheet with I have paid" src="__img3" />

Polling schedule, precisely: Phase 1 is 12 fixed 10-second intervals (120s). Phase 2 intervals are 30s, 45s, 60s, then 90s/120s/180s — but the SDK never dispatches a request that would cross the 300-second (5-minute) hard cap, so only the 30s/45s/60s Phase-2 attempts are reachable in practice. The cap is 5 minutes total, not 10.

### Wiring onPending [#wiring-onpending]

`onPending` is optional and terminal for wallet: it fires at most once, only when reconcile polling exhausts after 5 minutes with the payment still pending and the customer taps "I have paid". It does not fire at initiation, and no `onSuccess`/`onFailure` follows it.

```dart
KashierSDK.startPayment(
  sessionId: 'sess_abc123',
  onSuccess: (KashierPaymentResult result) {
    // Wallet confirmed the payment
    showSuccessScreen(result);
  },
  onPending: (KashierPaymentPending pending) {
    // Polling exhausted while still pending and the customer asserted payment.
    // Confirm final settlement server-side using the orderId.
    print('Pending order: ${pending.orderId}');  // authoritative reference
    print('Status: ${pending.message}');         // localized
  },
  onFailure: (KashierPaymentError error) {
    showErrorScreen(error);
  },
);
```

Card vs wallet pending: the same `onPending` callback has unified semantics across card and wallet — it is terminal in both, firing after reconcile polling exhausts while the payment is still settling. For both, `orderId` is authoritative, `transactionId` may be empty, and you should confirm final settlement via webhook/backend.

### What KashierPaymentPending contains [#what-kashierpaymentpending-contains]

| Field         | Type    | Description                                           |
| ------------- | ------- | ----------------------------------------------------- |
| orderId       | String  | Kashier order ID (authoritative reference)            |
| transactionId | String  | Transaction ID (e.g., "TX-35524544764"; may be empty) |
| message       | String  | Status message (localized to SDK language)            |
| messageEn     | String? | English status message                                |
| messageAr     | String? | Arabic status message                                 |

### Wallet provider hint (KashierWalletProvider) [#wallet-provider-hint-kashierwalletprovider]

```dart
enum KashierWalletProvider {
  vodafoneCash,  // displayNameEn: "Vodafone Cash" | displayNameAr: "فودافون كاش"
  other,         // displayNameEn: "Mobile Wallet" | displayNameAr: "محفظة إلكترونية"
}
```

The SDK uses this enum internally to label wallet methods in the sheet. You do not need to instantiate it.

### Polling cap and webhook fallback [#polling-cap-and-webhook-fallback]

The SDK polls for up to 5 minutes total. If the wallet user does not complete in time and the payment is still pending at the cap, the SDK shows the "I have paid" button (→ terminal `onPending`); an outright timeout surfaces `onFailure(paymentTimeout)`. The session itself may still settle later — your backend should rely on the server-to-server webhook (`session.serverWebhook`) as the source of truth, not solely on the SDK callback.

## Card payment integration guide [#card-payment-integration-guide]

Card payments handle four sub-flows from a single entry point: new card, saved card, 3-D Secure, and (optionally) save-card-after-payment. The unified sheet renders the card form, runs validation, opens the 3DS WebView when the issuer requires it, reconciles, and reports back via `onSuccess` / `onFailure` / `onPending`.

<img alt="New-card form with save-card checkbox" src="__img4" />

### New-card flow [#new-card-flow]

1. User picks "Card" in the sheet → card form appears.
2. SDK validates card number, expiry, CVV, holder name inline before submitting.
3. SDK posts to Kashier card endpoint, receives the card response.
4. If 3DS is required → SDK opens an in-sheet WebView at the issuer's redirect URL.
5. After the OTP is submitted, the SDK reconciles on the post-OTP schedule.
6. SDK fires `onSuccess`, `onFailure`, or terminal `onPending` (if reconcile exhausts while still settling).

### Saved-card flow [#saved-card-flow]

When `session.retrieveSavedCard == true`, the sheet shows the customer's previously-saved cards as selectable chips:

1. User taps a saved card → CVV-only prompt appears (CVV is never stored).
2. SDK posts the saved card token + CVV → same 3DS / reconcile flow as new card.
3. SDK fires `onSuccess` / `onFailure` / `onPending`.

<img alt="Saved cards accordion with inline CVV" src="__img5" />

### Save-card-after-payment [#save-card-after-payment]

Controlled by `session.saveCard`:

| Value      | Behavior                                            |
| ---------- | --------------------------------------------------- |
| "optional" | Save-card checkbox shown; user opts in              |
| "forced"   | Card is always saved (checkbox shown but locked on) |
| "hidden"   | No save UI                                          |
| null       | Same as "hidden" — no save behavior, no UI          |

The customer's saved cards live on Kashier's side, keyed by the customer reference in the session. They are never persisted in the SDK or your app.

### 3-D Secure (3DS) and reconciliation [#3-d-secure-3ds-and-reconciliation]

When the issuer mandates 3DS, the SDK opens the issuer's challenge URL in an embedded flutter\_inappwebview view.

<img alt="3DS challenge WebView" src="__img6" />

After the user submits the OTP, the WebView closes when Kashier's redirect URL is hit and the SDK reconciles on the post-OTP schedule:

- Post-OTP reconcile: 8 attempts over \~60s — four 5-second intervals, then four 10-second intervals.
- If a terminal result arrives → `onSuccess` / `onFailure`.
- If the schedule exhausts while still settling → terminal `onPending(KashierPaymentPending)`.

If the user cancels the 3DS challenge (taps the close button), the SDK does not fail immediately. It switches to a "verifying" view and runs a cancel safety-net reconcile — 5 attempts at 0s, 5s, 10s, 15s, 30s (\~60s) — in case the payment actually went through. Terminal result found → `onSuccess` / `onFailure`; nothing found after exhaustion → `onFailure(userCancelled)`.

If 3DS is disabled on the session (`session.enable3DS == false`) or not required by the issuer, the SDK skips the WebView entirely.

### What can fail [#what-can-fail]

| Error code           | Cause                                                          |
| -------------------- | -------------------------------------------------------------- |
| paymentDeclined      | Issuer or processor declined the card                          |
| authorizationFailed  | 403 from Kashier (invalid hash, bad merchant config)           |
| authenticationFailed | 3DS challenge failed (e.g., wrong OTP)                         |
| invalidCardDetails   | Card field validation failed before submit                     |
| cardRetrievalFailed  | Could not load saved cards (sheet falls back to new-card form) |
| cardDeletionFailed   | Could not delete a saved card from the picker                  |
| networkError         | No internet at the time of the call                            |

All map to `KashierPaymentError` with a localized message and optional issuer responseCode.

### PCI scope [#pci-scope]

Card data is collected by the SDK's own form, tokenized against Kashier FEP, and never persisted in your app. Your app stays out of PCI scope as long as you use the SDK's card form — do not build your own card form against the same endpoints.

## Complete API reference [#complete-api-reference]

Everything below is exported from a single import:

```dart
import 'package:kashier_flutter_sdk/kashier_flutter_sdk.dart';
```

Public surface: `KashierSDK`, `KashierPaymentProvider`, `KashierApplePayButton`, `KashierMode`, `KashierLanguage`, `KashierWalletProvider`, `KashierErrorCode`, `KashierPaymentResult`, `KashierCardInfo`, `KashierPaymentError`, `KashierPaymentPending`.

### KashierSDK (static API) [#kashiersdk-static-api]

The main entry point. All members are static.

#### initialize [#initialize]

```dart
static void initialize({
  required KashierMode mode,
  KashierLanguage language = KashierLanguage.en,
  String? appleMerchantId,
})
```

Initializes the SDK. Must be called once before any other method. Re-call to switch language or mode at runtime; this disposes the previous internal API client and re-registers payment handlers. Returns void.

#### startPayment [#startpayment]

```dart
static Future<void> startPayment({
  required String sessionId,
  required void Function(KashierPaymentResult result) onSuccess,
  required void Function(KashierPaymentError error) onFailure,
  void Function(KashierPaymentPending pending)? onPending,
})
```

Starts a payment flow for the given session. Fetches the session, picks available methods, shows the unified sheet, and reports the outcome via callbacks. Returns `Future<void>` (resolves when the SDK has handed off to the sheet — not when payment completes). If `initialize()` was not called, fires `onFailure(unknownError)`.

#### isApplePayAvailable [#isapplepayavailable]

```dart
static Future<bool> isApplePayAvailable()
```

Checks whether Apple Pay is available on the current device (merchant ID set + iOS + PassKit + at least one card). Returns false on non-iOS platforms, if `appleMerchantId` was not supplied, or if the SDK is not yet initialized.

#### Static getters [#static-getters]

| Getter        | Type            | Description                                 |
| ------------- | --------------- | ------------------------------------------- |
| isInitialized | bool            | true after `initialize()` has been called   |
| mode          | KashierMode?    | Current mode, or null before initialization |
| language      | KashierLanguage | Current display language (defaults to en)   |

### Enums [#enums]

`KashierMode` — test and live environments:

| Value | baseUrl                                                    | fepBaseUrl                                                 |
| ----- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| test  | [https://test-api.kashier.io](https://test-api.kashier.io) | [https://test-fep.kashier.io](https://test-fep.kashier.io) |
| live  | [https://api.kashier.io](https://api.kashier.io)           | [https://fep.kashier.io](https://fep.kashier.io)           |

`KashierLanguage` — en (`Locale('en')`) and ar (`Locale('ar')`). `KashierWalletProvider` — vodafoneCash ("Vodafone Cash" / "فودافون كاش") and other ("Mobile Wallet" / "محفظة إلكترونية").

### Models [#models]

`KashierPaymentResult` — returned by `onSuccess` on a terminal successful payment:

<Accordions type="multiple">
  <Accordion title="Payment result fields">
    | Field               | Type             | Description                                  |
    | ------------------- | ---------------- | -------------------------------------------- |
    | sessionId           | String           | The session this result belongs to           |
    | status              | String           | Payment status ("SUCCESS", "CAPTURED", etc.) |
    | orderId             | String?          | Kashier order ID (systemOrderId)             |
    | orderReference      | String?          | Merchant order reference                     |
    | transactionId       | String?          | Transaction ID (e.g., "TX-35524544753")      |
    | authorizationNumber | String?          | Issuer authorization number                  |
    | amount              | num?             | Charged amount                               |
    | currency            | String?          | ISO 4217 currency code (e.g., "EGP")         |
    | card                | KashierCardInfo? | Card / wallet details used                   |
    | message             | String?          | Localized success message (English)          |
    | messageAr           | String?          | Localized success message (Arabic)           |
    | transactionData     | Map?             | Raw API response body for advanced use       |
  </Accordion>
</Accordions>

`KashierCardInfo` — accessed via `KashierPaymentResult.card`: brand (e.g. "Visa"), maskedNumber (e.g. "541674\*\*\*\*\*\*7777"), wallet (e.g. "APPLE\_PAY").

`KashierPaymentError` — returned by `onFailure`: code (KashierErrorCode), message (English), messageAr, responseCode (issuer code e.g. "57"), details. Construct via `KashierPaymentError.fromCode(KashierErrorCode.networkError)`.

## Error handling guide [#error-handling-guide]

All failures (including user cancellation) flow through `onFailure(KashierPaymentError)`. Inspect `error.code` to decide how to respond.

### Full error code table [#full-error-code-table]

<Accordions type="multiple">
  <Accordion title="Error codes">
    | Code                     | Meaning                                        | When it fires                                     | Recoverable? | Recommended UX                              |
    | ------------------------ | ---------------------------------------------- | ------------------------------------------------- | ------------ | ------------------------------------------- |
    | sessionExpired           | Session is no longer valid                     | Session timed out before completion               | No           | Mint a new session on the backend, restart  |
    | sessionNotFound          | Session ID not recognised                      | Wrong / mistyped ID, or wrong env                 | No           | Verify the ID and that mode matches backend |
    | applePayNotAvailable     | Apple Pay not available on device              | Non-iOS, no merchant ID, no cards, Simulator      | No           | Hide Apple Pay; offer wallet / card         |
    | userCancelled            | User dismissed the payment sheet               | User taps Cancel                                  | Yes          | Show no error UI — silently return          |
    | validationFailed         | Apple Pay validation failed                    | Pre-flight validation rejected                    | No           | Contact Kashier support; backend issue      |
    | applePayConfigError      | Apple Pay misconfiguration                     | Wrong/absent merchant ID, missing cert, Simulator | No           | Re-check the runbook; contact support       |
    | merchantValidationFailed | Apple Pay validation failed during the session | Mid-flow validation issue                         | No           | Contact Kashier support                     |
    | tokenProcessingFailed    | FEP could not process the Apple Pay token      | FEP rejected the encrypted token                  | No           | Retry; if persistent, contact support       |
    | paymentDeclined          | Issuer / processor declined the card           | Insufficient funds, fraud rules, etc.             | Yes          | Offer to retry with a different card        |
    | authorizationFailed      | HTTP 403 — authentication failed               | Invalid hash, missing credentials                 | No           | Backend config issue; not user-recoverable  |
    | networkError             | No internet connection                         | Pre-flight or mid-flight network drop             | Yes          | Surface "check connection, retry"           |
    | paymentTimeout           | Wallet polling cap reached                     | Wallet not completed within the 5-minute cap      | Yes          | Show retry; webhook may still confirm later |
    | walletInitFailed         | INITIATE\_R2P API call failed                  | Wallet provider unavailable                       | Yes          | Retry, or offer card                        |
    | cardRetrievalFailed      | Could not fetch saved cards                    | Backend or network error                          | Yes          | Sheet falls back to new-card form           |
    | cardDeletionFailed       | Could not delete a saved card                  | Backend or network error                          | No           | Show "try again later"                      |
    | invalidCardDetails       | Card form validation failed                    | Invalid PAN, expiry, CVV, etc.                    | Yes          | Re-render the form with field errors        |
    | authenticationFailed     | 3-D Secure failed                              | Wrong OTP, bank decline                           | Yes          | Retry the card or offer another             |
    | unknownError             | Unclassified (incl. SDK not initialized)       | Any uncaught path                                 | No           | Log error.details; contact support          |
  </Accordion>
</Accordions>

<img alt="Error result sheet" src="__img7" />

### Special-case patterns [#special-case-patterns]

- userCancelled: never show an error toast / dialog. The user knows they cancelled — `if (error.code == KashierErrorCode.userCancelled) return;`
- networkError: the SDK pre-checks connectivity via connectivity\_plus. On a drop, surface a retry button.
- paymentTimeout (wallet only): the polling cap is 5 minutes. The session may still settle — treat the server webhook as the source of truth.
- sessionExpired / sessionNotFound: the user can't recover; your app must mint a new session and restart.

### Localization of error copy [#localization-of-error-copy]

Every error carries message (English) and messageAr (Arabic):

```dart
final isAr = KashierSDK.language == KashierLanguage.ar;
final copy = isAr ? (error.messageAr ?? error.message) : error.message;
```

### Diagnostics [#diagnostics]

When opening a Kashier support ticket about a failure, include `error.code.name`, `error.message`, `error.responseCode`, `error.details`, the session ID and approximate timestamp.

## Callbacks and results [#callbacks-and-results]

`startPayment` resolves to exactly one of three terminal callbacks. Wire all three (`onPending` optional) and confirm settlement server-side for pending.

| Callback  | Type                  | Fires when                                                                                     |
| --------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| onSuccess | KashierPaymentResult  | Payment confirmed (card / wallet / Apple Pay)                                                  |
| onPending | KashierPaymentPending | Card 3DS reconcile exhausted, OR wallet 5-min poll exhausted + "I have paid" tapped. Terminal. |
| onFailure | KashierPaymentError   | Any failure, including userCancelled                                                           |

<img alt="Success result sheet" src="__img8" />

<img alt="Card 3DS pending screen" src="__img9" />

Card pending and wallet pending render on distinct surfaces, but both deliver the same terminal `onPending(KashierPaymentPending)`. Always reconcile final settlement using `pending.orderId` via your webhook/backend.

## Testing guide [#testing-guide]

### Test mode [#test-mode]

```dart
KashierSDK.initialize(mode: KashierMode.test);
```

Test mode endpoints: API [https://test-api.kashier.io](https://test-api.kashier.io), FEP [https://test-fep.kashier.io](https://test-fep.kashier.io). Make sure your backend mints sessions against the matching test API and returns test-mode session IDs. A live session in test mode will fail with sessionNotFound.

### Apple Pay testing [#apple-pay-testing]

Apple Pay testing requires a physical iOS device (not the Simulator), the full setup complete (merchant ID + entitlement + certificate), and an Apple sandbox tester account with at least one test card in Apple Wallet.

1. Complete the runbook and pass `appleMerchantId` to `initialize()`.
2. Create a sandbox tester at [App Store Connect](https://appstoreconnect.apple.com/access/users) → Sandbox Testers.
3. Sign into the sandbox account on the device under Settings → App Store → Sandbox Account.
4. Add a test card to Apple Wallet — see Apple's [Sandbox Testing for Apple Pay](https://developer.apple.com/apple-pay/sandbox-testing/).
5. Run your Flutter app on the device, open the SDK sheet, and complete the flow.

Simulator and a missing/mismatched merchant ID both return applePayNotAvailable. There is no way to test Apple Pay end-to-end on the Simulator.

### Wallet testing [#wallet-testing]

Use `01010101010` for Vodafone Cash and `01001001001` for any other wallet (see [Test data](/docs/get-started/testing#mobile-e-wallet)). The wallet flow is asynchronous: after entering the test number, the SDK polls reconcile and fires `onSuccess` (or a configured failure) within a few seconds in test mode. If you let polling run the full 5 minutes without a terminal result, the SDK shows the "I have paid" button, and tapping it fires the terminal `onPending`.

### Card testing [#card-testing]

Use standard Kashier test PANs to exercise success, decline, and 3DS-required paths.

| Scenario                              | Expected outcome                                     |
| ------------------------------------- | ---------------------------------------------------- |
| Success                               | onSuccess                                            |
| Generic decline                       | onFailure(paymentDeclined)                           |
| 3DS required → success                | 3DS WebView → onSuccess                              |
| 3DS required → wrong OTP              | 3DS WebView → onFailure(authenticationFailed)        |
| 3DS cancelled but charge went through | cancel reconcile → onSuccess                         |
| 3DS cancelled, nothing settled        | cancel reconcile exhausts → onFailure(userCancelled) |
| Reconcile exhausts while settling     | onPending                                            |
| Insufficient funds                    | onFailure(paymentDeclined) with issuer code          |

### Going live [#going-live]

1. Switch to live mode: `KashierSDK.initialize(mode: KashierMode.live, appleMerchantId: '…')`.
2. Verify your backend uses live Kashier API credentials and creates sessions against [https://api.kashier.io](https://api.kashier.io).
3. Confirm your Apple Pay Payment Processing Certificate is provisioned with Kashier.
4. Run a real, low-value smoke transaction through each method you support.
5. Ensure your backend webhook handler treats Kashier as the source of truth — do not rely solely on the mobile SDK callback.
6. Test the failure paths once more in live mode (cancellation, declined card).

## Frequently asked questions [#frequently-asked-questions]

**Do I need my own Apple Pay merchant ID or certificate?**

Yes. Apple Pay is per-merchant: register your own Apple Pay Merchant ID, add it to your Xcode entitlement, and pass it to `KashierSDK.initialize(appleMerchantId: …)`. You also need your own Payment Processing Certificate, uploaded with its private key in the Kashier dashboard under **Settings > Device Payment Configuration > Apple Pay**, so your tokens can be decrypted — see [Upload your certificates to Kashier](/docs/accept-payments/apple-pay#upload-your-certificates-to-kashier).

**Why doesn't startPayment need a BuildContext?**

Because `KashierPaymentProvider` holds a global overlay reference. The SDK pushes its sheet onto that overlay rather than your Navigator, so it works from any layer of your app — including background callbacks, Bloc handlers, services, etc.

**Can I switch language at runtime?**

Yes — call `KashierSDK.initialize(mode: ..., language: KashierLanguage.ar)` again with the new language. This re-creates the internal API client and re-registers payment handlers.

**What happens if the user cancels Apple Pay?**

`onFailure` fires with `KashierErrorCode.userCancelled`. Suppress your error UI for that code — treat it the same as a benign back-tap.

**My wallet payment never fires onSuccess. Why?**

The customer hasn't completed the payment in their wallet app. The SDK polls Kashier for up to 5 minutes; if still pending at the cap it shows "I have paid" (→ terminal `onPending`), and an outright timeout surfaces `onFailure(paymentTimeout)`. The session may still settle later — treat the server webhook as authoritative.

**What happens if the user cancels the 3DS challenge?**

The SDK doesn't fail immediately. It runs a short cancel safety-net reconcile (5 attempts over \~60s) in case the payment actually went through, then fires `onSuccess`/`onFailure` if a result is found, or `onFailure(userCancelled)` if nothing settled.

**How do I customize the sheet's brand color?**

Set `brandColor` on the session when your backend creates it. Accepts 6-digit RRGGBB or 8-digit AARRGGBB, with or without #. Invalid values fall back to Kashier's primary color.

**The Apple Pay button doesn't show on Android. Is that a bug?**

No — Apple Pay is iOS-only. The button still renders on Android but tapping it surfaces applePayNotAvailable. The unified payment sheet hides Apple Pay entirely on Android.

**Where do I get a session ID?**

Your backend creates one by calling Kashier's [Payment Sessions API](/docs/accept-payments/payment-sessions). Backend integration is out of scope for this guide.

**Is the SDK PCI-compliant?**

Card data never touches your app's process. The SDK collects card input in its own form and tokenizes directly against Kashier FEP. Your app stays out of PCI scope as long as you use the SDK's card form.

**Can I show my own custom payment UI instead of the SDK's sheet?**

Not supported in v1. The SDK owns the sheet UI to ensure consistent behavior across methods. If you need a deeply custom flow, contact Kashier support.

**Does the SDK support recurring or stored-credential payments?**

Yes — through the save-card feature. Set `session.saveCard = "optional"` or "forced" and `session.retrieveSavedCard = true` on subsequent sessions for the same customer. The SDK handles tokenization; your backend issues the recurring charge against the saved token.

**Does the SDK work with MaterialApp.router (GoRouter, AutoRoute)?**

Yes. `KashierPaymentProvider` is independent of routing — wrap whichever app widget you use. The SDK overlay sits above the router's navigation stack.

**What happens if the device goes offline mid-payment?**

The SDK pre-checks connectivity (via connectivity\_plus) before each API call and surfaces `KashierErrorCode.networkError` if offline. Mid-flight network drops are caught and reported the same way.

**Can two startPayment calls run at once?**

No — only one sheet can be visible at a time. Call `startPayment` once and wait for one of the callbacks to fire before calling again.

# Accept payments (/docs/accept-payments)

Kashier gives you several ways to accept a payment. Pick the one that matches
how much you want to build:

| You want                                                  | Use                                                                                          | Effort |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------ |
| A checkout page hosted by Kashier, reached by an API call | [Payment sessions](/docs/accept-payments/payment-sessions)                                   | Low    |
| The checkout embedded in your own page (iframe)           | [Embed the checkout](/docs/accept-payments/payment-sessions#step-2-send-the-customer-to-pay) | Low    |
| A payment page you can share by link, with no code at all | [Payment links](/docs/accept-payments/payment-links)                                         | None   |
| Apple Pay directly on your site                           | [Apple Pay](/docs/accept-payments/apple-pay)                                                 | Medium |
| A QR code or request to pay over InstaPay                 | [InstaPay](/docs/accept-payments/instapay)                                                   | Medium |
| Egyptian Meeza cards, submitted as ordinary cards         | [Meeza](/docs/accept-payments/meeza)                                                         | None   |
| Charging customers on a schedule                          | [Recurring payments](/docs/accept-payments/recurring)                                        | Medium |
| Full control over the card form and payment flow          | [Direct API integration](/docs/direct-api)                                                   | High   |

Before building the payment, a couple of supporting tools are worth knowing about:

- [Currency conversion](/docs/accept-payments/currency-conversion) — look up live exchange rates for cross-currency pricing.
- [Product catalog](/docs/accept-payments/products) — build itemized payment links and checkout pages from products instead of a flat amount.

After the payment, you can manage the full lifecycle:

- [Authorize and capture](/docs/accept-payments/authorize-capture) — hold funds first, capture later.
- [Transactions](/docs/accept-payments/transactions) — query payment status and history.
- [Refunds](/docs/accept-payments/refunds) and [void](/docs/accept-payments/void).
- [Settlement](/docs/accept-payments/settlement) and [order reconciliation](/docs/accept-payments/order-reconciliation).
- [Webhooks](/docs/webhooks) — get notified server-to-server about every event.

# InstaPay (/docs/accept-payments/instapay)

Collect a payment over InstaPay, Egypt's instant payment network, by generating a QR code the customer scans or by pushing a request to pay to a payer address you already know.

InstaPay is a first-class payment method: you select it with `paymentMethod.type = "instapay"`. It is a collection rail, not a card rail, so it has no tokenization, no recurring and no authorize/capture. It does support refund, cancel and transaction force closure.

The flow is:

1. You initiate a collection — `GENERATE_QR` for a scan-to-pay QR code, or `INITIATE_R2P` to push a pay request to a payer address.
2. The customer approves the request in their bank or wallet app.
3. Kashier notifies you through the standard server [webhook](/docs/webhooks).

## Initiate a collection [#initiate-a-collection]

An InstaPay collection is a [Direct API](/docs/direct-api) order: you post it to the same `POST /v3/orders` endpoint used for cards and wallets, and pick the collection method with `apiOperation`.

| Endpoint | Value                                                                          |
| -------- | ------------------------------------------------------------------------------ |
| TEST-URL | [https://test-fep.kashier.io/v3/orders](https://test-fep.kashier.io/v3/orders) |
| LIVE-URL | [https://fep.kashier.io/v3/orders](https://fep.kashier.io/v3/orders)           |
| Method   | POST                                                                           |

### Headers [#headers]

| Key          | Description                                                  |
| ------------ | ------------------------------------------------------------ |
| Kashier-Hash | Order hash [generated in hashing](/docs/direct-api/hashing). |
| Content-Type | application/json                                             |

### Operations [#operations]

| Operation      | Collection method                               |
| -------------- | ----------------------------------------------- |
| `GENERATE_QR`  | QR code the customer scans to pay               |
| `INITIATE_R2P` | Request to pay, pushed to a known payer address |

You do not choose the provider. InstaPay is selected with `paymentMethod.type = "instapay"`; which acquirer that resolves to is set up on your account by Kashier, not per request.

### InstaPay fields [#instapay-fields]

The `paymentMethod.instapay` object:

| Field            | Type    | Required               | Description                                                                                                                                                                                                    |
| ---------------- | ------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validity`       | String  | Yes                    | Validity period of the collection request. Required for both `GENERATE_QR` and `INITIATE_R2P` — without it the request fails with `request.paymentMethod?.instapay?.validity is required for IPN generate QR`. |
| `payerAddress`   | String  | Yes for `INITIATE_R2P` | The payer's InstaPay address. Only sent when the operation is `INITIATE_R2P`.                                                                                                                                  |
| `tip`            | Boolean | No                     | Set to `true` to allow a tip on the collection.                                                                                                                                                                |
| `convenienceFee` | Number  | No                     | Convenience fee to add to the collection.                                                                                                                                                                      |
| `refundSource`   | String  | No                     | Carried for refund flows.                                                                                                                                                                                      |

### Request [#request]

```json
{
  "apiOperation": "INITIATE_R2P",
  "interactionSource": "ECOMMERCE",
  "order": {
    "reference": "<your order id>",
    "amount": 100.0,
    "currency": "EGP"
  },
  "paymentMethod": {
    "type": "instapay",
    "instapay": {
      "payerAddress": "payer@instapay",
      "validity": "30"
    }
  },
  "merchantId": "MID-XXXXX-XXX"
}
```

For a QR collection, send `"apiOperation": "GENERATE_QR"` and omit `paymentMethod.instapay.payerAddress`.

## Supported operations [#supported-operations]

| Operation                   | Type         |
| --------------------------- | ------------ |
| `GENERATE_QR`               | Initiate     |
| `INITIATE_R2P`              | Initiate     |
| `REFUND`                    | Post-payment |
| `CANCEL`                    | Post-payment |
| `TRANSACTION_FORCE_CLOSURE` | Post-payment |

Tokenization, recurring and authorize/capture are not available on InstaPay. See [refunds](/docs/accept-payments/refunds) and [void](/docs/accept-payments/void) for the shared post-payment contract.

## Results and response codes [#results-and-response-codes]

A successful InstaPay collection reaches you as `status: SUCCESS` with `transactionResponseCode` `00` ("Approved") — the same approved code as any other payment. Every other code is a `FAILURE` and carries the InstaPay code itself, for example `20903`.

InstaPay uses its own five-digit code space, separate from the card and ISO codes in [payment reason codes](/docs/accept-payments/payment-reason-codes). Match on the exact code.

| Code    | Meaning                                                                          |
| ------- | -------------------------------------------------------------------------------- |
| `00000` | Success                                                                          |
| `20101` | Payer Payment Address is not registered                                          |
| `20102` | Invalid validity period                                                          |
| `20103` | Declined, Merchant Collection Limits Exceeded                                    |
| `20201` | Declined by Consumer                                                             |
| `20202` | Declined, Payment Order Expired                                                  |
| `20203` | Declined, Merchant Collection Limits Exceeded                                    |
| `20204` | Declined by Consumer bank                                                        |
| `20301` | Refund Declined, Applicable Refund amount for this transaction has been exceeded |
| `20302` | Transaction has already been refunded                                            |
| `20303` | Invalid Merchant Reference Number                                                |
| `20304` | Invalid Original Transaction ID                                                  |
| `20305` | Refund Declined, insufficient funds                                              |
| `20306` | Refund Declined, invalid Merchant Access Permission                              |
| `20307` | Refund Declined, Original transaction exceeded refund duration                   |
| `20308` | Refund In Progress                                                               |
| `20309` | Refund Declined                                                                  |
| `20310` | Refund not concluded, please inquire the refund                                  |
| `20401` | Invalid Merchant Reference Number                                                |
| `20402` | Cannot be cancelled, cancellation window has expired. Kindly use refund option   |
| `20501` | Invalid Merchant Reference Number                                                |
| `20502` | Declined by Consumer                                                             |
| `20503` | Declined, Payment Order Expired                                                  |
| `20504` | Declined, Merchant Collection Limits Exceeded                                    |
| `20901` | Invalid JSON structure or field format                                           |
| `20902` | Invalid version number                                                           |
| `20903` | Invalid request signature                                                        |
| `20904` | Your request cannot be processed please try again later                          |
| `20905` | Merchant is suspended or blocked, please refer back to your bank                 |
| `20906` | Invalid Merchant ID                                                              |
| `20907` | Invalid Acquirer Merchant ID                                                     |
| `20908` | Invalid Acquirer Bank ID                                                         |
| `20909` | Duplicated Merchant Reference Number                                             |
| `20999` | Service currently not available, Please try again later                          |

<Callout title="Note">
  Only the `2xxxx` codes above are mapped. A code outside this table falls back to the general message set and can arrive as `k_default`, so treat an unknown InstaPay code as a plain failure rather than looking it up.
</Callout>

## Webhooks [#webhooks]

InstaPay has no webhook event of its own. Kashier notifies you with the standard server webhook, where `event` is the operation — `pay`, `refund` and so on. See [webhooks](/docs/webhooks).

# iOS SDK license (/docs/accept-payments/ios-sdk-license)

**Copyright © Kashier. All rights reserved.**

This Kashier iOS SDK License ("License") governs the use of the Kashier Native iOS SDK ("SDK") provided by Kashier.

<Callout title="Note">
  This page reproduces the license that ships as the `LICENSE` file in the SDK repository. It applies to the [Kashier iOS SDK](/docs/accept-payments/ios-sdk).
</Callout>

## 1. License grant [#1-license-grant]

Subject to this License and any applicable Kashier agreements or terms of service, Kashier grants you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to download, integrate, and use the SDK solely for the purpose of enabling Kashier payment services within applications that you develop or operate.

Kashier provides the SDK in source code form. You may view and compile the source code solely to integrate the SDK into your applications.

You may distribute your application containing or depending on the SDK as necessary to provide Kashier payment functionality to your users.

## 2. Ownership [#2-ownership]

The SDK is proprietary software owned by Kashier and/or its licensors.

All rights, title, and interest in and to the SDK, including all intellectual property rights, remain with Kashier and its licensors.

No ownership rights are transferred to you under this License.

## 3. Restrictions [#3-restrictions]

Except where expressly permitted by applicable law or separately authorized in writing by Kashier, you may not:

- sell, license, sublicense, rent, lease, or distribute the SDK as a standalone product;
- modify or create derivative works of the SDK;
- remove or alter proprietary notices, trademarks, copyright notices, or other notices contained in the SDK;
- use the SDK to provide or facilitate payment services other than through Kashier;
- use the SDK in violation of applicable laws, regulations, Kashier agreements, or Kashier documentation.

## 4. Kashier services [#4-kashier-services]

The SDK is intended to facilitate access to Kashier payment services.

Use of Kashier payment services may be subject to separate merchant agreements, account requirements, service terms, policies, technical requirements, and applicable fees.

This License does not grant access to Kashier payment services independently of those requirements.

## 5. Updates and changes [#5-updates-and-changes]

Kashier may update, modify, replace, or discontinue versions of the SDK from time to time.

New versions of the SDK may contain changes necessary for security, compliance, compatibility, or functionality.

You are responsible for maintaining an SDK version supported by Kashier.

## 6. Third-party software [#6-third-party-software]

The SDK may include or depend upon third-party software components that are subject to their own license terms.

Nothing in this License modifies any rights or obligations applicable to such third-party components.

## 7. Confidentiality and security [#7-confidentiality-and-security]

You must not attempt to access, expose, extract, or misuse confidential information, credentials, cryptographic material, security controls, or implementation details associated with the SDK or Kashier services.

You are responsible for securely implementing and operating your integration in accordance with Kashier documentation and applicable security requirements.

## 8. Disclaimer [#8-disclaimer]

To the maximum extent permitted by applicable law, the SDK is provided "as is" and "as available."

Kashier makes no warranties, express or implied, except to the extent expressly provided under a separate written agreement with Kashier.

## 9. Limitation of liability [#9-limitation-of-liability]

To the maximum extent permitted by applicable law, Kashier shall not be liable for indirect, incidental, special, consequential, or punitive damages arising out of or related to the use of the SDK, except where liability cannot legally be excluded or limited.

Any additional liability terms agreed between you and Kashier under a separate written agreement will take precedence where applicable.

## 10. Termination [#10-termination]

Kashier may terminate or suspend this License if you materially violate its terms or applicable Kashier agreements.

Upon termination, you must stop using the SDK except to the extent otherwise agreed in writing by Kashier or required by applicable law.

## 11. Applicable agreements [#11-applicable-agreements]

This License supplements any applicable Kashier merchant agreement, developer agreement, terms of service, privacy policy, or other agreement between you and Kashier.

If there is a conflict between this License and a separately executed written agreement with Kashier, the separately executed agreement will control to the extent of that conflict.

## 12. Contact [#12-contact]

Questions regarding this License may be directed to Kashier through the official contact channels published by Kashier.

## Package metadata [#package-metadata]

| Field                             | Value                                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| License name for package metadata | Kashier Proprietary SDK License                                                                 |
| Distribution                      | Repository distribution permitted solely for integration and use with Kashier payment services. |
| Source availability               | The SDK is proprietary and closed-source unless otherwise expressly stated by Kashier.          |

# iOS SDK (/docs/accept-payments/ios-sdk)

A native Swift SDK that drops a complete, Kashier-hosted payment experience into your iOS app. Your app hands the SDK a **session ID** created by your backend; the SDK renders the payment sheet, collects card, wallet or Apple Pay details, handles 3-D Secure, and reports exactly one outcome.

Your app never touches card numbers, CVVs, or Kashier API credentials.

| Field          | Value                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| Module         | `Kashier`                                                                               |
| Latest version | `1.0.1`                                                                                 |
| Distribution   | Swift Package Manager and CocoaPods, by git tag from `Kashier-payments/kashier_ios_sdk` |
| Audience       | Merchant developers integrating Kashier payments into native iOS apps                   |
| Minimum iOS    | `17.0`                                                                                  |

## SDK overview [#sdk-overview]

### What it does [#what-it-does]

- Presents the Kashier payment sheet over your app's screen.
- Supports **card** payments (new and saved cards), **mobile wallet** payments and **Apple Pay**.
- Handles **3-D Secure** in a full-screen web view inside the SDK.
- Checks the payment's status with Kashier automatically, and reports a **pending** outcome rather than guessing when the status is still open.
- Ships English and Arabic UI, with right-to-left layout for Arabic.
- Reports exactly one outcome per payment: success, pending or failure.

### What it does not do [#what-it-does-not-do]

- **No session creation.** Your backend creates sessions.
- **No merchant credentials in the app.** The SDK takes only a session ID.
- **No SwiftUI API.** The SDK is called from UIKit code. SwiftUI apps call it through a view controller (see [Calling from SwiftUI](#calling-from-swiftui)).
- **No state kept between launches.** The SDK writes nothing to disk and restores nothing after your app is terminated (see [Presentation and backgrounding](#presentation-and-backgrounding)).

### Payment method availability [#payment-method-availability]

The sheet shows **Wallet**, **Card** and **Apple Pay**, filtered by the session's allowed payment methods. &#x2A;_An empty allowed-methods list means every supported method is offered._* Your app cannot choose the method: it is decided by the session your backend creates. The sheet also hides a method the device cannot offer — Apple Pay in particular needs a merchant ID and a device set up for it (see [Apple Pay](#apple-pay)).

<img alt="The Kashier payment sheet on iOS showing the store name, the amount, a Wallet tile and a Card tile" src="__img0" />

_The payment sheet your customers see. When Apple Pay is available, the system Apple Pay button appears below the Card tile; this capture does not include it._

### Architecture at a glance [#architecture-at-a-glance]

```text
Your view controller
  │  KashierSDK.initialize(KashierConfig(mode:language:appleMerchantID:))   // before the first payment
  │  KashierSDK.startPayment(sessionId:from:…)                              // callbacks or async
  ▼
Kashier payment sheet (presented over your view controller)
  ├── load the session  →  show the sheet
  ├── card       →  create the order  →  3-D Secure web view  →  status check
  ├── wallet     →  payment request   →  poll the status (max 5 min)
  └── Apple Pay  →  system Apple Pay sheet  →  create the order
  ▼
Outcome  →  success | pending | failure
```

## Requirements [#requirements]

| Requirement | Value                                                        |
| ----------- | ------------------------------------------------------------ |
| Minimum iOS | **17.0**                                                     |
| Xcode       | **16** or later (the SDK needs the Swift 6.0 toolchain)      |
| Swift       | **6.0** toolchain; the SDK is built in Swift 6 language mode |
| Presenter   | A `UIViewController` that is on screen                       |
| Network     | Internet access                                              |
| Backend     | A server that creates Kashier payment sessions               |

The SDK has no third-party dependencies. It uses UIKit, SwiftUI, WebKit, PassKit and Apple's networking frameworks.

### What is a session ID? [#what-is-a-session-id]

A session ID identifies a payment your **backend** created with Kashier before the customer reaches checkout. It carries the amount, currency, order reference, allowed payment methods, customer details and the server-computed payment hash.

The SDK takes the session ID as its only payment input. It never creates sessions and never needs your Kashier API credentials. Create sessions server-to-server, then pass the session ID to your app over your own authenticated channel.

<Callout title="Note">
  Backend integration is out of scope for this guide. See [Payment sessions](/docs/accept-payments/payment-sessions) for backend details.
</Callout>

## Installation and setup [#installation-and-setup]

The SDK is distributed from the Kashier public repository, `Kashier-payments/kashier_ios_sdk`, by git tag. It is **not** published to the CocoaPods trunk. Each release is a git tag. Swift Package Manager takes updates up to the next major version; CocoaPods pins the tag.

### Swift Package Manager [#swift-package-manager]

In Xcode, choose &#x2A;_File › Add Package Dependencies…_* and enter:

```text
https://github.com/Kashier-payments/kashier_ios_sdk
```

Choose **Up to Next Major Version** from `1.0.1`, then add the **Kashier** library to your app target.

In a `Package.swift`:

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/Kashier-payments/kashier_ios_sdk", from: "1.0.1")
],
targets: [
    .target(
        name: "YourApp",
        dependencies: [.product(name: "Kashier", package: "kashier_ios_sdk")]
    )
]
```

### CocoaPods [#cocoapods]

```ruby
platform :ios, '17.0'

target 'YourApp' do
  pod 'Kashier', :git => 'https://github.com/Kashier-payments/kashier_ios_sdk.git', :tag => '1.0.1'
end
```

Because the pod comes from a git tag, you upgrade by changing the tag.

The SDK's localized strings, images and privacy manifest ship inside the package; there is nothing to add by hand.

### iOS project setup [#ios-project-setup]

#### Capabilities and Info.plist — nothing for cards and wallets [#capabilities-and-infoplist--nothing-for-cards-and-wallets]

Card and mobile-wallet payments need no capability, entitlement or `Info.plist` key. The SDK's own API endpoints use HTTPS (see [SDK configuration](#sdk-configuration)).

Apple Pay does need a capability: see [Apple Pay](#apple-pay).

#### Right-to-left [#right-to-left]

The SDK sets its own layout direction from `KashierConfig.language`: Arabic lays out right to left and English left to right, whatever the device language. It does not change your app's layout.

#### Appearance [#appearance]

The payment sheet is light-only: it keeps its light appearance when the device is in Dark Mode.

#### Privacy manifest [#privacy-manifest]

The SDK includes a privacy manifest, `PrivacyInfo.xcprivacy`. It declares:

- **Tracking:** none. No tracking domains.
- **Required-reason APIs:** none used.
- **Collected data types**, each linked to the user, not used for tracking, and collected for app functionality: payment info, name, email address, user ID, phone number and purchase history.

Review these entries when you complete your own app's privacy manifest and App Store privacy answers.

## Quick start [#quick-start]

The smallest complete integration: configure the SDK, start a payment from a view controller, and handle **every** outcome.

```swift
import Kashier
import UIKit

final class CheckoutViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        // 1. Configure once, before the first payment.
        KashierSDK.initialize(KashierConfig(mode: .test, language: .en))
    }

    // 2. Start a payment with a session ID your backend created.
    func pay(sessionId: String) {
        KashierSDK.startPayment(
            sessionId: sessionId,
            from: self,
            onSuccess: { result in
                // Paid. Confirm with your backend before fulfilling the order.
                self.showReceipt(orderId: result.orderId, transactionId: result.transactionId)
            },
            onFailure: { error in
                if error.code == .userCancelled {
                    self.returnToCheckout()
                } else {
                    // error.message is English; error.messageAr is Arabic.
                    self.showError(error.message)
                }
            },
            onPending: { pending in
                // Terminal: no success or failure follows. pending.orderId is the
                // authoritative reference. Confirm it on your backend.
                self.showPending(orderId: pending.orderId, message: pending.message)
            }
        )
    }

    private func showReceipt(orderId: String?, transactionId: String?) {}
    private func showError(_ message: String) {}
    private func showPending(orderId: String, message: String) {}
    private func returnToCheckout() {}
}
```

<Callout title="Note">
  `startPayment` never throws. A missing configuration or a blank session ID arrives at `onFailure` as a `validationFailed` error (see [Launching a payment](#launching-a-payment)).
</Callout>

## SDK configuration [#sdk-configuration]

```swift
KashierSDK.initialize(
    KashierConfig(mode: .live, language: .ar, appleMerchantID: "merchant.com.yourcompany")
)
```

### KashierConfig [#kashierconfig]

| Property          | Type              | Meaning                                                                                                 |
| ----------------- | ----------------- | ------------------------------------------------------------------------------------------------------- |
| `mode`            | `KashierMode`     | `.test` or `.live` — selects the Kashier environment                                                    |
| `language`        | `KashierLanguage` | `.en` (default) or `.ar` — language and layout direction of the payment sheet                           |
| `appleMerchantID` | `String?`         | Your Apple Pay Merchant ID. When `nil` or empty, Apple Pay is not offered (see [Apple Pay](#apple-pay)) |

### KashierMode [#kashiermode]

| Value   | API base URL                  | Payment-processing base URL   |
| ------- | ----------------------------- | ----------------------------- |
| `.test` | `https://test-api.kashier.io` | `https://test-fep.kashier.io` |
| `.live` | `https://api.kashier.io`      | `https://fep.kashier.io`      |

Create the session in the same environment as the mode you configure.

### Initialization contract [#initialization-contract]

- Call `initialize` **before the first payment**. `KashierSDK` runs on the main actor.
- You can call it again at any time. The new configuration applies to the **next** payment only; a payment already running keeps the configuration it started with, including its language.
- Configuration is held in memory only. It does not survive your app's termination, so call `initialize` again on every launch.
- `KashierSDK.isInitialized`, `KashierSDK.mode` and `KashierSDK.language` read back the current values. `language` is the language the next payment will use.
- Starting a payment before initializing reports a `validationFailed` error with the message "Kashier SDK is not initialized."
- The language is always the one you configure; the SDK never reads the device language.

## Launching a payment [#launching-a-payment]

The SDK has two entry points. Both report exactly one outcome per payment and neither throws.

### Callbacks [#callbacks]

```swift
KashierSDK.startPayment(
    sessionId: sessionId,
    from: viewController,
    onSuccess: { result in /* KashierPaymentResult */ },
    onFailure: { error in /* KashierPaymentError */ },
    onPending: { pending in /* KashierPaymentPending */ }
)
```

At most one closure runs. The closures run on the main actor.

- `onSuccess` and `onFailure` run **after** the SDK has removed its UI and released its hold on the payment, so you can start another payment from inside them.
- `onPending` runs **before** the SDK finishes. A `startPayment` call made from inside `onPending` is rejected with `validationFailed`.
- `onPending` is optional. &#x2A;_Without it, a pending payment ends with no callback at all._* Always pass it.

### async/await [#asyncawait]

```swift
let outcome = await KashierSDK.startPayment(sessionId: sessionId, from: viewController)
```

It returns a `KashierOutcome`: `.success`, `.pending` or `.failure`. Unlike the callback version, it always returns an outcome, including for a pending payment.

Cancelling the calling `Task` does **not** cancel a payment that has started. The payment runs to its real outcome and the call still returns it (see [Presentation and backgrounding](#presentation-and-backgrounding)).

### What the SDK checks before presenting [#what-the-sdk-checks-before-presenting]

| Situation                                                    | `onFailure` (code `validationFailed`) message                  |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| SDK not initialized                                          | "Kashier SDK is not initialized."                              |
| Blank session ID (whitespace counts as blank)                | "A session ID is required."                                    |
| Another payment is running                                   | "A payment is already in progress."                            |
| The presenting controller is not in a visible window         | "The presenting view controller is not in a window hierarchy." |
| The presenting controller is already presenting something    | "The presenting view controller is already presenting."        |
| The presenting controller went away while the session loaded | "The presenting view controller is no longer able to present." |
| UIKit did not complete the presentation                      | "The payment sheet could not be presented."                    |

The SDK loads the session **before** it presents anything. If the session cannot be loaded, `onFailure` runs and no Kashier UI appears. A session whose payment methods are all unavailable still shows the sheet, in its empty state.

## Handling payment results [#handling-payment-results]

Every payment ends in one of three outcomes.

| Outcome | Type                    | What to do                                                                           |
| ------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Success | `KashierPaymentResult`  | Show a receipt. Confirm with your backend before you fulfill the order.              |
| Pending | `KashierPaymentPending` | The payment is not final. Do not fulfill; wait for your backend's confirmation.      |
| Failure | `KashierPaymentError`   | `.userCancelled` means the customer closed the sheet. Show `message` for the others. |

### When backend reconciliation is required [#when-backend-reconciliation-is-required]

- **Always** before fulfilling an order: treat the SDK's success as a signal and confirm the final status on your server.
- On **pending**, use `pending.orderId` as the reference to look up.
- On a failure with code `.unknownError` and the message "Payment status could not be verified. Please check your payment history.", the payment reached Kashier but its result did not come back. &#x2A;_This is not a failure._* Check the order on your server before you let the customer pay again. The SDK does not retry it and does not let the customer retry it.

### KashierPaymentResult fields [#kashierpaymentresult-fields]

<Accordions type="multiple">
  <Accordion title="Payment result fields">
    | Field                  | Type                | Meaning                                                                |
    | ---------------------- | ------------------- | ---------------------------------------------------------------------- |
    | `sessionId`            | `String`            | The session that was paid                                              |
    | `status`               | `String`            | Payment status reported by Kashier                                     |
    | `orderId`              | `String?`           | Kashier order ID                                                       |
    | `orderReference`       | `String?`           | Your order reference from the session                                  |
    | `transactionId`        | `String?`           | Kashier transaction ID                                                 |
    | `authorizationNumber`  | `String?`           | Authorization number, when present                                     |
    | `amount`               | `Double?`           | Amount, for display only                                               |
    | `currency`             | `String?`           | Currency code                                                          |
    | `card`                 | `KashierCardInfo?`  | `brand`, `maskedNumber` and `wallet` (for example `APPLE_PAY`)         |
    | `message`, `messageAr` | `String?`           | Message in English and Arabic                                          |
    | `transactionData`      | `KashierJSONValue?` | Raw response body. &#x2A;*Sensitive:** never log, store or transmit it |
  </Accordion>
</Accordions>

Take amounts for bookkeeping from your own backend, not from `amount`.

### KashierPaymentPending fields [#kashierpaymentpending-fields]

| Field                    | Type      | Meaning                                              |
| ------------------------ | --------- | ---------------------------------------------------- |
| `orderId`                | `String`  | The authoritative reference for later reconciliation |
| `transactionId`          | `String`  | May be an empty string                               |
| `message`                | `String`  | Message in the language you configured               |
| `messageEn`, `messageAr` | `String?` | The message in each language                         |

## Card and saved cards [#card-and-saved-cards]

### New-card flow [#new-card-flow]

1. The customer taps **Card** (or **Add New Card** when saved cards are shown).
2. The customer fills in the card form and taps **Pay**.
3. The SDK sends the card to Kashier. It never passes through your app.
4. Depending on the card, the payment finishes at once, or the customer completes 3-D Secure (see [3-D Secure](#3-d-secure)).
5. The sheet shows the result and your callback runs.

<img alt="The card form with a number, expiry and security code, a cardholder name field and a save-card checkbox" src="__img1" />

### Card form rules [#card-form-rules]

| Field           | Rule                                                                        |
| --------------- | --------------------------------------------------------------------------- |
| Card number     | 16 digits that pass the Luhn check                                          |
| Expiry          | `MM/YY`, month 1–12, not in the past                                        |
| CVV             | 3 digits                                                                    |
| Cardholder name | 2–50 characters, ASCII letters and spaces only (an Arabic name is rejected) |

**Pay** stays disabled until every field is valid. Brand artwork is shown for Visa (numbers starting with 4), Mastercard (51–55 and 2221–2720) and Meeza (507803–507960).

<img alt="The card form showing field errors: an invalid card number and an invalid cardholder name" src="__img2" />

### Saving a card after payment [#saving-a-card-after-payment]

The **Save this card for future payments** checkbox appears only when all of these hold:

- The session's save-card setting is not `hidden`.
- The SDK is in **live** mode (it is never shown in test mode).
- The session carries customer details.

When the session's save-card setting is `forced`, the box is checked and cannot be changed. Cards are saved only for a session that carries a customer.

### What your app sees [#what-your-app-sees]

| Situation                                              | Result                                                                                                                                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Payment succeeds                                       | `onSuccess`                                                                                                                                                                                       |
| The customer closes the sheet before paying            | `onFailure` with `.userCancelled`                                                                                                                                                                 |
| A decline the customer can retry                       | Shown inside the sheet with **Try Again** and **Cancel**; your callback does not run yet. **Cancel** reports that failure's code. After **Try Again**, closing the sheet reports `.userCancelled` |
| A failure the SDK cannot let the customer retry safely | `onFailure` with that failure's code                                                                                                                                                              |
| Payment is still open after the status checks          | `onPending`, then a **Payment Pending** screen until the customer taps **Done**                                                                                                                   |
| The result never reached the SDK                       | `onFailure` with `.unknownError` ("Payment status could not be verified…")                                                                                                                        |

A failed attempt that the sheet lets the customer retry offers **Try Again** and **Cancel**. **Cancel** reports _that failure's_ code to your app, not `.userCancelled`.

### Status checks [#status-checks]

After the SDK creates an order it confirms the result with Kashier by checking the order's status on a short schedule that lasts about a minute. The check ends in one of:

- a success, a failure, or a **pending** outcome when Kashier answered but the status was still open;
- an **unknown** result when no status check got an answer. This is reported as the `.unknownError` failure described in [Handling payment results](#handling-payment-results), never as pending.

While a status check runs, the customer cannot cancel or switch method.

### Authorize and capture [#authorize-and-capture]

When the session was created with `manualCapture: true`, a card payment **authorizes** the funds rather than capturing them, and reports success with `result.status == "AUTHORIZED"`. Capture and void run on your backend. Only card payments authorize on a manual-capture session: Apple Pay is always sent as an immediate payment, and wallets as a wallet payment request.

### Card data security [#card-data-security]

Card data goes from the SDK's sheet to Kashier. Your app's code never receives the card number, expiry or CVV, and no part of the public API accepts them.

### Saved cards [#saved-cards]

#### When saved cards are fetched [#when-saved-cards-are-fetched]

The SDK fetches saved cards only when the session has **saved-card retrieval switched on and a customer reference**. It starts after the sheet is on screen. If the fetch fails, the card section falls back to **Add New Card** only; payment is never blocked.

#### Presentation [#presentation]

Saved cards appear inside the Card tile as a list of masked cards (brand and last four digits), followed by **Add New Card**. The list shows three cards; **View more** reveals the rest.

<img alt="The Card tile expanded to show three saved cards and Add New Card" src="__img3" />

#### Paying with a saved card [#paying-with-a-saved-card]

1. The customer selects a saved card.
2. The customer enters the card's 3-digit CVV.
3. The customer taps **Pay**.

#### Deleting a saved card [#deleting-a-saved-card]

Swipe a saved card toward the start edge to delete it (left in English, right in Arabic). The customer confirms ("Delete card ending in …?"). If the deletion fails, the card stays in the list and the sheet shows "Failed to delete card. Please try again." for 4 seconds. A deletion that is still running prevents the customer from dismissing the sheet by tapping outside it.

## Wallet payments [#wallet-payments]

### Flow [#flow]

1. The customer taps **Wallet** and enters an Egyptian mobile number: **11 digits**, starting `010`, `011`, `012` or `015`. An invalid number shows "Enter a valid Egyptian phone number".
2. The SDK sends a payment request to the wallet.
3. The sheet shows **Complete Your Payment**: "Check your SMS or wallet app to approve the payment".
4. The SDK polls Kashier for the payment status until it is final.

<img alt="The wallet phone-number form" src="__img4" />

<img alt="The wallet waiting sheet with Notifying, Processing and Successful Payment steps" src="__img5" />

### Polling schedule [#polling-schedule]

The SDK checks the status every **10 seconds** for the first 2 minutes (12 checks), then after waits of 30, 45, 60, 90, 120 and 180 seconds. Polling stops when the next wait would pass **5 minutes** in total; in practice the last check happens roughly 4 minutes 15 seconds after the request, plus the time the checks themselves take.

### Controls on the waiting sheet [#controls-on-the-waiting-sheet]

| Control                   | While polling                                               | After polling ran out                                         |
| ------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| **Reload Payment Status** | Runs one status check now                                   | Hidden                                                        |
| **I have paid**           | Hidden                                                      | Reports a pending outcome to `onPending` and closes the sheet |
| **Cancel**                | Returns to the phone-number form; your app gets no callback | Ends the payment with `onFailure` (`.userCancelled`)          |

**Cancel** only leaves the flow in the SDK. It does not cancel or reverse the request that was sent to the wallet. Tapping outside the sheet during waiting ends the payment with `.userCancelled` in the same way.

### Exhaustion [#exhaustion]

When polling runs out:

- If Kashier gave at least one answer with a non-final status, the sheet shows "Payment Pending" with **I have paid** and **Cancel**. **I have paid** reports a **pending** outcome built from the latest answer.
- If no answer was received, the payment is reported as the `.unknownError` failure "Payment status could not be verified…".

### What your app sees [#what-your-app-sees-1]

| Situation                                      | Result                                                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Wallet payment confirmed                       | `onSuccess`                                                                                                                                |
| Kashier reports the payment failed             | A failure sheet with **Try Again** (back to the phone-number form) and **Cancel**. **Cancel** reports that failure's code                  |
| The customer taps **I have paid**              | `onPending`                                                                                                                                |
| Cancel at exhaustion, or tap outside the sheet | `onFailure` with `.userCancelled`                                                                                                          |
| A wallet request that Kashier rejects          | Shown inline on the phone-number form so the customer can retry. A failure that cannot safely be retried ends the payment with `onFailure` |

## Apple Pay [#apple-pay]

Apple Pay pays through the system Apple Pay sheet. It supports Visa, Mastercard and Meeza by default. For the rules Apple Pay shares with the card rail, such as refunds and voids, see [Apple Pay](/docs/accept-payments/apple-pay).

### Set up [#set-up]

1. Create your Apple Pay Merchant ID and Payment Processing Certificate in your own Apple Developer account, then upload the certificate and its private key in the Kashier dashboard under **Settings > Device Payment Configuration > Apple Pay** with **Use my own certificates** turned on. See [Accept Apple Pay in your iOS app](/docs/accept-payments/apple-pay#accept-apple-pay-in-your-ios-app). Without this, Kashier cannot decrypt Apple Pay payments from your app.
2. In Xcode, add the **Apple Pay** capability to your app target and select your Apple Pay Merchant ID. The ID in your app's capability (the `com.apple.developer.in-app-payments` entitlement) and the ID you pass to the SDK must be the same.
3. Pass the same ID to the SDK:

```swift
import Kashier

@MainActor
func configureKashier() {
    KashierSDK.initialize(
        KashierConfig(mode: .live, language: .en, appleMerchantID: "merchant.com.yourcompany")
    )
}
```

Without `appleMerchantID`, the sheet does not offer Apple Pay.

### When Apple Pay is offered [#when-apple-pay-is-offered]

The sheet shows the Apple Pay button when **all** of these hold:

- `appleMerchantID` is set and not empty.
- The session allows Apple Pay: its allowed methods are empty, or include `applePay` or `card`.
- The device can make payments with Apple Pay, and with Visa, Mastercard or Meeza.

### isApplePayAvailable() [#isapplepayavailable]

```swift
import Kashier

func canOfferApplePay() async -> Bool {
    await KashierSDK.isApplePayAvailable()
}
```

It returns `true` when the current configuration and the device can offer Apple Pay: a merchant ID is configured, the device can make Apple Pay payments, and it supports Visa, Mastercard or Meeza. It does not read any session, so it cannot tell you whether a particular session allows Apple Pay. Call it after `initialize`: before that it returns `false`.

### Behavior [#behavior]

- The Apple Pay payment request uses country `EG`, the session's currency, the session's supported networks (Visa, Mastercard and Meeza by default) and the 3-D Secure capability.
- Apple Pay is always sent as an immediate payment, even when the session uses manual capture, and never goes through the 3-D Secure web view.
- If the customer dismisses the Apple Pay sheet, the payment sheet returns to its landing screen and your app gets **no callback**.
- If Apple Pay's result is not known after the status checks, the SDK reports the `.unknownError` failure "Payment status could not be verified…". Apple Pay never ends in a pending outcome.

## 3-D Secure [#3-d-secure]

### What the customer sees [#what-the-customer-sees]

When the card needs 3-D Secure, the SDK opens the issuer's page in a **full-screen** web view with a close button (✕) and the title "Verifying your payment". The customer completes the challenge there.

<img alt="The full-screen 3-D Secure screen with a close button and the title Verifying your payment" src="__img6" />

_The page content is the issuer's. This capture shows the SDK's frame around it._

### How completion is detected [#how-completion-is-detected]

The SDK watches the page's navigation, but nothing the page shows or sends decides the result. Whatever it sees, the SDK confirms the outcome with Kashier by checking the order's status (see [Status checks](#status-checks)). The customer cannot close the page while that check runs, and tapping outside the page does nothing.

### Cancel and retry [#cancel-and-retry]

- **✕** ends the payment at once with `onFailure` (`.userCancelled`). The SDK does not run a status check and does not cancel the order with Kashier, so verify the order on your backend.
- If the page fails to load, the SDK shows an error view with **Try Again** and **Cancel**. **Try Again** reloads the same page; it does not create a new payment. If the payment's result is already unknown, the error view offers only **Done**, which reports the `.unknownError` failure.

### Web view security [#web-view-security]

- The web view uses a **non-persistent** website data store, created for that payment. Nothing from the issuer's page (cookies, storage) is kept after it, and your app's own web data is not touched.
- JavaScript is enabled, as 3-D Secure pages require.

## Presentation and backgrounding [#presentation-and-backgrounding]

### How the sheet is presented [#how-the-sheet-is-presented]

The SDK presents its own full-screen controller (`overFullScreen`) from the view controller you pass. The sheet slides up over your screen; the dimmed area above it is a backdrop. There is no swipe-to-dismiss.

Tapping the backdrop ends the payment with `.userCancelled` on the landing sheet, the card form and the wallet screens. It does nothing on the 3-D Secure screen, the result screens, while a payment request is being sent, while a status check runs, while a deletion of a saved card is running, and once an order exists that the SDK must still check.

### The presenting view controller [#the-presenting-view-controller]

The view controller you pass to `startPayment` must be:

- in a window that is visible, and
- not already presenting something.

The SDK checks this when you call, and again after it has loaded the session. It holds the controller **weakly**, so keep it alive and on screen until the payment ends. If it is gone by the time the sheet is due, the payment ends with `validationFailed` and nothing is shown.

The `async` overload takes the controller as a `consuming` parameter and does not extend its lifetime either.

Presenting another controller **over** the Kashier sheet does not end the payment.

### If the payment is torn down from outside [#if-the-payment-is-torn-down-from-outside]

If your app removes the sheet (for example by dismissing the presenter or hiding its window), the payment ends with the outcome that is true at that moment:

| State when the sheet was removed                    | Outcome                                                   |
| --------------------------------------------------- | --------------------------------------------------------- |
| An outcome had already been decided                 | That outcome                                              |
| The customer was looking at a retryable failure     | That failure                                              |
| A payment request was in flight, or an order exists | `.unknownError` ("Payment status could not be verified…") |
| Nothing financial had happened                      | `.userCancelled`                                          |

### Backgrounding and relaunch [#backgrounding-and-relaunch]

- The SDK does not observe app lifecycle events and starts no background tasks. Its status checks run only while your app is running.
- The SDK stores nothing: not configuration, not a pending payment. If iOS terminates your app during a payment, the SDK cannot deliver an outcome after relaunch. Confirm the order's status from your backend.
- Wallet and card status checks use the order ID the SDK holds in memory. A wallet request the customer approves while your app is not running is visible through your backend, not through the SDK.

### One payment at a time [#one-payment-at-a-time]

Only one payment can run. A second `startPayment` while one is running ends at once with `validationFailed` ("A payment is already in progress."). Because `onSuccess` and `onFailure` run after the SDK has let go of the payment, calling `startPayment` from inside them is allowed.

### Reconfiguring during a payment [#reconfiguring-during-a-payment]

`initialize` never changes a payment that is running; it applies to the next one. It is not a way to cancel a payment: the customer cancels from the sheet.

## UIKit: callback and async [#uikit-callback-and-async]

Both entry points need the same three things: `initialize` once, a presenting `UIViewController`, and a session ID from your backend.

### Callbacks [#callbacks-1]

[Quick start](#quick-start) shows the complete callback version.

### async/await in UIKit [#asyncawait-in-uikit]

```swift
import Kashier
import UIKit

final class AsyncCheckoutViewController: UIViewController {

    func pay(sessionId: String) {
        Task { @MainActor in
            let outcome = await KashierSDK.startPayment(sessionId: sessionId, from: self)
            handle(outcome)
        }
    }

    private func handle(_ outcome: KashierOutcome) {
        switch outcome {
        case .success(let result):
            // Confirm with your backend before fulfilling the order.
            print("Paid:", result.orderId ?? "", result.transactionId ?? "")
        case .pending(let pending):
            // Terminal: check pending.orderId on your backend.
            print("Pending:", pending.orderId)
        case .failure(let error):
            switch error.code {
            case .userCancelled:
                print("Cancelled")
            case .unknownError:
                // Might be "Payment status could not be verified": check the order
                // on your backend before letting the customer pay again.
                print("Verify with backend:", error.message)
            default:
                print("Failed:", error.code.rawValue, error.message)
            }
        }
    }
}
```

### Showing the Arabic message [#showing-the-arabic-message]

`KashierPaymentError` carries both languages:

```swift
import Kashier

func displayMessage(for error: KashierPaymentError, arabic: Bool) -> String {
    if arabic, let messageAr = error.messageAr {
        return messageAr
    }
    return error.message
}
```

## Calling from SwiftUI [#calling-from-swiftui]

The SDK has no SwiftUI API. It needs a `UIViewController` to present from. In SwiftUI, find the top-most view controller of your app's active window scene and pass that. Use the top-most controller: the SDK refuses a presenter that is already presenting something.

```swift
import Kashier
import SwiftUI
import UIKit

@MainActor
func topViewController() -> UIViewController? {
    let scene = UIApplication.shared.connectedScenes
        .compactMap { $0 as? UIWindowScene }
        .first { $0.activationState == .foregroundActive }
    var top = scene?.keyWindow?.rootViewController
    while let presented = top?.presentedViewController {
        top = presented
    }
    return top
}

struct CheckoutView: View {
    let sessionId: String
    @State private var message = ""

    var body: some View {
        VStack(spacing: 16) {
            Button("Pay") {
                guard let presenter = topViewController() else { return }
                Task { @MainActor in
                    let outcome = await KashierSDK.startPayment(sessionId: sessionId, from: presenter)
                    switch outcome {
                    case .success(let result):
                        message = "Paid: \(result.orderId ?? "")"
                    case .pending(let pending):
                        message = "Pending: \(pending.orderId)"
                    case .failure(let error):
                        message = error.message
                    }
                }
            }
            Text(message)
        }
    }
}
```

Configure the SDK once, early in your app's life:

```swift
import Kashier
import SwiftUI

@main
struct StoreApp: App {
    init() {
        KashierSDK.initialize(KashierConfig(mode: .test, language: .en))
    }

    var body: some Scene {
        WindowGroup {
            CheckoutView(sessionId: "SESSION_ID_FROM_YOUR_BACKEND")
        }
    }
}
```

### Do not tie the payment to a view's task [#do-not-tie-the-payment-to-a-views-task]

Cancelling a SwiftUI `Task` (for example the one behind the `.task` modifier, when its view disappears) does **not** cancel a payment that is already running. The payment continues to its real outcome, and `await KashierSDK.startPayment` still returns it. Do not rely on view lifetime to stop a payment, and keep the presenter alive while it runs (see [Presentation and backgrounding](#presentation-and-backgrounding)).

## API reference [#api-reference]

Everything below is in the `Kashier` module.

### KashierSDK [#kashiersdk]

`KashierSDK` runs on the main actor.

| Member                                                                    | Description                                              |
| ------------------------------------------------------------------------- | -------------------------------------------------------- |
| `static func initialize(_ config: KashierConfig)`                         | Configure the SDK. Applies to the next payment           |
| `static var isInitialized: Bool`                                          | `true` once `initialize` has been called                 |
| `static var mode: KashierMode?`                                           | The configured mode, or `nil`                            |
| `static var language: KashierLanguage`                                    | The language the next payment will use                   |
| `static func isApplePayAvailable() async -> Bool`                         | Whether the configuration and device can offer Apple Pay |
| `static func startPayment(sessionId:from:onSuccess:onFailure:onPending:)` | Callback entry point. `onPending` is optional            |
| `static func startPayment(sessionId:from:) async -> KashierOutcome`       | `async` entry point                                      |

### KashierConfig reference [#kashierconfig-reference]

`init(mode: KashierMode, language: KashierLanguage = .en, appleMerchantID: String? = nil)`, with the properties `mode`, `language` and `appleMerchantID`.

### KashierMode and KashierLanguage [#kashiermode-and-kashierlanguage]

`KashierMode`: `.test`, `.live`. `KashierLanguage`: `.en`, `.ar`.

### KashierOutcome [#kashieroutcome]

`.success(KashierPaymentResult)`, `.pending(KashierPaymentPending)`, `.failure(KashierPaymentError)`.

### KashierPaymentResult and KashierCardInfo [#kashierpaymentresult-and-kashiercardinfo]

See [Handling payment results](#handling-payment-results). `KashierCardInfo` has `brand`, `maskedNumber` and `wallet`, all optional strings.

### KashierPaymentPending [#kashierpaymentpending]

See [Handling payment results](#handling-payment-results).

### KashierPaymentError [#kashierpaymenterror]

| Field                    | Type                | Meaning                                                                |
| ------------------------ | ------------------- | ---------------------------------------------------------------------- |
| `code`                   | `KashierErrorCode`  | The error code (see [Error handling](#error-handling))                 |
| `message`                | `String`            | English message                                                        |
| `messageAr`              | `String?`           | Arabic message                                                         |
| `responseCode`           | `String?`           | The processor's response code, when there is one                       |
| `details`                | `KashierJSONValue?` | Raw response body. &#x2A;_Sensitive:_* never log, store or transmit it |
| `underlyingURLErrorCode` | `Int?`              | The `URLError` code for transport failures                             |

`KashierPaymentError` conforms to `Error` and `CustomStringConvertible`. Its `description` is `KashierPaymentError(<code>: <message>)`.

`static func fromCode(_ code:message:messageAr:responseCode:details:underlyingURLErrorCode:)` builds an error with the default English and Arabic text for a code.

### KashierErrorCode [#kashiererrorcode]

A `String` enum with 18 cases (see [Error handling](#error-handling)). `CaseIterable`; `rawValue` is the case name.

### KashierJSONValue [#kashierjsonvalue]

An `enum` for a raw response body: `.null`, `.bool`, `.int`, `.double`, `.string`, `.array`, `.object`, with accessors such as `stringValue`, `intValue`, `doubleValue` and `boolValue`, and subscripts by key and by index. All SDK types are `Sendable`.

## Error handling [#error-handling]

`KashierPaymentError.code` is one of 18 `KashierErrorCode` values. The same 18 codes and default messages are shared with Kashier's other SDKs, so a merchant who ships more than one app can branch on the same names.

### Error codes [#error-codes]

<Accordions type="multiple">
  <Accordion title="Error codes">
    | Code                       | Meaning                                                                                                      |
    | -------------------------- | ------------------------------------------------------------------------------------------------------------ |
    | `sessionNotFound`          | Kashier has no session with that ID in this environment                                                      |
    | `sessionExpired`           | The session has expired                                                                                      |
    | `applePayNotAvailable`     | Apple Pay could not be presented for this session on this device                                             |
    | `userCancelled`            | The customer closed the sheet                                                                                |
    | `validationFailed`         | A pre-flight check failed (see [Launching a payment](#launching-a-payment))                                  |
    | `applePayConfigError`      | Apple Pay was selected but no merchant ID is configured                                                      |
    | `merchantValidationFailed` | Defined for parity with other Kashier SDKs. This version of the SDK does not return it                       |
    | `tokenProcessingFailed`    | The Apple Pay payment token could not be processed                                                           |
    | `paymentDeclined`          | The payment was declined                                                                                     |
    | `authorizationFailed`      | Kashier refused the request (HTTP 403)                                                                       |
    | `networkError`             | The request could not reach Kashier                                                                          |
    | `paymentTimeout`           | Defined for parity with other Kashier SDKs. This version of the SDK does not return it                       |
    | `walletInitFailed`         | Kashier rejected the wallet payment request                                                                  |
    | `cardRetrievalFailed`      | The saved-card list could not be loaded. Handled inside the sheet; not delivered to your callback            |
    | `cardDeletionFailed`       | A saved card could not be deleted. Handled inside the sheet; not delivered to your callback                  |
    | `invalidCardDetails`       | The card details are invalid. Shown inline in the sheet; not delivered to your callback                      |
    | `authenticationFailed`     | Defined for parity with other Kashier SDKs. This version of the SDK does not return it                       |
    | `unknownError`             | Anything else, including the unverified-status case in [Handling payment results](#handling-payment-results) |
  </Accordion>
</Accordions>

### What reaches your callback [#what-reaches-your-callback]

Failures the customer can safely retry are shown **inside** the sheet, and your callback does not run for them. The failure sheet's **Cancel** reports the failure's own code. After **Try Again**, if the customer closes the sheet, `onFailure` runs with `.userCancelled`.

### Default messages [#default-messages]

Each code has an English `message` and an Arabic `messageAr` by default, for example `paymentDeclined`: "Payment was declined." / "تم رفض عملية الدفع.". When Kashier sends its own message for a decline (in English and Arabic), that message is used instead.

### Diagnostics [#diagnostics]

In builds where `DEBUG` is defined, the SDK prints diagnostic lines to the console with sensitive values redacted. Other builds print nothing. `KashierPaymentError.details` and `KashierPaymentResult.transactionData` hold raw response bodies: never log or store them.

## Security and merchant responsibilities [#security-and-merchant-responsibilities]

### Your responsibilities [#your-responsibilities]

- Create sessions on your **server**. Never put your Kashier API credentials in the app.
- Return only the session ID to the app.
- Confirm every payment's final status on your server before you fulfill an order.
- Treat **pending** and the unverified-status `.unknownError` as "not paid yet", not as a failure, and check them before letting the customer pay again.
- Do not log or persist `details` or `transactionData`.
- Keep the presenting view controller alive and on screen while a payment runs.

### What the SDK does [#what-the-sdk-does]

- Sends card data from its own sheet to Kashier; the public API has no way to read it.
- Calls Kashier's HTTPS endpoints with an ephemeral URL session that does not use your app's shared URL cache or cookie storage.
- Keeps 3-D Secure web data in a non-persistent store.
- Writes nothing to disk, Keychain or `UserDefaults`.
- Sends the session's server-computed hash with the order and saved-card requests; your app does no cryptography.

## Testing and going live [#testing-and-going-live]

### Test mode [#test-mode]

Configure `.test` and create sessions in Kashier's test environment. The SDK then calls `https://test-api.kashier.io` and `https://test-fep.kashier.io`.

In test mode the card form shows a **Use Testing Data** button that fills in Kashier's test card (number `4508 7500 1574 1019`), and the **save card** checkbox is not shown.

### What to exercise [#what-to-exercise]

- A successful card payment and a card that needs 3-D Secure.
- The customer closing the sheet (`userCancelled`), including from the 3-D Secure ✕.
- A wallet payment, including **Reload Payment Status**.
- A payment that ends pending, with and without `onPending`.
- Starting a payment while another runs (`validationFailed`).
- Arabic (`.ar`) layout.
- Apple Pay on a real device with a card in Wallet.

### Going-live checklist [#going-live-checklist]

- `KashierConfig(mode: .live, …)` in release builds.
- Sessions created in the live environment by your backend.
- Final payment status confirmed on your server before fulfillment.
- `onPending` handled, and the unverified-status `.unknownError` handled.
- If you offer Apple Pay: the capability, the Merchant ID and `appleMerchantID` match.
- Privacy manifest and App Store privacy answers reviewed (see [Privacy manifest](#privacy-manifest)).
- Both English and Arabic checked if you offer both.
- No logging of `details` or `transactionData`.

## Frequently asked questions [#frequently-asked-questions]

**Can I change the language for one payment?**

Call `initialize` again with the language before you start that payment. A running payment keeps its own language.

**Can I cancel a payment from my code?**

No. The customer cancels from the sheet. `initialize` and cancelling a Swift `Task` do not cancel a running payment.

**Why did my pending payment produce no callback?**

`onPending` is optional, and without it a pending payment reports nothing. The `async` overload always returns an outcome.

**Can I start another payment from inside a callback?**

From `onSuccess` and `onFailure`, yes. From `onPending`, no: the call is rejected with `validationFailed`.

**Does the sheet support Dark Mode?**

The payment sheet is light-only.

**Where do I get the session ID?**

From your backend. See [Payment sessions](/docs/accept-payments/payment-sessions).

**Can an Arabic cardholder name be entered?**

The name field accepts ASCII letters and spaces only (2–50 characters).

**What does the SDK need from my app for Apple Pay?**

The Apple Pay capability, your Merchant ID, and the same ID in `appleMerchantID`.

## UI screens reference [#ui-screens-reference]

| Screen         | What the customer sees                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Landing        | Store name, amount, and a tile for each available method; the Apple Pay button below them         |
| Card form      | Card number, expiry, CVV, cardholder name, optional save-card checkbox, **Pay**                   |
| Saved cards    | The Card tile expanded to the customer's saved cards and **Add New Card**                         |
| Wallet form    | Phone-number field and **Pay**                                                                    |
| Wallet waiting | Notifying, Processing and Successful Payment steps, with **Reload Payment Status** and **Cancel** |
| 3-D Secure     | Full-screen issuer page with a close button                                                       |
| Success        | "Payment Successful", a summary of the amount, transaction ID and masked card, and **Done**       |
| Failure        | "Payment Failed", the reason, and **Try Again** / **Cancel**                                      |
| Pending        | "Payment Pending" and **Done**                                                                    |

<img alt="The payment success screen" src="__img7" />

<img alt="The payment failure screen with Try Again and Cancel" src="__img8" />

<img alt="The payment pending screen" src="__img9" />

## Support and license [#support-and-license]

### Support [#support]

For help with an integration, contact Kashier support at [support@kashier.io](mailto:support@kashier.io).

### License [#license]

The SDK is provided under the Kashier iOS SDK License. See [the license page](/docs/accept-payments/ios-sdk-license).

# Meeza (/docs/accept-payments/meeza)

Accept Meeza, Egypt's national card scheme, by submitting the card exactly like any other card. Send `paymentMethod.type = "card"` — never `"meeza"`. Meeza is not a payment method or a provider at Kashier; it is a card brand that Kashier detects from the card number.

## What changes [#what-changes]

Nothing in your request. Everything in the [customized card form](/docs/direct-api/card-form), [3D Secure](/docs/direct-api/3d-secure), [payment sessions](/docs/accept-payments/payment-sessions) and the direct API applies unchanged — you just submit a Meeza card number.

| Question                                       | Answer                                                                                                                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Which `paymentMethod.type` do I send?          | `card`. `meeza` is not a valid method type.                                                                                                                                |
| Are the response codes different?              | No. Meeza returns the same `transactionResponseCode` dictionary and the same statuses as any card. See [payment reason codes](/docs/accept-payments/payment-reason-codes). |
| Does Meeza support 3D Secure, refund and void? | Yes, the same as any other card.                                                                                                                                           |
| How do I identify a Meeza payment afterwards?  | By its card brand: a Meeza transaction carries `cardBrand: "MEEZA"` in reporting and in the `sourceOfFunds` details on the webhook.                                        |

## Meeza is rejected on recurring payments [#meeza-is-rejected-on-recurring-payments]

A Meeza card cannot be charged on a subscription or recurring-origin payment. Kashier rejects the request with `MEEZA_NOT_ALLOWED`:

| Field         | Value                           |
| ------------- | ------------------------------- |
| `cause`       | `cause.invalid.data`            |
| `explanation` | `explanation.meeza.not.allowed` |
| `messageKey`  | `message.meeza.not.allowed`     |
| `status`      | failed                          |

Meeza cards are not tokenizable for recurring the way Visa and Mastercard cards are. Use a Visa or Mastercard card for [recurring payments](/docs/accept-payments/recurring), and fall back to a one-off card payment if the customer only has a Meeza card.

## Testing [#testing]

Kashier does not publish a Meeza test card. The [test cards](/docs/get-started/testing) are Visa and Mastercard only — ask [techsupport@kashier.io](mailto:techsupport@kashier.io) if you need to test a Meeza card number.

# Mobile SDKs (/docs/accept-payments/mobile-sdks)

Drop-in payment libraries for accepting Kashier payments in your mobile app. Pick a platform to get started.

## Flutter SDK [#flutter-sdk]

Accept Apple Pay, mobile wallet, and card payments in your Flutter app from a single API call.

[Read the guide](/docs/accept-payments/flutter-sdk)

## Android SDK [#android-sdk]

Accept card, saved-card, and mobile wallet payments in your native Android app with a drop-in payment sheet.

[Read the guide](/docs/accept-payments/android-sdk)

## iOS SDK [#ios-sdk]

Accept card, saved-card, mobile wallet, and Apple Pay payments in your native iOS app with a drop-in payment sheet.

[Read the guide](/docs/accept-payments/ios-sdk)

# Order reconciliation (/docs/accept-payments/order-reconciliation)

Kashier reconciliation is the process of verifying that the electronic payment and refund transactions processed in your system match the transactions reported by Kashier.

## Retrieve order details [#retrieve-order-details]

Kashier enables you to retrieve details of your orders.

| Endpoint | Value                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------- |
| TEST URL | [https://test-api.kashier.io/v3/payment/orders](https://test-api.kashier.io/v3/payment/orders) |
| LIVE URL | [https://api.kashier.io/v3/payment/orders](https://api.kashier.io/v3/payment/orders)           |
| Method   | GET                                                                                            |

### Parameters [#parameters]

| Parameter | Type            | Description                                                                                              | Required |
| --------- | --------------- | -------------------------------------------------------------------------------------------------------- | -------- |
| search    | Query Parameter | Case-insensitive partial match on your merchant order id. Required — the request returns 400 without it. | true     |
| status    | Query Parameter | Order status, for example `CAPTURED`. Uppercased before matching.                                        | false    |
| startDate | Query Parameter | Lower bound on the order date. `startDate` after `endDate` returns 400.                                  | false    |
| endDate   | Query Parameter | Upper bound on the order date.                                                                           | false    |
| page      | Query Parameter | Page number. Default `1`.                                                                                | false    |
| limit     | Query Parameter | Page size. Default `20`.                                                                                 | false    |

### Headers [#headers]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl --location 'https://test-api.kashier.io/v3/payment/orders?search={{merchantOrderId}}&status={{status}}&startDate=2025-07-21&endDate=2025-12-23'
--header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v3/payment/orders" sendApiKey="false" />

### Reconciliation verdicts [#reconciliation-verdicts]

Every entry in an order's `transactions[]` array carries two reconciliation verdicts.

| Field                           | What it tells you                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `reconcilation`                 | Kashier's verdict for this transaction against the provider/gateway.              |
| `merchantWebhookReconciliation` | Whether the merchant webhook for this transaction was delivered and acknowledged. |

<Callout title="The wire field really is spelled reconcilation">
  `reconcilation` has one `i`, not two. That is the spelling in the API response — match it exactly when you parse, and don't "correct" it to `reconciliation`. Note that the neighbouring `merchantWebhookReconciliation` **is** spelled with two.
</Callout>

Both fields use the same four values:

| Value        | Meaning                                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OK`         | Reconciled and consistent. Kashier compared the two sides and they matched.                                                                                        |
| `Failed`     | Reconciliation ran but did not match, or could not be confirmed. Investigate this transaction.                                                                     |
| `Not_Exists` | The counterpart record was not found on the side being reconciled — for example the transaction is absent at the provider, or there is no webhook delivery record. |
| `NA`         | The default: **not yet reconciled**. Common on intermediate steps such as `3dsecure_verify` and `authenticate_payer`, which are not reconciled on their own.       |

<Callout type="warn" title="OK means reconciled, not succeeded">
  `OK` is a verdict about *agreement between two records*, not about the money. A transaction that failed at the provider and is correctly recorded as failed on both sides is also `reconcilation: "OK"`. To learn the outcome, read the transaction's own `status` (`SUCCESS`, `FAILURE`, `PENDING`, …) and `transactionResponseCode`. Never treat `OK` as a payment confirmation.
</Callout>

A transaction that Kashier declined on its own before it ever reached the acquirer carries `kashierBlocked: true`. Those transactions are excluded from the reconciliation jobs by design, so expect them to sit at `NA` permanently.

### Response structure [#response-structure]

```json
{
  "status": "SUCCESS",
  "message": "Orders retrieved successfully",
  "data": [
    {
      "_id": "68235607d26af80012b574cf",
      "order": {
        "amount": 11179.51,
        "currency": "EGP",
        "callbackURL": "https://checkouts.kashier.io/en/payment-request/68235534b463b10012cb893c"
      },
      "status": "CAPTURED",
      "isLockedForPaymentProcessing": false,
      "provider": "mpgs",
      "paymentAgreement": "regular",
      "providerReconcilationResults": [],
      "merchantId": "MID-123-123",
      "merchantDetails": {
        "storeName": "TEST-Demo",
        "MCC": "1111",
        "isLive": true,
        "businessIndustry": "Airline",
        "createdUserId": "5f8d0d55b54764421b7156c3",
        "businessEmail": "demo@example.com",
        "email": "merchant@example.com",
        "businessContactInfo": {
          "addressLine1": "cairo",
          "addressLine2": "nasr city",
          "governorate": "EG-C",
          "zipcode": "12345",
          "fax": "",
          "hotlineNumber": "123456",
          "landlineNumber": "123456"
        },
        "accountType": "PF",
        "subMerchantName": "Demo",
        "merchantIdentifier": "MID-123-123",
        "tradingName": "Demo",
        "merchantIdentifierBM": "1550000000",
        "businessAddress": "cairo nasr city",
        "apiKey": "YOUR_TEST_API_KEY",
        "merchantId": "MID-123-123",
        "webhook": {
          "MID": "MID-123-123",
          "apiKey": "YOUR_PAYMENT_API_KEY",
          "isEnabled": true,
          "url": "http://webhook_url.com"
        },
        "isTrustedMerchant": false,
        "enableNotEnrolled3DSCaptcha": false
      },
      "date": "2025-05-13T14:24:07.190Z",
      "orderReference": "TEST-ORD-193392644",
      "lastModifiedDate": "2025-05-13T14:24:11.277Z",
      "sessionId": "68235607d26af80012b574c9",
      "orderId": "3e9b9e27-9900-4b17-982e-763f6ffd106b",
      "merchantOrderId": "68235534b463b10012cb893c",
      "totalRefundedAmount": 0,
      "totalCapturedAmount": 11179.51,
      "totalAuthorizedAmount": 11179.51,
      "providerVersion": "68",
      "method": "card",
      "metaData": {
        "kashierOriginType": "paymentLink",
        "kashierOriginDetails": {
          "name": "page with reqular item",
          "id": "PL-2435857566",
          "customerName": "سلمى حسن عبدالله حسن"
        },
        "termsAndConditions": {
          "time": -3,
          "ip": "197.37.152.242",
          "userAgent": {
            "browser": "Firefox",
            "version": "138.0"
          }
        },
        "kashier payment UI version": "V3",
        "referral url": "https://checkouts.kashier.io/",
        "merchantWebhook": "http://webhook_url.com"
      },
      "sourceOfFunds": {
        "cardInfo": {
          "maskedCard": "512345******2346",
          "cardBrand": "Mastercard",
          "cardHolderName": "John Doe",
          "cardDataToken": "95d75151-8daa-4c89-ad19-2666f2dbec52",
          "ccvToken": "476a148b-0482-468e-a25d-87687c20d1cb",
          "expiryYear": "25",
          "expiryMonth": "06",
          "storedOnFile": "NOT_STORED",
          "save": false,
          "agreement": null
        }
      },
      "paymentOrigin": "PL-2435857566",
      "paymentType": "paymentLink",
      "apiKeyId": "YOUR_API_KEY_ID",
      "apiKeyName": "your-key-name",
      "paymentChannel": "online | e-commerce",
      "originalAmount": "11179.51",
      "authorizationAmount": "11179.51",
      "installmentAmountPerMonth": "0",
      "originDetails": {
        "name": "page with reqular item",
        "id": "PL-2435857566",
        "customerName": "سلمى حسن عبدالله حسن"
      },
      "serverWebhook": "<Kashier internal notification endpoint>",
      "transactions": [
        {
          "feeDetails": {
            "transaction": 0,
            "processing": 0
          },
          "reconcilation": "NA",
          "merchantWebhookReconciliation": "NA",
          "isCurrentlyReconciled": false,
          "isPF": true,
          "_id": "68235607d26af80012b574d0",
          "operation": "3dsecure_verify",
          "gateWayOperation": "INITIATE_AUTHENTICATION",
          "transactionId": "TX-24358575398",
          "amount": 11179.51,
          "currency": "EGP",
          "status": "SUCCESS",
          "feeTrxAmount": 0,
          "metaData": {
            "userAgent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:138.0) Gecko/20100101 Firefox/138.0"
          },
          "apmTraceId": "8ab33a4f6ebf919d28fdcf1ede7ff9b0",
          "requestDate": "2025-05-13T14:24:07.194Z",
          "responseDate": "2025-05-13T14:24:07.971Z",
          "transactionResponseCode": "AUTHENTICATION_IN_PROGRESS",
          "transactionResponseMessage": {
            "en": "Authentication in progress",
            "ar": "المصادقة قيد التقدم"
          }
        },
        {
          "feeDetails": {
            "transaction": 0,
            "processing": 0
          },
          "reconcilation": "NA",
          "merchantWebhookReconciliation": "NA",
          "isCurrentlyReconciled": false,
          "isPF": true,
          "_id": "68235609d26af80012b574e3",
          "operation": "authenticate_payer",
          "gateWayOperation": "AUTHENTICATE_PAYER",
          "transactionId": "TX-24358575399",
          "status": "SUCCESS",
          "amount": 11179.51,
          "currency": "EGP",
          "feeTrxAmount": 0,
          "requestDate": "2025-05-13T14:24:09.604Z",
          "targetedTransaction": "TX-24358575398",
          "targetedTransactionOperation": "3dsecure_verify",
          "apmTraceId": "50e5e86fa5fdd1a5e177a415b0355e98",
          "responseDate": "2025-05-13T14:24:10.267Z",
          "transactionResponseCode": "APPROVED",
          "transactionResponseMessage": {
            "en": "Approved",
            "ar": "تمت الموافقة"
          }
        },
        {
          "feeDetails": {
            "transaction": 0,
            "processing": 0
          },
          "reconcilation": "OK",
          "merchantWebhookReconciliation": "Failed",
          "isCurrentlyReconciled": false,
          "isPF": true,
          "_id": "6823560ad26af80012b574e8",
          "operation": "pay",
          "gateWayOperation": "PAY",
          "transactionId": "TX-24358575400",
          "status": "SUCCESS",
          "amount": 11179.51,
          "currency": "EGP",
          "feeTrxAmount": 0,
          "requestDate": "2025-05-13T14:24:10.283Z",
          "targetedTransaction": "TX-24358575398",
          "targetedTransactionOperation": "3dsecure_verify",
          "bankSettlementDate": "2025-05-13T14:24:11.267Z",
          "bankValueDate": "2025-05-14T07:00:00.000Z",
          "gatewayTransactionReference": "228001",
          "gatewayTransactionUniqueKey": "228001#3e9b9e27-9900-4b17-982e-763f6ffd106b",
          "responseDate": "2025-05-13T14:24:11.267Z",
          "settlementDate": "2025-05-13T14:24:11.267Z",
          "transactionResponseCode": "00",
          "transactionResponseMessage": {
            "en": "Approved",
            "ar": "تمت الموافقة"
          }
        }
      ],
      "apiOperation": null,
      "interChangeRate": "ON_US",
      "createdAt": "2025-05-13T14:24:07.201Z",
      "updatedAt": "2025-05-13T14:24:11.919Z",
      "__v": 0
    },
    {
      "_id": "68235370940bd50012e4e450",
      "order": {
        "amount": 11179.51,
        "currency": "EGP",
        "callbackURL": "https://checkouts.kashier.io/en/payment-request/68221102b463b10012cb80fb"
      },
      "status": "CAPTURED",
      "isLockedForPaymentProcessing": false,
      "provider": "mpgs",
      "paymentAgreement": "regular",
      "providerReconcilationResults": [],
      "merchantId": "MID-123-123",
      "merchantDetails": {
        "storeName": "TEST-Demo",
        "MCC": "1111",
        "isLive": true,
        "businessIndustry": "Airline",
        "createdUserId": "5f8d0d55b54764421b7156c3",
        "businessEmail": "demo@example.com",
        "email": "merchant@example.com",
        "businessContactInfo": {
          "addressLine1": "cairo",
          "addressLine2": "nasr city",
          "governorate": "EG-C",
          "zipcode": "12345",
          "fax": "",
          "hotlineNumber": "123456",
          "landlineNumber": "123456"
        },
        "accountType": "PF",
        "subMerchantName": "Demo",
        "merchantIdentifier": "MID-123-123",
        "tradingName": "Demo",
        "merchantIdentifierBM": "1550000000",
        "businessAddress": "cairo nasr city",
        "apiKey": "YOUR_TEST_API_KEY",
        "merchantId": "MID-123-123",
        "webhook": {
          "MID": "MID-123-123",
          "apiKey": "YOUR_PAYMENT_API_KEY",
          "isEnabled": true,
          "url": "http://webhook_url.com"
        },
        "isTrustedMerchant": false,
        "enableNotEnrolled3DSCaptcha": false
      },
      "date": "2025-05-13T14:13:04.956Z",
      "orderReference": "TEST-ORD-193392643",
      "lastModifiedDate": "2025-05-13T14:13:09.603Z",
      "sessionId": "68235370940bd50012e4e44a",
      "orderId": "d4240d56-49b7-44ca-a12d-e46ab1f22ca0",
      "merchantOrderId": "68221102b463b10012cb80fb",
      "totalRefundedAmount": 0,
      "totalCapturedAmount": 11179.51,
      "totalAuthorizedAmount": 11179.51,
      "providerVersion": "68",
      "method": "card",
      "metaData": {
        "kashierOriginType": "paymentLink",
        "kashierOriginDetails": {
          "name": "page with reqular item",
          "id": "PL-2435857563",
          "customerName": "سلمى حسن عبدالله حسن"
        },
        "termsAndConditions": {
          "time": -3,
          "ip": "197.37.152.242",
          "userAgent": {
            "browser": "Firefox",
            "version": "138.0"
          }
        },
        "kashier payment UI version": "V3",
        "referral url": "https://checkouts.kashier.io/",
        "merchantWebhook": "http://webhook_url.com"
      },
      "sourceOfFunds": {
        "cardInfo": {
          "maskedCard": "512345******2346",
          "cardBrand": "Mastercard",
          "cardHolderName": "John Doe",
          "cardDataToken": "c9024ffb-bb25-4426-b793-954d89f6ff2b",
          "ccvToken": "c29a5430-7077-41f2-832a-36ced1f1caf2",
          "expiryYear": "25",
          "expiryMonth": "06",
          "storedOnFile": "NOT_STORED",
          "save": false,
          "agreement": null
        }
      },
      "paymentOrigin": "PL-2435857563",
      "paymentType": "paymentLink",
      "apiKeyId": "YOUR_API_KEY_ID",
      "apiKeyName": "your-key-name",
      "paymentChannel": "online | e-commerce",
      "originalAmount": "11179.51",
      "authorizationAmount": "11179.51",
      "installmentAmountPerMonth": "0",
      "originDetails": {
        "name": "page with reqular item",
        "id": "PL-2435857563",
        "customerName": "سلمى حسن عبدالله حسن"
      },
      "serverWebhook": "<Kashier internal notification endpoint>",
      "transactions": [
        {
          "feeDetails": {
            "transaction": 0,
            "processing": 0
          },
          "reconcilation": "NA",
          "merchantWebhookReconciliation": "NA",
          "isCurrentlyReconciled": false,
          "isPF": true,
          "_id": "68235370940bd50012e4e451",
          "operation": "3dsecure_verify",
          "gateWayOperation": "INITIATE_AUTHENTICATION",
          "transactionId": "TX-24358575395",
          "amount": 11179.51,
          "currency": "EGP",
          "status": "SUCCESS",
          "feeTrxAmount": 0,
          "metaData": {
            "userAgent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:138.0) Gecko/20100101 Firefox/138.0"
          },
          "apmTraceId": "2ba18c663f73da63d44ba2bda730e382",
          "requestDate": "2025-05-13T14:13:04.961Z",
          "responseDate": "2025-05-13T14:13:06.005Z",
          "transactionResponseCode": "AUTHENTICATION_IN_PROGRESS",
          "transactionResponseMessage": {
            "en": "Authentication in progress",
            "ar": "المصادقة قيد التقدم"
          }
        },
        {
          "feeDetails": {
            "transaction": 0,
            "processing": 0
          },
          "reconcilation": "NA",
          "merchantWebhookReconciliation": "NA",
          "isCurrentlyReconciled": false,
          "isPF": true,
          "_id": "68235373940bd50012e4e464",
          "operation": "authenticate_payer",
          "gateWayOperation": "AUTHENTICATE_PAYER",
          "transactionId": "TX-24358575396",
          "status": "SUCCESS",
          "amount": 11179.51,
          "currency": "EGP",
          "feeTrxAmount": 0,
          "requestDate": "2025-05-13T14:13:07.839Z",
          "targetedTransaction": "TX-24358575395",
          "targetedTransactionOperation": "3dsecure_verify",
          "apmTraceId": "91cbdb5e9d8ae1c70c4c9aebc9ede652",
          "responseDate": "2025-05-13T14:13:08.572Z",
          "transactionResponseCode": "APPROVED",
          "transactionResponseMessage": {
            "en": "Approved",
            "ar": "تمت الموافقة"
          }
        },
        {
          "feeDetails": {
            "transaction": 0,
            "processing": 0
          },
          "reconcilation": "OK",
          "merchantWebhookReconciliation": "Failed",
          "isCurrentlyReconciled": false,
          "isPF": true,
          "_id": "68235374940bd50012e4e469",
          "operation": "pay",
          "gateWayOperation": "PAY",
          "transactionId": "TX-24358575397",
          "status": "SUCCESS",
          "amount": 11179.51,
          "currency": "EGP",
          "feeTrxAmount": 0,
          "requestDate": "2025-05-13T14:13:08.585Z",
          "targetedTransaction": "TX-24358575395",
          "targetedTransactionOperation": "3dsecure_verify",
          "bankSettlementDate": "2025-05-13T14:13:09.591Z",
          "bankValueDate": "2025-05-14T07:00:00.000Z",
          "gatewayTransactionReference": "226991",
          "gatewayTransactionUniqueKey": "226991#d4240d56-49b7-44ca-a12d-e46ab1f22ca0",
          "responseDate": "2025-05-13T14:13:09.591Z",
          "settlementDate": "2025-05-13T14:13:09.591Z",
          "transactionResponseCode": "00",
          "transactionResponseMessage": {
            "en": "Approved",
            "ar": "تمت الموافقة"
          }
        }
      ],
      "apiOperation": null,
      "interChangeRate": "ON_US",
      "createdAt": "2025-05-13T14:13:04.970Z",
      "updatedAt": "2025-05-13T14:13:10.210Z",
      "__v": 0
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

# Payment links (/docs/accept-payments/payment-links)

Create and share payment links your customers can open and pay — no integration required. This API lets you:

- **Create customer-specific links** — one link per customer.
- **Create links in bulk** — generate links for many customers at once.
- **Use currency conversion** — create links in a foreign "virtual" currency (e.g. `USD_VIRTUAL`) that settles in EGP; the customer pays the EGP equivalent at the applicable exchange rate. Requires the currency conversion feature to be enabled on your account.

## Get all payment links [#get-all-payment-links]

| Endpoint | Value                                                                                      |
| -------- | ------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/payment-link](https://test-api.kashier.io/v2/payment-link) |
| LIVE-URL | [https://api.kashier.io/v2/payment-link](https://api.kashier.io/v2/payment-link)           |
| Method   | GET                                                                                        |

Full parameter and response reference → [List payment links](/docs/api-reference/payment-links/listPaymentLinks).

### Parameters [#parameters]

<Accordions type="multiple">
  <Accordion title="Parameter reference">
    | Parameter        | Type            | Description                                                                                                                                                                                                                                 |
    | ---------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | currency         | Query Parameter | Filter based on currency (example: EGP). If the currency conversion feature is enabled on your account, you can also filter by a virtual currency view code (example: `USD_VIRTUAL`) to get payment links created in that foreign currency. |
    | state            | Query Parameter | Payment link state.                                                                                                                                                                                                                         |
    | startDueDate     | Query Parameter | Start due date.                                                                                                                                                                                                                             |
    | endDueDate       | Query Parameter | End due date.                                                                                                                                                                                                                               |
    | startAmountRange | Query Parameter | Start amount range.                                                                                                                                                                                                                         |
    | endAmountRange   | Query Parameter | End amount range.                                                                                                                                                                                                                           |
    | startDate        | Query Parameter | Start date.                                                                                                                                                                                                                                 |
    | endDate          | Query Parameter | End date.                                                                                                                                                                                                                                   |
    | paymentStatus    | Query Parameter | Payment state (example: PAID, UNPAID, OVERDUE, EXPIRED).                                                                                                                                                                                    |
    | paymentType      | Query Parameter | Payment type (example: FIXED\_AMOUNT, ITEMIZED).                                                                                                                                                                                            |
    | search           | Query Parameter | Search for a payment link by its id (example: PL-2348668602).                                                                                                                                                                               |
    | page             | Query Parameter | Current page number (used for pagination).                                                                                                                                                                                                  |
    | limit            | Query Parameter | Number of items per page (used for pagination).                                                                                                                                                                                             |
  </Accordion>
</Accordions>

### Headers [#headers]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl --location 'https://test-api.kashier.io/v2/payment-link?
      currency=EGP&state=&startAmountRange=&endAmountRange=&paymentStatus=paid&search=&page=1&limit=10'
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
  --header 'Accept: application/json'
```

<ApiTryIt title="Try it — list payment links" method="GET" url="https://test-api.kashier.io/v2/payment-link" sendApiKey="false" />

Full parameter and response reference → [Get all payment links](/docs/api-reference/payment-links/listPaymentLinks).

The virtual currency fields (virtualAmount, virtualCurrency, etc.) and exchangeRateServiceAvailable only apply to [currency conversion](#currency-conversion) payment links.

## Get payment link details [#get-payment-link-details]

| Endpoint | Value                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/payment-link/:paymentLinkId](https://test-api.kashier.io/v2/payment-link/:paymentLinkId) |
| LIVE-URL | [https://api.kashier.io/v2/payment-link/:paymentLinkId](https://api.kashier.io/v2/payment-link/:paymentLinkId)           |
| Method   | GET                                                                                                                      |

Full parameter and response reference → [Get payment link details](/docs/api-reference/payment-links/getPaymentLink).

### Headers [#headers-1]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl --location 'https://test-api.kashier.io/v2/payment-link/:paymentLinkId'
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
  --header 'Accept: application/json'
```

<ApiTryIt title="Try it — payment link details" method="GET" url="https://test-api.kashier.io/v2/payment-link/:paymentLinkId" sendApiKey="false" />

Full parameter and response reference → [Get payment link details](/docs/api-reference/payment-links/getPaymentLink).

The virtual currency fields are null unless the link was created with a [currency conversion](#currency-conversion) currency.

## Create a payment link [#create-a-payment-link]

| Endpoint | Value                                                                                      |
| -------- | ------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/payment-link](https://test-api.kashier.io/v2/payment-link) |
| LIVE-URL | [https://api.kashier.io/v2/payment-link](https://api.kashier.io/v2/payment-link)           |
| Method   | POST                                                                                       |

Full parameter and response reference → [Create a payment link](/docs/api-reference/payment-links/createPaymentLink).

### Headers [#headers-2]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl --location 'https://test-api.kashier.io/v2/payment-link'
--header 'Content-Type: application/json'
--header 'Authorization: YOUR_TEST_SECRET_KEY'
--data '{
  "customer":{
      "name":"John Doe"
  },
  "totalAmount": 200,
  "description": "",
  "isManualCapture": false,
  "paymentType": "simple",
  "currency": "EGP",
  "state": "submitted",
  "extraFees": [
          {
              "name": "VAT",
              "flatFee": 0,
              "rate": 5
          },
          {
              "name": "annualFee",
              "flatFee": 500,
              "rate": 0
          }
      ],
   "dueDate":"2027-12-27T21:59:00.000Z",
   "isSuspendedPayment": false,
   "referenceId":"123ss456"
}'
```

<ApiTryIt
  title="Try it — create payment link"
  method="POST"
  url="https://test-api.kashier.io/v2/payment-link"
  body="{
  customer: {
    name: 'John Doe',
  },
  totalAmount: 200,
  description: '',
  isManualCapture: false,
  paymentType: 'simple',
  currency: 'EGP',
  state: 'submitted',
  extraFees: [
    {
      name: 'VAT',
      flatFee: 0,
      rate: 5,
    },
    {
      name: 'annualFee',
      flatFee: 500,
      rate: 0,
    },
  ],
  dueDate: '2027-12-27T21:59:00.000Z',
  isSuspendedPayment: false,
  referenceId: '123ss456',
}"
  sendApiKey="false"
/>

Full parameter and response reference → [Create a payment link](/docs/api-reference/payment-links/createPaymentLink).

### Currency conversion [#currency-conversion]

Set currency to a virtual currency code (`USD_VIRTUAL`, `EUR_VIRTUAL`, `GBP_VIRTUAL`, `SAR_VIRTUAL`, `AED_VIRTUAL`) with totalAmount expressed in that currency to collect payment in a foreign currency while settling in EGP.

<Callout title="Important">
  Requires the currency conversion feature — contact Kashier's backoffice/support to enable it. Without it, a virtual currency returns a 400: "Currency conversion feature is not enabled."
</Callout>

```bash
curl --location 'https://test-api.kashier.io/v2/payment-link'
--header 'Content-Type: application/json'
--header 'Authorization: YOUR_TEST_SECRET_KEY'
--data '{
  "customer":{
      "name":"John Doe"
  },
  "totalAmount": 40,
  "description": "",
  "isManualCapture": false,
  "paymentType": "simple",
  "currency": "USD_VIRTUAL",
  "state": "submitted",
  "extraFees": [],
   "isSuspendedPayment": false,
   "referenceId":"123ss456"
}'
```

## Payment links bulk upload [#payment-links-bulk-upload]

Bulk uploading payment links consists of two steps:

1. Upload the data for review using the /import endpoint.
2. Save the data if it is valid using the correlationId returned from the /import step.
   - If errors are found in the data, they will be returned for correction.
   - If validation passes, the API returns a correlationId.
   - The correlationId serves as a reference to your validated data.

### Uploading the sheet for review [#uploading-the-sheet-for-review]

First, you need to upload the Excel sheet for review:

| Endpoint | Value                                                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/paymentRequest/import?currency=EGP](https://test-api.kashier.io/v2/paymentRequest/import?currency=EGP) |
| LIVE-URL | [https://api.kashier.io/v2/paymentRequest/import?currency=EGP](https://api.kashier.io/v2/paymentRequest/import?currency=EGP)           |
| Method   | POST                                                                                                                                   |

Replace currency=EGP with a virtual currency code (e.g. currency=USD\_VIRTUAL) to bulk-upload payment links in a foreign currency — see [currency conversion](#currency-conversion). This requires the currency conversion feature to be enabled on your account.

#### Headers [#headers-3]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl 'https://test-api.kashier.io/v2/paymentRequest/import?currency=EGP'
-X POST
-H 'Authorization: YOUR_TEST_SECRET_KEY'
-H 'Access-Control-Allow-Origin: *'
-H 'Content-Type: multipart/form-data; boundary=----geckoformboundary9c673decdbea595725978e0df26aa91b'
--data-binary
$'------geckoformboundary9c673decdbea595725978e0df26aa91b
Content-Disposition: form-data; name="file"; filename="payment-link-temp-updated.xlsx"
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

------geckoformboundary9c673decdbea595725978e0df26aa91b--
'
```

<Callout title="Note">
  The **Content-Type** in the request header must be set to multipart/form-data, since you are uploading an Excel sheet in the request body.
</Callout>

#### Response structure [#response-structure]

```json
{
  "body": {
    "paymentRequests": [
      {
        "isSuspendedPayment": false,
        "merchantId": "MID-XXXXX-XXX",
        "storeName": "TEST-Demo",
        "invoiceReferenceId": "Abc_123456",
        "paymentType": "professional",
        "totalAmount": "1102.50",
        "availableAmountForRefund": "0.00",
        "totalAmountWithoutFees": "1050.00",
        "description": "",
        "creationDate": "2025-08-26T10:01:58.991Z",
        "dueDate": null,
        "invoiceItems": [
          {
            "description": "product 1 name",
            "quantity": "3",
            "unitPrice": "100.00",
            "subTotal": "300.00"
          },
          {
            "description": "product 2 name",
            "quantity": "5",
            "unitPrice": "150.00",
            "subTotal": "750.00"
          }
        ],
        "customerName": "Ahmed Mohamed",
        "extraFees": [
          {
            "name": "Fee1 Name",
            "flatFee": 0,
            "rate": 2
          },
          {
            "name": "Fee 2 name",
            "flatFee": 10,
            "rate": 0
          },
          {
            "name": "vat",
            "flatFee": 0,
            "rate": 5
          }
        ],
        "currency": "EGP",
        "state": "submitted",
        "paymentStatus": "unpaid",
        "paymentRequestId": "INV-24358575125",
        "paymentLinkId": "PL-24358575125",
        "merchantInfo": {
          "storeName": "TEST-Demo"
        },
        "createdByUserId": "5f8d0d55b54764421b7156c3",
        "isPaymentLink": true,
        "isBulkCreated": true,
        "referenceId": "Abc_123456",
        "labels": ["Label 1", " Label 2", " Label 3"],
        "errors": null
      }
    ],
    "correlationId": "508cf034-447a-4a14-8154-09b50c14a6c6"
  },
  "message": "Imported successfully"
}
```

### Saving the uploaded payment links [#saving-the-uploaded-payment-links]

If the uploaded data passes validation during the review step, you can save it to the database using the correlationId returned in the /import response.

| Endpoint | Value                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/paymentRequest/saveInvoice?correlationId=:correlationId\&operation=save](https://test-api.kashier.io/v2/paymentRequest/saveInvoice?correlationId=:correlationId&operation=save) |
| LIVE-URL | [https://api.kashier.io/v2/paymentRequest/saveInvoice?correlationId=:correlationId\&operation=save](https://api.kashier.io/v2/paymentRequest/saveInvoice?correlationId=:correlationId&operation=save)           |
| Method   | POST                                                                                                                                                                                                            |

Full parameter and response reference → [Save bulk-uploaded payment links](/docs/api-reference/payment-links/saveImportedPaymentLinks).

#### Headers [#headers-4]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

The request carries no body — the `correlationId` from the import step identifies the validated rows, and `operation=save` says what to do with them.

```bash
curl 'https://test-api.kashier.io/v2/paymentRequest/saveInvoice?correlationId=:correlationId&operation=save'
-X POST
-H 'Accept: application/json, text/plain, */*'
-H 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt title="Try it — save bulk payment links" method="POST" url="https://test-api.kashier.io/v2/paymentRequest/saveInvoice?correlationId=:correlationId&operation=save" sendApiKey="false" />

Full parameter and response reference → [Save the uploaded payment links](/docs/api-reference/payment-links/saveImportedPaymentLinks).

## Update a payment link [#update-a-payment-link]

| Endpoint | Value                                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/payment-link/paymentLinkId](https://test-api.kashier.io/v2/payment-link/paymentLinkId) |
| LIVE-URL | [https://api.kashier.io/v2/payment-link/paymentLinkId](https://api.kashier.io/v2/payment-link/paymentLinkId)           |
| Method   | PUT                                                                                                                    |

Full parameter and response reference → [Update payment link](/docs/api-reference/payment-links/updatePaymentLink).

### Headers [#headers-5]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl --location --request PUT 'https://test-api.kashier.io/v2/payment-link/{{paymentLinkId}}'
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
  --header 'Content-Type: application/json'
  --data '{
      "paymentLink":{
          "customer":{
              "name":"John doe"
          },
          "totalAmount": 200,
          "description": "",
          "isManualCapture": false,
          "paymentType": "simple",
          "currency": "EGP",
          "state": "submitted",
          "extraFees": [
              { "name": "tax", "flatFee": 0, "rate": 5 },
              { "name": "taxen", "flatFee": 0, "rate": 10 }
          ]
      }
  }'
```

<ApiTryIt
  title="Try it — update payment link"
  method="PUT"
  url="https://test-api.kashier.io/v2/payment-link/:paymentLinkId"
  body="{
  paymentLink: {
    customer: {
      name: 'John doe',
    },
    totalAmount: 200,
    description: '',
    isManualCapture: false,
    paymentType: 'simple',
    currency: 'EGP',
    state: 'submitted',
    extraFees: [
      { name: 'tax', flatFee: 0, rate: 5 },
      { name: 'taxen', flatFee: 0, rate: 10 },
    ],
  },
}"
  sendApiKey="false"
/>

## Delete a payment link [#delete-a-payment-link]

| Endpoint | Value                                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/payment-link/paymentLinkId](https://test-api.kashier.io/v2/payment-link/paymentLinkId) |
| LIVE-URL | [https://api.kashier.io/v2/payment-link/paymentLinkId](https://api.kashier.io/v2/payment-link/paymentLinkId)           |
| Method   | DELETE                                                                                                                 |

Full parameter and response reference → [Delete payment link](/docs/api-reference/payment-links/deletePaymentLink).

### Headers [#headers-6]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl --location --request DELETE 'https://test-api.kashier.io/v2/payment-link/{{paymentLinkId}}'
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt title="Try it — delete payment link" method="DELETE" url="https://test-api.kashier.io/v2/payment-link/:paymentLinkId" sendApiKey="false" />

## Share a payment link [#share-a-payment-link]

| Endpoint | Value                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/payment-link/share](https://test-api.kashier.io/v2/payment-link/share) |
| LIVE-URL | [https://api.kashier.io/v2/payment-link/share](https://api.kashier.io/v2/payment-link/share)           |
| Method   | POST                                                                                                   |

Full parameter and response reference → [Share payment link](/docs/api-reference/payment-links/sharePaymentLink).

### Headers [#headers-7]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl --location 'https://test-api.kashier.io/v2/payment-link/share'
--header 'Authorization: YOUR_TEST_SECRET_KEY'
--header 'Content-Type: application/json'
--data-raw '{
  "operation": "email",// sms, email
  "urlIdentifier": "PL-ABC123DEF456",
  "key": "customer@example.com"
}'
```

### Body parameters [#body-parameters]

| Key             | Required | Description                                                                                                                             |
| --------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `operation`     | yes      | `email` or `phone` — how the link is delivered.                                                                                         |
| `key`           | yes      | The email address or phone number to send it to.                                                                                        |
| `urlIdentifier` | yes      | The payment link's identifier, in the `PL-…` form returned by [Create a payment link](#create-a-payment-link) — not the internal `_id`. |
| `countryCode`   | no       | Country code for `phone`, in `+XXX` form (for example `+20`).                                                                           |

<Callout type="warn" title="This panel sends a real message">
  Replace both `urlIdentifier` and `key` below before sending — `PL-ABC123DEF456` is a placeholder and will be rejected, and a valid link plus a real address genuinely emails or texts the recipient.
</Callout>

<ApiTryIt
  title="Try it — share payment link"
  method="POST"
  url="https://test-api.kashier.io/v2/payment-link/share"
  body="{
  operation: 'email',
  urlIdentifier: 'PL-ABC123DEF456',
  key: 'customer@example.com',
}"
  sendApiKey="false"
/>

Full parameter and response reference → [Share a payment link](/docs/api-reference/payment-links/sharePaymentLink).

## Export payment links [#export-payment-links]

| Endpoint | Value                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/payment-link/export](https://test-api.kashier.io/v2/payment-link/export) |
| LIVE-URL | [https://api.kashier.io/v2/payment-link/export](https://api.kashier.io/v2/payment-link/export)           |
| Method   | POST                                                                                                     |

Full parameter and response reference → [Export payment links](/docs/api-reference/payment-links/exportPaymentLinks).

<Callout title="The export arrives by email">
  This endpoint does not stream a file back. It queues the export and emails it — the response only acknowledges that the email was sent. Requires the payment-link export permission on your key.
</Callout>

### Query parameters [#query-parameters]

The export takes the same filters as [Get all payment links](#get-all-payment-links), narrowing which links end up in the file, plus:

| Key         | Description                           |
| ----------- | ------------------------------------- |
| `email`     | Address to send the export to.        |
| `branchIds` | Comma-separated branch IDs to export. |

The export takes no request body — the filters above are the whole request.

### Headers [#headers-8]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl --location --request POST 'https://test-api.kashier.io/v2/payment-link/export?limit=20&page=1&sortType=-1&paymentType=all&currency=EGP'
--header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt title="Try it — export payment links" method="POST" url="https://test-api.kashier.io/v2/payment-link/export?limit=20&page=1&sortType=-1&paymentType=all&currency=EGP" sendApiKey="false" />

Full parameter and response reference → [Export payment links](/docs/api-reference/payment-links/exportPaymentLinks).

## Mark as paid [#mark-as-paid]

| Endpoint | Value                                                                          |
| -------- | ------------------------------------------------------------------------------ |
| TEST-URL | [https://test-fep.kashier.io/v3/orders](https://test-fep.kashier.io/v3/orders) |
| LIVE-URL | [https://fep.kashier.io/v3/orders](https://fep.kashier.io/v3/orders)           |
| Method   | POST                                                                           |

Full parameter and response reference → [Pay with a card token, or mark a payment link as paid](/docs/api-reference/tokens/payWithToken).

### Headers [#headers-9]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl --location 'https://test-fep.kashier.io/v3/orders'
--header 'Authorization: YOUR_TEST_SECRET_KEY'
--header 'Content-Type: application/json'
--data '
{
 "order":{
    "reference":"67c59e14e626cf0012fdb9de",
    "amount":65,
    "currency":"EGP"
 },
 "origin":{
    "id":"PL-XXXXXXXXXX"
 },
 "apiOperation":"PAY",
 "interactionSource":"ECOMMERCE",
 "paymentMethod":{
    "type":"cash"
 },
 "metaData":{
    "kashierOriginType":"paymentLink",
    "kashierOriginDetails":{
       "name":"",
       "id":"PL-XXXXXXXXXX",
       "customerName":"bashar",
       "createdUserId":"5f8d0d55b54764421b7156c3"
    }
 }
}'
```

<Callout title="No 'Try it' panel for this one">
  Every identifier in this body has to come from your own account — the `PL-…` link ID in `origin.id`, the order reference, and the `createdUserId` of the dashboard user recording the payment. There's no placeholder set that produces a valid request, so a runnable panel here would only ever return a `400` — "This request is invalid". Fill the values above into the curl and run it against your own test account instead. Note that a successful call records a real cash payment against the link and moves it to `paid`.
</Callout>

### Body description [#body-description]

<Accordions type="multiple">
  <Accordion title="Field reference">
    | Key                                         | Description                                                                                                                         |
    | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
    | order.reference                             | A unique identifier for the order (e.g., "6773fa351652132156d37f7b").                                                               |
    | order.amount                                | The total amount of the order (e.g., 200).                                                                                          |
    | order.currency                              | The currency in which the transaction is processed (e.g., 'EGP' for Egyptian Pounds).                                               |
    | origin.id                                   | A unique identifier for the origin of the payment request, such as an invoice number (e.g., "INV-2334424102").                      |
    | apiOperation                                | Specifies the operation being performed. 'PAY' indicates that this is a payment request.                                            |
    | interactionSource                           | Defines where the payment is initiated from. "ECOMMERCE" indicates that the payment is processed online via an e-commerce platform. |
    | paymentMethod                               | The payment method type (e.g., "cash").                                                                                             |
    | metaData.kashierOriginType                  | The type of origin associated with the payment (e.g., "paymentLink").                                                               |
    | metaData.kashierOriginDetails.id            | The unique identifier of the origin (e.g., "PL-2435857557").                                                                        |
    | metaData.kashierOriginDetails.customerName  | The name of the customer associated with this payment (e.g., "John doe").                                                           |
    | metaData.kashierOriginDetails.createdUserId | The user ID of the person who created this transaction (e.g., "5f8d0d55b54764421b7156c3").                                          |
  </Accordion>
</Accordions>

### Response structure [#response-structure-1]

```json
{
  "response": {
    "apiOperation": "PAY",
    "operation": "pay",
    "currency": "EGP",
    "result": "SUCCESS",
    "status": "SUCCESS",
    "authorizationNumber": "",
    "authentication": {},
    "paymentMethod": {
      "type": "cash"
    },
    "metaData": {
      "kashierOriginType": "paymentLink",
      "kashierOriginDetails": {
        "name": "",
        "id": "PL-XXXXXXXXXX",
        "customerName": "John",
        "createdUserId": "5f8d0d55b54764421b7156c3"
      },
      "termsAndConditions": {
        "ip": "197.37.122.82"
      },
      "kashier_user": {
        "id": "5f8d0d55b54764421b7156c3",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "selectedMID": "MID-XXXXX-XXX"
      },
      "merchantWebhook": "https://your-website.com/kashier-webhook"
    },
    "origin": {
      "name": "",
      "id": "PL-XXXXXXXXXX",
      "customerName": "John Doe",
      "createdUserId": "5f8d0d55b54764421b7156c3"
    },
    "reconciliation": {
      "webhookUrl": "<Kashier internal notification endpoint>",
      "redirect": false
    },
    "merchantId": "MID-XXXXX-XXX",
    "order": {
      "amount": 65,
      "currency": "EGP",
      "systemOrderId": "d2e68974-5a5c-48eb-8f5f-6bd54ccbe830",
      "reference": "67c59e14e626cf0012fdb9de"
    },
    "amount": 65,
    "totalRefundedAmount": 0,
    "totalCapturedAmount": 65,
    "totalAuthorizedAmount": 65,
    "method": "cash",
    "creationDate": "2025-03-03T14:20:27.492Z",
    "orderId": "d2e68974-5a5c-48eb-8f5f-6bd54ccbe830",
    "provider": "cash",
    "merchantOrderId": "67c59e14e626cf0012fdb9de",
    "orderReference": "TEST-ORD-193387945",
    "paymentType": "paymentLink",
    "interactionSource": "Online",
    "device": {
      "ipAddress": "197.37.122.82"
    },
    "transactionId": "TX-24358575179",
    "transactionResponseCode": "00",
    "transactionResponseMessage": {
      "en": "Approved",
      "ar": "تمت الموافقة"
    }
  },
  "messages": {
    "en": "Approved",
    "ar": "تمت الموافقة"
  },
  "status": "SUCCESS",
  "showCaptcha": false
}
```

# Payment reason codes (/docs/accept-payments/payment-reason-codes)

Every payment outcome carries a `transactionResponseCode` and a bilingual `transactionResponseMessage` object (`{ en, ar }`). Both appear on webhook payloads, in [order reconciliation](/docs/accept-payments/order-reconciliation) responses, and in transaction responses — a declined authorisation still returns HTTP 200 with the reason in the code.

Branch on both `status` and `transactionResponseCode`. Matching is exact and case-sensitive: compare against the codes exactly as written here, including lowercase `k_*`. Blank Arabic cells mean no Arabic message is published for that code.

## ISO numeric codes [#iso-numeric-codes]

Each numeric code is stored and returned individually. There are no range values — you will receive `47`, never `46-50`.

<Accordions type="multiple">
  <Accordion title="All ISO numeric codes">
    | transactionResponseCode | transactionResponseMessage - en                                                                                             | transactionResponseMessage - ar                                                       |
    | ----------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
    | `0`                     | Success                                                                                                                     |                                                                                       |
    | `00`                    | Approved                                                                                                                    | تمت الموافقة                                                                          |
    | `01`                    | Your bank was not able to process the transaction                                                                           | البنك المصدر للبطاقة غير قادرًا على معالجة المعاملة                                   |
    | `02`                    | Refer to card issuer's special conditions                                                                                   | يرجى الرجوع إلى جهة إصدار البطاقة                                                     |
    | `03`                    | Invalid merchant                                                                                                            | تاجر غير صالح                                                                         |
    | `04`                    | Pick-up lost card detected                                                                                                  | إلتقط البطاقة ، تم الإبلاغ عن سرقتها أو ضياعها                                        |
    | `05`                    | Do not honor, please retry or contact your issuer bank.                                                                     | غير مقبول، يرجى إعادة المحاولة أو الاتصال بالبنك المصدر بالبطاقة                      |
    | `06`                    | Error                                                                                                                       | خطأ في الدفع                                                                          |
    | `07`                    | Pick-up card, special condition                                                                                             | إلتقط البطاقة ، تم الإبلاغ عن سرقتها أو ضياعها                                        |
    | `08`                    | Honour with identification                                                                                                  | مقبول مع تحديد الهوية                                                                 |
    | `09`                    | Request in progress                                                                                                         | طلب قيد التقدم                                                                        |
    | `10`                    | Approved for partial amount                                                                                                 | تمت الموافقة على المبلغ الجزئي                                                        |
    | `11`                    | Approved (VIP)                                                                                                              | موافقة كبار الشخصيات                                                                  |
    | `12`                    | Your bank was not able to process the transaction                                                                           | البنك المصدر للبطاقة غير قادرًا على معالجة المعاملة                                   |
    | `13`                    | Invalid amount, please contact the merchant                                                                                 | مبلغ غير صحيح ، يرجى الاتصال بالتاجر                                                  |
    | `14`                    | Invalid card information.                                                                                                   | بيانات البطاقة غير صحيحة.                                                             |
    | `15`                    | No such issuer                                                                                                              | لا يوجد مثل هذا المصدر                                                                |
    | `16`                    | Approved                                                                                                                    | عملية مقبولة                                                                          |
    | `17`                    | Customer cancellation                                                                                                       | إلغاء العميل                                                                          |
    | `18`                    | Customer dispute                                                                                                            | نزاع العميل                                                                           |
    | `19`                    | Re-enter transaction                                                                                                        | أعد إدخال المعاملة                                                                    |
    | `20`                    | Invalid response                                                                                                            | استجابة غير صالحة                                                                     |
    | `21`                    | No action taken                                                                                                             | لم يتم اتخاذ أي إجراء                                                                 |
    | `22`                    | Suspected malfunction                                                                                                       | عطل مشتبه به                                                                          |
    | `23`                    | Unacceptable transaction fee                                                                                                | رسوم المعاملات غير مقبولة                                                             |
    | `24`                    | File update not supported by receiver                                                                                       | تم رفض الدفع                                                                          |
    | `25`                    | Unable to locate record on file                                                                                             | تم رفض الدفع                                                                          |
    | `26`                    | Duplicate file update record, old record replaced                                                                           | تم رفض الدفع                                                                          |
    | `27`                    | File update field edit error                                                                                                | تم رفض الدفع                                                                          |
    | `28`                    | File update file locked out                                                                                                 | تم رفض الدفع                                                                          |
    | `29`                    | File update not successful, contact acquirer                                                                                | تم رفض الدفع                                                                          |
    | `30`                    | Format error                                                                                                                | خطأ في التنسيق                                                                        |
    | `31`                    | Bank not supported by switch                                                                                                | البنك غير مدعوم                                                                       |
    | `32`                    | Completed partially                                                                                                         | اكتمل جزئيا                                                                           |
    | `33`                    | Expired card                                                                                                                | بطاقة منتهية الصلاحية                                                                 |
    | `34`                    | Suspected fraud                                                                                                             | يشتبه في الاحتيال                                                                     |
    | `35`                    | Card acceptor contact acquirer                                                                                              | عملية مرفوضة                                                                          |
    | `36`                    | Restricted card, please contact your bank.                                                                                  | بطاقة محظورة ، يرجى الاتصال بالبنك المصدر للبطاقة.                                    |
    | `37`                    | Card acceptor call acquirer security                                                                                        | عملية مرفوضة                                                                          |
    | `38`                    | Allowable PIN tries exceeded                                                                                                | تم تجاوز عدد محاولات PIN المسموح بها                                                  |
    | `39`                    | No credit account                                                                                                           | لا يوجد حساب ائتمان                                                                   |
    | `40`                    | Requested function not supported                                                                                            | الوظيفة المطلوبة غير مدعومة                                                           |
    | `41`                    | Lost card                                                                                                                   | البطاقة مفقودة                                                                        |
    | `42`                    | Your bank was not able to process the transaction                                                                           | البنك المصدر للبطاقة غير قادرًا على معالجة المعاملة                                   |
    | `43`                    | Stolen card, pick-up                                                                                                        | بطاقة مسروقة                                                                          |
    | `44`                    | No investment account                                                                                                       | لا يوجد حساب استثماري                                                                 |
    | `45`                    | Declined, Contact card issuer.                                                                                              | عملية مرفوضة ، يرجى الاتصال بجهة مصدر البطاقة.                                        |
    | `46`                    | Declined, Contact card issuer.                                                                                              | عملية مرفوضة ، يرجى الاتصال بجهة مصدر البطاقة.                                        |
    | `47`                    | Declined, Contact card issuer.                                                                                              | عملية مرفوضة ، يرجى الاتصال بجهة مصدر البطاقة.                                        |
    | `48`                    | Declined, Contact card issuer.                                                                                              | عملية مرفوضة ، يرجى الاتصال بجهة مصدر البطاقة.                                        |
    | `49`                    | Declined, Contact card issuer.                                                                                              | عملية مرفوضة ، يرجى الاتصال بجهة مصدر البطاقة.                                        |
    | `50`                    | Declined, Contact card issuer.                                                                                              | عملية مرفوضة ، يرجى الاتصال بجهة مصدر البطاقة.                                        |
    | `51`                    | Insufficient funds                                                                                                          | رصيد البطاقة غير كاف                                                                  |
    | `52`                    | No checking account                                                                                                         | لا يوجد حساب جاري                                                                     |
    | `53`                    | No savings account                                                                                                          | لا يوجد حساب توفير                                                                    |
    | `54`                    | Expired card                                                                                                                | بطاقة منتهية الصلاحية                                                                 |
    | `55`                    | Declined - Wrong PIN Entered by Card Holder                                                                                 | مرفوض - إدخال خاطئ لرقم التعريف الشخصي بواسطة حامل البطاقة                            |
    | `56`                    | No card record                                                                                                              | لا يوجد سجل للبطاقة                                                                   |
    | `57`                    | Online transactions are not permitted to this card, please contact the card issuer.                                         | المعاملات عبر الإنترنت غير مسموح بها لهذه البطاقة ، يرجى الاتصال بالبنك مصدر البطاقة. |
    | `58`                    | Online transactions are not permitted to this card, please contact the card issuer.                                         | المعاملات عبر الإنترنت غير مسموح بها لهذه البطاقة ، يرجى الاتصال بالبنك مصدر البطاقة. |
    | `59`                    | Suspected fraud                                                                                                             | تم رفض الدفع بسبب إشتباه في إحتيال                                                    |
    | `60`                    | Card acceptor contact acquirer                                                                                              | تم رفض الدفع                                                                          |
    | `61`                    | Exceeds withdrawal amount limit                                                                                             | تم رفض الدفع بسبب تجاوز حدود المبلغ المسموح للدفع                                     |
    | `62`                    | Your bank was not able to process the transaction                                                                           | البنك المصدر للبطاقة غير قادرًا على معالجة المعاملة                                   |
    | `63`                    | The three-digit CVV or CVC security code … was incorrect.                                                                   |                                                                                       |
    | `64`                    | Original amount incorrect                                                                                                   | المبلغ الأصلي غير صحيح                                                                |
    | `65`                    | Exceeds withdrawal frequency limit                                                                                          | تم إجتياز حد تردد السحب                                                               |
    | `66`                    | Card acceptor call acquirer's security department                                                                           | التقط البطاقة من الجهاز                                                               |
    | `67`                    | Hard capture (requires that card be picked up at ATM)                                                                       | الالتقاط الثابت (يتطلب استلام البطاقة من جهاز الصراف الآلي)                           |
    | `68`                    | Response received too late                                                                                                  | رد متأخر                                                                              |
    | `69`                    | Reserved for ISO use                                                                                                        | عملية مرفوضة                                                                          |
    | `70`                    | Reserved for ISO use                                                                                                        | عملية مرفوضة                                                                          |
    | `71`                    | Reserved for ISO use                                                                                                        | عملية مرفوضة                                                                          |
    | `72`                    | Reserved for ISO use                                                                                                        | عملية مرفوضة                                                                          |
    | `73`                    | Reserved for ISO use                                                                                                        | عملية مرفوضة                                                                          |
    | `74`                    | Reserved for ISO use                                                                                                        | عملية مرفوضة                                                                          |
    | `75`                    | Allowable number of PIN tries exceeded                                                                                      | تم تجاوز العدد المسموح به من محاولات PIN                                              |
    | `76`                    | Reserved for private use                                                                                                    | عملية مرفوضة                                                                          |
    | `77`                    | Reserved for private use                                                                                                    | عملية مرفوضة                                                                          |
    | `78`                    | Declined - No Account                                                                                                       | مرفوض - لا يوجد حساب                                                                  |
    | `79`                    | The card issuer suspects this payment to be fraudulent.                                                                     |                                                                                       |
    | `80`                    | Reserved for private use                                                                                                    | عملية مرفوضة                                                                          |
    | `81`                    | Reserved for private use                                                                                                    | عملية مرفوضة                                                                          |
    | `82`                    | CVV Validation Error                                                                                                        |                                                                                       |
    | `83`                    | CVV Validation Error                                                                                                        |                                                                                       |
    | `84`                    | Reserved for private use                                                                                                    | عملية مرفوضة                                                                          |
    | `85`                    | Reserved for private use                                                                                                    | عملية مرفوضة                                                                          |
    | `86`                    | Reserved for private use                                                                                                    | عملية مرفوضة                                                                          |
    | `87`                    | Reserved for private use                                                                                                    | عملية مرفوضة                                                                          |
    | `88`                    | Reserved for private use                                                                                                    | عملية مرفوضة                                                                          |
    | `89`                    | Reserved for private use                                                                                                    | عملية مرفوضة                                                                          |
    | `90`                    | Cutoff is in process (switch ending a day's business and starting the next. Transaction can be sent again in a few minutes) | قطع قيد التنفيذ                                                                       |
    | `91`                    | Your bank was not able to process the transaction                                                                           | البنك المصدر للبطاقة غير قادرًا على معالجة المعاملة                                   |
    | `92`                    | Financial institution or intermediate network facility cannot be found for routing                                          | لا يمكن العثور على مؤسسة مالية أو مرفق شبكة وسيطة للتوجيه                             |
    | `93`                    | Transaction cannot be completed. Violation of law                                                                           | لا يمكن إتمام العملية بسبب انتهاك للقانون                                             |
    | `94`                    | Duplicate transmission                                                                                                      | انتقال مكرر                                                                           |
    | `95`                    | Reconcile error                                                                                                             | خطأ في التصالح                                                                        |
    | `96`                    | Your bank was not able to process the transaction                                                                           | البنك المصدر للبطاقة غير قادرًا على معالجة المعاملة                                   |
    | `97`                    | Declined - CVV MisMatch                                                                                                     | عملية مرفوضة، رمز الأمان غير مطابق.                                                   |
    | `98`                    | Declined                                                                                                                    | عملية مرفوضة                                                                          |
    | `99`                    | Declined                                                                                                                    | عملية مرفوضة                                                                          |
  </Accordion>
</Accordions>

## Authentication and 3DS codes [#authentication-and-3ds-codes]

Returned by the 3D Secure and authentication step.

| transactionResponseCode | transactionResponseMessage - en                     | transactionResponseMessage - ar      |
| ----------------------- | --------------------------------------------------- | ------------------------------------ |
| `AA`                    | UNSPECIFIED FAILURE                                 | فشل غير محدد                         |
| `BB`                    | ACQUIRER SYSTEM ERROR                               | خطأ في نظام البنك                    |
| `CC`                    | UNKNOWN                                             | غير معلوم                            |
| `U`                     | Authentication is not available                     | المصادقة غير متوفرة                  |
| `X`                     | Authentication is not available                     | المصادقة غير متوفرة                  |
| `P`                     | Authentication failed, please check your card info. | المصادقة فشلت، خطأ في بيانات الكارت. |
| `N`                     | Authentication failed                               | المصادقة فشلت                        |
| `S`                     | Invalid Signature on Authentication Response        | توقيع غير صالح في استجابة المصادقة   |
| `I`                     | MPI Processing Error                                | MPI Processing Error                 |
| `M`                     | Authentication Attempted (No CAVV)                  | Authentication Attempted (No CAVV)   |

Card enrolment and ACS outcomes can also arrive as a `transactionResponseCode`: `CARD_ENROLLED`, `CARD_NOT_ENROLLED`, `ACS_ERROR`, `ACS_SUCCESS`, `ACS_FAILED`, `AUTHENTICATION_SUCCESSFUL`, `AUTHENTICATION_ATTEMPTED`, `AUTHENTICATION_FAILED`, `CARD_ENROLLEMENT_UNSPECIFIED`, `INVALID_CARD_NUMBER`, `REJECTED_CARD`.

## Gateway codes [#gateway-codes]

When a card is processed through the MPGS gateway, the gateway result word becomes the `transactionResponseCode` verbatim. `APPROVED` and `AUTHENTICATION_IN_PROGRESS` are returned on the intermediate 3DS step of a card order, so expect them in reconciliation responses.

| transactionResponseCode         | transactionResponseMessage - en                                  | transactionResponseMessage - ar |
| ------------------------------- | ---------------------------------------------------------------- | ------------------------------- |
| `gw_0`                          | Declined.                                                        |                                 |
| `ABORTED`                       | Transaction aborted by payer                                     |                                 |
| `ACQUIRER_SYSTEM_ERROR`         | Acquirer system error occurred processing the transaction        |                                 |
| `APPROVED`                      | Approved                                                         |                                 |
| `APPROVED_AUTO`                 | The transaction was automatically approved by the gateway …      |                                 |
| `APPROVED_PENDING_SETTLEMENT`   | Transaction Approved - pending batch settlement                  |                                 |
| `AUTHENTICATION_IN_PROGRESS`    | Authentication in progress                                       | المصادقة قيد التقدم             |
| `BALANCE_AVAILABLE`             | Balance / points-redemption hints                                |                                 |
| `BALANCE_UNKNOWN`               | Balance / points-redemption hints                                |                                 |
| `BLOCKED`                       | Your card is blocked, Kindly contact your issuer bank            |                                 |
| `CANCELLED`                     | Transaction cancelled by payer                                   |                                 |
| `DECLINED`                      | Payment was declined by issuer or payer authentication …         |                                 |
| `DECLINED_AVS`                  | Address / CSC verification declines                              |                                 |
| `DECLINED_AVS_CSC`              | Address / CSC verification declines                              |                                 |
| `DECLINED_CSC`                  | Address / CSC verification declines                              |                                 |
| `DECLINED_DO_NOT_CONTACT`       | Transaction declined - do not contact issuer                     |                                 |
| `DECLINED_INVALID_PIN`          | PIN declines                                                     |                                 |
| `DECLINED_PIN_REQUIRED`         | PIN declines                                                     |                                 |
| `DECLINED_PAYMENT_PLAN`         | Transaction declined due to payment plan                         |                                 |
| `DEFERRED_TRANSACTION_RECEIVED` | Deferred transaction received and awaiting processing            |                                 |
| `DUPLICATE_BATCH`               | Transaction declined due to duplicate batch                      |                                 |
| `EXCEEDED_RETRY_LIMIT`          | Transaction retry limit exceeded                                 |                                 |
| `EXPIRED_CARD`                  | Transaction declined due to expired card                         |                                 |
| `INSUFFICIENT_FUNDS`            | Transaction declined due to insufficient funds                   |                                 |
| `INVALID_CSC`                   | Invalid card security code                                       |                                 |
| `LOCK_FAILURE`                  | Order locked - another transaction is in progress for this order |                                 |
| `NO_BALANCE`                    | No balance available on the card                                 |                                 |
| `NO_MATCH`                      | CVV Validation Error                                             |                                 |
| `NOT_ENROLLED_3D_SECURE`        | Authentication not supported.                                    |                                 |
| `NOT_SUPPORTED`                 | Transaction type not supported, please refer to your bank.       |                                 |
| `PARTIALLY_APPROVED`            | Partially Approved transaction                                   |                                 |
| `PENDING`                       | Transaction is pending                                           |                                 |
| `REFERRED`                      | Transaction declined - refer to issuer                           |                                 |
| `SUBMITTED`                     | Transaction submitted without a known response                   |                                 |
| `SYSTEM_ERROR`                  | System error                                                     |                                 |
| `TIMED_OUT`                     | Transaction timeout                                              |                                 |
| `UNKNOWN`                       | Unkown Result                                                    |                                 |
| `UNSPECIFIED_FAILURE`           | unspecified failure                                              |                                 |

## Kashier codes [#kashier-codes]

Kashier-internal outcomes covering tokenization, refunds, wallets, QR, and payouts. These keys are lowercase — an uppercase `K_4` will not match.

| transactionResponseCode | transactionResponseMessage - en                                                                        | transactionResponseMessage - ar                |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `k_default`             | A General Error Occured, please contact support.                                                       | حدث خطأ عام ، يرجى الاتصال بالدعم.             |
| `k_0`                   | Invalid detoken parameter.                                                                             | رمز غير صالح                                   |
| `k_1`                   | Token not found.                                                                                       | لم يتم العثور على الرمز                        |
| `k_2`                   | Token expired after 10 minutes of inactivity.                                                          | انتهت صلاحية الرمز بعد 10 دقائق من عدم النشاط. |
| `k_3`                   | card security code does not exist.                                                                     | رمز أمان البطاقة غير موجود.                    |
| `k_4`                   | Request to pay message send successfully.                                                              |                                                |
| `k_5`                   | The Mobile number is not registered on any provider.                                                   |                                                |
| `k_6`                   | Approved                                                                                               |                                                |
| `k_7`                   | Order not paid                                                                                         |                                                |
| `k_8`                   | Transaction refunded successfully                                                                      |                                                |
| `k_9`                   | Invalid refund body, please check your inputs                                                          |                                                |
| `k_10`                  | Transaction already refunded                                                                           |                                                |
| `k_11`                  | QR code generated successfully                                                                         |                                                |
| `k_12`                  | Payment not completed, OTP page did not displayed to the user                                          |                                                |
| `k_13`                  | Transaction not found on provider                                                                      |                                                |
| `k_14`                  | Expired                                                                                                |                                                |
| `k_15`                  | Self-transfer is not allowed                                                                           |                                                |
| `k_16`                  | Internal account credit failed                                                                         |                                                |
| `k_17`                  | Recipient credit not found                                                                             |                                                |
| `k_101`                 | Transaction In Progress                                                                                |                                                |
| `REFUND_DISABLED`       | The bank has disabled refund operations for this merchant. Please contact your bank to enable refunds. |                                                |

`k_default` is also the fallback message for any code Kashier does not recognise, so it can accompany a code that is not in these tables.

Two further codes reach you without a dictionary entry of their own, and both carry the `k_default` message: `k_timeout`, returned when the gateway sends no response, and `k_risk`, a retry-guard decline. Treat `k_timeout` as an unknown outcome and reconcile it against the order — never read it as a success or a failure.

## Installment and OTP codes [#installment-and-otp-codes]

Returned by the buy-now-pay-later and OTP flows, such as valU and Souhoola.

| transactionResponseCode | Meaning                                        |
| ----------------------- | ---------------------------------------------- |
| `ERR_00`                | Technical Failure, Please restart the process. |
| `ERR_CST_01`            | Not enrolled                                   |
| `ERR_CST_02`            | No limit or inactive                           |
| `ERR_CST_03`            | Amount exceeds limit                           |
| `ERR_CST_04`            | Not eligible                                   |
| `ERR_DTA_01`            | Invalid request                                |
| `ERR_DTA_02`            | OTP not found                                  |
| `ERR_DTA_03`            | OTP expired                                    |
| `ERR_DTA_04`            | Invalid OTP                                    |
| `ERR_DTA_05`            | Already verified                               |
| `ERR_DTA_06`            | Max OTP attempts                               |
| `ERR_DTA_07`            | Invalid downpayment                            |
| `ERR_DTA_08`            | Invalid financed amount                        |
| `ERR_DTA_09`            | Wrong payment plan                             |
| `ERR_ORD_01`            | Order not found                                |
| `ERR_ORD_02`            | Duplicate order.                               |
| `ERR_PRD_01`            | Product not found                              |
| `ERR_PRD_02`            | Product Already refunded                       |
| `ERR_VDR_01`            | Vendor not found                               |
| `ERR_VDR_02`            | Store details not found                        |
| `ERR_VDR_03`            | Vendor not allowed to redeem discount          |

# Payment sessions (/docs/accept-payments/payment-sessions)

Kashier's payment sessions make transactions more secure and efficient. With a single API call, you can create payments without exposing sensitive data in query strings, and session history tracking lets you monitor every action in real time. This page walks through creating a session, sending the customer to pay, and confirming the result.

## Step 1: Create a payment session [#step-1-create-a-payment-session]

| Endpoint | Value                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v3/payment/sessions](https://test-api.kashier.io/v3/payment/sessions) |
| LIVE-URL | [https://api.kashier.io/v3/payment/sessions](https://api.kashier.io/v3/payment/sessions)           |
| Method   | POST                                                                                               |

```bash
curl --location 'https://test-api.kashier.io/v3/payment/sessions' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'api-key: YOUR_TEST_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
  "expireAt": "2030-01-28T17:27:32.359Z",
  "maxFailureAttempts": 3,
  "paymentType": "credit",
  "amount": "100.00",
  "currency": "EGP",
  "order": "8f64saf6sa4",
  "merchantRedirect": "https://your-website.com/redirect",
  "display": "en",
  "type": "one-time",
  "allowedMethods": "card,wallet",
  "redirectMethod": null,
  "iframeBackgroundColor": "#FFFFFF",
  "metaData": {
      "customKey": "customValue",
      "displayNotes": {"key": "value"}
  },
  "merchantId": "MID-XXXX-XXX",
  "failureRedirect": false,
  "brandColor": "#FF5733",
  "currencyConversionDefault": "EUR",
  "defaultMethod": "card",
  "description": "Payment for order ORD123456",
  "manualCapture": false,
  "customer": {
      "email": "john@example.com",
      "reference": "894321"
  },
  "saveCard": "optional",
  "retrieveSavedCard": true,
  "interactionSource": "ECOMMERCE",
  "enable3DS": true,
  "serverWebhook": "https://your_webhook_url",
  "notes": "Special handling required"
}'
```

<Callout type="warn" title="Two values to fill in before you send">
  `merchantId` is required and the panel cannot guess it. Save your test **merchant ID** next to your keys in the banner above and it is substituted into the `MID-XXXX-XXXX` placeholder automatically. Until you do, the panel treats the placeholder as an unfilled parameter and keeps Send disabled rather than firing a request the API is certain to reject.

Change `order` as well. It is your own reference for the payment and Kashier rejects a duplicate order reference for the same merchant (`ERR_ORD_02`), so leaving the placeholder in place collides with everyone else who left it alone.
</Callout>

<ApiTryIt
  method="POST"
  url="https://test-api.kashier.io/v3/payment/sessions"
  body="{
  expireAt: '2030-01-01T00:00:00.000Z',
  maxFailureAttempts: 3,
  paymentType: 'credit',
  amount: '100.00',
  currency: 'EGP',
  order: 'REPLACE-WITH-YOUR-OWN-REFERENCE',
  merchantRedirect: 'https://your-website.com/redirect',
  display: 'en',
  type: 'one-time',
  allowedMethods: 'card,wallet',
  merchantId: 'MID-XXXX-XXXX',
  currencyConversionDefault: 'EUR',
  description: 'Docs playground test',
  customer: { email: 'docs-check@example.com', reference: 'docs-check-1' },
}"
/>

`currencyConversionDefault` is optional. It pre-selects the payer's currency dropdown on the hosted page when currency conversion is on for you, and never changes the amount or currency. See the [supported display currencies](/docs/accept-payments/currency-conversion#supported-display-currencies).

### Headers [#headers]

| Key           | Description                                                                                                                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication).                                    |
| api-key       | You can obtain your `api-key` from the merchant dashboard under the **Integrations** section. Please note that the API key is different for the _live_ and _test_ environments, so make sure to use the correct one for each. |

Full parameter and response reference → [Create payment session](/docs/api-reference/payment-sessions/createPaymentSession).

## Step 2: Send the customer to pay [#step-2-send-the-customer-to-pay]

<Callout title="Note">
  sessionUrl is the URL that will be used to redirect the customer to the payment page. You can use it as the src attribute in a link or `<iframe>`.
</Callout>

The response to the create call includes a `sessionUrl`. You have two options for getting the customer to it:

- **Redirect** — send the customer's browser straight to `sessionUrl`. Kashier handles the checkout UI and returns them to your `merchantRedirect` URL afterward.
- **Embed** — render `sessionUrl` inside your own page in an iframe instead of redirecting away:

```html
<iframe
  src="https://payments.kashier.io/session/67adc07584f10c00121f6739?mode=test"
></iframe>
```

This embed flow was formerly documented as the "Payment UI Builder".

<Callout title="Note">
  The legacy documentation page hosted an interactive test builder that generated a checkout from the fields below. Use the [create payment session](#step-1-create-a-payment-session) call with these fields to build your checkout.
</Callout>

#### Merchant details [#merchant-details]

- **Merchant ID**
- **API key**
- **Secret key**

#### Order details [#order-details]

- **Order ID** — unique order reference between merchant and Kashier
- **Amount**
- **Currency**

#### Payment method [#payment-method]

Select the payment methods to enable:

- Card
- Wallet
- Bank installment
- Buy now pay later

#### Redirect settings [#redirect-settings]

- **Redirect URL**
- **Redirect method** — Get or Post
- **Redirect failure** — True or False

#### Display settings [#display-settings]

- **Display language** — English or Arabic
- **Display mode** — Test or Live
- **Brand color** — e.g. `#00bcbc`

### Getting the result out of an embedded checkout [#getting-the-result-out-of-an-embedded-checkout]

When you embed rather than redirect, the customer never leaves your page, so there is no redirect landing you can read the outcome from. The checkout talks back to the page that hosts it with `window.postMessage`. Add a `message` listener on your page and switch on `e.data.message`.

What you receive depends on how you embedded it.

**If you embed with Kashier's checkout script**, the script sits between the checkout and your page and re-emits a small, clean set:

| `e.data.message` | Emitted when                                          | What you do                                                                                                                                                    |
| ---------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `iframeLoaded`   | The checkout is loaded and its pay button is ready.   | Drop your own loading state.                                                                                                                                   |
| `paymentSuccess` | The payment succeeded.                                | Show your success state.                                                                                                                                       |
| `iframeHide`     | The customer closed or dismissed the checkout.        | Remove your overlay and re-enable the page.                                                                                                                    |
| `urlRedirection` | The checkout is ready to return to your redirect URL. | Nothing. The script redirects the top window for you — it builds an auto-submitting form when `redirectMethod` is `post`, and otherwise replaces the location. |

**If you render `sessionUrl` in your own `<iframe>`**, as in the snippet above, there is no script in between and you receive the checkout page's own messages directly:

| `e.data.message`        | Payload                                  | Meaning                                                                                                                       |
| ----------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `contentLoaded`         | `null`                                   | The checkout DOM is ready.                                                                                                    |
| `paymentSuccess`        | `{}`                                     | The payment succeeded.                                                                                                        |
| `urlRedirection`        | `{ redirectUrl, redirectMethod }`        | The checkout wants the top window sent to `redirectUrl`. With no script in between, **performing this redirect is your job**. |
| `closeIframe`           | `null`                                   | The customer closed the checkout. Tear down your overlay.                                                                     |
| `success` / `failure`   | Gateway data                             | Raw card-form outcome callbacks.                                                                                              |
| `merchantStoreRedirect` | Full gateway response plus `redirectUrl` | The 3DS result coming back from the challenge.                                                                                |

A minimal listener for the raw-iframe case:

```js
window.addEventListener("message", (e) => {
  switch (e.data?.message) {
    case "contentLoaded":
      // checkout is ready — hide your spinner
      break;
    case "paymentSuccess":
      // show a provisional success state, then confirm server-side
      break;
    case "closeIframe":
      // customer dismissed the checkout — remove your overlay
      break;
    case "urlRedirection":
      window.location.replace(e.data.params.redirectUrl);
      break;
  }
});
```

<Callout type="warn" title="Never treat paymentSuccess as settlement">
  `paymentSuccess` arrives from the browser and can be forged, replayed, or simply lost if the customer closes the tab. Confirm every payment server-side — from your [webhook](/docs/webhooks) or by calling [Verify the result](#step-3-verify-the-result) — before you release goods. The same goes for the redirect query string, whose `signature` you must validate.
</Callout>

<Callout type="warn" title="Test mode only ever offers card and wallet">
  Outside live mode the checkout ignores `allowedMethods` and forces the method list to card and wallet. `bank_installments`, `fawry` and the rest cannot be exercised in the sandbox at all. So a method working in test tells you nothing about live, and a method being missing in test does not mean your account is misconfigured — verify method availability against your live account.
</Callout>

## Step 3: Verify the result [#step-3-verify-the-result]

| Endpoint | Value                                                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v3/payment/sessions/:sessionId/payment](https://test-api.kashier.io/v3/payment/sessions/:sessionId/payment) |
| LIVE-URL | [https://api.kashier.io/v3/payment/sessions/:sessionId/payment](https://api.kashier.io/v3/payment/sessions/:sessionId/payment)           |
| Method   | GET                                                                                                                                      |

```bash
curl --location 'https://test-api.kashier.io/v3/payment/sessions/:sessionId/payment' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v3/payment/sessions/:sessionId/payment" sendApiKey="false" />

### Headers [#headers-1]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

Full parameter and response reference → [Get payment session](/docs/api-reference/payment-sessions/getPaymentSession).

## Next steps [#next-steps]

<Cards>
  <Card title="Webhooks" href="/docs/webhooks" description="Get server-to-server notifications instead of polling for the result." />

  <Card title="Refunds" href="/docs/accept-payments/refunds" description="Make full or partial refund requests against an order." />

  <Card title="Currency conversion" href="/docs/accept-payments/currency-conversion" description="Look up live exchange rates for cross-currency pricing." />

  <Card title="Product catalog" href="/docs/accept-payments/products" description="Build itemized payment links and checkout pages from products instead of a flat amount." />
</Cards>

# Product catalog (/docs/accept-payments/products)

Kashier keeps a per-merchant product catalog — products and the categories that organize them — under `/v2/products` and `/v2/category`. It's the same catalog used when a payment page or payment link is built from line items instead of a single flat amount, and every stock-affecting change to a product is recorded on an append-only timeline you can inspect after the fact.

<Callout title="Scope of this page">
  This page covers the merchant-facing CRUD subset of `/v2/products` and `/v2/category` — the routes that require merchant authentication. Two `/v2/category` routes are intentionally left out: `GET /v2/category/paymentPage/:ppLink/summary` and `GET /v2/category/simple` are public and take no merchant credentials. The first is consumed by the checkout page itself to render a payment page's categories; the second is a read-only lookup that takes a `merchantId` query parameter. Neither is part of managing your catalog.
</Callout>

## Product fields [#product-fields]

These fields come from the verified `products-and-services-management` data model. The exact wire format for a given response isn't independently confirmed on every route below — where that matters, the "Try it" panel is the fastest way to check.

| Field                                                             | Type                                 | Settable via API | Notes                                                                                                                                                     |
| ----------------------------------------------------------------- | ------------------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `productName`                                                     | string                               | yes              | Part of a per-merchant `merchantId + currency + productName` uniqueness constraint — you can't have two products with the same name in the same currency. |
| `productDescription`                                              | string                               | yes              | Free-text description.                                                                                                                                    |
| `productReference`                                                | string                               | yes              | Your own SKU/reference.                                                                                                                                   |
| `unitPrice`                                                       | number                               | yes              | Minimum `0`.                                                                                                                                              |
| `currency`                                                        | string                               | yes              | Defaults to `EGP`.                                                                                                                                        |
| `quantity`                                                        | number                               | yes              | Stock quantity. Minimum `0`.                                                                                                                              |
| `productImage`                                                    | string                               | yes              | Object key for the product image; echoed back as `productImageUrl`, a full `static.kashier.io` URL.                                                       |
| `isVariant`                                                       | boolean                              | yes              | Whether the product has size variants. Defaults to `false`.                                                                                               |
| `variantsType`                                                    | string (`size`)                      | yes              | Variant dimension, when `isVariant` is `true`.                                                                                                            |
| `isShippable`                                                     | boolean                              | yes              | Defaults to `false`.                                                                                                                                      |
| `dimensions.height` / `.width` / `.length` / `.weight` / `.notes` | number / string                      | yes              | Shipping dimensions.                                                                                                                                      |
| `productVariants[]`                                               | array                                | yes              | Embedded size variants, each with `variantType`, `name`, `quantity`, `unitPrice` (minimum `0.1`), `variantReference`, `status`, `variantDimensions`.      |
| `categories[]`                                                    | array of category IDs                | yes              | Categories this product belongs to.                                                                                                                       |
| `productStatus`                                                   | string (`available` \| `outOfStock`) | system-managed   | Derived from stock levels.                                                                                                                                |
| `reservedQuantity` / `purchasedQuantity` / `totalRevenue`         | number                               | system-managed   | Running totals maintained by the service.                                                                                                                 |
| `merchantId` / `createdByUserId` / `creationDate`                 | —                                    | system-managed   | Set from the authenticated request.                                                                                                                       |

## Category fields [#category-fields]

| Field                                                        | Type   | Settable via API | Notes                                                                                                                                                |
| ------------------------------------------------------------ | ------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                                                       | string | yes              | Required.                                                                                                                                            |
| `slug`                                                       | string | system-managed   | Derived from `name`, and unique per merchant (`merchantId + slug`) — two of your categories can't resolve to the same slug, so names have to differ. |
| `numberOfProducts`                                           | number | system-managed   | Denormalized count of products tagged with this category; not a live join, so treat it as approximate.                                               |
| `merchantId` / `createdByUserId` / `createdAt` / `updatedAt` | —      | system-managed   |                                                                                                                                                      |

## List merchant products [#list-merchant-products]

Returns the merchant's products.

| Endpoint | Value                                                                                |
| -------- | ------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/products/](https://test-api.kashier.io/v2/products/) |
| LIVE-URL | [https://api.kashier.io/v2/products/](https://api.kashier.io/v2/products/)           |
| Method   | GET                                                                                  |

```bash
curl --location 'https://test-api.kashier.io/v2/products/' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/products/" sendApiKey="false" title="Try it — list merchant products" />

### Headers [#headers]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response]

Returns a `200` with the merchant's products — individual items follow the [Product fields](#product-fields) shape above. Query parameters (pagination, search, filters) and the exact list envelope aren't confirmed here — use the "Try it" panel above against a test account to inspect a live response.

## Create product [#create-product]

Creates a new product in the merchant's catalog.

| Endpoint | Value                                                                                |
| -------- | ------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/products/](https://test-api.kashier.io/v2/products/) |
| LIVE-URL | [https://api.kashier.io/v2/products/](https://api.kashier.io/v2/products/)           |
| Method   | POST                                                                                 |

### Body parameters [#body-parameters]

See [Product fields](#product-fields) for the full settable set. `productName`, `currency` and `isVariant` are required by the create schema; `unitPrice` is required for a non-variant product. A minimal example:

```bash
curl --location 'https://test-api.kashier.io/v2/products/' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "productName": "Wireless Mouse",
    "productReference": "SKU-1001",
    "currency": "EGP",
    "unitPrice": 350,
    "quantity": 100,
    "isVariant": false
  }'
```

<Callout title="Two uniqueness constraints to work around">
  `productReference` is optional, but it is your merchant-wide SKU and reusing one is rejected with `Validation failed` / `SKU must be unique` — the panel below leaves it out for that reason, so add your own value when you need one. `productName` is constrained too, on `merchantId + currency + productName`, so change the name in the panel before sending: running it twice with the same name and currency is rejected as a duplicate.
</Callout>

<ApiTryIt
  method="POST"
  url="https://test-api.kashier.io/v2/products/"
  body="{
  productName: 'Wireless Mouse',
  currency: 'EGP',
  unitPrice: 350,
  quantity: 100,
  isVariant: false,
}"
  sendApiKey="false"
  title="Try it — create product"
/>

### Headers [#headers-1]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-1]

Returns a `201` with the created product, in the [Product fields](#product-fields) shape — including the system-managed fields (`productStatus`, `merchantId`, timestamps, and so on).

## Get product details [#get-product-details]

Fetch a single product by ID.

| Endpoint | Value                                                                                      |
| -------- | ------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/products/:id](https://test-api.kashier.io/v2/products/:id) |
| LIVE-URL | [https://api.kashier.io/v2/products/:id](https://api.kashier.io/v2/products/:id)           |
| Method   | GET                                                                                        |

```bash
curl --location 'https://test-api.kashier.io/v2/products/:id' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/products/:id" sendApiKey="false" title="Try it — get product details" />

### Headers [#headers-2]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-2]

Returns a `200` with the product in the [Product fields](#product-fields) shape.

## Update product [#update-product]

Update fields on an existing product.

| Endpoint | Value                                                                                      |
| -------- | ------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/products/:id](https://test-api.kashier.io/v2/products/:id) |
| LIVE-URL | [https://api.kashier.io/v2/products/:id](https://api.kashier.io/v2/products/:id)           |
| Method   | PUT                                                                                        |

### Body parameters [#body-parameters-1]

Same settable fields as [Create product](#create-product) — see [Product fields](#product-fields).

```bash
curl --location --request PUT 'https://test-api.kashier.io/v2/products/:id' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "unitPrice": 375,
    "quantity": 80
  }'
```

<ApiTryIt
  method="PUT"
  url="https://test-api.kashier.io/v2/products/:id"
  body="{
  unitPrice: 375,
  quantity: 80,
}"
  sendApiKey="false"
  title="Try it — update product"
/>

### Headers [#headers-3]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-3]

Returns the updated product in the same shape as [Get product details](#get-product-details).

## Get product timeline [#get-product-timeline]

Returns the append-only audit/inventory timeline for a single product — every stock `created` / `added` / `reduced` / `reserved` / `purchased` / `updated` event, in order.

| Endpoint | Value                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/products/:id/timeline](https://test-api.kashier.io/v2/products/:id/timeline) |
| LIVE-URL | [https://api.kashier.io/v2/products/:id/timeline](https://api.kashier.io/v2/products/:id/timeline)           |
| Method   | GET                                                                                                          |

```bash
curl --location 'https://test-api.kashier.io/v2/products/:id/timeline' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/products/:id/timeline" sendApiKey="false" title="Try it — get product timeline" />

### Headers [#headers-4]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-4]

Returns a `200` with a list of timeline entries. Per the underlying schema, each entry carries `operation` (`created` | `reduced` | `added` | `purchased` | `updated` | `reserved`), `numOfUnit` (the quantity delta), `actionDate`, `actionBy` (`userId`, `email`, `fullName` of who made the change), and — when the event came from a sale — `customPurchasedAttributes` linking back to the `transactionId`, `orderId`, and payment page (`ppId`) that consumed the stock. The exact envelope (pagination, wrapper key) isn't confirmed here — use the "Try it" panel above against a test account.

## Assign categories to product [#assign-categories-to-product]

Adds or removes categories on one or more products, in bulk.

| Endpoint | Value                                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/products/assign/categories](https://test-api.kashier.io/v2/products/assign/categories) |
| LIVE-URL | [https://api.kashier.io/v2/products/assign/categories](https://api.kashier.io/v2/products/assign/categories)           |
| Method   | PUT                                                                                                                    |

### Body parameters [#body-parameters-2]

| Key           | Required | Description                                                                                             |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `categoryIds` | yes      | Array of category IDs to apply. Get them from [Get all categories](#get-all-categories).                |
| `productIds`  | yes      | Array of product IDs to apply them to. Get them from [List merchant products](#list-merchant-products). |
| `operation`   | yes      | `assign` or `unassign`.                                                                                 |

```bash
curl --location --request PUT 'https://test-api.kashier.io/v2/products/assign/categories' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "categoryIds": ["507f1f77bcf86cd799439011"],
    "productIds": ["507f1f77bcf86cd799439012"],
    "operation": "assign"
  }'
```

### Headers [#headers-5]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-5]

Returns a `200`. Invalid IDs are rejected with `400 {"message":"Invalid category IDs"}`.

<Callout title="No 'Try it' panel for this one">
  Both IDs have to be real objects in your own catalog, and the call rewrites the `categories[]` of every product you name — there is no placeholder pair that produces a valid, harmless request. Run the curl above with IDs from your own account instead. The route adds to a product's existing `categories[]` (or removes from it, with `operation: "unassign"`) and notifies the payment-pages service of the change; the field names above come from Kashier's request-validation schema, but confirm the behaviour on a test product before relying on it in production.
</Callout>

## Change product categories [#change-product-categories]

A second, related route for managing a product's categories, alongside [Assign categories to product](#assign-categories-to-product).

| Endpoint | Value                                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/products/categories/change](https://test-api.kashier.io/v2/products/categories/change) |
| LIVE-URL | [https://api.kashier.io/v2/products/categories/change](https://api.kashier.io/v2/products/categories/change)           |
| Method   | PUT                                                                                                                    |

### Body parameters [#body-parameters-3]

The same `categoryIds` and `productIds` arrays as [Assign categories to product](#assign-categories-to-product), both required — but no `operation`, which is the one structural difference between the two routes.

| Key           | Required | Description            |
| ------------- | -------- | ---------------------- |
| `categoryIds` | yes      | Array of category IDs. |
| `productIds`  | yes      | Array of product IDs.  |

```bash
curl --location --request PUT 'https://test-api.kashier.io/v2/products/categories/change' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "categoryIds": ["507f1f77bcf86cd799439011"],
    "productIds": ["507f1f77bcf86cd799439012"]
  }'
```

### Headers [#headers-6]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

<Callout title="No 'Try it' panel for this one">
  Same reason as [Assign categories to product](#assign-categories-to-product): the call needs real product and category IDs from your own catalog and rewrites the products it names, so there is no safe placeholder body to ship. If your integration depends on whether this route *replaces* a product's category set or adds to it, verify that behaviour on a test product first — the two routes are close enough in name that you should not assume.
</Callout>

## Export merchant products [#export-merchant-products]

Downloads the merchant's product catalog as a file.

| Endpoint | Value                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/products/export](https://test-api.kashier.io/v2/products/export) |
| LIVE-URL | [https://api.kashier.io/v2/products/export](https://api.kashier.io/v2/products/export)           |
| Method   | GET                                                                                              |

```bash
curl --location 'https://test-api.kashier.io/v2/products/export' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --output products.xlsx
```

### Headers [#headers-7]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

## Export merchant products asynchronously [#export-merchant-products-asynchronously]

Same export, run as a background job instead of a synchronous download — useful for large catalogs. Rather than returning the file directly, it queues the export and is intended to email a download link once the file is ready.

| Endpoint | Value                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/products/export-async](https://test-api.kashier.io/v2/products/export-async) |
| LIVE-URL | [https://api.kashier.io/v2/products/export-async](https://api.kashier.io/v2/products/export-async)           |
| Method   | GET                                                                                                          |

```bash
curl --location 'https://test-api.kashier.io/v2/products/export-async' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/products/export-async" sendApiKey="false" title="Try it — export merchant products asynchronously" />

### Headers [#headers-8]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-6]

Returns a `200` acknowledging the export job was queued. The exact acknowledgment body and delivery mechanism for the finished file aren't confirmed here — use the "Try it" panel above against a test account.

## Upload product file [#upload-product-file]

Uploads a file associated with the merchant's catalog (for example, a product image — `productImage` is stored as an object key and served back via `productImageUrl`).

| Endpoint | Value                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/products/upload/](https://test-api.kashier.io/v2/products/upload/) |
| LIVE-URL | [https://api.kashier.io/v2/products/upload/](https://api.kashier.io/v2/products/upload/)           |
| Method   | POST                                                                                               |

```bash
curl --location 'https://test-api.kashier.io/v2/products/upload/' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --form 'file=@"/path/to/file"'
```

### Headers [#headers-9]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

<Callout title="Confirm the multipart field name before you integrate">
  The upload is merchant-scoped and stores the file in Kashier's object storage. The `file` field name above is a placeholder — confirm the multipart field name and the accepted file types against a test account before integrating.
</Callout>

## Get all categories [#get-all-categories]

Returns the merchant's product categories.

| Endpoint | Value                                                                                |
| -------- | ------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/category/](https://test-api.kashier.io/v2/category/) |
| LIVE-URL | [https://api.kashier.io/v2/category/](https://api.kashier.io/v2/category/)           |
| Method   | GET                                                                                  |

### Query parameters [#query-parameters]

`sortBy` is **required**. It is validated before authentication, so calling the route without it returns `400 {"message":"\"sortBy\" is required"}` even with a valid secret key.

| Key           | Required | Description                                          |
| ------------- | -------- | ---------------------------------------------------- |
| `sortBy`      | yes      | Field to sort by, for example `name` or `createdAt`. |
| `sortType`    | no       | Sort order: `1` ascending, `-1` descending.          |
| `page`        | no       | Page number.                                         |
| `limit`       | no       | Results per page.                                    |
| `q`           | no       | Search query.                                        |
| `from` / `to` | no       | Date range, `DD-MM-YYYY`.                            |

```bash
curl --location 'https://test-api.kashier.io/v2/category/?sortBy=createdAt&sortType=-1&page=1&limit=20' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/category/?sortBy=createdAt&sortType=-1&page=1&limit=20" sendApiKey="false" title="Try it — get all categories" />

### Headers [#headers-10]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-7]

Returns a `200` with the merchant's categories — individual items follow the [Category fields](#category-fields) shape above, alongside pagination. Use the "Try it" panel above against a test account to see the exact list envelope.

## Create product category [#create-product-category]

Creates a new category.

| Endpoint | Value                                                                                |
| -------- | ------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/category/](https://test-api.kashier.io/v2/category/) |
| LIVE-URL | [https://api.kashier.io/v2/category/](https://api.kashier.io/v2/category/)           |
| Method   | POST                                                                                 |

### Body parameters [#body-parameters-4]

| Key  | Description                                                                                                                                                                                               |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name | Category name. Required, and unique per merchant once slugified — see [Category fields](#category-fields). Change the name in the panel below before sending, or a second run is rejected as a duplicate. |

```bash
curl --location 'https://test-api.kashier.io/v2/category/' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "Electronics"
  }'
```

<ApiTryIt method="POST" url="https://test-api.kashier.io/v2/category/" body="{ name: 'Electronics' }" sendApiKey="false" title="Try it — create product category" />

### Headers [#headers-11]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-8]

Returns a `201` with the created category, in the [Category fields](#category-fields) shape — including the system-managed `slug` (derived from `name`) and `numberOfProducts` (starts at `0`).

## Get category details [#get-category-details]

Fetch a single category by ID.

| Endpoint | Value                                                                                      |
| -------- | ------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/category/:id](https://test-api.kashier.io/v2/category/:id) |
| LIVE-URL | [https://api.kashier.io/v2/category/:id](https://api.kashier.io/v2/category/:id)           |
| Method   | GET                                                                                        |

```bash
curl --location 'https://test-api.kashier.io/v2/category/:id' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/category/:id" sendApiKey="false" title="Try it — get category details" />

### Headers [#headers-12]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-9]

Returns a `200` with the category in the [Category fields](#category-fields) shape.

## Update product category [#update-product-category]

Update a category's name.

| Endpoint | Value                                                                                      |
| -------- | ------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/category/:id](https://test-api.kashier.io/v2/category/:id) |
| LIVE-URL | [https://api.kashier.io/v2/category/:id](https://api.kashier.io/v2/category/:id)           |
| Method   | PUT                                                                                        |

### Body parameters [#body-parameters-5]

| Key  | Description                                       |
| ---- | ------------------------------------------------- |
| name | New category name. Changing it re-derives `slug`. |

```bash
curl --location --request PUT 'https://test-api.kashier.io/v2/category/:id' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "Electronics & Accessories"
  }'
```

<ApiTryIt method="PUT" url="https://test-api.kashier.io/v2/category/:id" body="{ name: 'Electronics & Accessories' }" sendApiKey="false" title="Try it — update product category" />

### Headers [#headers-13]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-10]

Returns the updated category in the same shape as [Get category details](#get-category-details).

## Delete product category [#delete-product-category]

Delete a category.

| Endpoint | Value                                                                                      |
| -------- | ------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/category/:id](https://test-api.kashier.io/v2/category/:id) |
| LIVE-URL | [https://api.kashier.io/v2/category/:id](https://api.kashier.io/v2/category/:id)           |
| Method   | DELETE                                                                                     |

```bash
curl --location --request DELETE 'https://test-api.kashier.io/v2/category/:id' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="DELETE" url="https://test-api.kashier.io/v2/category/:id" sendApiKey="false" title="Try it — delete product category" />

### Headers [#headers-14]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-11]

Returns a `200` confirming deletion. The exact response body isn't confirmed here — use the "Try it" panel above against a test account.

<Callout title="Products deleted from a category">
  Deleting a category doesn't delete the products tagged with it — `numberOfProducts` is a denormalized counter, not an ownership relationship. Whether a deleted category's ID is also stripped from each product's `categories[]` is something to verify against a test account if your integration depends on it.
</Callout>

# Recurring payments (/docs/accept-payments/recurring)

Charge a customer on a schedule by saving their card once. There are two phases:

- **Initial setup** — the customer pays and you store the returned token.
- **Recurring charges** — you charge that token each cycle.

The customer is involved only in the first payment.

<Callout title="There is no subscriptions API">
  Kashier does not offer a managed subscriptions or billing-plans API. You own
  the billing schedule: save a card token once, then charge it yourself each
  cycle with the Pay with Token API.
</Callout>

## APIs used [#apis-used]

- **Save Token API** — initiates the recurring flow, displays the payment UI, and creates the token and agreement.
- **Pay with Token API** — charges the customer using previously generated credentials.

## Phase 1: Initial setup (Save Token API) [#phase-1-initial-setup-save-token-api]

### Step 1: Initiate setup [#step-1-initiate-setup]

The merchant backend calls the **Save Token API** to start the recurring flow and show the Kashier payment UI.

### Step 2: Customer completes payment [#step-2-customer-completes-payment]

The customer enters card details and completes the payment. Kashier generates:

- cardDataToken
- agreementId

### Step 3: Receive webhook [#step-3-receive-webhook]

After a successful payment, Kashier sends a webhook containing the `cardDataToken` and `agreementId`.

### Step 4: Store credentials [#step-4-store-credentials]

The merchant validates the webhook and securely stores the token and agreement data.

## Phase 2: Recurring charges (Pay with Token API) [#phase-2-recurring-charges-pay-with-token-api]

<Callout title="interactionSource changes between phases">
  `interactionSource` is `RECURRING` while saving the token during setup (see the [Save Token field reference](#save-token)) and `CONTAUTH` while charging the stored token (see the [Pay with Tokens field reference](#pay-with-tokens)).
</Callout>

### Step 5: Charge customer [#step-5-charge-customer]

For each subscription cycle, the merchant calls the **Pay with Token API** using the stored `cardDataToken` and `agreementId`.

### Step 6: Handle result [#step-6-handle-result]

Kashier processes the charge and returns the payment result. The merchant updates the subscription status accordingly.

## Summary [#summary]

1. Call the **Save Token API**
2. Customer completes payment
3. Receive webhook with token and agreement
4. Store credentials
5. Use the **Pay with Token API** for recurring billing

<Mermaid
chart="sequenceDiagram
participant Customer
participant Merchant Backend
participant Kashier
participant Merchant Webhook Endpoint

    Merchant Backend->>Kashier: 1. Call Save Token API
    Kashier->>Customer: Show payment UI
    Customer->>Kashier: 2. Complete payment
    Kashier->>Merchant Webhook Endpoint: 3. Webhook (cardDataToken + agreementId)
    Merchant Webhook Endpoint->>Merchant Backend: 4. Store credentials

    loop Each billing cycle
        Merchant Backend->>Kashier: 5. Call Pay with Token API (cardDataToken + agreementId)
        Kashier->>Merchant Backend: Payment result
    end"

/>

[Download the Kashier recurring APIs Postman collection](/assets/legacy/Kashier%20Recurring%20Apis.postman_collection.json)

## List tokens [#list-tokens]

| Endpoint | Value                                                                                                                                                                              |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v3/payment/tokenization/tokens?sortType=-1\&page=1\&limit=20](https://test-api.kashier.io/v3/payment/tokenization/tokens?sortType=-1&page=1&limit=20) |
| LIVE-URL | [https://api.kashier.io/v3/payment/tokenization/tokens?sortType=-1\&page=1\&limit=20](https://api.kashier.io/v3/payment/tokenization/tokens?sortType=-1&page=1&limit=20)           |
| Method   | GET                                                                                                                                                                                |

### Parameters [#parameters]

| Parameter | Type            | Description                                     |
| --------- | --------------- | ----------------------------------------------- |
| sortType  | Query Parameter | Used to sort the results (-1 = DESC, 1 = ASC).  |
| page      | Query Parameter | Current page number (used for pagination).      |
| limit     | Query Parameter | Number of items per page (used for pagination). |

### Headers [#headers]

| Key           | Description                                                                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from the Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl --location 'https://test-api.kashier.io/v3/payment/tokenization/tokens?sortType=-1&page=1&limit=20'
     --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt title="Try it — list tokens" method="GET" url="https://test-api.kashier.io/v3/payment/tokenization/tokens?sortType=-1&page=1&limit=20" sendApiKey="false" />

### Response structure [#response-structure]

```json
{
  "message": "success",
  "data": [
    {
      "cardHolderName": "Hegab",
      "token": "a559ecc6-11a2-431a-b40c-c10df4e7a9df",
      "agreementId": "65d4717c2b2c17002469e463",
      "customerReference": "12345",
      "agreementType": "UNSCHEDULED",
      "agreementExpiry": "N/A",
      "cardNumber": "5123********2346"
    },
    {
      "cardHolderName": "Hussein Mo",
      "token": "efca2dc1-ea90-480b-99ae-00f072fbc516",
      "agreementId": "668bc3b9b2c0fe0024a37af0",
      "customerReference": "12345",
      "agreementType": "UNSCHEDULED",
      "agreementExpiry": "2024-12-13T13:32:05.000Z",
      "cardNumber": "5123********0008"
    },
    {
      "cardHolderName": "TEST",
      "token": "c34faed2-b1e3-4ebf-99ab-992ef2f70d61",
      "agreementId": "66043d39ec69ad0024b9c012",
      "customerReference": "123456",
      "agreementType": "RECURRING",
      "agreementExpiry": "2024-11-14T15:47:29.448Z",
      "cardNumber": "5078********5581"
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 20,
    "page": 1,
    "pages": 1
  }
}
```

### `RECURRING` vs `UNSCHEDULED` agreement types [#recurring-vs-unscheduled-agreement-types]

The response above shows tokens with `agreementType` set to both `RECURRING` and `UNSCHEDULED` — the same values appear as `agreement.type` in the [Save token](#save-token) request example. What's confirmed is that both are valid `agreement.type` / `agreementType` values:

| Value         | Confirmed meaning                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `RECURRING`   | A scheduled recurring agreement — billed on a fixed schedule (see `paymentFrequency` in the [Save token](#save-token) example). |
| `UNSCHEDULED` | A card-on-file agreement without a fixed billing schedule.                                                                      |

Beyond this, no further guidance on choosing between the two is documented — treat the table above as what's confirmed, not a complete decision guide.

## Save token [#save-token]

Saving a card is a [payment session](/docs/accept-payments/payment-sessions) create call with an `agreement` object and `saveCard` set — the session renders the payment UI, and the token and agreement come back on the webhook once the customer pays.

| Endpoint | Value                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v3/payment/sessions](https://test-api.kashier.io/v3/payment/sessions) |
| LIVE-URL | [https://api.kashier.io/v3/payment/sessions](https://api.kashier.io/v3/payment/sessions)           |
| Method   | POST                                                                                               |

### Headers [#headers-1]

| Key           | Description                                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization | Your Secret Key, used to identify the merchant. You can obtain it from the Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |
| api-key       | Your Payment API Key, from the merchant dashboard under the **Integrations** section. It differs between the test and live environments.                            |
| Content-Type  | application/json                                                                                                                                                    |

```bash
curl --location 'https://test-api.kashier.io/v3/payment/sessions'

--header 'Authorization: YOUR_TEST_SECRET_KEY'
--header 'api-key: YOUR_TEST_API_KEY'
--data '{
"expireAt": "2027-10-31T17:27:32.359Z",
"maxFailureAttempts": 3,
"paymentType": "credit",
"amount": "1",
"currency": "EGP",
"merchantId": "MID-XXXXX-XXX",
"merchantOrderId": "ORD-123456",
"merchantRedirect": "https://your-website.com/redirect",
"display": "en",
"type": "one-time",
"allowedMethods": "card",
"redirectMethod": null,
"iframeBackgroundColor": "#FFFFFF",
"metaData": {
"customKey": "customValue"
},
"failureRedirect": false,
"brandColor": "#FF5733",
"defaultMethod": "card",
"description": "Payment for order ORD-123456",
"manualCapture": false,
"customer": {
"reference": "ahmed"
},
"agreement": {
"type": "RECURRING",
"amountVariability": "VARIABLE",
"paymentFrequency": "MONTHLY",
"expiryDate": "2027-01-27",
"minimumDaysBetweenPayments": 20,
"maximumAmountPerPayment": 20000,
"numberOfPayments": 100
},
"saveCard": "forced",
"retrieveSavedCard": true,
"interactionSource": "RECURRING",
"enable3DS": true,
"serverWebhook": "https://your-website.com/kashier-webhook",
"notes": "test"
}'
```

### Body description [#body-description]

<Accordions type="multiple">
  <Accordion title="Field reference">
    | Parameter                    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Required |
    | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
    | expireAt (string)            | When the payment session expires.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | TRUE     |
    | maxFailureAttempts (integer) | Maximum number of failed payment attempts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | TRUE     |
    | amount (string)              | Order amount, e.g., `100`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | TRUE     |
    | currency (string)            | Order currency, e.g., `EGP`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | TRUE     |
    | merchantOrderId (string)     | Unique order identifier.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | TRUE     |
    | merchantId (string)          | Merchant account number or merchant ID, e.g., `MID-123-123`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | TRUE     |
    | metaData (object)            | Order metadata, as a `JSON` object of key/value pairs — see the sample body above.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | FALSE    |
    | description (string)         | Order description; must be less than 120 characters.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | FALSE    |
    | allowedMethods (string)      | Defines allowed payment methods. Omit it to fall back to the default method list configured for your account. If you want to display only a specific provider (for example, Valu or QNB), you can do so by specifying it within array brackets alongside its payment method. For example: `bnpl[valu]`, `bank_installments[qnb]`, and so on. In test mode the payment UI shows only card and wallet regardless of what you send.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | FALSE    |
    | metaData.displayNote         | An object with key:value pairs, e.g. `"metaData": {"customKey": "customValue","displayNotes": {"key": "value"}}`. The note will be displayed on the payment UI screen.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | FALSE    |
    | defaultMethod (string)       | Determines which method the payment UI opens on. By default it opens on the card method. defaultMethod accepts the pattern "method,provider/abbreviation". For example, to open the payment UI on the installment method, the defaultMethod value should be `bank_installments`. To open it on certain installment plans of NBE bank, the value should be `bank_installments,NBE`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | FALSE    |
    | merchantRedirect (string)    | merchantRedirect should be URI encoded: `urlencode(https://www.your_website.com/redirect)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | TRUE     |
    | serverWebhook (string)       | Pass an endpoint to receive server-to-server notifications. On your application this is as easy as creating a new page that accepts unauthenticated POST requests. The event object is sent as JSON in the request body. See [Webhook](/docs/webhooks/payloads).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | FALSE    |
    | redirectMethod (string)      | The redirection method after payment. Default method is get, e.g. `redirectMethod="post"`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | FALSE    |
    | failureRedirect (string)     | Whether to redirect after the first payment failure. Its value is TRUE or FALSE; default value is TRUE.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | FALSE    |
    | type (string)                | Defines the type of Kashier origin. Default: `one-time`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | TRUE     |
    | brandColor (string)          | Specifies branding color using a hex or rgba value. Default: `rgba(45, 164, 78, 0.9)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | FALSE    |
    | display (string)             | Specifies the display language of the iframe. Options: `ar` or `en`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | TRUE     |
    | manualCapture (bool)         | `TRUE`: Authorize first, then capture/release. `FALSE`: Direct capture without authorization.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | FALSE    |
    | customer (string)            | An object that contains the customer information. Please note that it should include customer.reference, which will be used to link the merchant's customer with the payment's customer, and it should only be included when saveCard is optional or forced: `"customer": {"email": "john@example.com ","reference": "65489463"}`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | FALSE    |
    | saveCard (string)            | Defines if card information is saved. Options: `optional` or `forced`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | FALSE    |
    | interactionSource (string)   | Must be `RECURRING` when saving a card for repeat payments.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | FALSE    |
    | enable3DS (bool)             | `TRUE`: Enables 3DS for saved card payments. `FALSE`: Disables 3DS.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | FALSE    |
    | notes (string)               | Add any additional information about this payment. This could include special instructions, or context for the recipient.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | FALSE    |
    | agreement                    | The agreement object defines the parameters of a recurring payment arrangement. Its fields include:<br />- type (string): Specifies the type of agreement. In this case, "RECURRING" indicates that payments will occur periodically.<br />- amountVariability (string): Determines whether the payment amounts are fixed or variable. "VARIABLE" means the payment amount can change for each cycle.<br />- paymentFrequency (string): Indicates how often payments occur. "MONTHLY" means the payment is scheduled once every month.<br />- expiryDate (string): The date when the agreement ends, formatted as YYYY-MM-DD. Here, the agreement expires on "2027-01-27".<br />- minimumDaysBetweenPayments (integer): The minimum number of days required between consecutive payments. In this example, it is 20 days.<br />- maximumAmountPerPayment (integer): The upper limit for each payment amount. The maximum here is 20000 (currency unit depends on implementation).<br />- numberOfPayments (integer): The total number of payments allowed under this agreement. Here, it is set to 100. | FALSE    |
  </Accordion>
</Accordions>

### Response structure [#response-structure-1]

```json
{
  "status": "CREATED",
  "failureAttempts": 0,
  "capturedAmount": 0,
  "refundedAmount": 0,
  "_id": "67adc07584f10c00121f6739",
  "merchantId": "MID-XXXXX-XXX",
  "expireAt": "2027-10-31T17:27:32.359Z",
  "maxFailureAttempts": 3,
  "paymentParams": {
    "paymentType": "credit",
    "amount": "1",
    "currency": "EGP",
    "merchantOrderId": "ORD-123456",
    "merchantRedirect": "https://your-website.com/redirect",
    "display": "en",
    "type": "one-time",
    "allowedMethods": "card",
    "customer": { "reference": "ahmed" },
    "agreement": {
      "type": "RECURRING",
      "amountVariability": "VARIABLE",
      "paymentFrequency": "MONTHLY",
      "expiryDate": "2027-01-27",
      "minimumDaysBetweenPayments": 20,
      "maximumAmountPerPayment": 20000,
      "numberOfPayments": 100
    },
    "saveCard": "forced",
    "retrieveSavedCard": true,
    "interactionSource": "RECURRING",
    "enable3DS": true,
    "serverWebhook": "https://your-website.com/kashier-webhook"
  },
  "history": [{ "status": "CREATED", "date": "2026-08-25T09:50:45.360Z" }],
  "webhookNotifications": [],
  "createdAt": "2026-08-25T09:50:45.363Z",
  "updatedAt": "2026-08-25T09:50:45.363Z",
  "sessionUrl": "https://payments.kashier.io/session/67adc07584f10c00121f6739?mode=test"
}
```

Send the customer to `sessionUrl` — or render it in an iframe, as in [payment sessions](/docs/accept-payments/payment-sessions). The session is created in `CREATED` state; &#x2A;_no card is saved and no token exists yet._*

<Callout title="The token arrives on the webhook, not here">
  This call only creates the session. The `cardToken` and the confirmed `agreement` are delivered to your `serverWebhook` once the customer completes payment — see [webhook payloads](/docs/webhooks/payloads). Do not expect a token in this response.
</Callout>

## Pay with tokens [#pay-with-tokens]

| Endpoint | Value                                                                          |
| -------- | ------------------------------------------------------------------------------ |
| TEST-URL | [https://test-fep.kashier.io/v3/orders](https://test-fep.kashier.io/v3/orders) |
| LIVE-URL | [https://fep.kashier.io/v3/orders](https://fep.kashier.io/v3/orders)           |
| Method   | POST                                                                           |

### Headers [#headers-2]

| Key          | Description                                                                                                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kashier-Hash | Order hash [generated in hashing](/docs/direct-api/hashing). Append `.{customerReference}` to the signed string — it is required whenever `card.save`, `card.cardToken`, or `card.agreement` is present. |

```bash
curl --location 'https://test-fep.kashier.io/v3/orders'

--header 'kashier-hash: {{hash}}'
--header 'Content-Type: application/json'
--data '{
"apiOperation":"PAY",
"paymentMethod":{
"type":"CARD",
"card":{
"agreement":{
"id":"03c331af-88b5-47ed-be28-6c671e760d5c"
},
"enable3DS":false,
"cardToken":"c3a64de8-c172-40e6-8412-0bb2e2b7e895"
}
},
"order":{
"reference":"PM-1756736464046963252",
"amount":100,
"currency":"EGP"
},
"shipping":{
"address":{
"city":null,
"company":null,
"country":null,
"postcodeZip":null,
"source":null,
"stateProvince":null,
"stateProvinceCode":null,
"street":null,
"street2":null,
"sameAsBilling":true
},
"method":"",
"origin":{
"postcodeZip":""
}
},
"billing":{
"address":{
"city":null,
"company":null,
"country":null,
"postcodeZip":null,
"source":null,
"stateProvince":null,
"stateProvinceCode":null,
"street":null,
"street2":null
}
},
"interactionSource":"CONTAUTH",
"reconciliation":{
"webhookUrl":"https://your-call-back-url.com",
"merchantRedirect":"https://your-call-back-url.com"
},
"merchantId":"MID-XXXXX-XXX",
"customer":{
"reference":"12345963852"
}
}'
```

Full parameter and response reference → [Pay with token](/docs/api-reference/tokens/payWithToken).

## Bulk charge [#bulk-charge]

<Callout type="warn" title="Bulk charge is off until Kashier enables it">
  Bulk charge is gated by the per-merchant **bulk charge** feature flag. While it is off, both bulk-charge endpoints reject the request with `400` and the message key `message.bulk.charge.disabled`, even though your secret key is valid. A new merchant account starts with only a small default set of features enabled, so assume bulk charge is off until you have asked Kashier ops to turn it on.
</Callout>

| Endpoint | Value                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v3/payment/bulk-charge](https://test-api.kashier.io/v3/payment/bulk-charge) |
| LIVE-URL | [https://api.kashier.io/v3/payment/bulk-charge](https://api.kashier.io/v3/payment/bulk-charge)           |
| Method   | POST                                                                                                     |

### Headers [#headers-3]

| Key           | Description                                                                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from the Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl --location 'https://test-api.kashier.io/v3/payment/bulk-charge'
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
  --form 'file=@"/home/k/Downloads/tokens_export.xlsx"'
```

### Response structure [#response-structure-2]

```json
{
  "message": "success"
}
```

## Bulk charge runner [#bulk-charge-runner]

| Endpoint | Value                                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v3/payment/bulk-charge/runner](https://test-api.kashier.io/v3/payment/bulk-charge/runner) |
| LIVE-URL | [https://api.kashier.io/v3/payment/bulk-charge/runner](https://api.kashier.io/v3/payment/bulk-charge/runner)           |
| Method   | GET                                                                                                                    |

### Headers [#headers-4]

| Key           | Description                                                                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from the Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl --location 'https://test-api.kashier.io/v3/payment/bulk-charge/runner'
  --header 'Authorization:  YOUR_TEST_SECRET_KEY'
```

<ApiTryIt title="Try it — bulk charge runner" method="GET" url="https://test-api.kashier.io/v3/payment/bulk-charge/runner" sendApiKey="false" />

### Response structure [#response-structure-3]

```json
{
  "message": "success"
}
```

## Export tokens [#export-tokens]

| Endpoint | Value                                                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v3/payment/tokenization/tokens/export](https://test-api.kashier.io/v3/payment/tokenization/tokens/export) |
| LIVE-URL | [https://api.kashier.io/v3/payment/tokenization/tokens/export](https://api.kashier.io/v3/payment/tokenization/tokens/export)           |
| Method   | GET                                                                                                                                    |

### Headers [#headers-5]

| Key           | Description                                                                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from the Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl --location 'https://test-api.kashier.io/v3/payment/tokenization/tokens/export'
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt title="Try it — export tokens" method="GET" url="https://test-api.kashier.io/v3/payment/tokenization/tokens/export" sendApiKey="false" />

### Response structure [#response-structure-4]

The response is a file that will be automatically downloaded in your browser.

## Delete token [#delete-token]

| Endpoint | Value                                                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v3/payment/tokenization/tokens/:token](https://test-api.kashier.io/v3/payment/tokenization/tokens/:token) |
| LIVE-URL | [https://api.kashier.io/v3/payment/tokenization/tokens/:token](https://api.kashier.io/v3/payment/tokenization/tokens/:token)           |
| Method   | DELETE                                                                                                                                 |

### Headers [#headers-6]

| Key           | Description                                                                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from the Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl --location --request DELETE 'https://test-api.kashier.io/v3/payment/tokenization/tokens/:token'
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt title="Try it — delete token" method="DELETE" url="https://test-api.kashier.io/v3/payment/tokenization/tokens/:token" sendApiKey="false" />

### Response structure [#response-structure-5]

```json
{
  "message": "success"
}
```

# Refunds (/docs/accept-payments/refunds)

Refund a successful transaction in part or in full. Refunds are paid from your available Kashier balance — pending balance is not included.

<Callout title="Refund and void share one endpoint">
  Refund and [void](/docs/accept-payments/void) are the same endpoint — `PUT /v3/orders/:orderId`. Only `apiOperation` differs: send `REFUND` to refund, `VOID` to cancel.
</Callout>

## Create a refund [#create-a-refund]

To make a refund, send a PUT request to `/v3/orders/:orderId`. The only path parameter is the Kashier order ID — the transaction you are refunding goes in the body, as `transaction.targetTransactionId`. Omit it and Kashier refunds against the order's pay transaction. For a partial refund, send `transaction.amount` in the body as well. It is not permitted for the refund amount to exceed the amount of the original transaction.

In case you are still in the development phase, you will need to call our API using the following testing endpoint API URL:

| Endpoint | Value                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------ |
| URL      | [https://test-fep.kashier.io/v3/orders/:orderId](https://test-fep.kashier.io/v3/orders/:orderId) |
| Method   | PUT                                                                                              |

Meanwhile, whenever you are ready for production, you should use the following production API endpoint URL instead:

| Endpoint | Value                                                                                  |
| -------- | -------------------------------------------------------------------------------------- |
| URL      | [https://fep.kashier.io/v3/orders/:orderId](https://fep.kashier.io/v3/orders/:orderId) |
| Method   | PUT                                                                                    |

### Headers [#headers]

| Key           | Description                                                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication) |

<Callout title="This call takes your secret key, not a hash">
  Refund, void and capture authenticate with the `Authorization` **secret key** — the same credential the [Dashboard API](/docs/dashboard-api/authentication) uses — and a refund additionally needs the refund permission on that key's role. That differs from the pay call on the same host: creating a payment (`POST /v3/orders`) is gated by a [`Kashier-Hash`](/docs/direct-api/hashing) header and takes no secret key. `PUT /v3/orders/:orderId` takes no `Kashier-Hash`, so there is nothing to compute here.
</Callout>

```bash
curl -X 'PUT' 'https://test-fep.kashier.io/v3/orders/:orderId'
  -H 'Authorization: your_secretKey' -H 'accept: application/json'
  -H 'Content-Type: application/json'
  -d '{"apiOperation":"REFUND","reason":"any reason","transaction":{"amount":3}}'
```

<ApiTryIt
  method="PUT"
  url="https://test-fep.kashier.io/v3/orders/:orderId"
  body="{
  apiOperation: 'REFUND',
  reason: 'any reason',
  transaction: { amount: 3 },
}"
  sendApiKey="false"
/>

### Body structure [#body-structure]

```bash
curl -X 'PUT' 'https://test-fep.kashier.io/v3/orders/:orderId'
  -H 'Authorization: your_secretKey'
  -H 'accept: application/json'
  -H 'Content-Type: application/json'
  -d '{"apiOperation":"REFUND","reason":"any reason","transaction":{"amount":3}}'
```

`transaction.amount` is optional. Omit it for a full refund; send it for a partial one. `transaction.targetTransactionId` is optional too — send it to refund a specific prior transaction on the order. `reason` is optional.

Full parameter and response reference → [Refund, void, or capture an order](/docs/api-reference/order-operations/updateOrder).

## Refund status [#refund-status]

| Status  | Description                                                                                                          |
| ------- | -------------------------------------------------------------------------------------------------------------------- |
| SUCCESS | Refund has successfully been processed by the processor.                                                             |
| FAILURE | Refund could not be processed. No money moved — the original payment is untouched and the customer was not refunded. |
| PENDING | Refund initiated, waiting for response from the processor                                                            |

<Callout title="Maximum refund amount">
  The refund amount must not be more than the original transaction amount.
</Callout>

# Settlement (/docs/accept-payments/settlement)

The Kashier Settlement API provides endpoints for retrieving settlement windows and exporting settlement batch data. These APIs enable merchants to track their settlement transactions.

<Callout title="Don't want to wait for the window?">
  If you'd rather not wait for a transaction's regular settlement window, see [Instant Settlement](/docs/payouts/instant-settlement) — request an early payout of eligible transactions for a fee.
</Callout>

## Get settlement windows [#get-settlement-windows]

Retrieve a list of settlement windows with optional filtering and sorting.

| Endpoint | Value                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| LIVE-URL | [https://api.kashier.io/v3/payment/settlement/windows](https://api.kashier.io/v3/payment/settlement/windows) |
| Method   | GET                                                                                                          |

<Callout title="Note">
  This API can only be performed on live data. In testing mode, there are no settlement windows or batches. The `test-api.kashier.io` examples below show the request shape only — against a test host they never return data. Call the live host with your live secret key.
</Callout>

### Required permissions [#required-permissions]

Your key must carry the `balance.all.view_balance` permission. A key without it is rejected even when the secret key itself is valid.

### Query parameters [#query-parameters]

| Key           | Value                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| page          | current page number, default 1                                                                                                              |
| limit         | number of records per page, default 20                                                                                                      |
| q             | Search term. A value prefixed with `TX-` resolves the window containing that settlement transaction id.                                     |
| sortType      | 1=>ASCENDING, -1=>DESCENDING                                                                                                                |
| sortBy        | sort field, default createdAt                                                                                                               |
| dateFrom      | The settlement window date to start search from                                                                                             |
| dateTo        | The settlement window date to end search at                                                                                                 |
| status        | The settlement window status: `open`, `in_progress`, `closed`, or `failed`. Default `all` applies no status filter.                         |
| batchDateFrom | Batch start date                                                                                                                            |
| batchDateTo   | Batch end date                                                                                                                              |
| action        | Set to `export` to download the settlement windows list as an Excel file instead of JSON (requires `balance.all.export_balance` permission) |

### Window status values [#window-status-values]

| Value         | What it means for your payout                                                         |
| ------------- | ------------------------------------------------------------------------------------- |
| `open`        | Window is still accumulating transactions. Nothing has been paid out yet.             |
| `in_progress` | Settlement processing is running. The payout is being prepared but has not landed.    |
| `closed`      | Settled. The transactions in this window have been paid out.                          |
| `failed`      | Settlement processing failed for this window. Nothing was paid out — contact support. |

```bash
curl --location 'https://test-api.kashier.io/v3/payment/settlement/windows?sortBy=&sortType=-1&limit=20&page=1&q=&dateFrom='
      --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

### Headers [#headers]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Permissions [#permissions]

| Permission                   | Use case                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| `balance.all.view_balance`   | Required to read settlement windows via `GET /v3/payment/settlement/windows`                 |
| `balance.all.export_balance` | Required when using `action=export` to download the settlement windows list as an Excel file |

### Response structure [#response-structure]

```json
{
  "message": "success",
  "data": [
    {
      "accountId": "ACC-XXXXXXXX",
      "merchantId": "MID-XXXXX-XXX",
      "windowId": "STW-2123288831",
      "windowDate": "2025-07-21 00:00",
      "status": "closed",
      "totalSettlementAmount": 9450,
      "totalOriginalAmount": 10000,
      "transactionsCount": 12,
      "batchesCount": 2,
      "batchesIds": "BATCH-1,BATCH-2,"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "page": 1,
    "pages": 1
  }
}
```

### Response fields [#response-fields]

| Field                   | Type   | Description                                                                                                                                                                                           |
| ----------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accountId`             | String | Your settlement account ID at Kashier.                                                                                                                                                                |
| `merchantId`            | String | Your merchant ID.                                                                                                                                                                                     |
| `windowId`              | String | The Kashier ID for this settlement window.                                                                                                                                                            |
| `windowDate`            | String | The date of the settlement window.                                                                                                                                                                    |
| `status`                | String | Window status — see [Window status values](#window-status-values). `closed` means the window is settled and its transactions have been paid out.                                                      |
| `totalSettlementAmount` | Number | The **net** amount to be settled for the window — what actually lands in your account, after fees and VAT.                                                                                            |
| `totalOriginalAmount`   | Number | The **gross** transactions amount for the window, before fees and VAT. Reconcile the difference between this and `totalSettlementAmount` against the per-transaction fee columns in the batch export. |
| `transactionsCount`     | Number | The number of transactions that will be settled in this window.                                                                                                                                       |
| `batchesCount`          | Number | Number of batches in the window. Each batch carries its own `channel`, `method`, ready-for-settlement date, and fee totals.                                                                           |
| `batchesIds`            | String | The IDs of the batches inside the window, comma-separated.                                                                                                                                            |

The window list gives you counts and IDs, not the batches themselves. For the per-transaction fee breakdown, call [Export settlement batches](#export-settlement-batches) with the `windowId`.

## Export settlement batches [#export-settlement-batches]

Export settlement batch details for a specific settlement window.

| Endpoint | Value                                                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| LIVE-URL | [https://api.kashier.io/v3/payment/settlement/windows/batches/export](https://api.kashier.io/v3/payment/settlement/windows/batches/export) |
| Method   | GET                                                                                                                                        |

<Callout title="Note">
  This API can only be performed on live data. In testing mode, there are no settlement windows or batches. The `test-api.kashier.io` example below shows the request shape only — against a test host there is nothing to export.
</Callout>

### Required permissions [#required-permissions-1]

Export requires the `balance.all.export_balance` permission on your key, in addition to `balance.all.view_balance` for reading windows.

### Query parameters [#query-parameters-1]

| Key | Value                                                                                                    |
| --- | -------------------------------------------------------------------------------------------------------- |
| q   | Search query. A value prefixed with `TX-` resolves the window containing that settlement transaction id. |

```bash
curl --location 'https://test-api.kashier.io/v3/payment/settlement/windows/batches/export?q=STW-2123288831'
      --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

### Headers [#headers-1]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Permissions [#permissions-1]

| Permission                   | Use case                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `balance.all.export_balance` | Required to export settlement batch data via `GET /v3/payment/settlement/windows/batches/export` |

### Response structure [#response-structure-1]

- Status: 200 OK
- Content-Type: application/vnd.ms-excel
- Response: Excel file containing batch data will be downloaded.

## Notes [#notes]

- Ensure that the Authorization header contains a valid secret key.
- Use proper date formats (YYYY-MM-DD) when filtering results.
- The export endpoint returns an Excel file containing batch details.

# Transactions (/docs/accept-payments/transactions)

The Kashier Transactions API provides endpoints for retrieving transaction data and exporting transaction batch data. These APIs enable merchants to monitor their transactions.

## Get all transactions [#get-all-transactions]

This endpoint allows merchants to retrieve a list of transaction records based on multiple optional filter parameters, such as currency, amount, status, and channel. The data can be paginated, sorted, and searched.

| Endpoint | Value                                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| LIVE-URL | [https://api.kashier.io/v2/aggregator/transactions](https://api.kashier.io/v2/aggregator/transactions)           |
| Method   | GET                                                                                                              |
| TEST-URL | [https://test-api.kashier.io/v2/aggregator/transactions](https://test-api.kashier.io/v2/aggregator/transactions) |
| Method   | GET                                                                                                              |

Full parameter and response reference → [Get all transactions](/docs/api-reference/transactions/listTransactions).

```bash
curl --location 'https://test-api.kashier.io/v2/aggregator/transactions?currency=EGP&sortType=-1&limit=20&page=1'
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt title="Try it — list transactions" method="GET" url="https://test-api.kashier.io/v2/aggregator/transactions" sendApiKey="false" />

### Headers [#headers]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Filter values [#filter-values]

Filter values are case-sensitive and validated against a fixed set. Send them exactly as shown:

| Parameter     | Accepted values                                   |
| ------------- | ------------------------------------------------- |
| `status`      | `Approved`, `Rejected`, `Unknown`, `all`          |
| `type`        | `PAYMENT`, `REFUND`, `AUTHORIZE`, `all`           |
| `currency`    | `EGP`, `EUR`, `USD`, `GBP`, `all`                 |
| `channel`     | `online`, `pos`, `all`                            |
| `paymentType` | `Invoice`, `paymentPage`, `paymentRequest`, `all` |

Pass multiple values as a comma-separated list. The literal `all` means no filter on that parameter.

Lowercase values such as `status=approved` or `type=payment` are rejected with 400. Unknown query keys are also rejected with 400 — remove any parameter that is not documented rather than passing it empty.

The `status` filter accepts only `Approved`, `Rejected`, and `Unknown`. Rows projected as `Expired` or `Pending` cannot be selected by this filter; retrieve them without a `status` filter and filter client-side.

## Get transaction details [#get-transaction-details]

This endpoint allows merchants to retrieve detailed information about a single transaction using its unique reference ID.

| Endpoint | Value                                                                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| LIVE-URL | [https://api.kashier.io/v2/aggregator/transactions/:transactionId](https://api.kashier.io/v2/aggregator/transactions/:transactionId)           |
| Method   | GET                                                                                                                                            |
| TEST-URL | [https://test-api.kashier.io/v2/aggregator/transactions/:transactionId](https://test-api.kashier.io/v2/aggregator/transactions/:transactionId) |
| Method   | GET                                                                                                                                            |

```bash
curl --location 'https://test-api.kashier.io/v2/aggregator/transactions/:trxId'
--header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt title="Try it — transaction details" method="GET" url="https://test-api.kashier.io/v2/aggregator/transactions/:transactionId" sendApiKey="false" />

### Headers [#headers-1]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

Full parameter and response reference → [Get transaction details](/docs/api-reference/transactions/getTransactionDetails).

## Transaction statuses [#transaction-statuses]

The list endpoint and the details endpoint report status in two different vocabularies. Both describe the same transaction.

| Surface                                                | `status` field      | Vocabulary                                                            |
| ------------------------------------------------------ | ------------------- | --------------------------------------------------------------------- |
| List (`/v2/aggregator/transactions`)                   | Computed projection | `Approved`, `Rejected`, `Unknown`, `Expired`, `Pending` (capitalized) |
| Details (`/v2/aggregator/transactions/:transactionId`) | Stored status       | `SUCCESS`, `FAILURE`, `PENDING` (uppercase)                           |
| Webhooks                                               | Stored status       | `SUCCESS`, `FAILURE`, `PENDING` (uppercase)                           |

This is why a row can read `Approved` in the list while your webhook for the same payment read `SUCCESS`. Neither is wrong.

Each list row also carries `lastStatus`, which is the stored order status — for example `CAPTURED` on a captured payment. Use `lastStatus` when you need the order's money state rather than the projection.

### Projection mapping [#projection-mapping]

| List `status` | Stored status it is projected from |
| ------------- | ---------------------------------- |
| `Approved`    | `SUCCESS`                          |
| `Rejected`    | `FAILURE`, or `INITIATED`          |
| `Unknown`     | `UNKNOWN`, and any unmapped case   |
| `Expired`     | `EXPIRED`                          |
| `Pending`     | `PENDING`                          |

<Callout title="Rejected does not always mean declined">
  A transaction still sitting at `INITIATED` — created but never completed by the customer or the provider — projects to `Rejected` in the list. Before treating a `Rejected` row as a hard decline, check `lastStatus` and `transactionResponseCode`, or fetch the transaction details for the stored status.
</Callout>

Reconcile on the stored status from the details endpoint or your webhooks. Use the list projection for reporting and dashboard-style views.

## Export transaction batches [#export-transaction-batches]

This API allows you to export transaction data based on specific filters such as status and date range. It is typically used for reporting, reconciliation, and data analysis by aggregators or merchants.

| Endpoint | Value                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------- |
| LIVE-URL | [https://api.kashier.io/v3/payment/export](https://api.kashier.io/v3/payment/export)           |
| Method   | GET                                                                                            |
| TEST-URL | [https://test-api.kashier.io/v3/payment/export](https://test-api.kashier.io/v3/payment/export) |
| Method   | GET                                                                                            |

Full parameter and response reference → [Export transaction batches](/docs/api-reference/transactions/exportTransactionBatches).

```bash
curl --location 'https://test-api.kashier.io/v3/payment/export?status=Approved&startDate=2024-10-27T00%3A00%3A00.000Z&endDate=2024-11-27T23%3A59%3A59.999Z'
--header 'Accept: application/json, text/plain, */*'
--header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt title="Try it — export transaction batches" method="GET" url="https://test-api.kashier.io/v3/payment/export" sendApiKey="false" />

### Headers [#headers-2]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

# Void (/docs/accept-payments/void)

The amount of the order's transaction is either canceled fully or partially, where you can cancel either a pay, refund, authorize, or capture operation.

<Callout title="Void and refund share one endpoint">
  Void and [refund](/docs/accept-payments/refunds) are the same endpoint — `PUT /v3/orders/:orderId`. Only `apiOperation` differs: send `VOID` to cancel, `REFUND` to refund.
</Callout>

## Getting started [#getting-started]

This is done by sending a PUT request with your order ID `orderId` in the URL as a parameter, and inserting a `transactionId`.

| Endpoint | Value                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-fep.kashier.io/v3/orders/:orderId](https://test-fep.kashier.io/v3/orders/:orderId) |
| LIVE-URL | [https://fep.kashier.io/v3/orders/:orderId](https://fep.kashier.io/v3/orders/:orderId)           |
| Method   | PUT                                                                                              |

### Headers [#headers]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

<Callout title="This call takes your secret key, not a hash">
  Void, refund and capture authenticate with the `Authorization` **secret key** — the same credential the [Dashboard API](/docs/dashboard-api/authentication) uses — and a void additionally needs the refund permission on that key's role. That differs from the pay call on the same host: creating a payment (`POST /v3/orders`) is gated by a [`Kashier-Hash`](/docs/direct-api/hashing) header and takes no secret key. `PUT /v3/orders/:orderId` takes no `Kashier-Hash`, so there is nothing to compute here.
</Callout>

```bash
curl -X 'PUT' 'https://test-fep.kashier.io/v3/orders/:orderId'
  -H 'Authorization: your_secretKey'
  -H 'accept: application/json'
  -H 'Content-Type: application/json'
  -d '{
      "apiOperation": "VOID",
      "transaction":{
              "amount": 3,
              "targetTransactionId":"TX-1902526801"
          }
  }'
```

<ApiTryIt
  method="PUT"
  url="https://test-fep.kashier.io/v3/orders/:orderId"
  body="{
  apiOperation: 'VOID',
  transaction: {
    amount: 3,
    targetTransactionId: 'TX-1902526801',
  },
}"
  sendApiKey="false"
/>

### Body structure [#body-structure]

```json
{
  "apiOperation": "VOID",
  "transaction": {
    "amount": 3,
    "targetTransactionId": "TX-1902526801"
  }
}
```

`transaction.amount` and `transaction.targetTransactionId` are optional. Omit the whole `transaction` object for a full void of the pay transaction; send `targetTransactionId` to void a specific prior transaction, and `amount` for a partial void.

Full parameter and response reference → [Refund, void, or capture an order](/docs/api-reference/order-operations/updateOrder).

## The same-day void window [#the-same-day-void-window]

Voiding a **pay** or **capture** transaction only works inside a same-day window. Past it Kashier rejects the void, and [refund](/docs/accept-payments/refunds) is the operation you need instead. In short:

- Undoing a payment **today** — use `VOID`.
- Undoing a payment from an **earlier day** — use `REFUND`.

This is the most common reason a void that worked in testing fails in production: the merchant is voiding yesterday's capture. There is no way to widen the window — reach for a refund.

The window is enforced only on `PAY` and `CAPTURE` targets. Voiding an **authorize** transaction — which is how you release an unused hold — is not subject to it. See [authorize and capture](/docs/accept-payments/authorize-capture).

# API reference and playground (/docs/api-reference)

Save your test keys once. Every endpoint page then fills its own auth fields and
request body, so you can press **Send** and read the live response.

<TestKeyBanner />

## Check your setup [#check-your-setup]

<ApiHealthCheck />

## Endpoints [#endpoints]

<ApiDomainCards />

## Good to know [#good-to-know]

- Requests go straight from your browser to Kashier — the documented URLs
  point at the test hosts, and your keys never reach this site's servers.
- Keys stay in your browser's localStorage and travel only with requests you fire.
- Each endpoint renders your request as cURL, JavaScript, Python, PHP and more.
- Everything here is generated from the [OpenAPI spec](/openapi.yaml) — point
  your tooling or AI agent at it.
- New to the API? The [quick start](/docs/get-started/quickstart) walks one
  payment end to end.

# Authentication (/docs/dashboard-api/authentication)

Authenticate your API calls by including your secret key in the Authorization header of every request you make. You can view and manage your secret keys from the [Dashboard > Integrate now > Secret Key](https://merchant.kashier.io/en/integrations#secretkeys).

Generally, we provide both payment API keys and secret keys. The secret key is used to authenticate your API calls by including it in the Authorization header of every request. The payment API key is used to generate the order hash for payment authentication. When signing up, you are provided with a default key, and you can generate unlimited keys to track your channels.

Your [API keys](/docs/get-started/api-keys) carry many privileges, so keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub or client-side code.

<Callout title="Secure your secret key">
  Do not commit your secret keys to Git or use them in client-side code.
</Callout>

Each account is provided with separate keys for testing and live transactions. All API requests exist in either [test or live mode](/docs/get-started/api-keys#test-and-live-modes), and one mode cannot interact with objects in the other.

All API requests must be made over HTTPS. Calls made over plain HTTP will fail. API requests without authentication will also fail.

Authorization headers should follow this format: `Authorization:SECRET_KEY`.

Sample Authorization header:

```http
Authorization: f86a28e62b452ee94a32dc49cde00047$491a5ae27e91294e97247b742d1727600d7b17297309820c590e0cbc0d8b48bc923aa94c5501619882248e58eb7cc
```

Unauthenticated and rejected requests do not all return the same status code:

| Scenario                       | Status | Body                                                   |
| ------------------------------ | ------ | ------------------------------------------------------ |
| No `Authorization` header sent | 403    | `{ "message": "No auth token provided" }`              |
| Invalid or expired credential  | 401    | `{ "error": "Authorization error", "message": "..." }` |
| Secret key cannot be decrypted | 401    | `{ "message": "Invalid secret key" }`                  |
| Caller IP not allow-listed     | 403    | `{ "message": "Unauthorized IP address" }`             |

Only invalid credentials return 401. A missing header returns 403. See [Error responses](/docs/dashboard-api/error-responses) for the full catalog.

## Select the acting merchant [#select-the-acting-merchant]

A user can belong to more than one merchant. When that is the case, send the `authmerchantid` header alongside `Authorization` to choose which MID the call acts on. Without it, Kashier cannot resolve your role for the request.

```http
GET /v2/customers HTTP/1.1
Host: test-api.kashier.io
Authorization: f86a28e62b452ee94a32dc49cde00047$491a5ae27e91294e97247b742d1727600d7b17297309820c590e0cbc0d8b48bc923aa94c5501619882248e58eb7cc
authmerchantid: MID-00-000
```

```bash
curl --location 'https://test-api.kashier.io/v2/aggregator/transactions' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'authmerchantid: MID-00-000'
```

If your user belongs to a single merchant, you can omit the header.

## IP allow-list [#ip-allow-list]

Calls authenticated with a secret key are also checked against your merchant's IP allow-list, after the key itself is validated. A call from a source that is not on the list is rejected with:

```json
{ "message": "Unauthorized IP address" }
```

The response status is `403`.

Key points:

- The allow-list is opt-in. An empty list allows all source IPs; add at least one entry to start restricting.
- The check applies only to secret key calls. Dashboard session (JWT) callers are not IP-checked.
- The client IP is read from the first entry of `X-Forwarded-For`, falling back to the connecting socket address. Behind a proxy or NAT, allow-list the egress IP your traffic actually leaves from.
- Manage the list from the Kashier dashboard. Update it before you migrate servers or change egress IPs, otherwise live calls start failing with 403.

<Callout title="Getting a 403 you cannot explain">
  Check the IP allow-list before re-issuing keys. A valid secret key called from a new server IP returns `Unauthorized IP address`, not an invalid-key error.
</Callout>

## Keeping your keys safe [#keeping-your-keys-safe]

Your keys can be used to perform actions on behalf of your account, such as creating charges or issuing refunds. Treat your keys like any other password — grant access only to those who need it. Ensure they are excluded from version control systems. Use a [password manager](https://en.wikipedia.org/wiki/List_of_password_managers) or [secrets management service](https://en.wikipedia.org/wiki/Key_management#Non-KMIP-compliant_key_management) to manage access securely.

## Compromised keys [#compromised-keys]

If a secret key or payment API key is compromised, immediately expire the key from the Kashier dashboard to prevent data leaks. You can do this by [changing a user secret key](https://merchant.kashier.io/en/integrations#secretkeys) or [deleting a payment API key](https://merchant.kashier.io/en/integrations#apikeys) and generating a new one. Update both the dashboard and your system simultaneously to avoid downtime, as Kashier immediately invalidates expired keys.

<img alt="Invoking secret key" src="__img0" />

## Teams and user roles [#teams-and-user-roles]

Give team members controlled access to your Kashier account. You can invite other team members to access your account. To protect sensitive information or restrict their actions, user roles define their permissions. Manage team members and user roles on your account's team member [settings page > manage team](https://merchant.kashier.io/en/settings/manageTeam/users). Add team members individually using their email addresses.

### Steps to manage your team members' user roles [#steps-to-manage-your-team-members-user-roles]

- Log in to your [Kashier Dashboard](https://merchant.kashier.io/en/login) and navigate to Settings.
- Select "Manage Team," then choose the user you want to edit. Click the three dots in the top-right corner and select "Edit User."

<img alt="Manage team" src="__img1" />

- Choose a default or custom role by clicking the menu selector. This displays all available roles.
- Click "Save" to update the team member's permissions.

<img alt="Change user role" src="__img2" />

## About custom user roles [#about-custom-user-roles]

Custom user roles let you control exactly what team members can see and do on the Kashier Dashboard. If default roles don't meet your needs, you can create a custom role with specific permissions.

### Steps to create custom user roles on the Kashier Dashboard [#steps-to-create-custom-user-roles-on-the-kashier-dashboard]

- Navigate to the "Manage Team" section on the Settings page, then click the "Roles" tab.

<img alt="Create role" src="__img3" />

- Click "Create Role" to open the custom role creation form.

<img alt="Create role form" src="__img4" />

- Fill out the form and click "Save Changes" to create your custom role.

# Error responses (/docs/dashboard-api/error-responses)

Kashier returns more than one error shape. Operational errors from the payment and processing services use the standard envelope below. Authentication, schema, and validation errors are produced before the request reaches a controller and return their own flat shapes instead. Branch your error handling on the HTTP status code first, then on which keys are present.

## Standard error envelope (operational errors) [#standard-error-envelope-operational-errors]

Most business-logic errors — invalid merchant configuration, invalid request objects, and similar — are emitted through a shared envelope, with the HTTP status the error itself carried:

```json
{
   "error": {
       "cause": string       // The technical cause of the error
   },
   "messages": {
       "en": string,        // English error message
       "ar": string         // Arabic error message
   },
   "status": "FAILURE"      // Always "FAILURE" for this envelope
}
```

<Callout title="Not every error uses this envelope">
  Authentication, authorization, schema, and request-validation failures return a flat `{ "message": ... }`, an `{ "error": ... }` string, or a `{ "more_info": [...] }` array — with no `messages` object and no `status` field. Do not require `status` to be present before treating a non-2xx response as an error.
</Callout>

## Common error scenarios [#common-error-scenarios]

### Invalid merchant ID [#invalid-merchant-id]

Occurs when attempting to use an incorrect or non-existent merchant identifier. This is an operational error, so it uses the envelope:

```json
{
  "error": {
    "cause": "The request object is invalid"
  },
  "messages": {
    "en": "This merchant is not found on kashier, example 'MID-XX-XX'",
    "ar": "This merchant is not found on kashier, example 'MID-XX-XX'"
  },
  "status": "FAILURE"
}
```

A separate check rejects a `merchantId` whose _format_ is wrong — anything not matching `MID-<digits>-<digits>` — with HTTP **400** and an `error` string rather than the envelope:

```json
{
  "error": "Invalid merchantId format. It should be in the format MID-XXX-XXX"
}
```

### Missing or rejected authentication [#missing-or-rejected-authentication]

These are returned by the authentication layer before your request reaches an endpoint, so they use flat shapes.

| Scenario                                               | Status | Body                                                    |
| ------------------------------------------------------ | ------ | ------------------------------------------------------- |
| No `Authorization` header sent                         | 403    | `{ "message": "No auth token provided" }`               |
| Credential rejected (bad, expired, or wrong user type) | 401    | `{ "error": "Authorization error", "message": "..." }`  |
| Secret key missing or malformed at the strategy level  | 400    | `{ "message": "Missing token" }`                        |
| Secret key cannot be decrypted                         | 401    | `{ "message": "Invalid secret key" }`                   |
| Secret key caller IP not allow-listed                  | 403    | `{ "message": "Unauthorized IP address" }`              |
| Dashboard session no longer valid                      | 401    | `{ "message": "Please re-authenticate and try again" }` |
| No user resolved for the credential                    | 401    | `{ "message": "Unauthorized" }`                         |

Two of these are worth calling out because they are the most common real integration failures and neither returns the status people expect:

- **A missing `Authorization` header returns 403, not 401.** Only an _invalid_ credential returns 401. See [Authentication](/docs/dashboard-api/authentication).
- **IP allow-list rejection returns `403 { "message": "Unauthorized IP address" }`.** Every Secret Key call is checked against your merchant's IP allow-list after the credential itself has been validated. An empty allow-list permits all IPs, so this only bites once you have added at least one entry — and it looks identical to a permissions problem unless you read the message. Manage the list from [API keys](/docs/get-started/api-keys#ip-allow-list). Dashboard session (JWT) callers are not IP-checked.

Authorization failures — a valid credential whose role lacks the privilege the route requires — surface through the same 401 `Authorization error` shape, with a message such as `Not authorized to perform this action`.

## Validation errors (400) [#validation-errors-400]

Two distinct validation layers can reject a request, and they return two distinct shapes. Check which one you're looking at before parsing.

### Schema validation [#schema-validation]

Requests that fail request-schema validation (missing or malformed fields at the schema level) are caught before anything else and return only a list of the individual violations:

```json
{
  "more_info": [{ "message": "should have required property 'amount'" }]
}
```

| Field       | Type  | Meaning                                                  |
| ----------- | ----- | -------------------------------------------------------- |
| `more_info` | array | The individual schema validation errors that were found. |

HTTP status: **400**. There is no `message`, `messages`, or `status` key on this shape.

### Field-level (body/query/param) validation [#field-level-bodyqueryparam-validation]

Most other input validation — required fields, format checks on individual body, query, or param values — returns a flat, localized message instead:

```json
{
  "message": "merchant ID is required"
}
```

| Field     | Type   | Meaning                                                                              |
| --------- | ------ | ------------------------------------------------------------------------------------ |
| `message` | string | The first validation error found, localized based on your request's language header. |

HTTP status: **400**. Only the first error is returned even when several fields are invalid, so fix and re-send rather than expecting the full list.

## Non-operational / unknown errors [#non-operational--unknown-errors]

An unexpected server-side failure — an unhandled exception rather than a recognized business error — does **not** use the envelope. It returns a flat `message` only:

```json
{
  "message": "Cannot read properties of undefined"
}
```

The HTTP status is the error's own `statusCode` when it has one, and **500** otherwise. A service outage or acquirer downtime (a rare occurrence) surfaces here rather than through the standard envelope.

## Live-mode-only routes [#live-mode-only-routes]

Some routes only operate in live mode and reject calls made with test credentials:

```json
{
  "message": "This API is only available on live mode"
}
```

HTTP status: **403**.

## Duplicate / conflicting records (409) [#duplicate--conflicting-records-409]

Returned when a request would create a record whose unique field already exists — for example reusing an invoice number, a category name, or a payment-request reference for the same merchant:

```json
{
  "status": 409,
  "message": "The invoice number has already been used. Please enter another invoice number.",
  "code": "DUPLICATE_KEY_ERROR"
}
```

Match on `code: "DUPLICATE_KEY_ERROR"` rather than on the message text, which varies by the conflicting field:

| Conflicting field(s)                            | Message                                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| Invoice reference                               | The invoice number has already been used. Please enter another invoice number. |
| Category name (slug)                            | The category name has already been used. Please enter another category name.   |
| `merchantId` + `referenceId` (payment requests) | A payment request with merchantId "..." and referenceId "..." already exists.  |
| Any other duplicate key                         | A duplicate key error occurred. Please check your input and try again.         |

Retrying a 409 with the same payload will fail again. Change the conflicting value or treat the existing record as the result.

Other, non-duplicate database errors return a 400 instead. A Mongo-originated error carries an extra `error: "MongoError"` key alongside `message`; other downstream or generic errors return just `{ "message": "<description>" }`.

## Quick reference by source [#quick-reference-by-source]

The **top-level keys are not uniform** across error paths — some responses use `error.cause` / `messages` / `status`, others use a flat `message`, an `error` string, or a `more_info` array. Branch your client error handling on the HTTP status code together with whichever of these keys is present in the body.

| Error source                                      | HTTP status                 | Top-level keys                                         |
| ------------------------------------------------- | --------------------------- | ------------------------------------------------------ |
| Operational / business-logic error                | varies (error's own status) | `error.cause`, `messages.{en,ar}`, `status: "FAILURE"` |
| Non-operational / unexpected error                | error's own status, or 500  | `message`                                              |
| Schema validation                                 | 400                         | `more_info[]`                                          |
| Field-level validation                            | 400                         | `message`                                              |
| Missing `Authorization` header                    | 403                         | `message`                                              |
| No user resolved from credentials                 | 401                         | `message`                                              |
| Missing/malformed secret-key token                | 400                         | `message`                                              |
| Invalid secret key                                | 401                         | `message`                                              |
| Unauthorized IP address                           | 403                         | `message`                                              |
| Dashboard session expired                         | 401                         | `message`                                              |
| Other auth failure                                | 401                         | `error`, `message`                                     |
| Invalid `merchantId` format                       | 400                         | `error`                                                |
| Live-mode-only route called with test credentials | 403                         | `message`                                              |
| Mongo / DB error                                  | 400                         | `error: "MongoError"`, `message`                       |
| Duplicate key / conflicting record                | 409                         | `status`, `message`, `code: "DUPLICATE_KEY_ERROR"`     |

## Best practices [#best-practices]

1. Treat any non-2xx HTTP status as an error. Do not rely on a `status` field being present — several error paths omit it
2. Read the message from `messages.en` when present, and fall back to the flat `message` or `error` key, then to `more_info`
3. Handle both English and Arabic messages appropriately based on your user's locale
4. Pay special attention to the `error.cause` field for debugging purposes
5. For authorization errors, verify your API key, your hash generation process, and your IP allow-list
6. Match 409 conflicts on `code: "DUPLICATE_KEY_ERROR"` and do not blind-retry them
7. In live mode, ensure your account has the necessary credentials configured for each operation

# Dashboard API (/docs/dashboard-api)

Automate nearly everything you can do in the Kashier dashboard from your own application. The API is REST-shaped and organized around the main resources, with a few exceptions. This page covers the request, response, and pagination format shared by every endpoint.

## Capabilities are enabled per merchant [#capabilities-are-enabled-per-merchant]

Seeing an endpoint in these docs does not mean your account can call it. Many Kashier capabilities are gated behind **per-merchant feature flags**, and a brand-new merchant has only three enabled: multiple balance accounts, payment links, and customers. Everything else is off until Kashier switches it on for your account — you cannot toggle a flag yourself.

If a request fails even though your keys are valid and the path is right, an unenabled capability is a likely cause. There is no single status code for it: some gates reject a disabled capability with a &#x2A;_`400`_&#x2A;, others with a &#x2A;*`401 Unauthorized`**, so do not build a check around one of them.

Two gated capabilities worth knowing about because their pages exist in these docs:

| Capability                                             | Flag                         | Notes                                                                           |
| ------------------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------- |
| [Instant settlement](/docs/payouts/instant-settlement) | `instant_settlement_request` | Off by default; also carries per-merchant limits configured alongside the flag. |
| Connected accounts                                     | `connected accounts`         | Off by default.                                                                 |

Feature flags are separate from permissions. Even with a capability enabled, each route is additionally checked against the privileges on your user's role — see [API keys](/docs/get-started/api-keys). Ask your Kashier account manager to enable a capability, and check your role if a call is rejected while the capability is on.

## Sample requests [#sample-requests]

Every method comes with a [cURL](https://curl.se) sample — drop in your own parameters and run it from the command line.

Prefer a GUI? Import the [Kashier Postman collection](/docs/resources/postman).

## Requests and responses [#requests-and-responses]

Both request body data and response data are formatted as JSON. The content type for responses will always be `application/json`.

The success envelope is **not uniform across the API**. Many v2 endpoints — including the transaction and reporting reads — wrap their result like this:

```json
{
    "body": [object|array], // the result of your request
    "message": [string],    // informational summary. Log it, do not branch on it
    "pagination": [object]  // list endpoints only
}
```

Others return the result under `data` instead — `{ "message": ..., "data": ... }`, with `pagination` alongside it on list reads — and some carry a top-level `status`. Read the response sample on the individual endpoint's page rather than assuming one shape for the whole API, and code defensively for a result that may arrive under either `body` or `data`.

Use the HTTP status code to determine the result of an API call. Where a top-level `status` field is absent, do not test for one.

## Message key [#message-key]

The `message` key is a string containing a summary of the response. For example, when retrieving a list of transactions, the message might read: The payment transactions has been retreived successfully.

The wording is informational and can change. Do not use it for checks.

## Body key [#body-key]

The `body` key contains the result of your request. It can be an object or an array, depending on the endpoint. For example, a request to retrieve a list of transactions returns an array of transaction rows in `body`.

```json
{
  "body": [
    {
      "transactionId": "TX-243585751279",
      "status": "Approved",
      "amount": 105,
      "currency": "EGP"
    }
  ],
  "pagination": {
    "total": 715,
    "page": 1,
    "limit": 1,
    "pages": 715,
    "lastPage": 715
  },
  "message": "The payment transactions has been retreived successfully"
}
```

## Pagination [#pagination]

The `pagination` key provides context for the `body` key's contents. For example, when retrieving a list of transactions performed by a merchant, pagination parameters can limit the result set.

Request pagination with the `page` and `limit` query parameters — `page` is 1-based, `limit` is the number of records per page. List endpoints validate their query string strictly: &#x2A;*an unrecognized query key is rejected with a `400`**, so a misspelled or invented parameter name fails the whole request rather than being ignored.

Pagination differs by endpoint in **shape**, not just in field names. There are two forms, and they are not interchangeable.

**Form 1 — a separate `pagination` key.** Used by the transaction and reporting reads shown above: `body` is the array, and `pagination` sits beside it.

```json
{
  "body": [{ "transactionId": "TX-243585751279" }],
  "pagination": {
    "total": 715,
    "page": 1,
    "limit": 1,
    "pages": 715,
    "lastPage": 715
  },
  "message": "The payment transactions has been retreived successfully"
}
```

**Form 2 — paging fields inside `body`.** Other v2 list endpoints return a paginated document instead: `body` is an _object_ holding `docs` plus the paging counters, and **there is no `pagination` key at all**.

```json
{
  "message": "Connected-account relationships retrieved successfully",
  "body": {
    "docs": [{ "_id": "6a56a2299bc47f0ac91ae562", "status": "PENDING" }],
    "totalDocs": 1,
    "limit": 10,
    "page": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

Check whether `body` is an array or an object before reading paging data, and don't assume `pagination` exists.

## Keys [#keys]

The Form 2 fields above. Some deployments also emit `pagingCounter`, `prevPage` and `nextPage`; treat them as optional and don't require them.

| Key           | Description                                                                                                                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| totalDocs     | The total number of records matching the query across all pages.                                                                                                                                                                                                                           |
| limit         | This is the maximum number of records that will be returned per request. Set it by passing a `limit` query parameter. The default varies by endpoint — order search and settlement-window reads default to 20 — so check the endpoint's own reference rather than assuming a single value. |
| totalPages    | This is how many pages in total are available for retrieval, given the records per page in `limit`.                                                                                                                                                                                        |
| page          | This is the current page being returned. This is dependent on what page was requested using the `page` query parameter, which is 1-based. Default: 1                                                                                                                                       |
| pagingCounter | This is the starting number of first record for retrieval considering the maximum records per page specified.                                                                                                                                                                              |
| hasPrevPage   | This is boolean to give availability of prev page.                                                                                                                                                                                                                                         |
| hasNextPage   | This is boolean to give availability of next page.                                                                                                                                                                                                                                         |
| prevPage      | This is order of previous page if available or NULL.                                                                                                                                                                                                                                       |
| nextPage      | This is order of Next page if available or NULL.                                                                                                                                                                                                                                           |

# Accounts and payout methods (/docs/account-and-balance/accounts)

Every merchant starts with one **primary account**. Where that account pays out — bank name, account number, account holder name, and so on — is not a separate object: those are fields on the &#x2A;*Account's `payoutMethod`**, and you manage them by editing the account.

<Callout title="Your payout method is not a beneficiary">
  An account's `payoutMethod` is where **your own** money lands when Kashier settles to you. A [beneficiary](/docs/payouts/beneficiaries) is a saved recipient **you** pay from your balance. Both describe a payout destination, but they are different resources on different routes — reach for `payoutMethod` to change where you get paid, and beneficiaries to manage who you pay.
</Callout>

You can also create **additional accounts** beyond the primary one, each with its own independent `payoutMethod`. This page covers creating and managing accounts and their payout methods; for the immutable balance ledger and holds, see [Balance ledger and holds](/docs/account-and-balance/balance).

<Callout title="Primary vs. additional accounts">
  `GET`/`PUT /v2/account/payoutMethod` always operate on your **primary** account specifically. To manage an additional (non-primary) account's payout method — or any other field on any account — use `GET`/`PUT /v2/account/:accountId` with that account's `accountId` instead.
</Callout>

<Callout title="No delete operation">
  There is no endpoint to delete an account or a payout method. Once created, an account persists; you can edit its `payoutMethod` and other fields, but not remove the account itself.
</Callout>

## Create an additional account [#create-an-additional-account]

Creates a new, non-primary account for your merchant. There's no cap on the number of accounts you can create today — don't assume there's a limit when designing your integration.

| Endpoint | Value                                                                            |
| -------- | -------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/account](https://test-api.kashier.io/v2/account) |
| LIVE-URL | [https://api.kashier.io/v2/account](https://api.kashier.io/v2/account)           |
| Method   | POST                                                                             |

### Body parameters [#body-parameters]

| Key                            | Description                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| accountName                    | Name for the new account.                                                                                                                                                            |
| payoutMethod                   | Object describing the payout destination. No field inside it is required — you can create the account first and set its payout method later via [Edit an account](#edit-an-account). |
| payoutMethod.method            | Identifies the payout rail, e.g. a bank transfer vs. a mobile wallet.                                                                                                                |
| payoutMethod.accountHolderName | Name on the payout destination. Accepts Arabic and Latin letters, digits, spaces, periods, hyphens, and apostrophes; max 70 characters.                                              |
| payoutMethod.accountNumber     | Bank account number or wallet number.                                                                                                                                                |
| payoutMethod.bankName          | Bank name.                                                                                                                                                                           |
| payoutMethod.bankAbbreviation  | Bank abbreviation/code.                                                                                                                                                              |
| payoutMethod.bankBranchName    | Bank branch name. Required when `isUnlistedBranch` is `true`.                                                                                                                        |
| payoutMethod.bankBranchCode    | Bank branch code. Must be omitted when `isUnlistedBranch` is `true`.                                                                                                                 |
| payoutMethod.isUnlistedBranch  | Boolean, defaults to `false`. Set it to `true` when your branch isn't in the bank's branch list. See [Unlisted bank branches](#unlisted-bank-branches).                              |

```bash
curl --location 'https://test-api.kashier.io/v2/account' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "accountName": "Second Store Account",
    "payoutMethod": {
      "method": "bank",
      "accountHolderName": "Ahmed Hassan",
      "accountNumber": "1234567890",
      "bankName": "National Bank of Egypt",
      "bankAbbreviation": "NBE",
      "bankBranchName": "Downtown",
      "bankBranchCode": "001"
    }
  }'
```

<ApiTryIt
  method="POST"
  url="https://test-api.kashier.io/v2/account"
  body="{
  accountName: 'Second Store Account',
  payoutMethod: {
    method: 'bank',
    accountHolderName: 'Ahmed Hassan',
    accountNumber: '1234567890',
    bankName: 'National Bank of Egypt',
    bankAbbreviation: 'NBE',
    bankBranchName: 'Downtown',
    bankBranchCode: '001',
  },
}"
  sendApiKey="false"
  title="Try it — create an additional account"
/>

### Headers [#headers]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response]

```json
{
  "accountId": "ACC-46254-582-02",
  "accountName": "Second Store Account",
  "merchantId": "MID-46254-582",
  "isPrimary": false,
  "totalBalance": 0,
  "availableBalance": 0,
  "onHoldBalance": 0,
  "payoutFees": 5,
  "isIncludeInBulkTransfer": true,
  "payoutMethod": {
    "method": "bank",
    "accountHolderName": "Ahmed Hassan",
    "accountNumber": "1234567890",
    "bankName": "National Bank of Egypt",
    "bankAbbreviation": "NBE",
    "bankBranchName": "Downtown",
    "bankBranchCode": "001"
  },
  "createdAt": "2026-06-18T10:30:00.000Z",
  "updatedAt": "2026-06-18T10:30:00.000Z"
}
```

| Field                                                 | Description                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| `accountId`                                           | Unique identifier for the new account.                                          |
| `accountName`                                         | The account's name.                                                             |
| `merchantId`                                          | The merchant the account belongs to.                                            |
| `isPrimary`                                           | Always `false` for an account created through this endpoint.                    |
| `totalBalance` / `availableBalance` / `onHoldBalance` | Running balances for the new account — all `0` until it starts receiving funds. |
| `payoutFees`                                          | Flat fee applied per payout for this account.                                   |
| `isIncludeInBulkTransfer`                             | Whether the account is eligible for the recurring payout run.                   |
| `payoutMethod`                                        | The payout destination you supplied, echoed back.                               |
| `createdAt` / `updatedAt`                             | Timestamps.                                                                     |

## Get account info [#get-account-info]

Fetch your **primary** account — a GET request to `/v2/account`, with no account ID needed. To fetch a non-primary account, or to look up the primary account by its `accountId`, use [Get an account](#get-an-account) below instead.

| Endpoint | Value                                                                            |
| -------- | -------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/account](https://test-api.kashier.io/v2/account) |
| LIVE-URL | [https://api.kashier.io/v2/account](https://api.kashier.io/v2/account)           |
| Method   | GET                                                                              |

```bash
curl --location 'https://test-api.kashier.io/v2/account' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/account" sendApiKey="false" title="Try it — get account info" />

### Headers [#headers-1]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-1]

Full parameter and response reference → [Get account info](/docs/api-reference/payouts/getAccountInfo).

## Get an account [#get-an-account]

Fetch a single account by ID, including its `payoutMethod`.

| Endpoint | Value                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/account/:accountId](https://test-api.kashier.io/v2/account/:accountId) |
| LIVE-URL | [https://api.kashier.io/v2/account/:accountId](https://api.kashier.io/v2/account/:accountId)           |
| Method   | GET                                                                                                    |

```bash
curl --location 'https://test-api.kashier.io/v2/account/:accountId' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/account/:accountId" sendApiKey="false" title="Try it — get an account" />

### Headers [#headers-2]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-2]

```json
{
  "accountId": "ACC-46254-582-02",
  "accountName": "Second Store Account",
  "merchantId": "MID-46254-582",
  "isPrimary": false,
  "totalBalance": 12500,
  "availableBalance": 12000,
  "onHoldBalance": 500,
  "allowedNegativeBalance": 0,
  "payoutFees": 5,
  "isIncludeInBulkTransfer": true,
  "payoutMethod": {
    "method": "bank",
    "accountHolderName": "Ahmed Hassan",
    "accountNumber": "1234567890",
    "bankName": "National Bank of Egypt",
    "bankAbbreviation": "NBE",
    "bankBranchName": "Downtown",
    "bankBranchCode": "001"
  },
  "createdAt": "2026-06-18T10:30:00.000Z",
  "updatedAt": "2026-06-20T09:15:00.000Z"
}
```

Fields match the create response above, plus `allowedNegativeBalance` (how far the account may go negative before further deductions are blocked).

## Edit an account [#edit-an-account]

Update an account's name and/or payout method.

<Callout title="Requires OTP">
  This endpoint requires OTP verification. Call it without an `x-otp` header first to trigger the code, then retry the same request with `x-otp` set to the code you received.
</Callout>

| Endpoint | Value                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/account/:accountId](https://test-api.kashier.io/v2/account/:accountId) |
| LIVE-URL | [https://api.kashier.io/v2/account/:accountId](https://api.kashier.io/v2/account/:accountId)           |
| Method   | PUT                                                                                                    |

### Body parameters [#body-parameters-1]

| Key          | Description                                                                                                                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| accountName  | New name for the account.                                                                                                                                                                          |
| payoutMethod | New payout method for the account — same shape as [Create an additional account](#create-an-additional-account). Sending `payoutMethod` **replaces it wholesale**; it isn't merged field by field. |

```bash
curl --location --request PUT 'https://test-api.kashier.io/v2/account/:accountId' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --header 'x-otp: 123456' \
  --data '{
    "accountName": "Second Store Account (renamed)",
    "payoutMethod": {
      "accountHolderName": "Ahmed Hassan",
      "accountNumber": "9876543210",
      "bankName": "National Bank of Egypt",
      "bankAbbreviation": "NBE",
      "bankBranchName": "Maadi",
      "bankBranchCode": "014"
    }
  }'
```

<ApiTryIt
  method="PUT"
  url="https://test-api.kashier.io/v2/account/:accountId"
  body="{
  accountName: 'Second Store Account (renamed)',
  payoutMethod: {
    method: 'bank',
    accountHolderName: 'Ahmed Hassan',
    accountNumber: '9876543210',
    bankName: 'National Bank of Egypt',
    bankAbbreviation: 'NBE',
    bankBranchName: 'Maadi',
    bankBranchCode: '014',
  },
}"
  sendApiKey="false"
  title="Try it — edit an account"
/>

### Headers [#headers-3]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |
| x-otp         | The OTP code, once you've received one. Omit it on the first call to trigger generation.                                                                                                   |

### Response [#response-3]

Returns the updated account in the same shape as [Get an account](#get-an-account).

## Get the primary account's payout method [#get-the-primary-accounts-payout-method]

Returns the `payoutMethod` for your **primary** account only.

| Endpoint | Value                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/account/payoutMethod](https://test-api.kashier.io/v2/account/payoutMethod) |
| LIVE-URL | [https://api.kashier.io/v2/account/payoutMethod](https://api.kashier.io/v2/account/payoutMethod)           |
| Method   | GET                                                                                                        |

```bash
curl --location 'https://test-api.kashier.io/v2/account/payoutMethod' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/account/payoutMethod" sendApiKey="false" title="Try it — get the primary account's payout method" />

### Headers [#headers-4]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-4]

```json
{
  "method": "bank",
  "accountHolderName": "Ahmed Hassan",
  "accountNumber": "1234567890",
  "bankName": "National Bank of Egypt",
  "bankAbbreviation": "NBE",
  "bankBranchName": "Downtown",
  "bankBranchCode": "001"
}
```

## Update the primary account's payout method [#update-the-primary-accounts-payout-method]

Replaces the `payoutMethod` on your **primary** account. The request body **is** the payout method object — there's no wrapper.

<Callout title="Requires OTP">
  This endpoint requires OTP verification, the same way [Edit an account](#edit-an-account) does: call it without `x-otp` to trigger a code, then retry with `x-otp` set.
</Callout>

| Endpoint | Value                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/account/payoutMethod](https://test-api.kashier.io/v2/account/payoutMethod) |
| LIVE-URL | [https://api.kashier.io/v2/account/payoutMethod](https://api.kashier.io/v2/account/payoutMethod)           |
| Method   | PUT                                                                                                        |

### Body parameters [#body-parameters-2]

| Key               | Description                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| method            | Identifies the payout rail, e.g. a bank transfer vs. a mobile wallet.                                                                                   |
| accountHolderName | Name on the payout destination. Accepts Arabic and Latin letters, digits, spaces, periods, hyphens, and apostrophes; max 70 characters.                 |
| accountNumber     | Bank account number or wallet number.                                                                                                                   |
| bankName          | Bank name.                                                                                                                                              |
| bankAbbreviation  | Bank abbreviation/code.                                                                                                                                 |
| bankBranchName    | Bank branch name. Required when `isUnlistedBranch` is `true`.                                                                                           |
| bankBranchCode    | Bank branch code. Must be omitted when `isUnlistedBranch` is `true`.                                                                                    |
| isUnlistedBranch  | Boolean, defaults to `false`. Set it to `true` when your branch isn't in the bank's branch list. See [Unlisted bank branches](#unlisted-bank-branches). |

No field is required unless you set `isUnlistedBranch` to `true` (see [Unlisted bank branches](#unlisted-bank-branches)). This is the same shared payout-method shape used across account creation and editing, and it's replaced wholesale on every update, so send the full object.

```bash
curl --location --request PUT 'https://test-api.kashier.io/v2/account/payoutMethod' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --header 'x-otp: 123456' \
  --data '{
    "method": "bank",
    "accountHolderName": "Ahmed Hassan",
    "accountNumber": "1234567890",
    "bankName": "National Bank of Egypt",
    "bankAbbreviation": "NBE",
    "bankBranchName": "Downtown",
    "bankBranchCode": "001"
  }'
```

<Callout type="warn" title="No playground panel for this call">
  This endpoint replaces your primary account's payout method wholesale, so this page has no Send button that could overwrite a working payout destination by accident. Build the request from the cURL above, and check the field names against a `GET /v2/account/payoutMethod` response for your own account first.
</Callout>

### Headers [#headers-5]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |
| x-otp         | The OTP code, once you've received one. Omit it on the first call to trigger generation.                                                                                                   |

### Response [#response-5]

Returns the updated `payoutMethod` in the same shape as [Get the primary account's payout method](#get-the-primary-accounts-payout-method).

## Unlisted bank branches [#unlisted-bank-branches]

If your bank branch isn't in the bank's branch list, you can still pay out to it. Set `isUnlistedBranch` to `true` and type the branch name yourself in `bankBranchName`. This works in every request that takes a payout method: [Create an additional account](#create-an-additional-account), [Edit an account](#edit-an-account), and [Update the primary account's payout method](#update-the-primary-accounts-payout-method).

When `isUnlistedBranch` is `true`:

| Field          | Rule                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| method         | Required, and must be `bankAccount`. Only bank-account destinations can use an unlisted branch.               |
| bankBranchName | Required. Arabic and Latin names are both accepted; leading and trailing spaces are trimmed.                  |
| bankBranchCode | Must be omitted. An empty string or `null` is accepted and dropped; any other value is rejected with a `400`. |

When `isUnlistedBranch` is `false` or omitted, `bankBranchName` and `bankBranchCode` work as before.

```bash
curl --location --request PUT 'https://test-api.kashier.io/v2/account/payoutMethod' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --header 'x-otp: 123456' \
  --data '{
    "method": "bankAccount",
    "accountHolderName": "Ahmed Hassan",
    "accountNumber": "1234567890",
    "bankName": "National Bank of Egypt",
    "bankAbbreviation": "NBE",
    "isUnlistedBranch": true,
    "bankBranchName": "فرع الأوبرا"
  }'
```

A payout method saved with an unlisted branch comes back with `isUnlistedBranch: true`, your `bankBranchName`, and no `bankBranchCode` field. In bulk-transfer exports, the branch column shows the name you entered and the branch-code column is blank.

<Callout title="Changing to or from an unlisted branch">
  `payoutMethod` is replaced wholesale. To move from a listed branch to an unlisted one, send `isUnlistedBranch: true` without `bankBranchCode`. To move back, send `isUnlistedBranch: false` (or omit it) together with the listed branch's `bankBranchCode`.
</Callout>

## Get account records [#get-account-records]

Returns a paginated feed of account-level activity for a given account — broader than the balance ledger (see [Balance ledger and holds](/docs/account-and-balance/balance)), since it isn't limited to balance-affecting events.

| Endpoint | Value                                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/account/:accountId/records](https://test-api.kashier.io/v2/account/:accountId/records) |
| LIVE-URL | [https://api.kashier.io/v2/account/:accountId/records](https://api.kashier.io/v2/account/:accountId/records)           |
| Method   | GET                                                                                                                    |

### Query parameters [#query-parameters]

| Key   | Description                              |
| ----- | ---------------------------------------- |
| page  | Page number for pagination. Example: `1` |
| limit | Records per page. Example: `10`          |

```bash
curl --location 'https://test-api.kashier.io/v2/account/:accountId/records?page=1&limit=10' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/account/:accountId/records?page=1&limit=10" sendApiKey="false" title="Try it — get account records" />

### Headers [#headers-6]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-6]

```json
{
  "data": [{ "...": "one entry per account-level activity item" }],
  "total": 12,
  "page": 1,
  "limit": 10
}
```

`data` is paginated the same way as the balance ledger (`total`/`page`/`limit`). The shape of an individual entry depends on the kind of activity it represents; use the "Try it" panel above against a test account to inspect a live response.

## Export account records [#export-account-records]

The same account activity feed as a file download.

| Endpoint | Value                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/account/:accountId/records/export](https://test-api.kashier.io/v2/account/:accountId/records/export) |
| LIVE-URL | [https://api.kashier.io/v2/account/:accountId/records/export](https://api.kashier.io/v2/account/:accountId/records/export)           |
| Method   | GET                                                                                                                                  |

```bash
curl --location 'https://test-api.kashier.io/v2/account/:accountId/records/export' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --output account-records.xlsx
```

### Headers [#headers-7]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

## Account overview [#account-overview]

Returns an overview for a single account. Merchant-only (not callable by agents).

| Endpoint | Value                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/account/overview/:accountId](https://test-api.kashier.io/v2/account/overview/:accountId) |
| LIVE-URL | [https://api.kashier.io/v2/account/overview/:accountId](https://api.kashier.io/v2/account/overview/:accountId)           |
| Method   | GET                                                                                                                      |

```bash
curl --location 'https://test-api.kashier.io/v2/account/overview/:accountId' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/account/overview/:accountId" sendApiKey="false" title="Try it — account overview" />

### Headers [#headers-8]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-7]

Returns a `200` with a JSON object summarizing the given account. The exact field set isn't
confirmed here — use the "Try it" panel above against a test account to inspect a live response.

## List accounts overview [#list-accounts-overview]

Returns an overview covering all of your accounts at once — useful for a dashboard-style summary instead of fetching each account individually. Merchant-only (not callable by agents).

| Endpoint | Value                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/account/overview/accounts-list](https://test-api.kashier.io/v2/account/overview/accounts-list) |
| LIVE-URL | [https://api.kashier.io/v2/account/overview/accounts-list](https://api.kashier.io/v2/account/overview/accounts-list)           |
| Method   | GET                                                                                                                            |

### Query parameters [#query-parameters-1]

| Key   | Description                              |
| ----- | ---------------------------------------- |
| page  | Page number for pagination. Example: `1` |
| limit | Accounts per page. Example: `10`         |

```bash
curl --location 'https://test-api.kashier.io/v2/account/overview/accounts-list?page=1&limit=10' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/account/overview/accounts-list?page=1&limit=10" sendApiKey="false" title="Try it — list accounts overview" />

### Headers [#headers-9]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-8]

Returns a `200` with a paginated JSON object — `page`/`limit` mirror the query parameters above,
the same pagination envelope used elsewhere in this API. The exact per-account field set isn't
confirmed here — use the "Try it" panel above against a test account to inspect a live response.

## Payments overview [#payments-overview]

Returns a payments summary for a given account over a date range. Merchant-only (not callable by agents).

| Endpoint | Value                                                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/account/overview/payments/:accountId](https://test-api.kashier.io/v2/account/overview/payments/:accountId) |
| LIVE-URL | [https://api.kashier.io/v2/account/overview/payments/:accountId](https://api.kashier.io/v2/account/overview/payments/:accountId)           |
| Method   | GET                                                                                                                                        |

### Query parameters [#query-parameters-2]

| Key      | Description                                   |
| -------- | --------------------------------------------- |
| dateFrom | Start of the summary window, as `YYYY-MM-DD`. |
| dateTo   | End of the summary window, as `YYYY-MM-DD`.   |
| page     | Page number for pagination. Example: `1`      |
| limit    | Items per page. Example: `20`                 |

The window below is deliberately wide so it covers whatever history your account already has — narrow it to the range you actually want to summarize.

```bash
curl --location 'https://test-api.kashier.io/v2/account/overview/payments/:accountId?dateFrom=2020-01-01&dateTo=2030-12-31' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/account/overview/payments/:accountId?dateFrom=2020-01-01&dateTo=2030-12-31" sendApiKey="false" title="Try it — payments overview" />

### Headers [#headers-10]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-9]

Returns a `200` with a JSON object summarizing payments on the account over the requested date
range. The exact field set isn't confirmed here — use the "Try it" panel above against a test
account to inspect a live response.

## Payouts overview [#payouts-overview]

Returns a payouts summary for a given account over a date range. Merchant-only (not callable by agents).

| Endpoint | Value                                                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/account/overview/payouts/:accountId](https://test-api.kashier.io/v2/account/overview/payouts/:accountId) |
| LIVE-URL | [https://api.kashier.io/v2/account/overview/payouts/:accountId](https://api.kashier.io/v2/account/overview/payouts/:accountId)           |
| Method   | GET                                                                                                                                      |

### Query parameters [#query-parameters-3]

| Key      | Description                                   |
| -------- | --------------------------------------------- |
| dateFrom | Start of the summary window, as `YYYY-MM-DD`. |
| dateTo   | End of the summary window, as `YYYY-MM-DD`.   |
| page     | Page number for pagination. Example: `1`      |
| limit    | Items per page. Example: `20`                 |

As with the payments overview, the window below is deliberately wide — narrow it to the range you actually want.

```bash
curl --location 'https://test-api.kashier.io/v2/account/overview/payouts/:accountId?dateFrom=2020-01-01&dateTo=2030-12-31' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/account/overview/payouts/:accountId?dateFrom=2020-01-01&dateTo=2030-12-31" sendApiKey="false" title="Try it — payouts overview" />

### Headers [#headers-11]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-10]

Returns a `200` with a JSON object summarizing payouts on the account over the requested date
range. The exact field set isn't confirmed here — use the "Try it" panel above against a test
account to inspect a live response.

# Balance ledger and holds (/docs/account-and-balance/balance)

Kashier keeps an immutable ledger of every balance-affecting event on your account — settlements, payouts, refunds, and adjustments each post a record. Use the balance ledger to reconcile your Kashier balance against your own books, and use the holds endpoint to see why your available balance can be lower than your total balance.

<Callout title="Ledger vs. account activity feed">
  This page covers the balance ledger under `/v2/balance/*` — immutable balance-affecting records (settlements, payouts, adjustments) plus holds. A separate, broader account activity feed also exists — see [Get account records](/docs/account-and-balance/accounts#get-account-records) on the [Accounts and payout methods](/docs/account-and-balance/accounts) page. Don't confuse the two — they return different record shapes for different purposes.
</Callout>

## Get balance records (the ledger) [#get-balance-records-the-ledger]

Returns a paginated list of balance-affecting records for an account — the core ledger.

| Endpoint | Value                                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/balance/records/:accountId](https://test-api.kashier.io/v2/balance/records/:accountId) |
| LIVE-URL | [https://api.kashier.io/v2/balance/records/:accountId](https://api.kashier.io/v2/balance/records/:accountId)           |
| Method   | GET                                                                                                                    |

### Query parameters [#query-parameters]

| Key      | Description                                               |
| -------- | --------------------------------------------------------- |
| page     | Page number for pagination. Example: `1`                  |
| limit    | Records per page. Example: `10`                           |
| dateFrom | Start date for a date-range filter. Example: `2026-01-01` |
| dateTo   | End date for a date-range filter. Example: `2026-06-30`   |

```bash
curl --location 'https://test-api.kashier.io/v2/balance/records/:accountId?page=1&limit=10' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/balance/records/:accountId?page=1&limit=10" sendApiKey="false" title="Try it — get balance records" />

### Headers [#headers]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response]

```json
{
  "data": [
    {
      "accountId": "ACC-39550-436-01",
      "amount": 500,
      "originalAmount": 500,
      "fees": 0,
      "operation": "manualAdjustment",
      "origin": "operations team",
      "originReference": "REF-12345",
      "comment": "Manual adjustment",
      "valueDate": "2026-06-18",
      "isReflected": true,
      "totalBalanceBefore": 12000,
      "totalBalanceAfter": 12500,
      "createdAt": "2026-06-18T15:30:00Z"
    },
    {
      "accountId": "ACC-39550-436-01",
      "amount": 1000,
      "originalAmount": 1015,
      "fees": 15,
      "operation": "settlement",
      "origin": "settlements",
      "originReference": "STW-88213",
      "comment": "Settlement",
      "valueDate": "2026-06-18",
      "isReflected": true,
      "totalBalanceBefore": 11000,
      "totalBalanceAfter": 12000,
      "createdAt": "2026-06-18T14:00:00Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10
}
```

| Field                                             | Description                                                                                                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data[].accountId`                                | The account the record was posted against (`ACC-` format).                                                                                               |
| `data[].amount`                                   | Net amount after fees — this is what moves the balance.                                                                                                  |
| `data[].originalAmount`                           | Gross amount before fees.                                                                                                                                |
| `data[].fees`                                     | Fees deducted from `originalAmount`.                                                                                                                     |
| `data[].operation`                                | What generated the record. Free text; values in use include `refund`, `settlement`, `payout`, `deduct`, `transfer` and `manualAdjustment`.               |
| `data[].origin`                                   | The service that posted it, e.g. `settlements`, `transfers`, `instant settlement`.                                                                       |
| `data[].originReference`                          | The originating reference (`TRX-`, `STW-`, `STB-`, `ISR-`, `TRS-`…). Together with `accountId`, `operation` and `origin` this forms the idempotency key. |
| `data[].comment`                                  | Free-text description of what generated the record.                                                                                                      |
| `data[].valueDate`                                | The date the record is value-dated against.                                                                                                              |
| `data[].isReflected`                              | `false` while the entry is future-dated and not yet applied to the balance.                                                                              |
| `data[].totalBalanceBefore` / `totalBalanceAfter` | Balance snapshots either side of the entry.                                                                                                              |
| `data[].createdAt`                                | When the record was created.                                                                                                                             |
| `total`                                           | Total number of records matching the filter.                                                                                                             |
| `page`                                            | Current page number.                                                                                                                                     |
| `limit`                                           | Records per page.                                                                                                                                        |

## Get balance record details [#get-balance-record-details]

Fetch the full detail of a single ledger record by its ID — use the `id` returned from the list above.

| Endpoint | Value                                                                                                                              |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/balance/record-details/:recordId](https://test-api.kashier.io/v2/balance/record-details/:recordId) |
| LIVE-URL | [https://api.kashier.io/v2/balance/record-details/:recordId](https://api.kashier.io/v2/balance/record-details/:recordId)           |
| Method   | GET                                                                                                                                |

```bash
curl --location 'https://test-api.kashier.io/v2/balance/record-details/:recordId' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/balance/record-details/:recordId" sendApiKey="false" title="Try it — get balance record details" />

### Headers [#headers-1]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-1]

```json
{
  "accountId": "ACC-39550-436-01",
  "amount": 500,
  "originalAmount": 500,
  "fees": 0,
  "operation": "manualAdjustment",
  "origin": "operations team",
  "originReference": "REF-12345",
  "comment": "Manual adjustment",
  "valueDate": "2026-06-18",
  "totalBalanceBefore": 12000,
  "totalBalanceAfter": 12500,
  "metaData": { "fees": 0, "vat": 0 },
  "createdAt": "2026-06-18T15:30:00Z"
}
```

Fields match the ledger list above, plus `metaData`, which carries the fee/VAT breakdown for the record.

## Get payout details [#get-payout-details]

Given a ledger record that represents a payout, list the underlying transactions that were bundled into it.

| Endpoint | Value                                                                                                                              |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/balance/payout-details/:recordId](https://test-api.kashier.io/v2/balance/payout-details/:recordId) |
| LIVE-URL | [https://api.kashier.io/v2/balance/payout-details/:recordId](https://api.kashier.io/v2/balance/payout-details/:recordId)           |
| Method   | GET                                                                                                                                |

### Query parameters [#query-parameters-1]

| Key       | Description                                               |
| --------- | --------------------------------------------------------- |
| page      | Page number for pagination. Example: `1`                  |
| limit     | Records per page. Example: `10`                           |
| sortBy    | Field to sort by. Example: `transactionDate`              |
| sortOrder | Sort order, `asc` or `desc`. Example: `desc`              |
| status    | Filter transactions by status. Example: `completed`       |
| dateFrom  | Start date for a date-range filter. Example: `2026-01-01` |
| dateTo    | End date for a date-range filter. Example: `2026-06-30`   |

```bash
curl --location 'https://test-api.kashier.io/v2/balance/payout-details/:recordId?page=1&limit=10' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/balance/payout-details/:recordId?page=1&limit=10" sendApiKey="false" title="Try it — get payout details" />

### Headers [#headers-2]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-2]

```json
{
  "recordId": "507f1f77bcf86cd799439029",
  "accountId": "507f1f77bcf86cd799439012",
  "amount": 5000,
  "status": "processed",
  "payoutDate": "2026-06-18",
  "transactions": [
    {
      "transactionId": "txn_001",
      "amount": 1000,
      "status": "settled",
      "settleDate": "2026-06-18"
    }
  ],
  "totalTransactions": 5
}
```

### Export payout details [#export-payout-details]

The same underlying data is also available as a file download.

| Endpoint | Value                                                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/balance/payout-details/:recordId/export](https://test-api.kashier.io/v2/balance/payout-details/:recordId/export) |
| LIVE-URL | [https://api.kashier.io/v2/balance/payout-details/:recordId/export](https://api.kashier.io/v2/balance/payout-details/:recordId/export)           |
| Method   | GET                                                                                                                                              |

| Key      | Description                                               |
| -------- | --------------------------------------------------------- |
| status   | Filter transactions by status. Example: `completed`       |
| dateFrom | Start date for a date-range filter. Example: `2026-01-01` |
| dateTo   | End date for a date-range filter. Example: `2026-06-30`   |

```bash
curl --location 'https://test-api.kashier.io/v2/balance/payout-details/:recordId/export' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --output payout-details.xlsx
```

## Get account holds [#get-account-holds]

Returns holds placed on an account. Holds reduce your **available** balance without changing your **total** balance — this is why the amount you can withdraw or use can be less than your account's total balance.

| Endpoint | Value                                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/hold/account/:accountId](https://test-api.kashier.io/v2/hold/account/:accountId) |
| LIVE-URL | [https://api.kashier.io/v2/hold/account/:accountId](https://api.kashier.io/v2/hold/account/:accountId)           |
| Method   | GET                                                                                                              |

### Query parameters [#query-parameters-2]

| Key    | Description                                             |
| ------ | ------------------------------------------------------- |
| page   | Page number for pagination. Example: `1`                |
| limit  | Records per page. Example: `10`                         |
| status | Filter by hold status: `HELD`, `RELEASED` or `DEDUCTED` |

```bash
curl --location 'https://test-api.kashier.io/v2/hold/account/:accountId?page=1&limit=10' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/hold/account/:accountId?page=1&limit=10" sendApiKey="false" title="Try it — get account holds" />

### Headers [#headers-3]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-3]

```json
{
  "data": [
    {
      "holdId": "HLD-39550-436-0007",
      "accountId": "ACC-39550-436-01",
      "amount": 1000,
      "status": "HELD",
      "valueDate": "2026-06-18",
      "createdAt": "2026-06-18T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

| Field              | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `data[].holdId`    | Unique identifier for the hold (`HLD-` format).         |
| `data[].accountId` | The account the hold is placed against (`ACC-` format). |
| `data[].amount`    | The amount held.                                        |
| `data[].status`    | Hold lifecycle state: `HELD`, `RELEASED` or `DEDUCTED`. |
| `data[].valueDate` | The date the hold is value-dated against.               |
| `data[].createdAt` | When the hold was created.                              |

<Callout title="Note">
  The `status` filter accepts the hold-lifecycle values `HELD`, `RELEASED` and `DEDUCTED`. A hold starts `HELD`; releasing it returns the amount to the available balance, deducting it removes the amount for good.
</Callout>

# Accounts and balance (/docs/account-and-balance)

Every merchant has a balance and at least one account. This section covers the two resources behind them: **accounts**, which hold your payout methods and can be created beyond the primary one, and the **balance ledger**, an immutable record of every balance-affecting event on your account.

<Cards>
  <Card title="Balance ledger and holds" href="/docs/account-and-balance/balance" description="Inspect the balance ledger, drill into individual records and payouts, and see what's on hold." />

  <Card title="Accounts and payout methods" href="/docs/account-and-balance/accounts" description="Create and manage additional merchant accounts and their payout methods." />
</Cards>

# Build with AI (/docs/get-started/ai-tools)

These docs are built to be read by AI tools as easily as by people. Point your
assistant at any of the following:

## Machine-readable endpoints [#machine-readable-endpoints]

| What                      | URL                                                                                                                       | Use it for                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Docs index for LLMs       | [/llms.txt](/llms.txt)                                                                                                    | Give an agent a map of every page with descriptions       |
| Full docs as one file     | [/llms-full.txt](/llms-full.txt)                                                                                          | Paste the entire documentation into a large-context model |
| Any page as Markdown      | append `.md` to any docs URL, e.g. [/docs/accept-payments/payment-sessions.md](/docs/accept-payments/payment-sessions.md) | Feed a single topic to a model without HTML noise         |
| OpenAPI 3.1 specification | [/openapi.yaml](/openapi.yaml)                                                                                            | Code generation, API clients, agent tool definitions      |

## On every page [#on-every-page]

Each docs page has a **Copy Markdown** button and an **Open** menu that sends
the page straight to ChatGPT or Claude — useful when you want to ask questions
about one integration.

## Suggested prompts [#suggested-prompts]

Working in Cursor, Claude Code, or another coding agent? Try:

```text
Read https://developers.kashier.io/llms.txt, then fetch the pages relevant to
accepting a card payment with Kashier and implement it in my checkout flow.
Use the test environment (test-api.kashier.io) and my test keys from .env.
```

```text
Generate a typed API client for Kashier from
https://developers.kashier.io/openapi.yaml. Payments only.
```

## Notes for agents [#notes-for-agents]

- Authentication is two headers: `Authorization` (the merchant secret key, raw
  value — not a Bearer token) and `api-key`. See
  [API keys](/docs/get-started/api-keys).
- Test and live are separate environments; test base URLs are prefixed
  `test-`. Never use live keys while developing.
- Amounts are strings in EGP for payment sessions (for example `"100.00"`).

# API keys (/docs/get-started/api-keys)

Kashier authenticates your API requests using your account's API keys. If you do not include your key when making an API request, or if you use one that is incorrect or outdated, Kashier returns an error.

Every account is provided with separate keys for testing and running live transactions. All API requests exist in either test or live mode, so one mode cannot interact with objects in the other.

There are also two types of API keys: Payment API Keys and Secret API Keys.

- Payment API Keys are used to sign requests and verify Kashier's responses. You use this key to compute the **order hash** — an HMAC-SHA256 signature over the order's details that proves the amount and order ID were not tampered with in the customer's browser — and to verify the signature Kashier sends back. See [request hashing](/docs/direct-api/hashing).
- Secret API Keys should be kept confidential and stored only on your own servers. A Secret API Key authenticates the request; it does not by itself authorize every operation. What it can do is bounded by the **role and permissions attached to the user the key belongs to** — routes are individually checked against privileges such as `balance.all.view_balance` for settlement and balance reads, and a key whose role lacks the privilege is rejected even though the key itself is valid. On top of that, calls are subject to an optional IP allow-list you configure per merchant; requests from a non-allow-listed IP are rejected with a 403 error. Some capabilities are also gated per merchant and off until Kashier enables them — see [Capabilities are enabled per merchant](/docs/dashboard-api#capabilities-are-enabled-per-merchant).

Each account has a total of four keys: a Payment API Key and a Secret Key pair for [test mode and live mode](#test-and-live-modes).

## Credentials at a glance [#credentials-at-a-glance]

The docs and API refer to your credentials by different names depending on context — the prose term, the HTTP header you send it in, and the identifier Kashier's tooling uses internally aren't always the same word. Use this table to map between them:

| Credential        | HTTP header / body field                                                                                                                                          | Other identifiers                                                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Payment API Key   | `api-key` header                                                                                                                                                  | `apiKey` — OpenAPI security-scheme ID (the [API reference](/docs/api-reference) playground stores it in your browser's localStorage under `fumadocs-openapi-auth-apiKey`) |
| Secret Key        | `Authorization` header (raw value, not a Bearer token)                                                                                                            | `secretKey` — OpenAPI security-scheme ID (stored as `fumadocs-openapi-auth-secretKey` in the playground)                                                                  |
| Merchant ID (MID) | `merchantId` — JSON request-body field (most endpoints); `mid` — query parameter on some endpoints (e.g. [installment plans](/docs/direct-api/installment-plans)) | `authmerchantid` — HTTP header, used only for [multi-merchant accounts](#multi-merchant-accounts-the-authmerchantid-header)                                               |

## Obtaining your keys and MID [#obtaining-your-keys-and-mid]

Your API keys are always available in the [Dashboard](https://merchant.kashier.io/en/dashboard/integration). The MID can be found under your username in the dashboard's top navigation bar.

<img alt="API keys" src="__img0" />

<img alt="Secret keys" src="__img1" />

Use only your test API keys for testing and development. This ensures that you don't accidentally modify your live customers or charges.

## Multi-merchant accounts: the `authmerchantid` header [#multi-merchant-accounts-the-authmerchantid-header]

If your user has access to more than one merchant account, include an `authmerchantid` header alongside your `Authorization` header on every Dashboard/Integration API request. Kashier resolves the active MID from this header (or from `selectedMID` carried in your session token); without it, a multi-merchant user has no way to tell the API which merchant a request applies to.

```http
GET /v2/customers HTTP/1.1
Host: test-api.kashier.io
Authorization: f86a28e62b452ee94a32dc49cde00047$491a5ae27e91294e97247b742d1727600d7b17297309820c590e0cbc0d8b48bc923aa94c5501619882248e58eb7cc
authmerchantid: MID-00-000
```

If your user only has access to a single merchant, you can omit this header.

## Managing keys and access via the API [#managing-keys-and-access-via-the-api]

In addition to the Dashboard, you can manage your API keys, secret keys, and IP allow-list programmatically. All of these endpoints live on the same host as your other Dashboard/Integration API calls (`(test-)api.kashier.io`) and are authenticated the same way — with your Secret Key in the `Authorization` header (plus `authmerchantid` if your user has access to multiple merchants).

### API keys and secret keys [#api-keys-and-secret-keys]

| Action                                | Method | Path                                 |
| ------------------------------------- | ------ | ------------------------------------ |
| List your Payment API Keys            | GET    | `/v2/merchants/api-keys`             |
| Create a Payment API Key              | PUT    | `/v2/merchants/api-keys`             |
| Delete a Payment API Key              | DELETE | `/v2/merchants/api-keys/:apiKeyId`   |
| List your Secret Keys                 | GET    | `/v2/identity/secret-keys`           |
| Update a user's Secret Keys           | PUT    | `/v2/identity/secret-keys/:userId`   |
| Validate a set of Secret/Payment keys | POST   | `/v2/merchants/validate-credentials` |

### IP allow-list [#ip-allow-list]

Manage the IP allow-list that restricts which IPs may use your Secret Key:

| Action                                  | Method | Path                        |
| --------------------------------------- | ------ | --------------------------- |
| List allow-listed IPs                   | GET    | `/v2/ip-address`            |
| Add an IP to the allow-list             | POST   | `/v2/ip-address`            |
| Get a single allow-list entry           | GET    | `/v2/ip-address/:ipId`      |
| Update an allow-list entry              | PUT    | `/v2/ip-address/:ipId`      |
| Remove an IP from the allow-list        | DELETE | `/v2/ip-address/:ipId`      |
| Enable or disable the entire allow-list | PUT    | `/v2/ip-address/toggle-all` |

## Test and live modes [#test-and-live-modes]

The test and live modes function almost identically for integration testing and education, with a few necessary differences:

- In test mode, payments are not processed by card networks or payment providers, and only our [test payment information](/docs/get-started/testing) can be used.
- Payment and Secret Keys differ for each mode.
- Base URLs are prefixed with 'test-'.
- You may use and test features before being [onboarded and activated](https://merchant.kashier.io/en/onboarding).

The status of the created account will be marked as a "Test" account by default. This will allow you to test all of Kashier's services. When you finish your testing phase, you should switch to live mode and obtain your live keys if you are [onboarded and activated](https://merchant.kashier.io/en/onboarding).

Switch between test and live modes using the "It's live data" toggle from the sidebar, as shown below.

<img alt="Live data toggle" src="__img2" />

Always ensure you are in the correct mode by checking the mode toggle at the bottom of the side navigation bar. Verify that you are using the correct keys for your intended mode.

<Callout type="warn" title="A test Payment API Key never validates against a live host">
  Kashier only matches a Payment API Key whose mode equals the host's mode. A test key validates only on the `test-` hosts and a live key only on the live hosts, so a mode mismatch fails [request hashing](/docs/direct-api/hashing) even when the formula is correct. This is the most common cause of an "invalid hash" error.
</Callout>

# Going live (/docs/get-started/going-live)

Swapping your keys and dropping the `test-` prefix is the smallest part of going
live. Test mode is deliberately permissive: it seeds payment methods you may not
own, forces the checkout to a fixed method list, skips settlement entirely, and
applies no rate limit. An integration that passes every sandbox test can still
fail on its first live request.

Work through the checklist below before you point real customers at Kashier.

<Callout type="warn" title="A payment method working in test proves nothing about live">
  Test mode does not read your real payment configuration. It seeds a default
  method set for your account and, on hosted checkout and the embedded iframe,
  overrides whatever you asked for with card and wallet only. Neither behaviour
  reflects what your live account can actually charge. Verify every method against
  your live account — see [Payment methods](#2-payment-methods).
</Callout>

## 1. Account, credentials, and hosts [#1-account-credentials-and-hosts]

- [ ] **Activate the account for live mode.** Every account starts as a test
      account. Until Kashier has [onboarded and activated](https://merchant.kashier.io/en/onboarding)
      yours, live mode will not accept writes. _Skip it and_ every write request to a
      live host is rejected with `Merchant <MID> is not live.` — the message names
      the account status, not your credentials, so it is easy to misread as an auth
      failure.

- [ ] **Swap in your live keys.** You have four keys in total: a Payment API Key
      and a Secret Key for test, and the same pair for live. Keys are mode-scoped and
      cannot cross over. See [API keys](/docs/get-started/api-keys). _Skip it and_ a
      test key against a live host fails authentication outright, and a test Payment
      API Key produces an "invalid hash" error even when your hashing formula is
      correct.

- [ ] **Swap every base URL**, using the table below. Grep your codebase for
      `test-` afterwards — a single missed host silently keeps part of your flow in
      the sandbox.

| What you call                                                                                       | Test host             | Live host             |
| --------------------------------------------------------------------------------------------------- | --------------------- | --------------------- |
| Dashboard / management API (sessions, transactions, customers, payment links, settlement, webhooks) | `test-api.kashier.io` | `api.kashier.io`      |
| Payment API / FEP (pay, capture, void, refund, tokens, transfers)                                   | `test-fep.kashier.io` | `fep.kashier.io`      |
| Hosted checkout and the embedded checkout script                                                    | `payments.kashier.io` | `payments.kashier.io` |

The checkout host is the same in both modes — the mode travels on the
`sessionUrl` as a `mode` query parameter rather than in the hostname. If you load
checkout assets from any other host, confirm its live equivalent with Kashier
before you switch.

- [ ] **Update your IP allow-list before your egress IP changes.** The allow-list
      is opt-in — an empty list allows every IP — but once it has at least one entry,
      only those IPs may use your Secret Key. Manage it from
      [API keys](/docs/get-started/api-keys#ip-allow-list). _Skip it and_ every
      Secret Key call from the new server is rejected with
      `403 Unauthorized IP address`, which looks nothing like an IP problem unless
      you read the message. This is one of the more common causes of a
      go-live-day outage. Dashboard session callers are not IP-checked, so the
      dashboard will keep working while your server does not.

- [ ] **Check the role behind the live Secret Key.** A Secret Key authenticates
      the request; what it may _do_ is bounded by the role assigned to the user it
      belongs to (role-based access control, or RBAC — each route checks the caller's
      role for a named privilege before it runs). Settlement reads, for example, require `balance.all.view_balance`
      and settlement exports require `balance.all.export_balance`. _Skip it and_ a
      perfectly valid key is rejected on individual routes. See
      [API keys](/docs/get-started/api-keys) and
      [error responses](/docs/dashboard-api/error-responses).

- [ ] **Point signature verification at the live Payment API Key.** The redirect
      signature after 3-D Secure and the webhook signature are both computed with the
      Payment API Key _for that mode_. _Skip it and_ every live redirect and webhook
      fails verification and you reject genuine payments. See
      [hashing and signatures](/docs/direct-api/hashing) and
      [signature verification](/docs/webhooks#step-4-verify-the-signature).

## 2. Payment methods [#2-payment-methods]

This is the section that catches most integrations, because test mode is
misleading in two different directions at once.

- [ ] **Confirm every method you offer is actually enabled on your live
      account.** Which methods a merchant has is derived from that merchant's active
      payment configuration _in the current mode_. In live mode the list starts empty
      and is filled only from real configuration; in test mode Kashier seeds a
      default set — card, wallet, installments, InstaPay, and Basata — regardless of
      what you own. _Skip it and_ a method your sandbox happily displayed is simply
      absent at live checkout.

- [ ] **Test-only methods you could never have exercised.** Outside live mode,
      hosted checkout and the embedded iframe ignore `allowedMethods` entirely and
      force the list to card and wallet. `bank_installments`, `fawry`, and the rest
      cannot be exercised in the sandbox at all — so your first real bank-installment
      or kiosk payment is also your first test of that code path. Plan one live
      transaction per method rather than trusting the sandbox: use the smallest
      amount the method accepts, run it on your own card or wallet, and refund it
      straight away so the verification costs you only the transaction fee. Do this
      before you announce the method to customers, not after. See
      [payment sessions](/docs/accept-payments/payment-sessions).

- [ ] **Handle declines you never saw.** Test outcomes are driven by the CVV and
      expiry date you submit, so you only ever saw the handful of results listed in
      [test cards](/docs/get-started/testing). Live traffic reaches real acquirers and
      returns the full code set — including non-deterministic outcomes that are
      neither paid nor failed. Make sure your code reads the response code rather
      than branching on success/failure alone. See
      [payment reason codes](/docs/accept-payments/payment-reason-codes) and
      [order reconciliation](/docs/accept-payments/order-reconciliation).

## 3. Capabilities enabled for your account [#3-capabilities-enabled-for-your-account]

- [ ] **Confirm every capability you depend on is switched on.** Kashier gates
      many capabilities behind per-merchant flags, and a brand-new merchant has
      exactly three enabled: multiple balance accounts, payment links, and customers.
      Everything else — bulk charge, instant settlement, payment fees, branches, POS
      auto-settlement, connected accounts, and more — is off until Kashier enables it
      for you, and you cannot toggle a flag yourself. _Skip it and_ the call fails
      even though your keys, path, and payload are all correct. There is no single
      status code for it: some gates reject a disabled capability with `400`, others
      with `401 Unauthorized`, so don't build a check around one of them. See
      [capabilities are enabled per merchant](/docs/dashboard-api#capabilities-are-enabled-per-merchant).

<Callout title="Enablement is not instantaneous from your side">
  Flags are an internal Kashier change against your merchant record, so raise them
  with your Kashier contact before your go-live date rather than on it. Kashier has
  not published a turnaround time — ask when you request the change.
</Callout>

## 4. Webhooks [#4-webhooks]

- [ ] **Create a live-mode webhook.** Webhooks are scoped to a mode: a webhook
      with `mode` set to `test` only ever receives test events. Create a second
      webhook for live rather than flipping your existing one back and forth, so your
      staging listener keeps working. See
      [manage webhooks](/docs/webhooks/manage). _Skip it and_ live payments complete
      with no notification reaching your server at all.

- [ ] **Point the live webhook at a public HTTPS URL.** `localhost`, loopback,
      link-local, and private addresses are rejected — a tunnel URL that worked
      during development may not be what you want in production.

- [ ] **Verify live deliveries with the live Payment API Key.** Transaction
      events are signed with the Payment API Key for the webhook's mode.

- [ ] **Check your subscribed event list.** Matching is exact, so a webhook
      subscribed to `refund` is not delivered a `partial_refund`. Review the
      subscription you create for live, rather than assuming it mirrors test.

## 5. Behaviour that only exists on live [#5-behaviour-that-only-exists-on-live]

- [ ] **Settlement windows.** Settlement windows and batches are produced by the
      live settlement pipeline only — in test mode there are none, so any
      reconciliation code that reads them has never run against real data. Exercise
      it after your first live captures. See
      [settlement](/docs/accept-payments/settlement).

- [ ] **Rate limits.** There is no rate limit on the test environment. On live,
      checkout requests are limited to 1000 requests per minute **per IP address** —
      so services sharing one outbound IP or sitting behind a NAT share a single
      bucket. Kashier has not published the reset behaviour or response shape, so
      handle failures gracefully rather than coding against a specific error format.
      See [rate limits](/docs/resources/rate-limits).

- [ ] **Real money.** Live refunds, voids, and payouts move real funds. Make sure
      the operational paths — [refunds](/docs/accept-payments/refunds),
      [void](/docs/accept-payments/void) — are wired up and permissioned before you
      need them under pressure, not after.

## 6. After the first live payment [#6-after-the-first-live-payment]

Run one small real transaction end to end before you open the flow to customers,
and confirm each link in the chain rather than only the checkout result:

- [ ] The order reaches the expected status — check it with
      [order reconciliation](/docs/accept-payments/order-reconciliation), not only
      the browser redirect.
- [ ] The redirect signature verified against your live Payment API Key.
- [ ] Your live webhook received the event and its signature verified.
- [ ] The refund path works, by refunding that transaction.
- [ ] The transaction appears in a settlement window once one closes.

## What does not change [#what-does-not-change]

Request and response shapes, the hashing formula, error envelopes, and endpoint
paths are identical in both modes. Test mode also stays available after you go
live — the two modes are fully isolated and one can never touch the other's
objects, so you can keep developing against test with live traffic running.

<Cards>
  <Card title="API keys" href="/docs/get-started/api-keys" description="Key types, modes, IP allow-list, and permissions." />

  <Card title="Manage webhooks" href="/docs/webhooks/manage" description="Create a live-mode webhook and inspect deliveries." />

  <Card title="Error responses" href="/docs/dashboard-api/error-responses" description="What each failure status and message means." />
</Cards>

# Introduction (/docs/get-started)

Kashier is a payment gateway for Egypt. As a developer you can accept online
payments, run your own checkout, receive webhooks, send payouts, drive POS
terminals, and automate dashboard operations — all testable for free in test
mode before anything goes live.

<Callout title="Want to jump straight in?">
  The [quick start](/docs/get-started/quickstart) takes you from signup to a
  completed test payment in about five minutes, and the
  [API playground](/docs/api-reference) lets you run every endpoint from your
  browser.
</Callout>

<Callout title="Building with an AI assistant?">
  Point Cursor, Claude Code, ChatGPT, or any coding agent at
  [`/llms.txt`](/llms.txt) and it can find the right page on its own. Each page
  is also available as Markdown, and the full API is in the
  [OpenAPI spec](/openapi.yaml). See [Build with AI](/docs/get-started/ai-tools).
</Callout>

## What you can build [#what-you-can-build]

### Kashier payments [#kashier-payments]

Integrate secure payment processing into your web and mobile applications.
Kashier offers [payment sessions](/docs/accept-payments/payment-sessions) with
hosted or [embedded checkout](/docs/accept-payments/payment-sessions#step-2-send-the-customer-to-pay), plus
[payment links](/docs/accept-payments/payment-links),
[Apple Pay](/docs/accept-payments/apple-pay), and
[recurring payments](/docs/accept-payments/recurring). For full control over
your own card form, use the [direct API](/docs/direct-api).

### Kashier Dashboard API [#kashier-dashboard-api]

Integrate the [Dashboard API](/docs/dashboard-api) into your server
applications for an automated experience without manual dashboard operations —
create and share payment links, sync inventory, process refunds, and more.

### Third-party plugins [#third-party-plugins]

Plug and play with ready-made [plugins](/docs/plugins):
[WooCommerce](/docs/plugins/woocommerce), [Shopify](/docs/plugins/shopify),
[PrestaShop](/docs/plugins/prestashop), [Magento](/docs/plugins/magento),
[OpenCart](/docs/plugins/opencart),
[Booking BA](https://ba-booking.com/shop/downloads/babe-payment-kashier),
[CS-Cart](/docs/plugins/cs-cart), and
[VikBooking and VikAppointments](/docs/plugins/vik-booking).

## How these docs are organized [#how-these-docs-are-organized]

| Section                                    | What it covers                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------- |
| [Get started](/docs/get-started)           | Test account, API keys, test cards, first payment, going live                   |
| [API reference](/docs/api-reference)       | Every endpoint with a runnable playground — **this is where you try the APIs**  |
| [Accept payments](/docs/accept-payments)   | Guides for sessions, checkout, links, Apple Pay, recurring, refunds, settlement |
| [Direct API integration](/docs/direct-api) | Your own card form, tokens, 3D Secure, wallets, installments                    |
| [Webhooks](/docs/webhooks)                 | Server-to-server event notifications                                            |
| [Payouts](/docs/payouts)                   | Sending money out to banks and wallets                                          |
| [In-person payments](/docs/pos)            | POS terminal integrations                                                       |
| [E-commerce plugins](/docs/plugins)        | Store-platform setup guides, no code                                            |
| [Dashboard API](/docs/dashboard-api)       | Automating dashboard operations                                                 |
| [Resources](/docs/resources)               | Postman, rate limits, support                                                   |

## Test and live modes [#test-and-live-modes]

You can use the Kashier APIs in test mode to test your integrations — test
base URLs are prefixed with `test-` and no real money moves. See
[API keys](/docs/get-started/api-keys).

Swapping keys and hosts is only part of the switch, though: test mode seeds
payment methods you may not own, forces the checkout to card and wallet, and
produces no settlement. Work through
[Going live](/docs/get-started/going-live) before you point real customers at
Kashier.

# Quick start (/docs/get-started/quickstart)

## 1. Get your test credentials [#1-get-your-test-credentials]

<TestKeyBanner />

Test vs live modes → [API keys](/docs/get-started/api-keys).

## 2. Create a payment session [#2-create-a-payment-session]

Replace the three placeholders and run this — or open
[Create payment session](/docs/api-reference/payment-sessions/createPaymentSession)
and press **Send** with the same values in the playground:

```bash
curl https://test-api.kashier.io/v3/payment/sessions \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'api-key: YOUR_TEST_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "expireAt": "2030-01-01T00:00:00.000Z",
    "maxFailureAttempts": 3,
    "paymentType": "credit",
    "amount": "100.00",
    "currency": "EGP",
    "order": "quickstart-001",
    "merchantId": "YOUR_MID",
    "merchantRedirect": "https://your-website.com/redirect",
    "display": "en",
    "type": "one-time",
    "allowedMethods": "card,wallet",
    "customer": { "email": "you@example.com", "reference": "customer-001" }
  }'
```

<QuickstartKeys
  command="`curl https://test-api.kashier.io/v3/payment/sessions \\
--header 'Authorization: YOUR_TEST_SECRET_KEY' \\
--header 'api-key: YOUR_TEST_API_KEY' \\
--header 'Content-Type: application/json' \\
--data '{
  &#x22;expireAt&#x22;: &#x22;2030-01-01T00:00:00.000Z&#x22;,
  &#x22;maxFailureAttempts&#x22;: 3,
  &#x22;paymentType&#x22;: &#x22;credit&#x22;,
  &#x22;amount&#x22;: &#x22;100.00&#x22;,
  &#x22;currency&#x22;: &#x22;EGP&#x22;,
  &#x22;order&#x22;: &#x22;quickstart-001&#x22;,
  &#x22;merchantId&#x22;: &#x22;YOUR_MID&#x22;,
  &#x22;merchantRedirect&#x22;: &#x22;https://your-website.com/redirect&#x22;,
  &#x22;display&#x22;: &#x22;en&#x22;,
  &#x22;type&#x22;: &#x22;one-time&#x22;,
  &#x22;allowedMethods&#x22;: &#x22;card,wallet&#x22;,
  &#x22;customer&#x22;: { &#x22;email&#x22;: &#x22;you@example.com&#x22;, &#x22;reference&#x22;: &#x22;customer-001&#x22; }
}'`"
/>

Ten of those fields are required; the session is rejected without them. The
other two are worth sending anyway:

| Field                |          | What it does                                                                                  |
| -------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `expireAt`           | required | When the session stops accepting payment. Must be a future ISO 8601 timestamp.                |
| `maxFailureAttempts` | required | How many failed attempts the customer gets before the session closes.                         |
| `amount`             | required | The amount to charge, as a string.                                                            |
| `currency`           | required | `EGP`, `USD`, `GBP`, or `EUR`.                                                                |
| `order`              | required | Your own order identifier. Must be unique.                                                    |
| `merchantId`         | required | Your `MID-…`.                                                                                 |
| `merchantRedirect`   | required | Where Kashier sends the customer after payment.                                               |
| `type`               | required | `one-time` here.                                                                              |
| `display`            | required | Checkout language, `en` or `ar`.                                                              |
| `customer`           | required | At minimum an `email` and your own `reference`.                                               |
| `paymentType`        | optional | Defaults are applied when omitted.                                                            |
| `allowedMethods`     | optional | Restricts the methods offered at checkout. Omit to offer everything your account has enabled. |

The response includes a `sessionUrl`:

```json
{
  "status": "CREATED",
  "sessionUrl": "https://payments.kashier.io/session/…?mode=test"
}
```

## 3. Pay with a test card [#3-pay-with-a-test-card]

Open the `sessionUrl` in your browser — this is the hosted checkout your
customers see. Pay with:

- Card number: `5123450000000008` (Mastercard, 3-D Secure enrolled)
- Expiry: `06/25` · CVV: `100`

The expiry is not arbitrary. In test mode it **selects the outcome** — `06/25`
is the value that returns `APPROVED`, and other values return declines,
timeouts, and errors on purpose. The full list is in
[test cards](/docs/get-started/testing#expiry-date-response-codes).

## 4. Confirm the result [#4-confirm-the-result]

Open your [dashboard](https://merchant.kashier.io) (test mode) — the payment
is at the top of Transactions. Or fetch it over the API:
[Get payment session](/docs/api-reference/payment-sessions/getPaymentSession).

## Next steps [#next-steps]

<Cards>
  <Card title="Webhooks" href="/docs/webhooks" description="Get server-to-server payment notifications." />

  <Card title="API reference" href="/docs/api-reference" description="Every endpoint with a runnable playground." />

  <Card title="Go live →" href="/docs/get-started/going-live" description="Work through the checklist — live mode changes more than the keys and the hostnames." />
</Cards>

# Test cards and testing (/docs/get-started/testing)

You can use the following cards to test your integration with Kashier.

## Card numbers [#card-numbers]

| Card type  | Card number                                                                                               | Cardholder name |
| ---------- | --------------------------------------------------------------------------------------------------------- | --------------- |
| MasterCard | `5111111111111118`                                                                                        | Michel Doe      |
| MasterCard | `5123456789012346`                                                                                        | John Doe        |
| MasterCard | `5123450000000008` (3D-Secure enrolled) — use this one in the [quick start](/docs/get-started/quickstart) | John Doe        |
| Visa       | `4012000033330026`                                                                                        | John Doe        |
| Visa       | `4508750015741019` (3D-Secure enrolled)                                                                   | John Doe        |

## CSC/CVV response codes [#csccvv-response-codes]

| CVV | Response GW code |
| --- | ---------------- |
| 100 | `MATCH`          |
| 101 | `NOT_PROCESSED`  |
| 102 | `NO_MATCH`       |

## Expiry date response codes [#expiry-date-response-codes]

<Callout type="warn" title="These are outcome triggers, not real expiry dates">
  In test mode the expiry date you submit **chooses the result**. These values are
  matched literally — they are not read as dates, and none of them has "expired".
  `06/25` still returns `APPROVED`, and `04/27` returns `EXPIRED_CARD` even though
  it is a future date. Send the value for the outcome you want to exercise; any
  expiry not in this table is not a defined trigger.
</Callout>

| Expiry date | Transaction response code |
| ----------- | ------------------------- |
| 06/25       | `APPROVED`                |
| 05/25       | `DECLINED`                |
| 04/27       | `EXPIRED_CARD`            |
| 08/28       | `TIMED_OUT`               |
| 01/37       | `ACQUIRER_SYSTEM_ERROR`   |
| 02/37       | `UNSPECIFIED_FAILURE`     |
| 05/37       | `UNKNOWN`                 |

### Telling the failure codes apart [#telling-the-failure-codes-apart]

`DECLINED`, `EXPIRED_CARD`, and `TIMED_OUT` describe the card or the attempt. The
next two do not — they describe Kashier's side of the call, and neither is a
judgement about the customer's card:

| Code                    | What actually happened                                                                               | What to do                                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACQUIRER_SYSTEM_ERROR` | The acquirer errored while processing the transaction. An infrastructure fault upstream of the card. | Treat the attempt as failed. Do **not** tell the customer their card was declined or ask for a different one — the same card may work on a retry. |
| `UNSPECIFIED_FAILURE`   | The gateway failed the transaction without reporting a reason. No further detail exists.             | Same handling as above. Log the full response; it is the only thing Kashier support can work from.                                                |

Both are terminal for that attempt, which is what separates them from `UNKNOWN`
below. Branch on the response code rather than on a success/failure boolean, so
these two never reach the customer as "your card was declined".

<Callout type="warn" title="UNKNOWN is neither paid nor failed">
  `UNKNOWN` means the provider gave no deterministic answer — a timeout, a busy gateway, or an order it cannot find. The transaction rolls up to order status `INITIATED`, not `FAILED`. Never treat it as paid or as declined, and never tell a customer to retry on the strength of it: a retry on a charge that did land double-charges them. Re-read the order with [order reconciliation](/docs/accept-payments/order-reconciliation) before you do anything else.
</Callout>

## Reading the reconciliation verdict [#reading-the-reconciliation-verdict]

<Callout type="warn" title="The field is spelled `reconcilation` — one `i`">
  The API returns &#x2A;*`reconcilation`**, not `reconciliation`. The misspelling is in
  the API itself, so it is the spelling your code has to match. Reading
  `response.reconcilation` works; reading the correctly-spelled
  `response.reconciliation` returns `undefined` on every transaction and fails
  silently — you get no error, just a field that is never there.
</Callout>

Order reconciliation returns a per-transaction `reconcilation` field. It is
**not** a payment outcome. It says whether Kashier has reconciled that
transaction against the provider, not whether money moved:

| `reconcilation` | What it means                                                               |
| --------------- | --------------------------------------------------------------------------- |
| `NA`            | The default — not yet reconciled. Carries no information about the payment. |
| `OK`            | Reconciled and consistent. A reconciled **failure** is also `OK`.           |
| `Failed`        | Reconciliation ran but the two sides did not match. Investigate.            |
| `Not_Exists`    | The counterpart record was not found on the side being reconciled.          |

<Callout type="warn" title="Never decide a retry from the reconciliation verdict alone">
  `OK` does not mean the charge succeeded — it means the record is consistent, which is equally true of a reconciled `FAILURE`. Branch on the transaction's own `status` **together with** its `reconcilation`:

- `status: SUCCESS` and `reconcilation: OK` — the charge landed. Do not retry.
- `status: FAILURE` and `reconcilation: OK` — the charge is confirmed failed. Retrying is safe.
- `reconcilation: NA` — nothing has been reconciled yet. Do not act on it at all; poll again, and escalate to Kashier support rather than re-charging the customer.
- `Failed` or `Not_Exists` — treat the outcome as undetermined and escalate. Do not retry on the assumption that nothing landed.
</Callout>

## Mobile e-wallet [#mobile-e-wallet]

| Wallet type      | Mobile number |
| ---------------- | ------------- |
| Vodafone Cash    | `01010101010` |
| Any other wallet | `01001001001` |

Use the number that matches the wallet you are testing. A wallet test payment has
no trigger table like cards do, so if a number doesn't behave the way you expect,
check the response code:

- **`k_5`** — "the mobile number is not registered on any provider". This is
  terminal and never resolves on its own, so don't keep polling it. It usually
  means the test number doesn't match the wallet — for example, the other-wallets
  number used for a Vodafone Cash payment.
- Anything else — see [wallet payments](/docs/direct-api/wallet-payments) for the
  full flow, including the `PENDING` reconcile result that means "not finished
  yet" rather than "failed".

# 3D Secure handling (/docs/direct-api/3d-secure)

Kashier sends the `response.authentication` object, which includes `redirectUrl` and `redirectHtml`. The `redirectUrl` key is a URL used to handle the 3D Secure flow.

## Follow the steps below [#follow-the-steps-below]

1. Pass the `redirectUrl` value from your server side to the frontend.

2. Add the HTML code snippet to your frontend to display the 3D Secure.

- Insert the value of the `redirectUrl` key inside your HTML.

```html
<iframe
  style="z-index: 1000; width: 100%; height: 100vh;"
  src="response.authentication.redirectUrl"
  frameborder=""
  allowfullscreen=""
>
</iframe>
```

3. JavaScript snippet for handling Kashier's response and opening the 3DS frame:

```js
const authentication = data.response && data.response.authentication;

if (authentication && authentication.redirectUrl) {
  // Preferred: point the 3DS iframe at the ACS redirect URL
  $("#3ds_iframe").attr("src", authentication.redirectUrl);
  $("#3ds_iframe").addClass("show").removeClass("hide");
} else if (authentication && authentication.redirectHtml) {
  // Fallback: render the self-submitting HTML form Kashier returns
  const frame = document.getElementById("3ds_iframe");
  frame.srcdoc = authentication.redirectHtml;
  $("#3ds_iframe").addClass("show").removeClass("hide");
}
```

4. JavaScript snippet for handling the 3D Secure response:

```js
function iFrameMessageListener(e) {
  var iFrameMessage = e.data;
  console.log(iFrameMessage);
  // 3D Secure Return Cases
  if (
    iFrameMessage.message == "merchantStoreRedirect" &&
    iFrameMessage.params
  ) {
    // Remove 3ds_iframe
    $("#3ds_iframe").addClass("hide").removeClass("show");
    switch (iFrameMessage.params.status) {
      case "SERVER_ERROR" || "INVALID_REQUEST": // Failed Authentication or other errors
        // Write your code in case of failed payment
        break;
      case "SUCCESS": // Succeeded in payment authentication
        if (
          iFrameMessage.params.response &&
          iFrameMessage.params.response.card.result == "SUCCESS"
        ) {
          let parsedRedirectUrl = iFrameMessage.redirectUrl.replace(
            /&amp;/g,
            "&",
          );
          // Write your code in case of successful payment
        } else {
          // Write your code in case of failed payment
        }
        break;
      default:
        displayMessage(false, __frameMessage("error.please.check.card.info"));
        // Write your code in case of failed payment
        break;
    }
  }
}
if (window.addEventListener) {
  addEventListener("message", iFrameMessageListener, false);
} else {
  attachEvent("onmessage", iFrameMessageListener);
}
```

# Customized card form (/docs/direct-api/card-form)

## Getting started [#getting-started]

To integrate directly with Kashier APIs and save the card as a card token, you'll need to go through the following steps. Your system should save the returned token with your customer profile for future use in direct payments.

<Callout title="When the cardToken actually comes back">
  A `cardToken` is included in the response (at `response.paymentMethod.card.cardToken`) **only** when the transaction status is `SUCCESS` or `PENDING` **and** the request carried `paymentMethod.card.save` or `paymentMethod.card.agreement` — or the card was already stored on file (`storedOnFile: "STORED"`). On any other outcome the token is suppressed, so don't build on it always being present.
</Callout>

## Step 1: Create order hash [#step-1-create-order-hash]

Order hash generation uses HMAC SHA256. See [the process of generating the hash](/docs/direct-api/hashing#hashing).

## Step 2: Pay [#step-2-pay]

The request is a POST request that allows you to pay directly.

| Endpoint | Value                                    |
| -------- | ---------------------------------------- |
| TEST-URL | `https://test-fep.kashier.io/v3/orders/` |
| LIVE-URL | `https://fep.kashier.io/v3/orders/`      |
| Method   | POST                                     |

```bash
curl -X 'POST' 'https://test-fep.kashier.io/v3/orders/' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H 'Kashier-Hash: your_generated_hash' \
  -d '{
      "apiOperation": "PAY",
      "paymentMethod": {
          "type": "CARD",
          "card": {
              "save": true,
              "expiry": {
                  "month": "05",
                  "year": "26"
              },
              "number": "XXXXXXXXXXXX0001",
              "nameOnCard": "TEST",
              "securityCode": "100"
          }
      },
      "order": {
          "reference": "",
          "amount": "1",
          "currency": "EGP",
          "description": ""
      },
      "interactionSource": "ECOMMERCE",
      "reconciliation": {
          "webhookUrl": "https://your-call-back-url.com",
          "merchantRedirect": "https://your-call-back-url.com",
          "redirect": true
      },
      "customer": {
          "reference": "24",
          "firstName": "ghanem",
          "lastName": "ghanem",
          "email": "ghanem@example.com"
      },
      "merchantId": "MID-2-670",
      "newPaymentUI": true
  }'
```

`order.reference` is your own merchant order ID, and `interactionSource` must be
`ECOMMERCE`, `MOTO`, or `RECURRING`. See the field reference below for the rest.

## Body parameters [#body-parameters]

<Accordions type="multiple">
  <Accordion title="Field reference">
    | Parameter                            | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
    | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | merchantId (String)                  | Merchant account number or merchant ID                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
    | number (string)                      | Card PAN number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
    | nameOnCard (string)                  | Cardholder name                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
    | year (string)                        | Card expiry year                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
    | month (string)                       | Card expiry month                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
    | securityCode (string)                | Card Verification Value/Code                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
    | save (bool)                          | If you want to save the card as a token to pay with later. When the transaction succeeds, a token is included in the response body and webhook response. [Webhook](/docs/webhooks/payloads)                                                                                                                                                                                                                                                                                                                                                             |
    | enable3DS (bool)                     | Whether to run 3D Secure for this payment. Send it at `paymentMethod.card.enable3DS` — **not** directly under `paymentMethod`. When absent it is treated as `true`, so an `ECOMMERCE` card pay runs 3DS and returns `AUTHENTICATION_INITIATED` rather than a final status.                                                                                                                                                                                                                                                                              |
    | apiOperation (string)                | Should be: PAY                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
    | connectedAccount.merchantId (string) | Make payments on behalf of your [connected account](/docs/accept-payments/connected-accounts) by sending the Sub Merchant/Connected Account merchant ID in the JSON body: `"connectedAccount": { "merchantId": "MID-452-644" }`. The value must start with `MID-`.                                                                                                                                                                                                                                                                                      |
    | order (JSON object)                  | Contains the order details `{"reference": "1","amount": "1", "currency": "EGP", "description": "" }`<br />- currency (String): order currency (ISO: "EGP", "USD", "GBP" "EUR")<br />- amount (string): order amount<br />- reference (string): order identifier<br />- description (string): order description                                                                                                                                                                                                                                          |
    | merchantRedirect (string)            | merchantRedirect should be URI encoded                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
    | redirect (bool)                      | Redirect to the merchantRedirect URL after the transaction has been completed, whether it is unsuccessful or successful                                                                                                                                                                                                                                                                                                                                                                                                                                 |
    | serverWebhook (string)               | Pass an endpoint to receive server-to-server notifications. Setting this up on your application is as easy as creating a new page that accepts unauthenticated POST requests. The event object is sent as JSON in the request body. [Webhook](/docs/webhooks/payloads)                                                                                                                                                                                                                                                                                  |
    | interactionSource (string)           | Mandatory; must be `MOTO`, `RECURRING`, or `ECOMMERCE` based on the business case                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
    | customer (JSON object)               | Contains the customer details `{"reference": "24","firstName": "ghanem","lastName": "ghanem","email": "ghanem@example.com"}`<br />- reference (String): customer reference ID to associate it with the card (required)<br />- firstName (string): first name of the customer (optional)<br />- lastName (string): last name of the customer (optional)<br />- email (string): email of the customer (optional)<br />- mobilePhone (string): mobile number of the customer (optional)<br />- nationalId (string): national ID of the customer (optional) |
    | metaData (JSON object)               | Additional data you can send and receive via webhooks and responses                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
    | newPaymentUI (bool)                  | **Mandatory.** Send `true`. Required on this request whenever 3D Secure runs — that is, when `paymentMethod.card.enable3DS` is `true` or absent (absent is treated as `true`).                                                                                                                                                                                                                                                                                                                                                                          |
  </Accordion>
</Accordions>

<Callout title="Note">
  The customer object is required in case of card

`save:true`

.
</Callout>

## Response structure at MOTO with NON-3DS [#response-structure-at-moto-with-non-3ds]

```json
{
  "response": {
    "apiOperation": "PAY",
    "operation": "pay",
    "currency": "EGP",
    "result": "SUCCESS",
    "status": "CAPTURED",
    "authenticationStatus": "AUTHENTICATION_NOT_IN_EFFECT",
    "amount": 100,
    "creationTime": "2023-10-16T12:00:49.746Z",
    "lastUpdatedTime": "2023-10-16T12:00:50.137Z",
    "merchantCurrency": "EGP",
    "reference": "1697457648576",
    "totalAuthorizedAmount": 100,
    "totalCapturedAmount": 100,
    "totalDisbursedAmount": 0,
    "totalRefundedAmount": 0,
    "authentication": {},
    "paymentMethod": {
      "type": "CARD",
      "card": {
        "cardBrand": "Mastercard",
        "storedOnFile": "TO_BE_STORED",
        "number": "512345******2346",
        "nameOnCard": "Mohamed Khaled",
        "expiry": {
          "month": "12",
          "year": "25"
        },
        "cardToken": "9d8332cb-6195-40ea-aed0-86c3aa60fbaa"
      }
    },
    "metaData": {
      "customerName": "Noura Mosaad",
      "merchantWebhook": "https://your-website.com/paymentWebhook",
      "redirect": true
    },
    "customer": {
      "reference": "01163550555"
    },
    "timestamp": "2022-12-15T13:54:01.606Z",
    "reconciliation": {
      "webhookUrl": "https://your-call-back-url.com",
      "merchantRedirect": "https://your-call-back-url.com?paymentStatus=SUCCESS&cardDataToken=9d8332cb-6195-40ea-aed0-86c3aa60fbaa&maskedCard=512345******2346&merchantOrderId=1697457648576&orderId=27a86389-83be-4107-b51d-33ad767078a2&cardBrand=Mastercard&orderReference=TEST-ORD-96353&transactionId=TX-2498912113&amount=100&currency=EGP&mode=test&signature=dde46b3a9b4fc05478f6a35dd62f82a2a3c0b6ace73997dfdcebda0abd7b8cc3",
      "redirect": true
    },
    "merchantId": "MID-123-123",
    "order": {
      "amount": 100,
      "currency": "EGP",
      "callbackURL": "https://your-call-back-url.com",
      "systemOrderId": "27a86389-83be-4107-b51d-33ad767078a2"
    },
    "merchantRedirectUrl": "https://your-call-back-url.com?paymentStatus=SUCCESS&cardDataToken=9d8332cb-6195-40ea-aed0-86c3aa60fbaa&maskedCard=512345******2346&merchantOrderId=1697457648576&orderId=27a86389-83be-4107-b51d-33ad767078a2&cardBrand=Mastercard&orderReference=TEST-ORD-96353&transactionId=TX-2498912113&amount=100&currency=EGP&mode=test&signature=dde46b3a9b4fc05478f6a35dd62f82a2a3c0b6ace73997dfdcebda0abd7b8cc3",
    "apiKeyId": "5d0003fc77c68a0018b05a6f",
    "method": "card",
    "creationDate": "2023-10-16T15:00:48.946Z",
    "orderId": "27a86389-83be-4107-b51d-33ad767078a2",
    "merchantOrderId": "1697457648576",
    "orderReference": "TEST-ORD-96353",
    "paymentType": "ext-default",
    "interactionSource": "MOTO",
    "transactionId": "TX-2498912113",
    "transactionResponseCode": "00",
    "transactionResponseMessage": {
      "en": "Approved",
      "ar": "تمت الموافقة"
    }
  },
  "messages": {
    "en": "Approved",
    "ar": "تمت الموافقة"
  },
  "status": "SUCCESS",
  "showCaptcha": false
}
```

You can receive the transaction response in the [webhook](/docs/webhooks/payloads).

## Response structure at Ecommerce with 3DS [#response-structure-at-ecommerce-with-3ds]

```json
{
  "response": {
    "apiOperation": "PAY",
    "operation": "3dsecure_verify",
    "currency": "EGP",
    "result": "SUCCESS",
    "status": "AUTHENTICATION_INITIATED",
    "authenticationStatus": "AUTHENTICATION_AVAILABLE",
    "creationTime": "2023-10-16T11:53:51.094Z",
    "lastUpdatedTime": "2023-10-16T11:53:51.059Z",
    "totalAuthorizedAmount": 0,
    "totalCapturedAmount": 0,
    "totalRefundedAmount": 0,
    "authentication": {
      "channel": "PAYER_BROWSER",
      "purpose": "PAYMENT_TRANSACTION",
      "redirectHtml": "<div id=\"initiate3dsSimpleRedirect\" xmlns=\"http://www.w3.org/1999/html\"> <iframe id=\"methodFrame\" name=\"methodFrame\" height=\"100\" width=\"200\"> </iframe> <form id=\"initiate3dsSimpleRedirectForm\" method=\"POST\" action=\"https://mtf.gateway.mastercard.com/acs/mastercard/v2/method\" target=\"methodFrame\"> <input type=\"hidden\" name=\"threeDSMethodData\" value=\"eyJ0aHJlZURTTWV0aG9kTm90aWZpY2F0aW9uVVJMIjoiaHR0cHM6Ly9tdGYuZ2F0ZXdheS5tYXN0ZXJjYXJkLmNvbS9jYWxsYmFja0ludGVyZmFjZS9nYXRld2F5Lzk2MDc0YmNhNmNlNGU1ZWZlMmZhNDExM2Y5MjdkOWQ2ZGUwY2ZiOTg5NGI5ZDU0ODYwZjc1NDI0OTg1MWZhNzkiLCJ0aHJlZURTU2VydmVyVHJhbnNJRCI6IjhmY2EyMmQ2LTNjOTktNDQ2NC04YmNjLWIyMmVmNTBhMzY2ZSJ9\" /> </form> <script id=\"initiate-authentication-script\"> var e=document.getElementById(\"initiate3dsSimpleRedirectForm\"); if (e) { e.submit(); if (e.parentNode !== null) { e.parentNode.removeChild(e); } } </script> </div>",
      "version": "3DS2",
      "redirectUrl": "https://checkout.kashier.io/3dsRedirect/bdcab401-d3eb-4cb1-80a7-6bc59f595961?methodUrl=https://mtf.gateway.mastercard.com/acs/mastercard/v2/method&methodPostData=eyJ0aHJlZURTTWV0aG9kTm90aWZpY2F0aW9uVVJMIjoiaHR0cHM6Ly9tdGYuZ2F0ZXdheS5tYXN0ZXJjYXJkLmNvbS9jYWxsYmFja0ludGVyZmFjZS9nYXRld2F5Lzk2MDc0YmNhNmNlNGU1ZWZlMmZhNDExM2Y5MjdkOWQ2ZGUwY2ZiOTg5NGI5ZDU0ODYwZjc1NDI0OTg1MWZhNzkiLCJ0aHJlZURTU2VydmVyVHJhbnNJRCI6IjhmY2EyMmQ2LTNjOTktNDQ2NC04YmNjLWIyMmVmNTBhMzY2ZSJ9&mode=test"
    },
    "paymentMethod": {
      "type": "CARD",
      "card": {
        "cardBrand": "Mastercard",
        "storedOnFile": "TO_BE_STORED",
        "number": "512345******2346",
        "nameOnCard": "Mohamed Khaled",
        "expiry": {
          "month": "12",
          "year": "25"
        },
        "cardToken": "9d8332cb-6195-40ea-aed0-86c3aa60fbaa"
      }
    },
    "metaData": {
      "customerName": "Noura Mosaad",
      "merchantWebhook": "https://your-website.com/paymentWebhook",
      "redirect": true
    },
    "customer": {
      "reference": "01163550555"
    },
    "timestamp": "2022-12-15T13:54:01.606Z",
    "reconciliation": {
      "webhookUrl": "https://your-call-back-url.com",
      "merchantRedirect": "https://your-call-back-url.com?&signature=",
      "redirect": true
    },
    "merchantId": "MID-123-123",
    "order": {
      "amount": 100,
      "currency": "EGP",
      "callbackURL": "https://your-call-back-url.com",
      "systemOrderId": "bdcab401-d3eb-4cb1-80a7-6bc59f595961"
    },
    "description": "order description",
    "merchantRedirectUrl": "https://your-call-back-url.com?&signature=",
    "apiKeyId": "5d0003fc77c68a0018b05a6f",
    "method": "card",
    "creationDate": "2023-10-16T14:53:50.593Z",
    "orderId": "bdcab401-d3eb-4cb1-80a7-6bc59f595961",
    "merchantOrderId": "1697457230044",
    "orderReference": "TEST-ORD-96349",
    "paymentType": "ext-default",
    "interactionSource": "ECOMMERCE",
    "transactionId": "TX-2498912112",
    "transactionResponseCode": "AUTHENTICATION_IN_PROGRESS",
    "transactionResponseMessage": {
      "en": "Authentication in progress",
      "ar": "المصادقة قيد التقدم"
    }
  },
  "messages": {
    "en": "Authentication in progress",
    "ar": "المصادقة قيد التقدم"
  },
  "status": "SUCCESS",
  "showCaptcha": false
}
```

After a successful response, you should redirect to `authentication.redirectUrl` to generate the 3DS page. As soon as the transaction has completed, it will redirect to `merchantRedirectUrl` if `reconciliation.redirect` was equal to true; otherwise use [3D Secure handling](/docs/direct-api/3d-secure).

You can receive the transaction response after 3DS processing in the [webhook](/docs/webhooks/payloads).

## Meeza cards [#meeza-cards]

Meeza (Egypt's national card scheme) is **not** a separate payment method — it's a card brand that Kashier detects from the card number and routes automatically. You submit a Meeza card exactly like any other card: `paymentMethod.type: "CARD"` with the PAN, expiry, and security code. There's no `"meeza"` value to send anywhere.

Kashier identifies a Meeza card by its BIN prefix (`9` or `50`) and picks the acquiring rail for you — normally the UPG gateway online, or the ISO 8583 rail on POS. If your account has an MPGS credential provisioned, Meeza traffic is routed to MPGS instead and follows the standard MPGS card flow (3DS, auth/capture, void, refund) described above.

<Callout title="Meeza is blocked on subscriptions/recurring">
  A Meeza card routed over UPG cannot be used for a subscription-origin (recurring) payment — the request fails with a `MEEZA_NOT_ALLOWED` error, because Meeza-over-UPG cards aren't tokenizable for recurring the way MPGS Visa/Mastercard cards are. See [Recurring payments](/docs/accept-payments/recurring) for the tokenizable card flow.
</Callout>

Meeza transactions use the same response/reason-code dictionary, statuses, and webhook shape as any other card — there's no Meeza-specific code table.

## Pay with token [#pay-with-token]

To make a payment transaction with a card token that has been saved, see [Pay with card token](/docs/direct-api/pay-with-token).

# Delete token (/docs/direct-api/delete-token)

A DELETE request is made to the "CancelToken" endpoint. A token can be removed using it. For example, an expired card, a new card, or a stolen card — it can be useful for removing the old card information.

## Hashing [#hashing]

The remove hash is used to validate your order with what your customers are paying. Order hash generation uses the HMAC SHA256 crypto mechanism. You should generate the hash from your backend, and it is implemented as explained below:

```js
//Copy and paste this code in your Backend
let crypto = require("crypto");
function generateKashierOrderHash(order) {
  const mid = "MID-123-123"; //your merchant id
  const reference = "1"; //your customer id to save card
  const secret = "yourPaymentApiKey";
  const path = `/?tokenization=${mid}.${reference}`;
  const hash = crypto.createHmac("sha256", secret).update(path).digest("hex");
  return hash;
}
```

```php
//Copy and paste this code in your Backend
function generateKashierOrderHash($order){
    $mid = "MID-123-123"; //your merchant id
    $secret = "yourPaymentApiKey";
    $reference = "1"; //your customer id to save card
    $path = "/?tokenization=".$mid.".".$reference;
    $hash = hash_hmac('sha256', $path, $secret, false);
    return $hash;
}
```

```python
#Copy and paste this code in your Backend
import hmac
import hashlib
import binascii
def generateKashierOrderHash(order):
    mid = "MID-123-123"; #your merchant id
    reference = '1'; #your customer id to save card
    path = '/?tokenization={}.{}'.format(mid, reference)
    path = bytes(path, 'utf-8')
    secret = "yourPaymentApiKey"
    secret = bytes(secret, 'utf-8')
    return hmac.new(secret, path, hashlib.sha256).hexdigest()
```

```csharp
//Copy and paste this code in your Backend
using System.Security.Cryptography;
public class Kashier
{
    public static string create_hash(){
        string mid = "MID-123-123"; //your merchant id
        string reference = "1"; //your customer Id
        string secret = "yourPaymentApiKey";
        string path = "/?tokenization=" + mid + "." + reference;
        string message;
        string key;
        key = secret;
        message = path;
        System.Text.ASCIIEncoding encoding = new System.Text.ASCIIEncoding();
        byte[] keyByte = encoding.GetBytes(key);
        byte[] messageBytes = encoding.GetBytes(message);
        HMACSHA256 hmacmd256 = new HMACSHA256(keyByte);
        byte[] hashmessage = hmacmd256.ComputeHash(messageBytes);
        return ByteToString(hashmessage).ToLower();
    }
    public static string ByteToString(byte[] buff){
        string sbinary = "";
        for (int i = 0; i < buff.Length; i++){
            sbinary += buff[i].ToString("X2"); // hex format
        }
        return (sbinary);
    }
}
```

<Callout title="Note">
  For creating the hash, use only the parameters mentioned in the snippet above. Don't add extra parameters in the hash creation.
</Callout>

## Remove token [#remove-token]

In case you are still in the development phase, you will need to call our API using the following testing endpoint API URL.

| Endpoint | Value                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| TEST-URL | `https://test-fep.kashier.io/v3/cards/tokens/:token?customerReference=yourcustomerReference&merchantId=merchantId` |
| LIVE-URL | `https://fep.kashier.io/v3/cards/tokens/:token?customerReference=yourcustomerReference&merchantId=merchantId`      |
| Method   | DELETE                                                                                                             |

## Headers [#headers]

| Key                   | Description                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Authorization         | Your Secret Key.                                                                                                            |
| Kashier-Hash (String) | HMAC SHA256 of `/?tokenization={mid}.{customerReference}`, keyed with your Payment API Key — see [Hashing](#hashing) above. |

```bash
curl -X 'DELETE' 'https://test-fep.kashier.io/v3/cards/tokens/:token?customerReference={{customerReference}}' \
  -H 'Authorization: your_secretKey' \
  -H 'Kashier-Hash: your_generated_hash' \
  -H 'accept: application/json'
```

Full parameter and response reference → [Delete token](/docs/api-reference/tokens/deleteToken).

# Request hashing (/docs/direct-api/hashing)

## Hashing [#hashing]

Kashier uses hashing to ensure that the Payment UI and responses shared between your application and Kashier over the network have not been tampered with. We use SHA256 hashing to ensure the safety of transaction data.

The order hash is used to validate your order against what your customers are paying. Order hash generation uses the HMAC SHA256 cryptographic mechanism. You should generate the hash from your backend, as explained below.

You can obtain your [API key](/docs/get-started/api-keys) from the [Dashboard](https://merchant.kashier.io/en/dashboard).

Both the order hash and the response signature below are generated with your **Payment API Key** — not your Secret Key. If the "API key" vs. "secret key" vs. "MID" terminology gets confusing, see the [credentials-at-a-glance table](/docs/get-started/api-keys#credentials-at-a-glance) for how each term maps to its actual header or field name.

```js
// Copy and paste this code into your backend
let crypto = require("crypto");
function generateKashierOrderHash(order) {
  const mid = "MID-123-123"; // Your merchant ID
  const CustomerReference = ""; // Required when save, cardToken, or agreement is sent
  const amount = order.amount; // e.g., 22.00
  const currency = order.currency; // e.g., "EGP"
  const orderId = order.merchantOrderId; // e.g., 99
  const apiKey = "yourApiKey";
  const path = `/?payment=${mid}.${orderId}.${amount}.${currency}${CustomerReference ? "." + CustomerReference : ""}`;
  const hash = crypto.createHmac("sha256", apiKey).update(path).digest("hex");
  return hash;
}
// The result hash for /?payment=mid-0-1.99.20.EGP with key 11111
// should be 606a8a1307d64caf4e2e9bb724738f115a8972c27eccb2a8acd9194c357e4bec
```

```php
// Copy and paste this code into your backend
function generateKashierOrderHash($order) {
  $mid = "MID-123-123"; // Your merchant ID
  $amount = $order->amount; // e.g., 100
  $currency = $order->currency; // e.g., "EGP"
  $orderId = $order->merchantOrderId; // e.g., 99
  $apiKey = "yourApiKey";
  $CustomerReference = ""; // Required when save, cardToken, or agreement is sent
  $path = "/?payment=".$mid.".".$orderId.".".$amount.".".$currency;
  if (!empty($CustomerReference)) {
      $path .= ".".$CustomerReference;
  }
  return hash_hmac('sha256', $path, $apiKey, false);
}
// The result hash for /?payment=mid-0-1.99.20.EGP with key 11111
// should be 606a8a1307d64caf4e2e9bb724738f115a8972c27eccb2a8acd9194c357e4bec
```

```python
# Copy and paste this code into your backend
import hmac
import hashlib
def generateKashierOrderHash(order):
  mid = "MID-123-123"  # Your merchant ID
  amount = order['amount']  # e.g., 100
  currency = order['currency']  # e.g., "EGP"
  orderId = order['merchantOrderId']  # e.g., 99
  CustomerReference = ""  # Required when save, cardToken, or agreement is sent
  path = f"/?payment={mid}.{orderId}.{amount}.{currency}"
  if CustomerReference:
      path += f".{CustomerReference}"
  apiKey = "yourApiKey"
  return hmac.new(apiKey.encode('utf-8'), path.encode('utf-8'), hashlib.sha256).hexdigest()
# The result hash for /?payment=mid-0-1.99.20.EGP with secret 11111
# should be 606a8a1307d64caf4e2e9bb724738f115a8972c27eccb2a8acd9194c357e4bec
```

```csharp
// Copy and paste this code into your backend
using System;
using System.Security.Cryptography;
public class Kashier
{
  public static string CreateHash()
  {
      string mid = "mid-0-1"; // Merchant ID from the comment example
      string amount = "20"; // Amount from the comment example
      string currency = "EGP";
      string orderId = "99"; // Order ID from the comment example
      string CustomerReference = ""; // Required when save, cardToken, or agreement is sent
      string apiKey = "11111"; // Payment API Key from the comment example
      string path = $"/?payment={mid}.{orderId}.{amount}.{currency}";
      if (!string.IsNullOrEmpty(CustomerReference))
      {
          path += $".{CustomerReference}";
      }
      using (var hmac = new HMACSHA256(System.Text.Encoding.ASCII.GetBytes(apiKey)))
      {
          byte[] hash = hmac.ComputeHash(System.Text.Encoding.ASCII.GetBytes(path));
          return BitConverter.ToString(hash).Replace("-", "").ToLower();
      }
  }
}
// The result hash for /?payment=mid-0-1.99.20.EGP with key 11111
// should be: 606a8a1307d64caf4e2e9bb724738f115a8972c27eccb2a8acd9194c357e4bec
```

<Callout title="Note">
  For creating the hash, use only the parameters mentioned in the snippet above. Do not add extra parameters during hash creation.
</Callout>

### Which string to sign [#which-string-to-sign]

The algorithm is always the same — HMAC-SHA256, lowercase hex digest, keyed with your
**Payment API Key**. Only the signed string changes with the operation. Parts are joined
with a literal `.` and are **not** URL-encoded.

| Operation                                                                                                        | String to sign                                                                                      |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Payment / checkout, no tokenization                                                                              | `/?payment={mid}.{reference}.{amount}.{currency}`                                                   |
| Payment **with** tokenization (`card.save`, `card.cardToken`, or `card.agreement`)                               | `/?payment={mid}.{reference}.{amount}.{currency}.{customerReference}`                               |
| Token CRUD — [retrieve](/docs/direct-api/retrieve-tokens) / [delete](/docs/direct-api/delete-token) a saved card | `/?tokenization={mid}.{customerReference}`                                                          |
| 3D Secure pay (resuming an in-flight 3DS order)                                                                  | `/?payment={mid}.{orderId}`                                                                         |
| Payment session create (Apple Pay SDK / sessions)                                                                | `/?payment={mid}.{reference}.{amount}.{currency}` — append `.{customerReference}` when you send one |

Operations that are **not** in this table are not hashed. In particular there is no
published signed string for `PUT /v3/orders/:orderId` — the
[refund](/docs/accept-payments/refunds), [void](/docs/accept-payments/void) and
[capture](/docs/accept-payments/authorize-capture) route — which authenticates with your
`Authorization` secret key instead. Don't try to reuse the payment string for it.

Here `{mid}` is your merchant ID, `{reference}` is your `order.reference` (your merchant
order ID), and `{orderId}` on the 3DS-resume row is Kashier's **system** order ID for
the order being resumed — not your own reference. On the session-create row the amount is
coerced to a number before signing, so `20.00` signs as `20`.

<Callout type="warn" title="customerReference is required for token requests">
  Append `.{customerReference}` to the signed string whenever the request carries `paymentMethod.card.save`, `paymentMethod.card.cardToken`, or `paymentMethod.card.agreement`. For those requests Kashier accepts only the customer-reference variant — hash without it and you get `403 INVALID_HASH_CHECK`. For a plain payment with none of those fields, both variants are accepted.
</Callout>

<Callout type="warn" title="Match the key to the mode">
  The Payment API Key is mode-scoped at the hash layer. A test key validates only on the `test-` hosts and a live key only on the live hosts, so a mode mismatch fails the hash even when your formula is correct. This is the most common cause of an "invalid hash" error — check the key before you check the string.
</Callout>

## Signature [#signature]

Once the transaction is processed, Kashier creates a signature with response parameters and sends it in the redirection along with other parameters.
You need to validate the signature appended to the redirection URL. For validating the signature in the response, use the function explained below.

Kashier signs a **fixed, ordered list** of parameters — not whatever happens to be on
the URL. Rebuild that exact string yourself rather than iterating the query string, so
that an extra, missing, or re-ordered parameter can't silently break your check. A
parameter that is absent from the redirect is signed as the literal string `null`.

```js
const crypto = require("crypto");

// Copy and paste this code into your backend
function validateSignature(query, secret) {
  const body =
    `paymentStatus=${query.paymentStatus}` +
    `&cardDataToken=${query.cardDataToken}` +
    `&maskedCard=${query.maskedCard}` +
    `&merchantOrderId=${query.merchantOrderId}` +
    `&orderId=${query.orderId}` +
    `&cardBrand=${query.cardBrand}` +
    `&orderReference=${query.orderReference}` +
    `&transactionId=${query.transactionId}` +
    `&amount=${query.amount}` +
    `&currency=${query.currency}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return signature === query.signature;
}
```

```php
<?php
// Copy and paste this code into your backend
$secret = 'your_APIKEY';
$fields = [
  'paymentStatus', 'cardDataToken', 'maskedCard', 'merchantOrderId', 'orderId',
  'cardBrand', 'orderReference', 'transactionId', 'amount', 'currency',
];
$parts = [];
foreach ($fields as $field) {
  $parts[] = $field . '=' . ($_GET[$field] ?? 'null');
}
$body = implode('&', $parts);
$signature = hash_hmac('sha256', $body, $secret, false);
if (hash_equals($signature, $_GET['signature'] ?? '')) {
  echo "Success signature";
} else {
  echo "Failed signature";
}
?>
```

```python
# Copy and paste this code in your backend
import hmac
import hashlib

FIELDS = [
    "paymentStatus", "cardDataToken", "maskedCard", "merchantOrderId", "orderId",
    "cardBrand", "orderReference", "transactionId", "amount", "currency",
]

def validateSignature(request, secret):
    body = "&".join(f"{field}={request.get(field, 'null')}" for field in FIELDS)
    signature = hmac.new(
        secret.encode("utf-8"), body.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    return "success" if hmac.compare_digest(signature, request.get("signature", "")) else "failure"
```

```csharp
using System;
using System.Security.Cryptography;
using System.Text;
using System.Web.Mvc;
public class WebhookController : Controller
{
  private static readonly string[] Fields = {
      "paymentStatus", "cardDataToken", "maskedCard", "merchantOrderId", "orderId",
      "cardBrand", "orderReference", "transactionId", "amount", "currency"
  };

  [HttpPost]
  public JsonResult ValidateSignature()
  {
      string secret = "Payment API Key";
      string signature = Request.QueryString["signature"];
      if (string.IsNullOrEmpty(signature))
      {
          return Json(new { success = false, message = "Missing signature." });
      }
      var parts = new StringBuilder();
      foreach (string field in Fields)
      {
          if (parts.Length > 0) parts.Append("&");
          parts.Append($"{field}={Request.QueryString[field] ?? "null"}");
      }
      byte[] keyBytes = Encoding.ASCII.GetBytes(secret);
      byte[] messageBytes = Encoding.ASCII.GetBytes(parts.ToString());
      using (var hmac = new HMACSHA256(keyBytes))
      {
          byte[] hashMessage = hmac.ComputeHash(messageBytes);
          string computedSignature = ByteToString(hashMessage).ToLower();
          if (computedSignature == signature.ToLower())
          {
              return Json(new { success = true, message = "Signature validated successfully." });
          }
          else
          {
              return Json(new { success = false, message = "Signature validation failed." });
          }
      }
  }
  public static string ByteToString(byte[] buff)
  {
      StringBuilder sbinary = new StringBuilder();
      for (int i = 0; i < buff.Length; i++)
      {
          sbinary.Append(buff[i].ToString("X2")); // hex format
      }
      return sbinary.ToString();
  }
}
```

Handle the webhook: when a payment is successful, Kashier sends a payment webhook event to the webhook URL that you provide. Learn more about using [webhooks](/docs/webhooks).

## Redirect [#redirect]

Kashier sends the response of the transaction to the redirect URL provided by the merchant. The URL in the format `https://your_website.com/redirect` can be sent in the data-merchantRedirect parameter in the Payment UI.
Below are the parameters you can include in the Payment UI solution's redirect URL.

### Parameters [#parameters]

| Parameter       | Description                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------- |
| paymentStatus   | Status of the transaction: either SUCCESS or FAILURE                                              |
| cardDataToken   | Your shopper's card token for future and recurring payments.                                      |
| maskedCard      | The masked card of your customer.                                                                 |
| merchantOrderId | Your order identifier used in [order reconciliation](/docs/accept-payments/order-reconciliation). |
| orderId         | Kashier's system identifier for the order.                                                        |
| cardBrand       | The card brand (sometimes called a card network or association).                                  |
| orderReference  | The order reference.                                                                              |
| transactionId   | Kashier's identifier for the transaction (for example `TX-2498912113`), not your own reference.   |
| amount          | The amount of the order.                                                                          |
| currency        | The currency of the order.                                                                        |
| signature       | Order signature to ensure a secure connection between your server and Kashier.                    |
| mode            | The mode of operation, either [test](/docs/get-started/api-keys#test-and-live-modes) or live.     |

Kashier signs a fixed, ordered list of those parameters — not whatever happens to be on the URL. Rebuild the body in exactly this order, then HMAC it with your Payment API Key:

```
paymentStatus, cardDataToken, maskedCard, merchantOrderId, orderId, cardBrand, orderReference, transactionId, amount, currency
```

`signature` and `mode` are excluded from the signed body. A parameter that is absent from the redirect is signed as the literal string `null`.

[Learn how to validate the signature](/docs/webhooks) to ensure that the Payment UI and responses shared between your application and Kashier over the network have not been tampered with.

You can retrieve your order details using [order reconciliation](/docs/accept-payments/order-reconciliation). If your transaction fails, you can determine the reason for the failed transaction by mapping the transactionResponseCode to the corresponding [payment reason code](/docs/accept-payments/payment-reason-codes).

## Demo [#demo]

You can download and install our integration demo:

- [PHP demo](https://github.com/Kashier-payments/Php-Checkout-Demo)

- [Node.js demo](https://github.com/Kashier-payments/NodeJs-Checkout-Demo)

# Direct API integration (/docs/direct-api)

Direct API integration gives you full control over the payment experience:
your own card form, token-based repeat payments, 3D Secure handling, wallets,
installments, and kiosk payments.

<Callout title="PCI DSS responsibility">
  Collecting card data on your own pages changes your PCI DSS scope compared to
  the hosted checkout. Review your compliance requirements before choosing this
  path.
</Callout>

## The core path [#the-core-path]

These three pages are the integration. Work through them in order — none of them
is optional, and a card payment will not complete if you skip one:

1. **[Request hashing](/docs/direct-api/hashing)** — every request is signed, and
   the signature is generated on your backend with your Payment API Key. Read
   this first; an unsigned or wrongly-signed request fails before anything else
   you build gets exercised.
2. **[Customized card form](/docs/direct-api/card-form)** — collect the card and
   submit the payment.
3. **[3D Secure handling](/docs/direct-api/3d-secure)** — handle the
   authentication challenge and verify the result. Most Egyptian card
   transactions are challenged, so treat this as part of the happy path rather
   than an edge case.

## Optional add-ons [#optional-add-ons]

Add these only if your flow needs them:

- **Saved cards** — [pay with token](/docs/direct-api/pay-with-token), [retrieve tokens](/docs/direct-api/retrieve-tokens), and [delete token](/docs/direct-api/delete-token).
- **Other payment methods** — [wallet payments](/docs/direct-api/wallet-payments) and [kiosk & cash payments](/docs/direct-api/kiosk-payments) (Basata, Aman, Cash).
- **[Installment plans](/docs/direct-api/installment-plans)** — bank installments and standalone BNPL providers (valU, Octo, Souhoola, Contact, Mogo, Tru, Forsa).

See [rate limits](/docs/resources/rate-limits) for the request-per-minute cap on the payment API.

# Installment plans (/docs/direct-api/installment-plans)

To retrieve installment plans and pay with one:

## Step 1: Get available banks [#step-1-get-available-banks]

| Endpoint | Value                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------ |
| URL      | `https://test-api.kashier.io/merchant/installments/banks/plans?mid=yourMerchantID&amount=productPrice` |
| Method   | GET                                                                                                    |

Whenever you are ready for production, use the following production API endpoint URL instead.

| Endpoint | Value                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------- |
| URL      | `https://api.kashier.io/merchant/installments/banks/plans?mid=yourMerchantID&amount=productPrice` |
| Method   | GET                                                                                               |

```bash
curl -X 'GET'
  'https://test-api.kashier.io/merchant/installments/banks/plans?mid=MID-0000-000&amount=500'
```

Full parameter and response reference → [Get available banks](/docs/api-reference/installments/getInstallmentBanks).

### Query parameters [#query-parameters]

| Parameter    | Required | Notes                                                                             |
| ------------ | -------- | --------------------------------------------------------------------------------- |
| `mid`        | Yes      | Your merchant ID.                                                                 |
| `amount`     | Yes      | The product price, used to filter out plans whose minimum the order doesn't meet. |
| `clientType` | No       | Sending `POS` removes QNB and Banque Misr from the returned bank list.            |

<Callout type="warn" title="minimunInstallmentAmount is misspelled on the wire">
  This step returns each bank's minimum as `minimunInstallmentAmount` — the missing second
  `m` is genuinely part of the wire key, not a typo in these docs. Step 2 returns the same
  value under a different name, `Minimum installment amount`. Handle both spellings across
  the two steps.
</Callout>

<Callout title="allowFawry">
  `allowFawry` may still appear in this response, but as far as we can confirm nothing
  routes to Fawry today: the provider is implemented in Kashier's payment-object layer,
  yet it has no entry in the payment routing tables that back the `/v3/orders` flow, so
  there is no Fawry equivalent of the Basata reference-code path. Confirm with Kashier
  support before planning a Fawry integration or building against the flag.
</Callout>

### BNPL availability flags [#bnpl-availability-flags]

Alongside `banks`, the response carries boolean flags showing which BNPL providers are available for the merchant, computed from real provisioning for that merchant:

| Flag            | Enabled when                         |
| --------------- | ------------------------------------ |
| `allowValu`     | valU is provisioned for the merchant |
| `allowOcto`     | Octo is provisioned for the merchant |
| `allowSouhoola` | Souhoola is enabled for the merchant |

These BNPL providers use their own dedicated payment flow — they are **not** paid via the `installments.planId` card path described in Step 3 below.

## Step 2: Get plans for a specific bank [#step-2-get-plans-for-a-specific-bank]

| Endpoint | Value                                                                                                                            |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| URL      | `https://test-api.kashier.io/merchant/installments/plans?mid=yourMerchantID&amount=productPrice&currency=EGP&fiId=banknSystemID` |
| Method   | GET                                                                                                                              |

Whenever you are ready for production, use the following production API endpoint URL instead.

| Endpoint | Value                                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------------------- |
| URL      | `https://api.kashier.io/merchant/installments/plans?mid=yourMerchantID&amount=productPrice&currency=EGP&fiId=banknSystemID` |
| Method   | GET                                                                                                                         |

```bash
curl -X 'GET'
  'https://test-api.kashier.io/merchant/installments/plans?mid=MID-0000-000&amount=10000&currency=EGP&fiId=FI-13'
```

Full parameter and response reference → [Get plans for specific bank](/docs/api-reference/installments/getInstallmentPlans).

### Query parameters [#query-parameters-1]

| Parameter               | Required    | Notes                                                                                                                                                                                                                                                           |
| ----------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mid`                   | Yes         | Your merchant ID.                                                                                                                                                                                                                                               |
| `amount`                | Yes         | The product price.                                                                                                                                                                                                                                              |
| `currency`              | Yes         | Must be `EGP`. Any other value is rejected with a hard `400` and the cause `EGP.currency.is.required.in.installment` — bank installments are EGP-only.                                                                                                          |
| `fiId` **or** `cardBin` | Exactly one | `fiId` is the `Bank system ID` from Step 1. `cardBin` is an accepted alternative: pass the customer's card BIN and Kashier resolves the bank for you. Sending both, or neither, is rejected with `financial.institution.system.id.or.the.card.bin.is.required`. |
| `clientType`            | No          | Sending `POS` returns a camelCase response shape that also carries `interestAmount` per plan, instead of the default `Title Case` online shape.                                                                                                                 |

The response renames the Step 1 minimum: what Step 1 calls `minimunInstallmentAmount` is
returned here as `Minimum installment amount`.

## Step 3: Pay with a plan [#step-3-pay-with-a-plan]

Once you have a `Merchant Plan ID` (e.g. `INSPLAN-53`) from Step 2, pay with it by adding `installments.planId` to a normal card payment request. This is the same `POST /v3/orders` request used for any [card payment](/docs/direct-api/card-form) — the plan is validated before the card is charged.

| Endpoint | Value                                    |
| -------- | ---------------------------------------- |
| URL      | `https://test-fep.kashier.io/v3/orders/` |
| Method   | POST                                     |

Whenever you are ready for production, use the following production API endpoint URL instead.

| Endpoint | Value                               |
| -------- | ----------------------------------- |
| URL      | `https://fep.kashier.io/v3/orders/` |
| Method   | POST                                |

```bash
curl -X 'POST' 'https://test-fep.kashier.io/v3/orders/' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H 'Kashier-Hash: your_generated_hash' \
  -d '{
      "apiOperation": "PAY",
      "installments": {
          "planId": "INSPLAN-53"
      },
      "paymentMethod": {
          "type": "CARD",
          "card": {
              "number": "5484571234560000",
              "expiry": {
                  "month": "05",
                  "year": "26"
              },
              "nameOnCard": "TEST",
              "securityCode": "100"
          }
      },
      "order": {
          "reference": "PM-89451648984",
          "amount": "10000",
          "currency": "EGP",
          "description": ""
      },
      "interactionSource": "ECOMMERCE",
      "reconciliation": {
          "webhookUrl": "https://your-call-back-url.com",
          "merchantRedirect": "https://your-call-back-url.com",
          "redirect": true
      },
      "customer": {
          "reference": "24"
      },
      "merchantId": "MID-0000-000"
  }'
```

### Body parameters [#body-parameters]

| Parameter                      | Description                                                                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `installments.planId` (string) | The `Merchant Plan ID` from Step 2 (e.g. `INSPLAN-53`). Matched against the plan copy enabled for your account. Omit `installments` entirely for a regular (non-installment) card payment. |
| `paymentAgreement`             | Set by Kashier, not by you. Omit `installments` and the request is treated as `regular`; send `installments` and it becomes `installment`.                                                 |

### How the plan is validated [#how-the-plan-is-validated]

When `installments` is present, the payment is treated as an installment agreement (as opposed to a regular card charge), and the plan is validated before the card is charged:

1. `installments.planId` must match a known master plan. This check runs in **every** mode, test included.
2. The plan must be active.
3. The card's BIN must fall inside the plan's `binRanges` (the same ranges returned as `Supported BINs` in Step 2).
4. The plan must actually be provisioned and active for your merchant account.

If any check fails, the request is rejected before the card is charged, with one of the error codes below.

Validate the card BIN against `Supported BINs` in your own UI before submitting, so the customer is not shown a plan their card cannot use.

<Callout title="What test mode does and doesn't skip">
  Only the *active*-plan and BIN-range checks are gated on live mode — checks 2 and 3
  above don't run in test. The master-plan lookup in check 1 still runs, so an unknown
  `planId` returns `PLAN_NOT_EXIST` in test just as it does live. If your **merchant copy**
  of a valid plan is missing, test mode synthesizes a default copy with zero fees and
  `planFinancing: true`, so a test payment can succeed on a plan that would be rejected
  live.
</Callout>

### Pay-time errors [#pay-time-errors]

| Code                    | Meaning                                                                   | Fix                                                                                        |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PLAN_NOT_EXIST`        | No plan matches the `planId` you sent, or your account has no copy of it. | Re-read the plan list from Step 2 and send a `Merchant Plan ID` from the current response. |
| `PLAN_NOT_ACTIVE`       | The plan exists but is not active.                                        | Pick another plan, or ask Kashier support to activate it for your account.                 |
| `INVALID_BIN_RANGE`     | The card BIN is outside the plan's supported ranges.                      | Ask the customer for a card from the bank that owns the plan, or offer a different plan.   |
| `INVALID_MERCHANT_PLAN` | The plan does not belong to your merchant account.                        | Use only plans returned for your own `mid`.                                                |

### Response [#response]

Once validation passes, the normal card payment flow runs unchanged — including 3DS, capture, and the response shape. See [Customized card form](/docs/direct-api/card-form) for the full response structure, and [3D Secure handling](/docs/direct-api/3d-secure) for the 3DS redirect flow.

You can find how much the customer will pay monthly for every plan in the `Installment amount per month` parameter of the Step 2 response.

## BNPL installment providers [#bnpl-installment-providers]

Beyond bank card installments (Steps 1–3 above), Kashier supports several standalone BNPL (buy-now-pay-later) providers. Each is its own `paymentMethod.type`, with its own dedicated payment flow — none of them are paid via the `installments.planId` card path.

| Provider | `paymentMethod.type` | Provider type(s)                 |
| -------- | -------------------- | -------------------------------- |
| valU     | `valu`               | `valu` (online), `valupos` (POS) |
| Octo     | `octo`               | `octo`                           |
| Souhoola | `souhoola`           | `souhoola`                       |
| Contact  | `contact`            | `contact`, `contact_pos`         |
| Mogo     | `mogo`               | `mogo`, `mogo_pos`               |
| Tru      | `tru`                | `tru`                            |
| Forsa    | `forsa`              | `forsa`, `forsa_pos`             |

### Availability [#availability]

Of these, three are surfaced as [availability flags on the Step 1 banks response](#bnpl-availability-flags) — `allowValu`, `allowOcto`, and `allowSouhoola`. Mogo, Tru, Forsa, and Contact don't have a documented availability flag of their own on that response; whether one of them is usable for a given merchant depends on that merchant's own provisioning rather than a flag here.

### Contact [#contact]

Contact (`paymentMethod.type: "contact"`, provider `contact` online / `contact_pos` on POS) is a BNPL provider, not a cash or kiosk method. It's initiated with `get_categories` / `validate_balance` and then progresses through tenure selection, OTP, pay, and refund (including a dedicated `otp_refund` step).

# Kiosk & cash payments (/docs/direct-api/kiosk-payments)

## Overview [#overview]

Kashier has three payment methods in this family, each with a different completion mechanism:

| Method | `paymentMethod.type` | How it completes                                                                                             |
| ------ | -------------------- | ------------------------------------------------------------------------------------------------------------ |
| Basata | `basata`             | You generate a payment reference code; the customer pays it at a Basata outlet, and Basata notifies Kashier. |
| Aman   | `aman`               | The customer completes an OTP-verified installment purchase through Aman.                                    |
| Cash   | `cash`               | Internal "mark-as-paid" bookkeeping operation — no external provider call, no real-time authorization.       |

<Callout title="Looking for Contact, valU, Octo, Souhoola, Mogo, Tru, or Forsa?">
  Those are BNPL/installment providers, not cash or kiosk methods, even though Contact's name suggests otherwise. See [Installment plans → BNPL providers](/docs/direct-api/installment-plans#bnpl-installment-providers).
</Callout>

## Basata: generate payment code [#basata-generate-payment-code]

Generates a payment code for the Basata payment method.

| Endpoint | Value                                   |
| -------- | --------------------------------------- |
| TEST-URL | `https://test-fep.kashier.io/v3/orders` |
| LIVE-URL | `https://fep.kashier.io/v3/orders`      |
| Method   | POST                                    |

### Headers [#headers]

| Endpoint     | Required | Value                                                     |
| ------------ | -------- | --------------------------------------------------------- |
| Kashier-Hash | Yes      | HMAC-SHA256 hash calculated based on the path and API key |
| Content-Type | Yes      | application/json                                          |

```bash
curl --location 'https://test-fep.kashier.io/v3/orders' \
  --header 'Kashier-Hash: your_generated_hash' \
  --header 'Content-Type: application/json' \
  --data '{
  "apiOperation": "GENERATE_CODE",
  "paymentMethod": {
      "type": "BASATA",
      "basata": {
          "mobileNumber": "01001001001"
      }
  },
  "order": {
      "reference": "PM-89451648984",
      "amount": 10.00,
      "currency": "EGP"
  },
  "interactionSource": "ECOMMERCE",
  "reconciliation": {
      "webhookUrl": "https://your-call-back-url.com",
      "merchantRedirect": "https://your-call-back-url.com"
  },
  "merchantId": "MID-XXXXX-XXXX"
}'
```

### Body description [#body-description]

| Parameter                         | Type   | Required | Description                                                    |
| --------------------------------- | ------ | -------- | -------------------------------------------------------------- |
| apiOperation                      | String | Yes      | Must be set to 'GENERATE\_CODE'                                |
| paymentMethod.type                | String | Yes      | Must be set to 'BASATA'                                        |
| paymentMethod.basata.mobileNumber | String | Yes      | Customer's mobile number                                       |
| order.reference                   | String | Yes      | Unique order reference ID (can be generated using a timestamp) |
| order.amount                      | Number | Yes      | Transaction amount                                             |
| order.currency                    | String | Yes      | Currency code (e.g., 'EGP')                                    |
| interactionSource                 | String | Yes      | Source of interaction (typically 'ECOMMERCE')                  |
| reconciliation.webhookUrl         | String | Yes      | URL for webhook notifications                                  |
| reconciliation.merchantRedirect   | String | Yes      | URL to redirect the customer after the transaction             |
| merchantId                        | String | Yes      | Your merchant ID provided by Kashier                           |

### Response structure [#response-structure]

<Callout type="warn" title="This 00 / SUCCESS means the code was generated, not that the customer paid">
  `GENERATE_CODE` does not call Basata at all — Kashier generates the reference code and
  its `expireAt` itself on this leg, and the `transactionResponseCode: "00"` / `"Approved"`
  below is produced locally by that generator. The **order** is created with status
  `INITIATED`, not paid. The customer still has to take the reference code to a Basata
  outlet. Treat the completion webhook (`event: pay`, `status: SUCCESS`) as the
  authoritative "customer has paid" signal — never this response.
</Callout>

```json
{
  "response": {
    "apiOperation": "GENERATE_CODE",
    "operation": "generate_code",
    "currency": "EGP",
    "result": "SUCCESS",
    "status": "SUCCESS",
    "authorizationNumber": "",
    "authentication": {},
    "paymentMethod": {
      "type": "BASATA",
      "basata": {
        "mobileNumber": "01001001001",
        "referenceCode": "21496319",
        "expireAt": "2025-04-06T13:05:45.007Z"
      }
    },
    "metaData": {
      "termsAndConditions": {
        "ip": "156.210.51.26"
      },
      "merchantWebhook": "https://your-website.com/paymentWebhook"
    },
    "reconciliation": {
      "webhookUrl": "https://your-call-back-url.com",
      "merchantRedirect": "https://your-call-back-url.com?&signature=",
      "redirect": false
    },
    "merchantId": "MID-21232-888",
    "order": {
      "amount": 10,
      "currency": "EGP",
      "callbackURL": "https://your-call-back-url.com",
      "systemOrderId": "e5f15beb-c922-42a2-b6ba-015f5a435a20",
      "reference": "test12d34"
    },
    "amount": 10,
    "totalRefundedAmount": 0,
    "totalCapturedAmount": 0,
    "totalAuthorizedAmount": 0,
    "merchantRedirectUrl": "https://your-call-back-url.com?&signature=",
    "apiKeyId": "64e630f515427000134fd486",
    "method": "basata",
    "creationDate": "2025-04-06T14:05:44.981Z",
    "orderId": "e5f15beb-c922-42a2-b6ba-015f5a435a20",
    "provider": "basata",
    "merchantOrderId": "test12d34",
    "orderReference": "TEST-ORD-193390011",
    "interactionSource": "ECOMMERCE",
    "device": {
      "ipAddress": "156.210.51.26"
    },
    "transactionId": "TX-212328882424",
    "transactionResponseCode": "00",
    "transactionResponseMessage": {
      "en": "Approved"
    }
  },
  "messages": {
    "en": "Approved"
  },
  "status": "SUCCESS",
  "showCaptcha": false
}
```

### Key response fields [#key-response-fields]

| Parameter                                   | Description                                  |
| ------------------------------------------- | -------------------------------------------- |
| response.result                             | Result of the operation ('SUCCESS' or error) |
| response.paymentMethod.basata.referenceCode | The generated Basata reference code          |
| response.paymentMethod.basata.expireAt      | Expiration time for the reference code       |
| response.transactionId                      | Unique transaction ID                        |
| response.order.systemOrderId                | System-generated order ID                    |

Authentication is done via the Kashier-Hash header. The hash is calculated using HMAC-SHA256 with your API key and a specific path format.

## Hash calculation [#hash-calculation]

```js
const path = `/?payment=${merchantId}.${order.reference}.${order.amount}.${order.currency}`;
const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, apikey).update(
  path,
);
const hash = hmac.finalize().toString(CryptoJS.enc.hex);
```

This is the standard payment hash — see [Request hashing](/docs/direct-api/hashing#hashing)
for the full recipe and the other signed-string forms.

## Using the Postman collection [#using-the-postman-collection]

### Prerequisites [#prerequisites]

- Postman application installed

- Your Kashier merchant ID

- Your Kashier API key

### Setup [#setup]

1. Import the provided Postman collection JSON file

2. Update the collection variables:

- merchantId: your merchant ID

- apikey: your API key

- The collection already includes pre-defined values for test-fep and live-fep

### Execution [#execution]

1. Select the "Generate Basata Code" request

2. The pre-request script will automatically:

- Generate a unique order reference

- Create the request body

- Calculate the authentication hash

3. Send the request to generate a Basata code

### Variables [#variables]

| Variable       | Description                                     |
| -------------- | ----------------------------------------------- |
| test-fep       | Test environment base URL                       |
| live-fep       | Production environment base URL                 |
| merchantId     | Your merchant ID                                |
| apikey         | Your API key                                    |
| hash           | Calculated authentication hash (auto-generated) |
| paymentRequest | JSON request body (auto-generated)              |

## Error handling [#error-handling]

The API may return error responses with appropriate HTTP status codes and error messages. Common error scenarios include:

- Invalid authentication (incorrect hash)

- Missing required parameters

- Invalid parameter values

- System errors

Error responses will include a status field with a value other than "SUCCESS" and detailed error messages.

## Aman: installment at kiosk [#aman-installment-at-kiosk]

Aman is an installment-at-kiosk method: instead of a static reference code, the customer completes an OTP-verified installment purchase through Aman. Use `paymentMethod.type: "aman"` for the order's payment method, the same way you'd use `basata` or `cash`.

An Aman payment progresses through five steps, each a separate `apiOperation` against the order:

| Step              | `apiOperation`      | What happens                                                |
| ----------------- | ------------------- | ----------------------------------------------------------- |
| Initiate purchase | `initiate_purchase` | Starts the Aman flow for the order.                         |
| Send OTP          | `send_otp`          | Aman sends a one-time password to the customer.             |
| Pay               | `pay`               | The customer's OTP is submitted and the purchase completes. |
| Reconcile         | `reconcile`         | Kashier confirms the transaction status with Aman.          |
| Refund            | `refund`            | Reverses a completed Aman transaction.                      |

Aman's purchase result is keyed on Aman's own numeric result code: `ResultID === 0` means success, and any other value is a failure. The `transactionResponseCode` returned to you mirrors that `ResultID` (or a fallback default code) rather than the standard `00`/`k_*` dictionary used by card and Basata payments.

After a successful pay or reconcile, the order's payment-method data is enriched with the installment details Aman returns:

| Field                  | Meaning                            |
| ---------------------- | ---------------------------------- |
| `transactionId`        | Aman's transaction reference       |
| `cardNumber`           | Card used for the installment      |
| `firstInstallmentDate` | Date of the first installment      |
| `lastInstallmentDate`  | Date of the last installment       |
| `adminFees`            | Administrative fee charged by Aman |

As with Basata, treat the completion webhook (`event: pay`, `status: SUCCESS`) as the authoritative "customer has paid" signal, not any intermediate response.

## Cash: mark-as-paid (synthetic) [#cash-mark-as-paid-synthetic]

`paymentMethod.type: "cash"` — generic Cash — is not a reference-code rail like Basata, and it makes no external call to any provider. It's an internal bookkeeping operation: submitting a `pay` request with `paymentMethod.type: "cash"` debits your merchant balance and immediately writes a transaction with a hard-coded `transactionResponseCode: "00"` / `"Approved"` response.

<Callout title="Not a real-time authorization">
  Cash's SUCCESS response is synthetic — Kashier does not contact any external processor to authorize it. Unlike Basata, Aman, or a card payment, there is no real settlement-risk signal here: a Cash payment request always returns success. Use it only to record a payment you already collected through some other channel — not as a way to accept a real-time cash payment.
</Callout>

## Contact and other BNPL providers [#contact-and-other-bnpl-providers]

Contact (`paymentMethod.type: "contact"`) is not a cash/kiosk method despite the superficial similarity — in Kashier it's a BNPL/installment provider with its own multi-step flow (categories, balance validation, tenure selection, OTP, pay, refund). See [Installment plans → BNPL providers](/docs/direct-api/installment-plans#bnpl-installment-providers) for Contact alongside Octo, Souhoola, Mogo, Tru, and Forsa.

# Pay with token (/docs/direct-api/pay-with-token)

To create new payment requests using the card token.

## Step 1: Generate hash [#step-1-generate-hash]

The order hash is generated as explained in [Request hashing](/docs/direct-api/hashing#hashing). Append `.{customerReference}` to the signed string — it is required whenever `card.save`, `card.cardToken`, or `card.agreement` is present, and omitting it returns `403 INVALID_HASH_CHECK`.

## Step 2: Pay [#step-2-pay]

| Endpoint | Value                                    |
| -------- | ---------------------------------------- |
| URL      | `https://test-fep.kashier.io/v3/orders/` |
| Method   | POST                                     |

Whenever you are ready for production, use the following production API endpoint URL instead.

| Endpoint | Value                               |
| -------- | ----------------------------------- |
| URL      | `https://fep.kashier.io/v3/orders/` |
| Method   | POST                                |

```bash
curl -X 'POST' 'https://test-fep.kashier.io/v3/orders/' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H 'Kashier-Hash: your_generated_hash' \
  -d '{
  "apiOperation": "PAY",
  "paymentMethod": {
      "type": "CARD",
      "card": {
          "cardToken": "",
          "securityCode": ""
      }
  },
  "installments": {
      "planId": ""
  },
  "connectedAccount": {
      "merchantId": ""
  },
  "order": {
      "reference": "",
      "amount": "1",
      "currency": "EGP",
      "description": ""
  },
  "customer": {
      "reference": ""
  },
  "interactionSource": "ECOMMERCE",
  "reconciliation": {
      "webhookUrl": "",
      "merchantRedirect": "",
      "redirect": true
  },
  "metaData": {},
  "merchantId": "MID-12-34"
}'
```

## Body structure [#body-structure]

```json
{
  "apiOperation": "PAY",
  "paymentMethod": {
    "type": "CARD",
    "card": {
      "cardToken": "123456789123456789",
      "securityCode": "",
      "enable3DS": true
    }
  },
  "installments": {
    "planId": ""
  },
  "origin": {
    "id": ""
  },
  "connectedAccount": {
    "merchantId": ""
  },
  "order": {
    "reference": "",
    "amount": "1",
    "currency": "EGP",
    "description": ""
  },
  "customer": {
    "reference": ""
  },
  "interactionSource": "ECOMMERCE",
  "reconciliation": {
    "webhookUrl": "",
    "merchantRedirect": "",
    "redirect": true
  },
  "metaData": {},
  "merchantId": ""
}
```

## Body parameters [#body-parameters]

| Parameter                         | Required    | Description                                                                                                                              |
| --------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `apiOperation`                    | Yes         | `PAY` — a confirmation purchase against the saved token.                                                                                 |
| `paymentMethod.type`              | Yes         | `CARD`.                                                                                                                                  |
| `paymentMethod.card.cardToken`    | Yes         | The saved card token, used instead of `paymentMethod.card.number`.                                                                       |
| `paymentMethod.card.securityCode` | Conditional | The CVV. Mandatory when `interactionSource` is `ECOMMERCE`.                                                                              |
| `paymentMethod.card.enable3DS`    | No          | Whether to run 3D Secure. Note it belongs inside `card`, not directly under `paymentMethod`.                                             |
| `installments.planId`             | No          | Send only when paying with an [installment plan](/docs/direct-api/installment-plans). Omit `installments` entirely for a regular charge. |
| `origin.id`                       | No          | Origin identifier. Required only when you send an `origin` object.                                                                       |
| `connectedAccount.merchantId`     | No          | The Sub Merchant / [connected account](/docs/accept-payments/connected-accounts) MID (`MID-…`) to charge on behalf of.                   |
| `order.reference`                 | Yes         | Your merchant order ID.                                                                                                                  |
| `order.amount`                    | Yes         | Order amount.                                                                                                                            |
| `order.currency`                  | Yes         | `EGP`, `USD`, `GBP`, or `EUR`.                                                                                                           |
| `order.description`               | No          | Order description.                                                                                                                       |
| `customer.reference`              | Yes         | Shopper reference. Mandatory for any token payment — and it must also be appended to the signed hash string.                             |
| `interactionSource`               | Yes         | Must be `ECOMMERCE`, `MOTO`, or `RECURRING` for direct card pay. Use `RECURRING` for merchant-initiated repeat charges.                  |
| `reconciliation.webhookUrl`       | No          | Per-request server webhook URL.                                                                                                          |
| `reconciliation.merchantRedirect` | No          | Where to send the customer afterwards (their receipt page).                                                                              |
| `reconciliation.redirect`         | No          | Redirect to `merchantRedirect` once the transaction completes.                                                                           |
| `metaData`                        | No          | Arbitrary data echoed back in responses and webhooks.                                                                                    |
| `merchantId`                      | Yes         | Your merchant ID (`MID-…`).                                                                                                              |

## Headers [#headers]

| Key                   | Description                                                                  |
| --------------------- | ---------------------------------------------------------------------------- |
| Kashier-Hash (String) | Order hash [generated in Request hashing](/docs/direct-api/hashing#hashing). |

Full parameter and response reference → [Pay with token](/docs/api-reference/tokens/payWithToken).

## Responses [#responses]

With `interactionSource` MOTO (non-3DS), the payment is processed and captured directly.

With Ecommerce and 3DS, after a successful response you should redirect to `authentication.redirectUrl` to generate the 3DS page. As soon as the transaction has completed, it will redirect to `merchantRedirectUrl` if `reconciliation.redirect` was equal to true; otherwise [use 3D Secure handling](/docs/direct-api/3d-secure).

You can receive the transaction response after 3DS processing in the [webhook](/docs/webhooks/payloads).

# Retrieve tokens (/docs/direct-api/retrieve-tokens)

A GET request is made to the "get customer card token and info" endpoint.

## Hashing [#hashing]

Token requests are validated with a `Kashier-Hash` header: an HMAC SHA256 of the
tokenization path, keyed with your **Payment API Key**. Generate it in your backend.

<Callout type="warn" title="Key the hash with the Payment API Key, not the Secret Key">
  The Secret Key goes in the `Authorization` header; the **Payment API Key** keys the
  hash. Swapping them is the usual cause of `400 invalid authorization` on this endpoint.
  Both are mode-scoped — a test key only validates on the `test-` hosts.
</Callout>

```js
//Copy and paste this code in your Backend
let crypto = require("crypto");
function generateKashierTokenHash() {
  const mid = "MID-123-123"; //your merchant id
  const CustomerReference = "1"; //your customer id the card was saved against
  const apiKey = "yourPaymentApiKey";
  const path = `/?tokenization=${mid}.${CustomerReference}`;
  return crypto.createHmac("sha256", apiKey).update(path).digest("hex");
}
```

```php
//Copy and paste this code in your Backend
function generateKashierTokenHash(){
    $mid = "MID-123-123"; //your merchant id
    $apiKey = "yourPaymentApiKey";
    $CustomerReference = "100"; //your customer id the card was saved against
    $path = "/?tokenization=".$mid.".".$CustomerReference;
    return hash_hmac('sha256', $path, $apiKey, false);
}
```

```python
#Copy and paste this code in your Backend
import hmac
import hashlib
def generate_kashier_token_hash():
    mid = "MID-123-123"  # your merchant id
    CustomerReference = "100"  # your customer id the card was saved against
    path = '/?tokenization={}.{}'.format(mid, CustomerReference).encode('utf-8')
    api_key = "yourPaymentApiKey".encode('utf-8')
    return hmac.new(api_key, path, hashlib.sha256).hexdigest()
```

```csharp
//Copy and paste this code in your Backend
using System.Security.Cryptography;
public class Kashier
{
    public static string create_hash(){
        string mid = "MID-123-123"; //your merchant id
        string CustomerReference = "1"; //your customer Id
        string secret = "yourPaymentApiKey";
        string path = "/?tokenization=" + mid + "." + CustomerReference;
        string message;
        string key;
        key = secret;
        message = path;
        System.Text.ASCIIEncoding encoding = new System.Text.ASCIIEncoding();
        byte[] keyByte = encoding.GetBytes(key);
        byte[] messageBytes = encoding.GetBytes(message);
        HMACSHA256 hmacmd256 = new HMACSHA256(keyByte);
        byte[] hashmessage = hmacmd256.ComputeHash(messageBytes);
        return ByteToString(hashmessage).ToLower();
    }
    public static string ByteToString(byte[] buff){
        string sbinary = "";
        for (int i = 0; i < buff.Length; i++){
            sbinary += buff[i].ToString("X2"); // hex format
        }
        return (sbinary);
    }
}
```

<Callout title="Note">
  For creating the hash, use only the parameters mentioned in the snippet above. Don't add extra parameters in the hash creation.
</Callout>

## Retrieve tokens [#retrieve-tokens]

In case you are still in the development phase, you will need to call our API using the following testing endpoint API URL.

| Endpoint | Value                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| TEST-URL | `https://test-fep.kashier.io/v3/cards/customer?customerReference=yourcustomerReference&merchantId=merchantId` |
| LIVE-URL | `https://fep.kashier.io/v3/cards/customer?customerReference=yourcustomerReference&merchantId=merchantId`      |
| Method   | GET                                                                                                           |

## Headers [#headers]

| Key                   | Description                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Authorization         | Your Secret Key.                                                                                                            |
| Kashier-Hash (String) | HMAC SHA256 of `/?tokenization={mid}.{customerReference}`, keyed with your Payment API Key — see [Hashing](#hashing) above. |

```bash
curl -X 'GET' 'https://test-fep.kashier.io/v3/cards/customer?customerReference=yourcustomerReference&merchantId=merchantId' \
  -H 'Authorization: your_secretKey' \
  -H 'Kashier-Hash: your_generated_hash' \
  -H 'accept: application/json'
```

A customer with no saved card returns `400` with `There are no cards with this token` —
that is an empty result, not an authentication failure.

Full parameter and response reference → [Retrieve tokens](/docs/api-reference/tokens/retrieveTokens).

# Wallet payments (/docs/direct-api/wallet-payments)

Charge a customer's mobile wallet in two calls: initiate the wallet payment, then reconcile its status.

## Initiate wallet payment [#initiate-wallet-payment]

| Endpoint | Value                                    |
| -------- | ---------------------------------------- |
| TEST     | `https://test-fep.kashier.io/v3/orders/` |
| Method   | POST                                     |
| LIVE     | `https://fep.kashier.io/v3/orders/`      |
| Method   | POST                                     |

### Headers [#headers]

| Key          | Value                                                                              |
| ------------ | ---------------------------------------------------------------------------------- |
| Kashier-Hash | Hash generated as explained in [Request hashing](/docs/direct-api/hashing#hashing) |
| Content-Type | application/json                                                                   |

### Request body [#request-body]

```json
{
  "apiOperation": "INITIATE_R2P",
  "paymentMethod": {
    "type": "wallet"
  },
  "order": {
    "reference": "PM-{timestamp}",
    "amount": 100,
    "currency": "EGP"
  },
  "customer": {
    "mobilePhone": "01001001001"
  },
  "interactionSource": "ECOMMERCE",
  "reconciliation": {
    "webhookUrl": "http://your-webhook-url"
  },
  "merchantId": "{your_merchant_id}"
}
```

### Body description [#body-description]

| Key                  | Type   | Description                                                | Required |
| -------------------- | ------ | ---------------------------------------------------------- | -------- |
| apiOperation         | String | Must be "INITIATE\_R2P"                                    | true     |
| order.reference      | String | Unique order reference (prefixed with 'PM-' and timestamp) | true     |
| order.amount         | Number | Payment amount                                             | true     |
| order.currency       | String | Currency code (e.g., "EGP")                                | true     |
| customer.mobilePhone | String | Customer's wallet mobile number                            | true     |
| webhookUrl           | String | URL to receive payment notifications                       | true     |
| merchantId           | String | Your merchant identifier                                   | true     |

### Success response [#success-response]

```json
{
  "response": {
    "apiOperation": "INITIATE_R2P",
    "operation": "initiate_r2p",
    "result": "SUCCESS",
    "status": "SUCCESS",
    "order": {
      "systemOrderId": "19b76ede-8236-4dec-a2d5-80a373508188",
      "reference": "PM-1711283427747"
    },
    "transactionId": "TX-21232888547",
    "transactionResponseMessage": {
      "en": "Request to pay message send successfully.",
      "ar": ""
    }
  },
  "status": "SUCCESS"
}
```

### Response description [#response-description]

| Key           | Type   | Description                                              |
| ------------- | ------ | -------------------------------------------------------- |
| systemOrderId | String | Unique identifier for the order, used for reconciliation |
| reference     | String | Your original order reference                            |
| transactionId | String | Unique transaction identifier                            |
| status        | String | Transaction status ("SUCCESS", "FAILED", etc.)           |

<Callout type="warn" title="Code k_5 is terminal">
  If the response code is `k_5` — "the mobile number is not registered on any provider" — the number cannot be charged. Treat `k_5` as terminal, not transient. Kashier also skips scheduling its automatic reconciliation for that order, so it never self-resolves: do not keep polling it, and ask the customer for a wallet number registered with a provider.
</Callout>

## Payment reconciliation [#payment-reconciliation]

| Endpoint | Value                                                                      |
| -------- | -------------------------------------------------------------------------- |
| TEST     | `https://test-fep.kashier.io/v3/orders/:merchantOrderId or :systemOrderId` |
| LIVE     | `https://fep.kashier.io/v3/orders/:merchantOrderId or :systemOrderId`      |
| Method   | PUT                                                                        |

### Headers [#headers-1]

| Key          | Value            |
| ------------ | ---------------- |
| Accept       | application/json |
| Content-Type | application/json |

### Request body [#request-body-1]

```json
{
  "apiOperation": "RECONCILE_WALLET",
  "paymentMethod": {
    "type": "wallet"
  },
  "merchantId": "{your_merchant_id}"
}
```

### Body description [#body-description-1]

| Key                | Type   | Description                 |
| ------------------ | ------ | --------------------------- |
| apiOperation       | String | Must be "RECONCILE\_WALLET" |
| paymentMethod.type | String | Must be "wallet"            |
| merchantId         | String | Your merchant identifier    |

The order to reconcile is identified by the **path**, not the body: put the
`systemOrderId` returned by the initiate request (or your own `merchantOrderId`) in
place of `:merchantOrderId or :systemOrderId` in the URL above.

### Success response [#success-response-1]

```json
{
  "response": {
    "apiOperation": "RECONCILE_WALLET",
    "result": "SUCCESS",
    "status": "SUCCESS",
    "paymentMethod": {
      "wallet": {
        "paidThrough": "Tahweel",
        "payScheme": "TestSchema",
        "payerName": "Test Account",
        "payerAccount": "01001001001"
      }
    },
    "amount": 100,
    "totalCapturedAmount": 100,
    "totalAuthorizedAmount": 100,
    "transactionResponseMessage": {
      "en": "Approved",
      "ar": "   "
    }
  },
  "status": "SUCCESS"
}
```

### Response description [#response-description-1]

| Key                   | Type   | Description             |
| --------------------- | ------ | ----------------------- |
| status                | String | Payment status          |
| paidThrough           | String | Wallet provider name    |
| payerName             | String | Customer name           |
| payerAccount          | String | Customer wallet number  |
| totalCapturedAmount   | Number | Total amount captured   |
| totalAuthorizedAmount | Number | Total amount authorized |

### Reconcile outcomes [#reconcile-outcomes]

A reconcile does not always come back `SUCCESS`. Branch on the returned `status`.

| Status    | HTTP | What to do                                                                                                 |
| --------- | ---- | ---------------------------------------------------------------------------------------------------------- |
| `SUCCESS` | 200  | The customer approved. The order moves to `CAPTURED`, settlement runs and the webhook fires. Stop polling. |
| `PENDING` | 200  | The customer has not acted on the request yet. This is normal, not an error — keep polling.                |
| `FAILURE` | 400  | Declined or timed out. Stop polling and start a new payment if the customer wants to retry.                |

<Callout title="Note">
  If a pay transaction already exists for the order, reconcile returns the stored result instead of calling the provider again.
</Callout>

## Error handling [#error-handling]

| Code | Description           |
| ---- | --------------------- |
| 200  | Success               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 500  | Internal Server Error |

## Webhook notification [#webhook-notification]

When a payment is completed, a webhook notification is sent to the specified webhookUrl with the payment status and details. Ensure your webhook endpoint is configured to handle these notifications securely.

## Best practices [#best-practices]

1. Always store the systemOrderId returned from the initiate request

2. Implement proper error handling and retries

3. Validate webhook notifications using signature verification

4. Use appropriate timeouts for reconciliation requests

5. Implement idempotency for payment requests

## Security considerations [#security-considerations]

1. Never expose your API key in client-side code

2. Always validate webhook signatures

3. Use HTTPS for all API calls

4. Implement request timeout handling

5. Store sensitive payment data securely

# Beneficiaries (/docs/payouts/beneficiaries)

A **beneficiary** is a saved payout recipient: a name, optional contact details, and one payment method with its credentials. Save a recipient once, then pay them again without resending their bank account, wallet number, or card.

There are three ways to create one — through the beneficiaries API below, in bulk from a spreadsheet, or automatically while you create a transfer by setting `saveBeneficiary: true`.

<Callout title="Two hosts are involved">
  Beneficiaries are managed on `api.kashier.io` (`test-api` in test), the same host as the rest of the dashboard API. Transfers are created on `fep.kashier.io` (`test-fep` in test). Each endpoint below states its own host — see [Hosts](/docs/payouts#hosts) for why payouts span both.
</Callout>

Beneficiaries share a store with [Customers](/docs/accept-payments/customers), which is why these routes are `/v2/parties` and why `type=beneficiary` is required on every call. It is also why a list response names its array `customers` and its total `totalCustomers`.

## Beneficiary object structure [#beneficiary-object-structure]

```json
{
  "_id": "67ba0311bf4f31001203c6c2",
  "id": "67ba0311bf4f31001203c6c2",
  "type": "beneficiary",
  "name": "John Doe",
  "phoneNumber": "01555539512",
  "countryCode": "+20",
  "emailAddress": "",
  "preferredCommunicationChannel": "sms",
  "customerId": "B-1740243729820",
  "merchantId": "MID-XXXXX-XXX",
  "transferMethod": "bank",
  "credentials": {
    "bank": {
      "recipientFullName": "John Doe",
      "bank": "CIB",
      "accountNumber": "010001000"
    }
  },
  "labels": ["vip"],
  "customFields": [
    {
      "name": "custom-key-1",
      "value": "custom-value-1"
    }
  ],
  "createdByUserId": "612cdca034b3a9001f38879d",
  "createdAt": "2025-02-22T17:02:10.098Z",
  "updatedAt": "2025-02-25T12:31:40.474Z"
}
```

`customerId` is Kashier's own identifier for the beneficiary and always starts with `B-`. The `_id` is what you pass as a path parameter and as `partyId` on a transfer.

<Callout title="The method field is named differently on the way in and on the way out">
  You **send** `method.type` and `method.credentials`. You **receive** `transferMethod`, plus the credentials nested under that same name inside `credentials`. Only the sub-document for that one method is ever present.
</Callout>

## Payment methods [#payment-methods]

`method.type` decides which fields `method.credentials` must carry. A credentials object that does not match its type is rejected.

| `method.type`      | Required credentials                         |
| ------------------ | -------------------------------------------- |
| `bank`             | `recipientFullName`, `bank`, `accountNumber` |
| `wallet`           | `recipientFullName`, `walletNumber`          |
| `instant wallet`   | `recipientFullName`, `walletNumber`          |
| `card`             | `cardholderName`, `cardNumber`, `bank`       |
| `octo card`        | `recipientFullName`, `octoCardId`            |
| `internal account` | `recipientFullName`, `kashierAccountId`      |

### Validation rules [#validation-rules]

| Rule            | Limit                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `accountNumber` | 7–34 characters                                                                                                  |
| `walletNumber`  | Egyptian mobile number matching `^(010\|011\|012\|015)\d{8}$`                                                    |
| `bank`          | Uppercased, then matched against Kashier's supported-bank list — see [Bank codes](/docs/payouts#bank-codes)      |
| `countryCode`   | Required whenever you send a `phoneNumber`                                                                       |
| `cardNumber`    | Tokenized on save. Only a masked number and an internal token are stored, and only the masked number is returned |

## List beneficiaries [#list-beneficiaries]

Retrieve your saved beneficiaries, paginated.

| Endpoint | Value                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------- |
| TEST URL | `https://test-api.kashier.io/v2/parties?type=beneficiary&page=1&limit=20&sortType=-1&sortBy=name` |
| LIVE URL | `https://api.kashier.io/v2/parties?type=beneficiary&page=1&limit=20&sortType=-1&sortBy=name`      |
| Method   | GET                                                                                               |

### Query parameters [#query-parameters]

| Key                     | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `type`                  | **Required.** Must be `beneficiary`.                        |
| `search`                | Search by name, phone number, or email address.             |
| `page`                  | Page number. Default `1`.                                   |
| `limit`                 | Records per page. Default `20`.                             |
| `sortBy`                | Sort field: `name` or `createdAt`. Default `createdAt`.     |
| `sortType`              | Sort order: `1` ascending, `-1` descending. Default `-1`.   |
| `startDate` / `endDate` | Only return beneficiaries created after / before this date. |
| `labels`                | Comma-separated label names.                                |
| `branchIds`             | Comma-separated branch IDs, for branch-scoped merchants.    |

```bash
curl --location 'https://test-api.kashier.io/v2/parties?type=beneficiary&page=1&limit=20&sortType=-1&sortBy=name' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt title="Try it — list beneficiaries" method="GET" url="https://test-api.kashier.io/v2/parties?type=beneficiary&page=1&limit=20&sortType=-1&sortBy=name" sendApiKey="false" />

### Headers [#headers]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response]

```json
{
  "body": {
    "customers": [
      {
        "_id": "67ba0311bf4f31001203c6c2",
        "type": "beneficiary",
        "name": "John Doe",
        "phoneNumber": "01555539512",
        "countryCode": "+20",
        "emailAddress": "",
        "customerId": "B-1740243729820",
        "merchantId": "MID-XXXXX-XXX",
        "transferMethod": "bank",
        "credentials": {
          "bank": {
            "recipientFullName": "John Doe",
            "bank": "CIB",
            "accountNumber": "010001000"
          }
        },
        "labels": ["vip"],
        "createdByUserId": "612cdca034b3a9001f38879d",
        "createdAt": "2025-02-22T17:02:10.098Z",
        "updatedAt": "2025-02-25T12:31:40.474Z"
      }
    ],
    "totalCustomers": 42,
    "limit": 20,
    "totalPages": 3,
    "page": 1,
    "pagingCounter": 1,
    "hasPrevPage": false,
    "hasNextPage": true,
    "prevPage": null,
    "nextPage": 2
  },
  "message": "success"
}
```

Full parameter and response reference → [List beneficiaries](/docs/api-reference/beneficiaries/listBeneficiaries).

## Get beneficiary details [#get-beneficiary-details]

Retrieve one beneficiary by its `_id`.

| Endpoint | Value                                                         |
| -------- | ------------------------------------------------------------- |
| TEST URL | `https://test-api.kashier.io/v2/parties/:id?type=beneficiary` |
| LIVE URL | `https://api.kashier.io/v2/parties/:id?type=beneficiary`      |
| Method   | GET                                                           |

```bash
curl --location 'https://test-api.kashier.io/v2/parties/:id?type=beneficiary' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt title="Try it — beneficiary details" method="GET" url="https://test-api.kashier.io/v2/parties/:id?type=beneficiary" sendApiKey="false" />

### Headers [#headers-1]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

Full parameter and response reference → [Get beneficiary details](/docs/api-reference/beneficiaries/getBeneficiary).

## Add a beneficiary [#add-a-beneficiary]

Save a new beneficiary. Kashier assigns the `customerId`.

| Endpoint | Value                                    |
| -------- | ---------------------------------------- |
| TEST URL | `https://test-api.kashier.io/v2/parties` |
| LIVE URL | `https://api.kashier.io/v2/parties`      |
| Method   | POST                                     |

### Body parameters [#body-parameters]

| Key                             | Description                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `type`                          | **Required.** Must be `beneficiary`.                                                                  |
| `name`                          | The beneficiary's name.                                                                               |
| `method`                        | The payment method — `type` plus its matching `credentials`. See [Payment methods](#payment-methods). |
| `phoneNumber`                   | The beneficiary's phone number. Optional.                                                             |
| `countryCode`                   | Required when `phoneNumber` is set, for example `+20`.                                                |
| `emailAddress`                  | The beneficiary's email address. Optional.                                                            |
| `labels`                        | Array of label strings used to organize beneficiaries. Optional.                                      |
| `customFields`                  | Array of `{ "name": …, "value": … }` pairs. Optional.                                                 |
| `preferredCommunicationChannel` | `sms`, `email`, or `both`. Optional.                                                                  |
| `presetName`                    | Saves the `customFields` keys as a reusable preset under this name. Optional.                         |

```bash
curl --location 'https://test-api.kashier.io/v2/parties' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
      "type": "beneficiary",
      "name": "John Doe",
      "phoneNumber": "01555539512",
      "countryCode": "+20",
      "emailAddress": "john.doe@example.com",
      "method": {
          "type": "bank",
          "credentials": {
              "recipientFullName": "John Doe",
              "bank": "CIB",
              "accountNumber": "010001000"
          }
      },
      "labels": ["vip"],
      "preferredCommunicationChannel": "sms"
  }'
```

<ApiTryIt
  title="Try it — add a beneficiary"
  method="POST"
  url="https://test-api.kashier.io/v2/parties"
  body="{
  type: 'beneficiary',
  name: 'John Doe',
  phoneNumber: '01555539512',
  countryCode: '+20',
  emailAddress: 'john.doe@example.com',
  method: {
    type: 'bank',
    credentials: {
      recipientFullName: 'John Doe',
      bank: 'CIB',
      accountNumber: '010001000',
    },
  },
  labels: ['vip'],
  preferredCommunicationChannel: 'sms',
}"
  sendApiKey="false"
/>

### Headers [#headers-2]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-1]

```json
{
  "body": {
    "_id": "67bde55fd5a33d00120b202d",
    "type": "beneficiary",
    "name": "John Doe",
    "phoneNumber": "01555539512",
    "countryCode": "+20",
    "emailAddress": "john.doe@example.com",
    "customerId": "B-1740498271115",
    "merchantId": "MID-XXXXX-XXX",
    "transferMethod": "bank",
    "credentials": {
      "bank": {
        "recipientFullName": "John Doe",
        "bank": "CIB",
        "accountNumber": "010001000"
      }
    },
    "labels": ["vip"],
    "preferredCommunicationChannel": "sms",
    "createdByUserId": "67a0b85fbc8100100f70bde0",
    "createdAt": "2025-02-25T15:44:31.120Z",
    "updatedAt": "2025-02-25T15:44:31.120Z"
  },
  "message": "success"
}
```

Full parameter and response reference → [Add a beneficiary](/docs/api-reference/beneficiaries/createBeneficiary).

## Update a beneficiary [#update-a-beneficiary]

Update a saved beneficiary.

| Endpoint | Value                                        |
| -------- | -------------------------------------------- |
| TEST URL | `https://test-api.kashier.io/v2/parties/:id` |
| LIVE URL | `https://api.kashier.io/v2/parties/:id`      |
| Method   | PUT                                          |

<Callout title="type, name, and method are required on every update">
  Even when their values have not changed. An update that omits `method` is rejected rather than treated as a partial edit, so read the beneficiary first and send its method back if you are only changing a label.
</Callout>

```bash
curl --location --request PUT 'https://test-api.kashier.io/v2/parties/:id' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
      "type": "beneficiary",
      "name": "John Doe",
      "phoneNumber": "01555539512",
      "countryCode": "+20",
      "emailAddress": "john.doe@example.com",
      "method": {
          "type": "bank",
          "credentials": {
              "recipientFullName": "John Doe",
              "bank": "CIB",
              "accountNumber": "010001000"
          }
      },
      "labels": ["vip"]
  }'
```

<ApiTryIt
  title="Try it — update a beneficiary"
  method="PUT"
  url="https://test-api.kashier.io/v2/parties/:id"
  body="{
  type: 'beneficiary',
  name: 'John Doe',
  phoneNumber: '01555539512',
  countryCode: '+20',
  emailAddress: 'john.doe@example.com',
  method: {
    type: 'bank',
    credentials: {
      recipientFullName: 'John Doe',
      bank: 'CIB',
      accountNumber: '010001000',
    },
  },
  labels: ['vip'],
}"
  sendApiKey="false"
/>

### Headers [#headers-3]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-2]

This route nests its payload one level deeper than the others — the updated record is at `body.body`.

```json
{
  "body": {
    "message": "Customer updated successfully",
    "body": {
      "_id": "67ba05fd87c9970012389429",
      "type": "beneficiary",
      "name": "John Doe",
      "customerId": "B-1740244477202",
      "merchantId": "MID-XXXXX-XXX",
      "transferMethod": "bank",
      "credentials": {
        "bank": {
          "recipientFullName": "John Doe",
          "bank": "CIB",
          "accountNumber": "010001000"
        }
      },
      "labels": ["vip"],
      "updatedAt": "2025-02-26T09:55:34.630Z"
    }
  },
  "message": "success"
}
```

Full parameter and response reference → [Update a beneficiary](/docs/api-reference/beneficiaries/updateBeneficiary).

## Delete a beneficiary [#delete-a-beneficiary]

Delete a saved beneficiary. The response echoes back only the identifying fields of the record that was removed.

| Endpoint | Value                                                         |
| -------- | ------------------------------------------------------------- |
| TEST URL | `https://test-api.kashier.io/v2/parties/:id?type=beneficiary` |
| LIVE URL | `https://api.kashier.io/v2/parties/:id?type=beneficiary`      |
| Method   | DELETE                                                        |

```bash
curl --location --request DELETE 'https://test-api.kashier.io/v2/parties/:id?type=beneficiary' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt title="Try it — delete a beneficiary" method="DELETE" url="https://test-api.kashier.io/v2/parties/:id?type=beneficiary" sendApiKey="false" />

### Headers [#headers-4]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

Full parameter and response reference → [Delete a beneficiary](/docs/api-reference/beneficiaries/deleteBeneficiary).

## Save a beneficiary while creating a transfer [#save-a-beneficiary-while-creating-a-transfer]

Set `saveBeneficiary: true` on a [Create transfer](/docs/payouts#create-transfer) request to save the recipient as you pay them. Same endpoint, one extra flag — `recipientName` becomes the beneficiary's name.

| Endpoint | Value                                             |
| -------- | ------------------------------------------------- |
| TEST URL | `https://test-fep.kashier.io/v3/transfers/single` |
| LIVE URL | `https://fep.kashier.io/v3/transfers/single`      |
| Method   | POST                                              |

```bash
curl --location 'https://test-fep.kashier.io/v3/transfers/single' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
      "amount": 10,
      "method": "wallet",
      "recipientName": "John Doe",
      "recipientNumber": "01111111111",
      "saveBeneficiary": true
  }'
```

<ApiTryIt
  title="Try it — pay and save the recipient"
  method="POST"
  url="https://test-fep.kashier.io/v3/transfers/single"
  body="{
  amount: 10,
  method: 'wallet',
  recipientName: 'John Doe',
  recipientNumber: '01111111111',
  saveBeneficiary: true,
}"
  sendApiKey="false"
/>

The recipient number above is the sandbox number that forces a successful wallet transfer — see [Payouts sandbox testing](/docs/payouts/testing).

<Callout title="Saving is best-effort">
  The beneficiary is saved alongside the transfer, but a failure to save it never fails the transfer. If the method has no beneficiary equivalent, or beneficiary storage rejects the details, the payout still goes through and you simply get no saved record back.
</Callout>

## Pay a saved beneficiary [#pay-a-saved-beneficiary]

Send `partyId` on a transfer and Kashier resolves the saved recipient for you. There is no `beneficiaryId` field — `partyId` is it.

| Endpoint | Value                                             |
| -------- | ------------------------------------------------- |
| TEST URL | `https://test-fep.kashier.io/v3/transfers/single` |
| LIVE URL | `https://fep.kashier.io/v3/transfers/single`      |
| Method   | POST                                              |

`recipientName`, `recipientNumber`, `recipientBank`, and `cardToken` are all filled in from the saved record, so the request carries only the id, the amount, and the method.

```bash
curl --location 'https://test-fep.kashier.io/v3/transfers/single' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
      "amount": 10,
      "method": "bank",
      "partyId": "67ba0311bf4f31001203c6c2",
      "merchantTransferId": "TRF-YOUR-OWN-UNIQUE-ID"
  }'
```

<ApiTryIt
  title="Try it — pay a saved beneficiary"
  method="POST"
  url="https://test-fep.kashier.io/v3/transfers/single"
  body="{
  amount: 10,
  method: 'bank',
  partyId: ':partyId',
}"
  sendApiKey="false"
/>

Paste the `_id` of one of your own beneficiaries into the panel — [List beneficiaries](#list-beneficiaries) above returns it.

| Error                   | Cause                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `PARTY_NOT_FOUND`       | No beneficiary with that id on your account, or it has been deleted.                                                           |
| `PARTY_METHOD_MISMATCH` | The `method` you sent disagrees with the beneficiary's saved `transferMethod`. Send the method the beneficiary was saved with. |

<Callout title="A beneficiary you just created may not be payable yet">
  Payouts resolve `partyId` against their own copy of your beneficiaries, which is updated asynchronously. A record created moments ago can briefly return `PARTY_NOT_FOUND`. If you need to pay a recipient the instant you save them, use [`saveBeneficiary`](#save-a-beneficiary-while-creating-a-transfer) on the transfer itself — one call that pays and saves, with no id to wait for.
</Callout>

### Or send the details yourself [#or-send-the-details-yourself]

If you would rather build the transfer body from the saved record, read it with [Get beneficiary details](#get-beneficiary-details) and map the credentials onto the transfer's recipient fields.

| `transferMethod`            | `recipientName`                                     | `recipientBank`         | `recipientNumber`                                  |
| --------------------------- | --------------------------------------------------- | ----------------------- | -------------------------------------------------- |
| `bank`                      | `credentials.bank.recipientFullName`                | `credentials.bank.bank` | `credentials.bank.accountNumber`                   |
| `wallet` / `instant wallet` | `credentials[method].recipientFullName`             | —                       | `credentials[method].walletNumber`                 |
| `octo card`                 | `credentials['octo card'].recipientFullName`        | —                       | `credentials['octo card'].octoCardId`              |
| `internal account`          | `credentials['internal account'].recipientFullName` | —                       | `credentials['internal account'].kashierAccountId` |

<Callout title="Cards cannot be mapped this way" type="warn">
  A saved card returns only a masked number, never the card itself, so there is nothing to copy into `recipientNumber`. Pay a saved card beneficiary with `partyId` instead — the stored token travels with the record and never has to pass through your systems.
</Callout>

## Bulk import [#bulk-import]

Importing beneficiaries from a spreadsheet takes two calls: one to upload and validate, one to commit. Nothing is saved until the second call, which is what lets you correct a sheet before it reaches your account.

### Sheet columns [#sheet-columns]

| Column                            |                     |
| --------------------------------- | ------------------- |
| `Beneficiary name`                | `Country Code`      |
| `Phone number`                    | `Email`             |
| `Preferred communication channel` | `Transfer method`   |
| `Recipient/Cardholder name`       | `Bank`              |
| `Account number`                  | `Wallet number`     |
| `Card number`                     | `Octo card ID`      |
| `Kashier account ID`              | `Card number token` |

`Transfer method` takes a human label: `Bank`, `Wallet`, `Instant Wallet`, `Card`, `Octo Card`, or `Internal Account`. For each row, fill in only the credential columns that match that row's method and leave the rest blank.

### Upload and validate [#upload-and-validate]

| Endpoint | Value                                                            |
| -------- | ---------------------------------------------------------------- |
| TEST URL | `https://test-api.kashier.io/v2/parties/import?type=beneficiary` |
| LIVE URL | `https://api.kashier.io/v2/parties/import?type=beneficiary`      |
| Method   | POST                                                             |

The upload is an **XLSX** file sent as multipart form data under the field name `file`.

```bash
curl --location --request POST 'https://test-api.kashier.io/v2/parties/import?type=beneficiary' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --form 'file=@"beneficiaries.xlsx"'
```

Every row comes back with an `errors` field: `null` when the row is valid, or an object of `field: reason` pairs when it is not. If at least one row passed, the response also carries a `correlationId` — your handle on the validated batch.

```json
{
  "beneficiaries": [
    {
      "name": "John Doe",
      "phoneNumber": "1555539512",
      "countryCode": "+20",
      "preferredCommunicationChannel": "sms",
      "method": {
        "type": "bank",
        "credentials": {
          "recipientFullName": "John Doe",
          "bank": "CIB",
          "accountNumber": "010001000"
        }
      },
      "labels": ["vip"],
      "errors": null
    },
    {
      "name": "Jane Doe",
      "phoneNumber": "1509876543",
      "countryCode": "+20",
      "method": {
        "type": "wallet",
        "credentials": {}
      },
      "errors": {
        "walletNumber": "is required"
      }
    }
  ],
  "correlationId": "48701e20-ffa2-4c33-be5e-fef3dbfaf94a",
  "message": "Some beneficiaries were ignored because they are invalid"
}
```

Full parameter and response reference → [Upload a beneficiaries sheet for review](/docs/api-reference/beneficiaries/importBeneficiaries).

### Save the imported beneficiaries [#save-the-imported-beneficiaries]

| Endpoint | Value                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------- |
| TEST URL | `https://test-api.kashier.io/v2/parties/save-parties?correlationId=:correlationId&type=beneficiary` |
| LIVE URL | `https://api.kashier.io/v2/parties/save-parties?correlationId=:correlationId&type=beneficiary`      |
| Method   | GET                                                                                                 |

Rows that failed validation in the upload step are not saved.

```bash
curl --location 'https://test-api.kashier.io/v2/parties/save-parties?correlationId={{correlationId}}&type=beneficiary' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt title="Try it — save imported beneficiaries" method="GET" url="https://test-api.kashier.io/v2/parties/save-parties?correlationId=:correlationId&type=beneficiary" sendApiKey="false" />

### Headers [#headers-5]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is the secret key that is used to identify the merchant. You can obtain it from Kashier dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

Full parameter and response reference → [Save the uploaded beneficiaries](/docs/api-reference/beneficiaries/saveImportedBeneficiaries).

## Permissions [#permissions]

Beneficiary endpoints are permissioned separately from the rest of the dashboard API. A user calling them needs the matching action on their role:

| Action               | Grants                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| `view_beneficiary`   | List and read. Scoped to `own` or `any` — an `own`-scoped user sees only the beneficiaries they created. |
| `create_beneficiary` | Add a beneficiary, and bulk import.                                                                      |
| `edit_beneficiary`   | Update a beneficiary.                                                                                    |
| `delete_beneficiary` | Delete a beneficiary.                                                                                    |

# Payouts (/docs/payouts)

Send funds from your Kashier balance to bank accounts, cards, and mobile wallets through the Payouts API. Use it to pay vendors, suppliers, employees, or customers programmatically.

Paying the same people repeatedly? Save them once as [beneficiaries](/docs/payouts/beneficiaries) and pay by id instead of resending their details on every transfer.

## Hosts [#hosts]

Payouts span two hosts, and both are valid:

| Host                                  | Used for                                                                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `api.kashier.io` (`test-api` in test) | Reads, lookups, and fee inquiry — account info, listing transfers, transfer details, batch tracking, schedulers, fee inquiry |
| `fep.kashier.io` (`test-fep` in test) | Transfer writes — create transfer, bulk transfer                                                                             |

Each endpoint below states its own host. Use the host shown for that endpoint
rather than assuming one base URL for the whole domain.

Looking for account management or the balance ledger instead? See [Accounts and balance](/docs/account-and-balance) — that's also where [Get account info](/docs/account-and-balance/accounts#get-account-info) (`GET /v2/account`) now lives, alongside the rest of the account read/write endpoints.

## List all transfers [#list-all-transfers]

To list all the transfers, you need to make a GET request to the list all transfers API.

| Endpoint | Value                                                                 |
| -------- | --------------------------------------------------------------------- |
| LIVE URL | `https://api.kashier.io/v2/transfers?limit=5&page=1&sortType=-1`      |
| Method   | GET                                                                   |
| TEST URL | `https://test-api.kashier.io/v2/transfers?limit=5&page=1&sortType=-1` |
| Method   | GET                                                                   |

`limit`, `page`, and `sortType` are optional pagination controls — `page` is 1-based and `sortType` is `-1` for newest first or `1` for oldest first.

### Headers [#headers]

| Key           | Description                                                                                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization | The authorization is a secret key used to identify the merchant. You can obtain this key from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl -X 'GET' 'https://test-api.kashier.io/v2/transfers?limit=5&page=1&sortType=-1'
    -H 'Authorization: your_secretKey'
    -H "accept: application/json"
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/transfers?limit=5&page=1&sortType=-1" sendApiKey="false" title="Try it — list all transfers" />

Full parameter and response reference → [List all transfers](/docs/api-reference/payouts/listTransfers).

## Get transfer details [#get-transfer-details]

To get transfer details, you need to make a GET request to the transfer details API, including the transfer ID as a parameter.

| Endpoint | Value                                                  |
| -------- | ------------------------------------------------------ |
| LIVE URL | `https://api.kashier.io/v2/transfers/:transferId`      |
| Method   | GET                                                    |
| TEST URL | `https://test-api.kashier.io/v2/transfers/:transferId` |
| Method   | GET                                                    |

### Headers [#headers-1]

| Key           | Description                                                                                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization | The authorization is a secret key used to identify the merchant. You can obtain this key from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl --location 'https://test-api.kashier.io/v2/transfers/{{transferId}}' \
--header 'Authorization: your_secretKey' \
--header 'Content-Type: application/json' \
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/transfers/:transferId" sendApiKey="false" title="Try it — get transfer details" />

Full parameter and response reference → [Get transfer details](/docs/api-reference/payouts/getTransferDetails).

## Fees inquiry [#fees-inquiry]

To inquire about the fees, you can make a POST request to the fees inquiry API.

| Endpoint | Value                                                  |
| -------- | ------------------------------------------------------ |
| LIVE URL | `https://api.kashier.io/v2/transfers/fee-inquiry`      |
| Method   | POST                                                   |
| TEST URL | `https://test-api.kashier.io/v2/transfers/fee-inquiry` |
| Method   | POST                                                   |

### Headers [#headers-2]

| Key           | Description                                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization | The Authorization is a secret key used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl -X 'POST' 'https://test-api.kashier.io/v2/transfers/fee-inquiry' \
    -H 'Authorization: your_secretKey'
    -H "accept: application/json"
    --data '{
        "transfers": [
            {
                "amount": "100", // transfer amount that you want to inquire about its fees
                "method": "wallet" // use card, wallet, bank or instant wallet for different methods
           }
        ]
    }'
```

<ApiTryIt
  method="POST"
  url="https://test-api.kashier.io/v2/transfers/fee-inquiry"
  body="{
  transfers: [
    {
      amount: '100',
      method: 'wallet',
    },
  ],
}"
  sendApiKey="false"
  title="Try it — fee inquiry"
/>

Full parameter and response reference → [Fees inquiry](/docs/api-reference/payouts/feeInquiry).

## Transfer methods [#transfer-methods]

`method` is lowercased before validation, so send it in lower case.

| Method             | Required fields                             | Dedicated batch route     |
| ------------------ | ------------------------------------------- | ------------------------- |
| `bank`             | `recipientBank`                             | —                         |
| `wallet`           | Egyptian mobile number in `recipientNumber` | —                         |
| `instant wallet`   | Egyptian mobile number in `recipientNumber` | `/batch/instant-wallet`   |
| `card`             | `cardToken` and `recipientBank`             | —                         |
| `octo card`        | Octo Payout recipient                       | `/batch/octo-payout`      |
| `internal account` | Internal account-to-account recipient       | `/batch/internal-account` |

The dedicated batch routes hang off the same transfers path as [Bulk transfers](#bulk-transfers) and take an XLSX upload. `/batch/instant-wallet` and `/batch/octo-payout` accept the columns `Recipient Name`, `Recipient Number`, `Amount`, `Merchant Transfer Id`, and force the method for every row. A generic `/batch` file whose rows mix methods is stored with the batch method `mixed`.

## Validation rules [#validation-rules]

Requests that break these rules are rejected with a 400 before any money moves.

| Rule                                                | Limit                                                                                                                                                                                                                        |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Amount, minimum                                     | `0.01` for every method                                                                                                                                                                                                      |
| Amount, wallet maximum                              | `60000`                                                                                                                                                                                                                      |
| `recipientNumber` for `wallet` and `instant wallet` | Egyptian mobile number matching `^(010\|011\|012\|015)\d{8}$`                                                                                                                                                                |
| `recipientNumber` for `bank` and `card`             | Length only — 1–34 characters, the same bound that applies to every method. No format, checksum, or IBAN validation is applied, so a malformed account number is rejected by the receiving provider rather than by this API. |
| `recipientName`                                     | Trimmed, 3–70 characters                                                                                                                                                                                                     |
| Transfers per batch                                 | 1–1000                                                                                                                                                                                                                       |
| `recipientBank`                                     | Uppercased and matched against Kashier's supported-bank list — see [Bank codes](#bank-codes) for the downloadable list. Required for `bank` and `card`; ignored for every other method.                                      |
| `merchantTransferId`                                | Optional, but must be unique per merchant. Reusing one is rejected as a duplicate. Required if you want to receive the [transfer webhook](/docs/payouts/webhook#before-you-start).                                           |

## Bank codes [#bank-codes]

`recipientBank` takes a bank **abbreviation**, not a name or a SWIFT code. It is
uppercased before validation, and an abbreviation Kashier does not recognise is
rejected with a 400 before any money moves.

Download the full list here:

<Callout title="Bank abbreviations">
  [**Bank abbreviations (XLSX)**](/downloads/kashier-bank-abbreviations.xlsx) —
  every accepted `recipientBank` value with its bank name.
</Callout>

## Create transfer [#create-transfer]

To create a transfer, you need to make a POST request to the create transfer API.

| Endpoint | Value                                             |
| -------- | ------------------------------------------------- |
| LIVE URL | `https://fep.kashier.io/v3/transfers/single`      |
| Method   | POST                                              |
| TEST URL | `https://test-fep.kashier.io/v3/transfers/single` |
| Method   | POST                                              |

### Headers [#headers-3]

| Key           | Description                                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization | The Authorization is a secret key used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |
| kashier-hash  | Request signature. **Only required when the `transfers hashing` capability is enabled on your account** — see below.                                                               |

#### The `kashier-hash` request header [#the-kashier-hash-request-header]

Transfer creation can be signature-protected. When Kashier enables the `transfers hashing` capability on your merchant account, every create-transfer request must carry a `kashier-hash` header; a missing or mismatched hash is rejected with a `403`. When the capability is off, the header is ignored. If you get a `403` on create with valid keys, check whether transfer hashing is enabled on your account.

The value is the HMAC-SHA256 of the string below, hex-encoded, keyed by your **transfer API key** — the API key you create in the dashboard named `transfer` (see [Payouts webhook](/docs/payouts/webhook#before-you-start)). It is a different key from the payment API key used for [order hashing](/docs/direct-api/hashing):

```text
/?transfer={merchantId}.{method}.{recipientName}.{recipientNumber}.{amount}
```

If you send a `merchantTransferId`, append it as a sixth segment, and sign that variant instead:

```text
/?transfer={merchantId}.{method}.{recipientName}.{recipientNumber}.{amount}.{merchantTransferId}
```

The key must match the mode you are calling in — a test transfer API key for the test hosts, a live one for live.

```bash
curl -X 'POST' 'https://test-fep.kashier.io/v3/transfers/single'
    -H 'Authorization: your_secretKey'
    -H "accept: application/json"
    --data '{
        "amount": 10,
        "method": "wallet", // use card, wallet, bank or instant wallet for different methods
        "recipientName": "Jhon Doe",
        "merchantTransferId":"TRF-YOUR-OWN-UNIQUE-ID", // unique per merchant; required to receive the webhook
        "recipientNumber": "01555539512"
    }'
```

<Callout type="warn" title="Send merchantTransferId to receive webhooks">
  `merchantTransferId` is optional for the create call, but a transfer created without it never triggers a [transfer webhook](/docs/payouts/webhook). To receive webhooks you also need an API key named `transfer` in the same mode (test or live) and a registered webhook URL — see [Before you start](/docs/payouts/webhook#before-you-start). The value must be unique per merchant; reusing one is rejected as a duplicate, which is why the panel below leaves it out.
</Callout>

<ApiTryIt
  method="POST"
  url="https://test-fep.kashier.io/v3/transfers/single"
  body="{
  amount: 10,
  method: 'wallet',
  recipientName: 'Jhon Doe',
  recipientNumber: '01555539512',
}"
  sendApiKey="false"
  title="Try it — create transfer"
/>

The create call returns `status: "PENDING"` — the transfer is accepted, not sent. It then moves through `INITIATED` → `IN_TRANSIT` → `TRANSFERRED` or `FAILED` asynchronously, and the final provider result is never in this response. Track the outcome with [Get transfer details](#get-transfer-details) or the [payouts webhook](/docs/payouts/webhook).

| Status      | Meaning                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| PENDING     | Transfer created, balance not yet debited. Returned by the create call.                                       |
| INITIATED   | Balance debited; ready to send to the provider.                                                               |
| IN\_TRANSIT | Sent to the provider, awaiting confirmation.                                                                  |
| TRANSFERRED | Completed. Final unless `openForReturn` is `true` — see [openForReturn](/docs/payouts/webhook#openforreturn). |
| FAILED      | Failed at any stage. Balance is reversed.                                                                     |

### Optional fields [#optional-fields]

Three optional fields on this route are worth knowing about:

| Key               | Description                                                                                                                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accountId`       | The Kashier account to debit, in `ACC-` format. Omit it and the transfer is funded from your primary account. Use it when you hold [more than one account](/docs/account-and-balance/accounts).                                                         |
| `partyId`         | Pay a [saved beneficiary](/docs/payouts/beneficiaries#pay-a-saved-beneficiary) by id. Kashier fills in `recipientName`, `recipientNumber`, `recipientBank`, and `cardToken` from the saved record, so you send only the id, the amount, and the method. |
| `saveBeneficiary` | Save this recipient as a [beneficiary](/docs/payouts/beneficiaries#save-a-beneficiary-while-creating-a-transfer) while the transfer is created. Ignored on the bulk routes.                                                                             |

Full parameter and response reference → [Create transfer](/docs/api-reference/payouts/createTransfer).

## Bulk transfers [#bulk-transfers]

To create a bulk transfer, you need to make a POST request to the create bulk transfer API.

| Endpoint | Value                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------ |
| LIVE URL | `https://fep.kashier.io/v3/transfers/batch?merchantBatchId=:merchantBatchId&batchName=:batchName`      |
| Method   | POST                                                                                                   |
| TEST URL | `https://test-fep.kashier.io/v3/transfers/batch?merchantBatchId=:merchantBatchId&batchName=:batchName` |
| Method   | POST                                                                                                   |

### Headers [#headers-4]

| Key           | Description                                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization | The Authorization is a secret key used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

```bash
curl -X POST 'https://test-fep.kashier.io/v3/transfers/batch?merchantBatchId=:merchantBatchId&batchName=:batchName' \
    -H 'Authorization: your_secretKey' \
    -H "accept: application/json" \
    -F 'file=@/path/to/file.xlsx'
```

The upload is an **XLSX** file sent as multipart form data under the field name `file`. Its columns are `method`, `recipientName`, `recipientNumber`, `recipientBank`, `amount`, `cardToken`, and `merchantTransferId`; the per-row `method` decides the rail, and a file whose rows mix methods is stored with the batch method `mixed`.

Full parameter and response reference → [Bulk transfers](/docs/api-reference/payouts/createBulkTransfer).

# Instant Settlement (/docs/payouts/instant-settlement)

Instant Settlement lets you request an early payout of eligible, not-yet-settled transactions in exchange for a fee, ahead of their normal settlement window.

<Callout title="Feature must be enabled">
  Instant settlement is gated by the per-merchant `instant_settlement_request` feature flag, which is **off by default**. Only Kashier can enable it on your account — you can't toggle it yourself. Separately, each route requires an instant-settlement permission on the calling user's role — `instant_settlements.all.view_instant_settlement` for the reads on this page, `instant_settlements.all.create_instant_settlement` for the fee inquiry and for creating a request — so a valid key on a role without them is rejected even when the flag is on.

Both refusals come from the same gate and look alike: a `401 Unauthorized`, not a `404`. Every path on this page **is** live on `test-api.kashier.io` — if you get a `401` on a valid key, the flag or the permission is missing, not the endpoint. (A request with no `Authorization` header at all is answered with `403 {"message": "No auth token provided"}`.)
</Callout>

A typical flow: list your eligible transactions, optionally get amount suggestions or a fee quote, then create a request. Once created, a request moves through a small set of statuses:

| Status        | Meaning                                                                            |
| ------------- | ---------------------------------------------------------------------------------- |
| `PENDING`     | The request has been created and is waiting to be processed.                       |
| `PROCESSING`  | The early payout amount has been deducted from your balance.                       |
| `TRANSFERRED` | The payout has reached your payout method.                                         |
| `DECLINED`    | The request will not be processed. See `declineReason` on the request for details. |

## Get eligible transactions [#get-eligible-transactions]

Returns a paginated list of your not-yet-settled transactions that are eligible for instant settlement, plus summary totals and your current caps.

| Endpoint | Value                                                                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v3/payment/instant-settlements/instant/eligible-transactions](https://test-api.kashier.io/v3/payment/instant-settlements/instant/eligible-transactions) |
| LIVE-URL | [https://api.kashier.io/v3/payment/instant-settlements/instant/eligible-transactions](https://api.kashier.io/v3/payment/instant-settlements/instant/eligible-transactions)           |
| Method   | GET                                                                                                                                                                                  |

### Query parameters [#query-parameters]

| Key      | Description                                                            |
| -------- | ---------------------------------------------------------------------- |
| page     | Page number for pagination. Example: `1`                               |
| limit    | Records per page. Example: `20`                                        |
| channel  | Optional filter: `online` or `pos`.                                    |
| method   | Optional filter: `card` or `wallet`.                                   |
| dateFrom | Inclusive lower bound on transaction date (ISO). Example: `2026-06-01` |
| dateTo   | Inclusive upper bound on transaction date (ISO). Example: `2026-06-30` |

```bash
curl --location 'https://test-api.kashier.io/v3/payment/instant-settlements/instant/eligible-transactions?page=1&limit=20' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v3/payment/instant-settlements/instant/eligible-transactions?page=1&limit=20" sendApiKey="false" title="Try it — get eligible transactions" />

### Headers [#headers]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response]

```json
{
  "message": "success",
  "data": [
    {
      "transactionId": "TX-1001",
      "amount": 10000,
      "settlementAmount": 10000,
      "accountId": "ACC-39550-436-01",
      "method": "card",
      "channel": "online",
      "transactionDate": "2026-06-10T11:20:00.000Z",
      "rfsDate": "2026-06-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 20,
    "page": 1,
    "pages": 1
  },
  "summary": {
    "count": 2,
    "totalAmount": 15000,
    "totalSettlementAmount": 15000
  },
  "limits": {
    "perRequestCap": 100000,
    "dailyCap": 250000,
    "usedToday": 0,
    "remainingToday": 250000
  }
}
```

| Field                     | Description                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `data[].transactionId`    | The transaction's identifier.                                                                  |
| `data[].settlementAmount` | The amount that would be settled for this transaction.                                         |
| `data[].accountId`        | The account this transaction would settle into.                                                |
| `data[].rfsDate`          | The transaction's regular ("ready for settlement") settlement date, absent instant settlement. |
| `summary`                 | Totals across the whole eligible set, not just the current page.                               |
| `limits.perRequestCap`    | The maximum amount you can include in a single request.                                        |
| `limits.dailyCap`         | The maximum amount you can request in a day. `0` means no daily cap is configured.             |
| `limits.usedToday`        | Amount already requested today.                                                                |
| `limits.remainingToday`   | Remaining amount you can request today. `null` when `dailyCap` is unconfigured.                |

## Get amount suggestions [#get-amount-suggestions]

Given a target amount, returns the combination of your eligible transactions whose combined `settlementAmount` comes closest to that target — one combination just below it and one just above it — so you don't have to hand-pick transactions to hit a number.

| Endpoint | Value                                                                                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v3/payment/instant-settlements/instant/suggestions](https://test-api.kashier.io/v3/payment/instant-settlements/instant/suggestions) |
| LIVE-URL | [https://api.kashier.io/v3/payment/instant-settlements/instant/suggestions](https://api.kashier.io/v3/payment/instant-settlements/instant/suggestions)           |
| Method   | POST                                                                                                                                                             |

### Body parameters [#body-parameters]

| Key          | Description                                                     |
| ------------ | --------------------------------------------------------------- |
| targetAmount | The amount you'd like to get as close to as possible. Required. |
| channel      | Optional filter: `online` or `pos`.                             |
| method       | Optional filter: `card` or `wallet`.                            |
| dateFrom     | Optional inclusive lower bound on transaction date (ISO).       |
| dateTo       | Optional inclusive upper bound on transaction date (ISO).       |

```bash
curl --location 'https://test-api.kashier.io/v3/payment/instant-settlements/instant/suggestions' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "targetAmount": 50000
  }'
```

<ApiTryIt method="POST" url="https://test-api.kashier.io/v3/payment/instant-settlements/instant/suggestions" body="{ targetAmount: 50000 }" sendApiKey="false" title="Try it — get amount suggestions" />

### Headers [#headers-1]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-1]

```json
{
  "targetAmount": 50000,
  "below": {
    "totalAmount": 38500,
    "transactionsCount": 4,
    "transactionIds": ["TX-A30000", "TX-B7000", "TX-C1000", "TX-D500"]
  },
  "above": {
    "totalAmount": 55000,
    "transactionsCount": 2,
    "transactionIds": ["TX-A30000", "TX-E25000"]
  },
  "candidatesConsidered": 5,
  "truncated": false,
  "approximate": false,
  "limits": {
    "perRequestCap": 100000,
    "dailyCap": 250000,
    "remainingToday": 250000
  }
}
```

| Field                                           | Description                                                                                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `below`                                         | The largest combination of transactions whose total is at or under `targetAmount`. `null` if no combination fits.                                      |
| `above`                                         | The smallest combination of transactions whose total is at or over `targetAmount`. `null` if no combination fits.                                      |
| `below.transactionIds` / `above.transactionIds` | Pass these directly as `transactionIds` to the [fee inquiry](#get-a-fee-inquiry) or [create request](#create-an-instant-settlement-request) endpoints. |

Both `below` and `above` are clamped to your effective cap (the lower of `perRequestCap` and your remaining daily cap).

## Get a fee inquiry [#get-a-fee-inquiry]

Returns a fee breakdown for a set of transactions, without creating a request. Use this to show the merchant the net amount they'd receive before they commit.

| Endpoint | Value                                                                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v3/payment/instant-settlements/instant/inquiry](https://test-api.kashier.io/v3/payment/instant-settlements/instant/inquiry) |
| LIVE-URL | [https://api.kashier.io/v3/payment/instant-settlements/instant/inquiry](https://api.kashier.io/v3/payment/instant-settlements/instant/inquiry)           |
| Method   | POST                                                                                                                                                     |

### Body parameters [#body-parameters-1]

| Key            | Description                                            |
| -------------- | ------------------------------------------------------ |
| transactionIds | Array of transaction IDs to quote a fee for. Required. |

```bash
curl --location 'https://test-api.kashier.io/v3/payment/instant-settlements/instant/inquiry' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "transactionIds": ["TX-1001", "TX-1002"]
  }'
```

<ApiTryIt method="POST" url="https://test-api.kashier.io/v3/payment/instant-settlements/instant/inquiry" body="{ transactionIds: ['TX-1001', 'TX-1002'] }" sendApiKey="false" title="Try it — get a fee inquiry" />

### Headers [#headers-2]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-2]

```json
{
  "totalAmount": 15000,
  "totalSettlementAmount": 15000,
  "totalRateFees": 225,
  "vat": 31.5,
  "flatFees": 0,
  "totalFees": 256.5,
  "netTransferAmount": 14743.5,
  "transactionsCount": 2
}
```

| Field                   | Description                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| `totalSettlementAmount` | Sum of the settlement amounts of the selected transactions.       |
| `totalRateFees`         | Percentage-based instant settlement fee.                          |
| `vat`                   | VAT on the fee.                                                   |
| `flatFees`              | Flat portion of the fee, if any.                                  |
| `totalFees`             | `totalRateFees + vat + flatFees`.                                 |
| `netTransferAmount`     | What you'd actually receive: `totalSettlementAmount - totalFees`. |

<Callout title="Caps are enforced here too">
  If the selection would exceed your per-request or daily cap, this call fails before you ever create a request, with a `422` carrying a dedicated code — `INSTANT_SETTLEMENT_PER_REQUEST_LIMIT_EXCEEDED` or `INSTANT_SETTLEMENT_DAILY_LIMIT_EXCEEDED` — and the relevant figures:

```json
{
  "status": "FAILURE",
  "error": {
    "code": "INSTANT_SETTLEMENT_DAILY_LIMIT_EXCEEDED",
    "message": "Instant settlement daily limit exceeded",
    "limit": 250000,
    "usedToday": 240000,
    "remaining": 10000
  }
}
```

Cap breaches are the one exception: every other validation failure on this module is a `400`, and a `409` means the request exists but is no longer `PENDING`.
</Callout>

## Create an instant settlement request [#create-an-instant-settlement-request]

Creates a request over the selected transactions. The request starts in `PENDING` status.

| Endpoint | Value                                                                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v3/payment/instant-settlements/instant-requests](https://test-api.kashier.io/v3/payment/instant-settlements/instant-requests) |
| LIVE-URL | [https://api.kashier.io/v3/payment/instant-settlements/instant-requests](https://api.kashier.io/v3/payment/instant-settlements/instant-requests)           |
| Method   | POST                                                                                                                                                       |

### Body parameters [#body-parameters-2]

| Key            | Description                                                   |
| -------------- | ------------------------------------------------------------- |
| transactionIds | Array of transaction IDs to include in the request. Required. |

```bash
curl --location 'https://test-api.kashier.io/v3/payment/instant-settlements/instant-requests' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "transactionIds": ["TX-1001", "TX-1002"]
  }'
```

<ApiTryIt method="POST" url="https://test-api.kashier.io/v3/payment/instant-settlements/instant-requests" body="{ transactionIds: ['TX-1001', 'TX-1002'] }" sendApiKey="false" title="Try it — create an instant settlement request" />

### Headers [#headers-3]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-3]

```json
{
  "message": "success",
  "data": {
    "id": "d2719f9a-3a36-4f10-9c7b-1f2e3d4c5b6a",
    "requestId": "ISR-1042",
    "merchantId": "MID-957-917",
    "status": "PENDING",
    "declineReason": null,
    "totalAmount": 15000,
    "totalSettlementAmount": 15000,
    "totalRateFees": 225,
    "flatFees": 0,
    "vat": 31.5,
    "totalFees": 256.5,
    "netTransferAmount": 14743.5,
    "transactionsCount": 2,
    "statusHistory": [
      {
        "status": "PENDING",
        "at": "2026-06-13T08:00:00.000Z",
        "by": "merchant@kashier.io"
      }
    ],
    "createdAt": "2026-06-13T08:00:00.000Z",
    "updatedAt": "2026-06-13T08:00:00.000Z"
  }
}
```

| Field                    | Description                                                               |
| ------------------------ | ------------------------------------------------------------------------- |
| `data.id`                | The request's UUID. Use this or `requestId` to look up the request later. |
| `data.requestId`         | The request's human-readable ID (e.g. `ISR-1042`).                        |
| `data.status`            | See the status table at the top of this page.                             |
| `data.declineReason`     | Set when `status` is `DECLINED`; otherwise `null`.                        |
| `data.netTransferAmount` | The amount you'll receive after fees.                                     |
| `data.statusHistory`     | A log of status changes for this request.                                 |

Only transactions that are currently eligible are accepted — if any transaction in `transactionIds` is no longer eligible, the request is rejected with a `400` naming the offending transaction, and no partial request is created.

## List your instant settlement requests [#list-your-instant-settlement-requests]

Returns a paginated list of your own instant settlement requests.

| Endpoint | Value                                                                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v3/payment/instant-settlements/instant-requests](https://test-api.kashier.io/v3/payment/instant-settlements/instant-requests) |
| LIVE-URL | [https://api.kashier.io/v3/payment/instant-settlements/instant-requests](https://api.kashier.io/v3/payment/instant-settlements/instant-requests)           |
| Method   | GET                                                                                                                                                        |

### Query parameters [#query-parameters-1]

| Key       | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| page      | Page number for pagination. Example: `1`                                 |
| limit     | Records per page. Example: `20`                                          |
| status    | Filter by status: `PENDING`, `PROCESSING`, `TRANSFERRED`, or `DECLINED`. |
| requestId | Filter/search by the human `requestId` (prefix match).                   |
| dateFrom  | Inclusive lower bound on transaction date (ISO).                         |
| dateTo    | Inclusive upper bound on transaction date (ISO).                         |

```bash
curl --location 'https://test-api.kashier.io/v3/payment/instant-settlements/instant-requests?page=1&limit=20' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v3/payment/instant-settlements/instant-requests?page=1&limit=20" sendApiKey="false" title="Try it — list your instant settlement requests" />

### Headers [#headers-4]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-4]

```json
{
  "message": "success",
  "data": [
    {
      "id": "d2719f9a-3a36-4f10-9c7b-1f2e3d4c5b6a",
      "requestId": "ISR-1042",
      "merchantId": "MID-957-917",
      "status": "PENDING",
      "totalSettlementAmount": 15000,
      "netTransferAmount": 14743.5,
      "transactionsCount": 2,
      "createdAt": "2026-06-13T08:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "page": 1,
    "pages": 1
  }
}
```

## Get request details [#get-request-details]

Fetch the full detail of a single request by its `id` or `requestId`.

| Endpoint | Value                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v3/payment/instant-settlements/instant-requests/:id](https://test-api.kashier.io/v3/payment/instant-settlements/instant-requests/:id) |
| LIVE-URL | [https://api.kashier.io/v3/payment/instant-settlements/instant-requests/:id](https://api.kashier.io/v3/payment/instant-settlements/instant-requests/:id)           |
| Method   | GET                                                                                                                                                                |

`:id` accepts either the UUID `id` or the human-readable `requestId` (e.g. `ISR-1042`).

```bash
curl --location 'https://test-api.kashier.io/v3/payment/instant-settlements/instant-requests/ISR-1042' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v3/payment/instant-settlements/instant-requests/:id" sendApiKey="false" title="Try it — get request details" />

### Headers [#headers-5]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-5]

```json
{
  "message": "success",
  "data": {
    "id": "d2719f9a-3a36-4f10-9c7b-1f2e3d4c5b6a",
    "requestId": "ISR-1042",
    "merchantId": "MID-957-917",
    "status": "PROCESSING",
    "totalSettlementAmount": 15000,
    "netTransferAmount": 14743.5,
    "transactionsCount": 2,
    "statusHistory": [
      { "status": "PENDING", "at": "2026-06-13T08:00:00.000Z" },
      { "status": "PROCESSING", "at": "2026-06-13T08:05:00.000Z" }
    ],
    "linkedBalanceRecords": [
      {
        "recordId": "ISR-1042-20260615",
        "accountId": "ACC-39550-436-01",
        "amount": -10000,
        "valueDate": "2026-06-15T00:00:00.000Z",
        "isReflected": false
      }
    ]
  }
}
```

| Field                                     | Description                                                                                                                                                                                                                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data.linkedBalanceRecords`               | The balance ledger records created for this request, once its early-payout deduction has posted. Empty (`[]`) while `status` is `PENDING`. See [Get balance records](/docs/account-and-balance/balance#get-balance-records-the-ledger) for the general ledger this is drawn from. |
| `data.linkedBalanceRecords[].isReflected` | Whether this deduction has been fully reflected in your balance yet.                                                                                                                                                                                                              |

<Callout title="Degraded response">
  If the balance ledger is temporarily unavailable when you call this endpoint, the request details still return, but with `linkedBalanceRecords: null` and `linkedBalanceRecordsUnavailable: true`. Retry later to get the linked records.
</Callout>

Calling this with an `id`/`requestId` that doesn't belong to you returns a `404`.

## Get request transactions [#get-request-transactions]

Returns the transactions that belong to a specific request.

| Endpoint | Value                                                                                                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v3/payment/instant-settlements/instant-requests/:id/transactions](https://test-api.kashier.io/v3/payment/instant-settlements/instant-requests/:id/transactions) |
| LIVE-URL | [https://api.kashier.io/v3/payment/instant-settlements/instant-requests/:id/transactions](https://api.kashier.io/v3/payment/instant-settlements/instant-requests/:id/transactions)           |
| Method   | GET                                                                                                                                                                                          |

### Query parameters [#query-parameters-2]

| Key   | Description                              |
| ----- | ---------------------------------------- |
| page  | Page number for pagination. Example: `1` |
| limit | Records per page. Example: `20`          |

```bash
curl --location 'https://test-api.kashier.io/v3/payment/instant-settlements/instant-requests/ISR-1042/transactions?page=1&limit=20' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v3/payment/instant-settlements/instant-requests/:id/transactions?page=1&limit=20" sendApiKey="false" title="Try it — get request transactions" />

### Headers [#headers-6]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-6]

```json
{
  "message": "success",
  "data": [
    {
      "transactionId": "TX-1001",
      "settlementAmount": 10000,
      "accountId": "ACC-39550-436-01",
      "rfsDate": "2026-06-15T00:00:00.000Z",
      "method": "card"
    },
    {
      "transactionId": "TX-1002",
      "settlementAmount": 5000,
      "accountId": "ACC-39550-436-02",
      "rfsDate": "2026-06-16T00:00:00.000Z",
      "method": "wallet"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 20,
    "page": 1,
    "pages": 1
  }
}
```

# Payouts sandbox testing (/docs/payouts/testing)

The transfers sandbox lets you test the full payout (transfers) flow on the test environment without sending any real money or calling real providers. When you use the test base URLs, every transfer is simulated end to end.

The scenario a transfer follows is chosen from the **recipient number** you send. Pick a number from the tables below to force a specific outcome (success, timeout, invalid recipient, or insufficient funds).

<Callout title="Note">
  Sandbox only runs on the test environment. Use the test base URLs (`https://test-fep.kashier.io`) with your test secret key. Real provider calls never happen here.
</Callout>

## How it works [#how-it-works]

The sandbox simulates the transfer at two points, so the whole lifecycle behaves like production without any external call:

| Stage                     | What is simulated                                                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Balance check             | Insufficient-funds outcomes are decided before any provider is contacted.                                                                          |
| Provider send & reconcile | The send and reconcile calls to the providers (EBC, Axis Pay, OctoCard) are mocked, returning success, a timeout, or an invalid-recipient failure. |

Any recipient number that is not listed in the tables below is treated as unknown: the send fails and the transfer ends up FAILED.

## Scenarios [#scenarios]

Four scenarios can be triggered. Each test number below maps to exactly one of them.

| Scenario            | Flow                                                                        | Final status |
| ------------------- | --------------------------------------------------------------------------- | ------------ |
| SUCCESS             | Send succeeds, reconcile confirms the transfer.                             | TRANSFERRED  |
| TIMEOUT             | Send succeeds, reconcile returns 504 and is retried until max retries.      | IN\_TRANSIT  |
| INVALID             | Send succeeds, reconcile reports an invalid recipient, balance is reversed. | FAILED       |
| INSUFFICIENT\_FUNDS | Balance check fails before the provider is called.                          | FAILED       |

## Mobile wallet numbers [#mobile-wallet-numbers]

Use these as the `recipientNumber` with `method` set to `wallet`. The same numbers work for wallet transfers and instant wallet transfers.

| Recipient Number | Scenario            |
| ---------------- | ------------------- |
| 01111111111      | SUCCESS             |
| 01111111112      | TIMEOUT             |
| 01111111113      | INVALID             |
| 01111111114      | INSUFFICIENT\_FUNDS |

## Card numbers [#card-numbers]

Use these as the `recipientNumber` with `method` set to `card`. The sandbox matches on the **masked** form exactly as written below — send the asterisks, not a full card number. A full PAN is a different string and matches no scenario, so the transfer is treated as an unknown recipient and ends up FAILED.

| Recipient Number   | Scenario            |
| ------------------ | ------------------- |
| `5123********2346` | SUCCESS             |
| `5123********2347` | TIMEOUT             |
| `5123********2348` | INVALID             |
| `5123********2349` | INSUFFICIENT\_FUNDS |

For `method: card`, `recipientNumber` identifies the recipient only — the card being paid out to is passed separately as `cardToken`, alongside `recipientBank`. Both are required on card transfers.

## Bank account numbers [#bank-account-numbers]

Use these as the `recipientNumber` with `method` set to `bank`.

| Recipient Number | Scenario            |
| ---------------- | ------------------- |
| 78901234567890   | SUCCESS             |
| 78901234567891   | TIMEOUT             |
| 78901234567892   | INVALID             |
| 78901234567893   | INSUFFICIENT\_FUNDS |

## OctoCard (national ID) numbers [#octocard-national-id-numbers]

Use these as the `recipientNumber` for OctoCard transfers identified by national ID.

| Recipient Number | Scenario            |
| ---------------- | ------------------- |
| 29901011234567   | SUCCESS             |
| 29901011234568   | TIMEOUT             |
| 29901011234569   | INVALID             |
| 29901011234560   | INSUFFICIENT\_FUNDS |

## Example requests [#example-requests]

Send these to the test create-transfer endpoint `https://test-fep.kashier.io/v3/transfers/single` with your test secret key in the Authorization header.

Trigger a successful wallet transfer:

```json
{
  "amount": 100,
  "method": "wallet",
  "recipientName": "Test User",
  "merchantTransferId": "sandbox-success-1",
  "recipientNumber": "01111111111"
}
```

Trigger an insufficient-funds failure:

```json
{
  "amount": 100,
  "method": "wallet",
  "recipientName": "Test User",
  "merchantTransferId": "sandbox-insufficient-1",
  "recipientNumber": "01111111114"
}
```

# Payouts webhook (/docs/payouts/webhook)

Kashier sends two webhooks during a transfer:

1. **Transfer initiation** — fired when the transfer is accepted.
2. **Transfer final status** — fired when it settles or fails.

## Before you start [#before-you-start]

Kashier only sends a transfer webhook when **all three** of these are in place. If any one is missing, the transfer still goes through, but no webhook is delivered for it.

1. **An API key named `transfer`.** In the Kashier dashboard, create an API key and name it exactly `transfer`, in the same mode you create transfers in — a test-mode key for test transfers, a live-mode key for live transfers. This is your **transfer API key**: Kashier signs every payout webhook with it, and you use it to [verify the signature](#verification-process). It is a separate key from your Payment API Key.
2. **A webhook URL.** Register the endpoint that should receive transfer events — see [manage your webhooks](/docs/webhooks/manage#create-a-webhook).
3. **A `merchantTransferId` on the transfer.** Send your own unique reference in `merchantTransferId` when you [create the transfer](/docs/payouts#create-transfer). A transfer created without it never triggers a webhook. For batches, the equivalent field is `merchantBatchId`.

<Callout type="warn" title="No merchantTransferId, no webhook">
  `merchantTransferId` is optional for creating a transfer, but required for receiving its webhook. If you rely on webhooks to track payouts, send it on every transfer.
</Callout>

## Authentication [#authentication]

To verify the integrity of data sent from Kashier, you need to validate the `x-kashier-signature` header using HMAC SHA256.

### Verification process [#verification-process]

Extract the `signatureKeys` array from the payload — it lists the keys used to create the signature. Concatenate their values from the payload in the **exact order the array lists them**, as `key_1=value_1&key_2=value_2...`. Do not sort the array, and do not URL-encode the values: use them raw. Generate an HMAC SHA256 hash of that string using your [transfer API key](#before-you-start) (the key named `transfer`) as the secret, then compare it with the `x-kashier-signature` header value. If they match, the data is authentic and can be safely processed.

For a single transfer the order is fixed as `merchantTransferId`, `method`, `amount`, `merchantId`, `status`, so the signed string looks like this:

```text
merchantTransferId=transfer12345&method=wallet&amount=10&merchantId=MID-xxx-xxx&status=INITIATED
```

Batch webhooks use `merchantBatchId`, `batchId`, `method`, `amount`, `merchantId`, `status` — again in that order.

<Callout type="warn" title="Don't reuse your payment webhook verifier">
  The [payment webhook](/docs/webhooks#step-4-verify-the-signature) sorts `signatureKeys` alphabetically, URL-encodes each value, and is keyed by your Payment API Key. The payout webhook does none of that: array order, raw values, transfer API key. A verifier written for one produces the wrong hash for the other.
</Callout>

## Webhook types [#webhook-types]

All webhooks include a signature header for security verification:

- Header name: `x-kashier-signature`
- The signature covers only the fields listed in the payload's `signatureKeys` array, joined as `key=value&key=value` in array order with raw values and hashed with your transfer API key — see [Verification process](#verification-process).

### Transfer initiation webhook [#transfer-initiation-webhook]

Sent when a transfer is initially processed by Kashier.

| Header              | Value                                                            |
| ------------------- | ---------------------------------------------------------------- |
| x-kashier-signature | 1cdc336099a85a8b2a8ffa901cfd55eaa5824e97efd9fc56c34544e9e24bcf7a |

#### Payload structure [#payload-structure]

```json
{
  "transferId": "TRS-1007931588",
  "merchantTransferId": "transfer12345",
  "amount": 10,
  "method": "wallet",
  "status": "INITIATED",
  "openForReturn": false,
  "merchantId": "MID-xxx-xxx",
  "recipientName": "Jhon Doe",
  "recipientNumber": "01356839512",
  "businessEmail": "billing@example.com",
  "storeName": "kashier store",
  "creatorEmail": "payouts@example.com",
  "creatorName": "Sara Ahmed",
  "batch": {
    "name": "Jhon Doe",
    "id": "TRS-1007931588",
    "method": "wallet",
    "transfersCount": 1
  },
  "transferResponseCode": "00",
  "transferResponseMessage": {
    "en": "success",
    "ar": "تمت الموافقة"
  },
  "date": "2025-01-15T08:32:37.829Z",
  "signatureKeys": [
    "merchantTransferId",
    "method",
    "amount",
    "merchantId",
    "status"
  ]
}
```

<Callout type="warn" title="transferResponseCode 00 on INITIATED is not a provider result">
  On the initiation webhook, `transferResponseCode` is always `"00"` with a generic success message. It only confirms that Kashier accepted the transfer, not that the provider paid it. Only a `TRANSFERRED` status means the funds reached the recipient; the real provider code appears on `IN_TRANSIT`, `TRANSFERRED`, and `FAILED`.
</Callout>

### Transfer final status webhook [#transfer-final-status-webhook]

Sent when the transfer reaches its final state (completed or failed).

| Header              | Value                                                            |
| ------------------- | ---------------------------------------------------------------- |
| x-kashier-signature | 8b41f0d7c25e9a6413ab77f2c0d95e83b6a1c4e70f28d5931ac6e40b7d92f158 |

#### Payload structure [#payload-structure-1]

```json
{
  "transferId": "TRS-1007931588",
  "amount": 10,
  "method": "wallet",
  "recipientName": "Jhon Doe",
  "recipientNumber": "01123439512",
  "merchantTransferId": "transfer12345",
  "status": "FAILED",
  "openForReturn": false,
  "merchantId": "MID-xxx-xxx",
  "businessEmail": "billing@example.com",
  "storeName": "kashier store",
  "creatorEmail": "payouts@example.com",
  "creatorName": "Sara Ahmed",
  "batch": {
    "name": "Jhon Doe",
    "id": "TRS-1007931588",
    "method": "wallet",
    "transfersCount": 1
  },
  "transferResponseCode": "k_default",
  "transferResponseMessage": {
    "en": "A General Error Occured, please contact support.",
    "ar": ""
  },
  "date": "2025-01-15T08:32:37.929Z",
  "signatureKeys": [
    "merchantTransferId",
    "method",
    "amount",
    "merchantId",
    "status"
  ]
}
```

## Body description [#body-description]

| Key                | Value                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------- |
| transferId         | Kashier's unique identifier for the transfer                                             |
| merchantTransferId | Your system's reference number                                                           |
| amount             | Transfer amount                                                                          |
| method             | Payment method (e.g., 'wallet')                                                          |
| status             | Current transfer status                                                                  |
| merchantId         | Your merchant ID in Kashier's system                                                     |
| openForReturn      | `true` on a `TRANSFERRED` transfer that the receiving wallet or bank can still send back |

## Status values [#status-values]

To configure which transfer events actually trigger a webhook delivery — as opposed to the full set of statuses a transfer can reach, listed below — see [manage your webhooks](/docs/webhooks/manage#create-a-webhook).

### For single transfers [#for-single-transfers]

| Key         | Value                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| PENDING     | Transfer created, balance not yet debited. This is the first status and the one the create call returns. |
| INITIATED   | Balance debited; the transfer is ready to send to the provider.                                          |
| IN\_TRANSIT | Transfer has started but is not yet completed.                                                           |
| TRANSFERRED | Transfer completed. Final unless `openForReturn` is `true`.                                              |
| FAILED      | Transfer failed (final status). Balance is reversed.                                                     |

### For batch transfers [#for-batch-transfers]

| Key                    | Value                                                                       |
| ---------------------- | --------------------------------------------------------------------------- |
| PENDING                | Batch created, transfers not yet debited.                                   |
| INITIATED              | Batch transfer has been created and approved by Kashier but hasn't started. |
| IN\_TRANSIT            | Batch has started but is not yet completed.                                 |
| TRANSFERRED            | Transfer is completed (final status).                                       |
| PARTIALLY\_TRANSFERRED | Some transfers in the batch were completed, while others failed.            |
| FAILED                 | Transfer failed (final status).                                             |

### openForReturn [#openforreturn]

A `TRANSFERRED` transfer with `openForReturn: true` is settled but still returnable — the receiving wallet or bank can bounce it back (EBC code `8222`). Treat it as not final and keep reconciling. `openForReturn: false` on `TRANSFERRED` is settled and final.

## Error handling [#error-handling]

When a transfer fails, the system provides detailed information to help identify and understand the issue:

1. Status: the transfer status will be updated to "FAILED," indicating the operation was not successful.
2. Error code: the `transferResponseCode` will include a specific code that represents the reason for the failure.
3. Error message: the `transferResponseMessage` will contain a detailed description of the error in both English and Arabic, allowing for better clarity and support across different audiences.

# Resources (/docs/resources)

Tools that go with these docs — pick what fits your workflow. Building with an AI coding assistant? See [Build with AI](/docs/get-started/ai-tools).

<Cards>
  <Card title="Postman collection" href="/docs/resources/postman" description="Import the Kashier API collection and try requests from Postman." />

  <Card title="Rate limits" href="/docs/resources/rate-limits" description="Request limits on the Direct API (FEP) and Dashboard API." />

  <Card title="Support" href="/docs/resources/support" description="Where to get help while integrating." />
</Cards>

# Postman collection (/docs/resources/postman)

Kashier provides some [Postman collections](https://www.postman.com/collection) to help test and understand the API:

[Download the Kashier API Postman collection](</assets/legacy/Kashier API test.postman_collection.json>)

## How to import a collection into Postman [#how-to-import-a-collection-into-postman]

1. Navigate to File > Import.

   <img alt="Postman File > Import menu" src="__img0" />

2. Choose the import file method.

   <img alt="Postman import file method" src="__img1" />

3. Choose the correct file to import and click Open. Postman will automatically import the file.

   <img alt="Choose file to import" src="__img2" />

4. Click on the Import button.

   <img alt="Postman Import button" src="__img3" />

5. Navigate to File > New Runner Tab.

6. The Collection Runner tab will open.

7. Now you can explore the Kashier API endpoints.

# Rate limits (/docs/resources/rate-limits)

## Direct API (FEP) [#direct-api-fep]

Checkout requests (`POST /v3/orders` on `fep.kashier.io`, i.e. creating a
payment) are limited to **1000 requests per minute**, on the
**live/production environment only**. There is no rate limit on the test
environment. This limit applies to the checkout endpoint — don't assume the
same figure applies to other `fep.kashier.io` routes.

The limit is applied **per IP address**. If several of your services share one
outbound IP, or you run behind a shared NAT or proxy, they share a single
bucket — so the effective ceiling for any one service is lower than 1000/min.

If you exceed the limit, further requests from that IP are rejected. Build
your integration to handle request failures gracefully and avoid bursting
requests, rather than relying on a specific error format, reset timing, or
`Retry-After` header.

## Dashboard API [#dashboard-api]

One Dashboard API endpoint, `POST /v2/paymentRequest/share`, is rate-limited.
If you need guaranteed throughput on Dashboard API (`api.kashier.io`)
endpoints, check with your account manager.

# Support (/docs/resources/support)

- **Integration questions** — contact the Kashier team through
  [kashier.io/contact](https://www.kashier.io/contact).
- **Dashboard and account help** — reach support from your
  [merchant dashboard](https://merchant.kashier.io).
- **Plugin issues** — check the guide for your platform under
  [E-commerce plugins](/docs/plugins) first; each page lists its requirements.

When you report an integration issue, include your merchant ID (`MID-...`),
whether you are in test or live mode, the endpoint you are calling, and the
full response body you received — it makes diagnosis much faster. Never share
your secret key or API key in a support message.

# POS API integration (/docs/pos/api-integration)

POS API integrations enable developers to interact with the POS system by sending requests and information through APIs. This allows them to initiate sales by transmitting order details or reviewing orders for voiding or refunds.

## Endpoints [#endpoints]

| Endpoint | Value                                                           |
| -------- | --------------------------------------------------------------- |
| TEST-URL | `https://test-api.kashier.io/v3/payment/pos/messages/:serialNo` |
| LIVE-URL | `https://api.kashier.io/v3/payment/pos/messages/:serialNo`      |
| Method   | POST                                                            |

## Parameters [#parameters]

| Parameter | Type           | Description                                                                      | Required |
| --------- | -------------- | -------------------------------------------------------------------------------- | -------- |
| serialNo  | Path Parameter | The serial number of the POS terminal. Older docs called this `POSSerialNumber`. | True     |

## Headers [#headers]

| Key           | Description                                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorization | The Authorization is a secret key used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

## Body structure for a pay request [#body-structure-for-a-pay-request]

```json
{
  "event": "sale",
  "data": {
    "message": {
      "amount": "1",
      "currency": "EGP",
      "merchantOrderId": "your orderId",
      "transactionType": "sale",
      "printReceipt": true,
      "metaData": {},
      "reconciliation": {
        "webhookUrl": "https://www.webhookApi.com"
      }
    }
  }
}
```

### Body description [#body-description]

| Parameter       | Description                                                                                                  | Required  |
| --------------- | ------------------------------------------------------------------------------------------------------------ | --------- |
| event           | The type of operation sale.                                                                                  | Mandatory |
| amount          | The amount to be paid through POS.                                                                           | Mandatory |
| currency        | The currency the customer will pay with.                                                                     | Mandatory |
| merchantOrderId | The order ID for the payment in your system.                                                                 | Mandatory |
| transactionType | The transaction type of the operation sale.                                                                  | Mandatory |
| printReceipt    | Use true to allow the POS to print the receipt. The default value is false.                                  | Optional  |
| metaData        | An object to send extra information related to the transaction as key: value. It must be sent even if empty. | Mandatory |
| reconciliation  | The endpoint URL where you want to receive Kashier's webhook.                                                | Optional  |

## Body structure for a details request [#body-structure-for-a-details-request]

```json
{
  "event": "details",
  "data": {
    "message": {
      "transactionType": "details",
      "metaData": {},
      "details": {
        "paymentMethod": "card",
        "merchantOrderId": "your OrderId",
        "transactionId": "Kashier's transaction ID",
        "valu": {
          "type": ""
        }
      }
    }
  }
}
```

### Body description [#body-description-1]

| Parameter       | Description                                                                                                               | Required                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| event           | The type of operation details.                                                                                            | Mandatory                         |
| transactionType | The transaction type of the operation details.                                                                            | Mandatory                         |
| metaData        | An object to send extra information related to the transaction as key: value. It must be sent even if empty.              | Mandatory                         |
| paymentMethod   | The payment method of the order you are inquiring about.                                                                  | Mandatory                         |
| merchantOrderId | The order ID for the order you are inquiring about.                                                                       | Mandatory                         |
| transactionId   | Kashier's transaction ID for the payment you are inquiring about. You can find it in the webhook request sent by Kashier. | Mandatory                         |
| valu.type       | The type of ValU credentials your Kashier account uses to process payments through ValU. It is either PF or PSP.          | Mandatory only for ValU payments. |

# App-to-app integration (/docs/pos/app-to-app)

## Prerequisites [#prerequisites]

- Server IP addresses: you must provide the IP addresses of your servers (for both incoming and outgoing calls/requests from your application) so that we can whitelist them with our network provider.
- Application (APK) file: you must provide the APK file of your application. We will sign it to ensure it is authorized to run on our machines.

## Download the SDK [#download-the-sdk]

[Download the KashierIntegration release (kashierintegration-0.0.7-release.aar)](/assets/legacy/kashierintegration-0.0.7-release.aar)

## Install [#install]

1. Add the AAR file to the `libs` folder. Convert your app from Android to Project view, then navigate to the `app > libs` folder.

   <img alt="Adding the AAR file" src="__img0" />

2. Add the dependencies. You need to include the dependency below in your `build.gradle`.

   <img alt="Adding dependencies" src="__img1" />

Now you're ready to sync your project.

## Usage [#usage]

The SDK provides two functions to initiate payment: `startSale()` and `startDetails()`.

1. Import the following classes.

   <img alt="Import the following classes" src="__img2" />

2. Implement `KashierIntegrationCallback` and `KashierIntegrationFactory`.

   <img alt="Kotlin implementation of KashierIntegrationCallback" src="__img3" />

   <img alt="Java implementation of KashierIntegrationCallback" src="__img4" />

3. To make a sale transaction, call the `startSale` method and pass the following parameters:

   | Parameter       | Description                                                                                   |
   | --------------- | --------------------------------------------------------------------------------------------- |
   | amount          | The amount of the transaction sale.                                                           |
   | currency        | EGP, USD, GBP, EUR.                                                                           |
   | merchantOrderId | Your integration ID.                                                                          |
   | paymentMethod   | card, wallet, installment, valu.                                                              |
   | printReceipt    | true: Allow auto printing for the receipt; false: Do not allow auto printing for the receipt. |
   | metaData        | mapOf(String(), Any()): Any data you want to pass through the integration.                    |

4. To get details of any transaction, call the `startDetails` method using the transaction ID. You need to pass the same parameters as in step 3, plus one additional parameter:

   | Parameter | Description                |
   | --------- | -------------------------- |
   | trxId     | The ID of the transaction. |

   <img alt="Kotlin transaction" src="__img5" />

   <img alt="Java transaction" src="__img6" />

5. As a result of the above code, you should expect values returned in your response to update your backend.

   <img alt="Kotlin response" src="__img7" />

   <img alt="Java response" src="__img8" />

6. Response codes:

   | Response Code | Description           |
   | ------------- | --------------------- |
   | 500           | Transaction canceled. |
   | 400           | Transaction failure.  |
   | 200           | Transaction success.  |

# In-person payments (/docs/pos)

Drive Kashier POS terminals from your own software. There are two integration paths — pick the one that matches where your code runs.

## App-to-app integration [#app-to-app-integration]

Use [app-to-app](/docs/pos/app-to-app) when your own Android app runs on the Kashier terminal itself. Your app launches the Kashier payment app through an Android SDK (the KashierIntegration `.aar` library) and receives the result in a callback. The SDK exposes `startSale()` to take a payment — with control over currency (EGP, USD, GBP, EUR), payment method (card, wallet, installment, valu), and receipt printing — and `startDetails()` to fetch a transaction's details.

Before you can use it, you must:

- Provide your server IP addresses so Kashier can whitelist them with the network provider.
- Provide your APK so Kashier can sign it to run on the terminals.
- Add the `.aar` file to your Android project and sync the dependency.

## POS API integration [#pos-api-integration]

Use the [POS API](/docs/pos/api-integration) when the terminal runs the standard Kashier payment app and you trigger payments from your backend. You POST a sale or details request to an endpoint addressed by the terminal's serial number, authorized with the secret key from your Kashier dashboard. Pass a webhook URL in the sale request to receive the result. The API answers on both the test and live hosts.

Both paths support sale and transaction-details operations.

# Webhooks (/docs/webhooks)

Kashier notifies your server about payment and refund events by sending POST requests to a URL you control. Each request carries an Event object with the full transaction details — see [Webhook payloads](/docs/webhooks/payloads) for the event types and every field Kashier sends. Use webhooks for post-payment commerce events such as sending custom email receipts, fulfilling orders, or updating your database. They are also the only way to receive automatic updates for payment methods that confirm asynchronously.

## Prerequisites [#prerequisites]

Before you configure a webhook, make sure you have:

- **A publicly accessible server endpoint** that can receive unauthenticated POST requests — Kashier calls it directly over the internet, so `localhost` or anything behind auth won't work.
- **Your Payment API Key**, found in your dashboard under the [Integrations section](https://merchant.kashier.io/en/integrations) — you'll use it in Step 4 to verify that incoming requests really came from Kashier.
- **A read of [Webhook payloads](/docs/webhooks/payloads)**, so you know which event types and fields to expect in the request body.

## Step 1: Build your endpoint [#step-1-build-your-endpoint]

Add a new route to your server and make sure it's publicly accessible so Kashier can send unauthenticated POST requests to it. Kashier sends the event data as JSON in the request body: an Event object whose `event` field names the transaction operation (`pay`, `authorize`, `capture`, `refund`, `partial_refund`, `void`, `reject`, or `reversal`) and whose `data` payload contains the transaction details. See [Webhook payloads](/docs/webhooks/payloads) for the full payload and field notes.

<Callout type="warn" title="event is not a success signal">
  Kashier also sends a webhook when an operation **fails** — same `event` value, with `"status": "FAILURE"` in `data`. Branch on `data.status` (`SUCCESS`, `FAILURE`, or `PENDING`), never on `event` alone. `status` is the transaction status, not the order status.
</Callout>

## Step 2: Point Kashier at your endpoint [#step-2-point-kashier-at-your-endpoint]

There are two ways an event reaches your endpoint, and they work together — if both apply to a payment, Kashier delivers to both independently.

**Configure a webhook.** [Webhook management](/docs/webhooks/manage) is where you register endpoints, and it's the way to set webhooks up. Each webhook has a name, a URL, optional custom headers, a mode (`test` or `live`), and the list of event types it's subscribed to — so a production endpoint can take just `pay` and `refund` while a separate staging endpoint listens on `test` mode. Delivery records, resend, and test-send live in the same module — see [Webhook management](/docs/webhooks/manage) for which of them are available today.

<Callout title="Already had a webhook URL with Kashier?">
  You don't need to re-register it. A single stored webhook URL configured before webhook management existed is migrated into the module for you and keeps receiving what it received before — see [If you used the old single-URL webhook](/docs/webhooks/manage#if-you-used-the-old-single-url-webhook).
</Callout>

**Pass a per-request destination.** Payment-creating calls also accept a `serverWebhook` field — [payment sessions](/docs/accept-payments/payment-sessions), the [Direct API card form](/docs/direct-api/card-form), and [recurring payments](/docs/accept-payments/recurring) each take one. That URL applies to that payment only. Kashier records and delivers to it under the same mode as the payment, without it becoming a configured webhook, and without event filtering — a per-request destination receives every event that payment produces. Use it when the destination genuinely varies per transaction, for example a platform routing each order's notifications to a different vendor. Payouts have no per-request equivalent; transfer events only go to configured webhooks.

## Step 3: Respond to events [#step-3-respond-to-events]

Respond with `200` as soon as you receive the event. Kashier treats HTTP `200` and HTTP `409 Conflict` as acknowledged — return `409` for an event you have already processed. Any other status code counts as unacknowledged, as does any response slower than the 30-second delivery timeout.

Kashier retries an unacknowledged event up to 10 times, backing off `2 minutes` → `10 minutes` → `30 minutes` → `1 hour` → `2 hours` → `4 hours`, then every `4 hours`.

Don't send a response body — it's discarded, and only the status code is read. If your handler starts a long-running task, return `200` first and do the work afterwards; otherwise delivery times out and the event is sent again. Make your handler safe to run twice — see [Idempotency](#idempotency).

## Step 4: Verify the signature [#step-4-verify-the-signature]

Kashier signs every webhook request with SHA256 HMAC so you can verify it wasn't tampered with in transit.

To generate the signature, sort the elements of the `signatureKeys` array in the `data` payload alphabetically. Each element is a key of the `data` object. Select those keys and their values from the received `data` object, then build the signature payload:

```text
amount=1&channel=online%20%7C%20e-commerce&currency=EGP&kashierOrderId=9ad06b17-755b-4e21-9774-aff3e2726ac9&merchantOrderId=1653481557813&method=card&orderReference=TEST-ORD-38855&status=SUCCESS&transactionId=TX-249893963&transactionResponseCode=00
```

Hash the signature payload with your Payment API Key, then compare your result with the `x-kashier-signature` request header. If both are equal, the data is safe to save and use in your system.

<Callout title="Hint">
  You must use the Payment API Key that you used to create the [Payment Hash](/docs/direct-api/hashing). You can find the Payment API Key in your dashboard under the [Integrations section](https://merchant.kashier.io/en/integrations).
</Callout>

Ensure that only the values of the keys are URL-encoded, not the entire string. This means each value should be properly encoded before concatenating the key-value pairs to form the signature payload.

### How the signature is computed, step by step [#how-the-signature-is-computed-step-by-step]

Here's the computation above traced through with concrete values, so you can check your own implementation against a known-good result.

**1. Start from the received `data` payload.** Say Kashier's request body contains this `data` object (trimmed to the signature-relevant fields — see [Webhook payloads](/docs/webhooks/payloads) for the full shape):

```json
{
  "amount": 1,
  "channel": "online | e-commerce",
  "currency": "EGP",
  "kashierOrderId": "9ad06b17-755b-4e21-9774-aff3e2726ac9",
  "merchantOrderId": "1653481557813",
  "method": "card",
  "orderReference": "TEST-ORD-38855",
  "status": "SUCCESS",
  "transactionId": "TX-249893963",
  "transactionResponseCode": "00",
  "signatureKeys": [
    "amount",
    "channel",
    "currency",
    "kashierOrderId",
    "merchantOrderId",
    "method",
    "orderReference",
    "status",
    "transactionId",
    "transactionResponseCode"
  ]
}
```

**2. Sort `signatureKeys` alphabetically.** In this example it's already sorted: `amount`, `channel`, `currency`, `kashierOrderId`, `merchantOrderId`, `method`, `orderReference`, `status`, `transactionId`, `transactionResponseCode`.

**3. Look up each key's value in `data`, and URL-encode only the value.** Only `channel`'s value contains characters that need encoding — the space becomes `%20` and the `|` becomes `%7C`:

| Key                       | Value                                  | URL-encoded value                      |
| ------------------------- | -------------------------------------- | -------------------------------------- |
| `amount`                  | `1`                                    | `1`                                    |
| `channel`                 | `online \| e-commerce`                 | `online%20%7C%20e-commerce`            |
| `currency`                | `EGP`                                  | `EGP`                                  |
| `kashierOrderId`          | `9ad06b17-755b-4e21-9774-aff3e2726ac9` | `9ad06b17-755b-4e21-9774-aff3e2726ac9` |
| `merchantOrderId`         | `1653481557813`                        | `1653481557813`                        |
| `method`                  | `card`                                 | `card`                                 |
| `orderReference`          | `TEST-ORD-38855`                       | `TEST-ORD-38855`                       |
| `status`                  | `SUCCESS`                              | `SUCCESS`                              |
| `transactionId`           | `TX-249893963`                         | `TX-249893963`                         |
| `transactionResponseCode` | `00`                                   | `00`                                   |

**4. Join each pair with `=` and all pairs with `&`.** That produces exactly the signature payload string shown above:

```text
amount=1&channel=online%20%7C%20e-commerce&currency=EGP&kashierOrderId=9ad06b17-755b-4e21-9774-aff3e2726ac9&merchantOrderId=1653481557813&method=card&orderReference=TEST-ORD-38855&status=SUCCESS&transactionId=TX-249893963&transactionResponseCode=00
```

**5. HMAC-SHA256 that string, keyed with your Payment API Key.** This is the same credential used for the [Payment Hash](/docs/direct-api/hashing) — not your Secret Key. If the "Payment API Key" vs. "Secret Key" vs. "MID" terminology is unclear, see [Credentials at a glance](/docs/get-started/api-keys#credentials-at-a-glance) for how each maps to its actual header or field name. Using the same illustrative key (`11111`) as the [Request hashing](/docs/direct-api/hashing) examples, the resulting hex digest is:

```text
9610477b2255b2a8ef84fd89adfaa5f1305ff9c20324205851890f1ea03109f4
```

**6. Compare the digest with the `x-kashier-signature` request header.** If they're equal (byte-for-byte, case-insensitive hex comparison), the request is authentic and the `data` payload is safe to save and use — this is exactly what the `if (kashierSignature === signature)` check does in the code samples below.

```js
const app = require("express")();
// Use body-parser to retrieve the raw body as a buffer
const bodyParser = require("body-parser");
const crypto = require("crypto");
const queryString = require("query-string");
const _ = require("underscore");
router.post("/", (req, res) => {
  const { data, event } = req.body;
  data.signatureKeys.sort();
  const objectSignaturePayload = _.pick(data, data.signatureKeys);
  const signaturePayload = queryString.stringify(objectSignaturePayload);
  const signature = crypto
    .createHmac("sha256", PaymentApiKey)
    .update(signaturePayload)
    .digest("hex");
  const kashierSignature = req.header("x-kashier-signature");
  if (kashierSignature === signature) {
    console.log("valid signature");
  } else {
    console.log("invalid signature");
  }
});
app.listen(8000, () => console.log("Running on port 8000"));
```

```php
<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $raw_payload = file_get_contents('php://input');
  $json_data = json_decode($raw_payload, true);
  $data_obj = $json_data['data'];
  $event = $json_data['event'];
  sort($data_obj['signatureKeys']);
  $headers = getallheaders();
  // Lower case all keys
  $headers = array_change_key_case($headers);
  $kashierSignature = $headers['x-kashier-signature'];
  $data = [];
  foreach ($data_obj['signatureKeys'] as $key) {
      $data[$key] = $data_obj[$key];
  }
  $queryString = http_build_query($data, $numeric_prefix = "",
   $arg_separator = '&', $encoding_type = PHP_QUERY_RFC3986);
  $signature = hash_hmac('sha256', $queryString, $paymentApiKey, false);;
  if ($signature == $kashierSignature) {
      // do some actions
      echo 'valid signature';
      http_response_code();
  } else {
      echo 'invalid signature';
      die();
  }
}
?>
```

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Web;
using System.Web.Mvc;

public class SignatureValidator
{
  public bool ValidateSignature(string requestBody, string receivedSignature, string secretKey)
  {
      string path = "";
      using (JsonDocument document = JsonDocument.Parse(requestBody))
      {
          JsonElement data = document.RootElement.GetProperty("data");

          List<string> signatureKeys = data.GetProperty("signatureKeys")
              .EnumerateArray()
              .Select(key => key.GetString())
              .OrderBy(key => key, StringComparer.Ordinal)
              .ToList();

          foreach (string key in signatureKeys)
          {
              string value = data.GetProperty(key).ToString();
              path = path + "&" + key + "=" + Uri.EscapeDataString(value);
          }
      }
      string message = path.Substring(1);

      System.Text.ASCIIEncoding encoding = new System.Text.ASCIIEncoding();
      byte[] keyByte = encoding.GetBytes(secretKey);
      byte[] messageBytes = encoding.GetBytes(message);
      string computedSignature;
      using (HMACSHA256 hmacsha256 = new HMACSHA256(keyByte))
      {
          byte[] hashmessage = hmacsha256.ComputeHash(messageBytes);
          computedSignature = BitConverter.ToString(hashmessage).Replace("-", "").ToLowerInvariant();
      }
      return receivedSignature != null
          && receivedSignature.Equals(computedSignature, StringComparison.OrdinalIgnoreCase);
  }
}

public class WebhookController : Controller
{
    [HttpPost]
    public ActionResult ReceiveWebhook()
    {
        string requestBody = string.Empty;
        using (var reader = new System.IO.StreamReader(Request.InputStream))
        {
            requestBody = reader.ReadToEnd();
        }
        string receivedSignature = Request.Headers["x-kashier-signature"];
        string secretKey = "YOUR_API_KEY";
        SignatureValidator validator = new SignatureValidator();
        bool isValid = validator.ValidateSignature(requestBody, receivedSignature, secretKey);
        if (isValid)
        {
            // Perform necessary actions
            return Json(new { message = "Valid signature" }, JsonRequestBehavior.AllowGet);
        }
        else
        {
            return Json(new { message = "Invalid signature" }, JsonRequestBehavior.AllowGet);
        }
    }
}
```

## Idempotency [#idempotency]

Kashier de-dupes delivery on `{transactionId}::{webhookUrl}::{status}`, but the same `transactionId` and `status` can still reach you more than once — retries, races, and replays all produce repeats. Design the handler for it:

- Key your processing on `transactionId` + `status`, not on receipt of the request.
- Return `200` fast, before any downstream work.
- Return `409` for an event you have already processed. Kashier counts `409` as delivered and stops retrying.
- Never treat a repeat as a second payment, refund, or fulfilment.

Order-level replays are visible in the payload: a repeated attempt on an already-paid order carries the `ORDER_PAID_BEFORE` code, and a replayed notification arrives as `event: "idempotency"`. Reconcile both against the order you already have rather than creating a new one.

# Webhook management (/docs/webhooks/manage)

Kashier's webhook management module lets you configure **multiple named webhooks** per merchant instead of a single fixed URL. Each webhook is scoped to a mode (`test` or `live`) and subscribed to a specific set of event types, so different endpoints can receive different slices of your traffic — for example, a production endpoint that only cares about `refund` and transfer status changes, and a separate test endpoint your staging environment listens to.

This page covers creating and managing webhooks, looking up delivery records for a transaction or transfer, resending a delivery, and sending a test payload to verify an endpoint is reachable. For the shape of the event payload itself and signature verification, see [Webhook payloads](/docs/webhooks/payloads) and the [Webhooks guide](/docs/webhooks).

All endpoints on this page are merchant-authenticated — send your secret key in the `Authorization` header, the same as everywhere else in the API.

<Callout title="The delivery-records endpoints need a permission too">
  Reading delivery records requires the `webhook.view_webhook` permission, and resending a delivery requires `webhook.resend_webhook`. These are dedicated webhook permissions rather than a side effect of your transaction or transfer access, and they're enforced for merchant users, not only for Kashier staff — a request without them is rejected with `403` even when the key itself is valid. Permission changes are cached for roughly 24 hours, so a newly granted permission may not take effect straight away. The CRUD endpoints (list, create, update, delete) are merchant-gated too, but which privilege they check wasn't pinned down at design time — if one returns `403` on a valid key, ask your Kashier contact which permission your user is missing.
</Callout>

## If you used the old single-URL webhook [#if-you-used-the-old-single-url-webhook]

If your account was set up with Kashier's older single stored webhook URL, there's nothing to re-create. That URL is migrated into webhook management for you, so [List your webhooks](#list-your-webhooks) returns it as a webhook named `Legacy webhook`, subscribed to every event type, with `isActive` carrying over whether the old webhook was enabled and `mode` derived from your account's current mode. It keeps receiving exactly what it received before the migration.

From there it's an ordinary webhook. Rename it, narrow its `events` to the ones you actually handle, add custom `headers`, or switch it off with [Update a webhook](#update-a-webhook). If you want separate test and live destinations, create a second webhook for the other mode rather than flipping this one's `mode` back and forth.

## List your webhooks [#list-your-webhooks]

Returns every webhook configured for your merchant, across both modes.

| Endpoint | Value                                                                              |
| -------- | ---------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/webhooks](https://test-api.kashier.io/v2/webhooks) |
| LIVE-URL | [https://api.kashier.io/v2/webhooks](https://api.kashier.io/v2/webhooks)           |
| Method   | GET                                                                                |

Full parameter and response reference → [List your webhooks](/docs/api-reference/webhooks/listWebhooks).

```bash
curl --location 'https://test-api.kashier.io/v2/webhooks' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="GET" url="https://test-api.kashier.io/v2/webhooks" sendApiKey="false" title="Try it — list your webhooks" />

### Headers [#headers]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response]

```json
[
  {
    "_id": "66a1f2c3e4b0a1234567890a",
    "merchantId": "MID-10293",
    "name": "Orders production endpoint",
    "url": "https://shop.example.com/kashier/webhook",
    "headers": {
      "X-Shop-Token": "whsec_live_abc123",
      "X-Env": "production"
    },
    "events": ["pay", "refund", "void", "TRANSFERRED"],
    "mode": "live",
    "isActive": true,
    "createdAt": "2026-06-22T12:00:00.000Z",
    "updatedAt": "2026-06-22T12:00:00.000Z"
  }
]
```

| Field                     | Description                                                                                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_id`                     | Unique identifier for the webhook — this is the `webhookId` used in [Update a webhook](#update-a-webhook) and [Delete a webhook](#delete-a-webhook). |
| `merchantId`              | The merchant the webhook belongs to.                                                                                                                 |
| `name`                    | Your label for the webhook.                                                                                                                          |
| `url`                     | The endpoint Kashier delivers to.                                                                                                                    |
| `headers`                 | Custom headers Kashier sends with every delivery to this webhook, as a flat string-to-string map.                                                    |
| `events`                  | The event types this webhook is subscribed to — see [Create a webhook](#create-a-webhook) for the full list.                                         |
| `mode`                    | `test` or `live` — the webhook only receives events emitted in this mode.                                                                            |
| `isActive`                | Whether the webhook currently receives deliveries.                                                                                                   |
| `createdAt` / `updatedAt` | Timestamps.                                                                                                                                          |

## Create a webhook [#create-a-webhook]

Creates a new webhook for your merchant.

| Endpoint | Value                                                                              |
| -------- | ---------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/webhooks](https://test-api.kashier.io/v2/webhooks) |
| LIVE-URL | [https://api.kashier.io/v2/webhooks](https://api.kashier.io/v2/webhooks)           |
| Method   | POST                                                                               |

Full parameter and response reference → [Create a webhook](/docs/api-reference/webhooks/createWebhook).

### Body parameters [#body-parameters]

| Key      | Description                                                                                                                                                             |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name     | Your label for the webhook.                                                                                                                                             |
| url      | The endpoint Kashier delivers to. Must be a public `https` URL — non-`https` schemes, `localhost`, loopback, link-local, and private (RFC-1918) addresses are rejected. |
| headers  | Optional. Custom headers to send with every delivery to this webhook, as a flat string-to-string map. Defaults to `{}`.                                                 |
| events   | Array of event types to subscribe this webhook to — see the table below.                                                                                                |
| mode     | `test` or `live`. The webhook only receives events emitted in this mode.                                                                                                |
| isActive | Optional. Whether the webhook is enabled. Defaults to `true`.                                                                                                           |

<Callout title="Max 5 webhooks per mode">
  You can configure up to 5 webhooks per mode (5 `test` + 5 `live` = 10 total). Creating a 6th webhook for a mode that's already at the limit is rejected. This limit is taken from Kashier's webhook-management design documentation rather than a live API response, and is flagged there as still-to-confirm (per-mode vs. global was open at design time). If a 6th webhook is unexpectedly accepted or rejected, treat your account's actual behavior as authoritative.
</Callout>

`events` accepts any of the following values:

| Category               | Values                                                      |
| ---------------------- | ----------------------------------------------------------- |
| Transaction operations | `pay`, `authorize`, `capture`, `refund`, `void`, `reversal` |
| Transfer statuses      | `INITIATED`, `IN_TRANSIT`, `TRANSFERRED`, `FAILED`          |

The mixed casing is deliberate — each value matches the producing service's own literal, so transaction operations are lowercase and transfer statuses uppercase. Send them exactly as written.

<Callout type="warn" title="Subscribing to refund does not cover partial refunds">
  The subscribable list holds base operations only, and matching is exact. A transaction whose operation is `partial_refund` does not match a `refund` subscription, so a webhook subscribed to `refund` won't be delivered that transaction. A [per-request destination](/docs/webhooks#step-2-point-kashier-at-your-endpoint) is not event-filtered and still receives it. The same applies to any other operation outside the list above.
</Callout>

<Callout title="Not every transfer status is subscribable">
  The subscribable list is narrower than the full transfer lifecycle. `PENDING` (and, for batches, `PARTIALLY_TRANSFERRED`) appear in the [payout status values](/docs/payouts/webhook#status-values) but aren't subscribable here, so a transfer entering one of them won't trigger a delivery. If you need a status that isn't listed, use the create-webhook "Try it" panel below to confirm the accepted set against your own account before assuming it's unavailable.
</Callout>

<Callout type="warn" title="One webhook, two signing keys">
  Transaction events and transfer events are signed with **different keys and different serializations**, so a webhook subscribed to both — like the example below — needs two verifiers and has to pick one based on the event it received.

- **Transaction events** are signed with your **Payment API Key** for the webhook's mode: your test key signs `test`-mode deliveries, your live key signs `live` ones. The signed string sorts `signatureKeys` alphabetically and URL-encodes each value. See [signature verification](/docs/webhooks#step-4-verify-the-signature).
- **Transfer events** are signed with your **Transfer API Key**, over that payload's own `signatureKeys` in array order with **raw, un-encoded** values. See [Payout webhooks](/docs/payouts/webhook#verification-process).

Reusing one verifier for both produces the wrong hash for one of them.
</Callout>

```bash
curl --location 'https://test-api.kashier.io/v2/webhooks' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "Orders staging endpoint",
    "url": "https://your-website.com/kashier-webhook",
    "headers": {
      "X-Shop-Token": "replace-with-your-own-token",
      "X-Env": "staging"
    },
    "events": ["pay", "refund", "void", "TRANSFERRED"],
    "mode": "test",
    "isActive": true
  }'
```

For a production webhook, send the same body with `"mode": "live"` to `https://api.kashier.io/v2/webhooks` using your live secret key — keep `mode` and the host you call in step rather than creating a `live` webhook from the test host.

<Callout type="warn" title="This panel creates a real webhook">
  Unlike the read-only panels on this page, sending this one leaves persistent state on the account whose keys you saved: a webhook that stays there until you delete it, and that counts against the 5-per-mode limit above. The body below is deliberately defanged — `mode` is `test`, `isActive` is `false`, and the URL is a placeholder — so nothing is ever delivered anywhere. Delete it afterwards with [Delete a webhook](#delete-a-webhook), using the `_id` from the response.
</Callout>

<ApiTryIt
  method="POST"
  url="https://test-api.kashier.io/v2/webhooks"
  body="{
  name: 'Docs playground webhook',
  url: 'https://your-website.com/kashier-webhook',
  headers: {
    'X-Shop-Token': 'replace-with-your-own-token',
    'X-Env': 'docs-playground',
  },
  events: ['pay', 'refund', 'void', 'TRANSFERRED'],
  mode: 'test',
  isActive: false,
}"
  sendApiKey="false"
  title="Try it — create a webhook"
/>

### Headers [#headers-1]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-1]

Returns the created webhook, in the same shape as an entry in [List your webhooks](#list-your-webhooks).

## Update a webhook [#update-a-webhook]

Updates an existing webhook. Send only the fields you want to change.

| Endpoint | Value                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/webhooks/:webhookId](https://test-api.kashier.io/v2/webhooks/:webhookId) |
| LIVE-URL | [https://api.kashier.io/v2/webhooks/:webhookId](https://api.kashier.io/v2/webhooks/:webhookId)           |
| Method   | PUT                                                                                                      |

Full parameter and response reference → [Update a webhook](/docs/api-reference/webhooks/updateWebhook).

### Body parameters [#body-parameters-1]

Same fields as [Create a webhook](#create-a-webhook) — `name`, `url`, `headers`, `events`, `mode`, `isActive` — all optional on update. The `https`-only URL rule applies here too. Changing `mode` re-checks the 5-per-mode limit against the target mode.

```bash
curl --location --request PUT 'https://test-api.kashier.io/v2/webhooks/:webhookId' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "isActive": false
  }'
```

<ApiTryIt method="PUT" url="https://test-api.kashier.io/v2/webhooks/:webhookId" body="{ isActive: false }" sendApiKey="false" title="Try it — update a webhook" />

### Headers [#headers-2]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-2]

Returns the updated webhook, in the same shape as an entry in [List your webhooks](#list-your-webhooks).

## Delete a webhook [#delete-a-webhook]

Removes a webhook. There's no undo — deliveries already recorded against it stay visible in delivery records.

| Endpoint | Value                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/webhooks/:webhookId](https://test-api.kashier.io/v2/webhooks/:webhookId) |
| LIVE-URL | [https://api.kashier.io/v2/webhooks/:webhookId](https://api.kashier.io/v2/webhooks/:webhookId)           |
| Method   | DELETE                                                                                                   |

Full parameter and response reference → [Delete a webhook](/docs/api-reference/webhooks/deleteWebhook).

```bash
curl --location --request DELETE 'https://test-api.kashier.io/v2/webhooks/:webhookId' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="DELETE" url="https://test-api.kashier.io/v2/webhooks/:webhookId" sendApiKey="false" title="Try it — delete a webhook" />

### Headers [#headers-3]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

## Get delivery records for a transaction [#get-delivery-records-for-a-transaction]

Returns the delivery log for a given transaction — every webhook attempt made for it, across all your configured webhooks, plus any per-session webhook you passed directly on that transaction.

| Endpoint | Value                                                                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/webhooks/records/transaction/:transactionId](https://test-api.kashier.io/v2/webhooks/records/transaction/:transactionId) |
| LIVE-URL | [https://api.kashier.io/v2/webhooks/records/transaction/:transactionId](https://api.kashier.io/v2/webhooks/records/transaction/:transactionId)           |
| Method   | GET                                                                                                                                                      |

Full parameter and response reference → [Get delivery records for a transaction](/docs/api-reference/webhooks/getWebhookRecordsForTransaction).

```bash
curl --location 'https://test-api.kashier.io/v2/webhooks/records/transaction/:transactionId' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<Callout type="warn" title="Not live on the test environment yet">
  Calling this route on `test-api.kashier.io` currently returns a `404`, so there's no "Try it" panel for it yet.
</Callout>

### Headers [#headers-4]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-3]

```json
{
  "success": true,
  "body": [
    {
      "resourceType": "transaction",
      "resourceId": "TX-249893963",
      "webhookId": "66a1f2c3e4b0a1234567890a",
      "eventType": "pay",
      "mode": "live",
      "url": "https://shop.example.com/kashier/webhook",
      "status": "delivered",
      "attempts": 1,
      "payload": { "...": "allow-listed fields only" },
      "responses": [
        { "status": 200, "body": "OK", "date": "2026-06-22T12:00:01.000Z" }
      ],
      "isServerWebhook": false,
      "isTest": false,
      "createdAt": "2026-06-22T12:00:00.000Z",
      "updatedAt": "2026-06-22T12:00:01.000Z"
    }
  ]
}
```

| Field             | Description                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `resourceType`    | `transaction` for records returned here.                                                                                                                                             |
| `resourceId`      | The transaction ID this delivery relates to.                                                                                                                                         |
| `webhookId`       | The webhook this delivery came from, or `null` if it was a per-session webhook passed directly on the transaction.                                                                   |
| `eventType`       | The event that triggered this delivery.                                                                                                                                              |
| `mode`            | `test` or `live`.                                                                                                                                                                    |
| `url`             | The destination URL the delivery was sent to.                                                                                                                                        |
| `status`          | Delivery status — `pending`, `delivered`, `retrying`, or `failed`. A record sits in `retrying` between backoff attempts and only reaches `failed` once the attempt cap is exhausted. |
| `attempts`        | Number of delivery attempts recorded.                                                                                                                                                |
| `payload`         | The request body sent, projected to a fixed, always-visible field set. Custom `headers` you configured are never included in this response.                                          |
| `responses`       | One entry per attempt: the receiving endpoint's `status`, `body`, and `date`.                                                                                                        |
| `isServerWebhook` | `true` if this delivery went to a per-session webhook rather than a configured webhook.                                                                                              |
| `isTest`          | `true` if this record came from [Test a webhook](#test-a-webhook) rather than a real delivery.                                                                                       |

## Get delivery records for a transfer [#get-delivery-records-for-a-transfer]

Same records lookup as above, scoped to a transfer instead of a transaction.

| Endpoint | Value                                                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/webhooks/records/transfer/:transferId](https://test-api.kashier.io/v2/webhooks/records/transfer/:transferId) |
| LIVE-URL | [https://api.kashier.io/v2/webhooks/records/transfer/:transferId](https://api.kashier.io/v2/webhooks/records/transfer/:transferId)           |
| Method   | GET                                                                                                                                          |

Full parameter and response reference → [Get delivery records for a transfer](/docs/api-reference/webhooks/getWebhookRecordsForTransfer).

```bash
curl --location 'https://test-api.kashier.io/v2/webhooks/records/transfer/:transferId' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<Callout type="warn" title="Not live on the test environment yet">
  Calling this route on `test-api.kashier.io` currently returns a `404`, so there's no "Try it" panel for it yet.
</Callout>

### Headers [#headers-5]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-4]

Same shape as [Get delivery records for a transaction](#get-delivery-records-for-a-transaction), except `resourceType` is `transfer`, `resourceId` is the transfer ID, and `eventType` is one of the transfer status values (`INITIATED`, `IN_TRANSIT`, `TRANSFERRED`, `FAILED`).

## Resend a delivery [#resend-a-delivery]

Re-sends a previously recorded delivery — the original stored request, byte-for-byte, including its original signature — to the same URL. Useful after fixing an endpoint that was down or returning errors. The outcome is written to a new record; the original record is never modified, so your delivery history stays intact.

A record can be resent from any status, including `delivered`. The endpoint takes no request body — everything it needs comes from `recordId` in the path.

| Endpoint | Value                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| TEST-URL | [https://test-api.kashier.io/v2/webhooks/records/:recordId/resend](https://test-api.kashier.io/v2/webhooks/records/:recordId/resend) |
| LIVE-URL | [https://api.kashier.io/v2/webhooks/records/:recordId/resend](https://api.kashier.io/v2/webhooks/records/:recordId/resend)           |
| Method   | POST                                                                                                                                 |

Full parameter and response reference → [Resend a delivery](/docs/api-reference/webhooks/resendWebhookRecord).

<Callout title="30-second cooldown">
  Resending the same record again within 30 seconds returns `429`. Wait for the cooldown to clear before retrying.
</Callout>

```bash
curl --location --request POST 'https://test-api.kashier.io/v2/webhooks/records/:recordId/resend' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<ApiTryIt method="POST" url="https://test-api.kashier.io/v2/webhooks/records/:recordId/resend" sendApiKey="false" title="Try it — resend a delivery" />

### Headers [#headers-6]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-5]

```json
{
  "recordId": "66a20a1ce4b0a1234567891b",
  "clonedFromRecordId": "66a1f2c3e4b0a1234567890c",
  "status": "delivered",
  "attempts": 1,
  "lastResponseStatus": 200
}
```

| Field                | Description                                                                  |
| -------------------- | ---------------------------------------------------------------------------- |
| `recordId`           | ID of the new delivery record created for this resend.                       |
| `clonedFromRecordId` | ID of the original record this resend replayed.                              |
| `status`             | Outcome of the resend, e.g. `delivered` or `failed`.                         |
| `attempts`           | Attempts recorded on the new record (always `1` immediately after a resend). |
| `lastResponseStatus` | HTTP status your endpoint returned for the resend attempt.                   |

## Test a webhook [#test-a-webhook]

Sends a signed sample payload to a webhook's configured URL so you can confirm the endpoint is reachable and your signature verification works — without waiting for a real event. The test delivery is recorded like any other delivery, but flagged `isTest: true` so it's distinguishable in your delivery history.

| Endpoint | Value                                                                                                |
| -------- | ---------------------------------------------------------------------------------------------------- |
| TEST-URL | [https://test-api.kashier.io/v2/webhooks/:id/test](https://test-api.kashier.io/v2/webhooks/:id/test) |
| LIVE-URL | [https://api.kashier.io/v2/webhooks/:id/test](https://api.kashier.io/v2/webhooks/:id/test)           |
| Method   | POST                                                                                                 |

Full parameter and response reference → [Test a webhook](/docs/api-reference/webhooks/testWebhook).

```bash
curl --location --request POST 'https://test-api.kashier.io/v2/webhooks/:id/test' \
  --header 'Authorization: YOUR_TEST_SECRET_KEY'
```

<Callout type="warn" title="Not live on the test environment yet">
  Calling this route on `test-api.kashier.io` currently returns a `404`, so there's no "Try it" panel for it yet. Until then, verify an endpoint by running a real test-mode payment against it and reading the outcome from your own server logs.
</Callout>

### Headers [#headers-7]

| Key           | Description                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authorization | The Authorization is a secret key that is used to identify the merchant. You can obtain it from Kashier's dashboard. Learn more about [Authorization](/docs/dashboard-api/authentication). |

### Response [#response-6]

```json
{
  "success": true,
  "statusCode": 200,
  "responseBody": "OK",
  "latencyMs": 184
}
```

| Field          | Description                                             |
| -------------- | ------------------------------------------------------- |
| `success`      | `true` if your endpoint returned a 2xx status.          |
| `statusCode`   | HTTP status your endpoint returned.                     |
| `responseBody` | A truncated snippet of your endpoint's response body.   |
| `latencyMs`    | Round-trip time for the test delivery, in milliseconds. |

## Next steps [#next-steps]

<Cards>
  <Card title="Webhooks guide" href="/docs/webhooks" description="Endpoint setup, acknowledgement, and signature verification." />

  <Card title="Webhook payloads" href="/docs/webhooks/payloads" description="Event types, payload fields, and signatureKeys reference." />

  <Card title="Payout webhooks" href="/docs/payouts/webhook" description="Transfer event payloads and the Transfer API Key signature recipe." />
</Cards>

# Webhook payloads (/docs/webhooks/payloads)

Field-level reference for the event objects Kashier sends. For endpoint setup, acknowledgement, and signature verification, see the [Webhooks guide](/docs/webhooks).

## Events [#events]

The `event` field is the transaction operation, set verbatim. Events:

- `pay`
- `authorize`
- `capture`
- `refund`
- `partial_refund`
- `void`
- `reject`
- `reversal`

These are the values Kashier sets on a delivered event. The set you can **subscribe** a configured webhook to is narrower — see [Create a webhook](/docs/webhooks/manage#create-a-webhook).

<Callout type="warn" title="Branch on status, not on event">
  `event` is not a success signal. A webhook also fires when the operation fails: the `event` is unchanged and `data.status` is `FAILURE`. Read `data.status` — `SUCCESS`, `FAILURE`, or `PENDING` — to decide the outcome. Never treat the arrival of a `pay` event as a completed payment. `status` is the transaction status, not the order status.
</Callout>

## Event payload [#event-payload]

Each event is structured as an Event object with a `data` payload that contains the transaction details.

```json
{
  "event": "pay",
  "data": {
    "merchantOrderId": "1642935044835",
    "kashierOrderId": "efb3d440-e3bf-4c86-b98e-c7bb1cbbcca1",
    "orderReference": "TEST-ORD-33581",
    "transactionId": "TX-249893122",
    "status": "SUCCESS",
    "method": "card",
    "creationDate": "2022-01-23T10:50:54.261Z",
    "amount": 11334,
    "currency": "EGP",
    "card": {
      "cardInfo": {
        "cardHolderName": "John Doe",
        "cardBrand": "Mastercard",
        "maskedCard": "511111******1118"
      },
      "merchant": { "merchantRedirectURL": "http://localhost:9000/callback" },
      "amount": 11334,
      "currency": "EGP"
    },
    "metaData": { "time": "2022-01-23T10:50:52.562Z" },
    "transactionResponseCode": "00",
    "transactionResponseMessage": { "en": "Approved", "ar": "تمت الموافقة" },
    "channel": "online | e-commerce",
    "merchantDetails": { "businessEmail": "billing@example.com" },
    "signatureKeys": [
      "amount",
      "channel",
      "currency",
      "kashierOrderId",
      "merchantOrderId",
      "method",
      "orderReference",
      "status",
      "transactionId",
      "transactionResponseCode"
    ],
    "platform": {}
  }
}
```

## Field notes [#field-notes]

- `merchantOrderId` — pass this key back to Kashier to reconcile your orders. Learn more about [order reconciliation](/docs/accept-payments/order-reconciliation).
- `settlementInfo` — per-transaction fee and settlement reconciliation block: `vat`, `sellingRate`, `sellingFlat`, `totalSellingRate`, `totalSellingFees`, `settledAmount`.
- `posSerialNumber`, `posTerminalId`, `posBranchName` — identify the physical POS device, terminal, and branch on POS-originated transactions. Present only when the transaction came through a POS channel.
- `installmentPlan` — installment plan details when the transaction was paid via an installment plan (e.g. valU, bank installments).
- `card` — present only when `method` is `card`. Carries the masked `cardInfo` (`cardHolderName`, `cardBrand`, `maskedCard`) and `merchant.merchantRedirectURL`. This is where masked card details arrive.
- `sourceOfFunds` — source-of-funds detail. It does not carry card tokens or 3DS redirect details, so don't build against them. Read masked card details from `card.cardInfo` instead.
- `merchantDetails` — merchant identification, including your `businessEmail`.
- `apikeyname` — the name of the API key the transaction was created with, useful when you run several keys across stores or environments.
- `paymentMethod` and `channel` — the method object and the channel the payment came through (e.g. `online`, `e-commerce`).
- `originDetails` — origin detail for the transaction.
- `platform` — the originating platform. Empty for direct API integrations, populated for platform-originated orders such as ecommerce plugins, so don't assume `{}`.
- `signatureKeys` — the keys of the `data` object that Kashier used to compute the HMAC signature for this request. Sort the array alphabetically, select those keys and their values from `data`, and build the signature payload from them. Verify the result against the `x-kashier-signature` header — see [signature verification](/docs/webhooks#step-4-verify-the-signature).
- `hash` — an internal Kashier integrity field (sent for non-Wix platforms), not a merchant-facing signature. It's signed with a server-side secret you don't hold, so **do not attempt to verify it**. Always verify webhooks using `x-kashier-signature` as described above; ignore `data.hash` if present.

# CS-Cart (/docs/plugins/cs-cart)

<img alt="CS-Cart logo" src="__img0" />

Accept Kashier payments on your CS-Cart store — debit card, credit card, bank installments (with 3D Secure), and all supported wallets. Customers pay on your site; the plugin works across all browsers and is compatible with the latest version of CS-Cart.

## Prerequisites [#prerequisites]

- Log in to the [Kashier platform](https://merchant.kashier.io/login)
- Navigate to the "Integrate now" page
- Click on "Generate" for the customizable form service

## Integration [#integration]

The CS-Cart Kashier plugin is developed using [payment sessions](/docs/accept-payments/payment-sessions).

Features:

1. **Embedded checkout.** Customers pay on your site via a Payment Session, no redirect.
2. Supports multiple payment methods: Card, Bank Installment, and Wallet.

Download the plugin and follow the installation steps from our [GitHub](https://github.com/Kashier-payments/kashier-cs-cart-plugin).

# E-commerce plugins (/docs/plugins)

Add Kashier to your e-commerce store with a ready-made plugin — no custom integration. Every plugin accepts debit and credit cards, bank installments (with 3D Secure), and all supported wallets.

## Available integrations [#available-integrations]

1. [WooCommerce Kashier Payment Gateway plugin](/docs/plugins/woocommerce)
2. [PrestaShop](/docs/plugins/prestashop)
3. [Magento 2.3](/docs/plugins/magento)
4. [OpenCart](/docs/plugins/opencart)
5. [Shopify plugin](/docs/plugins/shopify)
6. [CS-Cart](/docs/plugins/cs-cart)
7. [Odoo 15](/docs/plugins/odoo)
8. [VikBooking and VikAppointments](/docs/plugins/vik-booking)
9. [WHMCS](/docs/plugins/whmcs)
10. [Wix](/docs/plugins/wix)
11. [Booking BA](https://ba-booking.com/shop/downloads/babe-payment-kashier)

# Magento (/docs/plugins/magento)

<img alt="Magento logo" src="__img0" />

Accept Kashier payments on your Magento store — debit card, credit card, bank installments (with 3D Secure), and all supported wallets. Customers pay on your site without being redirected; the extension works across all browsers and is compatible with the latest versions of Magento.

## Prerequisites [#prerequisites]

- Log in to the [Kashier platform](https://merchant.kashier.io/login)
- Navigate to the "Integrate now" page
- Click on "Generate" for the customizable form service

## Integration [#integration]

The Magento Kashier plugin is developed using [payment sessions](/docs/accept-payments/payment-sessions).

Features:

1. **Embedded checkout.** Customers pay on your site via a Payment Session, no redirect.
2. Supports multiple payment methods: Card, Bank Installment, and Wallet.

Download the plugin and follow the installation steps from our [GitHub](https://github.com/Kashier-payments/Kashier_Magento_2.3x_Plugin).

# Odoo (/docs/plugins/odoo)

<img alt="Odoo logo" src="__img0" />

Accept Kashier payments on your Odoo eCommerce store — debit card, credit card, bank installments (with 3D Secure), and all supported wallets. Customers pay on your site through an embedded Payment Session, with no redirects.

The add-on is published per Odoo version — install the branch that matches your server:

| Odoo version | Add-on                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------- |
| Odoo 16      | [`v16` branch](https://github.com/Kashier-payments/Kashier-Odoo-Payment-Add-on/tree/v16) |
| Odoo 15      | [`v15` branch](https://github.com/Kashier-payments/Kashier-Odoo-Payment-Add-on/tree/v15) |

Running a newer Odoo? [Contact support](/docs/resources/support) for current availability.

## Prerequisites [#prerequisites]

- Log in to the [Kashier platform](https://merchant.kashier.io/login)
- Navigate to **Integrate now → Payment API keys** and copy (or generate) a test API key
- Copy your merchant ID (`MID-...`), shown under your username
- Enter both in the add-on's configuration page (**Invoicing → Configuration → Payments → Payment Acquirers**)

## Integration [#integration]

The Odoo Kashier plugin is developed using [payment sessions](/docs/accept-payments/payment-sessions).

Features:

1. **Embedded checkout.** Customers pay on your site via a Payment Session, no redirect.
2. No redirects.
3. Supports multiple payment methods: Card, Bank Installments, and Wallet.

Download the plugin and follow the installation steps from our [GitHub](https://github.com/Kashier-payments/Kashier-Odoo-Payment-Add-on).

# OpenCart (/docs/plugins/opencart)

<img alt="OpenCart logo" src="__img0" />

Accept Kashier payments on your OpenCart store — debit card, credit card, bank installments (with 3D Secure), and all supported wallets. Customers pay on your site without being redirected; the extension works across all browsers and is compatible with the latest version of OpenCart.

## Prerequisites [#prerequisites]

- Log in to the [Kashier platform](https://merchant.kashier.io/login)
- Navigate to the "Integrate now" page
- Click on "Generate" for the customizable form service

## Integration [#integration]

The OpenCart Kashier plugin is developed using [payment sessions](/docs/accept-payments/payment-sessions).

Features:

1. **Embedded checkout.** Customers pay on your site via a Payment Session, no redirect.
2. Supports multiple payment methods: Card, Bank Installment, and Wallet.

Download the plugin and follow the installation steps from our [GitHub](https://github.com/Kashier-payments/kashier-openCart-plugin).

# PrestaShop (/docs/plugins/prestashop)

<img alt="PrestaShop logo" src="__img0" />

Accept Kashier payments on your PrestaShop store — debit card, credit card, bank installments (with 3D Secure), and all supported wallets. Customers pay on your site without being redirected; the module works across all browsers and is compatible with the latest version of PrestaShop.

Supported PrestaShop versions:

- [PrestaShop 1.7.x](https://github.com/Kashier-payments/kashier-prestashop-1.7)
- [PrestaShop 1.6.x](https://github.com/Kashier-payments/kashier-prestashop-1.6)

## Prerequisites [#prerequisites]

- Log in to the [Kashier platform](https://merchant.kashier.io/login)
- Navigate to the "Integrate now" page
- Click on "Generate" for the customizable form service

## Integration [#integration]

The PrestaShop Kashier plugin is developed using [payment sessions](/docs/accept-payments/payment-sessions).

Features:

1. **Embedded checkout.** Customers pay on your site via a Payment Session, no redirect.
2. Supports multiple payment methods: Card, Bank Installment, and Wallet.

Download the plugin and follow the installation steps from our [GitHub](https://github.com/Kashier-payments/kashier-prestashop-1.7):

- [PrestaShop 1.7.x](https://github.com/Kashier-payments/kashier-prestashop-1.7)
- [PrestaShop 1.6.x](https://github.com/Kashier-payments/kashier-prestashop-1.6)

# Shopify (/docs/plugins/shopify)

<img alt="Shopify logo" src="__img0" />

Accept Kashier payments on your Shopify store by installing the Kashier Online Payments app from the Shopify marketplace.

## Features [#features]

- Fully PCI DSS compliant as a Level 1 Service for merchants operating in Egypt.
- **Embedded checkout.** Customers pay on your site via a [Payment Session](/docs/accept-payments/payment-sessions), no redirect.
- 3D Secure card authentication support.
- Supports multiple payment methods:
  1. Card payments
  2. Wallet payments
  3. Bank installments payment
- Supports acquiring multiple currencies: "EGP, USD, GBP, EUR".
- Plug and play.

## Prerequisites [#prerequisites]

- Account on the [Kashier platform](https://merchant.kashier.io/login)
- A store on [Shopify](https://www.shopify.com/).
- In case of test mode, make sure your email is verified.

<Callout title="Note">
  Test mode is available on the Shopify integration.
</Callout>

## Integration steps [#integration-steps]

- Navigate to the [Kashier Online Payment app](https://apps.shopify.com/kashier-online-payments) in the Shopify marketplace.
- Make sure you are logged in to your Shopify store.
- Click the "Add App" button to start the installation to your Shopify website.

## Installation steps [#installation-steps]

- Go to the Kashier app page on Shopify.

<img alt="Shopify step 1" src="__img1" />

- Click on the "Install" button as shown below.

<img alt="Shopify step 2" src="__img2" />

- This will redirect you to the Kashier app configuration page to fill in some configuration keys as shown below. Learn more about obtaining your [merchant ID and keys](/docs/get-started/api-keys).

<img alt="Shopify step 3" src="__img3" />

- After filling in the required configuration keys, click the "Return to shopify" button.

<img alt="Shopify step 4" src="__img4" />

- This will redirect you to the Kashier settings page in your Shopify store.
- Click the "Activate" button as shown below.

<img alt="Shopify step 5" src="__img5" />

You have now finished installing the latest Kashier Shopify plugin and can start accepting payments.

# VikBooking and VikAppointments (/docs/plugins/vik-booking)

<img alt="Vikwp logo" src="__img0" />

Accept Kashier payments on your WordPress [Vikwp](https://vikwp.com) site ([VikBooking](https://vikwp.com/plugin/vikbooking), [VikAppointments](https://vikwp.com/plugin/vikappointments)) — debit card, credit card, bank installments (with 3D Secure), and all supported wallets. Customers pay on your site without being redirected; the module works across all browsers and is compatible with the latest version of Vikwp.

## Prerequisites [#prerequisites]

- Log in to the [Kashier platform](https://merchant.kashier.io/login)
- Navigate to the "Integrate now" page
- Click on "Generate" for the customizable form service

## Integration [#integration]

The Vikwp Kashier plugin is developed using [payment sessions](/docs/accept-payments/payment-sessions).

Features:

1. **Embedded checkout.** Customers pay on your site via a Payment Session, no redirect.
2. Supports multiple payment methods: Card, Bank Installments, and Wallet.

Download the plugin and follow the installation steps from our [GitHub](https://github.com/Kashier-payments/Kashier-Vikwp-UI-Plugin).

# WHMCS (/docs/plugins/whmcs)

<img alt="WHMCS logo" src="__img0" />

Accept Kashier payments in WHMCS — debit card, credit card, bank installments (with 3D Secure), and all supported wallets. Customers pay on your site; the extension works across all browsers and is compatible with the latest versions of WHMCS.

## Prerequisites [#prerequisites]

- Log in to the [Kashier platform](https://merchant.kashier.io/login)
- Navigate to the "Integrate now" page
- Click on "Generate" for the customizable form service

## Integration [#integration]

The WHMCS Kashier plugin is developed using [payment sessions](/docs/accept-payments/payment-sessions).

Features:

1. **Embedded checkout.** Customers pay on your site via a Payment Session, no redirect.
2. Supports multiple payment methods: Card, Bank Installments, and Wallet.

Download the plugin and follow the installation steps from our [GitHub](https://github.com/Kashier-payments/Kashier-Whmcs-Plugin).

# Wix (/docs/plugins/wix)

Accept Kashier payments on your Wix site by connecting Kashier from the Wix dashboard. The connection uses the Kashier hosted payment page, so there is nothing to install and no code to write.

## Features [#features]

- Hosted payment page (HPP) integration.
- Supports multiple payment methods:
  1. Card payments
  2. Wallet payments
  3. Bank installments payment
- Supports acquiring multiple currencies: "EGP, USD, GBP, EUR".

## Prerequisites [#prerequisites]

- A live account on the [Kashier platform](https://merchant.kashier.io/login).
- A Premium Wix site.

<Callout type="warn" title="No test mode">
  Test mode is not available on the Wix integration.
</Callout>

## Connect Kashier [#connect-kashier]

In your Wix dashboard:

1. Go to Settings → Accept Payments → See More Payment Options.
2. Select Kashier, then click Connect.
3. Enter your merchant ID and API key. Learn more about obtaining your [merchant ID and keys](/docs/get-started/api-keys).

## Reason codes on Wix [#reason-codes-on-wix]

Kashier translates its own `transactionResponseCode` into a separate, Wix-specific reason code before notifying Wix. A transaction record on the Wix side shows the Wix code, not the Kashier code documented in [payment reason codes](/docs/accept-payments/payment-reason-codes).

| Kashier code                         | Wix code                 | Meaning                                                                                |
| ------------------------------------ | ------------------------ | -------------------------------------------------------------------------------------- |
| `00`                                 | `0`                      | Approved                                                                               |
| `14`                                 | `3015`                   | Invalid card information                                                               |
| `33`, `54`                           | `3013`                   | Expired card                                                                           |
| `36`                                 | `5002`                   | Restricted card                                                                        |
| `51`                                 | `3028`                   | Insufficient funds                                                                     |
| `55`                                 | `3036`                   | Wrong PIN                                                                              |
| `61`, `65`                           | `3019`                   | Limit exceeded                                                                         |
| `97`                                 | `3016`                   | CVV mismatch                                                                           |
| `05`                                 | `3016`, `3011` or `3000` | Do not honor. `3016` when CVV did not match, `3011` when it matched, `3000` otherwise. |
| `N`                                  | `3016`                   | 3D Secure authentication outcome                                                       |
| `P`, `U`                             | `3004`                   | 3D Secure authentication outcome                                                       |
| `M`, `S`, `X`                        | `3011`                   | 3D Secure authentication outcome                                                       |
| `AUTHENTICATION_FAILED`, `ACS_ERROR` | `3004`                   | 3D Secure failure                                                                      |
| `CARD_NOT_ENROLLED`                  | `3005`                   | Card not enrolled in 3D Secure                                                         |
| Anything unmapped                    | `3000`                   | Fallback                                                                               |

## Refund amounts are in minor units [#refund-amounts-are-in-minor-units]

Refund notifications sent to Wix carry `event.refund.amount` in **minor units** — the refund amount multiplied by 100. A 250.00 EGP refund is sent as `25000`. This differs from the standard Kashier webhook, where `data.amount` is the plain order amount. If a refund on your Wix side looks 100 times too large, check that you are reading the value as minor units.

# WooCommerce (/docs/plugins/woocommerce)

<img alt="WooCommerce logo" src="__img0" />

Accept Kashier payments on your WooCommerce store — cards, wallets, bank installments (with 3D Secure), and BNPL. There are three Kashier plugins for WooCommerce; pick the one that matches your checkout setup.

| Plugin               | Use it when                                                                               | Repository                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Classic checkout     | Your store uses the standard WooCommerce checkout flow                                    | [Kashier-WooCommerce-UI-Plugin](https://github.com/Kashier-payments/Kashier-WooCommerce-UI-Plugin)     |
| Block-based checkout | Your store uses the WooCommerce block editor checkout                                     | [Kashier-Block-Based-Woocommerce](https://github.com/Kashier-payments/Kashier-Block-Based-Woocommerce) |
| Embedded form        | You need the form embedded in your page, connected accounts, or WooCommerce Subscriptions | Contact [support](/docs/resources/support)                                                             |

## Prerequisites [#prerequisites]

All plugins need your Kashier credentials:

- Log in to the [Kashier dashboard](https://merchant.kashier.io/login)
- Navigate to the **Integration** page
- Copy your API key and secret key; you enter them in the plugin settings after installation.

## Classic checkout [#classic-checkout]

Embedded checkout for the standard WooCommerce checkout flow, built on [payment sessions](/docs/accept-payments/payment-sessions).

- Payment methods: card, wallet, bank installments, valU, Souhoola, Aman
- Apple Pay enabled on the live environment
- Currencies: EGP, USD, GBP, EUR
- Requires WooCommerce 2.6+ (plugin v4.0.0)

### Install it [#install-it]

1. Download [Kashier-WooCommerce-Plugin-master.zip](https://raw.githubusercontent.com/Kashier-payments/Kashier-WooCommerce-UI-Plugin/main/Kashier-WooCommerce-Plugin-master.zip).
2. On WooCommerce 8 or above, first enable HPOS: **WooCommerce → Settings → Advanced → Features**.
3. In WordPress, go to **Plugins → Add New → Upload Plugin**, upload the ZIP, and activate it.
4. Go to **WooCommerce → Settings → Payments**. The plugin adds three Kashier payment methods; enable the ones you want to offer.
5. Open each enabled method's configuration and enter your **Merchant ID**, **API key**, and **Secret key** from the [dashboard](https://merchant.kashier.io/en/dashboard/integration).
6. Tick **Enable**, leave **test mode** on while you are testing, set the title and description customers will see, and save.
7. Place an order on your store and pay with a [test card](/docs/get-started/testing) to confirm the flow end to end.

To go live, swap in your live API key and secret key and untick test mode — see
[going live](/docs/get-started/going-live).

<Callout title="Optional: charge in EGP while displaying another currency">
  The plugin has an **Enforce EGP Payment** setting. Turn it on to settle every
  Kashier payment in EGP regardless of the currency your storefront displays; you
  then supply the exchange rate from your display currency to EGP, which must be
  greater than 1.
</Callout>

Screenshots for each step are in the
[Kashier-WooCommerce-UI-Plugin repository](https://github.com/Kashier-payments/Kashier-WooCommerce-UI-Plugin).

## Block-based checkout [#block-based-checkout]

Embedded checkout for the WooCommerce block editor checkout experience, built on [payment sessions](/docs/accept-payments/payment-sessions).

- Payment methods: card, wallet, bank installments, valU, Souhoola, Aman, Mogo, Tru
- Apple Pay enabled on the live environment
- Currencies: EGP, USD, GBP, EUR
- Requires WooCommerce 8.0+ and WordPress 6.0+ (plugin v2.1.4)
- On WooCommerce 8+, enable the HPOS feature first: **WooCommerce → Settings → Advanced → Features** (the repository shows the exact screen)

### Install it [#install-it-1]

The steps match the classic plugin above, with a different package:

1. Download [Kashier-Block-Based-WooCommerce-Plugin.zip](https://raw.githubusercontent.com/Kashier-payments/Kashier-Block-Based-Woocommerce/main/Kashier-Block-Based-WooCommerce-Plugin.zip).
2. Enable HPOS: **WooCommerce → Settings → Advanced → Features**.
3. **Plugins → Add New → Upload Plugin**, upload the ZIP, activate.
4. **WooCommerce → Settings → Payments** — enable the Kashier methods you want.
5. Enter your Merchant ID, API key, and Secret key from the [dashboard](https://merchant.kashier.io/en/dashboard/integration), keep test mode on, and save.
6. Place a test order to confirm the flow.

Screenshots for each step are in the
[Kashier-Block-Based-Woocommerce repository](https://github.com/Kashier-payments/Kashier-Block-Based-Woocommerce).

## Embedded form [#embedded-form]

A customized embedded form integration:

- Embedded form on your own checkout page
- [Connected accounts](/docs/accept-payments/connected-accounts)
- [WooCommerce Subscriptions](https://woocommerce.com/products/woocommerce-subscriptions) payments and tokenization

The embedded form plugin is distributed by the Kashier team — [contact support](/docs/resources/support) to get the package and installation guide.

# List payment sessions (/docs/api-reference/payment-sessions/listPaymentSessions)

Lists the payment sessions on your merchant account — the sessions you created, in whatever state they reached. Use it to sweep up sessions your own records lost track of; to poll one particular se…

# Create payment session (/docs/api-reference/payment-sessions/createPaymentSession)

Creates a payment session. The response contains a sessionUrl that is used to redirect the customer to the payment page — you can use it as the src attribute in a link or iframe.

# Get payment session by id (/docs/api-reference/payment-sessions/getPaymentSessionById)

Returns the session document for one session — its current status, the payment parameters it was created with, and its history of state changes. This endpoint takes no credential. It is the read th…

# Abandon a payment session (/docs/api-reference/payment-sessions/abandonPaymentSession)

Marks a session as ABANDONED — the customer closed the checkout, or you decided the session is no longer wanted. Abandoning is the clean way to end a session you will not use, rather than leaving i…

# Get payment session (/docs/api-reference/payment-sessions/getPaymentSession)

Retrieves the current state (and history) of a payment session.

# Get all transactions (/docs/api-reference/transactions/listTransactions)

Retrieves a list of transaction records based on multiple optional filter parameters, such as currency, amount, status, channel, etc. The data can be paginated, sorted, and searched.

# Get transaction details (/docs/api-reference/transactions/getTransactionDetails)

Retrieves detailed information about a single transaction using its unique reference ID.

# Look up an order and its transactions (/docs/api-reference/transactions/searchOrders)

The endpoint to call after a payment when you need to know what actually happened. It returns the whole order — every transaction attempted against it, each one's response code, and Kashier's own r…

# Export transaction batches (/docs/api-reference/transactions/exportTransactionBatches)

Exports transaction data based on specific filters such as status and date range. It's typically used for reporting, reconciliation, and data analysis by aggregators or merchants. The export is del…

# Refund, void, or capture an order (/docs/api-reference/order-operations/updateOrder)

Performs an operation against an existing order, selected by the apiOperation field in the body: - REFUND — repay your customer in part or fully. For partial refunds pass an amount in transaction.…

# Refund an order (/docs/api-reference/order-operations/refundOrder)

Repays your customer, in part or in full, from your available Kashier balance. This is the same operation as PUT /v3/orders/{orderId} with apiOperation: REFUND, one hop closer. The checkout host (t…

# Void an order (/docs/api-reference/order-operations/voidOrder)

Cancels a transaction on the order before it settles — the clean undo while the money has not actually moved yet. Use it to cancel a pay, an authorization, a capture or a refund; pass the targetTra…

# Capture an authorized order (/docs/api-reference/order-operations/captureOrder)

Takes the money on an order you previously authorized, fully or partially. Capture before the hold expires — 7 or 30 days depending on your configuration — or the authorization lapses and the funds…

# Reverse an order (/docs/api-reference/order-operations/reverseOrder)

Reverses a transaction at the rail level. This is the card-present and BNPL undo — for an ordinary online card sale reach for void (before settlement) or refund (after) instead, which is almost alw…

# Pay with token (/docs/api-reference/tokens/payWithToken)

Creates a new payment request using a saved card token. (The docs show the URL with a trailing slash: /v3/orders/.) The request is authenticated with a Kashier-Hash header (order hash generated wit…

# Retrieve tokens (/docs/api-reference/tokens/retrieveTokens)

Retrieves a customer's saved card tokens and info. The request is validated with a Kashier-Hash header — an HMAC SHA256 of the path /?tokenization={mid}.{customerReference} keyed with your Payment…

# Get token (/docs/api-reference/tokens/getToken)

Retrieves a single saved card token by its value, returning the masked card number, expiry, and cardholder name. Use it to show a customer which card is on file before charging it, or to check that…

# Delete token (/docs/api-reference/tokens/deleteToken)

Removes a saved card token — useful for removing an expired card, a new card, or a stolen card's old information. The request is validated with a Kashier-Hash header — an HMAC SHA256 hash of the pa…

# List saved card tokens (/docs/api-reference/tokens/listSavedTokens)

Lists every card token saved on your merchant account, with the agreement each one was saved under. This is the account-wide view, and it is a different endpoint from the customer-scoped GET /v3/ca…

# Export saved card tokens (/docs/api-reference/tokens/exportSavedTokens)

Returns the saved-token list as a downloadable file rather than JSON — the same data as List saved card tokens, in a form you can hand to finance or diff against your own records. Because the respo…

# Delete a saved card token (/docs/api-reference/tokens/deleteSavedToken)

Removes a saved card token. Any recurring charge that still references it fails afterwards, so cancel the billing arrangement on your side first. Deleting the token is also how you honour a custome…

# Create token (/docs/api-reference/tokens/createToken)

Saves a card and returns a reusable cardToken you can charge later with Pay with token. Send the raw card details once; Kashier stores them and hands back only the token and a masked card number, s…

# Get available banks (/docs/api-reference/installments/getInstallmentBanks)

Retrieves the installment-enabled banks (with their plans, BIN ranges, and terms & conditions) for a given merchant and product price. Step 1 of retrieving installment plans.

# Get plans for specific bank (/docs/api-reference/installments/getInstallmentPlans)

Retrieves the installment plans for a specific bank (selected by fiId, the banknSystemID retrieved from the "Get available banks" step). After a successful response, the monthly amount for every pl…

# Get account info (/docs/api-reference/payouts/getAccountInfo)

Retrieves account info — balances, payout method, and last-transfer details for the merchant identified by the secret key.

# List all transfers (/docs/api-reference/payouts/listTransfers)

Lists all payout transfers, with pagination.

# Get transfer details (/docs/api-reference/payouts/getTransferDetails)

Retrieves the details of a payout transfer, including its status history and fees.

# Fees inquiry (/docs/api-reference/payouts/feeInquiry)

Inquires about the fees for one or more prospective transfers.

# Create transfer (/docs/api-reference/payouts/createTransfer)

Creates a single payout transfer.

# Bulk transfers (/docs/api-reference/payouts/createBulkTransfer)

Creates a bulk payout transfer from an uploaded file of transfers.

# List payout schedulers (/docs/api-reference/payouts/listPayoutSchedulers)

Lists your recurring payout schedulers, with pagination. A scheduler is a saved transfer template that Kashier re-runs on the frequency you set, so you can pay a recurring salary or a monthly suppl…

# Get payout scheduler details (/docs/api-reference/payouts/getPayoutScheduler)

Retrieves one recurring payout scheduler, including the transfer template it repeats, its recurring frequency, and the date it next runs.

# Create payout scheduler (/docs/api-reference/payouts/createPayoutScheduler)

Creates a recurring payout scheduler from a single transfer template. Kashier repeats the transfer on the recurringFrequency you set, starting on startDate, until you deactivate the scheduler or it…

# List payout batches (/docs/api-reference/payouts/listTransferBatches)

Lists your payout batches, with pagination. Every bulk payout you submit with Bulk transfers becomes a batch whose row shows how many of its transfers have succeeded and how many have failed, so yo…

# Get payout batch details (/docs/api-reference/payouts/getTransferBatch)

Retrieves one payout batch together with the transfers it contains, paginated. Use it to find which rows of a bulk payout failed and why.

# Get transfer by merchant transfer id (/docs/api-reference/payouts/getTransferByMerchantTransferId)

Retrieves a payout transfer using the merchantTransferId your own systems assigned to it, so you can reconcile against your records without having to store Kashier's transferId. merchantTransferId…

# List beneficiaries (/docs/api-reference/beneficiaries/listBeneficiaries)

Retrieves your saved beneficiaries, paginated. type=beneficiary is required — the same route serves customers, and the parameter is what separates them.

# Add a beneficiary (/docs/api-reference/beneficiaries/createBeneficiary)

Saves a new beneficiary. Kashier assigns the customerId (a B- prefixed value) and returns the record with the payment method echoed back as transferMethod plus its credentials under credentials.

# Get beneficiary details (/docs/api-reference/beneficiaries/getBeneficiary)

Retrieves one saved beneficiary by its id.

# Delete a beneficiary (/docs/api-reference/beneficiaries/deleteBeneficiary)

Deletes a saved beneficiary. The response echoes back only the identifying fields of the record that was removed.

# Update a beneficiary (/docs/api-reference/beneficiaries/updateBeneficiary)

Updates a saved beneficiary. type, name, and method are required on every update, even when their values have not changed — an update that omits method is rejected rather than treated as a partial…

# Upload a beneficiaries sheet for review (/docs/api-reference/beneficiaries/importBeneficiaries)

Uploads an XLSX sheet of beneficiaries and validates it without saving anything. Every row comes back with an errors field — null when the row is valid, or an object of field: reason pairs when it…

# Save the uploaded beneficiaries (/docs/api-reference/beneficiaries/saveImportedBeneficiaries)

Commits a validated import. Rows that failed validation in Upload a beneficiaries sheet for review are not saved.

# List all customers (/docs/api-reference/customers/listCustomers)

Retrieves the merchant's customers. All parameters are optional and can be combined; results are paginated.

# Add a new customer (/docs/api-reference/customers/createCustomer)

Creates a customer profile. Kashier assigns the customerId (a C- prefixed value) that you use to link the customer to payments and payment links.

# Get customer details (/docs/api-reference/customers/getCustomer)

Retrieves a single customer, including the timeLine of changes made to the profile and who made them.

# Delete a customer (/docs/api-reference/customers/deleteCustomer)

Deletes a customer profile.

# Update a customer (/docs/api-reference/customers/updateCustomer)

Updates a customer profile. Send the fields you want the customer to end up with — customFields replaces the existing array rather than merging into it.

# Get a customer's payment links (/docs/api-reference/customers/getCustomerPaymentLinks)

Retrieves the payment links created for a single customer — the customer-side view of the Payment links endpoints. Results are paginated.

# Get a customer's audit logs (/docs/api-reference/customers/getCustomerAuditLogs)

Retrieves the full audit trail for a customer — every create and edit, which fields changed, and which dashboard user made the change. This is the same data the profile returns under timeLine, retr…

# Export customers (/docs/api-reference/customers/exportCustomers)

Exports the customers matching the given filters. The export is generated asynchronously and delivered to the merchant account's email address, so the response only acknowledges that the request is…

# Export customers with their payment links (/docs/api-reference/customers/exportCustomerPaymentLinks)

Exports a chosen set of customers together with the payment links created for them. Pass customerIds to export specific customers, or the date/search filters to export everything that matches. Like…

# Upload a customers sheet for review (/docs/api-reference/customers/importCustomers)

Step 1 of the bulk import. Uploads an Excel sheet of customers and validates it without saving anything. Rows that fail validation come back with their errors populated so you can correct them; if…

# Save the uploaded customers (/docs/api-reference/customers/saveImportedCustomers)

Step 2 of the bulk import. Persists the customers that were validated by importCustomers, identified by the correlationId returned there. Separating validation from the write keeps a partially inva…

# Import payment links (/docs/api-reference/payment-links/importPaymentLinks)

Uploads a spreadsheet of payment links and validates it, without saving anything yet. The response reports how many rows were accepted and which ones failed, so you can fix and re-upload just the f…

# Get all payment links (/docs/api-reference/payment-links/listPaymentLinks)

Retrieves the merchant's payment links. All filters are optional and can be combined; results are paginated. If the currency conversion feature is enabled on your account you can also filter by a v…

# Create a payment link (/docs/api-reference/payment-links/createPaymentLink)

Creates a single payment link for one customer. Set currency to a virtual currency code (USDVIRTUAL, EURVIRTUAL, GBPVIRTUAL, SARVIRTUAL, AEDVIRTUAL) with totalAmount expressed in that currency to c…

# Get payment link statistics (/docs/api-reference/payment-links/getPaymentLinkStatistics)

Returns aggregate statistics across the merchant's payment links (counts and amounts broken down by payment status). Accepts the same optional filters as listPaymentLinks, so the totals match the l…

# Get payment link details (/docs/api-reference/payment-links/getPaymentLink)

Retrieves a single payment link, including its extra fees, line items, and the full audit history of the link (creation, edits, shares, and payments).

# Delete a payment link (/docs/api-reference/payment-links/deletePaymentLink)

Deletes a payment link. The link is soft-deleted (isDeleted becomes true) and stops being payable.

# Update a payment link (/docs/api-reference/payment-links/updatePaymentLink)

Updates an existing payment link. The editable fields are wrapped in a paymentLink object; send the full object you want the link to end up with.

# Get payment link events (/docs/api-reference/payment-links/getPaymentLinkEvents)

Retrieves the event/audit trail of a single payment link — the same records that getPaymentLink returns under history.records, retrievable on their own so you can page through a long trail without…

# Share a payment link (/docs/api-reference/payment-links/sharePaymentLink)

Sends an existing payment link to a customer by email or SMS. Use operation to pick the channel and key to carry the matching destination.

# Re-share payment links (/docs/api-reference/payment-links/resharePaymentLinks)

Re-sends one or more existing payment links to the customers they were originally shared with, on the channel used the first time. Useful for chasing unpaid links in bulk without re-entering each c…

# Create and share a payment link (/docs/api-reference/payment-links/createAndSharePaymentLink)

Creates a payment link and immediately sends it to the customer, in a single call. The body is the same as createPaymentLink; the customer's email address or phone number determines the channel the…

# Export payment links (/docs/api-reference/payment-links/exportPaymentLinks)

Exports the payment links matching the given filters. The export is generated asynchronously and delivered to the merchant account's email address, so the response only acknowledges that the reques…

# Save the uploaded payment links (/docs/api-reference/payment-links/saveImportedPaymentLinks)

Step 2 of the bulk upload. Persists the payment links that were validated by importPaymentLinks, identified by the correlationId returned there. Separating validation from the write keeps a partial…

# List payment pages (/docs/api-reference/payment-pages/listPaymentPages)

Lists your payment pages, with pagination, filtering, and search.

# Create payment page (/docs/api-reference/payment-pages/createPaymentPage)

Creates a payment page. Kashier mints a link identifier (PP-…) for the page, which is what the public URL and the /public reads are keyed on. Set paymentObject.isFixed to collect one fixed amount,…

# Get payment page (/docs/api-reference/payment-pages/getPaymentPage)

Retrieves a single payment page, including its products, extra fields, and fees.

# Delete payment page (/docs/api-reference/payment-pages/deletePaymentPage)

Deletes a payment page. The page is soft-deleted — the public link stops working and the page drops out of List payment pages, but the payments already collected against it are retained.

# Update payment page (/docs/api-reference/payment-pages/updatePaymentPage)

Updates a payment page. Send only the fields you want to change; anything you omit keeps its current value. Unpublishing a page (isPublished: false) takes it offline without deleting it.

# List payments for a payment page (/docs/api-reference/payment-pages/listPaymentPagePayments)

Lists the payments collected against one payment page, with pagination. Each record carries the customer details captured on the page and the underlying card, wallet, or cash-on-delivery transactions.

# Get public payment page (/docs/api-reference/payment-pages/getPublicPaymentPage)

Retrieves the customer-facing view of a published payment page. No authentication — this is the read the hosted page itself performs to render your catalogue, so it returns only what is safe to sho…

# Share payment page (/docs/api-reference/payment-pages/sharePaymentPage)

Sends a payment page's link to one or more recipients by email or SMS. Pass every recipient in key to send a single batch.

# Get a payment page payment (/docs/api-reference/payment-pages/getPaymentPagePayment)

Retrieves one payment collected through a payment page, looked up by the order id the page assigned to it.

# Get a payment page payment (public) (/docs/api-reference/payment-pages/getPublicPaymentPagePayment)

The customer-facing view of one payment page payment. No authentication — this is the read the hosted page performs on its own confirmation screen. Returns 404 when the order does not exist.

# Export payment pages (/docs/api-reference/payment-pages/exportPaymentPages)

Exports your payment pages as a spreadsheet, returned inline in the response. For a wide date range use Export payment pages asynchronously instead.

# Export payment pages asynchronously (/docs/api-reference/payment-pages/exportPaymentPagesAsync)

Starts a payment pages export in the background and emails the finished file to the account that made the request.

# Export payments for a payment page (/docs/api-reference/payment-pages/exportPaymentPagePayments)

Exports the payments collected against one payment page as a spreadsheet, returned inline in the response.

# Export payments for a payment page asynchronously (/docs/api-reference/payment-pages/exportPaymentPagePaymentsAsync)

Starts an export of one page's payments in the background and emails the finished file to the account that made the request.

# List balance accounts (/docs/api-reference/balance-and-accounts/listBalanceAccountsOverview)

Lists the balance accounts belonging to the merchant identified by the secret key, with the current balance of each. This is the entry point for the balance overview — take an accountId from here a…

# Get balance account overview (/docs/api-reference/balance-and-accounts/getBalanceAccountOverview)

Retrieves the balance overview of a single account — the headline figures (total balance, available balance) you would show on a dashboard. Use GET /v2/account/{accountId} instead when you need the…

# Get payments overview for an account (/docs/api-reference/balance-and-accounts/getBalancePaymentsOverview)

Summarises the money that came into a balance account over a date range — the settled payments credited to it. Pair it with the payouts overview to see both sides of the account for the same period.

# Get payouts overview for an account (/docs/api-reference/balance-and-accounts/getBalancePayoutsOverview)

Summarises the money that left a balance account over a date range — the payouts debited from it. Pair it with the payments overview to see both sides of the account for the same period.

# Get balance account details (/docs/api-reference/balance-and-accounts/getBalanceAccountDetails)

Retrieves one balance account in full — balances, the payout method money leaves by, and the last transfer made from it. GET /v2/account returns the same document for every account you own; use thi…

# List balance records for an account (/docs/api-reference/balance-and-accounts/listBalanceAccountRecords)

Lists the balance records of one account, newest first — the statement lines behind the balance. Each record is a single movement (a settlement credit, a payout debit, a refund, or an adjustment) a…

# Export balance records for an account (/docs/api-reference/balance-and-accounts/exportBalanceAccountRecords)

Exports one account's balance records as a spreadsheet, applying the same filters as the records list. Pass email to have the export delivered to that address instead of returned in the response.

# Export balance accounts (/docs/api-reference/balance-and-accounts/exportBalanceAccounts)

Exports the merchant's balance accounts and their balances as a spreadsheet. Pass email to have the export delivered to that address instead of returned in the response.

# Search balance accounts by name (/docs/api-reference/balance-and-accounts/searchBalanceAccounts)

Looks up your balance accounts by name and returns just the id and name of each match — a lightweight read for populating an account picker before calling one of the detail reads.

# Get the primary account's payout method (/docs/api-reference/balance-and-accounts/getPrimaryAccountPayoutMethod)

Retrieves the payout method configured on your primary balance account — the bank account or wallet that settled money is paid out to. The fields inside payoutFields depend on method: a bank accoun…

# Get balance record details (/docs/api-reference/balance-and-accounts/getBalanceRecordDetails)

Retrieves one balance record in full — the amount, whether it credited or debited the account, the value date the money counted from, and the origin/originReference pointing back at whatever produc…

# Get payout details for a balance record (/docs/api-reference/balance-and-accounts/getBalancePayoutDetails)

Expands a payout balance record into the individual transactions it paid out. Use it to answer "which sales made up this payout?" — the record gives you the total that left the account, and this re…

# Export payout details for a balance record (/docs/api-reference/balance-and-accounts/exportBalancePayoutDetails)

Exports the transactions behind a payout balance record as a spreadsheet, applying the same status and date filters as the payout details read.

# List holds on a balance account (/docs/api-reference/balance-and-accounts/listBalanceAccountHolds)

Lists the holds placed on a balance account. A hold reserves part of the balance so it cannot be paid out yet — it explains a gap between an account's total balance and its available balance.

# List settled transactions (/docs/api-reference/settlement-reporting/listSettledTransactions)

Lists your transactions that have been settled, with a summary of the total settled amount alongside the page of results. Use it for a transaction-level view of settlement; use GET /v3/payment/sett…

# List settlement windows (/docs/api-reference/settlement-reporting/listSettlementWindows)

Lists your settlement windows, newest first. A window groups the transactions that became ready for settlement on a given date; when it closes it produces one or more batches, and each batch is wha…

# Get a settlement window (/docs/api-reference/settlement-reporting/getSettlementWindow)

Retrieves one settlement window together with its batches. Each batch carries its own rfsDate (the ready-for-settlement date), channel and method, gross and net amounts, and the fees and VAT taken…

# Get a batch within a settlement window (/docs/api-reference/settlement-reporting/getSettlementWindowBatch)

Retrieves one batch of one settlement window. This is the last step of reconciling a single order: read the order's settlementWindowId and settlementBatchId from the transaction, then fetch the bat…

# Get a settlement batch (/docs/api-reference/settlement-reporting/getSettlementBatch)

Retrieves one settlement batch by its id, without needing to know which window it belongs to. Use it when a transaction gave you a settlementBatchId on its own.

# Export settlement batch transactions (/docs/api-reference/settlement-reporting/exportSettlementBatches)

Exports the transactions inside settlement batches as a spreadsheet, one row per transaction with its selling fees, VAT, settlement amount, ready-for-settlement date, method, and channel. This is t…

# List batches (/docs/api-reference/bulk-batches/listBatches)

Retrieves the merchant's batches, paginated. currency is required, so a batch list is always scoped to one currency; every other filter is optional.

# Create a batch (/docs/api-reference/bulk-batches/createBatch)

Creates an empty batch. batchType decides which import sheet the batch expects — withCustomer when each row carries the customer's details so Kashier can create or match a customer record, withoutC…

# Get a batch (/docs/api-reference/bulk-batches/getBatch)

Retrieves a single batch together with the items it contains, so you can review what was imported before sharing it.

# Delete a batch or empty it (/docs/api-reference/bulk-batches/deleteBatch)

Deletes a batch, or just its contents. Pass operation=batch to remove the batch itself, or operation=batchitems to empty it and keep the batch so you can re-import a corrected sheet into it.

# Update a batch (/docs/api-reference/bulk-batches/updateBatch)

Renames an existing batch. The items inside it are left untouched — to change those use updateBatchItem.

# Import batch items from a sheet (/docs/api-reference/bulk-batches/importBatchItems)

Fills a batch by uploading an Excel sheet of rows to bill. sheetType must match how the batch was created — withCustomer when each row carries the customer's details, withoutCustomer when the rows…

# Share a batch (/docs/api-reference/bulk-batches/createBatchShare)

Turns the batch into live payment requests and sends each customer their own payment link, on the channel their row carries. Call this once the imported items look right; the response carries the s…

# Re-share a batch (/docs/api-reference/bulk-batches/reshareBatch)

Re-sends an already-shared batch to the same customers, on the channel used the first time. Useful for chasing a batch of unpaid requests without rebuilding it.

# Get a batch item (/docs/api-reference/bulk-batches/getBatchItem)

Retrieves a single item from a batch — one payment request waiting to be created, with its amount, due date, and status.

# Delete a batch item (/docs/api-reference/bulk-batches/deleteBatchItem)

Removes a single row from a batch. Use it to drop a customer from a bulk billing run without re-importing the whole sheet.

# Update a batch item (/docs/api-reference/bulk-batches/updateBatchItem)

Corrects a single row inside a batch before it is shared — most often to fix an amount or a due date that came in wrong from the imported sheet. The fields live under a batchItem wrapper and mirror…

# Get a merchant's allowed payment methods (/docs/api-reference/checkout-reference-data/getMerchantPaymentMethods)

Retrieves the payment methods your merchant account is entitled to. A custom checkout calls this first and renders only the methods it gets back — the hosted checkout and iframe apply the same enti…

# Get a merchant's installment banks (/docs/api-reference/checkout-reference-data/getMerchantInstallmentBanks)

Retrieves the banks that offer card installments on the merchant account, with their names in English and Arabic, their abbreviation, and a logo you can render in the checkout. Use the returned ban…

# Get one bank's installment plans (/docs/api-reference/checkout-reference-data/getMerchantInstallmentBankPlans)

Retrieves the installment plans a single bank offers on the merchant account — the durations the customer can pick from and the minimum amount each plan requires. Returns an empty array when the ba…

# Get one bank's installment fees (/docs/api-reference/checkout-reference-data/getMerchantInstallmentBankFees)

Retrieves the fee charged per plan duration for a single bank on the merchant account, so a checkout can show the customer what each instalment length costs. The bank is addressed by its abbreviati…

# Get one bank's installment fees (/docs/api-reference/fees-and-discounts/getMerchantInstallmentBankFees)

Retrieves the fee charged per plan duration for a single bank on the merchant account, so a checkout can show the customer what each instalment length costs. The bank is addressed by its abbreviati…

# Calculate the fee on an amount (/docs/api-reference/fees-and-discounts/calculatePaymentFees)

Works out the processing fee for an amount under the merchant's pricing model and returns the total the customer would be charged. Use it when fees are passed on to the customer, so your checkout c…

# Calculate a discount and the fee together (/docs/api-reference/fees-and-discounts/calculateDiscount)

Given an amount and a discount, returns the fee, the discount taken off, and the final amount the customer pays. Unauthenticated so a checkout page can call it while the customer is still choosing…

# List your discount campaigns (/docs/api-reference/fees-and-discounts/listDiscountNames)

Returns the names of the discount campaigns configured on the merchant account and whether each one is currently active. Campaigns are set up by Kashier rather than through the API, so this is a re…

# List a merchant's active discounts (public) (/docs/api-reference/fees-and-discounts/listActiveDiscounts)

Returns the discount campaigns that are live right now for a merchant, optionally narrowed to the card BIN the customer is paying with and the channel they are paying on. Unauthenticated, because a…

# Check whether a card qualifies for a discount (/docs/api-reference/fees-and-discounts/checkCardDiscount)

Checks the card the customer has just entered against the merchant's live bank discount campaigns and, when one applies, returns how much comes off and what the fee would be. This is the call a che…

# List banks (/docs/api-reference/constants/listBankConstants)

Retrieves the Egyptian banks Kashier publishes, with each name in English and Arabic and its abbreviation. Use it to populate a bank picker or to address a bank in the installment fee lookup. For p…

# List cities (/docs/api-reference/constants/listCityConstants)

Retrieves the Egyptian governorates Kashier recognises, in English and Arabic, each with the ISO 3166-2 subdivision code to store against an address.

# List countries (/docs/api-reference/constants/listCountryConstants)

Retrieves every country Kashier recognises, with its two- and three-letter codes, its international dialling prefix, and its flag as an embedded image. Useful for country and phone-prefix pickers.…

# List industries (/docs/api-reference/constants/listIndustryConstants)

Retrieves the industries and their sectors that a merchant business profile can be classified under, in English and Arabic.

# Get payment method definitions (/docs/api-reference/constants/getPaymentMethodDefinitions)

Retrieves every payment method Kashier supports, mapped to the provider integrations that can process it. It is the canonical list of method names — card, wallet, bankinstallments, and the rest — u…

# List eligible transactions (/docs/api-reference/instant-settlement/listEligibleInstantSettlementTransactions)

Returns a paginated list of your not-yet-settled transactions that are eligible for instant settlement, together with summary totals across the whole eligible set and the caps that apply to your ac…

# Get amount suggestions (/docs/api-reference/instant-settlement/getInstantSettlementSuggestions)

Given a target amount, returns the combination of your eligible transactions whose combined settlementAmount comes closest to it — one combination at or below the target (below) and one at or above…

# Inquire about an instant settlement (/docs/api-reference/instant-settlement/inquireInstantSettlement)

Works out what you would receive for a set of transactions without committing to it. It runs the same calculation the create-request endpoint runs and returns the same breakdown, but it changes not…

# List your instant settlement requests (/docs/api-reference/instant-settlement/listInstantSettlementRequests)

Returns a paginated list of your own instant settlement requests, newest first, with the totals and status of each. Use Get request details for the full breakdown of a single request. Requires the…

# Create an instant settlement request (/docs/api-reference/instant-settlement/requestInstantSettlement)

Creates an instant settlement request over the selected transactions. The request is created in PENDING status and is then reviewed by Kashier: approval moves it to PROCESSING and deducts the early…

# Get request details (/docs/api-reference/instant-settlement/getInstantSettlementRequest)

Returns the full detail of a single instant settlement request: its totals and fee breakdown, its status history, the transactions an agent excluded from it, and the balance-ledger records created…

# Get request transactions (/docs/api-reference/instant-settlement/listInstantSettlementRequestTransactions)

Returns the transactions that belong to a specific request, paginated. Rows an agent removed from the request stay on it and come back with selected: false and an unselectedAt timestamp; use the se…

# Send a message to a POS terminal (/docs/api-reference/pos-terminals/sendPosTerminalMessage)

Relays a JSON message to one of your POS terminals. Kashier authenticates you as the merchant, confirms the terminal belongs to your account, and forwards the message to the terminal in real time o…

# Generate a POS payment QR code (/docs/api-reference/pos-terminals/createPosQrCode)

Generates a QR code that a customer scans with their phone to open a Kashier hosted payment page for the order, instead of presenting a card at the terminal. The response carries the QR image as a…

# List a terminal's transactions (/docs/api-reference/pos-terminals/listPosTerminalTransactions)

Retrieves the card-present transactions processed on one of your POS terminals. The gateway passes the request through to the transaction manager unchanged, so the rows carry the same fields as the…

# Get one terminal transaction (/docs/api-reference/pos-terminals/getPosTerminalTransaction)

Retrieves the details of a single card-present transaction processed on one of your POS terminals.

# Get a terminal transaction report (/docs/api-reference/pos-terminals/getPosTerminalReport)

Retrieves a transaction report for one POS terminal over a date and time window. Pass all as the terminalId to report across every terminal on your merchant account.

# Acknowledge a terminal's transactions (/docs/api-reference/pos-terminals/acknowledgePosTerminalTransactions)

Acknowledges the transactions a POS terminal has reported, so they are marked as received and can move on to settlement. Used to close a terminal's batch from your own back office.

# Reconcile a terminal's transactions (/docs/api-reference/pos-terminals/reconcilePosTerminal)

Reconciles the transactions your system holds for a POS terminal against the transactions Kashier holds, so the two sides agree before settlement. Send the terminal and the totals you expect.

# Start a buy-now-pay-later payment on a terminal (/docs/api-reference/pos-terminals/createPosBnplPayment)

Starts a buy-now-pay-later (BNPL) card-present operation on one of your POS terminals, optionally against a specific BNPL plan. Availability depends on the BNPL providers enabled on your merchant a…

# List your POS branches (/docs/api-reference/pos-terminals/listPosBranches)

Retrieves the branches your POS terminals are assigned to, so you can group terminals and reports by physical location.

# List terminals (/docs/api-reference/terminals/listPosTerminals)

Retrieves the POS terminals registered on your merchant account. The list can be filtered by terminal ID, serial number, branch, label, status, and mode, and is paginated and sortable.

# List terminal branches (/docs/api-reference/terminals/listTerminalBranches)

Retrieves the branches your terminals are assigned to, with the number of terminals in each. Paginated and searchable.

# Export terminals (/docs/api-reference/terminals/exportTerminals)

Exports the terminals on your merchant account as an Excel workbook, using the same filters as the terminals list.

# Get terminal details (/docs/api-reference/terminals/getTerminal)

Retrieves one terminal on your merchant account, including its branch, status, mode, and card-acceptance limits.

# List products (/docs/api-reference/products/listProducts)

Retrieves the merchant's products. Every filter is optional — call it with no query at all to page through the whole catalogue, or narrow it down by category, stock status, currency, or a free-text…

# Create a product (/docs/api-reference/products/createProduct)

Adds a single product to the catalogue. Only the name, currency, and unit price are required; set isVariant when the product is a variation of another item, and quantity when you want Kashier to tr…

# Get a product (/docs/api-reference/products/getProduct)

Retrieves a single product by its record id, including its description, image, price, and stock status.

# Update a product (/docs/api-reference/products/updateProduct)

Updates an existing product. Send only the fields you want to change — anything you leave out keeps its current value, so this is safe to call from an ERP that only knows about price and stock move…

# Get a product's timeline (/docs/api-reference/products/getProductTimeline)

Retrieves the audit trail for a product — every create and edit, which fields changed, and which dashboard user made the change.

# Assign or unassign categories in bulk (/docs/api-reference/products/assignProductCategories)

Adds categories to, or removes them from, a set of products in one call. operation picks the direction, so the same endpoint covers both filing products into a new category and clearing them out of…

# Replace the categories on products (/docs/api-reference/products/changeProductCategories)

Replaces the full category set on the given products with categoryIds, rather than adding to it. Use this when your ERP is the source of truth and you want Kashier to match it exactly.

# Export products (/docs/api-reference/products/exportProducts)

Exports the products matching the given filters and returns the Excel workbook directly in the response. The filters are the same ones listProducts accepts. For a large catalogue use exportProducts…

# Export products asynchronously (/docs/api-reference/products/exportProductsAsync)

Exports the products matching the given filters without holding the request open. The workbook is generated in the background and emailed to email — or to the merchant account's own address when yo…

# Upload a product image (/docs/api-reference/products/uploadProductImage)

Uploads an image and returns the hosted URL for it. Upload the file first, then pass the returned URL as the product's image when you create or update it. Files must be under 5 MB.

# List categories (/docs/api-reference/categories/listCategories)

Retrieves the merchant's product categories, paginated. Filter by name with q, or narrow the list to categories created inside a date range.

# Create a category (/docs/api-reference/categories/createCategory)

Creates a product category. A category only needs a name; products are filed into it afterwards with assignProductCategories or changeProductCategories.

# Get a category (/docs/api-reference/categories/getCategory)

Retrieves a single category by its record id.

# Delete a category (/docs/api-reference/categories/deleteCategory)

Deletes a category. Products that were filed into it stay in the catalogue — only the grouping goes away.

# Update a category (/docs/api-reference/categories/updateCategory)

Renames an existing category. The products filed into it are left untouched.

# List a merchant's categories (public) (/docs/api-reference/categories/listSimpleCategories)

Returns just the ids and names of a merchant's categories, with no pagination and no authentication. This is the lightweight read a storefront or a payment page uses to render a category picker, so…

# Get the categories on a payment page (public) (/docs/api-reference/categories/getPaymentPageCategories)

Returns the categories used by the products on a published product payment page, looked up by the page's link identifier. Unauthenticated, because the payment page itself calls it while a customer…

# List your Payment API keys (/docs/api-reference/credentials-and-access/listApiKeys)

Returns the Payment API keys on your merchant account — the keys used to compute the Kashier-Hash order hash and to verify redirect and webhook signatures. Payment API keys are not bearer credentia…

# Create a Payment API key (/docs/api-reference/credentials-and-access/createApiKey)

Issues a new Payment API key. Despite being a create, the verb is PUT and the operation is selected by a required operation=apiKey.create query parameter — omit it and the call is rejected. The key…

# Delete a Payment API key (/docs/api-reference/credentials-and-access/deleteApiKey)

Permanently removes a Payment API key. Anything still computing hashes with it starts failing signature verification immediately, so retire it from your integrations first. Requires the delete-API-…

# Validate a set of credentials (/docs/api-reference/credentials-and-access/validateMerchantCredentials)

Checks whether the secret keys and Payment API keys you hold are the right ones for the modes you have filed them under. Useful in a deployment check, or when a partner platform stores merchant cre…

# List your secret keys (/docs/api-reference/credentials-and-access/listSecretKeys)

Returns the secret keys on your account — the credential you put in the Authorization header. Requires the API-key permission on your user's role. Kashier has not published the response shape for t…

# Update a user's secret keys (/docs/api-reference/credentials-and-access/updateSecretKeys)

Updates the secret keys held for one dashboard user. Requires the API-key permission on your user's role. Treat this as destructive until you have confirmed its behaviour with Kashier. Kashier has…

# List the IP allow-list (/docs/api-reference/credentials-and-access/listAllowedIpAddresses)

Returns the IP addresses allowed to call Kashier with your secret key. Read this first when a working integration suddenly returns 403. Every secret-key call is checked against this list, and an IP…

# Add an IP to the allow-list (/docs/api-reference/credentials-and-access/createAllowedIpAddress)

Adds one address to the allow-list. Adding the first entry switches the allow-list on. Until then every IP is allowed; the moment one entry exists, every other IP is refused with 403 Unauthorized I…

# Enable or disable the whole allow-list (/docs/api-reference/credentials-and-access/toggleAllAllowedIpAddresses)

Turns every entry on the allow-list active or inactive in one call — the escape hatch for when the list has locked you out. Sending isActive: false deactivates every entry, which leaves no active e…

# Get one allow-list entry (/docs/api-reference/credentials-and-access/getAllowedIpAddress)

Returns a single IP allow-list entry. Requires the view-IP permission on your user's role.

# Remove an IP from the allow-list (/docs/api-reference/credentials-and-access/deleteAllowedIpAddress)

Deletes one entry. Removing the last entry empties the list, and an empty list allows every IP — deleting entries loosens the restriction rather than tightening it. Requires the delete-IP permissio…

# Update an allow-list entry (/docs/api-reference/credentials-and-access/updateAllowedIpAddress)

Changes the address or label on an existing entry. Send the whole entry, not just the field you are changing. Requires the edit-IP permission on your user's role.

# List your webhooks (/docs/api-reference/webhooks/listWebhooks)

Returns every webhook configured for your merchant, across both modes.

# Create a webhook (/docs/api-reference/webhooks/createWebhook)

Creates a new webhook for your merchant. The webhook's url must be https. There is a cap on how many webhooks you can hold in each mode; once you reach it, creating another webhook in that mode is…

# List subscribable events (/docs/api-reference/webhooks/listWebhookEvents)

Returns the catalog of event types a webhook can subscribe to — the exact values that are valid in the events array of Create a webhook and Update a webhook. Read this catalog rather than hard-codi…

# Delete a webhook (/docs/api-reference/webhooks/deleteWebhook)

Removes a webhook. There's no undo — deliveries already recorded against it stay visible in delivery records.

# Update a webhook (/docs/api-reference/webhooks/updateWebhook)

Updates an existing webhook. Send only the fields you want to change. The https-only URL rule from webhook creation applies here too. Moving a webhook to the other mode re-checks that mode's webhoo…

# Get delivery records for a transaction (/docs/api-reference/webhooks/getWebhookRecordsForTransaction)

Not yet available on the test environment. Calling this route on test-api.kashier.io returns a 404, so the "Try it" panel below cannot succeed yet. Returns the delivery log for a given transaction…

# Get delivery records for a transfer (/docs/api-reference/webhooks/getWebhookRecordsForTransfer)

Not yet available on the test environment. Calling this route on test-api.kashier.io returns a 404, so the "Try it" panel below cannot succeed yet. Same records lookup as Get delivery records for a…

# Resend a delivery (/docs/api-reference/webhooks/resendWebhookRecord)

Re-sends a previously recorded delivery — the original stored request, byte-for-byte, including its original signature — to the same URL. Useful after fixing an endpoint that was down or returning…

# Test a webhook (/docs/api-reference/webhooks/testWebhook)

Not yet available on the test environment. Calling this route on test-api.kashier.io returns a 404, so the "Try it" panel below cannot succeed yet. Sends a signed sample payload to a webhook's conf…
