const axios = require('axios');

class LLMClient {
  constructor() {
    this.apiUrl = 'http://llm.gltr.app/v1/chat/completions';
    this.apiKey = '4f8a3d2c9b1e6f7a0d5c8e2f9b6a3c1d';
  }

  async parseSchedulingIntent(userMessage, context = {}) {
    const isKorean = /[가-힣]/.test(userMessage);
    const previousMessages = context.previousMessages || [];
    const userTimezone = context.userTimezone || 'America/Los_Angeles';
    
    const systemPrompt = `You are a scheduling assistant for Hyun. Parse the user's scheduling request into structured JSON.
    
Context:
- User's timezone: ${userTimezone}
- Previous conversation: ${previousMessages.map(m => `${m.role}: ${m.content}`).join('\n')}
    
Important: Use context from previous messages to understand ambiguous references like "that time" or "same day".
Extract the following fields:
- date or dateRange (for ranges like "10월 23일-25일" return {start: "2024-10-23", end: "2024-10-25"})
- time or timeRange (for ranges like "오전 10시-12시" return {start: "10:00", end: "12:00"})
- duration (in minutes)
- purpose (meeting purpose)
- timezone (if mentioned, e.g., "한국시간" = "Asia/Seoul")
- language ("ko" for Korean, "en" for English)

Important:
- Today is ${new Date().toISOString().split('T')[0]}
- If Korean time (한국시간/KST) is mentioned, set timezone to "Asia/Seoul"
- For date ranges, create dateRange object with start and end
- For time ranges, create timeRange object with start and end
- Detect the input language and include it in response

Respond ONLY with valid JSON, no markdown or extra text.

Example for range request:
{"dateRange": {"start": "2024-10-23", "end": "2024-10-25"}, "timeRange": {"start": "10:00", "end": "12:00"}, "timezone": "Asia/Seoul", "language": "ko", "purpose": "meeting"}`;

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 500,
          temperature: 0.3
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          }
        }
      );

      const content = response.data.choices[0].message.content;
      // Remove markdown code blocks if present
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('LLM parsing error:', error);
      throw error;
    }
  }

  async generateResponse(context, userMessage) {
    const isKorean = context.language === 'ko' || /[가-힣]/.test(userMessage);
    const language = isKorean ? 'Korean' : 'English';
    
    const systemPrompt = `You are a friendly scheduling assistant for Hyun.
IMPORTANT: Respond in ${language} language ONLY.
${isKorean ? '한국어로만 대답하세요.' : ''}

Based on the context provided, help users schedule meetings.
Be concise, friendly, and helpful. Speak in a conversational tone.

Context: ${JSON.stringify(context)}

When showing times:
- If the user asked in Korean time (KST/Asia/Seoul), show times in KST
- If showing PT times, clearly label them as PT
- Always be clear about which timezone you're using`;

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 300,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('LLM response error:', error);
      return "죄송합니다. 잠시 문제가 발생했습니다. 다시 시도해주세요.";
    }
  }

  async suggestAlternatives(unavailableSlot, availableSlots, language = 'en') {
    const isKorean = language === 'ko';
    const prompt = `User wanted: ${JSON.stringify(unavailableSlot)}
Available slots: ${JSON.stringify(availableSlots)}

IMPORTANT: Respond in ${isKorean ? 'Korean' : 'English'} language ONLY.
${isKorean ? '한국어로만 대답하세요.' : ''}

Suggest the best alternative times in a friendly way. Be concise.
If times are in a specific timezone, clearly indicate which timezone.`;

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          messages: [
            { role: 'system', content: 'You are a helpful scheduling assistant.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 200,
          temperature: 0.5
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('LLM suggestion error:', error);
      return null;
    }
  }
}

module.exports = new LLMClient();