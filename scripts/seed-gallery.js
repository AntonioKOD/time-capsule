const { getPayload } = require('payload');
const config = require('../payload.config.ts');

const sampleCapsules = [
  {
    textContent: "Today I realized that happiness isn't about having everything perfect, but about finding joy in the small moments. The way the morning light hits my coffee cup, the sound of my dog's tail wagging when I come home, the feeling of accomplishment after finishing a good book. These tiny moments make up a beautiful life.",
    sentiment: 'positive',
    tags: [
      { tag: 'happiness' },
      { tag: 'gratitude' },
      { tag: 'mindfulness' },
      { tag: 'reflection' }
    ],
    featured: true
  },
  {
    textContent: "I'm writing this letter to my future self on the day I graduated college. I'm scared about what comes next, but also excited. I hope you remember this feeling of possibility, even when things get tough. Remember that you're capable of more than you know.",
    sentiment: 'neutral',
    tags: [
      { tag: 'graduation' },
      { tag: 'future' },
      { tag: 'hope' },
      { tag: 'growth' }
    ],
    featured: false
  },
  {
    textContent: "Some days feel heavier than others. Today was one of those days. But I'm learning that it's okay to not be okay sometimes. Tomorrow is a new day, and I'm choosing to believe it will be better. Sending love to anyone else who needs to hear this.",
    sentiment: 'negative',
    tags: [
      { tag: 'mental-health' },
      { tag: 'hope' },
      { tag: 'support' },
      { tag: 'healing' }
    ],
    featured: false
  },
  {
    textContent: "I just want to remember this moment forever. Sitting on the beach with my best friend, watching the sunset, talking about our dreams and fears. We promised we'd still be friends in 20 years. I hope we keep that promise.",
    sentiment: 'positive',
    tags: [
      { tag: 'friendship' },
      { tag: 'memories' },
      { tag: 'dreams' },
      { tag: 'beach' }
    ],
    featured: true
  },
  {
    textContent: "Dear future me, I hope you've learned to be kinder to yourself by now. I hope you've stopped comparing yourself to others and started celebrating your own unique journey. You are enough, exactly as you are.",
    sentiment: 'positive',
    tags: [
      { tag: 'self-love' },
      { tag: 'growth' },
      { tag: 'kindness' },
      { tag: 'journey' }
    ],
    featured: false
  },
  {
    textContent: "Today I took a risk and applied for my dream job. I'm terrified of rejection, but I'm more afraid of wondering 'what if' for the rest of my life. Here's to taking chances and believing in ourselves.",
    sentiment: 'neutral',
    tags: [
      { tag: 'career' },
      { tag: 'courage' },
      { tag: 'dreams' },
      { tag: 'risk' }
    ],
    featured: false
  },
  {
    textContent: "I miss you, grandma. It's been a year since you passed, and I still reach for my phone to call you when something good happens. I hope wherever you are, you know how much you meant to me. Thank you for teaching me that love never really dies.",
    sentiment: 'negative',
    tags: [
      { tag: 'grief' },
      { tag: 'love' },
      { tag: 'family' },
      { tag: 'memory' }
    ],
    featured: false
  },
  {
    textContent: "I'm 25 today and I feel like I should have everything figured out by now. But maybe that's okay. Maybe life isn't about having all the answers, but about being brave enough to keep asking the questions.",
    sentiment: 'neutral',
    tags: [
      { tag: 'birthday' },
      { tag: 'growth' },
      { tag: 'questions' },
      { tag: 'wisdom' }
    ],
    featured: false
  }
];

async function seedGallery() {
  try {
    console.log('🌱 Starting gallery seeding...');
    
    const payload = await getPayload({ config });
    
    // Clear existing public capsules
    const existing = await payload.find({
      collection: 'publicCapsules',
      limit: 1000
    });
    
    for (const capsule of existing.docs) {
      await payload.delete({
        collection: 'publicCapsules',
        id: capsule.id
      });
    }
    
    console.log('🗑️ Cleared existing public capsules');
    
    // Create sample capsules
    for (const capsuleData of sampleCapsules) {
      const wordCount = capsuleData.textContent.trim().split(/\s+/).length;
      
      await payload.create({
        collection: 'publicCapsules',
        data: {
          originalCapsuleId: `sample-${Date.now()}-${Math.random()}`,
          textContent: capsuleData.textContent,
          tags: capsuleData.tags,
          sentiment: capsuleData.sentiment,
          wordCount,
          likes: Math.floor(Math.random() * 50) + 1,
          views: Math.floor(Math.random() * 200) + 10,
          featured: capsuleData.featured,
          reportCount: 0,
          isHidden: false,
        }
      });
    }
    
    console.log(`✅ Created ${sampleCapsules.length} sample public capsules`);
    console.log('🎉 Gallery seeding completed!');
    
  } catch (error) {
    console.error('❌ Error seeding gallery:', error);
  }
}

// Run if called directly
if (require.main === module) {
  seedGallery().then(() => process.exit(0));
}

module.exports = { seedGallery }; 