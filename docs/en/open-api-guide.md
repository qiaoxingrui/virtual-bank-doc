# Open API Integration Guide

## 1. Overview

This document describes how to integrate with our Virtual Account Platform via Open API, including API request signing and Webhook callback verification.

### 1.1 Basic Information

| Item | Description               |
|---|---------------------------|
| Base URL | `https://{host}/open-api` |
| Protocol | HTTPS                     |
| Data Format | JSON                      |
| Encoding | UTF-8                     |

### 1.2 Merchant Number and Keys

After onboarding, you will receive a **Merchant Number** and two keys:

| Item | Purpose |
|---|---|
| **Merchant Number** | Sent in API request headers to identify your account (not a secret; safe to include in requests) |
| **Secret Key** | Used only on your server to compute `X-Api-Signature`; **do not** put it in headers or send it in plain text over the network |
| **Webhook Key** | Used to verify the authenticity of our callback requests and prevent forgery |

> ⚠️ Keep your Secret Key and Webhook Key secure. Never expose them in client-side code, logs, or version control. Open API headers carry only the merchant number; the server looks up your merchant and verifies the signature using the stored Secret Key, so the Secret Key is not transmitted on each request. If a key is compromised, contact us immediately to regenerate it.

---

## 2. API Request Signing

All Open API requests must include signature information for authentication.

### 2.1 Request Headers

| Header | Required | Description                                                                |
|---|---|----------------------------------------------------------------------------|
| `X-Api-MerchantNo` | Yes | Your merchant number                                                       |
| `X-Api-Timestamp` | Yes | Current Unix timestamp (seconds)                                           |
| `X-Api-Signature` | Yes | HMAC-SHA256 signature (hex-encoded), computed locally with your Secret Key |
| `Content-Type` | Yes | `application/json`                                                         |

The server resolves `X-Api-MerchantNo` to your merchant record and uses the stored Secret Key to verify the signature. You compute the signature with your Secret Key locally; **do not** send the Secret Key in a header.

### 2.2 Signature Algorithm

**Step 1: Construct the string to sign**

```
StringToSign = HTTP_METHOD + "\n" + REQUEST_PATH + "\n" + TIMESTAMP + "\n" + REQUEST_BODY
```

| Part | Description | Example |
|---|---|---|
| HTTP_METHOD | Uppercase HTTP method | `POST` |
| REQUEST_PATH | Request path (without domain and query parameters) | `/open-api/demo/echo` |
| TIMESTAMP | Same as `X-Api-Timestamp` | `1708862400` |
| REQUEST_BODY | Complete request body JSON string; empty string if no body | `{"type":1,"amount":1000}` |

> Note: Parts are joined with `\n` (newline character).

**Step 2: Compute HMAC-SHA256**

```
Signature = Hex( HMAC-SHA256( SecretKey, StringToSign ) )
```

On your server, use your Secret Key as the HMAC key to perform HMAC-SHA256 on the string to sign, then convert the result to a lowercase hexadecimal string and set it in `X-Api-Signature`. The Secret Key is only used for local signing and is not sent with the request.

### 2.3 Timestamp Validation

- The server validates the timestamp deviation from the current time, with an allowed range of **±5 minutes**
- Please ensure your server clock is synchronized with an NTP server

### 2.4 Complete Request Example

#### Echo (POST)

```http
POST /open-api/demo/echo HTTP/1.1
Host: api.example.com
Content-Type: application/json
X-Api-MerchantNo: 123456
X-Api-Timestamp: 1708862400
X-Api-Signature: <calculated_signature>

{"foo":"bar"}
```

#### Ping (GET)

```http
GET /open-api/demo/ping HTTP/1.1
Host: api.example.com
X-Api-MerchantNo: 123456
X-Api-Timestamp: 1708862400
X-Api-Signature: <calculated_signature>
```

### 2.5 Code Samples

#### Java

