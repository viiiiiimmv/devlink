import React from 'react';
import PublicProfile from '@/components/public-profile/profile';

import type { Profile } from '@/components/public-profile/profile';

interface PortfolioLivePreviewProps {
  profile: Profile | null;
  themeId: string;
}

export default function PortfolioLivePreview({ profile, themeId }: PortfolioLivePreviewProps) {
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <span className="text-gray-500">No profile data available for preview.</span>
      </div>
    );
  }
  // Override theme for preview
  const previewProfile = { ...profile, theme: themeId };
  return <PublicProfile profile={previewProfile} />;
}
