# Open API 对接指南

## 1. 概述

本文档描述如何通过 Open API 与我们的虚拟账号平台进行集成，包括 API 请求签名、Webhook 回调验签等内容。

### 1.1 基础信息

| 项目 | 说明 |
|---|---|
| Base URL | `https://{host}/admin-api` |
| 协议 | HTTPS |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |

### 1.2 密钥说明

开通合作后，您将获得两组密钥：

| 密钥 | 用途 |
|---|---|
| **Secret Key** | 用于 API 请求签名，证明请求来源的合法性 |
| **Webhook Key** | 用于验证我方回调请求的真实性，防止伪造 |

> ⚠️ 请妥善保管密钥，切勿在客户端代码、日志或版本控制中暴露。如果密钥泄露，请立即联系我们重新生成。

---

## 2. API 请求签名

所有 Open API 请求都需要携带签名信息用于身份验证。

### 2.1 请求头

| Header | 必填 | 说明 |
|---|---|---|
| `X-Api-Key` | 是 | 您的 Secret Key |
| `X-Api-Timestamp` | 是 | 当前 Unix 时间戳（秒） |
| `X-Api-Signature` | 是 | HMAC-SHA256 签名（Hex 编码） |
| `Content-Type` | 是 | `application/json` |

### 2.2 签名算法

**步骤 1：构造待签名字符串**

```
StringToSign = HTTP_METHOD + "\n" + REQUEST_PATH + "\n" + TIMESTAMP + "\n" + REQUEST_BODY
```

| 部分 | 说明 | 示例 |
|---|---|---|
| HTTP_METHOD | 大写 HTTP 方法 | `POST` |
| REQUEST_PATH | 请求路径（不含域名和查询参数） | `/admin-api/bank/open/virtual-account/create` |
| TIMESTAMP | 与 `X-Api-Timestamp` 一致 | `1708862400` |
| REQUEST_BODY | 完整的请求体 JSON 字符串，无请求体时为空字符串 | `{"type":1,"amount":1000}` |

> 注意：各部分之间使用 `\n`（换行符）连接。

**步骤 2：计算 HMAC-SHA256**

```
Signature = Hex( HMAC-SHA256( SecretKey, StringToSign ) )
```

使用您的 Secret Key 作为 HMAC 密钥，对待签名字符串进行 HMAC-SHA256 运算，然后将结果转为十六进制小写字符串。

### 2.3 时间戳验证

- 服务端会验证时间戳与当前时间的偏差，允许范围为 **±5 分钟**
- 请确保您的服务器时钟与 NTP 服务器同步

### 2.4 完整请求示例

```http
POST /admin-api/bank/open/virtual-account/create HTTP/1.1
Host: api.example.com
Content-Type: application/json
X-Api-Key: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
X-Api-Timestamp: 1708862400
X-Api-Signature: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08

{"type":1,"amount":1000,"expireDate":"2025-12-31T23:59:59"}
```

### 2.5 代码示例

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

# 使用示例
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

// 使用示例
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

// 使用示例
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

## 3. API 响应格式

所有 API 接口统一返回以下 JSON 格式：

```json
{
    "code": 0,
    "data": { ... },
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
| 1009001003 | 无效的 API Key |
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
| `X-Webhook-Event` | 事件类型，如 `deposit.completed` |
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
        // 解析签名头
        String timestamp = null;
        String v1 = null;
        for (String part : signatureHeader.split(",")) {
            if (part.startsWith("t=")) timestamp = part.substring(2);
            if (part.startsWith("v1=")) v1 = part.substring(3);
        }
        if (timestamp == null || v1 == null) return false;

        // 检查时间戳（5 分钟容差）
        long diff = Math.abs(System.currentTimeMillis() / 1000 - Long.parseLong(timestamp));
        if (diff > 300) return false;

        // 计算签名
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
    # 解析签名头
    parts = {}
    for item in signature_header.split(','):
        key, value = item.split('=', 1)
        parts[key] = value

    timestamp = parts.get('t')
    v1 = parts.get('v1')
    if not timestamp or not v1:
        return False

    # 检查时间戳（5 分钟容差）
    if abs(time.time() - int(timestamp)) > 300:
        return False

    # 计算签名
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
    // 解析签名头
    const parts = {};
    signatureHeader.split(',').forEach(item => {
        const [key, ...rest] = item.split('=');
        parts[key] = rest.join('=');
    });

    const timestamp = parts['t'];
    const v1 = parts['v1'];
    if (!timestamp || !v1) return false;

    // 检查时间戳（5 分钟容差）
    if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) return false;

    // 计算签名
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
    // 解析签名头
    $parts = [];
    foreach (explode(',', $signatureHeader) as $item) {
        [$key, $value] = explode('=', $item, 2);
        $parts[$key] = $value;
    }

    $timestamp = $parts['t'] ?? null;
    $v1 = $parts['v1'] ?? null;
    if (!$timestamp || !$v1) return false;

    // 检查时间戳（5 分钟容差）
    if (abs(time() - (int)$timestamp) > 300) return false;

    // 计算签名
    $stringToSign = "{$timestamp}.{$body}";
    $expected = hash_hmac('sha256', $stringToSign, $webhookKey);

    return hash_equals($expected, $v1);
}
```

---

## 5. 事件类型

### 5.1 deposit.completed - 入金完成

当虚拟账号收到入金后触发。

**Payload 示例：**

```json
{
    "accountNo": "1234567890123456",
    "amount": "50000",
    "currency": "TWD",
    "transactionDate": "20250225",
    "transactionTime": "143052",
    "type": "1",
    "seqNo": "20250225001"
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| accountNo | String | 虚拟账号 |
| amount | String | 入金金额 |
| currency | String | 币别 |
| transactionDate | String | 交易日期 (yyyyMMdd) |
| transactionTime | String | 交易时间 (HHmmss) |
| type | String | 交易类型 |
| seqNo | String | 交易序号 |

---

## 6. 常见问题

### Q: 签名验证一直失败？

请检查以下几点：
1. 确认 Secret Key 是否正确
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