```java
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;

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

    public static void main(String[] args) throws Exception {
        String merchantNo = "123456";
        String secretKey = "your_secret_key_here";
        String baseUrl = "https://api.example.com";

        HttpClient client = HttpClient.newHttpClient();

        // Echo: POST /open-api/demo/echo (with body)
        String echoPath = "/open-api/demo/echo";
        String echoBody = "{\"foo\":\"bar\"}";
        String echoTimestamp = String.valueOf(Instant.now().getEpochSecond());
        String echoSignature = sign(secretKey, "POST", echoPath, echoTimestamp, echoBody);

        HttpRequest echoReq = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + echoPath))
                .header("Content-Type", "application/json")
                .header("X-Api-MerchantNo", merchantNo)
                .header("X-Api-Timestamp", echoTimestamp)
                .header("X-Api-Signature", echoSignature)
                .POST(HttpRequest.BodyPublishers.ofString(echoBody))
                .build();
        HttpResponse<String> echoResp = client.send(echoReq, HttpResponse.BodyHandlers.ofString());
        System.out.println(echoResp.body());

        // Ping: GET /open-api/demo/ping (no body)
        String pingPath = "/open-api/demo/ping";
        String pingTimestamp = String.valueOf(Instant.now().getEpochSecond());
        String pingSignature = sign(secretKey, "GET", pingPath, pingTimestamp, "");

        HttpRequest pingReq = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + pingPath))
                .header("X-Api-MerchantNo", merchantNo)
                .header("X-Api-Timestamp", pingTimestamp)
                .header("X-Api-Signature", pingSignature)
                .GET()
                .build();
        HttpResponse<String> pingResp = client.send(pingReq, HttpResponse.BodyHandlers.ofString());
        System.out.println(pingResp.body());
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

# Usage example (Echo & Ping)
merchant_no = "123456"
secret_key = "your_secret_key_here"
base_url = "https://api.example.com"

# Echo: POST /open-api/demo/echo
echo_method = "POST"
echo_path = "/open-api/demo/echo"
echo_body = json.dumps({"foo": "bar"})
echo_timestamp = str(int(time.time()))
echo_signature = sign_request(secret_key, echo_method, echo_path, echo_timestamp, echo_body)

echo_resp = requests.post(
    f"{base_url}{echo_path}",
    headers={
        "Content-Type": "application/json",
        "X-Api-MerchantNo": merchant_no,
        "X-Api-Timestamp": echo_timestamp,
        "X-Api-Signature": echo_signature,
    },
    data=echo_body
)
print(echo_resp.json())

# Ping: GET /open-api/demo/ping
ping_method = "GET"
ping_path = "/open-api/demo/ping"
ping_timestamp = str(int(time.time()))
ping_signature = sign_request(secret_key, ping_method, ping_path, ping_timestamp, "")

ping_resp = requests.get(
    f"{base_url}{ping_path}",
    headers={
        "X-Api-MerchantNo": merchant_no,
        "X-Api-Timestamp": ping_timestamp,
        "X-Api-Signature": ping_signature,
    }
)
print(ping_resp.json())
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

// Usage example (Echo & Ping)
const merchantNo = '123456';
const secretKey = 'your_secret_key_here';
const baseUrl = 'https://api.example.com';

(async () => {
    // Echo: POST /open-api/demo/echo
    const echoPath = '/open-api/demo/echo';
    const echoMethod = 'POST';
    const echoBody = JSON.stringify({ foo: 'bar' });
    const echoTimestamp = Math.floor(Date.now() / 1000).toString();
    const echoSignature = signRequest(secretKey, echoMethod, echoPath, echoTimestamp, echoBody);

    const echoResp = await axios.post(`${baseUrl}${echoPath}`, echoBody, {
        headers: {
            'Content-Type': 'application/json',
            'X-Api-MerchantNo': merchantNo,
            'X-Api-Timestamp': echoTimestamp,
            'X-Api-Signature': echoSignature,
        }
    });
    console.log(echoResp.data);

    // Ping: GET /open-api/demo/ping
    const pingPath = '/open-api/demo/ping';
    const pingMethod = 'GET';
    const pingTimestamp = Math.floor(Date.now() / 1000).toString();
    const pingSignature = signRequest(secretKey, pingMethod, pingPath, pingTimestamp, '');

    const pingResp = await axios.get(`${baseUrl}${pingPath}`, {
        headers: {
            'X-Api-MerchantNo': merchantNo,
            'X-Api-Timestamp': pingTimestamp,
            'X-Api-Signature': pingSignature,
        }
    });
    console.log(pingResp.data);
})();
```

