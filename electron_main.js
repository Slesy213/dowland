// electron_main.js - SIFIRDAN, HİÇBİR BAĞIMLILIK YOK (express yok, fetch yok, sadece electron ve node native modüller)
const { app, BrowserWindow } = require('electron');
const { exec } = require('child_process');
const http = require('http');
const url = require('url');

let mainWindow;
let verified = false;
let expectedPin = "12345678";

// Basit HTTP sunucusu - express yok
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    if (parsedUrl.pathname === '/verify') {
        const pin = parsedUrl.query.pin;
        if (pin === expectedPin) {
            verified = true;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false }));
        }
    }
    else if (parsedUrl.pathname === '/startScan') {
        if (!verified) {
            res.writeHead(403);
            res.end('Yetkisiz');
            return;
        }
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Taraniyor...');
        
        // Tarama başlat
        exec('tasklist', (err, stdout) => {
            let found = [];
            const lower = stdout.toLowerCase();
            if (lower.includes('cheatengine')) found.push('CheatEngine');
            if (lower.includes('nexor')) found.push('Nexor');
            if (lower.includes('injector')) found.push('Injector');
            if (lower.includes('autoit')) found.push('AutoIt');
            if (lower.includes('fivemhook')) found.push('FiveMHook');
            if (lower.includes('redengine')) found.push('RedEngine');
            
            const resultMsg = found.length > 0 ? `HILE TESPITI: ${found.join(', ')}` : 'TEMIZ sistem';
            console.log(resultMsg);
            
            // İsteğe bağlı webhook - hata vermemesi için try-catch içinde
            try {
                const https = require('https');
                const data = JSON.stringify({ content: resultMsg });
                const options = {
                    hostname: 'discord.com',
                    path: '/api/webhooks/SAKLANACAK/SIFIRLA',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
                };
                const webhookReq = https.request(options);
                webhookReq.write(data);
                webhookReq.end();
            } catch(e) { /* webhook yoksa sessiz geç */ }
        });
    }
    else {
        res.writeHead(404);
        res.end('Bulunamadi');
    }
});

server.listen(3000, () => console.log('Sunucu 3000 portunda calisiyor'));

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 500,
        height: 450,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    
    mainWindow.loadURL(`data:text/html,
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                background: #0a0a0a;
                color: #00ff00;
                font-family: 'Courier New', monospace;
                text-align: center;
                padding: 40px;
                margin: 0;
            }
            h2 { color: #ff0000; font-size: 28px; margin-bottom: 20px; }
            .warning { color: #ffff00; font-size: 16px; margin: 10px 0; }
            .info { color: #ffffff; font-size: 14px; margin: 20px 0; }
            input {
                background: #222;
                color: #00ff00;
                border: 2px solid #ff0000;
                padding: 12px;
                width: 200px;
                font-size: 18px;
                text-align: center;
                font-family: monospace;
                margin: 10px 0;
            }
            button {
                background: #ff0000;
                color: white;
                border: none;
                padding: 12px 24px;
                font-size: 16px;
                cursor: pointer;
                font-weight: bold;
                margin: 10px 0;
            }
            button:hover { background: #cc0000; }
            #result {
                margin-top: 20px;
                padding: 10px;
                font-size: 14px;
            }
            .footer {
                position: absolute;
                bottom: 10px;
                left: 0;
                right: 0;
                font-size: 10px;
                color: #555;
            }
        </style>
    </head>
    <body>
        <h2>REXGUN SECURITY SCANNER</h2>
        <div class="warning">!!! LUETFEN BEKLEYIN, KORKMAYIN !!!</div>
        <div class="info">Rexgun Scanner tarafindan kontrol ediliyorsunuz.</div>
        <div class="info">Sisteminiz taranmaktadir. Bu islem 30 saniye surer.</div>
        <br/>
        <div>PIN KODUNUZU GIRIN:</div>
        <input type="text" id="pinInput" maxlength="8" placeholder="********">
        <br/>
        <button id="scanBtn">TARA VE TARA</button>
        <div id="result"></div>
        <div class="footer">Rexgun Security Systems v2.0</div>
        
        <script>
            document.getElementById('scanBtn').onclick = function() {
                var pin = document.getElementById('pinInput').value;
                var resultDiv = document.getElementById('result');
                resultDiv.innerHTML = '<span style="color:#ffff00;">Dogrulaniyor...</span>';
                
                fetch('http://localhost:3000/verify?pin=' + encodeURIComponent(pin))
                    .then(r => r.json())
                    .then(data => {
                        if (data.success) {
                            resultDiv.innerHTML = '<span style="color:#00ff00;">PIN DOGRU! Tarama baslatiliyor...</span>';
                            fetch('http://localhost:3000/startScan');
                            setTimeout(function() {
                                resultDiv.innerHTML = '<span style="color:#ff0000;">TARAMA TAMAMLANDI! Sonuc panelde gorunecek.</span>';
                            }, 3000);
                        } else {
                            resultDiv.innerHTML = '<span style="color:#ff0000;">HATALI PIN! Lutfen tekrar deneyin.</span>';
                        }
                    })
                    .catch(function(e) {
                        resultDiv.innerHTML = '<span style="color:#ff0000;">Baglanti hatasi! Scanner yeniden baslatiliyor...</span>';
                    });
            };
        </script>
    </body>
    </html>
    `);
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
