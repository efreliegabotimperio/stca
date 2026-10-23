import { APPROVED_PRESENTERS } from '../data/presenters';
import { STCA_BUILDER_AUDIENCES } from '../data/stcaAudience';
import { getStoredClaudeKey, getStoredOpenAIKey, getStoredAIProvider } from './authService';
import type { PresenterProfile } from '../types/blog';

export interface SocialGraphicData {
  headline: string;
  subheadline: string;
  badge: string;
  presenterName: string;
  presenterRole: string;
  presenterAvatarUrl: string;
  bulletPoints: string[];
  ctaText: string;
  footerUrl: string;
}

export interface GeneratedSocialPack {
  topic: string;
  targetAudience: string;
  presenter: PresenterProfile;
  graphicData: SocialGraphicData;
  captions: {
    instagram: { hook: string; body: string; cta: string; hashtags: string[] };
    facebook: { hook: string; body: string; discussionQuestion: string; hashtags: string[] };
    linkedIn: { hook: string; body: string; keyTakeaways: string[]; hashtags: string[] };
    twitter: { tweet: string; threadFollowUp?: string };
    shortVideoScript: { hook3s: string; voiceover: string; onScreenText: string; caption: string };
  };
}

/**
 * Generate comprehensive social media captions & graphic content
 * tailored strictly for STCA's 3 Kinds of Builders (Homeowners, DIY Remodelers, Aspiring Handypeople).
 */
export async function generateSocialPack(
  topic: string,
  presenterId?: string,
  audienceId?: string
): Promise<GeneratedSocialPack> {
  const cleanTopic = topic.trim() || 'Residential Remodeling & Contractor Oversight';

  // Resolve Presenter
  const presenter =
    APPROVED_PRESENTERS.find((p) => p.id === presenterId) ||
    (cleanTopic.toLowerCase().includes('handy') || cleanTopic.toLowerCase().includes('pricing')
      ? APPROVED_PRESENTERS.find((p) => p.id === 'robo-builder')
      : cleanTopic.toLowerCase().includes('diy') || cleanTopic.toLowerCase().includes('tile') || cleanTopic.toLowerCase().includes('drywall')
      ? APPROVED_PRESENTERS.find((p) => p.id === 'ms-fix-it')
      : APPROVED_PRESENTERS[0])!;

  // Resolve Audience
  const audience =
    STCA_BUILDER_AUDIENCES.find((a) => a.id === audienceId) ||
    (presenter.id === 'tool-cowboy'
      ? STCA_BUILDER_AUDIENCES[0] // Homeowners
      : presenter.id === 'ms-fix-it'
      ? STCA_BUILDER_AUDIENCES[1] // DIY Remodelers
      : STCA_BUILDER_AUDIENCES[2]); // Aspiring Handypeople

  const claudeKey = getStoredClaudeKey();
  const openAIKey = getStoredOpenAIKey();
  const provider = getStoredAIProvider();

  // Try AI generation if Claude or OpenAI key is available
  if (provider === 'claude' && claudeKey?.startsWith('sk-ant')) {
    try {
      const res = await generateWithClaude(cleanTopic, presenter, audience, claudeKey);
      if (res) return res;
    } catch (e) {
      console.warn('Claude social generation failed, using local engine:', e);
    }
  } else if (openAIKey?.startsWith('sk-')) {
    try {
      const res = await generateWithOpenAI(cleanTopic, presenter, audience, openAIKey);
      if (res) return res;
    } catch (e) {
      console.warn('OpenAI social generation failed, using local engine:', e);
    }
  }

  // Fallback Local STCA Engine
  return buildLocalSocialPack(cleanTopic, presenter, audience);
}

