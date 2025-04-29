// This service now makes an API call to the backend to send the Telegram message
import type { Link as LinkType } from '../types';

// The Telegram bot logic is now on the server-side.
// This function makes an API call to the server to trigger the message send.
export async function sendNewLinkMessage(link: LinkType): Promise<void> {
  try {
    const response = await fetch('/api/send-telegram-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(link),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('Telegram message request sent successfully to server.');
    } else {
      console.error('Failed to send Telegram message via API:', result.error);
      // Optionally show a toast or handle the error in the UI
    }
  } catch (error) {
    console.error('Error making API call to send Telegram message:', error);
    // Optionally show a toast or handle the error in the UI
  }
}