#### PHP

```php
<?php
function signRequest(string $secretKey, string $method, string $path,
                     string $timestamp, string $body = ''): string {
    $stringToSign = implode("\n", [$method, $path, $timestamp, $body]);
    return hash_hmac('sha256', $stringToSign, $secretKey);
}

// Usage example (Echo & Ping)
$merchantNo = '123456';
$secretKey = 'your_secret_key_here';
$baseUrl = 'https://api.example.com';

// Echo: POST /open-api/demo/echo
$echoPath = '/open-api/demo/echo';
$echoMethod = 'POST';
$echoBody = json_encode(['foo' => 'bar']);
$echoTimestamp = (string)time();
$echoSignature = signRequest($secretKey, $echoMethod, $echoPath, $echoTimestamp, $echoBody);

$ch = curl_init("{$baseUrl}{$echoPath}");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $echoBody,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        "X-Api-MerchantNo: {$merchantNo}",
        "X-Api-Timestamp: {$echoTimestamp}",
        "X-Api-Signature: {$echoSignature}",
    ],
]);
$echoResp = curl_exec($ch);
curl_close($ch);
echo $echoResp;

// Ping: GET /open-api/demo/ping
$pingPath = '/open-api/demo/ping';
$pingMethod = 'GET';
$pingTimestamp = (string)time();
$pingSignature = signRequest($secretKey, $pingMethod, $pingPath, $pingTimestamp, '');

$ch = curl_init("{$baseUrl}{$pingPath}");
curl_setopt_array($ch, [
    CURLOPT_HTTPGET => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "X-Api-MerchantNo: {$merchantNo}",
        "X-Api-Timestamp: {$pingTimestamp}",
        "X-Api-Signature: {$pingSignature}",
    ],
]);
$pingResp = curl_exec($ch);
curl_close($ch);
echo $pingResp;
```

#### Go