function buildLocalSocialPack(
  topic: string,
  presenter: PresenterProfile,
  audience: (typeof STCA_BUILDER_AUDIENCES)[0]
): GeneratedSocialPack {
  const isOwner = audience.id === 'homeowners';
  const isDiy = audience.id === 'diy-remodelers';

  const bullets = isOwner
    ? [
        'Audit contractor estimates line-by-line before signing.',
        'Never release the final 15% payment until permits & inspections clear.',
        'Demand a written change order threshold to stop budget creep.',
      ]
    : isDiy
    ? [
        'Sequence trades in exact order: plumbing rough-in -> electrical -> waterproofing.',
        'Always check subfloor deflection before laying large format tile.',
        'Follow manufacturer dry times strictly between compound coats.',
      ]
    : [
        'Calculate true overhead math before quoting flat-rate jobs.',
        'Issue formal change order approvals for any task not in initial scope.',
        'Batch multi-stop jobs geographically to protect billable hours.',
      ];

  return {
    topic,
    targetAudience: `${audience.name} (${audience.tierTag})`,
    presenter,
    graphicData: {
      headline: topic,
      subheadline: `Field-Tested Wisdom with ${presenter.name}`,
      badge: `${audience.tierTag} • STCA ACADEMY`,
      presenterName: presenter.name,
      presenterRole: presenter.role,
      presenterAvatarUrl: presenter.avatarUrl,
      bulletPoints: bullets,
      ctaText: 'Save this guide & download the free checklist',
      footerUrl: 'smarttoolsconstructionacademy.com',
    },
    captions: {
      instagram: {
        hook: `⚠️ Stop making costly mistakes with ${topic.toLowerCase()}. Here's what you need to know:`,
        body: `Most construction mistakes happen before the first tool is picked up. Whether you're managing a contractor or tackling the work yourself, you need a proven standard.\n\nHere are 3 critical rules from STCA presenter ${presenter.name}:\n\n1️⃣ ${bullets[0]}\n2️⃣ ${bullets[1]}\n3️⃣ ${bullets[2]}\n\nRemember: "${presenter.catchphrase}"`,
        cta: `👉 Save this post for your next project, and tap the link in bio for the free STCA checklist!`,
        hashtags: [
          '#SmartToolsConstructionAcademy',
          '#STCA',
          isOwner ? '#HomeownerTips' : isDiy ? '#DIYRemodel' : '#HandymanBusiness',
          '#ConstructionAdvice',
          '#RemodelStrategy',
          '#HomeImprovement',
        ],
      },
      facebook: {
        hook: `Are you planning a residential project involving ${topic.toLowerCase()}? Don't start without checking this first.`,
        body: `Smart Tools Construction Academy is built for real residential builders and homeowners—not massive commercial companies. Host ${presenter.name} broke down the exact framework you need to protect your investment and finish right the first time.\n\nKey Takeaways:\n• ${bullets[0]}\n• ${bullets[1]}\n• ${bullets[2]}`,
        discussionQuestion: `Have you ever had a contractor bid or DIY project go over budget because of unexpected delays? Drop your experience in the comments!`,
        hashtags: ['#STCA', '#HomeRenovation', '#DIYBuilder', '#ContractorOversight'],
      },
      linkedIn: {
        hook: `In residential construction, execution discipline separates successful projects from costly rework. Here is our field blueprint for ${topic.toLowerCase()}.`,
        body: `Big commercial builders have dedicated superintendents on site every day. But for homeowners, DIY remodelers, and solo handypeople, you are the project manager.\n\nOur latest STCA masterclass featuring ${presenter.name} (${presenter.primaryRole || 'Authority + Vision'}) highlights three non-negotiables:\n\n• ${bullets[0]}\n• ${bullets[1]}\n• ${bullets[2]}\n\nQuote of the day from ${presenter.name}: "${presenter.catchphrase}"`,
        keyTakeaways: bullets,
        hashtags: ['#ConstructionManagement', '#ResidentialBuilding', '#HandymanPro', '#STCA'],
      },
      twitter: {
        tweet: `Avoid costly remodel surprises with ${topic.toLowerCase()}.\n\n3 rules from STCA’s ${presenter.name}:\n\n1. ${bullets[0]}\n2. ${bullets[1]}\n3. ${bullets[2]}\n\n"${presenter.catchphrase}" 🛠️\n\nFull guide: smarttoolsconstructionacademy.com`,
        threadFollowUp: `Built for three kinds of builders: Homeowners, DIY Remodelers, and Aspiring Handypeople. Never let generic commercial advice mislead your residential project.`,
      },
      shortVideoScript: {
        hook3s: `Before you spend a single dollar on ${topic.toLowerCase()}, watch this!`,
        voiceover: `Here is the number one thing people get wrong with ${topic.toLowerCase()}. They skip the trade order of operations or fail to verify estimates in writing. STCA presenter ${presenter.name} says: "${bullets[0]}" and "${bullets[1]}". Do this, and you save thousands.`,
        onScreenText: `${topic.toUpperCase()} — 3 PRO RULES YOU MUST KNOW`,
        caption: `Don't make this costly mistake! 🛠️ Watch our complete STCA guide with ${presenter.name}. Link in bio. #STCA #RemodelTips`,
      },
    },
  };
}

