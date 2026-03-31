import { TmdbImage } from "./tmdb-image";

interface CastCardProps {
  id: number;
  name: string;
  character?: string | null;
  profilePath?: string | null;
  job?: string | null; // for crew
}

export function CastCard({ id, name, character, profilePath, job }: CastCardProps) {
  return (
    <div
      className="flex-shrink-0 w-28 flex flex-col bg-card border border-card-border rounded-lg overflow-hidden"
      data-testid={`cast-card-${id}`}
    >
      <TmdbImage
        path={profilePath}
        size="w185"
        alt={name}
        className="w-full aspect-[2/3]"
        fallbackType="profile"
      />
      <div className="p-2">
        <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2" data-testid={`text-cast-name-${id}`}>
          {name}
        </p>
        {(character || job) && (
          <p className="text-xs text-muted-foreground leading-tight line-clamp-2 mt-0.5" data-testid={`text-cast-role-${id}`}>
            {character || job}
          </p>
        )}
      </div>
    </div>
  );
}
