const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const REPLIT_DEV_DOMAIN = process.env.REPLIT_DEV_DOMAIN;
const REPL_SLUG = process.env.REPL_SLUG;
const REPL_OWNER = process.env.REPL_OWNER;

// Use custom URL from command line, or construct from environment
const customUrl = process.argv[2];
let DEPLOYMENT_URL;

if (customUrl) {
  DEPLOYMENT_URL = customUrl.startsWith('http') ? customUrl : `https://${customUrl}`;
} else {
  // Try to construct production URL first, fallback to dev
  const prodDomain = `${REPL_SLUG}-${REPL_OWNER}.replit.app`;
  DEPLOYMENT_URL = REPLIT_DEV_DOMAIN ? `https://${REPLIT_DEV_DOMAIN}` : `https://${prodDomain}`;
}

const WEBHOOK_PATH = '/webhooks/telegram/action';
const WEBHOOK_URL = `${DEPLOYMENT_URL}${WEBHOOK_PATH}`;

console.log('🔧 Setting up Telegram webhook...');
console.log('📍 Webhook URL:', WEBHOOK_URL);

const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(WEBHOOK_URL)}&allowed_updates=["message","callback_query"]&drop_pending_updates=true`;

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log('✅ Response:', JSON.stringify(result, null, 2));
    
    if (result.ok) {
      console.log('🎉 Webhook set successfully!');
      console.log('📡 Bot will receive messages at:', WEBHOOK_URL);
      
      // Get webhook info
      const infoUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;
      https.get(infoUrl, (infoRes) => {
        let infoData = '';
        infoRes.on('data', (chunk) => { infoData += chunk; });
        infoRes.on('end', () => {
          console.log('\n📊 Webhook Info:', JSON.stringify(JSON.parse(infoData), null, 2));
        });
      });
    } else {
      console.error('❌ Failed to set webhook:', result.description);
    }
  });
}).on('error', (err) => {
  console.error('❌ Error:', err.message);
});
