# connect-to-http-proxy
プロキシサーバー経由で外部と通信するために
プロキシサーバーに `CONNECT` し、
標準入力をサーバーへリクエスト、
レスポンスを標準出力に流す
プログラム

## 使用法
```
node index.js <プロキシサーバーHost>:<プロキシサーバーPort> <接続先Host> <接続先Port>
```

## 使用例
プロキシサーバー `localhost:8080` を経由して `example.com:80` にHTTPリクエストを送る例

### コマンド
$ `node index.js localhost:8080 example.com 80`

### 標準入力
```
GET / HTTP/1.0
Host: example.com

```

### 標準出力
```
HTTP/1.0 200 OK
Cache-Control: max-age=604800
Content-Type: text/html; charset=UTF-8
...(略)
```
