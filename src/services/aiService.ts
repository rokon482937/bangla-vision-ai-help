
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, increment } from 'firebase/firestore';

interface AIRequest {
  prompt: string;
  userId: string;
}

interface AIResponse {
  reply: string;
  tokensUsed: number;
}

const OPENAI_API_URL = '/api/ask';

export const askAI = async ({ prompt, userId }: AIRequest): Promise<AIResponse> => {
  try {
    // Check user's token limit before making request
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const currentTokens = userData.tokens - userData.usedTokens;
    
    // Free users have unlimited usage, premium users have unlimited tokens
    if (userData.subscription !== 'free' && userData.subscription !== 'premium' && currentTokens <= 0) {
      throw new Error('Insufficient tokens');
    }

    // Make API request
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, userId }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Update token usage for paid users (not free or premium)
    if (userData.subscription !== 'free' && userData.subscription !== 'premium') {
      await updateDoc(doc(db, 'users', userId), {
        usedTokens: increment(10) // Each AI request costs 10 tokens
      });
    }

    return {
      reply: data.reply,
      tokensUsed: 10
    };
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
};

export const checkTokenLimit = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return false;
    }
    
    const userData = userDoc.data();
    
    // Free and premium users have unlimited usage
    if (userData.subscription === 'free' || userData.subscription === 'premium') {
      return true;
    }
    
    // Pro users have token limits
    return (userData.tokens - userData.usedTokens) > 0;
  } catch (error) {
    console.error('Token limit check error:', error);
    return false;
  }
};
