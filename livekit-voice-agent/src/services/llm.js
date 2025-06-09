const { Groq } = require('groq-sdk');

class LLMService {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }
  
  async generateResponse(conversationContext) {
    try {
      // Call Groq API
      const response = await this.groq.chat.completions.create({
        messages: conversationContext,
        model: 'llama3-70b-8192', // Using LLaMA 3 70B model through Groq
        temperature: 0.7,
        max_tokens: 800,
        top_p: 0.9,
        stream: false // We'll implement streaming separately
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error('LLM Error:', error);
      throw error;
    }
  }
  
  // In a more advanced implementation, we would add streaming capability
  // to start generating the response incrementally
}

module.exports = LLMService;
