import { APPROVED_PRESENTERS } from '../data/presenters';
import type { PresenterProfile } from '../types/blog';

export interface PersonaDecisionResult {
  persona: PresenterProfile;
  reason: string;
  matchedKeywords: string[];
  confidence: number;
  scores: {
    'tool-cowboy': number;
    'ms-fix-it': number;
    'robo-builder': number;
  };
}

// STCA Trio Keyword & Pattern Dictionaries aligned with the 3 Kinds of Builders
// (Homeowners, DIY Remodelers, and Aspiring Handypeople) from smarttoolsconstructionacademy.com/about-us
const TRIO_PATTERNS = {
  'tool-cowboy': {
    primaryRole: 'Authority + Vision',
    targetBuilder: 'Homeowners (For Owners)',
    buyerAnchor: '“Trust me.”',
    roleTag: 'Primary Authority Figure',
    keywords: [
      'tool cowboy',
      'cowboy',
      'derek',
      'homeowner',
      'homeowners',
      'owner',
      'owners',
      'contractor',
      'contractors',
      'general contractor',
      'subcontractor',
      'bids',
      'bid evaluation',
      'estimate',
      'estimates',
      'markup',
      'markups',
      'hidden markups',
      'burned',
      'getting burned',
      'costly mistakes',
      'remodel planning',
      'budget blowout',
      'budget blowouts',
      'budget realism',
      'change order',
      'change orders',
      'permit',
      'permits',
      'inspection',
      'inspections',
      'vetting',
      'interviewing trades',
      'oversight',
      'field experience',
      'practical advice',
      'risk avoidance',
      'red flags',
      'foundation',
      'structural',
    ],
    funnelBonus: {
      'BOFU (Decision)': 3,
      'MOFU (Consideration)': 2,
      'TOFU (Awareness)': 1,
    },
    defaultReason:
      'Assigned Tool Cowboy — the authoritative voice for Homeowners navigating contractor vetting, bid audits, and costly remodel mistake avoidance (“Trust me.”).',
  },
  'ms-fix-it': {
    primaryRole: 'Translator + Relatability',
    targetBuilder: 'DIY Remodelers (For Doers)',
    buyerAnchor: '“Understand this.”',
    roleTag: 'Translator + Confidence Builder',
    keywords: [
      'ms fix it',
      'ms fix-it',
      'ms fixit',
      'cassidy',
      'diy',
      'doer',
      'doers',
      'remodeler',
      'remodelers',
      'diy remodel',
      'step-by-step',
      'step by step',
      'steps',
      'checklist',
      'checklists',
      'worksheet',
      'worksheets',
      'trade sequencing',
      'sequencing',
      'order of operations',
      'waterproofing',
      'shower',
      'tile',
      'underlayment',
      'schluter',
      'membrane',
      'drywall',
      'taping',
      'mudding',
      'level 4',
      'subfloor',
      'self-leveling',
      'deflection',
      'load-bearing',
      'partition wall',
      'demolition',
      'finish work',
      'quality control gates',
      'qa gates',
      'how to',
      'tutorial',
      'beginner',
      'confidence',
      'explain',
      'clarity',
    ],
    funnelBonus: {
      'MOFU (Consideration)': 3,
      'TOFU (Awareness)': 2,
      'BOFU (Decision)': 1,
    },
    defaultReason:
      'Assigned Ms Fix-It — translator & confidence builder guiding DIY Remodelers through proper sequencing, hands-on craft SOPs, and step-by-step checklists (“Understand this.”).',
  },
  'robo-builder': {
    primaryRole: 'Systems + Proof',
    targetBuilder: 'Aspiring Handypeople (For Pros-in-Progress)',
    buyerAnchor: '“Here’s the system.”',
    roleTag: 'Systems + Proof Engine',
    keywords: [
      'robo builder',
      'robobuilder',
      'brian',
      'handyperson',
      'handypeople',
      'handyman',
      'solo pro',
      'pros-in-progress',
      'pricing framework',
      'pricing',
      'rates',
      'hourly rate',
      'flat-rate',
      'estimating math',
      'job estimating',
      'scope control',
      'scope creep',
      'change order sop',
      'client communication',
      'client onboarding',
      'expectations',
      'deposits',
      'work approvals',
      'job flow',
      'route scheduling',
      'billable hours',
      'first tool kit',
      'tool kit',
      'system',
      'systems',
      'framework',
      'frameworks',
      'spreadsheet',
      'calculator',
      'repeatable',
      'proof',
      'logic',
      'efficiency',
      'business operations',
      'pipeline',
      'automation',
    ],
    funnelBonus: {
      'TOFU (Awareness)': 2,
      'MOFU (Consideration)': 2,
      'BOFU (Decision)': 3,
    },
    defaultReason:
      'Assigned Robo Builder — systems and proof engine empowering Aspiring Handypeople with estimating math, scope control frameworks, and professional job flow (“Here’s the system.”).',
  },
} as const;

