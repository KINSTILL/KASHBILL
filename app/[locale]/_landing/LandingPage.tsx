'use client';
import { useEffect } from 'react';
import { LandingHeader } from './LandingHeader';
import { LanguageSuggestion } from './LanguageSuggestion';
import { ScrollProgress } from './ScrollProgress';
import { Hero } from './Hero';
import { SocialProofStrip } from './SocialProofStrip';
import { ProblemSection } from './ProblemSection';
import { HowItWorks } from './HowItWorks';
import { Features } from './Features';
import { CaseStudies } from './CaseStudies';
import { DemoSection } from './DemoSection';
import { Pricing } from './Pricing';
import { MiniFAQ } from './MiniFAQ';
import { FinalCTA } from './FinalCTA';
import { LandingFooter } from './LandingFooter';
import { StickyCTA } from './StickyCTA';
import { ScrollToTop } from './ScrollToTop';
import type { LandingPersonalization } from '@/lib/landing/types';

export function LandingPage({
  personalization,
  locale,
  isLoggedIn = false,
}: {
  personalization: LandingPersonalization;
  locale: string;
  isLoggedIn?: boolean;
}) {
  useEffect(() => {
    if (!personalization.isReturning) {
      document.cookie = 'mycashbill_visitor=returning; max-age=31536000; path=/; SameSite=Lax';
    }
  }, [personalization.isReturning]);

  return (
    <>
      <ScrollProgress />
      <LanguageSuggestion personalization={personalization} currentLocale={locale} />
      <LandingHeader personalization={personalization} locale={locale} />
      <main>
        <Hero personalization={personalization} locale={locale} />
        <SocialProofStrip locale={locale} />
        <ProblemSection />
        <HowItWorks />
        <Features />
        <CaseStudies locale={locale} />
        <DemoSection personalization={personalization} locale={locale} />
        <Pricing personalization={personalization} locale={locale} isLoggedIn={isLoggedIn} />
        <MiniFAQ locale={locale} />
        <FinalCTA personalization={personalization} locale={locale} />
      </main>
      <LandingFooter personalization={personalization} locale={locale} />
      <StickyCTA personalization={personalization} locale={locale} />
      <ScrollToTop />
    </>
  );
}