async function generateWithClaude(
  topic: string,
  presenter: PresenterProfile,
  audience: (typeof STCA_BUILDER_AUDIENCES)[0],
  apiKey: string
): Promise<GeneratedSocialPack | null> {
  const prompt = `You are the Lead Social Media Strategist for Smart Tools Construction Academy (smarttoolsconstructionacademy.com).
STCA is NOT for big corporate commercial construction companies. It is strictly "Built for three kinds of builders":
1. Homeowners (For Owners: Contractor vetting, estimate breakdown, avoid costly mistakes without manual labor)
2. DIY Remodelers (For Doers: Pro knowledge, correct trade sequencing, waterproofing, finish quality)
3. Aspiring Handypeople (For Pros-in-Progress: Estimating math, scope control, job flow, client communication)

Target Topic: "${topic}"
Target Builder Audience: "${audience.name}" (${audience.tierTag}: ${audience.description})
STCA Trio Presenter: "${presenter.name}" (${presenter.role})
Buyer Anchor: "${presenter.buyerAnchor || 'Trust me.'}"
Catchphrase: "${presenter.catchphrase}"

Generate a complete social media pack including graphic card data and platform-specific captions.
Return ONLY valid JSON matching this schema:
{
  "graphicData": {
    "headline": "string",
    "subheadline": "string",
    "badge": "string",
    "presenterName": "${presenter.name}",
    "presenterRole": "${presenter.role}",
    "bulletPoints": ["string", "string", "string"],
    "ctaText": "string",
    "footerUrl": "smarttoolsconstructionacademy.com"
  },
  "captions": {
    "instagram": { "hook": "string", "body": "string", "cta": "string", "hashtags": ["string"] },
    "facebook": { "hook": "string", "body": "string", "discussionQuestion": "string", "hashtags": ["string"] },
    "linkedIn": { "hook": "string", "body": "string", "keyTakeaways": ["string"], "hashtags": ["string"] },
    "twitter": { "tweet": "string", "threadFollowUp": "string" },
    "shortVideoScript": { "hook3s": "string", "voiceover": "string", "onScreenText": "string", "caption": "string" }
  }
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const text = data.content?.[0]?.text;
  if (!text) return null;

  const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(jsonStr);

  return {
    topic,
    targetAudience: `${audience.name} (${audience.tierTag})`,
    presenter,
    graphicData: {
      ...parsed.graphicData,
      presenterAvatarUrl: presenter.avatarUrl,
    },
    captions: parsed.captions,
  };
}

async function generateWithOpenAI(
  topic: string,
  presenter: PresenterProfile,
  audience: (typeof STCA_BUILDER_AUDIENCES)[0],
  apiKey: string
): Promise<GeneratedSocialPack | null> {
  const prompt = `Generate a complete social media pack for Smart Tools Construction Academy (smarttoolsconstructionacademy.com).
STCA is for residential Homeowners, DIY Remodelers, and Aspiring Handypeople (NOT big commercial construction).
Topic: "${topic}"
Audience: "${audience.name}" (${audience.tierTag})
Presenter: "${presenter.name}" ("${presenter.catchphrase}")

Return ONLY valid JSON matching:
{
  "graphicData": {
    "headline": "string",
    "subheadline": "string",
    "badge": "string",
    "presenterName": "${presenter.name}",
    "presenterRole": "${presenter.role}",
    "bulletPoints": ["string", "string", "string"],
    "ctaText": "string",
    "footerUrl": "smarttoolsconstructionacademy.com"
  },
  "captions": {
    "instagram": { "hook": "string", "body": "string", "cta": "string", "hashtags": ["string"] },
    "facebook": { "hook": "string", "body": "string", "discussionQuestion": "string", "hashtags": ["string"] },
    "linkedIn": { "hook": "string", "body": "string", "keyTakeaways": ["string"], "hashtags": ["string"] },
    "twitter": { "tweet": "string", "threadFollowUp": "string" },
    "shortVideoScript": { "hook3s": "string", "voiceover": "string", "onScreenText": "string", "caption": "string" }
  }
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) return null;

  const parsed = JSON.parse(text);
  return {
    topic,
    targetAudience: `${audience.name} (${audience.tierTag})`,
    presenter,
    graphicData: {
      ...parsed.graphicData,
      presenterAvatarUrl: presenter.avatarUrl,
    },
    captions: parsed.captions,
  };
}
