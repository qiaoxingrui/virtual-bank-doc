# Open API 串接指南

## 1. 概述

本文件說明如何透過 Open API 與我們的虛擬帳號平台進行串接，包含 API 請求簽章、Webhook 回呼驗章等內容。

### 1.1 基本資訊

| 項目 | 說明                        |
|---|---------------------------|
| Base URL | `https://{host}/open-api` |
| 通訊協定 | HTTPS                     |
| 資料格式 | JSON                      |
| 字元編碼 | UTF-8                     |

### 1.2 金鑰與商戶號說明

開通合作後，您將取得 **商戶號（Merchant No）** 以及兩組金鑰：

| 項目 | 用途 |
|---|---|
| **商戶號** | 在 API 請求標頭中識別您的身分（非金鑰，可隨請求傳遞） |
| **Secret Key** | 僅在您伺服器端本地用於計算 `X-Api-Signature`，**請勿**放入請求標頭或以明文於網路上傳輸 |
| **Webhook Key** | 用於驗證我方回呼請求的真實性，防止偽造 |

> ⚠️ 請妥善保管 Secret Key 與 Webhook Key，切勿在用戶端程式碼、日誌或版本控制中暴露。Open API 請求標頭僅傳遞商戶號，伺服器端依商戶號查詢並驗章，避免 Secret Key 在網路上傳輸。若金鑰洩漏，請立即聯繫我們重新產生。

---

## 2. API 請求簽章

所有 Open API 請求都需要攜帶簽章資訊用於身分驗證。

### 2.1 請求標頭

| Header | 必填 | 說明 |
|---|---|---|
| `X-Api-MerchantNo` | 是 | 您的商戶號 |
| `X-Api-Timestamp` | 是 | 目前 Unix 時間戳記（秒） |
| `X-Api-Signature` | 是 | HMAC-SHA256 簽章（Hex 編碼），以 Secret Key 在本地計算 |
| `Content-Type` | 是 | `application/json` |

伺服器端依 `X-Api-MerchantNo` 查詢商戶，並以伺服器端保存的 Secret Key 與請求中的簽章比對；您在本地以 Secret Key 計算簽章，**請勿**將 Secret Key 放入請求標頭。

### 2.2 簽章演算法

**步驟 1：建構待簽章字串**

```
StringToSign = HTTP_METHOD + "\n" + REQUEST_PATH + "\n" + TIMESTAMP + "\n" + REQUEST_BODY
```

| 部分 | 說明 | 範例 |
|---|---|---|
| HTTP_METHOD | 大寫 HTTP 方法 | `POST` |
| REQUEST_PATH | 請求路徑（不含網域名稱和查詢參數） | `/open-api/demo/echo` |
| TIMESTAMP | 與 `X-Api-Timestamp` 一致 | `1708862400` |
| REQUEST_BODY | 完整的請求主體 JSON 字串，無請求主體時為空字串 | `{"type":1,"amount":1000}` |

> 注意：各部分之間使用 `\n`（換行字元）串接。

**步驟 2：計算 HMAC-SHA256**

```
Signature = Hex( HMAC-SHA256( SecretKey, StringToSign ) )
```

在您的伺服器端以 Secret Key 作為 HMAC 金鑰，對待簽章字串進行 HMAC-SHA256 運算，然後將結果轉為十六進位小寫字串，並放入 `X-Api-Signature`。Secret Key 僅用於本地計算，不隨請求送出。

### 2.3 時間戳記驗證

- 伺服器端會驗證時間戳記與目前時間的偏差，容許範圍為 **±5 分鐘**
- 請確保您的伺服器時鐘與 NTP 伺服器同步

### 2.4 完整請求範例

#### Echo（POST）

```http
POST /open-api/demo/echo HTTP/1.1
Host: api.example.com
Content-Type: application/json
X-Api-MerchantNo: 123456
X-Api-Timestamp: 1708862400
X-Api-Signature: <calculated_signature>

{"foo":"bar"}
```

#### Ping（GET）

