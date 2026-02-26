# Open API 串接指南

## 1. 概述

本文件說明如何透過 Open API 與我們的虛擬帳號平台進行串接，包含 API 請求簽章、Webhook 回呼驗章等內容。

### 1.1 基本資訊

| 項目 | 說明 |
|---|---|
| Base URL | `https://{host}/admin-api` |
| 通訊協定 | HTTPS |
| 資料格式 | JSON |
| 字元編碼 | UTF-8 |

### 1.2 金鑰說明

開通合作後，您將取得兩組金鑰：

| 金鑰 | 用途 |
|---|---|
| **Secret Key** | 用於 API 請求簽章，證明請求來源的合法性 |
| **Webhook Key** | 用於驗證我方回呼請求的真實性，防止偽造 |

> ⚠️ 請妥善保管金鑰，切勿在用戶端程式碼、日誌或版本控制中暴露。若金鑰洩漏，請立即聯繫我們重新產生。

---

## 2. API 請求簽章

所有 Open API 請求都需要攜帶簽章資訊用於身分驗證。

### 2.1 請求標頭

| Header | 必填 | 說明 |
|---|---|---|
| `X-Api-Key` | 是 | 您的 Secret Key |
| `X-Api-Timestamp` | 是 | 目前 Unix 時間戳記（秒） |
| `X-Api-Signature` | 是 | HMAC-SHA256 簽章（Hex 編碼） |
| `Content-Type` | 是 | `application/json` |

### 2.2 簽章演算法

**步驟 1：建構待簽章字串**

```
StringToSign = HTTP_METHOD + "\n" + REQUEST_PATH + "\n" + TIMESTAMP + "\n" + REQUEST_BODY
```

| 部分 | 說明 | 範例 |
|---|---|---|
| HTTP_METHOD | 大寫 HTTP 方法 | `POST` |
| REQUEST_PATH | 請求路徑（不含網域名稱和查詢參數） | `/admin-api/bank/open/virtual-account/create` |
| TIMESTAMP | 與 `X-Api-Timestamp` 一致 | `1708862400` |
| REQUEST_BODY | 完整的請求主體 JSON 字串，無請求主體時為空字串 | `{"type":1,"amount":1000}` |

> 注意：各部分之間使用 `\n`（換行字元）串接。

**步驟 2：計算 HMAC-SHA256**

```
Signature = Hex( HMAC-SHA256( SecretKey, StringToSign ) )
```

使用您的 Secret Key 作為 HMAC 金鑰，對待簽章字串進行 HMAC-SHA256 運算，然後將結果轉為十六進位小寫字串。

### 2.3 時間戳記驗證

- 伺服器端會驗證時間戳記與目前時間的偏差，容許範圍為 **±5 分鐘**
- 請確保您的伺服器時鐘與 NTP 伺服器同步

### 2.4 完整請求範例

```http
POST /admin-api/bank/open/virtual-account/create HTTP/1.1
Host: api.example.com
Content-Type: application/json
X-Api-Key: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
X-Api-Timestamp: 1708862400
X-Api-Signature: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08

{"type":1,"amount":1000,"expireDate":"2025-12-31T23:59:59"}
```

### 2.5 程式碼範例

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

# 使用範例
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

// 使用範例
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

// 使用範例
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
| 1009001003 | 無效的 API Key |
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

### 5.1 deposit.completed - 入金完成

當虛擬帳號收到入金後觸發。

**Payload 範例：**

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

| 欄位 | 類型 | 說明 |
|---|---|---|
| accountNo | String | 虛擬帳號 |
| amount | String | 入金金額 |
| currency | String | 幣別（預設 `TWD`，可能值：`TWD` / `USD`） |
| transactionDate | String | 交易日期 (yyyyMMdd) |
| transactionTime | String | 交易時間 (HHmmss) |
| type | String | 交易類別（見下方說明） |
| seqNo | String | 交易序號 |

**交易類別 (type) 代碼說明：**

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
| 0 | 其它 |

---

## 6. 常見問題

### Q: 簽章驗證一直失敗？

請檢查以下幾點：
1. 確認 Secret Key 是否正確
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