```go
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

func signRequest(secretKey, method, requestURI, timestamp, body string) string {
	stringToSign := method + "\n" + requestURI + "\n" + timestamp + "\n" + body
	mac := hmac.New(sha256.New, []byte(secretKey))
	_, _ = mac.Write([]byte(stringToSign))
	return hex.EncodeToString(mac.Sum(nil))
}

func doEcho(baseURL, merchantNo, secretKey string) error {
	method := "POST"
	localPath := "/open-api/demo/echo"
	body := `{"foo":"bar"}`
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	fullURL := baseURL + localPath
	u, err := url.Parse(fullURL)
	if err != nil {
		return err
	}
	requestURI := u.EscapedPath()
	signature := signRequest(secretKey, method, requestURI, timestamp, body)

	req, err := http.NewRequest(method, fullURL, strings.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Api-MerchantNo", merchantNo)
	req.Header.Set("X-Api-Timestamp", timestamp)
	req.Header.Set("X-Api-Signature", signature)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(resp.Body)
	fmt.Println(string(b))
	return nil
}

func doPing(baseURL, merchantNo, secretKey string) error {
	method := "GET"
	localPath := "/open-api/demo/ping"
	body := ""
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	fullURL := baseURL + localPath
	u, err := url.Parse(fullURL)
	if err != nil {
		return err
	}
	requestURI := u.EscapedPath()
	signature := signRequest(secretKey, method, requestURI, timestamp, body)

	req, err := http.NewRequest(method, fullURL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("X-Api-MerchantNo", merchantNo)
	req.Header.Set("X-Api-Timestamp", timestamp)
	req.Header.Set("X-Api-Signature", signature)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(resp.Body)
	fmt.Println(string(b))
	return nil
}

func main() {
	baseURL := "https://api.example.com"
	merchantNo := "123456"
	secretKey := "your_secret_key_here"

	_ = doEcho(baseURL, merchantNo, secretKey)
	_ = doPing(baseURL, merchantNo, secretKey)
}
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
| 1009001003 | Invalid merchant number or merchant not found |
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

## 5.  Event Types

### 5.1 order.completed - Order Completed

Triggered after an order receives payment.

**Payload Example：**

```json
{
    "orderNo": "1234567890123456",
    "receiptAmount": "50000",
    "currency": "TWD",
    "gmtPayment": "20260225143052",
    "type": "C",
    "tradeStatus": "WAIT_BUYER_PAY"
}
```

| Field | Type | Description |
|---|---|---|
| orderNo | String | Order Number |
| receiptAmount | String | Actual Received Amount |
| currency | String | Currency (Default: TWD; Possible Values: TWD / USD) |
| gmtPayment | String | Payment Time |
| type | String | Transaction Type (See description below) |
| tradeStatus | String | Transaction Status |

**Transaction Type (type) Code Description：**

| Code | Description |
|---|---|
| A | Counter |
| B / P | Voice |
| C | Online Banking |
| D | Mobile Banking |
| E / R | Remittance |
| F | FXML |
| G | eBill |
| J | ADM |
| M | MOD |
| T | ATM |
| X | eATM |
| 0 | 其他 |

**Transaction Status (tradeStatus) Code Description：**

| Code | Description |
|---|---|
| WAIT_BUYER_PAY | Pending Payment |
| TRADE_SUCCESS | Success |
| TRADE_CLOSED | Closed |
| TRADE_FINISHED | Finished |
| TRADE_TIMEOUT | Timeout |
| TRADE_CLEAR | Cleared |

### 5.2 order.clear - Order Cancelled

Triggered after an order is cancelled.

**Payload Example：**

```json
{
    "orderNo": "1234567890123456",
    "tradeStatus": "WAIT_BUYER_PAY",
    "timeoutType": "USER_TIMEOUT"
}
```

| Field | Type | Description |
|---|---|---|
| orderNo | String | Order Number |
| tradeStatus | String | Transaction Status |
| timeoutType | String | Timeout Type |

**Transaction Status (tradeStatus) Code Description：**

| Code | Description |
|---|---|
| WAIT_BUYER_PAY | Pending Payment |
| TRADE_SUCCESS | Success |
| TRADE_CLOSED | Closed |
| TRADE_FINISHED | Finished |
| TRADE_TIMEOUT | Timeout |
| TRADE_CLEAR | Cleared |

**Timeout Type (timeoutType) Code Description：**

| Code | Description |
|---|---|
| SYSTEM_CLOSE | System Close |
| USER_TIMEOUT | User Timeout |

---


## 6. Payment Orders

### 6.1. Create Payment Order

- **API Endpoint**：`POST /open-api/payment-order/create`
- **API Description**：Used by merchants to create new payment orders
- **Authentication Method**：OpenAPI Authentication

#### Request Parameters

| Parameter Name | Type | Required | Example Value | Description |
|--------|------|------|--------|------|
| subject | String | Yes | A | Title |
| transactionType | Integer | Yes | 1 | Order Transaction Type (1:Merit Goods, 2:Virtual Currency (Offline), 3:Virtual Currency P2P, 4:Mining Platform B2B Receipt, 5:Game Recharge Charge, 6:Retail Receipt) |
| currency | String | Yes | TWD | Currency (TWD, USD) |
| totalAmount | BigDecimal | Yes | 100.00 | Order Total Amount |
| gmtCreate | LocalDateTime | Yes | 2023-01-01T10:00:00 | Transaction Creation Time |
| timeExpire | LocalDateTime | Yes | 2023-01-02T10:00:00 | Order Timeout Time |
| passbackParams | String | No | param=value | Public Backward Parameters |
| merchantParams | String | No | custom=data | Merchant Parameters |

#### Request Example

```json
{
  "subject": "A",
  "transactionType": 1,
  "currency": "TWD",
  "totalAmount": 100.00,
  "gmtCreate": "2023-01-01T10:00:00",
  "timeExpire": "2023-01-02T10:00:00",
  "passbackParams": "param=value",
  "merchantParams": "custom=data"
}
```

#### Response Parameters

| Parameter Name | Type | Example Value | Description |
|--------|------|--------|------|
| id | Long | 21380 | Primary Key |
| orderNo | String | ORDER20230101001 | Order Number |
| subject | String | A | Title |
| transactionType | Integer | 1 | Order Transaction Type |
| currency | String | TWD | Currency |
| totalAmount | BigDecimal | 100.00 | Order Total Amount |
| receiptAmount | BigDecimal | 100.00 | Received Amount |
| tradeStatus | String | WAIT_BUYER_PAY | Transaction Status |
| gmtCreate | LocalDateTime | 2023-01-01T10:00:00 | Transaction Creation Time |
| gmtPayment | LocalDateTime | null | Payment Time |
| timeExpire | LocalDateTime | 2023-01-02T10:00:00 | Order Timeout Time |
| timeoutType | String | null | Timeout Type: SYSTEM_CLOSE（System Close）、USER_TIMEOUT（User Timeout） |
| merchantId | Long | 20116 | Merchant ID |
| passbackParams | String | param=value | Public Backward Parameters |
| merchantParams | String | custom=data | Merchant Parameters |
| createTime | LocalDateTime | 2023-01-01T10:00:00 | Creation Time |

#### Response Example
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 21380,
    "orderNo": "ORDER20230101001",
    "subject": "购买商品A",
    "transactionType": 1,
    "currency": "TWD",
    "totalAmount": 100.00,
    "receiptAmount": 100.00,
    "tradeStatus": "WAIT_BUYER_PAY",
    "gmtCreate": "2023-01-01T10:00:00",
    "gmtPayment": null,
    "timeExpire": "2023-01-02T10:00:00",
    "timeoutType": null,
    "merchantId": 20116,
    "passbackParams": "passbackParams",
    "merchantParams": "merchantParams",
    "createTime": "2023-01-01T10:00:00"
  }
}
```

