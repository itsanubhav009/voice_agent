const { Groq } = require('groq-sdk');

class LLMService {
  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY;
    if (!this.groqApiKey) {
        console.error('[LLMService] GROQ_API_KEY not found. LLM calls will fail.');
        throw new Error('GROQ_API_KEY is missing for LLMService.');
    }
    this.groq = new Groq({ apiKey: this.groqApiKey });
    console.log('[LLMService] Constructor called. Groq client initialized.');
  }
  
  async generateResponse(conversationContext) {
    console.log('[LLMService] generateResponse called with conversation context length:', conversationContext.length);
    if (conversationContext.length > 0) {
        console.log('[LLMService] Last user message:', conversationContext[conversationContext.length-1].content);
    }
    try {
      const params = {
        messages: conversationContext,
        model: 'llama3-70b-8192',
        temperature: 0.7,
        max_tokens: 800,
        top_p: 0.9,
        stream: false
      };
      console.log('[LLMService] Calling Groq API with params:', JSON.stringify(params, null, 2));
      const response = await this.groq.chat.completions.create(params);
      
      const llmContent = response.choices[0]?.message?.content;
      if (!llmContent) {
          console.error('[LLMService] Groq response missing expected content:', response);
          throw new Error('LLM response did not contain content.');
      }
      console.log(`[LLMService] Groq API response received. Content: "${llmContent}"`);
      return llmContent;
    } catch (error) {
      console.error('[LLMService] Error calling Groq API:', error);
      throw error; // Re-throw
    }
  }
}

module.exports = LLMService;