/**
 * Automatically decides the best STCA Trio persona based on topic, draft context, and funnel stage.
 * Strictly adheres to the STCA Brand Persona System document specifications.
 */
export function decidePersonaForTopic(
  topic: string,
  draftText?: string,
  funnelStage?: string
): PersonaDecisionResult {
  const combinedText = `${topic || ''} ${draftText || ''}`.toLowerCase();

  const scores: Record<'tool-cowboy' | 'ms-fix-it' | 'robo-builder', number> = {
    'tool-cowboy': 0,
    'ms-fix-it': 0,
    'robo-builder': 0,
  };

  const matches: Record<'tool-cowboy' | 'ms-fix-it' | 'robo-builder', string[]> = {
    'tool-cowboy': [],
    'ms-fix-it': [],
    'robo-builder': [],
  };

  // 1. Calculate keyword match score
  (Object.keys(TRIO_PATTERNS) as Array<keyof typeof TRIO_PATTERNS>).forEach((personaId) => {
    const config = TRIO_PATTERNS[personaId];

    config.keywords.forEach((kw) => {
      // Word boundary regex or phrase inclusion
      const regex = new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`, 'i');
      if (regex.test(combinedText)) {
        // Multi-word keywords get higher weight
        const weight = kw.includes(' ') ? 3 : 2;
        scores[personaId] += weight;
        matches[personaId].push(kw);
      }
    });

    // 2. Add funnel stage affinity bonus
    if (funnelStage && config.funnelBonus[funnelStage as keyof typeof config.funnelBonus]) {
      scores[personaId] += config.funnelBonus[funnelStage as keyof typeof config.funnelBonus];
    }
  });

  // Determine top scoring persona
  let winningId: 'tool-cowboy' | 'ms-fix-it' | 'robo-builder' = 'tool-cowboy';
  let highestScore = -1;

  (Object.keys(scores) as Array<'tool-cowboy' | 'ms-fix-it' | 'robo-builder'>).forEach((id) => {
    if (scores[id] > highestScore) {
      highestScore = scores[id];
      winningId = id;
    }
  });

  // Calculate confidence level (0-100%)
  const totalScore = scores['tool-cowboy'] + scores['ms-fix-it'] + scores['robo-builder'];
  const confidence = totalScore > 0 ? Math.round((highestScore / totalScore) * 100) : 75;

  const winningPersona =
    APPROVED_PRESENTERS.find((p) => p.id === winningId) || APPROVED_PRESENTERS[0];
  const matchedKws = matches[winningId];

  let reason: string = TRIO_PATTERNS[winningId].defaultReason;
  if (matchedKws.length > 0) {
    const preview = matchedKws.slice(0, 3).map((k) => `"${k}"`).join(', ');
    reason = `Auto-matched ${winningPersona.name} based on topic focus ${preview} — aligns with ${winningPersona.primaryRole || TRIO_PATTERNS[winningId].primaryRole} (${TRIO_PATTERNS[winningId].buyerAnchor}).`;
  }

  return {
    persona: winningPersona,
    reason,
    matchedKeywords: matchedKws,
    confidence,
    scores,
  };
}
