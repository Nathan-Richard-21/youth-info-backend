const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const WhatsAppSubmission = require('../models/WhatsAppSubmission');

// WhatsApp webhook verification (GET request)
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verify token from environment variable
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'vibecoding';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verified');
    res.status(200).send(challenge);
  } else {
    console.log('❌ WhatsApp webhook verification failed');
    res.sendStatus(403);
  }
});

// WhatsApp webhook (POST request) - receives messages
router.post('/webhook', async (req, res) => {
  try {
    // Validate webhook signature
    const signature = req.headers['x-hub-signature-256'];
    const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

    if (APP_SECRET && signature) {
      const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', APP_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSignature) {
        console.log('❌ Invalid webhook signature');
        return res.sendStatus(403);
      }
    }

    const body = req.body;

    // Check if this is a WhatsApp Business Account webhook
    if (body.object === 'whatsapp_business_account') {
      // Loop through entries (usually just one)
      for (const entry of body.entry) {
        // Loop through changes
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const value = change.value;
            
            // Check if there are messages
            if (value.messages && value.messages.length > 0) {
              for (const message of value.messages) {
                // Only process messages from the specific number
                if (message.from === '27716185262' || message.from === '716185262') {
                  await processIncomingMessage(message, value);
                }
              }
            }
          }
        }
      }
    }

    // Always respond with 200 OK
    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.sendStatus(500);
  }
});

// Process incoming WhatsApp message
async function processIncomingMessage(message, value) {
  try {
    const messageType = message.type;
    let messageContent = '';
    let mediaUrl = null;

    // Extract message content based on type
    switch (messageType) {
      case 'text':
        messageContent = message.text.body;
        break;
      case 'image':
        messageContent = message.image.caption || 'Image received';
        mediaUrl = message.image.id;
        break;
      case 'document':
        messageContent = message.document.caption || message.document.filename || 'Document received';
        mediaUrl = message.document.id;
        break;
      case 'video':
        messageContent = message.video.caption || 'Video received';
        mediaUrl = message.video.id;
        break;
      default:
        messageContent = `Unsupported message type: ${messageType}`;
    }

    // Determine category based on keywords
    const category = categorizeMessage(messageContent);

    // Get sender info
    const senderPhone = message.from;
    const senderName = value.contacts?.[0]?.profile?.name || 'Unknown';

    // Save to database for admin approval
    const submission = new WhatsAppSubmission({
      messageId: message.id,
      senderPhone,
      senderName,
      messageType,
      messageContent,
      mediaUrl,
      category,
      timestamp: new Date(parseInt(message.timestamp) * 1000),
      status: 'pending', // pending, approved, rejected
      metadata: {
        phoneNumberId: value.metadata.phone_number_id,
        displayPhoneNumber: value.metadata.display_phone_number
      }
    });

    await submission.save();
    console.log(`✅ Message saved from ${senderName} (${senderPhone}): ${messageContent.substring(0, 50)}...`);

    // Mark message as read
    await markMessageAsRead(message.id, value.metadata.phone_number_id);

  } catch (error) {
    console.error('Error processing message:', error);
  }
}

// Categorize message based on keywords
function categorizeMessage(content) {
  const contentLower = content.toLowerCase();
  
  const keywords = {
    bursary: ['bursary', 'bursaries', 'scholarship', 'nsfas', 'funding', 'study', 'university', 'college'],
    career: ['job', 'jobs', 'career', 'employment', 'position', 'vacancy', 'hiring', 'recruit', 'work'],
    learnership: ['learnership', 'apprentice', 'internship', 'training', 'learner'],
    business: ['business', 'entrepreneur', 'startup', 'grant', 'nyda', 'seda', 'funding']
  };

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => contentLower.includes(word))) {
      return category;
    }
  }

  return 'general';
}

// Mark message as read
async function markMessageAsRead(messageId, phoneNumberId) {
  try {
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!ACCESS_TOKEN) return;

    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      })
    });

    if (response.ok) {
      console.log(`✅ Message ${messageId} marked as read`);
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
}

module.exports = router;