```http
GET /open-api/demo/ping HTTP/1.1
Host: api.example.com
X-Api-MerchantNo: 123456
X-Api-Timestamp: 1708862400
X-Api-Signature: <calculated_signature>
```

### 2.5 程式碼範例

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

        // Echo: POST /open-api/demo/echo（有 body）
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

        // Ping: GET /open-api/demo/ping（無 body）
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

# 使用範例（Echo & Ping）
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

// 使用範例（Echo & Ping）
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

// 使用範例
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

## 3. API 回應格式

所有 API 介面統一回傳以下 JSON 格式：

```json
{
    "code": 0,
    "data": { },
    "msg": ""
}
```

| 欄位 | 類型 | 說明 |
|---|---|---|
| code | Integer | 狀態碼，`0` 表示成功 |
| data | Object | 業務資料 |
| msg | String | 錯誤訊息（成功時為空字串） |

### 3.1 錯誤碼

| 錯誤碼 | 說明 |
|---|---|
| 0 | 成功 |
| 1009001003 | 商戶號無效或不存在 |
| 1009001004 | 簽章驗證失敗 |
| 1009001005 | 請求時間戳記已過期 |
| 1009001006 | 缺少必要的驗證請求標頭 |
| 1009001002 | 客戶已被停用 |

---

## 4. Webhook 回呼

當虛擬帳號收到入金時，我們會向您設定的 Webhook URL 傳送 HTTP POST 通知。

### 4.1 回呼請求標頭

| Header | 說明 |
|---|---|
| `X-Webhook-Signature` | 簽章資訊，格式：`t={timestamp},v1={signature}` |
| `X-Webhook-Event` | 事件類型，如 `deposit.completed` |
| `Content-Type` | `application/json` |

### 4.2 簽章驗證

**步驟 1：解析簽章標頭**

從 `X-Webhook-Signature` 中擷取 `t`（時間戳記）和 `v1`（簽章）：

```
X-Webhook-Signature: t=1708862400,v1=a1b2c3d4e5f6...
```

**步驟 2：建構待簽章字串**

```
StringToSign = TIMESTAMP + "." + REQUEST_BODY
```

其中 `TIMESTAMP` 是從簽章標頭中擷取的 `t` 值，`REQUEST_BODY` 是原始的請求主體字串。

**步驟 3：計算簽章並比對**

```
ExpectedSignature = Hex( HMAC-SHA256( WebhookKey, StringToSign ) )
```

比較計算結果與 `v1` 值是否一致。

**步驟 4：防重送驗證（建議）**

檢查 `t` 時間戳記與目前時間的差值，建議拒絕超過 5 分鐘的回呼。

### 4.3 回呼回應

- 回傳 HTTP 狀態碼 `2xx` 視為接收成功
- 回傳其他狀態碼或逾時（30 秒）視為失敗，將觸發重試

### 4.4 重試策略

| 重試次數 | 延遲 |
|---|---|
| 第 1 次 | 30 秒 |
| 第 2 次 | 2 分鐘 |
| 第 3 次 | 10 分鐘 |
| 第 4 次 | 1 小時 |
| 第 5 次 | 6 小時 |

超過 5 次重試仍失敗，將停止重試並標記為最終失敗。

### 4.5 Webhook 驗章程式碼範例

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

## 5. 事件類型

### 5.1 order.completed - 訂單完成

當訂單收到支付後觸發。

**Payload 示例：**

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

| 字段 | 類型 | 說明 |
|---|---|---|
| orderNo | String | 訂單號 |
| receiptAmount | String | 實收金額 |
| currency | String | 幣別（默認 `TWD`，可能值：`TWD` / `USD`） |
| gmtPayment | String | 支付時間  |
| type | String | 交易類型（見下方說明） |
| tradeStatus | String | 交易狀態 |

**交易類型 (type) 代碼說明：**

| 代碼 | 說明 |
|---|---|
| A | 臨櫃 |
| B / P | 語音 |
| C | 網銀 |
| D | 行動銀行 |
| E / R | 匯款 |
| F | FXML |
| G | eBill |
| J | ADM |
| M | MOD |
| T | ATM |
| X | eATM |
| 0 | 其他 |

