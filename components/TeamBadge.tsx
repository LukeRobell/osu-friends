'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Props {
  teamId: string;
  teamTag: string;
  teamName: string;
}

export default function TeamBadge({ teamId, teamTag, teamName }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const avatarUrl = `https://a.ppy.sh/teams/${teamId}`;

  return (
    <a
      href={`https://osu.ppy.sh/teams/${teamId}`}
      target="_blank"
      rel="noopener noreferrer"
      title={teamName}
      className="flex items-center gap-1.5 text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full hover:bg-blue-500/30 transition-colors"
    >
      {!imgFailed && (
        <Image
          src={avatarUrl}
          alt={teamTag}
          width={14}
          height={14}
          className="rounded-sm"
          onError={() => setImgFailed(true)}
        />
      )}
      [{teamTag}]
    </a>
  );
}
