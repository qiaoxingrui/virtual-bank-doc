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
<td><code v-pre>https://{host}/admin-api</code></td>
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
<h3 id="_1-2-金鑰說明" tabindex="-1"><a class="header-anchor" href="#_1-2-金鑰說明"><span>1.2 金鑰說明</span></a></h3>
<p>開通合作後，您將取得兩組金鑰：</p>
<table>
<thead>
<tr>
<th>金鑰</th>
<th>用途</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Secret Key</strong></td>
<td>用於 API 請求簽章，證明請求來源的合法性</td>
</tr>
<tr>
<td><strong>Webhook Key</strong></td>
<td>用於驗證我方回呼請求的真實性，防止偽造</td>
</tr>
</tbody>
</table>
<blockquote>
<p>⚠️ 請妥善保管金鑰，切勿在用戶端程式碼、日誌或版本控制中暴露。若金鑰洩漏，請立即聯繫我們重新產生。</p>
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
<td><code v-pre>X-Api-Key</code></td>
<td>是</td>
<td>您的 Secret Key</td>
</tr>
<tr>
<td><code v-pre>X-Api-Timestamp</code></td>
<td>是</td>
<td>目前 Unix 時間戳記（秒）</td>
</tr>
<tr>
<td><code v-pre>X-Api-Signature</code></td>
<td>是</td>
<td>HMAC-SHA256 簽章（Hex 編碼）</td>
</tr>
<tr>
<td><code v-pre>Content-Type</code></td>
<td>是</td>
<td><code v-pre>application/json</code></td>
</tr>
</tbody>
</table>
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
<td><code v-pre>/admin-api/bank/open/virtual-account/create</code></td>
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
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><p>使用您的 Secret Key 作為 HMAC 金鑰，對待簽章字串進行 HMAC-SHA256 運算，然後將結果轉為十六進位小寫字串。</p>
<h3 id="_2-3-時間戳記驗證" tabindex="-1"><a class="header-anchor" href="#_2-3-時間戳記驗證"><span>2.3 時間戳記驗證</span></a></h3>
<ul>
<li>伺服器端會驗證時間戳記與目前時間的偏差，容許範圍為 <strong>±5 分鐘</strong></li>
<li>請確保您的伺服器時鐘與 NTP 伺服器同步</li>
</ul>
<h3 id="_2-4-完整請求範例" tabindex="-1"><a class="header-anchor" href="#_2-4-完整請求範例"><span>2.4 完整請求範例</span></a></h3>
<div class="language-http line-numbers-mode" data-highlighter="prismjs" data-ext="http"><pre v-pre><code><span class="line"><span class="token request-line"><span class="token method property">POST</span> <span class="token request-target url">/admin-api/bank/open/virtual-account/create</span> <span class="token http-version property">HTTP/1.1</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">Host</span><span class="token punctuation">:</span> <span class="token header-value">api.example.com</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">Content-Type</span><span class="token punctuation">:</span> <span class="token header-value">application/json</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">X-Api-Key</span><span class="token punctuation">:</span> <span class="token header-value">a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">X-Api-Timestamp</span><span class="token punctuation">:</span> <span class="token header-value">1708862400</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">X-Api-Signature</span><span class="token punctuation">:</span> <span class="token header-value">9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08</span></span></span>
<span class="line"><span class="token application-json"></span>
<span class="line"><span class="token punctuation">{</span><span class="token property">"type"</span><span class="token operator">:</span><span class="token number">1</span><span class="token punctuation">,</span><span class="token property">"amount"</span><span class="token operator">:</span><span class="token number">1000</span><span class="token punctuation">,</span><span class="token property">"expireDate"</span><span class="token operator">:</span><span class="token string">"2025-12-31T23:59:59"</span><span class="token punctuation">}</span></span>
<span class="line"></span></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-5-程式碼範例" tabindex="-1"><a class="header-anchor" href="#_2-5-程式碼範例"><span>2.5 程式碼範例</span></a></h3>
<h4 id="java" tabindex="-1"><a class="header-anchor" href="#java"><span>Java</span></a></h4>
<div class="language-java line-numbers-mode" data-highlighter="prismjs" data-ext="java"><pre v-pre><code><span class="line"><span class="token keyword">import</span> <span class="token import"><span class="token namespace">javax<span class="token punctuation">.</span>crypto<span class="token punctuation">.</span></span><span class="token class-name">Mac</span></span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">import</span> <span class="token import"><span class="token namespace">javax<span class="token punctuation">.</span>crypto<span class="token punctuation">.</span>spec<span class="token punctuation">.</span></span><span class="token class-name">SecretKeySpec</span></span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>nio<span class="token punctuation">.</span>charset<span class="token punctuation">.</span></span><span class="token class-name">StandardCharsets</span></span><span class="token punctuation">;</span></span>
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
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="python" tabindex="-1"><a class="header-anchor" href="#python"><span>Python</span></a></h4>
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
<span class="line"><span class="token comment"># 使用範例</span></span>
<span class="line">secret_key <span class="token operator">=</span> <span class="token string">"your_secret_key_here"</span></span>
<span class="line">method <span class="token operator">=</span> <span class="token string">"POST"</span></span>
<span class="line">path <span class="token operator">=</span> <span class="token string">"/admin-api/bank/open/virtual-account/create"</span></span>
<span class="line">timestamp <span class="token operator">=</span> <span class="token builtin">str</span><span class="token punctuation">(</span><span class="token builtin">int</span><span class="token punctuation">(</span>time<span class="token punctuation">.</span>time<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span></span>
<span class="line">body <span class="token operator">=</span> json<span class="token punctuation">.</span>dumps<span class="token punctuation">(</span><span class="token punctuation">{</span><span class="token string">"type"</span><span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span> <span class="token string">"amount"</span><span class="token punctuation">:</span> <span class="token number">1000</span><span class="token punctuation">}</span><span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line">signature <span class="token operator">=</span> sign_request<span class="token punctuation">(</span>secret_key<span class="token punctuation">,</span> method<span class="token punctuation">,</span> path<span class="token punctuation">,</span> timestamp<span class="token punctuation">,</span> body<span class="token punctuation">)</span></span>
<span class="line"></span>
<span class="line">response <span class="token operator">=</span> requests<span class="token punctuation">.</span>post<span class="token punctuation">(</span></span>
<span class="line">    <span class="token string-interpolation"><span class="token string">f"https://api.example.com</span><span class="token interpolation"><span class="token punctuation">{</span>path<span class="token punctuation">}</span></span><span class="token string">"</span></span><span class="token punctuation">,</span></span>
<span class="line">    headers<span class="token operator">=</span><span class="token punctuation">{</span></span>
<span class="line">        <span class="token string">"Content-Type"</span><span class="token punctuation">:</span> <span class="token string">"application/json"</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token string">"X-Api-Key"</span><span class="token punctuation">:</span> secret_key<span class="token punctuation">,</span></span>
<span class="line">        <span class="token string">"X-Api-Timestamp"</span><span class="token punctuation">:</span> timestamp<span class="token punctuation">,</span></span>
<span class="line">        <span class="token string">"X-Api-Signature"</span><span class="token punctuation">:</span> signature<span class="token punctuation">,</span></span>
<span class="line">    <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">    data<span class="token operator">=</span>body</span>
<span class="line"><span class="token punctuation">)</span></span>
<span class="line"><span class="token keyword">print</span><span class="token punctuation">(</span>response<span class="token punctuation">.</span>json<span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="node-js" tabindex="-1"><a class="header-anchor" href="#node-js"><span>Node.js</span></a></h4>
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
<span class="line"><span class="token comment">// 使用範例</span></span>
<span class="line"><span class="token keyword">const</span> secretKey <span class="token operator">=</span> <span class="token string">'your_secret_key_here'</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> method <span class="token operator">=</span> <span class="token string">'POST'</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> path <span class="token operator">=</span> <span class="token string">'/admin-api/bank/open/virtual-account/create'</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> timestamp <span class="token operator">=</span> Math<span class="token punctuation">.</span><span class="token function">floor</span><span class="token punctuation">(</span>Date<span class="token punctuation">.</span><span class="token function">now</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">/</span> <span class="token number">1000</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">toString</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">const</span> body <span class="token operator">=</span> <span class="token constant">JSON</span><span class="token punctuation">.</span><span class="token function">stringify</span><span class="token punctuation">(</span><span class="token punctuation">{</span> <span class="token literal-property property">type</span><span class="token operator">:</span> <span class="token number">1</span><span class="token punctuation">,</span> <span class="token literal-property property">amount</span><span class="token operator">:</span> <span class="token number">1000</span> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">const</span> signature <span class="token operator">=</span> <span class="token function">signRequest</span><span class="token punctuation">(</span>secretKey<span class="token punctuation">,</span> method<span class="token punctuation">,</span> path<span class="token punctuation">,</span> timestamp<span class="token punctuation">,</span> body<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">axios<span class="token punctuation">.</span><span class="token function">post</span><span class="token punctuation">(</span><span class="token template-string"><span class="token template-punctuation string">`</span><span class="token string">https://api.example.com</span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">${</span>path<span class="token interpolation-punctuation punctuation">}</span></span><span class="token template-punctuation string">`</span></span><span class="token punctuation">,</span> body<span class="token punctuation">,</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token literal-property property">headers</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">        <span class="token string-property property">'Content-Type'</span><span class="token operator">:</span> <span class="token string">'application/json'</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token string-property property">'X-Api-Key'</span><span class="token operator">:</span> secretKey<span class="token punctuation">,</span></span>
<span class="line">        <span class="token string-property property">'X-Api-Timestamp'</span><span class="token operator">:</span> timestamp<span class="token punctuation">,</span></span>
<span class="line">        <span class="token string-property property">'X-Api-Signature'</span><span class="token operator">:</span> signature<span class="token punctuation">,</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">then</span><span class="token punctuation">(</span><span class="token parameter">res</span> <span class="token operator">=></span> console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span>res<span class="token punctuation">.</span>data<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="php" tabindex="-1"><a class="header-anchor" href="#php"><span>PHP</span></a></h4>
<div class="language-php line-numbers-mode" data-highlighter="prismjs" data-ext="php"><pre v-pre><code><span class="line"><span class="token php language-php"><span class="token delimiter important">&lt;?php</span></span>
<span class="line"><span class="token keyword">function</span> <span class="token function-definition function">signRequest</span><span class="token punctuation">(</span><span class="token keyword type-hint">string</span> <span class="token variable">$secretKey</span><span class="token punctuation">,</span> <span class="token keyword type-hint">string</span> <span class="token variable">$method</span><span class="token punctuation">,</span> <span class="token keyword type-hint">string</span> <span class="token variable">$path</span><span class="token punctuation">,</span></span>
<span class="line">                     <span class="token keyword type-hint">string</span> <span class="token variable">$timestamp</span><span class="token punctuation">,</span> <span class="token keyword type-hint">string</span> <span class="token variable">$body</span> <span class="token operator">=</span> <span class="token string single-quoted-string">''</span><span class="token punctuation">)</span><span class="token punctuation">:</span> <span class="token keyword return-type">string</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token variable">$stringToSign</span> <span class="token operator">=</span> <span class="token function">implode</span><span class="token punctuation">(</span><span class="token string double-quoted-string">"\n"</span><span class="token punctuation">,</span> <span class="token punctuation">[</span><span class="token variable">$method</span><span class="token punctuation">,</span> <span class="token variable">$path</span><span class="token punctuation">,</span> <span class="token variable">$timestamp</span><span class="token punctuation">,</span> <span class="token variable">$body</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token keyword">return</span> <span class="token function">hash_hmac</span><span class="token punctuation">(</span><span class="token string single-quoted-string">'sha256'</span><span class="token punctuation">,</span> <span class="token variable">$stringToSign</span><span class="token punctuation">,</span> <span class="token variable">$secretKey</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token comment">// 使用範例</span></span>
<span class="line"><span class="token variable">$secretKey</span> <span class="token operator">=</span> <span class="token string single-quoted-string">'your_secret_key_here'</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token variable">$method</span> <span class="token operator">=</span> <span class="token string single-quoted-string">'POST'</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token variable">$path</span> <span class="token operator">=</span> <span class="token string single-quoted-string">'/admin-api/bank/open/virtual-account/create'</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token variable">$timestamp</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token keyword type-casting">string</span><span class="token punctuation">)</span><span class="token function">time</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token variable">$body</span> <span class="token operator">=</span> <span class="token function">json_encode</span><span class="token punctuation">(</span><span class="token punctuation">[</span><span class="token string single-quoted-string">'type'</span> <span class="token operator">=></span> <span class="token number">1</span><span class="token punctuation">,</span> <span class="token string single-quoted-string">'amount'</span> <span class="token operator">=></span> <span class="token number">1000</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token variable">$signature</span> <span class="token operator">=</span> <span class="token function">signRequest</span><span class="token punctuation">(</span><span class="token variable">$secretKey</span><span class="token punctuation">,</span> <span class="token variable">$method</span><span class="token punctuation">,</span> <span class="token variable">$path</span><span class="token punctuation">,</span> <span class="token variable">$timestamp</span><span class="token punctuation">,</span> <span class="token variable">$body</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token variable">$ch</span> <span class="token operator">=</span> <span class="token function">curl_init</span><span class="token punctuation">(</span><span class="token string double-quoted-string">"https://api.example.com<span class="token interpolation"><span class="token punctuation">{</span><span class="token variable">$path</span><span class="token punctuation">}</span></span>"</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token function">curl_setopt_array</span><span class="token punctuation">(</span><span class="token variable">$ch</span><span class="token punctuation">,</span> <span class="token punctuation">[</span></span>
<span class="line">    <span class="token constant">CURLOPT_POST</span> <span class="token operator">=></span> <span class="token constant boolean">true</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token constant">CURLOPT_POSTFIELDS</span> <span class="token operator">=></span> <span class="token variable">$body</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token constant">CURLOPT_RETURNTRANSFER</span> <span class="token operator">=></span> <span class="token constant boolean">true</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token constant">CURLOPT_HTTPHEADER</span> <span class="token operator">=></span> <span class="token punctuation">[</span></span>
<span class="line">        <span class="token string single-quoted-string">'Content-Type: application/json'</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token string double-quoted-string">"X-Api-Key: <span class="token interpolation"><span class="token punctuation">{</span><span class="token variable">$secretKey</span><span class="token punctuation">}</span></span>"</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token string double-quoted-string">"X-Api-Timestamp: <span class="token interpolation"><span class="token punctuation">{</span><span class="token variable">$timestamp</span><span class="token punctuation">}</span></span>"</span><span class="token punctuation">,</span></span>
<span class="line">        <span class="token string double-quoted-string">"X-Api-Signature: <span class="token interpolation"><span class="token punctuation">{</span><span class="token variable">$signature</span><span class="token punctuation">}</span></span>"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token punctuation">]</span><span class="token punctuation">,</span></span>
<span class="line"><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token variable">$response</span> <span class="token operator">=</span> <span class="token function">curl_exec</span><span class="token punctuation">(</span><span class="token variable">$ch</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token function">curl_close</span><span class="token punctuation">(</span><span class="token variable">$ch</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">echo</span> <span class="token variable">$response</span><span class="token punctuation">;</span></span>
<span class="line"></span></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><hr>
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
<td>無效的 API Key</td>
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
<h3 id="_5-1-deposit-completed-入金完成" tabindex="-1"><a class="header-anchor" href="#_5-1-deposit-completed-入金完成"><span>5.1 deposit.completed - 入金完成</span></a></h3>
<p>當虛擬帳號收到入金後觸發。</p>
<p><strong>Payload 範例：</strong></p>
<div class="language-json line-numbers-mode" data-highlighter="prismjs" data-ext="json"><pre v-pre><code><span class="line"><span class="token punctuation">{</span></span>
<span class="line">    <span class="token property">"accountNo"</span><span class="token operator">:</span> <span class="token string">"1234567890123456"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"amount"</span><span class="token operator">:</span> <span class="token string">"50000"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"currency"</span><span class="token operator">:</span> <span class="token string">"TWD"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"transactionDate"</span><span class="token operator">:</span> <span class="token string">"20250225"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"transactionTime"</span><span class="token operator">:</span> <span class="token string">"143052"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"type"</span><span class="token operator">:</span> <span class="token string">"C"</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"seqNo"</span><span class="token operator">:</span> <span class="token string">"20250225001"</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><table>
<thead>
<tr>
<th>欄位</th>
<th>類型</th>
<th>說明</th>
</tr>
</thead>
<tbody>
<tr>
<td>accountNo</td>
<td>String</td>
<td>虛擬帳號</td>
</tr>
<tr>
<td>amount</td>
<td>String</td>
<td>入金金額</td>
</tr>
<tr>
<td>currency</td>
<td>String</td>
<td>幣別（預設 <code v-pre>TWD</code>，可能值：<code v-pre>TWD</code> / <code v-pre>USD</code>）</td>
</tr>
<tr>
<td>transactionDate</td>
<td>String</td>
<td>交易日期 (yyyyMMdd)</td>
</tr>
<tr>
<td>transactionTime</td>
<td>String</td>
<td>交易時間 (HHmmss)</td>
</tr>
<tr>
<td>type</td>
<td>String</td>
<td>交易類別（見下方說明）</td>
</tr>
<tr>
<td>seqNo</td>
<td>String</td>
<td>交易序號</td>
</tr>
</tbody>
</table>
<p><strong>交易類別 (type) 代碼說明：</strong></p>
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
<td>其它</td>
</tr>
</tbody>
</table>
<hr>
<h2 id="_6-常見問題" tabindex="-1"><a class="header-anchor" href="#_6-常見問題"><span>6. 常見問題</span></a></h2>
<h3 id="q-簽章驗證一直失敗" tabindex="-1"><a class="header-anchor" href="#q-簽章驗證一直失敗"><span>Q: 簽章驗證一直失敗？</span></a></h3>
<p>請檢查以下幾點：</p>
<ol>
<li>確認 Secret Key 是否正確</li>
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


