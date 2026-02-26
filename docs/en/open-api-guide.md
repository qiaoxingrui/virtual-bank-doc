# Open API Integration Guide

## 1. Overview

This document describes how to integrate with our Virtual Account Platform via Open API, including API request signing and Webhook callback verification.

### 1.1 Basic Information

| Item | Description |
|---|---|
| Base URL | `https://{host}/admin-api` |
| Protocol | HTTPS |
| Data Format | JSON |
| Encoding | UTF-8 |

### 1.2 Key Descriptions

After onboarding, you will receive two sets of keys:

| Key | Purpose |
|---|---|
| **Secret Key** | Used for API request signing to verify the legitimacy of the request origin |
| **Webhook Key** | Used to verify the authenticity of our callback requests and prevent forgery |

> ⚠️ Keep your keys secure. Never expose them in client-side code, logs, or version control. If a key is compromised, contact us immediately to regenerate it.

---

## 2. API Request Signing

All Open API requests must include signature information for authentication.

### 2.1 Request Headers

| Header | Required | Description |
|---|---|---|
| `X-Api-Key` | Yes | Your Secret Key |
| `X-Api-Timestamp` | Yes | Current Unix timestamp (seconds) |
| `X-Api-Signature` | Yes | HMAC-SHA256 signature (hex-encoded) |
| `Content-Type` | Yes | `application/json` |

### 2.2 Signature Algorithm

**Step 1: Construct the string to sign**

```
StringToSign = HTTP_METHOD + "\n" + REQUEST_PATH + "\n" + TIMESTAMP + "\n" + REQUEST_BODY
```

| Part | Description | Example |
|---|---|---|
| HTTP_METHOD | Uppercase HTTP method | `POST` |
| REQUEST_PATH | Request path (without domain and query parameters) | `/admin-api/bank/open/virtual-account/create` |
| TIMESTAMP | Same as `X-Api-Timestamp` | `1708862400` |
| REQUEST_BODY | Complete request body JSON string; empty string if no body | `{"type":1,"amount":1000}` |

> Note: Parts are joined with `\n` (newline character).

**Step 2: Compute HMAC-SHA256**

```
Signature = Hex( HMAC-SHA256( SecretKey, StringToSign ) )
```

Use your Secret Key as the HMAC key to perform HMAC-SHA256 on the string to sign, then convert the result to a lowercase hexadecimal string.

### 2.3 Timestamp Validation

- The server validates the timestamp deviation from the current time, with an allowed range of **±5 minutes**
- Please ensure your server clock is synchronized with an NTP server

### 2.4 Complete Request Example

```http
POST /admin-api/bank/open/virtual-account/create HTTP/1.1
Host: api.example.com
Content-Type: application/json
X-Api-Key: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
X-Api-Timestamp: 1708862400
X-Api-Signature: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08

{"type":1,"amount":1000,"expireDate":"2025-12-31T23:59:59"}
```

### 2.5 Code Samples

#### Java

```java
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

public class ApiSignature {

    public static String sign(String secretKey, String method, String path,
                              String timestamp, String body) throws Exception {
        String stringToSign = method + "\n" + path + "\n" + timestamp + "\n" + (body != null ? body : "");

        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(stringToSign.getBytes(StandardCharsets.UTF_8));

        StringBuilder hex = new StringBuilder();
        for (byte b : hash) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }
}
```

#### Python

```python
import hmac
import hashlib
import time
import requests
import json

def sign_request(secret_key: str, method: str, path: str,
                 timestamp: str, body: str = "") -> str:
    string_to_sign = f"{method}\n{path}\n{timestamp}\n{body}"
    signature = hmac.new(
        secret_key.encode('utf-8'),
        string_to_sign.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return signature

# Usage example
secret_key = "your_secret_key_here"
method = "POST"
path = "/admin-api/bank/open/virtual-account/create"
timestamp = str(int(time.time()))
body = json.dumps({"type": 1, "amount": 1000})

signature = sign_request(secret_key, method, path, timestamp, body)

response = requests.post(
    f"https://api.example.com{path}",
    headers={
        "Content-Type": "application/json",
        "X-Api-Key": secret_key,
        "X-Api-Timestamp": timestamp,
        "X-Api-Signature": signature,
    },
    data=body
)
print(response.json())
```

#### Node.js

