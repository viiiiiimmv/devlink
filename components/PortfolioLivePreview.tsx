import React from 'react';
import PublicProfile from '@/components/public-profile/profile';

import type { Profile } from '@/components/public-profile/profile';

interface PortfolioLivePreviewProps {
  profile: Profile | null;
  themeId: string;
  templateId?: string;
}

export default function PortfolioLivePreview({ profile, themeId, templateId }: PortfolioLivePreviewProps) {
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <span className="text-gray-500">No profile data available for preview.</span>
      </div>
    );
  }
  // Override selected customisation for preview
  const previewProfile = { ...profile, theme: themeId, template: templateId ?? profile.template };
  return <PublicProfile profile={previewProfile} showSharePanel={false} />;
}
