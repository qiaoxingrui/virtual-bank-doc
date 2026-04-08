# Open API 对接指南

## 1. 概述

本文档描述如何通过 Open API 与我们的虚拟账号平台进行集成，包括 API 请求签名、Webhook 回调验签等内容。

### 1.1 基础信息

| 项目 | 说明                        |
|---|---------------------------|
| Base URL | `https://{host}/open-api` |
| 协议 | HTTPS                     |
| 数据格式 | JSON                      |
| 字符编码 | UTF-8                     |

### 1.2 密钥与商户号说明

开通合作后，您将获得 **商户号（Merchant No）** 以及两组密钥：

| 项目 | 用途 |
|---|---|
| **商户号** | 在 API 请求头中标识您的身份（非密钥，可随请求传递） |
| **Secret Key** | 仅在您服务端本地用于计算 `X-Api-Signature`，**不要**放入请求头或通过网络明文传输 |
| **Webhook Key** | 用于验证我方回调请求的真实性，防止伪造 |

> ⚠️ 请妥善保管 Secret Key 与 Webhook Key，切勿在客户端代码、日志或版本控制中暴露。Open API 请求头中只传商户号，服务端根据商户号查询并校验签名，避免 Secret Key 在网络上传输。如果密钥泄露，请立即联系我们重新生成。

---

## 2. API 请求签名

所有 Open API 请求都需要携带签名信息用于身份验证。

### 2.1 请求头

| Header | 必填 | 说明 |
|---|---|---|
| `X-Api-MerchantNo` | 是 | 您的商户号 |
| `X-Api-Timestamp` | 是 | 当前 Unix 时间戳（秒） |
| `X-Api-Signature` | 是 | HMAC-SHA256 签名（Hex 编码），使用 Secret Key 在本地计算 |
| `Content-Type` | 是 | `application/json` |

服务端根据 `X-Api-MerchantNo` 查询商户，使用服务端保存的 Secret Key 与请求中的签名比对；您在本地用 Secret Key 计算签名，**请勿**将 Secret Key 放入请求头。

### 2.2 签名算法

**步骤 1：构造待签名字符串**

```
StringToSign = HTTP_METHOD + "\n" + REQUEST_PATH + "\n" + TIMESTAMP + "\n" + REQUEST_BODY
```

| 部分 | 说明 | 示例 |
|---|---|---|
| HTTP_METHOD | 大写 HTTP 方法 | `POST` |
| REQUEST_PATH | 请求路径（不含域名和查询参数） | `/open-api/demo/echo` |
| TIMESTAMP | 与 `X-Api-Timestamp` 一致 | `1708862400` |
| REQUEST_BODY | 完整的请求体 JSON 字符串，无请求体时为空字符串 | `{"type":1,"amount":1000}` |

> 注意：各部分之间使用 `\n`（换行符）连接。

**步骤 2：计算 HMAC-SHA256**

```
Signature = Hex( HMAC-SHA256( SecretKey, StringToSign ) )
```

在您的服务端使用 Secret Key 作为 HMAC 密钥，对待签名字符串进行 HMAC-SHA256 运算，然后将结果转为十六进制小写字符串，将结果放入 `X-Api-Signature`。Secret Key 仅用于本地计算，不随请求发送。

### 2.3 时间戳验证

- 服务端会验证时间戳与当前时间的偏差，允许范围为 **±5 分钟**
- 请确保您的服务器时钟与 NTP 服务器同步

### 2.4 完整请求示例

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

### 2.5 代码示例

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

        // Ping: GET /open-api/demo/ping（无 body）
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

# 使用示例（Echo & Ping）
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

// 使用示例（Echo & Ping）
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

// 使用示例（Echo & Ping）
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
	// request.getRequestURI() uses the request path (including any global prefix like /api).
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

## 3. API 响应格式

所有 API 接口统一返回以下 JSON 格式：

