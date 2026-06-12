const { app, BrowserWindow } = require('electron');
const { exec } = require('child_process');
const express = require('express');
const https = require('https');
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
        if (stdout.toLowerCase().includes('fivemhook')) found.push('FiveMHook');
        
        // Sonucu konsola yazdır
        console.log('Tarama tamamlandi. Bulunanlar:', found);
        
        // Webhook yoksa hata vermesin diye deneme
        try {
            const data = JSON.stringify({ content: found.length > 0 ? `HILE TESPITI: ${found.join(', ')}` : 'TEMIZ sistem' });
            const options = {
                hostname: 'discord.com',
                path: '/api/webhooks/SAKLANACAK/SIFIRLA',
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
            };
            const req = https.request(options);
            req.write(data);
            req.end();
        } catch(e) { console.log('Webhook gonderilemedi:', e); }
    });
});
expressApp.listen(port, () => console.log('Server calisiyor port 3000'));

function createWindow() {
    mainWindow = new BrowserWindow({ 
        width: 480, 
        height: 420, 
        webPreferences: { 
            nodeIntegration: true, 
            contextIsolation: false 
        } 
    });
    mainWindow.loadURL(`data:text/html,
    <html>
    <head><style>body{background:#0a0a0a;color:#00ff00;font-family:monospace;text-align:center;padding:40px;}</style></head>
    <body>
        <h2 style="color:#ff0000;">REXGUN SCANNER</h2>
        <p style="color:#ffff00;">Lutfen bekleyin, korkmayin.</p>
        <p style="color:#ffffff;">Rexgun Scanner tarafindan kontrol ediliyorsunuz.</p>
        <br/>
        <p>PIN kodunuzu girin:</p>
        <input id="pin" style="background:#222;color:#0f0;border:2px solid red;padding:12px;width:200px;text-align:center;font-size:18px;" />
        <br/><br/>
        <button onclick="fetch('http://localhost:3000/verify?pin='+document.getElementById('pin').value).then(r=>r.json()).then(d=>{if(d.success){alert('DOGRU PIN! Tarama basliyor...'); fetch('http://localhost:3000/startScan'); document.getElementById('result').innerHTML='<span style=\\'color:#ff0000;\\'>TARANIYOR...</span>';}else{alert('HATALI PIN! Tekrar deneyin.');}}).catch(e=>alert('Sunucu hatasi: '+e));" style="background:#ff0000;color:white;padding:12px 24px;font-size:16px;border:none;cursor:pointer;">TARA</button>
        <div id="result" style="margin-top:30px;"></div>
        <p style="position:absolute;bottom:10px;left:0;right:0;font-size:10px;color:#555;">Rexgun Security v1.0</p>
    </body>
    </html>`);
}
app.whenReady().then(createWindow);
