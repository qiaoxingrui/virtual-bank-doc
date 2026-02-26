<template><div><h1 id="open-api-integration-guide" tabindex="-1"><a class="header-anchor" href="#open-api-integration-guide"><span>Open API Integration Guide</span></a></h1>
<h2 id="_1-overview" tabindex="-1"><a class="header-anchor" href="#_1-overview"><span>1. Overview</span></a></h2>
<p>This document describes how to integrate with our Virtual Account Platform via Open API, including API request signing and Webhook callback verification.</p>
<h3 id="_1-1-basic-information" tabindex="-1"><a class="header-anchor" href="#_1-1-basic-information"><span>1.1 Basic Information</span></a></h3>
<table>
<thead>
<tr>
<th>Item</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>Base URL</td>
<td><code v-pre>https://{host}/admin-api</code></td>
</tr>
<tr>
<td>Protocol</td>
<td>HTTPS</td>
</tr>
<tr>
<td>Data Format</td>
<td>JSON</td>
</tr>
<tr>
<td>Encoding</td>
<td>UTF-8</td>
</tr>
</tbody>
</table>
<h3 id="_1-2-key-descriptions" tabindex="-1"><a class="header-anchor" href="#_1-2-key-descriptions"><span>1.2 Key Descriptions</span></a></h3>
<p>After onboarding, you will receive two sets of keys:</p>
<table>
<thead>
<tr>
<th>Key</th>
<th>Purpose</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Secret Key</strong></td>
<td>Used for API request signing to verify the legitimacy of the request origin</td>
</tr>
<tr>
<td><strong>Webhook Key</strong></td>
<td>Used to verify the authenticity of our callback requests and prevent forgery</td>
</tr>
</tbody>
</table>
<blockquote>
<p>⚠️ Keep your keys secure. Never expose them in client-side code, logs, or version control. If a key is compromised, contact us immediately to regenerate it.</p>
</blockquote>
<hr>
<h2 id="_2-api-request-signing" tabindex="-1"><a class="header-anchor" href="#_2-api-request-signing"><span>2. API Request Signing</span></a></h2>
<p>All Open API requests must include signature information for authentication.</p>
<h3 id="_2-1-request-headers" tabindex="-1"><a class="header-anchor" href="#_2-1-request-headers"><span>2.1 Request Headers</span></a></h3>
<table>
<thead>
<tr>
<th>Header</th>
<th>Required</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><code v-pre>X-Api-Key</code></td>
<td>Yes</td>
<td>Your Secret Key</td>
</tr>
<tr>
<td><code v-pre>X-Api-Timestamp</code></td>
<td>Yes</td>
<td>Current Unix timestamp (seconds)</td>
</tr>
<tr>
<td><code v-pre>X-Api-Signature</code></td>
<td>Yes</td>
<td>HMAC-SHA256 signature (hex-encoded)</td>
</tr>
<tr>
<td><code v-pre>Content-Type</code></td>
<td>Yes</td>
<td><code v-pre>application/json</code></td>
</tr>
</tbody>
</table>
<h3 id="_2-2-signature-algorithm" tabindex="-1"><a class="header-anchor" href="#_2-2-signature-algorithm"><span>2.2 Signature Algorithm</span></a></h3>
<p><strong>Step 1: Construct the string to sign</strong></p>
<div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text"><pre v-pre><code><span class="line">StringToSign = HTTP_METHOD + "\n" + REQUEST_PATH + "\n" + TIMESTAMP + "\n" + REQUEST_BODY</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><table>
<thead>
<tr>
<th>Part</th>
<th>Description</th>
<th>Example</th>
</tr>
</thead>
<tbody>
<tr>
<td>HTTP_METHOD</td>
<td>Uppercase HTTP method</td>
<td><code v-pre>POST</code></td>
</tr>
<tr>
<td>REQUEST_PATH</td>
<td>Request path (without domain and query parameters)</td>
<td><code v-pre>/admin-api/bank/open/virtual-account/create</code></td>
</tr>
<tr>
<td>TIMESTAMP</td>
<td>Same as <code v-pre>X-Api-Timestamp</code></td>
<td><code v-pre>1708862400</code></td>
</tr>
<tr>
<td>REQUEST_BODY</td>
<td>Complete request body JSON string; empty string if no body</td>
<td><code v-pre>{&quot;type&quot;:1,&quot;amount&quot;:1000}</code></td>
</tr>
</tbody>
</table>
<blockquote>
<p>Note: Parts are joined with <code v-pre>\n</code> (newline character).</p>
</blockquote>
<p><strong>Step 2: Compute HMAC-SHA256</strong></p>
<div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text"><pre v-pre><code><span class="line">Signature = Hex( HMAC-SHA256( SecretKey, StringToSign ) )</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><p>Use your Secret Key as the HMAC key to perform HMAC-SHA256 on the string to sign, then convert the result to a lowercase hexadecimal string.</p>
<h3 id="_2-3-timestamp-validation" tabindex="-1"><a class="header-anchor" href="#_2-3-timestamp-validation"><span>2.3 Timestamp Validation</span></a></h3>
<ul>
<li>The server validates the timestamp deviation from the current time, with an allowed range of <strong>±5 minutes</strong></li>
<li>Please ensure your server clock is synchronized with an NTP server</li>
</ul>
<h3 id="_2-4-complete-request-example" tabindex="-1"><a class="header-anchor" href="#_2-4-complete-request-example"><span>2.4 Complete Request Example</span></a></h3>
<div class="language-http line-numbers-mode" data-highlighter="prismjs" data-ext="http"><pre v-pre><code><span class="line"><span class="token request-line"><span class="token method property">POST</span> <span class="token request-target url">/admin-api/bank/open/virtual-account/create</span> <span class="token http-version property">HTTP/1.1</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">Host</span><span class="token punctuation">:</span> <span class="token header-value">api.example.com</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">Content-Type</span><span class="token punctuation">:</span> <span class="token header-value">application/json</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">X-Api-Key</span><span class="token punctuation">:</span> <span class="token header-value">a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">X-Api-Timestamp</span><span class="token punctuation">:</span> <span class="token header-value">1708862400</span></span></span>
<span class="line"><span class="token header"><span class="token header-name keyword">X-Api-Signature</span><span class="token punctuation">:</span> <span class="token header-value">9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08</span></span></span>
<span class="line"><span class="token application-json"></span>
<span class="line"><span class="token punctuation">{</span><span class="token string-property property">"type"</span><span class="token operator">:</span><span class="token number">1</span><span class="token punctuation">,</span><span class="token string-property property">"amount"</span><span class="token operator">:</span><span class="token number">1000</span><span class="token punctuation">,</span><span class="token string-property property">"expireDate"</span><span class="token operator">:</span><span class="token string">"2025-12-31T23:59:59"</span><span class="token punctuation">}</span></span>
<span class="line"></span></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-5-code-samples" tabindex="-1"><a class="header-anchor" href="#_2-5-code-samples"><span>2.5 Code Samples</span></a></h3>
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
<span class="line"><span class="token comment"># Usage example</span></span>
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
<span class="line"><span class="token comment">// Usage example</span></span>
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
<span class="line"><span class="token comment">// Usage example</span></span>
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
<h2 id="_3-api-response-format" tabindex="-1"><a class="header-anchor" href="#_3-api-response-format"><span>3. API Response Format</span></a></h2>
<p>All API endpoints return a unified JSON format:</p>
<div class="language-json line-numbers-mode" data-highlighter="prismjs" data-ext="json"><pre v-pre><code><span class="line"><span class="token punctuation">{</span></span>
<span class="line">    <span class="token property">"code"</span><span class="token operator">:</span> <span class="token number">0</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"data"</span><span class="token operator">:</span> <span class="token punctuation">{</span> <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token property">"msg"</span><span class="token operator">:</span> <span class="token string">""</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><table>
<thead>
<tr>
<th>Field</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>code</td>
<td>Integer</td>
<td>Status code, <code v-pre>0</code> indicates success</td>
</tr>
<tr>
<td>data</td>
<td>Object</td>
<td>Business data</td>
</tr>
<tr>
<td>msg</td>
<td>String</td>
<td>Error message (empty string on success)</td>
</tr>
</tbody>
</table>
<h3 id="_3-1-error-codes" tabindex="-1"><a class="header-anchor" href="#_3-1-error-codes"><span>3.1 Error Codes</span></a></h3>
<table>
<thead>
<tr>
<th>Error Code</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>0</td>
<td>Success</td>
</tr>
<tr>
<td>1009001003</td>
<td>Invalid API Key</td>
</tr>
<tr>
<td>1009001004</td>
<td>Signature verification failed</td>
</tr>
<tr>
<td>1009001005</td>
<td>Request timestamp expired</td>
</tr>
<tr>
<td>1009001006</td>
<td>Missing required authentication headers</td>
</tr>
<tr>
<td>1009001002</td>
<td>Merchant has been disabled</td>
</tr>
</tbody>
</table>
<hr>
<h2 id="_4-webhook-callbacks" tabindex="-1"><a class="header-anchor" href="#_4-webhook-callbacks"><span>4. Webhook Callbacks</span></a></h2>
<p>When a virtual account receives a deposit, we will send an HTTP POST notification to your configured Webhook URL.</p>
<h3 id="_4-1-callback-request-headers" tabindex="-1"><a class="header-anchor" href="#_4-1-callback-request-headers"><span>4.1 Callback Request Headers</span></a></h3>
<table>
<thead>
<tr>
<th>Header</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><code v-pre>X-Webhook-Signature</code></td>
<td>Signature information, format: <code v-pre>t={timestamp},v1={signature}</code></td>
</tr>
<tr>
<td><code v-pre>X-Webhook-Event</code></td>
<td>Event type, e.g. <code v-pre>deposit.completed</code></td>
</tr>
<tr>
<td><code v-pre>Content-Type</code></td>
<td><code v-pre>application/json</code></td>
</tr>
</tbody>
</table>
<h3 id="_4-2-signature-verification" tabindex="-1"><a class="header-anchor" href="#_4-2-signature-verification"><span>4.2 Signature Verification</span></a></h3>
<p><strong>Step 1: Parse the signature header</strong></p>
<p>Extract <code v-pre>t</code> (timestamp) and <code v-pre>v1</code> (signature) from <code v-pre>X-Webhook-Signature</code>:</p>
<div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text"><pre v-pre><code><span class="line">X-Webhook-Signature: t=1708862400,v1=a1b2c3d4e5f6...</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><p><strong>Step 2: Construct the string to sign</strong></p>
<div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text"><pre v-pre><code><span class="line">StringToSign = TIMESTAMP + "." + REQUEST_BODY</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><p>Where <code v-pre>TIMESTAMP</code> is the <code v-pre>t</code> value extracted from the signature header, and <code v-pre>REQUEST_BODY</code> is the raw request body string.</p>
<p><strong>Step 3: Compute and compare the signature</strong></p>
<div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text"><pre v-pre><code><span class="line">ExpectedSignature = Hex( HMAC-SHA256( WebhookKey, StringToSign ) )</span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div></div></div><p>Compare the computed result with the <code v-pre>v1</code> value.</p>
<p><strong>Step 4: Replay attack prevention (recommended)</strong></p>
<p>Check the difference between the <code v-pre>t</code> timestamp and the current time. It is recommended to reject callbacks older than 5 minutes.</p>
<h3 id="_4-3-callback-response" tabindex="-1"><a class="header-anchor" href="#_4-3-callback-response"><span>4.3 Callback Response</span></a></h3>
<ul>
<li>Return HTTP status code <code v-pre>2xx</code> to indicate successful receipt</li>
<li>Any other status code or timeout (30 seconds) is considered a failure and will trigger a retry</li>
</ul>
<h3 id="_4-4-retry-strategy" tabindex="-1"><a class="header-anchor" href="#_4-4-retry-strategy"><span>4.4 Retry Strategy</span></a></h3>
<table>
<thead>
<tr>
<th>Retry Attempt</th>
<th>Delay</th>
</tr>
</thead>
<tbody>
<tr>
<td>1st</td>
<td>30 seconds</td>
</tr>
<tr>
<td>2nd</td>
<td>2 minutes</td>
</tr>
<tr>
<td>3rd</td>
<td>10 minutes</td>
</tr>
<tr>
<td>4th</td>
<td>1 hour</td>
</tr>
<tr>
<td>5th</td>
<td>6 hours</td>
</tr>
</tbody>
</table>
<p>After 5 failed retries, the system will stop retrying and mark it as a final failure.</p>
<h3 id="_4-5-webhook-verification-code-samples" tabindex="-1"><a class="header-anchor" href="#_4-5-webhook-verification-code-samples"><span>4.5 Webhook Verification Code Samples</span></a></h3>
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
<h2 id="_5-event-types" tabindex="-1"><a class="header-anchor" href="#_5-event-types"><span>5. Event Types</span></a></h2>
<h3 id="_5-1-deposit-completed-deposit-completed" tabindex="-1"><a class="header-anchor" href="#_5-1-deposit-completed-deposit-completed"><span>5.1 deposit.completed - Deposit Completed</span></a></h3>
<p>Triggered when a virtual account receives a deposit.</p>
<p><strong>Payload Example:</strong></p>
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
<th>Field</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>accountNo</td>
<td>String</td>
<td>Virtual account number</td>
</tr>
<tr>
<td>amount</td>
<td>String</td>
<td>Deposit amount</td>
</tr>
<tr>
<td>currency</td>
<td>String</td>
<td>Currency (default <code v-pre>TWD</code>, possible values: <code v-pre>TWD</code> / <code v-pre>USD</code>)</td>
</tr>
<tr>
<td>transactionDate</td>
<td>String</td>
<td>Transaction date (yyyyMMdd)</td>
</tr>
<tr>
<td>transactionTime</td>
<td>String</td>
<td>Transaction time (HHmmss)</td>
</tr>
<tr>
<td>type</td>
<td>String</td>
<td>Transaction type (see table below)</td>
</tr>
<tr>
<td>seqNo</td>
<td>String</td>
<td>Transaction sequence number</td>
</tr>
</tbody>
</table>
<p><strong>Transaction Type (type) Codes:</strong></p>
<table>
<thead>
<tr>
<th>Code</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>A</td>
<td>Over-the-counter</td>
</tr>
<tr>
<td>B / P</td>
<td>Voice banking</td>
</tr>
<tr>
<td>C</td>
<td>Internet banking</td>
</tr>
<tr>
<td>D</td>
<td>Mobile banking</td>
</tr>
<tr>
<td>E / R</td>
<td>Wire transfer</td>
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
<td>Other</td>
</tr>
</tbody>
</table>
<hr>
<h2 id="_6-faq" tabindex="-1"><a class="header-anchor" href="#_6-faq"><span>6. FAQ</span></a></h2>
<h3 id="q-signature-verification-keeps-failing" tabindex="-1"><a class="header-anchor" href="#q-signature-verification-keeps-failing"><span>Q: Signature verification keeps failing?</span></a></h3>
<p>Please check the following:</p>
<ol>
<li>Verify that your Secret Key is correct</li>
<li>Verify the concatenation order and newline characters in the string to sign</li>
<li>Verify the timestamp is a <strong>second-level</strong> Unix timestamp, not milliseconds</li>
<li>Verify the request body is the raw JSON string without additional formatting</li>
<li>Verify your server clock is accurate</li>
</ol>
<h3 id="q-not-receiving-webhook-callbacks" tabindex="-1"><a class="header-anchor" href="#q-not-receiving-webhook-callbacks"><span>Q: Not receiving Webhook callbacks?</span></a></h3>
<p>Please check:</p>
<ol>
<li>Whether the Webhook URL is accessible from the public internet</li>
<li>Whether the firewall allows traffic from our server IPs</li>
<li>Whether the server correctly returns an HTTP 2xx status code</li>
<li>Whether the callback processing completes within 30 seconds</li>
</ol>
<h3 id="q-what-if-a-key-is-compromised" tabindex="-1"><a class="header-anchor" href="#q-what-if-a-key-is-compromised"><span>Q: What if a key is compromised?</span></a></h3>
<p>Contact our technical team immediately. We will regenerate your keys in the admin panel. The old keys will be invalidated immediately.</p>
</div></template>


