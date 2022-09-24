# connect-to-http-proxy
プロキシサーバー経由で外部と通信するために
プロキシサーバーに `CONNECT` し、
標準入力をサーバーへリクエスト、
レスポンスを標準出力に流す
プログラム

## 作成した理由
- Git Bash付属の `connect.exe` が遅かったため
    - サイズの大きいファイルをプロキシ経由 `scp` で送ると非常に時間が掛かる

## 使用法
### 前提
- [Node.js](https://nodejs.org/ja/download/) がインストール済み

### 一時使用
このフォルダでのみ使用可能

```
node index.js <プロキシサーバーHostname>:<プロキシサーバーPort> <接続先Hostname> <接続先Port>
```

### グローバルインストール
メリット: 実行場所を問わない

#### 事前準備
PATHを通す

```
npm install --global
```

#### コマンド実行
```
connect-to-http-proxy -H <プロキシサーバーHostname>:<プロキシサーバーPort> <接続先Hostname> <接続先Port>
```

#### 接続先プロキシサーバーの複数指定
`<プロキシサーバーHostname>:<プロキシサーバーPort>` は `,` (カンマ) 区切りで複数指定することが可能

```
connect-to-http-proxy -H proxy.intra.example.co.jp:8080,proxy.intra.example.co.jp:8081 example.com 80
```

`proxy.pac` のように、先頭から接続を試みて、 一定時間 (環境変数 `SSH_CONNECT_TIMEOUT_MS` で設定, 単位: ミリ秒, default: `500`) 以内に `CONNECT` に成功しない場合は次のプロキシサーバーへの接続を試みる

## 使用例
プロキシサーバー `proxy.intra.example.co.jp:8080` を経由して `example.com:80` にHTTPリクエストを送る例

### コマンド
$ `node index.js -H proxy.intra.example.co.jp:8080 example.com 80`

または

$ `connect-to-http-proxy -H proxy.intra.example.co.jp:8080 example.com 80`

### 標準入力
```http
GET / HTTP/1.0
Host: example.com

```

### 標準出力
```http
HTTP/1.0 200 OK
Cache-Control: max-age=604800
Content-Type: text/html; charset=UTF-8
...(略)
```

## ssh での使用例

`~/.ssh/config`

```sh
Host github.com gist.github.com
	HostName			ssh.github.com
	Port				443
	IdentityFile		~/.ssh/keys/github
	# グローバルインストール している場合
	ProxyCommand		connect-to-http-proxy -H proxy.intra.example.co.jp:8080 %h %p
	# node <filepath> 形式での実行も可能
	# ProxyCommand		node ~/code/connect-to-http-proxy/index.js -H proxy.intra.example.co.jp:8080 %h %p
```

## SOCKS4 の使用
`-S` を `proxyHost:Port` の前に入れる

```
connect-to-http-proxy -S proxy.intra.example.co.jp:1080 example.com 80
```