```javascript
const crypto = require('crypto');
const axios = require('axios');

function signRequest(secretKey, method, path, timestamp, body = '') {
    const stringToSign = `${method}\n${path}\n${timestamp}\n${body}`;
    return crypto
        .createHmac('sha256', secretKey)
        .update(stringToSign, 'utf-8')
        .digest('hex');
}

// Usage example
const secretKey = 'your_secret_key_here';
const method = 'POST';
const path = '/admin-api/bank/open/virtual-account/create';
const timestamp = Math.floor(Date.now() / 1000).toString();
const body = JSON.stringify({ type: 1, amount: 1000 });

const signature = signRequest(secretKey, method, path, timestamp, body);

axios.post(`https://api.example.com${path}`, body, {
    headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': secretKey,
        'X-Api-Timestamp': timestamp,
        'X-Api-Signature': signature,
    }
}).then(res => console.log(res.data));
```

#### PHP

```php
<?php
function signRequest(string $secretKey, string $method, string $path,
                     string $timestamp, string $body = ''): string {
    $stringToSign = implode("\n", [$method, $path, $timestamp, $body]);
    return hash_hmac('sha256', $stringToSign, $secretKey);
}

// Usage example
$secretKey = 'your_secret_key_here';
$method = 'POST';
$path = '/admin-api/bank/open/virtual-account/create';
$timestamp = (string)time();
$body = json_encode(['type' => 1, 'amount' => 1000]);

$signature = signRequest($secretKey, $method, $path, $timestamp, $body);

$ch = curl_init("https://api.example.com{$path}");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        "X-Api-Key: {$secretKey}",
        "X-Api-Timestamp: {$timestamp}",
        "X-Api-Signature: {$signature}",
    ],
]);
$response = curl_exec($ch);
curl_close($ch);
echo $response;
```

---

## 3. API Response Format

All API endpoints return a unified JSON format:

```json
{
    "code": 0,
    "data": { },
    "msg": ""
}
```

| Field | Type | Description |
|---|---|---|
| code | Integer | Status code, `0` indicates success |
| data | Object | Business data |
| msg | String | Error message (empty string on success) |

### 3.1 Error Codes

| Error Code | Description |
|---|---|
| 0 | Success |
| 1009001003 | Invalid API Key |
| 1009001004 | Signature verification failed |
| 1009001005 | Request timestamp expired |
| 1009001006 | Missing required authentication headers |
| 1009001002 | Merchant has been disabled |

---

## 4. Webhook Callbacks

When a virtual account receives a deposit, we will send an HTTP POST notification to your configured Webhook URL.

### 4.1 Callback Request Headers

| Header | Description |
|---|---|
| `X-Webhook-Signature` | Signature information, format: `t={timestamp},v1={signature}` |
| `X-Webhook-Event` | Event type, e.g. `deposit.completed` |
| `Content-Type` | `application/json` |

### 4.2 Signature Verification

**Step 1: Parse the signature header**

Extract `t` (timestamp) and `v1` (signature) from `X-Webhook-Signature`:

```
X-Webhook-Signature: t=1708862400,v1=a1b2c3d4e5f6...
```

**Step 2: Construct the string to sign**

```
StringToSign = TIMESTAMP + "." + REQUEST_BODY
```

Where `TIMESTAMP` is the `t` value extracted from the signature header, and `REQUEST_BODY` is the raw request body string.

**Step 3: Compute and compare the signature**

```
ExpectedSignature = Hex( HMAC-SHA256( WebhookKey, StringToSign ) )
```

Compare the computed result with the `v1` value.

**Step 4: Replay attack prevention (recommended)**

Check the difference between the `t` timestamp and the current time. It is recommended to reject callbacks older than 5 minutes.

### 4.3 Callback Response

- Return HTTP status code `2xx` to indicate successful receipt
- Any other status code or timeout (30 seconds) is considered a failure and will trigger a retry

### 4.4 Retry Strategy

| Retry Attempt | Delay |
|---|---|
| 1st | 30 seconds |
| 2nd | 2 minutes |
| 3rd | 10 minutes |
| 4th | 1 hour |
| 5th | 6 hours |

After 5 failed retries, the system will stop retrying and mark it as a final failure.

### 4.5 Webhook Verification Code Samples

#### Java

```java
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

public class WebhookVerifier {

