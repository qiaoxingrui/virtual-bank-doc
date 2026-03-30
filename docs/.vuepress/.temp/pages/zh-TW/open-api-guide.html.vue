<template><div><h1 id="open-api-串接指南" tabindex="-1"><a class="header-anchor" href="#open-api-串接指南"><span>Open API 串接指南</span></a></h1>
<h2 id="_1-概述" tabindex="-1"><a class="header-anchor" href="#_1-概述"><span>1. 概述</span></a></h2>
<p>本文件說明如何透過 Open API 與我們的虛擬帳號平台進行串接，包含 API 請求簽章、Webhook 回呼驗章等內容。</p>
<h3 id="_1-1-基本資訊" tabindex="-1"><a class="header-anchor" href="#_1-1-基本資訊"><span>1.1 基本資訊</span></a></h3>
<table>
<thead>
<tr>
<th>項目</th>
<th>說明</th>
</tr>
</thead>
<tbody>
<tr>
<td>Base URL</td>
<td><code v-pre>https://{host}/open-api</code></td>
</tr>
<tr>
<td>通訊協定</td>
<td>HTTPS</td>
</tr>
<tr>
<td>資料格式</td>
<td>JSON</td>
</tr>
<tr>
<td>字元編碼</td>
<td>UTF-8</td>
</tr>
</tbody>
</table>
<h3 id="_1-2-金鑰與商戶號說明" tabindex="-1"><a class="header-anchor" href="#_1-2-金鑰與商戶號說明"><span>1.2 金鑰與商戶號說明</span></a></h3>
<p>開通合作後，您將取得 <strong>商戶號（Merchant No）</strong> 以及兩組金鑰：</p>
<table>
<thead>
<tr>
<th>項目</th>
<th>用途</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>商戶號</strong></td>
<td>在 API 請求標頭中識別您的身分（非金鑰，可隨請求傳遞）</td>
</tr>
<tr>
<td><strong>Secret Key</strong></td>
<td>僅在您伺服器端本地用於計算 <code v-pre>X-Api-Signature</code>，<strong>請勿</strong>放入請求標頭或以明文於網路上傳輸</td>
</tr>
<tr>
<td><strong>Webhook Key</strong></td>
<td>用於驗證我方回呼請求的真實性，防止偽造</td>
</tr>
</tbody>
</table>
<blockquote>
<p>⚠️ 請妥善保管 Secret Key 與 Webhook Key，切勿在用戶端程式碼、日誌或版本控制中暴露。Open API 請求標頭僅傳遞商戶號，伺服器端依商戶號查詢並驗章，避免 Secret Key 在網路上傳輸。若金鑰洩漏，請立即聯繫我們重新產生。</p>
</blockquote>
<hr>
<h2 id="_2-api-請求簽章" tabindex="-1"><a class="header-anchor" href="#_2-api-請求簽章"><span>2. API 請求簽章</span></a></h2>
<p>所有 Open API 請求都需要攜帶簽章資訊用於身分驗證。</p>
<h3 id="_2-1-請求標頭" tabindex="-1"><a class="header-anchor" href="#_2-1-請求標頭"><span>2.1 請求標頭</span></a></h3>
<table>
<thead>
<tr>
<th>Header</th>
<th>必填</th>
<th>說明</th>
</tr>
</thead>
<tbody>
<tr>
<td><code v-pre>X-Api-MerchantNo</code></td>
<td>是</td>
<td>您的商戶號</td>
</tr>
<tr>
<td><code v-pre>X-Api-Timestamp</code></td>
<td>是</td>
<td>目前 Unix 時間戳記（秒）</td>
</tr>
<tr>
<td><code v-pre>X-Api-Signature</code></td>
<td>是</td>
<td>HMAC-SHA256 簽章（Hex 編碼），以 Secret Key 在本地計算</td>
</tr>
<tr>
<td><code v-pre>Content-Type</code></td>
<td>是</td>
<td><code v-pre>application/json</code></td>
</tr>
</tbody>
</table>
<p>伺服器端依 <code v-pre>X-Api-MerchantNo</code> 查詢商戶，並以伺服器端保存的 Secret Key 與請求中的簽章比對；您在本地以 Secret Key 計算簽章，<strong>請勿</strong>將 Secret Key 放入請求標頭。</p>
<h3 id="_2-2-簽章演算法" tabindex="-1"><a class="header-anchor" href="#_2-2-簽章演算法"><span>2.2 簽章演算法</span></a></h3>
<p><strong>步驟 1：建構待簽章字串</strong></p>
<div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text"><pre v-pre><code><span class="line">StringToSign = HTTP_METHOD + "\n" + REQUEST_PATH + "\n" + TIMESTAMP + "\n" + REQUEST_BODY</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><table>
<thead>
<tr>
<th>部分</th>
<th>說明</th>
<th>範例</th>
</tr>
</thead>
<tbody>
<tr>
<td>HTTP_METHOD</td>
<td>大寫 HTTP 方法</td>
<td><code v-pre>POST</code></td>
</tr>
<tr>
<td>REQUEST_PATH</td>
<td>請求路徑（不含網域名稱和查詢參數）</td>
<td><code v-pre>/open-api/demo/echo</code></td>
</tr>
<tr>
<td>TIMESTAMP</td>
<td>與 <code v-pre>X-Api-Timestamp</code> 一致</td>
<td><code v-pre>1708862400</code></td>
</tr>
<tr>
<td>REQUEST_BODY</td>
<td>完整的請求主體 JSON 字串，無請求主體時為空字串</td>
<td><code v-pre>{&quot;type&quot;:1,&quot;amount&quot;:1000}</code></td>
</tr>
</tbody>
</table>
<blockquote>
<p>注意：各部分之間使用 <code v-pre>\n</code>（換行字元）串接。</p>
</blockquote>
<p><strong>步驟 2：計算 HMAC-SHA256</strong></p>
<div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text"><pre v-pre><code><span class="line">Signature = Hex( HMAC-SHA256( SecretKey, StringToSign ) )</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><p>在您的伺服器端以 Secret Key 作為 HMAC 金鑰，對待簽章字串進行 HMAC-SHA256 運算，然後將結果轉為十六進位小寫字串，並放入 <code v-pre>X-Api-Signature</code>。Secret Key 僅用於本地計算，不隨請求送出。</p>
<h3 id="_2-3-時間戳記驗證" tabindex="-1"><a class="header-anchor" href="#_2-3-時間戳記驗證"><span>2.3 時間戳記驗證</span></a></h3>
<ul>
<li>伺服器端會驗證時間戳記與目前時間的偏差，容許範圍為 <strong>±5 分鐘</strong></li>
<li>請確保您的伺服器時鐘與 NTP 伺服器同步</li>
</ul>
<h3 id="_2-4-完整請求範例" tabindex="-1"><a class="header-anchor" href="#_2-4-完整請求範例"><span>2.4 完整請求範例</span></a></h3>
<h4 id="echo-post" tabindex="-1"><a class="header-anchor" href="#echo-post"><span>Echo（POST）</span></a></h4>
<div class="language-http line-numbers-mode" data-highlighter="prismjs" data-ext="http"><pre v-pre><code><span class="line"><span class="token request-line"><span class="token method property">POST</span> <span class="token request-target url">/open-api/demo/echo</span> <span class="token http-version property">HTTP/1.1</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">Host</span><span class="token punctuation">:</span> <span class="token header-value">api.example.com</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">Content-Type</span><span class="token punctuation">:</span> <span class="token header-value">application/json</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">X-Api-MerchantNo</span><span class="token punctuation">:</span> <span class="token header-value">123456</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">X-Api-Timestamp</span><span class="token punctuation">:</span> <span class="token header-value">1708862400</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">X-Api-Signature</span><span class="token punctuation">:</span> <span class="token header-value">&lt;calculated_signature></span></span></span>
<span class="line"><span class="token application-json"></span>
<span class="line"><span class="token punctuation">{</span><span class="token property">"foo"</span><span class="token operator">:</span><span class="token string">"bar"</span><span class="token punctuation">}</span></span>
<span class="line"></span></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="ping-get" tabindex="-1"><a class="header-anchor" href="#ping-get"><span>Ping（GET）</span></a></h4>
<div class="language-http line-numbers-mode" data-highlighter="prismjs" data-ext="http"><pre v-pre><code><span class="line"><span class="token request-line"><span class="token method property">GET</span> <span class="token request-target url">/open-api/demo/ping</span> <span class="token http-version property">HTTP/1.1</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">Host</span><span class="token punctuation">:</span> <span class="token header-value">api.example.com</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">X-Api-MerchantNo</span><span class="token punctuation">:</span> <span class="token header-value">123456</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">X-Api-Timestamp</span><span class="token punctuation">:</span> <span class="token header-value">1708862400</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">X-Api-Signature</span><span class="token punctuation">:</span> <span class="token header-value">&lt;calculated_signature></span></span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-5-程式碼範例" tabindex="-1"><a class="header-anchor" href="#_2-5-程式碼範例"><span>2.5 程式碼範例</span></a></h3>
<h4 id="java" tabindex="-1"><a class="header-anchor" href="#java"><span>Java</span></a></h4>
<div class="language-java line-numbers-mode" data-highlighter="prismjs" data-ext="java"><pre v-pre><code><span class="line"><span class="token keyword">import</span> <span class="token import"><span class="token namespace">javax<span class="token punctuation">.</span>crypto<span class="token punctuation">.</span></span><span class="token class-name">Mac</span></span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">import</span> <span class="token import"><span class="token namespace">javax<span class="token punctuation">.</span>crypto<span class="token punctuation">.</span>spec<span class="token punctuation">.</span></span><span class="token class-name">SecretKeySpec</span></span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>nio<span class="token punctuation">.</span>charset<span class="token punctuation">.</span></span><span class="token class-name">StandardCharsets</span></span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>net<span class="token punctuation">.</span></span><span class="token class-name">URI</span></span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>net<span class="token punctuation">.</span>http<span class="token punctuation">.</span></span><span class="token class-name">HttpClient</span></span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>net<span class="token punctuation">.</span>http<span class="token punctuation">.</span></span><span class="token class-name">HttpRequest</span></span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>net<span class="token punctuation">.</span>http<span class="token punctuation">.</span></span><span class="token class-name">HttpResponse</span></span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>time<span class="token punctuation">.</span></span><span class="token class-name">Instant</span></span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">ApiSignature</span> <span class="token punctuation">{</span></span>
<span class="line"></span>
<span class="line">    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token class-name">String</span> <span class="token function">sign</span><span class="token punctuation">(</span><span class="token class-name">String</span> secretKey<span class="token punctuation">,</span> <span class="token class-name">String</span> method<span class="token punctuation">,</span> <span class="token class-name">String</span> path<span class="token punctuation">,</span></span>
<span class="line">                              <span class="token class-name">String</span> timestamp<span class="token punctuation">,</span> <span class="token class-name">String</span> body<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token class-name">String</span> stringToSign <span class="token operator">=</span> method <span class="token operator">+</span> <span class="token string">"\n"</span> <span class="token operator">+</span> path <span class="token operator">+</span> <span class="token string">"\n"</span> <span class="token operator">+</span> timestamp <span class="token operator">+</span> <span class="token string">"\n"</span> <span class="token operator">+</span> <span class="token punctuation">(</span>body <span class="token operator">!=</span> <span class="token keyword">null</span> <span class="token operator">?</span> body <span class="token operator">:</span> <span class="token string">""</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">        <span class="token class-name">Mac</span> mac <span class="token operator">=</span> <span class="token class-name">Mac</span><span class="token punctuation">.</span><span class="token function">getInstance</span><span class="token punctuation">(</span><span class="token string">"HmacSHA256"</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        mac<span class="token punctuation">.</span><span class="token function">init</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">SecretKeySpec</span><span class="token punctuation">(</span>secretKey<span class="token punctuation">.</span><span class="token function">getBytes</span><span class="token punctuation">(</span><span class="token class-name">StandardCharsets</span><span class="token punctuation">.</span><span class="token constant">UTF_8</span><span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token string">"HmacSHA256"</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token keyword">byte</span><span class="token punctuation">[</span><span class="token punctuation">]</span> hash <span class="token operator">=</span> mac<span class="token punctuation">.</span><span class="token function">doFinal</span><span class="token punctuation">(</span>stringToSign<span class="token punctuation">.</span><span class="token function">getBytes</span><span class="token punctuation">(</span><span class="token class-name">StandardCharsets</span><span class="token punctuation">.</span><span class="token constant">UTF_8</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">        <span class="token class-name">StringBuilder</span> hex <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">StringBuilder</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token keyword">byte</span> b <span class="token operator">:</span> hash<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">            hex<span class="token punctuation">.</span><span class="token function">append</span><span class="token punctuation">(</span><span class="token class-name">String</span><span class="token punctuation">.</span><span class="token function">format</span><span class="token punctuation">(</span><span class="token string">"%02x"</span><span class="token punctuation">,</span> b<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token punctuation">}</span></span>
<span class="line">        <span class="token keyword">return</span> hex<span class="token punctuation">.</span><span class="token function">toString</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line">    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token class-name">String</span><span class="token punctuation">[</span><span class="token punctuation">]</span> args<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token class-name">String</span> merchantNo <span class="token operator">=</span> <span class="token string">"123456"</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token class-name">String</span> secretKey <span class="token operator">=</span> <span class="token string">"your_secret_key_here"</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token class-name">String</span> baseUrl <span class="token operator">=</span> <span class="token string">"https://api.example.com"</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">        <span class="token class-name">HttpClient</span> client <span class="token operator">=</span> <span class="token class-name">HttpClient</span><span class="token punctuation">.</span><span class="token function">newHttpClient</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">        <span class="token comment">// Echo: POST /open-api/demo/echo（有 body）</span></span>
<span class="line">        <span class="token class-name">String</span> echoPath <span class="token operator">=</span> <span class="token string">"/open-api/demo/echo"</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token class-name">String</span> echoBody <span class="token operator">=</span> <span class="token string">"{\"foo\":\"bar\"}"</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token class-name">String</span> echoTimestamp <span class="token operator">=</span> <span class="token class-name">String</span><span class="token punctuation">.</span><span class="token function">valueOf</span><span class="token punctuation">(</span><span class="token class-name">Instant</span><span class="token punctuation">.</span><span class="token function">now</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">getEpochSecond</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token class-name">String</span> echoSignature <span class="token operator">=</span> <span class="token function">sign</span><span class="token punctuation">(</span>secretKey<span class="token punctuation">,</span> <span class="token string">"POST"</span><span class="token punctuation">,</span> echoPath<span class="token punctuation">,</span> echoTimestamp<span class="token punctuation">,</span> echoBody<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">        <span class="token class-name">HttpRequest</span> echoReq <span class="token operator">=</span> <span class="token class-name">HttpRequest</span><span class="token punctuation">.</span><span class="token function">newBuilder</span><span class="token punctuation">(</span><span class="token punctuation">)</span></span>
<span class="line">                <span class="token punctuation">.</span><span class="token function">uri</span><span class="token punctuation">(</span><span class="token constant">URI</span><span class="token punctuation">.</span><span class="token function">create</span><span class="token punctuation">(</span>baseUrl <span class="token operator">+</span> echoPath<span class="token punctuation">)</span><span class="token punctuation">)</span></span>
<span class="line">                <span class="token punctuation">.</span><span class="token function">header</span><span class="token punctuation">(</span><span class="token string">"Content-Type"</span><span class="token punctuation">,</span> <span class="token string">"application/json"</span><span class="token punctuation">)</span></span>
<span class="line">                <span class="token punctuation">.</span><span class="token function">header</span><span class="token punctuation">(</span><span class="token string">"X-Api-MerchantNo"</span><span class="token punctuation">,</span> merchantNo<span class="token punctuation">)</span></span>
<span class="line">                <span class="token punctuation">.</span><span class="token function">header</span><span class="token punctuation">(</span><span class="token string">"X-Api-Timestamp"</span><span class="token punctuation">,</span> echoTimestamp<span class="token punctuation">)</span></span>
<span class="line">                <span class="token punctuation">.</span><span class="token function">header</span><span class="token punctuation">(</span><span class="token string">"X-Api-Signature"</span><span class="token punctuation">,</span> echoSignature<span class="token punctuation">)</span></span>
<span class="line">                <span class="token punctuation">.</span><span class="token function">POST</span><span class="token punctuation">(</span><span class="token class-name">HttpRequest<span class="token punctuation">.</span>BodyPublishers</span><span class="token punctuation">.</span><span class="token function">ofString</span><span class="token punctuation">(</span>echoBody<span class="token punctuation">)</span><span class="token punctuation">)</span></span>
<span class="line">                <span class="token punctuation">.</span><span class="token function">build</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token class-name">HttpResponse</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">></span></span> echoResp <span class="token operator">=</span> client<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>echoReq<span class="token punctuation">,</span> <span class="token class-name">HttpResponse<span class="token punctuation">.</span>BodyHandlers</span><span class="token punctuation">.</span><span class="token function">ofString</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span>echoResp<span class="token punctuation">.</span><span class="token function">body</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">        <span class="token comment">// Ping: GET /open-api/demo/ping（無 body）</span></span>
<span class="line">        <span class="token class-name">String</span> pingPath <span class="token operator">=</span> <span class="token string">"/open-api/demo/ping"</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token class-name">String</span> pingTimestamp <span class="token operator">=</span> <span class="token class-name">String</span><span class="token punctuation">.</span><span class="token function">valueOf</span><span class="token punctuation">(</span><span class="token class-name">Instant</span><span class="token punctuation">.</span><span class="token function">now</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">getEpochSecond</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token class-name">String</span> pingSignature <span class="token operator">=</span> <span class="token function">sign</span><span class="token punctuation">(</span>secretKey<span class="token punctuation">,</span> <span class="token string">"GET"</span><span class="token punctuation">,</span> pingPath<span class="token punctuation">,</span> pingTimestamp<span class="token punctuation">,</span> <span class="token string">""</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">        <span class="token class-name">HttpRequest</span> pingReq <span class="token operator">=</span> <span class="token class-name">HttpRequest</span><span class="token punctuation">.</span><span class="token function">newBuilder</span><span class="token punctuation">(</span><span class="token punctuation">)</span></span>
<span class="line">                <span class="token punctuation">.</span><span class="token function">uri</span><span class="token punctuation">(</span><span class="token constant">URI</span><span class="token punctuation">.</span><span class="token function">create</span><span class="token punctuation">(</span>baseUrl <span class="token operator">+</span> pingPath<span class="token punctuation">)</span><span class="token punctuation">)</span></span>
<span class="line">                <span class="token punctuation">.</span><span class="token function">header</span><span class="token punctuation">(</span><span class="token string">"X-Api-MerchantNo"</span><span class="token punctuation">,</span> merchantNo<span class="token punctuation">)</span></span>
<span class="line">                <span class="token punctuation">.</span><span class="token function">header</span><span class="token punctuation">(</span><span class="token string">"X-Api-Timestamp"</span><span class="token punctuation">,</span> pingTimestamp<span class="token punctuation">)</span></span>
<span class="line">                <span class="token punctuation">.</span><span class="token function">header</span><span class="token punctuation">(</span><span class="token string">"X-Api-Signature"</span><span class="token punctuation">,</span> pingSignature<span class="token punctuation">)</span></span>
<span class="line">                <span class="token punctuation">.</span><span class="token function">GET</span><span class="token punctuation">(</span><span class="token punctuation">)</span></span>
<span class="line">                <span class="token punctuation">.</span><span class="token function">build</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token class-name">HttpResponse</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">></span></span> pingResp <span class="token operator">=</span> client<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span>pingReq<span class="token punctuation">,</span> <span class="token class-name">HttpResponse<span class="token punctuation">.</span>BodyHandlers</span><span class="token punctuation">.</span><span class="token function">ofString</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span>pingResp<span class="token punctuation">.</span><span class="token function">body</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="python" tabindex="-1"><a class="header-anchor" href="#python"><span>Python</span></a></h4>
<div class="language-python line-numbers-mode" data-highlighter="prismjs" data-ext="py"><pre v-pre><code><span class="line"><span class="token keyword">import</span> hmac</span>
<span class="line"><span class="token keyword">import</span> hashlib</span>
<span class="line"><span class="token keyword">import</span> time</span>
<span class="line"><span class="token keyword">import</span> requests</span>
<span class="line"><span class="token keyword">import</span> json</span>
<span class="line"></span>
<span class="line"><span class="token keyword">def</span> <span class="token function">sign_request</span><span class="token punctuation">(</span>secret_key<span class="token punctuation">:</span> <span class="token builtin">str</span><span class="token punctuation">,</span> method<span class="token punctuation">:</span> <span class="token builtin">str</span><span class="token punctuation">,</span> path<span class="token punctuation">:</span> <span class="token builtin">str</span><span class="token punctuation">,</span></span>
<span class="line">                 timestamp<span class="token punctuation">:</span> <span class="token builtin">str</span><span class="token punctuation">,</span> body<span class="token punctuation">:</span> <span class="token builtin">str</span> <span class="token operator">=</span> <span class="token string">""</span><span class="token punctuation">)</span> <span class="token operator">-</span><span class="token operator">></span> <span class="token builtin">str</span><span class="token punctuation">:</span></span>
<span class="line">    string_to_sign <span class="token operator">=</span> <span class="token string-interpolation"><span class="token string">f"</span><span class="token interpolation"><span class="token punctuation">{</span>method<span class="token punctuation">}</span></span><span class="token string">\n</span><span class="token interpolation"><span class="token punctuation">{</span>path<span class="token punctuation">}</span></span><span class="token string">\n</span><span class="token interpolation"><span class="token punctuation">{</span>timestamp<span class="token punctuation">}</span></span><span class="token string">\n</span><span class="token interpolation"><span class="token punctuation">{</span>body<span class="token punctuation">}</span></span><span class="token string">"</span></span></span>
<span class="line">    signature <span class="token operator">=</span> hmac<span class="token punctuation">.</span>new<span class="token punctuation">(</span></span>
<span class="line">        secret_key<span class="token punctuation">.</span>encode<span class="token punctuation">(</span><span class="token string">'utf-8'</span><span class="token punctuation">)</span><span class="token punctuation">,</span></span>
<span class="line">        string_to_sign<span class="token punctuation">.</span>encode<span class="token punctuation">(</span><span class="token string">'utf-8'</span><span class="token punctuation">)</span><span class="token punctuation">,</span></span>
<span class="line">        hashlib<span class="token punctuation">.</span>sha256</span>
<span class="line">    <span class="token punctuation">)</span><span class="token punctuation">.</span>hexdigest<span class="token punctuation">(</span><span class="token punctuation">)</span></span>
<span class="line">    <span class="token keyword">return</span> signature</span>
<span class="line"></span>
<span class="line"><span class="token comment"># 使用範例（Echo &amp; Ping）</span></span>
<span class="line">merchant_no <span class="token operator">=</span> <span class="token string">"123456"</span></span>
<span class="line">secret_key <span class="token operator">=</span> <span class="token string">"your_secret_key_here"</span></span>
<span class="line">base_url <span class="token operator">=</span> <span class="token string">"https://api.example.com"</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Echo: POST /open-api/demo/echo</span></span>
<span class="line">echo_method <span class="token operator">=</span> <span class="token string">"POST"</span></span>
<span class="line">echo_path <span class="token operator">=</span> <span class="token string">"/open-api/demo/echo"</span></span>
<span class="line">echo_body <span class="token operator">=</span> json<span class="token punctuation">.</span>dumps<span class="token punctuation">(</span><span class="token punctuation">{</span><span class="token string">"foo"</span><span class="token punctuation">:</span> <span class="token string">"bar"</span><span class="token punctuation">}</span><span class="token punctuation">)</span></span>
<span class="line">echo_timestamp <span class="token operator">=</span> <span class="token builtin">str</span><span class="token punctuation">(</span><span class="token builtin">int</span><span class="token punctuation">(</span>time<span class="token punctuation">.</span>time<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span></span>
<span class="line">echo_signature <span class="token operator">=</span> sign_request<span class="token punctuation">(</span>secret_key<span class="token punctuation">,</span> echo_method<span class="token punctuation">,</span> echo_path<span class="token punctuation">,</span> echo_timestamp<span class="token punctuation">,</span> echo_body<span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line">echo_resp <span class="token operator">=</span> requests<span class="token punctuation">.</span>post<span class="token punctuation">(</span></span>
<span class="line">    <span class="token string-interpolation"><span class="token string">f"</span><span class="token interpolation"><span class="token punctuation">{</span>base_url<span class="token punctuation">}</span></span><span class="token interpolation"><span class="token punctuation">{</span>echo_path<span class="token punctuation">}</span></span><span class="token string">"</span></span><span class="token punctuation">,</span></span>
<span class="line">    headers<span class="token operator">=</span><span class="token punctuation">{</span></span>
<span class="line">        <span class="token string">"Content-Type"</span><span class="token punctuation">:</span> <span class="token string">"application/json"</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token string">"X-Api-MerchantNo"</span><span class="token punctuation">:</span> merchant_no<span class="token punctuation">,</span></span>
<span class="line">        <span class="token string">"X-Api-Timestamp"</span><span class="token punctuation">:</span> echo_timestamp<span class="token punctuation">,</span></span>
<span class="line">        <span class="token string">"X-Api-Signature"</span><span class="token punctuation">:</span> echo_signature<span class="token punctuation">,</span></span>
<span class="line">    <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">    data<span class="token operator">=</span>echo_body</span>
<span class="line"><span class="token punctuation">)</span></span>
<span class="line"><span class="token keyword">print</span><span class="token punctuation">(</span>echo_resp<span class="token punctuation">.</span>json<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line"><span class="token comment"># Ping: GET /open-api/demo/ping</span></span>
<span class="line">ping_method <span class="token operator">=</span> <span class="token string">"GET"</span></span>
<span class="line">ping_path <span class="token operator">=</span> <span class="token string">"/open-api/demo/ping"</span></span>
<span class="line">ping_timestamp <span class="token operator">=</span> <span class="token builtin">str</span><span class="token punctuation">(</span><span class="token builtin">int</span><span class="token punctuation">(</span>time<span class="token punctuation">.</span>time<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span></span>
<span class="line">ping_signature <span class="token operator">=</span> sign_request<span class="token punctuation">(</span>secret_key<span class="token punctuation">,</span> ping_method<span class="token punctuation">,</span> ping_path<span class="token punctuation">,</span> ping_timestamp<span class="token punctuation">,</span> <span class="token string">""</span><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line">ping_resp <span class="token operator">=</span> requests<span class="token punctuation">.</span>get<span class="token punctuation">(</span></span>
<span class="line">    <span class="token string-interpolation"><span class="token string">f"</span><span class="token interpolation"><span class="token punctuation">{</span>base_url<span class="token punctuation">}</span></span><span class="token interpolation"><span class="token punctuation">{</span>ping_path<span class="token punctuation">}</span></span><span class="token string">"</span></span><span class="token punctuation">,</span></span>
<span class="line">    headers<span class="token operator">=</span><span class="token punctuation">{</span></span>
<span class="line">        <span class="token string">"X-Api-MerchantNo"</span><span class="token punctuation">:</span> merchant_no<span class="token punctuation">,</span></span>
<span class="line">        <span class="token string">"X-Api-Timestamp"</span><span class="token punctuation">:</span> ping_timestamp<span class="token punctuation">,</span></span>
<span class="line">        <span class="token string">"X-Api-Signature"</span><span class="token punctuation">:</span> ping_signature<span class="token punctuation">,</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">)</span></span>
<span class="line"><span class="token keyword">print</span><span class="token punctuation">(</span>ping_resp<span class="token punctuation">.</span>json<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="node-js" tabindex="-1"><a class="header-anchor" href="#node-js"><span>Node.js</span></a></h4>
<div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js"><pre v-pre><code><span class="line"><span class="token keyword">const</span> crypto <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">'crypto'</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> axios <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">'axios'</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">function</span> <span class="token function">signRequest</span><span class="token punctuation">(</span>secretKey<span class="token punctuation">,</span> method<span class="token punctuation">,</span> path<span class="token punctuation">,</span> timestamp<span class="token punctuation">,</span> body <span class="token operator">=</span> <span class="token string">''</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token keyword">const</span> stringToSign <span class="token operator">=</span> <span class="token template-string"><span class="token template-punctuation string">`</span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">${</span>method<span class="token interpolation-punctuation punctuation">}</span></span><span class="token string">\n</span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">${</span>path<span class="token interpolation-punctuation punctuation">}</span></span><span class="token string">\n</span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">${</span>timestamp<span class="token interpolation-punctuation punctuation">}</span></span><span class="token string">\n</span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">${</span>body<span class="token interpolation-punctuation punctuation">}</span></span><span class="token template-punctuation string">`</span></span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">return</span> crypto</span>
<span class="line">        <span class="token punctuation">.</span><span class="token function">createHmac</span><span class="token punctuation">(</span><span class="token string">'sha256'</span><span class="token punctuation">,</span> secretKey<span class="token punctuation">)</span></span>
<span class="line">        <span class="token punctuation">.</span><span class="token function">update</span><span class="token punctuation">(</span>stringToSign<span class="token punctuation">,</span> <span class="token string">'utf-8'</span><span class="token punctuation">)</span></span>
<span class="line">        <span class="token punctuation">.</span><span class="token function">digest</span><span class="token punctuation">(</span><span class="token string">'hex'</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token comment">// 使用範例（Echo &amp; Ping）</span></span>
<span class="line"><span class="token keyword">const</span> merchantNo <span class="token operator">=</span> <span class="token string">'123456'</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> secretKey <span class="token operator">=</span> <span class="token string">'your_secret_key_here'</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> baseUrl <span class="token operator">=</span> <span class="token string">'https://api.example.com'</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token punctuation">(</span><span class="token keyword">async</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token comment">// Echo: POST /open-api/demo/echo</span></span>
<span class="line">    <span class="token keyword">const</span> echoPath <span class="token operator">=</span> <span class="token string">'/open-api/demo/echo'</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">const</span> echoMethod <span class="token operator">=</span> <span class="token string">'POST'</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">const</span> echoBody <span class="token operator">=</span> <span class="token constant">JSON</span><span class="token punctuation">.</span><span class="token function">stringify</span><span class="token punctuation">(</span><span class="token punctuation">{</span> <span class="token literal-property property">foo</span><span class="token operator">:</span> <span class="token string">'bar'</span> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">const</span> echoTimestamp <span class="token operator">=</span> Math<span class="token punctuation">.</span><span class="token function">floor</span><span class="token punctuation">(</span>Date<span class="token punctuation">.</span><span class="token function">now</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">/</span> <span class="token number">1000</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">toString</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">const</span> echoSignature <span class="token operator">=</span> <span class="token function">signRequest</span><span class="token punctuation">(</span>secretKey<span class="token punctuation">,</span> echoMethod<span class="token punctuation">,</span> echoPath<span class="token punctuation">,</span> echoTimestamp<span class="token punctuation">,</span> echoBody<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">    <span class="token keyword">const</span> echoResp <span class="token operator">=</span> <span class="token keyword">await</span> axios<span class="token punctuation">.</span><span class="token function">post</span><span class="token punctuation">(</span><span class="token template-string"><span class="token template-punctuation string">`</span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">${</span>baseUrl<span class="token interpolation-punctuation punctuation">}</span></span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">${</span>echoPath<span class="token interpolation-punctuation punctuation">}</span></span><span class="token template-punctuation string">`</span></span><span class="token punctuation">,</span> echoBody<span class="token punctuation">,</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token literal-property property">headers</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">            <span class="token string-property property">'Content-Type'</span><span class="token operator">:</span> <span class="token string">'application/json'</span><span class="token punctuation">,</span></span>
<span class="line">            <span class="token string-property property">'X-Api-MerchantNo'</span><span class="token operator">:</span> merchantNo<span class="token punctuation">,</span></span>
<span class="line">            <span class="token string-property property">'X-Api-Timestamp'</span><span class="token operator">:</span> echoTimestamp<span class="token punctuation">,</span></span>
<span class="line">            <span class="token string-property property">'X-Api-Signature'</span><span class="token operator">:</span> echoSignature<span class="token punctuation">,</span></span>
<span class="line">        <span class="token punctuation">}</span></span>
<span class="line">    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span>echoResp<span class="token punctuation">.</span>data<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">    <span class="token comment">// Ping: GET /open-api/demo/ping</span></span>
<span class="line">    <span class="token keyword">const</span> pingPath <span class="token operator">=</span> <span class="token string">'/open-api/demo/ping'</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">const</span> pingMethod <span class="token operator">=</span> <span class="token string">'GET'</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">const</span> pingTimestamp <span class="token operator">=</span> Math<span class="token punctuation">.</span><span class="token function">floor</span><span class="token punctuation">(</span>Date<span class="token punctuation">.</span><span class="token function">now</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">/</span> <span class="token number">1000</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">toString</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">const</span> pingSignature <span class="token operator">=</span> <span class="token function">signRequest</span><span class="token punctuation">(</span>secretKey<span class="token punctuation">,</span> pingMethod<span class="token punctuation">,</span> pingPath<span class="token punctuation">,</span> pingTimestamp<span class="token punctuation">,</span> <span class="token string">''</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">    <span class="token keyword">const</span> pingResp <span class="token operator">=</span> <span class="token keyword">await</span> axios<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token template-string"><span class="token template-punctuation string">`</span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">${</span>baseUrl<span class="token interpolation-punctuation punctuation">}</span></span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">${</span>pingPath<span class="token interpolation-punctuation punctuation">}</span></span><span class="token template-punctuation string">`</span></span><span class="token punctuation">,</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token literal-property property">headers</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">            <span class="token string-property property">'X-Api-MerchantNo'</span><span class="token operator">:</span> merchantNo<span class="token punctuation">,</span></span>
<span class="line">            <span class="token string-property property">'X-Api-Timestamp'</span><span class="token operator">:</span> pingTimestamp<span class="token punctuation">,</span></span>
<span class="line">            <span class="token string-property property">'X-Api-Signature'</span><span class="token operator">:</span> pingSignature<span class="token punctuation">,</span></span>
<span class="line">        <span class="token punctuation">}</span></span>
<span class="line">    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span>pingResp<span class="token punctuation">.</span>data<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="php" tabindex="-1"><a class="header-anchor" href="#php"><span>PHP</span></a></h4>
<div class="language-php line-numbers-mode" data-highlighter="prismjs" data-ext="php"><pre v-pre><code><span class="line"><span class="token php language-php"><span class="token delimiter important">&lt;?php</span></span>
<span class="line"><span class="token keyword">function</span> <span class="token function-definition function">signRequest</span><span class="token punctuation">(</span><span class="token keyword type-hint">string</span> <span class="token variable">$secretKey</span><span class="token punctuation">,</span> <span class="token keyword type-hint">string</span> <span class="token variable">$method</span><span class="token punctuation">,</span> <span class="token keyword type-hint">string</span> <span class="token variable">$path</span><span class="token punctuation">,</span></span>
<span class="line">                     <span class="token keyword type-hint">string</span> <span class="token variable">$timestamp</span><span class="token punctuation">,</span> <span class="token keyword type-hint">string</span> <span class="token variable">$body</span> <span class="token operator">=</span> <span class="token string single-quoted-string">''</span><span class="token punctuation">)</span><span class="token punctuation">:</span> <span class="token keyword return-type">string</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token variable">$stringToSign</span> <span class="token operator">=</span> <span class="token function">implode</span><span class="token punctuation">(</span><span class="token string double-quoted-string">"\n"</span><span class="token punctuation">,</span> <span class="token punctuation">[</span><span class="token variable">$method</span><span class="token punctuation">,</span> <span class="token variable">$path</span><span class="token punctuation">,</span> <span class="token variable">$timestamp</span><span class="token punctuation">,</span> <span class="token variable">$body</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">return</span> <span class="token function">hash_hmac</span><span class="token punctuation">(</span><span class="token string single-quoted-string">'sha256'</span><span class="token punctuation">,</span> <span class="token variable">$stringToSign</span><span class="token punctuation">,</span> <span class="token variable">$secretKey</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token comment">// 使用範例</span></span>
<span class="line"><span class="token variable">$merchantNo</span> <span class="token operator">=</span> <span class="token string single-quoted-string">'123456'</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token variable">$secretKey</span> <span class="token operator">=</span> <span class="token string single-quoted-string">'your_secret_key_here'</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token variable">$baseUrl</span> <span class="token operator">=</span> <span class="token string single-quoted-string">'https://api.example.com'</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token comment">// Echo: POST /open-api/demo/echo</span></span>
<span class="line"><span class="token variable">$echoPath</span> <span class="token operator">=</span> <span class="token string single-quoted-string">'/open-api/demo/echo'</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token variable">$echoMethod</span> <span class="token operator">=</span> <span class="token string single-quoted-string">'POST'</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token variable">$echoBody</span> <span class="token operator">=</span> <span class="token function">json_encode</span><span class="token punctuation">(</span><span class="token punctuation">[</span><span class="token string single-quoted-string">'foo'</span> <span class="token operator">=></span> <span class="token string single-quoted-string">'bar'</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token variable">$echoTimestamp</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token keyword type-casting">string</span><span class="token punctuation">)</span><span class="token function">time</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token variable">$echoSignature</span> <span class="token operator">=</span> <span class="token function">signRequest</span><span class="token punctuation">(</span><span class="token variable">$secretKey</span><span class="token punctuation">,</span> <span class="token variable">$echoMethod</span><span class="token punctuation">,</span> <span class="token variable">$echoPath</span><span class="token punctuation">,</span> <span class="token variable">$echoTimestamp</span><span class="token punctuation">,</span> <span class="token variable">$echoBody</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token variable">$ch</span> <span class="token operator">=</span> <span class="token function">curl_init</span><span class="token punctuation">(</span><span class="token string double-quoted-string">"<span class="token interpolation"><span class="token punctuation">{</span><span class="token variable">$baseUrl</span><span class="token punctuation">}</span></span><span class="token interpolation"><span class="token punctuation">{</span><span class="token variable">$echoPath</span><span class="token punctuation">}</span></span>"</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token function">curl_setopt_array</span><span class="token punctuation">(</span><span class="token variable">$ch</span><span class="token punctuation">,</span> <span class="token punctuation">[</span></span>
<span class="line">    <span class="token constant">CURLOPT_POST</span> <span class="token operator">=></span> <span class="token constant boolean">true</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token constant">CURLOPT_POSTFIELDS</span> <span class="token operator">=></span> <span class="token variable">$echoBody</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token constant">CURLOPT_RETURNTRANSFER</span> <span class="token operator">=></span> <span class="token constant boolean">true</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token constant">CURLOPT_HTTPHEADER</span> <span class="token operator">=></span> <span class="token punctuation">[</span></span>
<span class="line">        <span class="token string single-quoted-string">'Content-Type: application/json'</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token string double-quoted-string">"X-Api-MerchantNo: <span class="token interpolation"><span class="token punctuation">{</span><span class="token variable">$merchantNo</span><span class="token punctuation">}</span></span>"</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token string double-quoted-string">"X-Api-Timestamp: <span class="token interpolation"><span class="token punctuation">{</span><span class="token variable">$echoTimestamp</span><span class="token punctuation">}</span></span>"</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token string double-quoted-string">"X-Api-Signature: <span class="token interpolation"><span class="token punctuation">{</span><span class="token variable">$echoSignature</span><span class="token punctuation">}</span></span>"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token punctuation">]</span><span class="token punctuation">,</span></span>
<span class="line"><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token variable">$echoResp</span> <span class="token operator">=</span> <span class="token function">curl_exec</span><span class="token punctuation">(</span><span class="token variable">$ch</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token function">curl_close</span><span class="token punctuation">(</span><span class="token variable">$ch</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">echo</span> <span class="token variable">$echoResp</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token comment">// Ping: GET /open-api/demo/ping</span></span>
<span class="line"><span class="token variable">$pingPath</span> <span class="token operator">=</span> <span class="token string single-quoted-string">'/open-api/demo/ping'</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token variable">$pingMethod</span> <span class="token operator">=</span> <span class="token string single-quoted-string">'GET'</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token variable">$pingTimestamp</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token keyword type-casting">string</span><span class="token punctuation">)</span><span class="token function">time</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token variable">$pingSignature</span> <span class="token operator">=</span> <span class="token function">signRequest</span><span class="token punctuation">(</span><span class="token variable">$secretKey</span><span class="token punctuation">,</span> <span class="token variable">$pingMethod</span><span class="token punctuation">,</span> <span class="token variable">$pingPath</span><span class="token punctuation">,</span> <span class="token variable">$pingTimestamp</span><span class="token punctuation">,</span> <span class="token string single-quoted-string">''</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token variable">$ch</span> <span class="token operator">=</span> <span class="token function">curl_init</span><span class="token punctuation">(</span><span class="token string double-quoted-string">"<span class="token interpolation"><span class="token punctuation">{</span><span class="token variable">$baseUrl</span><span class="token punctuation">}</span></span><span class="token interpolation"><span class="token punctuation">{</span><span class="token variable">$pingPath</span><span class="token punctuation">}</span></span>"</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token function">curl_setopt_array</span><span class="token punctuation">(</span><span class="token variable">$ch</span><span class="token punctuation">,</span> <span class="token punctuation">[</span></span>
<span class="line">    <span class="token constant">CURLOPT_HTTPGET</span> <span class="token operator">=></span> <span class="token constant boolean">true</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token constant">CURLOPT_RETURNTRANSFER</span> <span class="token operator">=></span> <span class="token constant boolean">true</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token constant">CURLOPT_HTTPHEADER</span> <span class="token operator">=></span> <span class="token punctuation">[</span></span>
<span class="line">        <span class="token string double-quoted-string">"X-Api-MerchantNo: <span class="token interpolation"><span class="token punctuation">{</span><span class="token variable">$merchantNo</span><span class="token punctuation">}</span></span>"</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token string double-quoted-string">"X-Api-Timestamp: <span class="token interpolation"><span class="token punctuation">{</span><span class="token variable">$pingTimestamp</span><span class="token punctuation">}</span></span>"</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token string double-quoted-string">"X-Api-Signature: <span class="token interpolation"><span class="token punctuation">{</span><span class="token variable">$pingSignature</span><span class="token punctuation">}</span></span>"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token punctuation">]</span><span class="token punctuation">,</span></span>
<span class="line"><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token variable">$pingResp</span> <span class="token operator">=</span> <span class="token function">curl_exec</span><span class="token punctuation">(</span><span class="token variable">$ch</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token function">curl_close</span><span class="token punctuation">(</span><span class="token variable">$ch</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">echo</span> <span class="token variable">$pingResp</span><span class="token punctuation">;</span></span>
<span class="line"></span></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="go" tabindex="-1"><a class="header-anchor" href="#go"><span>Go</span></a></h4>
<div class="language-go line-numbers-mode" data-highlighter="prismjs" data-ext="go"><pre v-pre><code><span class="line"><span class="token keyword">package</span> main</span>
<span class="line"></span>
<span class="line"><span class="token keyword">import</span> <span class="token punctuation">(</span></span>
<span class="line">	<span class="token string">"crypto/hmac"</span></span>
<span class="line">	<span class="token string">"crypto/sha256"</span></span>
<span class="line">	<span class="token string">"encoding/hex"</span></span>
<span class="line">	<span class="token string">"fmt"</span></span>
<span class="line">	<span class="token string">"io"</span></span>
<span class="line">	<span class="token string">"net/http"</span></span>
<span class="line">	<span class="token string">"net/url"</span></span>
<span class="line">	<span class="token string">"strconv"</span></span>
<span class="line">	<span class="token string">"strings"</span></span>
<span class="line">	<span class="token string">"time"</span></span>
<span class="line"><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">func</span> <span class="token function">signRequest</span><span class="token punctuation">(</span>secretKey<span class="token punctuation">,</span> method<span class="token punctuation">,</span> requestURI<span class="token punctuation">,</span> timestamp<span class="token punctuation">,</span> body <span class="token builtin">string</span><span class="token punctuation">)</span> <span class="token builtin">string</span> <span class="token punctuation">{</span></span>
<span class="line">	stringToSign <span class="token operator">:=</span> method <span class="token operator">+</span> <span class="token string">"\n"</span> <span class="token operator">+</span> requestURI <span class="token operator">+</span> <span class="token string">"\n"</span> <span class="token operator">+</span> timestamp <span class="token operator">+</span> <span class="token string">"\n"</span> <span class="token operator">+</span> body</span>
<span class="line">	mac <span class="token operator">:=</span> hmac<span class="token punctuation">.</span><span class="token function">New</span><span class="token punctuation">(</span>sha256<span class="token punctuation">.</span>New<span class="token punctuation">,</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token function">byte</span><span class="token punctuation">(</span>secretKey<span class="token punctuation">)</span><span class="token punctuation">)</span></span>
<span class="line">	<span class="token boolean">_</span><span class="token punctuation">,</span> <span class="token boolean">_</span> <span class="token operator">=</span> mac<span class="token punctuation">.</span><span class="token function">Write</span><span class="token punctuation">(</span><span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token function">byte</span><span class="token punctuation">(</span>stringToSign<span class="token punctuation">)</span><span class="token punctuation">)</span></span>
<span class="line">	<span class="token keyword">return</span> hex<span class="token punctuation">.</span><span class="token function">EncodeToString</span><span class="token punctuation">(</span>mac<span class="token punctuation">.</span><span class="token function">Sum</span><span class="token punctuation">(</span><span class="token boolean">nil</span><span class="token punctuation">)</span><span class="token punctuation">)</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">func</span> <span class="token function">doEcho</span><span class="token punctuation">(</span>baseURL<span class="token punctuation">,</span> merchantNo<span class="token punctuation">,</span> secretKey <span class="token builtin">string</span><span class="token punctuation">)</span> <span class="token builtin">error</span> <span class="token punctuation">{</span></span>
<span class="line">	method <span class="token operator">:=</span> <span class="token string">"POST"</span></span>
<span class="line">	localPath <span class="token operator">:=</span> <span class="token string">"/open-api/demo/echo"</span></span>
<span class="line">	body <span class="token operator">:=</span> <span class="token string">`{"foo":"bar"}`</span></span>
<span class="line">	timestamp <span class="token operator">:=</span> strconv<span class="token punctuation">.</span><span class="token function">FormatInt</span><span class="token punctuation">(</span>time<span class="token punctuation">.</span><span class="token function">Now</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">Unix</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token number">10</span><span class="token punctuation">)</span></span>
<span class="line">	fullURL <span class="token operator">:=</span> baseURL <span class="token operator">+</span> localPath</span>
<span class="line">	u<span class="token punctuation">,</span> err <span class="token operator">:=</span> url<span class="token punctuation">.</span><span class="token function">Parse</span><span class="token punctuation">(</span>fullURL<span class="token punctuation">)</span></span>
<span class="line">	<span class="token keyword">if</span> err <span class="token operator">!=</span> <span class="token boolean">nil</span> <span class="token punctuation">{</span></span>
<span class="line">		<span class="token keyword">return</span> err</span>
<span class="line">	<span class="token punctuation">}</span></span>
<span class="line">	requestURI <span class="token operator">:=</span> u<span class="token punctuation">.</span><span class="token function">EscapedPath</span><span class="token punctuation">(</span><span class="token punctuation">)</span></span>
<span class="line">	signature <span class="token operator">:=</span> <span class="token function">signRequest</span><span class="token punctuation">(</span>secretKey<span class="token punctuation">,</span> method<span class="token punctuation">,</span> requestURI<span class="token punctuation">,</span> timestamp<span class="token punctuation">,</span> body<span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line">	req<span class="token punctuation">,</span> err <span class="token operator">:=</span> http<span class="token punctuation">.</span><span class="token function">NewRequest</span><span class="token punctuation">(</span>method<span class="token punctuation">,</span> fullURL<span class="token punctuation">,</span> strings<span class="token punctuation">.</span><span class="token function">NewReader</span><span class="token punctuation">(</span>body<span class="token punctuation">)</span><span class="token punctuation">)</span></span>
<span class="line">	<span class="token keyword">if</span> err <span class="token operator">!=</span> <span class="token boolean">nil</span> <span class="token punctuation">{</span></span>
<span class="line">		<span class="token keyword">return</span> err</span>
<span class="line">	<span class="token punctuation">}</span></span>
<span class="line">	req<span class="token punctuation">.</span>Header<span class="token punctuation">.</span><span class="token function">Set</span><span class="token punctuation">(</span><span class="token string">"Content-Type"</span><span class="token punctuation">,</span> <span class="token string">"application/json"</span><span class="token punctuation">)</span></span>
<span class="line">	req<span class="token punctuation">.</span>Header<span class="token punctuation">.</span><span class="token function">Set</span><span class="token punctuation">(</span><span class="token string">"X-Api-MerchantNo"</span><span class="token punctuation">,</span> merchantNo<span class="token punctuation">)</span></span>
<span class="line">	req<span class="token punctuation">.</span>Header<span class="token punctuation">.</span><span class="token function">Set</span><span class="token punctuation">(</span><span class="token string">"X-Api-Timestamp"</span><span class="token punctuation">,</span> timestamp<span class="token punctuation">)</span></span>
<span class="line">	req<span class="token punctuation">.</span>Header<span class="token punctuation">.</span><span class="token function">Set</span><span class="token punctuation">(</span><span class="token string">"X-Api-Signature"</span><span class="token punctuation">,</span> signature<span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line">	resp<span class="token punctuation">,</span> err <span class="token operator">:=</span> http<span class="token punctuation">.</span>DefaultClient<span class="token punctuation">.</span><span class="token function">Do</span><span class="token punctuation">(</span>req<span class="token punctuation">)</span></span>
<span class="line">	<span class="token keyword">if</span> err <span class="token operator">!=</span> <span class="token boolean">nil</span> <span class="token punctuation">{</span></span>
<span class="line">		<span class="token keyword">return</span> err</span>
<span class="line">	<span class="token punctuation">}</span></span>
<span class="line">	<span class="token keyword">defer</span> resp<span class="token punctuation">.</span>Body<span class="token punctuation">.</span><span class="token function">Close</span><span class="token punctuation">(</span><span class="token punctuation">)</span></span>
<span class="line">	b<span class="token punctuation">,</span> <span class="token boolean">_</span> <span class="token operator">:=</span> io<span class="token punctuation">.</span><span class="token function">ReadAll</span><span class="token punctuation">(</span>resp<span class="token punctuation">.</span>Body<span class="token punctuation">)</span></span>
<span class="line">	fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token function">string</span><span class="token punctuation">(</span>b<span class="token punctuation">)</span><span class="token punctuation">)</span></span>
<span class="line">	<span class="token keyword">return</span> <span class="token boolean">nil</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">func</span> <span class="token function">doPing</span><span class="token punctuation">(</span>baseURL<span class="token punctuation">,</span> merchantNo<span class="token punctuation">,</span> secretKey <span class="token builtin">string</span><span class="token punctuation">)</span> <span class="token builtin">error</span> <span class="token punctuation">{</span></span>
<span class="line">	method <span class="token operator">:=</span> <span class="token string">"GET"</span></span>
<span class="line">	localPath <span class="token operator">:=</span> <span class="token string">"/open-api/demo/ping"</span></span>
<span class="line">	body <span class="token operator">:=</span> <span class="token string">""</span></span>
<span class="line">	timestamp <span class="token operator">:=</span> strconv<span class="token punctuation">.</span><span class="token function">FormatInt</span><span class="token punctuation">(</span>time<span class="token punctuation">.</span><span class="token function">Now</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">Unix</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token number">10</span><span class="token punctuation">)</span></span>
<span class="line">	fullURL <span class="token operator">:=</span> baseURL <span class="token operator">+</span> localPath</span>
<span class="line">	u<span class="token punctuation">,</span> err <span class="token operator">:=</span> url<span class="token punctuation">.</span><span class="token function">Parse</span><span class="token punctuation">(</span>fullURL<span class="token punctuation">)</span></span>
<span class="line">	<span class="token keyword">if</span> err <span class="token operator">!=</span> <span class="token boolean">nil</span> <span class="token punctuation">{</span></span>
<span class="line">		<span class="token keyword">return</span> err</span>
<span class="line">	<span class="token punctuation">}</span></span>
<span class="line">	requestURI <span class="token operator">:=</span> u<span class="token punctuation">.</span><span class="token function">EscapedPath</span><span class="token punctuation">(</span><span class="token punctuation">)</span></span>
<span class="line">	signature <span class="token operator">:=</span> <span class="token function">signRequest</span><span class="token punctuation">(</span>secretKey<span class="token punctuation">,</span> method<span class="token punctuation">,</span> requestURI<span class="token punctuation">,</span> timestamp<span class="token punctuation">,</span> body<span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line">	req<span class="token punctuation">,</span> err <span class="token operator">:=</span> http<span class="token punctuation">.</span><span class="token function">NewRequest</span><span class="token punctuation">(</span>method<span class="token punctuation">,</span> fullURL<span class="token punctuation">,</span> <span class="token boolean">nil</span><span class="token punctuation">)</span></span>
<span class="line">	<span class="token keyword">if</span> err <span class="token operator">!=</span> <span class="token boolean">nil</span> <span class="token punctuation">{</span></span>
<span class="line">		<span class="token keyword">return</span> err</span>
<span class="line">	<span class="token punctuation">}</span></span>
<span class="line">	req<span class="token punctuation">.</span>Header<span class="token punctuation">.</span><span class="token function">Set</span><span class="token punctuation">(</span><span class="token string">"X-Api-MerchantNo"</span><span class="token punctuation">,</span> merchantNo<span class="token punctuation">)</span></span>
<span class="line">	req<span class="token punctuation">.</span>Header<span class="token punctuation">.</span><span class="token function">Set</span><span class="token punctuation">(</span><span class="token string">"X-Api-Timestamp"</span><span class="token punctuation">,</span> timestamp<span class="token punctuation">)</span></span>
<span class="line">	req<span class="token punctuation">.</span>Header<span class="token punctuation">.</span><span class="token function">Set</span><span class="token punctuation">(</span><span class="token string">"X-Api-Signature"</span><span class="token punctuation">,</span> signature<span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line">	resp<span class="token punctuation">,</span> err <span class="token operator">:=</span> http<span class="token punctuation">.</span>DefaultClient<span class="token punctuation">.</span><span class="token function">Do</span><span class="token punctuation">(</span>req<span class="token punctuation">)</span></span>
<span class="line">	<span class="token keyword">if</span> err <span class="token operator">!=</span> <span class="token boolean">nil</span> <span class="token punctuation">{</span></span>
<span class="line">		<span class="token keyword">return</span> err</span>
<span class="line">	<span class="token punctuation">}</span></span>
<span class="line">	<span class="token keyword">defer</span> resp<span class="token punctuation">.</span>Body<span class="token punctuation">.</span><span class="token function">Close</span><span class="token punctuation">(</span><span class="token punctuation">)</span></span>
<span class="line">	b<span class="token punctuation">,</span> <span class="token boolean">_</span> <span class="token operator">:=</span> io<span class="token punctuation">.</span><span class="token function">ReadAll</span><span class="token punctuation">(</span>resp<span class="token punctuation">.</span>Body<span class="token punctuation">)</span></span>
<span class="line">	fmt<span class="token punctuation">.</span><span class="token function">Println</span><span class="token punctuation">(</span><span class="token function">string</span><span class="token punctuation">(</span>b<span class="token punctuation">)</span><span class="token punctuation">)</span></span>
<span class="line">	<span class="token keyword">return</span> <span class="token boolean">nil</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">func</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">	baseURL <span class="token operator">:=</span> <span class="token string">"https://api.example.com"</span></span>
<span class="line">	merchantNo <span class="token operator">:=</span> <span class="token string">"123456"</span></span>
<span class="line">	secretKey <span class="token operator">:=</span> <span class="token string">"your_secret_key_here"</span></span>
<span class="line"></span>
<span class="line">	<span class="token boolean">_</span> <span class="token operator">=</span> <span class="token function">doEcho</span><span class="token punctuation">(</span>baseURL<span class="token punctuation">,</span> merchantNo<span class="token punctuation">,</span> secretKey<span class="token punctuation">)</span></span>
<span class="line">	<span class="token boolean">_</span> <span class="token operator">=</span> <span class="token function">doPing</span><span class="token punctuation">(</span>baseURL<span class="token punctuation">,</span> merchantNo<span class="token punctuation">,</span> secretKey<span class="token punctuation">)</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr>
<h2 id="_3-api-回應格式" tabindex="-1"><a class="header-anchor" href="#_3-api-回應格式"><span>3. API 回應格式</span></a></h2>
<p>所有 API 介面統一回傳以下 JSON 格式：</p>
<div class="language-json line-numbers-mode" data-highlighter="prismjs" data-ext="json"><pre v-pre><code><span class="line"><span class="token punctuation">{</span></span>
<span class="line">    <span class="token property">"code"</span><span class="token operator">:</span> <span class="token number">0</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"data"</span><span class="token operator">:</span> <span class="token punctuation">{</span> <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"msg"</span><span class="token operator">:</span> <span class="token string">""</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><table>
<thead>
<tr>
<th>欄位</th>
<th>類型</th>
<th>說明</th>
</tr>
</thead>
<tbody>
<tr>
<td>code</td>
<td>Integer</td>
<td>狀態碼，<code v-pre>0</code> 表示成功</td>
</tr>
<tr>
<td>data</td>
<td>Object</td>
<td>業務資料</td>
</tr>
<tr>
<td>msg</td>
<td>String</td>
<td>錯誤訊息（成功時為空字串）</td>
</tr>
</tbody>
</table>
<h3 id="_3-1-錯誤碼" tabindex="-1"><a class="header-anchor" href="#_3-1-錯誤碼"><span>3.1 錯誤碼</span></a></h3>
<table>
<thead>
<tr>
<th>錯誤碼</th>
<th>說明</th>
</tr>
</thead>
<tbody>
<tr>
<td>0</td>
<td>成功</td>
</tr>
<tr>
<td>1009001003</td>
<td>商戶號無效或不存在</td>
</tr>
<tr>
<td>1009001004</td>
<td>簽章驗證失敗</td>
</tr>
<tr>
<td>1009001005</td>
<td>請求時間戳記已過期</td>
</tr>
<tr>
<td>1009001006</td>
<td>缺少必要的驗證請求標頭</td>
</tr>
<tr>
<td>1009001002</td>
<td>客戶已被停用</td>
</tr>
</tbody>
</table>
<hr>
<h2 id="_4-webhook-回呼" tabindex="-1"><a class="header-anchor" href="#_4-webhook-回呼"><span>4. Webhook 回呼</span></a></h2>
<p>當虛擬帳號收到入金時，我們會向您設定的 Webhook URL 傳送 HTTP POST 通知。</p>
<h3 id="_4-1-回呼請求標頭" tabindex="-1"><a class="header-anchor" href="#_4-1-回呼請求標頭"><span>4.1 回呼請求標頭</span></a></h3>
<table>
<thead>
<tr>
<th>Header</th>
<th>說明</th>
</tr>
</thead>
<tbody>
<tr>
<td><code v-pre>X-Webhook-Signature</code></td>
<td>簽章資訊，格式：<code v-pre>t={timestamp},v1={signature}</code></td>
</tr>
<tr>
<td><code v-pre>X-Webhook-Event</code></td>
<td>事件類型，如 <code v-pre>deposit.completed</code></td>
</tr>
<tr>
<td><code v-pre>Content-Type</code></td>
<td><code v-pre>application/json</code></td>
</tr>
</tbody>
</table>
<h3 id="_4-2-簽章驗證" tabindex="-1"><a class="header-anchor" href="#_4-2-簽章驗證"><span>4.2 簽章驗證</span></a></h3>
<p><strong>步驟 1：解析簽章標頭</strong></p>
<p>從 <code v-pre>X-Webhook-Signature</code> 中擷取 <code v-pre>t</code>（時間戳記）和 <code v-pre>v1</code>（簽章）：</p>
<div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text"><pre v-pre><code><span class="line">X-Webhook-Signature: t=1708862400,v1=a1b2c3d4e5f6...</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><p><strong>步驟 2：建構待簽章字串</strong></p>
<div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text"><pre v-pre><code><span class="line">StringToSign = TIMESTAMP + "." + REQUEST_BODY</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><p>其中 <code v-pre>TIMESTAMP</code> 是從簽章標頭中擷取的 <code v-pre>t</code> 值，<code v-pre>REQUEST_BODY</code> 是原始的請求主體字串。</p>
<p><strong>步驟 3：計算簽章並比對</strong></p>
<div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text"><pre v-pre><code><span class="line">ExpectedSignature = Hex( HMAC-SHA256( WebhookKey, StringToSign ) )</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><p>比較計算結果與 <code v-pre>v1</code> 值是否一致。</p>
<p><strong>步驟 4：防重送驗證（建議）</strong></p>
<p>檢查 <code v-pre>t</code> 時間戳記與目前時間的差值，建議拒絕超過 5 分鐘的回呼。</p>
<h3 id="_4-3-回呼回應" tabindex="-1"><a class="header-anchor" href="#_4-3-回呼回應"><span>4.3 回呼回應</span></a></h3>
<ul>
<li>回傳 HTTP 狀態碼 <code v-pre>2xx</code> 視為接收成功</li>
<li>回傳其他狀態碼或逾時（30 秒）視為失敗，將觸發重試</li>
</ul>
<h3 id="_4-4-重試策略" tabindex="-1"><a class="header-anchor" href="#_4-4-重試策略"><span>4.4 重試策略</span></a></h3>
<table>
<thead>
<tr>
<th>重試次數</th>
<th>延遲</th>
</tr>
</thead>
<tbody>
<tr>
<td>第 1 次</td>
<td>30 秒</td>
</tr>
<tr>
<td>第 2 次</td>
<td>2 分鐘</td>
</tr>
<tr>
<td>第 3 次</td>
<td>10 分鐘</td>
</tr>
<tr>
<td>第 4 次</td>
<td>1 小時</td>
</tr>
<tr>
<td>第 5 次</td>
<td>6 小時</td>
</tr>
</tbody>
</table>
<p>超過 5 次重試仍失敗，將停止重試並標記為最終失敗。</p>
<h3 id="_4-5-webhook-驗章程式碼範例" tabindex="-1"><a class="header-anchor" href="#_4-5-webhook-驗章程式碼範例"><span>4.5 Webhook 驗章程式碼範例</span></a></h3>
<h4 id="java-1" tabindex="-1"><a class="header-anchor" href="#java-1"><span>Java</span></a></h4>
<div class="language-java line-numbers-mode" data-highlighter="prismjs" data-ext="java"><pre v-pre><code><span class="line"><span class="token keyword">import</span> <span class="token import"><span class="token namespace">javax<span class="token punctuation">.</span>crypto<span class="token punctuation">.</span></span><span class="token class-name">Mac</span></span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">import</span> <span class="token import"><span class="token namespace">javax<span class="token punctuation">.</span>crypto<span class="token punctuation">.</span>spec<span class="token punctuation">.</span></span><span class="token class-name">SecretKeySpec</span></span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>nio<span class="token punctuation">.</span>charset<span class="token punctuation">.</span></span><span class="token class-name">StandardCharsets</span></span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">WebhookVerifier</span> <span class="token punctuation">{</span></span>
<span class="line"></span>
<span class="line">    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">boolean</span> <span class="token function">verify</span><span class="token punctuation">(</span><span class="token class-name">String</span> webhookKey<span class="token punctuation">,</span> <span class="token class-name">String</span> signatureHeader<span class="token punctuation">,</span> <span class="token class-name">String</span> body<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">Exception</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token class-name">String</span> timestamp <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token class-name">String</span> v1 <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token class-name">String</span> part <span class="token operator">:</span> signatureHeader<span class="token punctuation">.</span><span class="token function">split</span><span class="token punctuation">(</span><span class="token string">","</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">            <span class="token keyword">if</span> <span class="token punctuation">(</span>part<span class="token punctuation">.</span><span class="token function">startsWith</span><span class="token punctuation">(</span><span class="token string">"t="</span><span class="token punctuation">)</span><span class="token punctuation">)</span> timestamp <span class="token operator">=</span> part<span class="token punctuation">.</span><span class="token function">substring</span><span class="token punctuation">(</span><span class="token number">2</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">            <span class="token keyword">if</span> <span class="token punctuation">(</span>part<span class="token punctuation">.</span><span class="token function">startsWith</span><span class="token punctuation">(</span><span class="token string">"v1="</span><span class="token punctuation">)</span><span class="token punctuation">)</span> v1 <span class="token operator">=</span> part<span class="token punctuation">.</span><span class="token function">substring</span><span class="token punctuation">(</span><span class="token number">3</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token punctuation">}</span></span>
<span class="line">        <span class="token keyword">if</span> <span class="token punctuation">(</span>timestamp <span class="token operator">==</span> <span class="token keyword">null</span> <span class="token operator">||</span> v1 <span class="token operator">==</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token keyword">return</span> <span class="token boolean">false</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">        <span class="token keyword">long</span> diff <span class="token operator">=</span> <span class="token class-name">Math</span><span class="token punctuation">.</span><span class="token function">abs</span><span class="token punctuation">(</span><span class="token class-name">System</span><span class="token punctuation">.</span><span class="token function">currentTimeMillis</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">/</span> <span class="token number">1000</span> <span class="token operator">-</span> <span class="token class-name">Long</span><span class="token punctuation">.</span><span class="token function">parseLong</span><span class="token punctuation">(</span>timestamp<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token keyword">if</span> <span class="token punctuation">(</span>diff <span class="token operator">></span> <span class="token number">300</span><span class="token punctuation">)</span> <span class="token keyword">return</span> <span class="token boolean">false</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">        <span class="token class-name">String</span> stringToSign <span class="token operator">=</span> timestamp <span class="token operator">+</span> <span class="token string">"."</span> <span class="token operator">+</span> body<span class="token punctuation">;</span></span>
<span class="line">        <span class="token class-name">Mac</span> mac <span class="token operator">=</span> <span class="token class-name">Mac</span><span class="token punctuation">.</span><span class="token function">getInstance</span><span class="token punctuation">(</span><span class="token string">"HmacSHA256"</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        mac<span class="token punctuation">.</span><span class="token function">init</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">SecretKeySpec</span><span class="token punctuation">(</span>webhookKey<span class="token punctuation">.</span><span class="token function">getBytes</span><span class="token punctuation">(</span><span class="token class-name">StandardCharsets</span><span class="token punctuation">.</span><span class="token constant">UTF_8</span><span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token string">"HmacSHA256"</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token keyword">byte</span><span class="token punctuation">[</span><span class="token punctuation">]</span> hash <span class="token operator">=</span> mac<span class="token punctuation">.</span><span class="token function">doFinal</span><span class="token punctuation">(</span>stringToSign<span class="token punctuation">.</span><span class="token function">getBytes</span><span class="token punctuation">(</span><span class="token class-name">StandardCharsets</span><span class="token punctuation">.</span><span class="token constant">UTF_8</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">        <span class="token class-name">StringBuilder</span> hex <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">StringBuilder</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token keyword">byte</span> b <span class="token operator">:</span> hash<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">            hex<span class="token punctuation">.</span><span class="token function">append</span><span class="token punctuation">(</span><span class="token class-name">String</span><span class="token punctuation">.</span><span class="token function">format</span><span class="token punctuation">(</span><span class="token string">"%02x"</span><span class="token punctuation">,</span> b<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line">        <span class="token keyword">return</span> hex<span class="token punctuation">.</span><span class="token function">toString</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">equals</span><span class="token punctuation">(</span>v1<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="python-1" tabindex="-1"><a class="header-anchor" href="#python-1"><span>Python</span></a></h4>
<div class="language-python line-numbers-mode" data-highlighter="prismjs" data-ext="py"><pre v-pre><code><span class="line"><span class="token keyword">import</span> hmac</span>
<span class="line"><span class="token keyword">import</span> hashlib</span>
<span class="line"><span class="token keyword">import</span> time</span>
<span class="line"></span>
<span class="line"><span class="token keyword">def</span> <span class="token function">verify_webhook</span><span class="token punctuation">(</span>webhook_key<span class="token punctuation">:</span> <span class="token builtin">str</span><span class="token punctuation">,</span> signature_header<span class="token punctuation">:</span> <span class="token builtin">str</span><span class="token punctuation">,</span> body<span class="token punctuation">:</span> <span class="token builtin">str</span><span class="token punctuation">)</span> <span class="token operator">-</span><span class="token operator">></span> <span class="token builtin">bool</span><span class="token punctuation">:</span></span>
<span class="line">    parts <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token punctuation">}</span></span>
<span class="line">    <span class="token keyword">for</span> item <span class="token keyword">in</span> signature_header<span class="token punctuation">.</span>split<span class="token punctuation">(</span><span class="token string">','</span><span class="token punctuation">)</span><span class="token punctuation">:</span></span>
<span class="line">        key<span class="token punctuation">,</span> value <span class="token operator">=</span> item<span class="token punctuation">.</span>split<span class="token punctuation">(</span><span class="token string">'='</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">)</span></span>
<span class="line">        parts<span class="token punctuation">[</span>key<span class="token punctuation">]</span> <span class="token operator">=</span> value</span>
<span class="line"></span>
<span class="line">    timestamp <span class="token operator">=</span> parts<span class="token punctuation">.</span>get<span class="token punctuation">(</span><span class="token string">'t'</span><span class="token punctuation">)</span></span>
<span class="line">    v1 <span class="token operator">=</span> parts<span class="token punctuation">.</span>get<span class="token punctuation">(</span><span class="token string">'v1'</span><span class="token punctuation">)</span></span>
<span class="line">    <span class="token keyword">if</span> <span class="token keyword">not</span> timestamp <span class="token keyword">or</span> <span class="token keyword">not</span> v1<span class="token punctuation">:</span></span>
<span class="line">        <span class="token keyword">return</span> <span class="token boolean">False</span></span>
<span class="line"></span>
<span class="line">    <span class="token keyword">if</span> <span class="token builtin">abs</span><span class="token punctuation">(</span>time<span class="token punctuation">.</span>time<span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">-</span> <span class="token builtin">int</span><span class="token punctuation">(</span>timestamp<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token operator">></span> <span class="token number">300</span><span class="token punctuation">:</span></span>
<span class="line">        <span class="token keyword">return</span> <span class="token boolean">False</span></span>
<span class="line"></span>
<span class="line">    string_to_sign <span class="token operator">=</span> <span class="token string-interpolation"><span class="token string">f"</span><span class="token interpolation"><span class="token punctuation">{</span>timestamp<span class="token punctuation">}</span></span><span class="token string">.</span><span class="token interpolation"><span class="token punctuation">{</span>body<span class="token punctuation">}</span></span><span class="token string">"</span></span></span>
<span class="line">    expected <span class="token operator">=</span> hmac<span class="token punctuation">.</span>new<span class="token punctuation">(</span></span>
<span class="line">        webhook_key<span class="token punctuation">.</span>encode<span class="token punctuation">(</span><span class="token string">'utf-8'</span><span class="token punctuation">)</span><span class="token punctuation">,</span></span>
<span class="line">        string_to_sign<span class="token punctuation">.</span>encode<span class="token punctuation">(</span><span class="token string">'utf-8'</span><span class="token punctuation">)</span><span class="token punctuation">,</span></span>
<span class="line">        hashlib<span class="token punctuation">.</span>sha256</span>
<span class="line">    <span class="token punctuation">)</span><span class="token punctuation">.</span>hexdigest<span class="token punctuation">(</span><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line">    <span class="token keyword">return</span> hmac<span class="token punctuation">.</span>compare_digest<span class="token punctuation">(</span>expected<span class="token punctuation">,</span> v1<span class="token punctuation">)</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="node-js-1" tabindex="-1"><a class="header-anchor" href="#node-js-1"><span>Node.js</span></a></h4>
<div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js"><pre v-pre><code><span class="line"><span class="token keyword">const</span> crypto <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">'crypto'</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">function</span> <span class="token function">verifyWebhook</span><span class="token punctuation">(</span><span class="token parameter">webhookKey<span class="token punctuation">,</span> signatureHeader<span class="token punctuation">,</span> body</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token keyword">const</span> parts <span class="token operator">=</span> <span class="token punctuation">{</span><span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line">    signatureHeader<span class="token punctuation">.</span><span class="token function">split</span><span class="token punctuation">(</span><span class="token string">','</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">forEach</span><span class="token punctuation">(</span><span class="token parameter">item</span> <span class="token operator">=></span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token keyword">const</span> <span class="token punctuation">[</span>key<span class="token punctuation">,</span> <span class="token operator">...</span>rest<span class="token punctuation">]</span> <span class="token operator">=</span> item<span class="token punctuation">.</span><span class="token function">split</span><span class="token punctuation">(</span><span class="token string">'='</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        parts<span class="token punctuation">[</span>key<span class="token punctuation">]</span> <span class="token operator">=</span> rest<span class="token punctuation">.</span><span class="token function">join</span><span class="token punctuation">(</span><span class="token string">'='</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">    <span class="token keyword">const</span> timestamp <span class="token operator">=</span> parts<span class="token punctuation">[</span><span class="token string">'t'</span><span class="token punctuation">]</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">const</span> v1 <span class="token operator">=</span> parts<span class="token punctuation">[</span><span class="token string">'v1'</span><span class="token punctuation">]</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>timestamp <span class="token operator">||</span> <span class="token operator">!</span>v1<span class="token punctuation">)</span> <span class="token keyword">return</span> <span class="token boolean">false</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span>Math<span class="token punctuation">.</span><span class="token function">abs</span><span class="token punctuation">(</span>Date<span class="token punctuation">.</span><span class="token function">now</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">/</span> <span class="token number">1000</span> <span class="token operator">-</span> <span class="token function">parseInt</span><span class="token punctuation">(</span>timestamp<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token operator">></span> <span class="token number">300</span><span class="token punctuation">)</span> <span class="token keyword">return</span> <span class="token boolean">false</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">    <span class="token keyword">const</span> stringToSign <span class="token operator">=</span> <span class="token template-string"><span class="token template-punctuation string">`</span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">${</span>timestamp<span class="token interpolation-punctuation punctuation">}</span></span><span class="token string">.</span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">${</span>body<span class="token interpolation-punctuation punctuation">}</span></span><span class="token template-punctuation string">`</span></span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">const</span> expected <span class="token operator">=</span> crypto</span>
<span class="line">        <span class="token punctuation">.</span><span class="token function">createHmac</span><span class="token punctuation">(</span><span class="token string">'sha256'</span><span class="token punctuation">,</span> webhookKey<span class="token punctuation">)</span></span>
<span class="line">        <span class="token punctuation">.</span><span class="token function">update</span><span class="token punctuation">(</span>stringToSign<span class="token punctuation">,</span> <span class="token string">'utf-8'</span><span class="token punctuation">)</span></span>
<span class="line">        <span class="token punctuation">.</span><span class="token function">digest</span><span class="token punctuation">(</span><span class="token string">'hex'</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">    <span class="token keyword">return</span> crypto<span class="token punctuation">.</span><span class="token function">timingSafeEqual</span><span class="token punctuation">(</span>Buffer<span class="token punctuation">.</span><span class="token function">from</span><span class="token punctuation">(</span>expected<span class="token punctuation">)</span><span class="token punctuation">,</span> Buffer<span class="token punctuation">.</span><span class="token function">from</span><span class="token punctuation">(</span>v1<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="php-1" tabindex="-1"><a class="header-anchor" href="#php-1"><span>PHP</span></a></h4>
<div class="language-php line-numbers-mode" data-highlighter="prismjs" data-ext="php"><pre v-pre><code><span class="line"><span class="token php language-php"><span class="token delimiter important">&lt;?php</span></span>
<span class="line"><span class="token keyword">function</span> <span class="token function-definition function">verifyWebhook</span><span class="token punctuation">(</span><span class="token keyword type-hint">string</span> <span class="token variable">$webhookKey</span><span class="token punctuation">,</span> <span class="token keyword type-hint">string</span> <span class="token variable">$signatureHeader</span><span class="token punctuation">,</span> <span class="token keyword type-hint">string</span> <span class="token variable">$body</span><span class="token punctuation">)</span><span class="token punctuation">:</span> <span class="token keyword return-type">bool</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token variable">$parts</span> <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">foreach</span> <span class="token punctuation">(</span><span class="token function">explode</span><span class="token punctuation">(</span><span class="token string single-quoted-string">','</span><span class="token punctuation">,</span> <span class="token variable">$signatureHeader</span><span class="token punctuation">)</span> <span class="token keyword">as</span> <span class="token variable">$item</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token punctuation">[</span><span class="token variable">$key</span><span class="token punctuation">,</span> <span class="token variable">$value</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token function">explode</span><span class="token punctuation">(</span><span class="token string single-quoted-string">'='</span><span class="token punctuation">,</span> <span class="token variable">$item</span><span class="token punctuation">,</span> <span class="token number">2</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">        <span class="token variable">$parts</span><span class="token punctuation">[</span><span class="token variable">$key</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token variable">$value</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line">    <span class="token variable">$timestamp</span> <span class="token operator">=</span> <span class="token variable">$parts</span><span class="token punctuation">[</span><span class="token string single-quoted-string">'t'</span><span class="token punctuation">]</span> <span class="token operator">??</span> <span class="token constant">null</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token variable">$v1</span> <span class="token operator">=</span> <span class="token variable">$parts</span><span class="token punctuation">[</span><span class="token string single-quoted-string">'v1'</span><span class="token punctuation">]</span> <span class="token operator">??</span> <span class="token constant">null</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token variable">$timestamp</span> <span class="token operator">||</span> <span class="token operator">!</span><span class="token variable">$v1</span><span class="token punctuation">)</span> <span class="token keyword">return</span> <span class="token constant boolean">false</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">abs</span><span class="token punctuation">(</span><span class="token function">time</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">-</span> <span class="token punctuation">(</span><span class="token keyword type-casting">int</span><span class="token punctuation">)</span><span class="token variable">$timestamp</span><span class="token punctuation">)</span> <span class="token operator">></span> <span class="token number">300</span><span class="token punctuation">)</span> <span class="token keyword">return</span> <span class="token constant boolean">false</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">    <span class="token variable">$stringToSign</span> <span class="token operator">=</span> <span class="token string double-quoted-string">"<span class="token interpolation"><span class="token punctuation">{</span><span class="token variable">$timestamp</span><span class="token punctuation">}</span></span>.<span class="token interpolation"><span class="token punctuation">{</span><span class="token variable">$body</span><span class="token punctuation">}</span></span>"</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token variable">$expected</span> <span class="token operator">=</span> <span class="token function">hash_hmac</span><span class="token punctuation">(</span><span class="token string single-quoted-string">'sha256'</span><span class="token punctuation">,</span> <span class="token variable">$stringToSign</span><span class="token punctuation">,</span> <span class="token variable">$webhookKey</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">    <span class="token keyword">return</span> <span class="token function">hash_equals</span><span class="token punctuation">(</span><span class="token variable">$expected</span><span class="token punctuation">,</span> <span class="token variable">$v1</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr>
<h2 id="_5-事件類型" tabindex="-1"><a class="header-anchor" href="#_5-事件類型"><span>5. 事件類型</span></a></h2>
<h3 id="_5-1-order-completed-訂單完成" tabindex="-1"><a class="header-anchor" href="#_5-1-order-completed-訂單完成"><span>5.1 order.completed - 訂單完成</span></a></h3>
<p>當訂單收到支付後觸發。</p>
<p><strong>Payload 示例：</strong></p>
<div class="language-json line-numbers-mode" data-highlighter="prismjs" data-ext="json"><pre v-pre><code><span class="line"><span class="token punctuation">{</span></span>
<span class="line">    <span class="token property">"orderNo"</span><span class="token operator">:</span> <span class="token string">"1234567890123456"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"receiptAmount"</span><span class="token operator">:</span> <span class="token string">"50000"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"currency"</span><span class="token operator">:</span> <span class="token string">"TWD"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"gmtPayment"</span><span class="token operator">:</span> <span class="token string">"20260225143052"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"type"</span><span class="token operator">:</span> <span class="token string">"C"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"tradeStatus"</span><span class="token operator">:</span> <span class="token string">"WAIT_BUYER_PAY"</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><table>
<thead>
<tr>
<th>字段</th>
<th>類型</th>
<th>說明</th>
</tr>
</thead>
<tbody>
<tr>
<td>orderNo</td>
<td>String</td>
<td>訂單號</td>
</tr>
<tr>
<td>receiptAmount</td>
<td>String</td>
<td>實收金額</td>
</tr>
<tr>
<td>currency</td>
<td>String</td>
<td>幣別（默認 <code v-pre>TWD</code>，可能值：<code v-pre>TWD</code> / <code v-pre>USD</code>）</td>
</tr>
<tr>
<td>gmtPayment</td>
<td>String</td>
<td>支付時間</td>
</tr>
<tr>
<td>type</td>
<td>String</td>
<td>交易類型（見下方說明）</td>
</tr>
<tr>
<td>tradeStatus</td>
<td>String</td>
<td>交易狀態</td>
</tr>
</tbody>
</table>
<p><strong>交易類型 (type) 代碼說明：</strong></p>
<table>
<thead>
<tr>
<th>代碼</th>
<th>說明</th>
</tr>
</thead>
<tbody>
<tr>
<td>A</td>
<td>臨櫃</td>
</tr>
<tr>
<td>B / P</td>
<td>語音</td>
</tr>
<tr>
<td>C</td>
<td>網銀</td>
</tr>
<tr>
<td>D</td>
<td>行動銀行</td>
</tr>
<tr>
<td>E / R</td>
<td>匯款</td>
</tr>
<tr>
<td>F</td>
<td>FXML</td>
</tr>
<tr>
<td>G</td>
<td>eBill</td>
</tr>
<tr>
<td>J</td>
<td>ADM</td>
</tr>
<tr>
<td>M</td>
<td>MOD</td>
</tr>
<tr>
<td>T</td>
<td>ATM</td>
</tr>
<tr>
<td>X</td>
<td>eATM</td>
</tr>
<tr>
<td>0</td>
<td>其他</td>
</tr>
</tbody>
</table>
<p><strong>交易狀態 (tradeStatus) 代碼說明：</strong></p>
<table>
<thead>
<tr>
<th>代碼</th>
<th>說明</th>
</tr>
</thead>
<tbody>
<tr>
<td>WAIT_BUYER_PAY</td>
<td>待支付</td>
</tr>
<tr>
<td>TRADE_SUCCESS</td>
<td>成功</td>
</tr>
<tr>
<td>TRADE_CLOSED</td>
<td>關閉</td>
</tr>
<tr>
<td>TRADE_FINISHED</td>
<td>完結</td>
</tr>
<tr>
<td>TRADE_TIMEOUT</td>
<td>超時</td>
</tr>
<tr>
<td>TRADE_CLEAR</td>
<td>取消</td>
</tr>
</tbody>
</table>
<h3 id="_5-2-order-clear-訂單取消" tabindex="-1"><a class="header-anchor" href="#_5-2-order-clear-訂單取消"><span>5.2 order.clear - 訂單取消</span></a></h3>
<p>當訂單取消後觸發。</p>
<p><strong>Payload 示例：</strong></p>
<div class="language-json line-numbers-mode" data-highlighter="prismjs" data-ext="json"><pre v-pre><code><span class="line"><span class="token punctuation">{</span></span>
<span class="line">    <span class="token property">"orderNo"</span><span class="token operator">:</span> <span class="token string">"1234567890123456"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"tradeStatus"</span><span class="token operator">:</span> <span class="token string">"WAIT_BUYER_PAY"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"timeoutType"</span><span class="token operator">:</span> <span class="token string">"USER_TIMEOUT"</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><table>
<thead>
<tr>
<th>字段</th>
<th>類型</th>
<th>說明</th>
</tr>
</thead>
<tbody>
<tr>
<td>orderNo</td>
<td>String</td>
<td>訂單號</td>
</tr>
<tr>
<td>tradeStatus</td>
<td>String</td>
<td>交易狀態</td>
</tr>
<tr>
<td>timeoutType</td>
<td>String</td>
<td>超時類型</td>
</tr>
</tbody>
</table>
<p><strong>交易狀態 (tradeStatus) 代碼說明：</strong></p>
<table>
<thead>
<tr>
<th>代碼</th>
<th>說明</th>
</tr>
</thead>
<tbody>
<tr>
<td>WAIT_BUYER_PAY</td>
<td>待支付</td>
</tr>
<tr>
<td>TRADE_SUCCESS</td>
<td>成功</td>
</tr>
<tr>
<td>TRADE_CLOSED</td>
<td>關閉</td>
</tr>
<tr>
<td>TRADE_FINISHED</td>
<td>完結</td>
</tr>
<tr>
<td>TRADE_TIMEOUT</td>
<td>超時</td>
</tr>
<tr>
<td>TRADE_CLEAR</td>
<td>取消</td>
</tr>
</tbody>
</table>
<p><strong>超時類型 (timeoutType) 代碼說明：</strong></p>
<table>
<thead>
<tr>
<th>代碼</th>
<th>說明</th>
</tr>
</thead>
<tbody>
<tr>
<td>SYSTEM_CLOSE</td>
<td>系統關閉</td>
</tr>
<tr>
<td>USER_TIMEOUT</td>
<td>用戶超時</td>
</tr>
</tbody>
</table>
<hr>
<h2 id="_6-支付訂單" tabindex="-1"><a class="header-anchor" href="#_6-支付訂單"><span>6. 支付訂單</span></a></h2>
<h3 id="_6-1-創建支付訂單" tabindex="-1"><a class="header-anchor" href="#_6-1-創建支付訂單"><span>6.1. 創建支付訂單</span></a></h3>
<ul>
<li><strong>接口地址</strong>：<code v-pre>POST /open-api/payment-order/create</code></li>
<li><strong>接口描述</strong>：用於商戶創建新的支付訂單</li>
<li><strong>認證方式</strong>：OpenAPI 認證</li>
</ul>
<h4 id="請求參數" tabindex="-1"><a class="header-anchor" href="#請求參數"><span>請求參數</span></a></h4>
<table>
<thead>
<tr>
<th>參數名</th>
<th>類型</th>
<th>必填</th>
<th>示例值</th>
<th>描述</th>
</tr>
</thead>
<tbody>
<tr>
<td>subject</td>
<td>String</td>
<td>是</td>
<td>購買商品A</td>
<td>標題</td>
</tr>
<tr>
<td>transactionType</td>
<td>Integer</td>
<td>是</td>
<td>1</td>
<td>訂單交易類型(1:功德款,2:虛擬通貨（線下）,3:虛擬通貨P2P,4:算力平臺 B2B 收款,5:遊戲充值收費,6:零售收款)</td>
</tr>
<tr>
<td>currency</td>
<td>String</td>
<td>是</td>
<td>TWD</td>
<td>幣別(TWD, USD)</td>
</tr>
<tr>
<td>totalAmount</td>
<td>BigDecimal</td>
<td>是</td>
<td>100.00</td>
<td>訂單總金額</td>
</tr>
<tr>
<td>gmtCreate</td>
<td>LocalDateTime</td>
<td>是</td>
<td>2023-01-01T10:00:00</td>
<td>交易創建時間</td>
</tr>
<tr>
<td>timeExpire</td>
<td>LocalDateTime</td>
<td>是</td>
<td>2023-01-02T10:00:00</td>
<td>訂單超時時間</td>
</tr>
<tr>
<td>passbackParams</td>
<td>String</td>
<td>否</td>
<td>param=value</td>
<td>公共回傳參數</td>
</tr>
<tr>
<td>merchantParams</td>
<td>String</td>
<td>否</td>
<td>custom=data</td>
<td>商戶傳入參數</td>
</tr>
</tbody>
</table>
<h4 id="請求示例" tabindex="-1"><a class="header-anchor" href="#請求示例"><span>請求示例</span></a></h4>
<div class="language-json line-numbers-mode" data-highlighter="prismjs" data-ext="json"><pre v-pre><code><span class="line"><span class="token punctuation">{</span></span>
<span class="line">  <span class="token property">"subject"</span><span class="token operator">:</span> <span class="token string">"購買商品A"</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token property">"transactionType"</span><span class="token operator">:</span> <span class="token number">1</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token property">"currency"</span><span class="token operator">:</span> <span class="token string">"TWD"</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token property">"totalAmount"</span><span class="token operator">:</span> <span class="token number">100.00</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token property">"gmtCreate"</span><span class="token operator">:</span> <span class="token string">"2023-01-01T10:00:00"</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token property">"timeExpire"</span><span class="token operator">:</span> <span class="token string">"2023-01-02T10:00:00"</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token property">"passbackParams"</span><span class="token operator">:</span> <span class="token string">"param=value"</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token property">"merchantParams"</span><span class="token operator">:</span> <span class="token string">"custom=data"</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="響應參數" tabindex="-1"><a class="header-anchor" href="#響應參數"><span>響應參數</span></a></h4>
<table>
<thead>
<tr>
<th>參數名</th>
<th>類型</th>
<th>示例值</th>
<th>描述</th>
</tr>
</thead>
<tbody>
<tr>
<td>id</td>
<td>Long</td>
<td>21380</td>
<td>主鍵</td>
</tr>
<tr>
<td>orderNo</td>
<td>String</td>
<td>ORDER20230101001</td>
<td>訂單號</td>
</tr>
<tr>
<td>subject</td>
<td>String</td>
<td>購買商品A</td>
<td>標題</td>
</tr>
<tr>
<td>transactionType</td>
<td>Integer</td>
<td>1</td>
<td>訂單交易類型</td>
</tr>
<tr>
<td>currency</td>
<td>String</td>
<td>TWD</td>
<td>幣別</td>
</tr>
<tr>
<td>totalAmount</td>
<td>BigDecimal</td>
<td>100.00</td>
<td>訂單總金額</td>
</tr>
<tr>
<td>receiptAmount</td>
<td>BigDecimal</td>
<td>100.00</td>
<td>實收金額</td>
</tr>
<tr>
<td>tradeStatus</td>
<td>String</td>
<td>WAIT_BUYER_PAY</td>
<td>交易狀態：WAIT_BUYER_PAY（待支付）、TRADE_SUCCESS（成功）、TRADE_CLOSED（關閉）、TRADE_FINISHED（完結）、TRADE_TIMEOUT（超時）</td>
</tr>
<tr>
<td>gmtCreate</td>
<td>LocalDateTime</td>
<td>2023-01-01T10:00:00</td>
<td>交易創建時間</td>
</tr>
<tr>
<td>gmtPayment</td>
<td>LocalDateTime</td>
<td>null</td>
<td>支付時間</td>
</tr>
<tr>
<td>timeExpire</td>
<td>LocalDateTime</td>
<td>2023-01-02T10:00:00</td>
<td>訂單超時時間</td>
</tr>
<tr>
<td>timeoutType</td>
<td>String</td>
<td>null</td>
<td>超時類型：SYSTEM_CLOSE（系統關閉）、USER_TIMEOUT（用戶超時未付）</td>
</tr>
<tr>
<td>passbackParams</td>
<td>String</td>
<td>param=value</td>
<td>公共回傳參數</td>
</tr>
<tr>
<td>merchantParams</td>
<td>String</td>
<td>custom=data</td>
<td>商戶傳入參數</td>
</tr>
<tr>
<td>createTime</td>
<td>LocalDateTime</td>
<td>2023-01-01T10:00:00</td>
<td>創建時間</td>
</tr>
</tbody>
</table>
<h4 id="響應示例" tabindex="-1"><a class="header-anchor" href="#響應示例"><span>響應示例</span></a></h4>
<div class="language-json line-numbers-mode" data-highlighter="prismjs" data-ext="json"><pre v-pre><code><span class="line"><span class="token punctuation">{</span></span>
<span class="line">  <span class="token property">"code"</span><span class="token operator">:</span> <span class="token number">0</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token property">"message"</span><span class="token operator">:</span> <span class="token string">"success"</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token property">"data"</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token property">"id"</span><span class="token operator">:</span> <span class="token number">21380</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"orderNo"</span><span class="token operator">:</span> <span class="token string">"ORDER20230101001"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"subject"</span><span class="token operator">:</span> <span class="token string">"購買商品A"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"transactionType"</span><span class="token operator">:</span> <span class="token number">1</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"currency"</span><span class="token operator">:</span> <span class="token string">"TWD"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"totalAmount"</span><span class="token operator">:</span> <span class="token number">100.00</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"receiptAmount"</span><span class="token operator">:</span> <span class="token number">100.00</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"tradeStatus"</span><span class="token operator">:</span> <span class="token string">"WAIT_BUYER_PAY"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"gmtCreate"</span><span class="token operator">:</span> <span class="token string">"2023-01-01T10:00:00"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"gmtPayment"</span><span class="token operator">:</span> <span class="token null keyword">null</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"timeExpire"</span><span class="token operator">:</span> <span class="token string">"2023-01-02T10:00:00"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"timeoutType"</span><span class="token operator">:</span> <span class="token null keyword">null</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"passbackParams"</span><span class="token operator">:</span> <span class="token string">"passbackParams"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"merchantParams"</span><span class="token operator">:</span> <span class="token string">"merchantParams"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"createTime"</span><span class="token operator">:</span> <span class="token string">"2023-01-01T10:00:00"</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-查詢支付訂單" tabindex="-1"><a class="header-anchor" href="#_2-查詢支付訂單"><span>2. 查詢支付訂單</span></a></h3>
<ul>
<li><strong>接口地址</strong>：<code v-pre>GET /open-api/payment-order/get</code></li>
<li><strong>接口描述</strong>：根據訂單號查詢支付訂單詳情</li>
<li><strong>認證方式</strong>：OpenAPI 認證</li>
</ul>
<h4 id="請求參數-1" tabindex="-1"><a class="header-anchor" href="#請求參數-1"><span>請求參數</span></a></h4>
<table>
<thead>
<tr>
<th>參數名</th>
<th>類型</th>
<th>必填</th>
<th>示例值</th>
<th>描述</th>
</tr>
</thead>
<tbody>
<tr>
<td>orderNo</td>
<td>String</td>
<td>是</td>
<td>ORDER20230101001</td>
<td>訂單號</td>
</tr>
</tbody>
</table>
<h4 id="響應參數-1" tabindex="-1"><a class="header-anchor" href="#響應參數-1"><span>響應參數</span></a></h4>
<p>同&quot;創建支付訂單&quot;接口的響應參數。</p>
<h4 id="響應示例-1" tabindex="-1"><a class="header-anchor" href="#響應示例-1"><span>響應示例</span></a></h4>
<div class="language-json line-numbers-mode" data-highlighter="prismjs" data-ext="json"><pre v-pre><code><span class="line"><span class="token punctuation">{</span></span>
<span class="line">  <span class="token property">"code"</span><span class="token operator">:</span> <span class="token number">0</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token property">"message"</span><span class="token operator">:</span> <span class="token string">"success"</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token property">"data"</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token property">"id"</span><span class="token operator">:</span> <span class="token number">21380</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"orderNo"</span><span class="token operator">:</span> <span class="token string">"ORDER20230101001"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"subject"</span><span class="token operator">:</span> <span class="token string">"購買商品A"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"transactionType"</span><span class="token operator">:</span> <span class="token number">1</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"currency"</span><span class="token operator">:</span> <span class="token string">"TWD"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"totalAmount"</span><span class="token operator">:</span> <span class="token number">100.00</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"receiptAmount"</span><span class="token operator">:</span> <span class="token number">100.00</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"tradeStatus"</span><span class="token operator">:</span> <span class="token string">"TRADE_SUCCESS"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"gmtCreate"</span><span class="token operator">:</span> <span class="token string">"2023-01-01T10:00:00"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"gmtPayment"</span><span class="token operator">:</span> <span class="token string">"2023-01-01T10:30:00"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"timeExpire"</span><span class="token operator">:</span> <span class="token string">"2023-01-02T10:00:00"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"timeoutType"</span><span class="token operator">:</span> <span class="token null keyword">null</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"passbackParams"</span><span class="token operator">:</span> <span class="token string">"param=value"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"merchantParams"</span><span class="token operator">:</span> <span class="token string">"custom=data"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"createTime"</span><span class="token operator">:</span> <span class="token string">"2023-01-01T10:00:00"</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_6-3-取消支付訂單" tabindex="-1"><a class="header-anchor" href="#_6-3-取消支付訂單"><span>6.3. 取消支付訂單</span></a></h3>
<ul>
<li><strong>接口地址</strong>：<code v-pre>POST /open-api/payment-order/clear</code></li>
<li><strong>接口描述</strong>：取消指定訂單號的支付訂單</li>
<li><strong>認證方式</strong>：OpenAPI 認證</li>
</ul>
<h4 id="請求參數-2" tabindex="-1"><a class="header-anchor" href="#請求參數-2"><span>請求參數</span></a></h4>
<table>
<thead>
<tr>
<th>參數名</th>
<th>類型</th>
<th>必填</th>
<th>示例值</th>
<th>描述</th>
</tr>
</thead>
<tbody>
<tr>
<td>orderNo</td>
<td>String</td>
<td>是</td>
<td>ORDER20230101001</td>
<td>訂單號</td>
</tr>
</tbody>
</table>
<h4 id="響應參數-2" tabindex="-1"><a class="header-anchor" href="#響應參數-2"><span>響應參數</span></a></h4>
<table>
<thead>
<tr>
<th>參數名</th>
<th>類型</th>
<th>示例值</th>
<th>描述</th>
</tr>
</thead>
<tbody>
<tr>
<td>code</td>
<td>Integer</td>
<td>0</td>
<td>狀態碼</td>
</tr>
<tr>
<td>message</td>
<td>String</td>
<td>success</td>
<td>消息</td>
</tr>
<tr>
<td>data</td>
<td>Boolean</td>
<td>true</td>
<td>是否成功</td>
</tr>
</tbody>
</table>
<h4 id="響應示例-2" tabindex="-1"><a class="header-anchor" href="#響應示例-2"><span>響應示例</span></a></h4>
<div class="language-json line-numbers-mode" data-highlighter="prismjs" data-ext="json"><pre v-pre><code><span class="line"><span class="token punctuation">{</span></span>
<span class="line">  <span class="token property">"code"</span><span class="token operator">:</span> <span class="token number">0</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token property">"message"</span><span class="token operator">:</span> <span class="token string">"success"</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token property">"data"</span><span class="token operator">:</span> <span class="token boolean">true</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr>
<h2 id="_7-常見問題" tabindex="-1"><a class="header-anchor" href="#_7-常見問題"><span>7. 常見問題</span></a></h2>
<h3 id="q-簽章驗證一直失敗" tabindex="-1"><a class="header-anchor" href="#q-簽章驗證一直失敗"><span>Q: 簽章驗證一直失敗？</span></a></h3>
<p>請檢查以下幾點：</p>
<ol>
<li>確認商戶號（<code v-pre>X-Api-MerchantNo</code>）是否正確，Secret Key 是否與後台一致且僅用於本地簽章</li>
<li>確認待簽章字串的串接順序和換行字元</li>
<li>確認時間戳記是<strong>秒級</strong> Unix 時間戳記，不是毫秒</li>
<li>確認請求主體是原始 JSON 字串，沒有經過額外格式化</li>
<li>確認伺服器時鐘準確</li>
</ol>
<h3 id="q-webhook-收不到回呼" tabindex="-1"><a class="header-anchor" href="#q-webhook-收不到回呼"><span>Q: Webhook 收不到回呼？</span></a></h3>
<p>請檢查：</p>
<ol>
<li>Webhook URL 是否能從公開網路存取</li>
<li>防火牆是否放行了我方伺服器 IP</li>
<li>伺服器端是否正確回傳了 HTTP 2xx 狀態碼</li>
<li>回呼處理是否在 30 秒內完成</li>
</ol>
<h3 id="q-金鑰洩漏了怎麼辦" tabindex="-1"><a class="header-anchor" href="#q-金鑰洩漏了怎麼辦"><span>Q: 金鑰洩漏了怎麼辦？</span></a></h3>
<p>請立即聯繫我們的技術人員，我們會在後台為您重新產生金鑰。舊金鑰將立即失效。</p>
</div></template>