**交易狀態 (tradeStatus) 代碼說明：**

| 代碼 | 說明 |
|---|---|
| WAIT_BUYER_PAY | 待支付 |
| TRADE_SUCCESS | 成功 |
| TRADE_CLOSED | 關閉 |
| TRADE_FINISHED | 完結 |
| TRADE_TIMEOUT | 超時 |
| TRADE_CLEAR | 取消 |

### 5.2 order.clear - 訂單取消

當訂單取消後觸發。

**Payload 示例：**

```json
{
    "orderNo": "1234567890123456",
    "tradeStatus": "WAIT_BUYER_PAY",
    "timeoutType": "USER_TIMEOUT"
}
```

| 字段 | 類型 | 說明 |
|---|---|---|
| orderNo | String | 訂單號 |
| tradeStatus | String | 交易狀態 |
| timeoutType | String | 超時類型 |

**交易狀態 (tradeStatus) 代碼說明：**

| 代碼 | 說明 |
|---|---|
| WAIT_BUYER_PAY | 待支付 |
| TRADE_SUCCESS | 成功 |
| TRADE_CLOSED | 關閉 |
| TRADE_FINISHED | 完結 |
| TRADE_TIMEOUT | 超時 |
| TRADE_CLEAR | 取消 |

**超時類型 (timeoutType) 代碼說明：**

| 代碼 | 說明 |
|---|---|
| SYSTEM_CLOSE | 系統關閉 |
| USER_TIMEOUT | 用戶超時 |

---


## 6. 支付訂單

### 6.1. 創建支付訂單

- **接口地址**：`POST /open-api/payment-order/create`
- **接口描述**：用於商戶創建新的支付訂單
- **認證方式**：OpenAPI 認證

#### 請求參數

| 參數名 | 類型 | 必填 | 示例值 | 描述 |
|--------|------|------|--------|------|
| subject | String | 是 | 購買商品A | 標題 |
| transactionType | Integer | 是 | 1 | 訂單交易類型(1:功德款,2:虛擬通貨（線下）,3:虛擬通貨P2P,4:算力平臺 B2B 收款,5:遊戲充值收費,6:零售收款) |
| currency | String | 是 | TWD | 幣別(TWD, USD) |
| totalAmount | BigDecimal | 是 | 100.00 | 訂單總金額 |
| gmtCreate | LocalDateTime | 是 | 2023-01-01T10:00:00 | 交易創建時間 |
| timeExpire | LocalDateTime | 是 | 2023-01-02T10:00:00 | 訂單超時時間 |
| passbackParams | String | 否 | param=value | 公共回傳參數 |
| merchantParams | String | 否 | custom=data | 商戶傳入參數 |

#### 請求示例

```json
{
  "subject": "購買商品A",
  "transactionType": 1,
  "currency": "TWD",
  "totalAmount": 100.00,
  "gmtCreate": "2023-01-01T10:00:00",
  "timeExpire": "2023-01-02T10:00:00",
  "passbackParams": "param=value",
  "merchantParams": "custom=data"
}
```

#### 響應參數

| 參數名 | 類型 | 示例值 | 描述 |
|--------|------|--------|------|
| id | Long | 21380 | 主鍵 |
| orderNo | String | ORDER20230101001 | 訂單號 |
| subject | String | 購買商品A | 標題 |
| transactionType | Integer | 1 | 訂單交易類型 |
| currency | String | TWD | 幣別 |
| totalAmount | BigDecimal | 100.00 | 訂單總金額 |
| receiptAmount | BigDecimal | 100.00 | 實收金額 |
| tradeStatus | String | WAIT_BUYER_PAY | 交易狀態：WAIT_BUYER_PAY（待支付）、TRADE_SUCCESS（成功）、TRADE_CLOSED（關閉）、TRADE_FINISHED（完結）、TRADE_TIMEOUT（超時） |
| gmtCreate | LocalDateTime | 2023-01-01T10:00:00 | 交易創建時間 |
| gmtPayment | LocalDateTime | null | 支付時間 |
| timeExpire | LocalDateTime | 2023-01-02T10:00:00 | 訂單超時時間 |
| timeoutType | String | null | 超時類型：SYSTEM_CLOSE（系統關閉）、USER_TIMEOUT（用戶超時未付） |
| passbackParams | String | param=value | 公共回傳參數 |
| merchantParams | String | custom=data | 商戶傳入參數 |
| createTime | LocalDateTime | 2023-01-01T10:00:00 | 創建時間 |