    public static boolean verify(String webhookKey, String signatureHeader, String body) throws Exception {
        String timestamp = null;
        String v1 = null;
        for (String part : signatureHeader.split(",")) {
            if (part.startsWith("t=")) timestamp = part.substring(2);
            if (part.startsWith("v1=")) v1 = part.substring(3);
        }
        if (timestamp == null || v1 == null) return false;

        long diff = Math.abs(System.currentTimeMillis() / 1000 - Long.parseLong(timestamp));
        if (diff > 300) return false;

        String stringToSign = timestamp + "." + body;
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(webhookKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(stringToSign.getBytes(StandardCharsets.UTF_8));

        StringBuilder hex = new StringBuilder();
        for (byte b : hash) {
            hex.append(String.format("%02x", b));
        }

        return hex.toString().equals(v1);
    }
}
```

#### Python

```python
import hmac
import hashlib
import time

def verify_webhook(webhook_key: str, signature_header: str, body: str) -> bool:
    parts = {}
    for item in signature_header.split(','):
        key, value = item.split('=', 1)
        parts[key] = value

    timestamp = parts.get('t')
    v1 = parts.get('v1')
    if not timestamp or not v1:
        return False

    if abs(time.time() - int(timestamp)) > 300:
        return False

    string_to_sign = f"{timestamp}.{body}"
    expected = hmac.new(
        webhook_key.encode('utf-8'),
        string_to_sign.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected, v1)
```

#### Node.js

```javascript
const crypto = require('crypto');

function verifyWebhook(webhookKey, signatureHeader, body) {
    const parts = {};
    signatureHeader.split(',').forEach(item => {
        const [key, ...rest] = item.split('=');
        parts[key] = rest.join('=');
    });

    const timestamp = parts['t'];
    const v1 = parts['v1'];
    if (!timestamp || !v1) return false;

    if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) return false;

    const stringToSign = `${timestamp}.${body}`;
    const expected = crypto
        .createHmac('sha256', webhookKey)
        .update(stringToSign, 'utf-8')
        .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}
```

#### PHP

```php
<?php
function verifyWebhook(string $webhookKey, string $signatureHeader, string $body): bool {
    $parts = [];
    foreach (explode(',', $signatureHeader) as $item) {
        [$key, $value] = explode('=', $item, 2);
        $parts[$key] = $value;
    }

    $timestamp = $parts['t'] ?? null;
    $v1 = $parts['v1'] ?? null;
    if (!$timestamp || !$v1) return false;

    if (abs(time() - (int)$timestamp) > 300) return false;

    $stringToSign = "{$timestamp}.{$body}";
    $expected = hash_hmac('sha256', $stringToSign, $webhookKey);

    return hash_equals($expected, $v1);
}
```

---

## 5. Event Types

### 5.1 deposit.completed - Deposit Completed

Triggered when a virtual account receives a deposit.

**Payload Example:**

```json
{
    "accountNo": "1234567890123456",
    "amount": "50000",
    "currency": "TWD",
    "transactionDate": "20250225",
    "transactionTime": "143052",
    "type": "C",
    "seqNo": "20250225001"
}
```

| Field | Type | Description |
|---|---|---|
| accountNo | String | Virtual account number |
| amount | String | Deposit amount |
| currency | String | Currency (default `TWD`, possible values: `TWD` / `USD`) |
| transactionDate | String | Transaction date (yyyyMMdd) |
| transactionTime | String | Transaction time (HHmmss) |
| type | String | Transaction type (see table below) |
| seqNo | String | Transaction sequence number |

**Transaction Type (type) Codes:**

| Code | Description |
|---|---|
| A | Over-the-counter |
| B / P | Voice banking |
| C | Internet banking |
| D | Mobile banking |
| E / R | Wire transfer |
| F | FXML |
| G | eBill |
| J | ADM |
| M | MOD |
| T | ATM |
| X | eATM |
| 0 | Other |

---

## 6. FAQ

### Q: Signature verification keeps failing?

Please check the following:
1. Verify that your Secret Key is correct
2. Verify the concatenation order and newline characters in the string to sign
3. Verify the timestamp is a **second-level** Unix timestamp, not milliseconds
4. Verify the request body is the raw JSON string without additional formatting
5. Verify your server clock is accurate

### Q: Not receiving Webhook callbacks?

Please check:
1. Whether the Webhook URL is accessible from the public internet
2. Whether the firewall allows traffic from our server IPs
3. Whether the server correctly returns an HTTP 2xx status code
4. Whether the callback processing completes within 30 seconds

### Q: What if a key is compromised?

Contact our technical team immediately. We will regenerate your keys in the admin panel. The old keys will be invalidated immediately.
