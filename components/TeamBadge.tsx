'use client';

import { useState } from 'react';

interface Props {
  teamId: string;
  teamTag: string;
  teamName: string;
  teamFlagUrl: string | null;
}

export default function TeamBadge({ teamId, teamTag, teamName, teamFlagUrl }: Props) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <a
      href={`https://osu.ppy.sh/teams/${teamId}`}
      target="_blank"
      rel="noopener noreferrer"
      title={teamTag}
      className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
    >
      {teamFlagUrl && !imgFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={teamFlagUrl}
          alt={teamName}
          width={20}
          height={20}
          className="rounded-sm object-cover flex-shrink-0"
          onError={() => setImgFailed(true)}
        />
      )}
      {teamName}
    </a>
  );
}