```json
{
    "code": 0,
    "data": { },
    "msg": ""
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| code | Integer | 状态码，`0` 表示成功 |
| data | Object | 业务数据 |
| msg | String | 错误信息（成功时为空字符串） |

### 3.1 错误码

| 错误码 | 说明 |
|---|---|
| 0 | 成功 |
| 1009001003 | 商户号无效或不存在 |
| 1009001004 | 签名验证失败 |
| 1009001005 | 请求时间戳已过期 |
| 1009001006 | 缺少必要的鉴权请求头 |
| 1009001002 | 客户已被禁用 |

---

## 4. Webhook 回调

当虚拟账号收到入金时，我们会向您配置的 Webhook URL 发送 HTTP POST 通知。

### 4.1 回调请求头

| Header | 说明 |
|---|---|
| `X-Webhook-Signature` | 签名信息，格式：`t={timestamp},v1={signature}` |
| `X-Webhook-Event` | 事件类型，如 `order.completed` |
| `Content-Type` | `application/json` |

### 4.2 签名验证

**步骤 1：解析签名头**

从 `X-Webhook-Signature` 中提取 `t`（时间戳）和 `v1`（签名）：

```
X-Webhook-Signature: t=1708862400,v1=a1b2c3d4e5f6...
```

**步骤 2：构造待签名字符串**

```
StringToSign = TIMESTAMP + "." + REQUEST_BODY
```

其中 `TIMESTAMP` 是从签名头中提取的 `t` 值，`REQUEST_BODY` 是原始的请求体字符串。

**步骤 3：计算签名并比对**

```
ExpectedSignature = Hex( HMAC-SHA256( WebhookKey, StringToSign ) )
```

比较计算结果与 `v1` 值是否一致。

**步骤 4：防重放验证（推荐）**

检查 `t` 时间戳与当前时间的差值，建议拒绝超过 5 分钟的回调。

### 4.3 回调响应

- 返回 HTTP 状态码 `2xx` 视为接收成功
- 返回其他状态码或超时（30 秒）视为失败，将触发重试

### 4.4 重试策略

| 重试次数 | 延迟 |
|---|---|
| 第 1 次 | 30 秒 |
| 第 2 次 | 2 分钟 |
| 第 3 次 | 10 分钟 |
| 第 4 次 | 1 小时 |
| 第 5 次 | 6 小时 |

超过 5 次重试仍失败，将停止重试并标记为最终失败。

### 4.5 Webhook 验签代码示例

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

## 5. 事件类型

### 5.1 order.completed - 订单完成

当订单收到支付后触发。

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

| 字段 | 类型 | 说明 |
|---|---|---|
| orderNo | String | 订单号 |
| receiptAmount | String | 实收金额 |
| currency | String | 币别（默认 `TWD`，可能值：`TWD` / `USD`） |
| gmtPayment | String | 支付时间  |
| type | String | 交易类型（见下方说明） |
| tradeStatus | String | 交易状态 |

**交易类型 (type) 代码说明：**

| 代码 | 说明 |
|---|---|
| A | 临柜 |
| B / P | 语音 |
| C | 网银 |
| D | 行动银行 |
| E / R | 汇款 |
| F | FXML |
| G | eBill |
| J | ADM |
| M | MOD |
| T | ATM |
| X | eATM |
| 0 | 其他 |

**交易状态 (tradeStatus) 代码说明：**

| 代码 | 说明 |
|---|---|
| WAIT_BUYER_PAY | 待支付 |
| TRADE_SUCCESS | 成功 |
| TRADE_CLOSED | 关闭 |
| TRADE_FINISHED | 完结 |
| TRADE_TIMEOUT | 超时 |
| TRADE_CLEAR | 取消 |

### 5.2 order.clear - 订单取消

当订单取消后触发。

**Payload 示例：**

```json
{
    "orderNo": "1234567890123456",
    "tradeStatus": "WAIT_BUYER_PAY",
    "timeoutType": "USER_TIMEOUT"
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| orderNo | String | 订单号 |
| tradeStatus | String | 交易状态 |
| timeoutType | String | 超时类型 |

**交易状态 (tradeStatus) 代码说明：**

| 代码 | 说明 |
|---|---|
| WAIT_BUYER_PAY | 待支付 |
| TRADE_SUCCESS | 成功 |
| TRADE_CLOSED | 关闭 |
| TRADE_FINISHED | 完结 |
| TRADE_TIMEOUT | 超时 |
| TRADE_CLEAR | 取消 |

**超时类型 (timeoutType) 代码说明：**

| 代码 | 说明 |
|---|---|
| SYSTEM_CLOSE | 系统关闭 |
| USER_TIMEOUT | 用户超时 |

---


## 6. 支付订单

### 6.1. 创建支付订单

- **接口地址**：`POST /open-api/payment-order/create`
- **接口描述**：用于商户创建新的支付订单
- **认证方式**：OpenAPI 认证

#### 请求参数

| 参数名 | 类型            | 必填 | 示例值 | 描述                                                               |
|--------|---------------|------|--------|------------------------------------------------------------------|
| subject | String        | 是 | 购买商品A | 标题                                                               |
| transactionType | Integer       | 是 | 1 | 订单交易类型(1:功德款,2:虛擬通貨（線下）,3:虛擬通貨P2P,4:算力平臺 B2B 收款,5:游戏充值收费,6:零售收款) |
| currency | String        | 是 | TWD | 币别(TWD, USD)                                                     |
| totalAmount | BigDecimal    | 是 | 100.00 | 订单总金额                                                            |
| gmtCreate | Long          | 是 | 1775648497229 | 交易创建时间戳                                                          |
| timeExpire | Long | 是 | 1775648497229 | 订单超时时间戳                                                           |
| passbackParams | String        | 否 | param=value | 公共回传参数                                                           |
| merchantParams | String        | 否 | custom=data | 商户传入参数                                                           |

#### 请求示例

```json
{
  "subject": "购买商品A",
  "transactionType": 1,
  "currency": "TWD",
  "totalAmount": 100.00,
  "gmtCreate": "1775648408222",
  "timeExpire": "1775648408222",
  "passbackParams": "param=value",
  "merchantParams": "custom=data"
}
```

#### 响应参数

| 参数名 | 类型            | 示例值 | 描述                                                                                               |
|--------|---------------|--------|--------------------------------------------------------------------------------------------------|
| id | Long          | 21380 | 主键                                                                                               |
| orderNo | String        | ORDER20230101001 | 订单号                                                                                              |
| subject | String        | 购买商品A | 标题                                                                                               |
| transactionType | Integer       | 1 | 订单交易类型                                                                                           |
| currency | String        | TWD | 币别                                                                                               |
| totalAmount | BigDecimal    | 100.00 | 订单总金额                                                                                            |
| receiptAmount | BigDecimal    | 100.00 | 实收金额                                                                                             |
| tradeStatus | String        | WAIT_BUYER_PAY | 交易状态：WAIT_BUYER_PAY（待支付）、TRADE_SUCCESS（成功）、TRADE_CLOSED（关闭）、TRADE_FINISHED（完结）、TRADE_TIMEOUT（超时） |
| gmtCreate | Long          | 1775648408222 | 交易创建时间戳                                                                                          |
| gmtPayment | Long | 1775648408222 | 支付时间戳                                                                                             |
| timeExpire | Long | 1775648408222 | 订单超时时间戳                                                                                           |
| timeoutType | String        | null | 超时类型：SYSTEM_CLOSE（系统关闭）、USER_TIMEOUT（用户超时未付）                                                     |
| merchantId | Long          | 20116 | 商户id                                                                                             |
| passbackParams | String        | param=value | 公共回传参数                                                                                           |
| merchantParams | String        | custom=data | 商户传入参数                                                                                           |
| createTime | Long | 1775648408222 | 创建时间戳                                                                                            |

#### 响应示例
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
    "gmtCreate": "1775648497229",
    "gmtPayment": null,
    "timeExpire": "1775648497229",
    "timeoutType": null,
    "merchantId": 20116,
    "passbackParams": "passbackParams",
    "merchantParams": "merchantParams",
    "createTime": "1775648497229"
  }
}
```

### 2. 查询支付订单

- **接口地址**：`GET /open-api/payment-order/get`
- **接口描述**：根据订单号查询支付订单详情
- **认证方式**：OpenAPI 认证

#### 请求参数

| 参数名 | 类型 | 必填 | 示例值 | 描述 |
|--------|------|------|--------|------|
| orderNo | String | 是 | ORDER20230101001 | 订单号 |

#### 响应参数

同"创建支付订单"接口的响应参数。

#### 响应示例
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
    "gmtCreate": "1775648497229",
    "gmtPayment": "1775648497229",
    "timeExpire": "1775648497229",
    "timeoutType": null,
    "merchantId": 20116,
    "passbackParams": "param=value",
    "merchantParams": "custom=data",
    "createTime": "1775648497229"
  }
}
```

