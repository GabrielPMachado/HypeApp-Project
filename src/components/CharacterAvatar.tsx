import { useId, useMemo } from "react";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";

import {
  AVATAR_VIEWS,
  buildCharacter,
  LOOK_SLOTS,
  type AvatarView,
  type Gradient,
  type Look,
  type Paint,
  type Shape,
} from "@/data/character";

interface CharacterAvatarProps {
  look: Look;
  // Recorte da figura; "bust" (padrão) é o busto que cabe num círculo.
  view?: AvatarView;
  // Altura em pixels (nos recortes quadrados, também a largura).
  size: number;
}

// Desenha o personagem (geometria em data/character.ts) com react-native-svg.
// Os degradês ganham ids únicos por instância, senão dois personagens na mesma
// tela (lista de seguidores, loja) disputariam o mesmo id.
export function CharacterAvatar({ look, view = "bust", size }: CharacterAvatarProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const key = LOOK_SLOTS.map((slot) => look[slot]).join("|");
  // Busto e recortes de roupa não mostram calça nem sapato: pula esses desenhos.
  const lowerBody = view === "full" || view === "bottom" || view === "shoes";
  const shapes = useMemo(() => buildCharacter(look, lowerBody), [key, lowerBody]);
  const box = AVATAR_VIEWS[view];

  const gradients: { id: string; gradient: Gradient }[] = [];
  const paintFor = (paint: Paint | undefined, index: number): string | undefined => {
    if (paint === undefined) return undefined;
    if (typeof paint === "string") return paint;
    const id = `${uid}g${index}`;
    gradients.push({ id, gradient: paint });
    return `url(#${id})`;
  };

  const elements = shapes.map((shape: Shape, index) => {
    const fill = paintFor(shape.fill, index) ?? "none";
    const common = {
      fill,
      stroke: shape.stroke,
      strokeWidth: shape.stroke ? shape.sw ?? 1 : undefined,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
      opacity: shape.op,
    };
    switch (shape.t) {
      case "path":
        return <Path key={index} d={shape.d} {...common} />;
      case "circle":
        return <Circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} {...common} />;
      case "ellipse":
        return <Ellipse key={index} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...common} />;
      case "rect":
        return <Rect key={index} x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx} {...common} />;
    }
  });

  return (
    <Svg width={(size * box.w) / box.h} height={size} viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}>
      <Defs>
        {gradients.map(({ id, gradient }) => {
          const stops = gradient.stops.map(([offset, color, opacity], i) => (
            <Stop key={i} offset={offset} stopColor={color} stopOpacity={opacity ?? 1} />
          ));
          return gradient.k === "radial" ? (
            <RadialGradient key={id} id={id} cx={gradient.cx} cy={gradient.cy} r={gradient.r}>
              {stops}
            </RadialGradient>
          ) : (
            <LinearGradient key={id} id={id} x1={gradient.x1} y1={gradient.y1} x2={gradient.x2} y2={gradient.y2}>
              {stops}
            </LinearGradient>
          );
        })}
      </Defs>
      {elements}
    </Svg>
  );
}