### 6.2. Query Payment Order

- **API Endpoint**：`GET /open-api/payment-order/get`
- **API Description**：Query payment order details by order number
- **Authentication Method**：OpenAPI Authentication

#### Request Parameters

| Parameter Name | Type | Required | Example Value | Description |
|--------|------|------|--------|------|
| orderNo | String | Yes | ORDER20230101001 | Order Number |

#### Response Parameters

Same as "Create Payment Order" interface response parameters.

#### Response Example
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 21380,
    "orderNo": "ORDER20230101001",
    "subject": "购买商品A",
    "transactionType": 1,
    "currency": "TWD",
    "totalAmount": 100.00,
    "receiptAmount": 100.00,
    "tradeStatus": "TRADE_SUCCESS",
    "gmtCreate": "2023-01-01T10:00:00",
    "gmtPayment": "2023-01-01T10:30:00",
    "timeExpire": "2023-01-02T10:00:00",
    "timeoutType": null,
    "merchantId": 20116,
    "passbackParams": "param=value",
    "merchantParams": "custom=data",
    "createTime": "2023-01-01T10:00:00"
  }
}
```

### 6.3. Cancel Payment Order

- **API Endpoint**：`POST /open-api/payment-order/clear`
- **API Description**：Cancel payment order by order number
- **Authentication Method**：OpenAPI Authentication

#### Request Parameters

| Parameter Name | Type | Required | Example Value | Description |
|--------|------|------|--------|------|
| orderNo | String | Yes | ORDER20230101001 | Order Number |

#### Response Parameters

| Parameter Name | Type | Example Value | Description |
|--------|------|--------|------|
| code | Integer | 0 | Status Code |
| message | String | success | Message |
| data | Boolean | true | Whether Successful |

#### Response Example
```json
{
  "code": 0,
  "message": "success",
  "data": true
}
```

---

## 7. FAQ

### Q: Signature verification keeps failing?

Please check the following:
1. Verify that `X-Api-MerchantNo` is correct and that your Secret Key matches the one in the admin console and is only used for local signing
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