#### 響應示例
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 21380,
    "orderNo": "ORDER20230101001",
    "subject": "購買商品A",
    "transactionType": 1,
    "currency": "TWD",
    "totalAmount": 100.00,
    "receiptAmount": 100.00,
    "tradeStatus": "WAIT_BUYER_PAY",
    "gmtCreate": "2023-01-01T10:00:00",
    "gmtPayment": null,
    "timeExpire": "2023-01-02T10:00:00",
    "timeoutType": null,
    "passbackParams": "passbackParams",
    "merchantParams": "merchantParams",
    "createTime": "2023-01-01T10:00:00"
  }
}
```

### 2. 查詢支付訂單

- **接口地址**：`GET /open-api/payment-order/get`
- **接口描述**：根據訂單號查詢支付訂單詳情
- **認證方式**：OpenAPI 認證

#### 請求參數

| 參數名 | 類型 | 必填 | 示例值 | 描述 |
|--------|------|------|--------|------|
| orderNo | String | 是 | ORDER20230101001 | 訂單號 |

#### 響應參數

同"創建支付訂單"接口的響應參數。

#### 響應示例
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 21380,
    "orderNo": "ORDER20230101001",
    "subject": "購買商品A",
    "transactionType": 1,
    "currency": "TWD",
    "totalAmount": 100.00,
    "receiptAmount": 100.00,
    "tradeStatus": "TRADE_SUCCESS",
    "gmtCreate": "2023-01-01T10:00:00",
    "gmtPayment": "2023-01-01T10:30:00",
    "timeExpire": "2023-01-02T10:00:00",
    "timeoutType": null,
    "passbackParams": "param=value",
    "merchantParams": "custom=data",
    "createTime": "2023-01-01T10:00:00"
  }
}
```

### 6.3. 取消支付訂單

- **接口地址**：`POST /open-api/payment-order/clear`
- **接口描述**：取消指定訂單號的支付訂單
- **認證方式**：OpenAPI 認證

#### 請求參數

| 參數名 | 類型 | 必填 | 示例值 | 描述 |
|--------|------|------|--------|------|
| orderNo | String | 是 | ORDER20230101001 | 訂單號 |

#### 響應參數

| 參數名 | 類型 | 示例值 | 描述 |
|--------|------|--------|------|
| code | Integer | 0 | 狀態碼 |
| message | String | success | 消息 |
| data | Boolean | true | 是否成功 |

#### 響應示例
```json
{
  "code": 0,
  "message": "success",
  "data": true
}

```

---

## 7. 常見問題

### Q: 簽章驗證一直失敗？

請檢查以下幾點：
1. 確認商戶號（`X-Api-MerchantNo`）是否正確，Secret Key 是否與後台一致且僅用於本地簽章
2. 確認待簽章字串的串接順序和換行字元
3. 確認時間戳記是**秒級** Unix 時間戳記，不是毫秒
4. 確認請求主體是原始 JSON 字串，沒有經過額外格式化
5. 確認伺服器時鐘準確

### Q: Webhook 收不到回呼？

請檢查：
1. Webhook URL 是否能從公開網路存取
2. 防火牆是否放行了我方伺服器 IP
3. 伺服器端是否正確回傳了 HTTP 2xx 狀態碼
4. 回呼處理是否在 30 秒內完成

### Q: 金鑰洩漏了怎麼辦？

請立即聯繫我們的技術人員，我們會在後台為您重新產生金鑰。舊金鑰將立即失效。
