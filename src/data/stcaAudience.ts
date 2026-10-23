export interface BuilderAudience {
  id: 'all' | 'homeowners' | 'diy-remodelers' | 'aspiring-handypeople';
  tierTag: string;
  name: string;
  tagline: string;
  description: string;
  idealPersonaId: 'tool-cowboy' | 'ms-fix-it' | 'robo-builder';
  defaultOffer: string;
  presetTopics: string[];
}

export const STCA_BUILDER_AUDIENCES: BuilderAudience[] = [
  {
    id: 'homeowners',
    tierTag: 'FOR OWNERS',
    name: 'Homeowners',
    tagline: 'Plan, manage & avoid costly mistakes without doing manual labor',
    description:
      'Learn how to plan and manage construction projects, understand estimates, and avoid costly mistakes — without needing to do the work yourself.',
    idealPersonaId: 'tool-cowboy',
    defaultOffer: 'Free STCA Contractor Estimate Audit Matrix & Red-Flag Checklist',
    presetTopics: [
      'How to Review Contractor Estimates & Spot Hidden Markups',
      'Managing Your General Contractor: Avoiding Costly Remodel Delays',
      'The Homeowner’s Permit Guide: When You Actually Need One & What Inspectors Check',
      'Change Orders Explained: How to Prevent 30% Remodel Budget Blowouts',
      'Kitchen Remodel Planning: 7 Red Flags When Interviewing Trades',
    ],
  },
  {
    id: 'diy-remodelers',
    tierTag: 'FOR DOERS',
    name: 'DIY Remodelers',
    tagline: 'Pro-level knowledge planned correctly, sequenced properly, and built to last',
    description:
      'Gain professional-level knowledge so your projects are planned correctly, sequenced properly, and built to last.',
    idealPersonaId: 'ms-fix-it',
    defaultOffer: 'Free STCA Trade Sequencing Roadmap & Finish-Quality SOP Checklist',
    presetTopics: [
      'Trade Sequencing 101: The Exact Order to Remodel a Bathroom Without Backtracking',
      'Shower Waterproofing Done Right: Schluter vs Liquid Membrane Quality Gates',
      'Drywall Finishing SOP: Hanging, Taping & Mudding for Level 4 Smooth Walls',
      'How to Identify Load-Bearing vs Partition Walls Before Demolition',
      'Subfloor Preparation: Self-Leveling & Deflection Checks for Tile and LVP',
    ],
  },
  {
    id: 'aspiring-handypeople',
    tierTag: 'FOR PROS-IN-PROGRESS',
    name: 'Aspiring Handypeople',
    tagline: 'Estimating, scope control, job flow & client communication to operate professionally',
    description:
      'Learn estimating, scope control, job flow, and client communication — the knowledge required to operate professionally.',
    idealPersonaId: 'robo-builder',
    defaultOffer: 'Free Handyperson Job Estimator & Scope Control Agreement Template',
    presetTopics: [
      'Handyperson Pricing Framework: Hourly vs Flat-Rate Estimating Math',
      'Scope Creep Defense: How Solo Pros Stop Doing Unpaid Extra Work',
      'Client Onboarding SOP: Setting Expectations, Deposits & Work Approvals',
      'Job Flow & Route Scheduling: Maximizing Billable Hours on Multi-Stop Days',
      'The First $5,000 Tool Kit: What Solo Handypeople Actually Need on Day One',
    ],
  },
];

/**
 * Return a random suggested topic for a specific builder audience or across all audiences.
 */
export function getRandomSuggestedTopic(audienceId?: string): { topic: string; audience: BuilderAudience } {
  let targetAudience: BuilderAudience;

  if (audienceId && audienceId !== 'all') {
    targetAudience =
      STCA_BUILDER_AUDIENCES.find((a) => a.id === audienceId) || STCA_BUILDER_AUDIENCES[0];
  } else {
    const randAudIdx = Math.floor(Math.random() * STCA_BUILDER_AUDIENCES.length);
    targetAudience = STCA_BUILDER_AUDIENCES[randAudIdx];
  }

  const randTopicIdx = Math.floor(Math.random() * targetAudience.presetTopics.length);
  return {
    topic: targetAudience.presetTopics[randTopicIdx],
    audience: targetAudience,
  };
}