### 6.3. 取消支付订单

- **接口地址**：`POST /open-api/payment-order/clear`
- **接口描述**：取消指定订单号的支付订单
- **认证方式**：OpenAPI 认证

#### 请求参数

| 参数名 | 类型 | 必填 | 示例值 | 描述 |
|--------|------|------|--------|------|
| orderNo | String | 是 | ORDER20230101001 | 订单号 |

#### 响应参数

| 参数名 | 类型 | 示例值 | 描述 |
|--------|------|--------|------|
| code | Integer | 0 | 状态码 |
| message | String | success | 消息 |
| data | Boolean | true | 是否成功 |

#### 响应示例
```json
{
  "code": 0,
  "message": "success",
  "data": true
}

```

---


## 7. 常见问题

### Q: 签名验证一直失败？

请检查以下几点：
1. 确认商户号（`X-Api-MerchantNo`）是否正确，Secret Key 是否与后台一致且仅用于本地签名
2. 确认待签名字符串的拼接顺序和换行符
3. 确认时间戳是 **秒级** Unix 时间戳，不是毫秒
4. 确认请求体是原始 JSON 字符串，没有经过额外格式化
5. 确认服务器时钟准确

### Q: Webhook 收不到回调？

请检查：
1. Webhook URL 是否能从公网访问
2. 防火墙是否放行了我方服务器 IP
3. 服务端是否正确返回了 HTTP 2xx 状态码
4. 回调处理是否在 30 秒内完成

### Q: 密钥泄露了怎么办？

请立即联系我们的技术人员，我们会在后台为您重新生成密钥。旧密钥将立即失效。
