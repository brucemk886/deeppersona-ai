const SCENE_MARKS = ["A", "B", "C", "D"] as const;

export function sceneKeyFromPath(path: string): string | null {
  return path.startsWith("scene:") ? path.slice(6) : null;
}

export function SceneCard({
  scene,
  index,
  className = "",
}: {
  scene: string;
  index: number;
  className?: string;
}) {
  const mark = SCENE_MARKS[index] ?? "A";
  return (
    <span className={`scene-card scene-${scene} scene-choice-${mark} ${className}`.trim()} aria-hidden="true">
      <span className="scene-card-sky" />
      <span className="scene-card-ground" />
      <span className="scene-card-object" />
      <span className="scene-card-mark">{mark}</span>
    </span>
  );
}
