export type UserRole = 'superadmin' | 'admin' | 'standard user';

export interface PresenterProfile {
  id: string;
  name: string;
  role: string;
  primaryRole?: string;
  brandFunction?: string;
  coreStrength?: string;
  buyerAnchor?: string;
  slogan?: string;
  avatarUrl: string;
  masterAvatarId: string;
  masterVoiceId: string;
  approved: boolean;
  topicFit: string[];
  toneRules: string;
  catchphrase: string;
  avatarColor: string;
  customVoiceAudioUrl?: string;
  customVoiceFileName?: string;
}

export interface JobInputs {
  id: string;
  createdAt: string;
  updatedAt: string;
  topic: string;
  draftText?: string;
  audience: string;
  searchIntent: string;
  ctaOffer: string;
  destination: string;
  presenterId: string;
  targetLength: 'Short (800-1200w)' | 'Standard (1500-2000w)' | 'Ultimate Guide (2500w+)';
  market: string;
  funnelStage: 'TOFU (Awareness)' | 'MOFU (Consideration)' | 'BOFU (Decision)';
  canvaTemplateId?: string;
  voiceId?: string;
  status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'READY_FOR_PUBLISH' | 'FAILED';
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: UserRole;
}

export interface ResearchBrief {
  primaryReaderProblem: string;
  searchIntentSummary: string;
  keyQuestions: string[];
  verifiedFacts: string[];
  sourceLedger: Array<{ id: number; title: string; url: string; credibilityScore: string }>;
  contentGaps: string[];
  recommendedAngle: string;
  outline: Array<{ heading: string; keyPoints: string[] }>;
  riskFlags: string[];
}

export interface CanvaVisualSpec {
  templateId: string;
  referenceId: string;
  logoAssetId: string;
  colorPalette: { primary: string; secondary: string; accent: string; background: string; text: string };
  typography: { headerFont: string; bodyFont: string };
  graphicsList: Array<{
    type: 'HERO' | 'INLINE_CALLOUT' | 'QUOTE_CARD' | 'CTA_BANNER' | 'SOCIAL_THUMBNAIL';
    location: string;
    headline: string;
    layoutInstructions: string;
    altText: string;
    dimensions: string;
    exportFilename: string;
  }>;
}

export interface VoiceoverBrief {
  presenterName: string;
  masterVoiceId: string;
  targetDurationSeconds: number;
  spokenPhrasingScript: string;
  pronunciationNotes: string[];
  introScript: string;
  outroScript: string;
  audioDirectives: string[];
}

export interface AvatarVideoBrief {
  presenterName: string;
  masterAvatarId: string;
  masterVoiceId: string;
  backgroundScene: string;
  framingPlacement: string;
  onScreenTitles: string[];
  bRollInsertPoints: string[];
  outputRatios: ('16:9' | '9:16' | '1:1')[];
  exportFilenames: string[];
}

export interface SEOPackage {
  seoTitle: string;
  metaDescription: string;
  slug: string;
  excerpt: string;
  primaryQuery: string;
  secondaryKeywords: string[];
  internalLinks: Array<{ text: string; url: string }>;
  schemaType: string;
  suggestedAltTexts: string[];
}

export interface SocialRepurpose {
  linkedInPost: string;
  facebookPost: string;
  instagramCarousel: Array<{ slideNumber: number; headline: string; body: string }>;
  shortVideoScript: string;
  emailTeaser: { subject: string; preheader: string; body: string; ctaText: string };
  youtubeSpec: { title: string; description: string; tags: string[] };
}

export interface QACategoryResult {
  id: number;
  category: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  notes: string;
}

export interface QAReport {
  overallStatus: 'PASS' | 'FAIL' | 'PENDING';
  passedCount: number;
  totalCount: number;
  categories: QACategoryResult[];
  blockers: string[];
}

export interface ManifestData {
  jobId: string;
  version: string;
  blogSlug: string;
  blogTitle: string;
  researchStatus: string;
  presenterId: string;
  avatarAssetId: string;
  voiceAssetId: string;
  canvaTemplateId: string;
  brandRules: string;
  ctaId: string;
  generatedOutputs: string[];
  qaStatus: string;
  blockers: string[];
  publishStatus: string;
}

export interface STCABlogPackage {
  job: JobInputs;
  presenter: PresenterProfile;
  researchBrief: ResearchBrief;
  blogMaster: {
    h1Title: string;
    hook: string;
    valuePromise: string;
    sections: Array<{ h2: string; h3s?: string[]; content: string; fieldTip?: string }>;
    presenterCallout: string;
    ctaSection: string;
    conclusion: string;
    fullMarkdown: string;
  };
  seo: SEOPackage;
  canvaVisualSpec?: CanvaVisualSpec;
  voiceover?: VoiceoverBrief;
  avatarVideo?: AvatarVideoBrief;
  socialRepurpose: SocialRepurpose;
  qaReport: QAReport;
  manifest?: ManifestData;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: UserRole;
}

export interface AppUser {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending';
  created_at?: string;
  updated_at?: string;
  last_sign_in_at?: string;
}

export interface UserSession {
  id: string;
  username: string;
  email: string;
  role?: UserRole;
  isLoggedIn: boolean;
}

