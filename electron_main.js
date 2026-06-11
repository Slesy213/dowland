const { app, BrowserWindow } = require('electron');
const { exec } = require('child_process');
const express = require('express');
const port = 3000;
let mainWindow;
const expressApp = express();
let verified = false;
let expectedPin = "12345678";

expressApp.get('/verify', (req, res) => {
    if (req.query.pin === expectedPin) {
        verified = true;
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

expressApp.get('/startScan', (req, res) => {
    if (!verified) return res.status(403).send("Yetkisiz");
    res.send("Taraniyor...");
    exec('tasklist', (err, stdout) => {
        let found = [];
        if (stdout.toLowerCase().includes('cheatengine')) found.push('CheatEngine');
        if (stdout.toLowerCase().includes('nexor')) found.push('Nexor');
        if (stdout.toLowerCase().includes('injector')) found.push('Injector');
        if (stdout.toLowerCase().includes('autoit')) found.push('AutoIt');
        if (found.length > 0) {
            // Webhook gönder - kendi webhook ID'ni gir
            const https = require('https');
            const data = JSON.stringify({ content: `HILE TESPITI: ${found.join(', ')}` });
            const options = {
                hostname: 'discord.com',
                path: '/api/webhooks/SENIN_WEBHOOK_ID',
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
            };
            const req = https.request(options);
            req.write(data);
            req.end();
        }
    });
});
expressApp.listen(port);

function createWindow() {
    mainWindow = new BrowserWindow({ 
        width: 450, 
        height: 400, 
        webPreferences: { 
            nodeIntegration: true, 
            contextIsolation: false 
        } 
    });
    mainWindow.loadURL(`data:text/html,
    <html>
    <head><style>body{background:#000;color:#0f0;font-family:monospace;text-align:center;padding:50px;}</style></head>
    <body>
        <h2 style="color:red;">REXGUN SCANNER</h2>
        <p>Lutfen bekleyin, korkmayin. Rexgun Scanner tarafindan kontrol ediliyorsunuz.</p>
        <p>PIN kodunuzu girin:</p>
        <input id="pin" style="background:#222;color:#0f0;border:1px solid red;padding:10px;" />
        <br/><br/>
        <button onclick="fetch('http://localhost:3000/verify?pin='+document.getElementById('pin').value).then(r=>r.json()).then(d=>{if(d.success){alert('Dogru, taranıyor...'); fetch('http://localhost:3000/startScan');}else{alert('Hatali PIN!');}});">TARA</button>
        <div id="result" style="margin-top:30px;"></div>
    </body>
    </html>`);
}
app.whenReady().then(createWindow);
