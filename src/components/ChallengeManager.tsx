import React, { useState } from "react";
import MusicChallenges from "./MusicChallenges";
import RemixStudio from "./RemixStudio";

interface ChallengeUser {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
}

interface LocationBreakdown {
  locationName: string;
  count: number;
}

interface Challenge {
  _id: string;
  user: ChallengeUser | string | any;
  username: string;
  videoUrl: string;
  caption: string;
  songTitle: string;
  choirOrArtist: string;
  isOriginalSound: boolean;
  parentChallengeId: string | null;
  audioSourceUrl: string;
  likes: string[];
  views: number;
  uniqueReach: string[];
  locationBreakdown?: LocationBreakdown[];
  reactions: {
    hot: number;
    praise: number;
    love: number;
    anointed: number;
  };
  createdAt: string;
}

const ChallengeManager: React.FC = () => {
  const [activeRemixTrack, setActiveRemixTrack] = useState<Challenge | null>(null);

  if (activeRemixTrack) {
    // Safely extract whatever track URL asset is available
    const rawUrl = activeRemixTrack.audioSourceUrl || activeRemixTrack.videoUrl || "";
    
    // Normalize string format so it handles missing or double slash prefixes smoothly
    const sanitizedUrl = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
    const fullAudioUrl = `https://adventconnect-7jfq.onrender.com${sanitizedUrl}`;

    return (
      <RemixStudio 
        parentChallengeId={activeRemixTrack._id}
        audioUrl={fullAudioUrl}
        songTitle={activeRemixTrack.songTitle || "Original Production Track"}
        onClose={() => setActiveRemixTrack(null)}
      />
    );
  }

  return (
    <MusicChallenges 
      onRemixSelect={(selectedTrack) => setActiveRemixTrack(selectedTrack)} 
    />
  );
};

export default ChallengeManager;