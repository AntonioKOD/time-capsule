// Helper functions for tag generation and sentiment analysis
export function generateTagsFromText(text: string): string[] {
  // Simple tag extraction based on common keywords
  const keywords = [
    'love', 'family', 'friend', 'hope', 'dream', 'future', 'past', 'memory',
    'happy', 'sad', 'excited', 'scared', 'grateful', 'proud', 'sorry',
    'work', 'school', 'travel', 'home', 'birthday', 'wedding', 'graduation',
    'baby', 'child', 'parent', 'grandparent', 'pet', 'health', 'success'
  ]
  
  const textLower = text.toLowerCase()
  const foundTags = keywords.filter(keyword => textLower.includes(keyword))
  
  // Limit to 5 tags maximum
  return foundTags.slice(0, 5)
}

export function detectSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['happy', 'love', 'excited', 'grateful', 'proud', 'amazing', 'wonderful', 'great', 'fantastic', 'perfect']
  const negativeWords = ['sad', 'angry', 'disappointed', 'worried', 'scared', 'terrible', 'awful', 'horrible', 'hate', 'regret']
  
  const textLower = text.toLowerCase()
  const positiveCount = positiveWords.filter(word => textLower.includes(word)).length
  const negativeCount = negativeWords.filter(word => textLower.includes(word)).length
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

export function sanitizeText(text: string): string {
  // Basic XSS prevention
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
} 