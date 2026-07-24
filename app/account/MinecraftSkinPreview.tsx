"use client";

import { useEffect, useRef, useState } from "react";

type SkinModel = "default" | "slim";

interface MinecraftSkinPreviewProps {
  alt: string;
  model: SkinModel;
  src: string;
}

interface SkinPart {
  destination: [number, number, number, number];
  source: [number, number, number, number];
}

function drawPart(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  part: SkinPart,
  mirrored = false,
) {
  const [sourceX, sourceY, sourceWidth, sourceHeight] = part.source;
  const [destinationX, destinationY, destinationWidth, destinationHeight] =
    part.destination;

  if (!mirrored) {
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      destinationX,
      destinationY,
      destinationWidth,
      destinationHeight,
    );
    return;
  }

  context.save();
  context.translate(destinationX * 2 + destinationWidth, 0);
  context.scale(-1, 1);
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    destinationX,
    destinationY,
    destinationWidth,
    destinationHeight,
  );
  context.restore();
}

function drawMinecraftSkin(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  model: SkinModel,
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const modernSkin = image.naturalHeight === 64;
  const slim = model === "slim" && modernSkin;
  const armWidth = slim ? 3 : 4;
  const rightArmX = slim ? 1 : 0;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;

  const head: SkinPart = {
    source: [8, 8, 8, 8],
    destination: [4, 0, 8, 8],
  };
  const body: SkinPart = {
    source: [20, 20, 8, 12],
    destination: [4, 8, 8, 12],
  };
  const rightArm: SkinPart = {
    source: [44, 20, armWidth, 12],
    destination: [rightArmX, 8, armWidth, 12],
  };
  const leftArm: SkinPart = modernSkin
    ? {
        source: [36, 52, armWidth, 12],
        destination: [12, 8, armWidth, 12],
      }
    : {
        source: [44, 20, 4, 12],
        destination: [12, 8, 4, 12],
      };
  const rightLeg: SkinPart = {
    source: [4, 20, 4, 12],
    destination: [4, 20, 4, 12],
  };
  const leftLeg: SkinPart = modernSkin
    ? {
        source: [20, 52, 4, 12],
        destination: [8, 20, 4, 12],
      }
    : {
        source: [4, 20, 4, 12],
        destination: [8, 20, 4, 12],
      };

  drawPart(context, image, rightArm);
  drawPart(context, image, body);
  drawPart(context, image, leftArm, !modernSkin);
  drawPart(context, image, rightLeg);
  drawPart(context, image, leftLeg, !modernSkin);
  drawPart(context, image, head);

  if (!modernSkin) return;

  const overlays: SkinPart[] = [
    {
      source: [44, 36, armWidth, 12],
      destination: [rightArmX, 8, armWidth, 12],
    },
    {
      source: [20, 36, 8, 12],
      destination: [4, 8, 8, 12],
    },
    {
      source: [52, 52, armWidth, 12],
      destination: [12, 8, armWidth, 12],
    },
    {
      source: [4, 36, 4, 12],
      destination: [4, 20, 4, 12],
    },
    {
      source: [4, 52, 4, 12],
      destination: [8, 20, 4, 12],
    },
    {
      source: [40, 8, 8, 8],
      destination: [4, 0, 8, 8],
    },
  ];

  overlays.forEach((part) => drawPart(context, image, part));
}

export function MinecraftSkinPreview({
  alt,
  model,
  src,
}: MinecraftSkinPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    const image = new Image();
    setStatus("loading");

    image.onload = () => {
      if (cancelled) return;
      if (
        image.naturalWidth !== 64 ||
        (image.naturalHeight !== 64 && image.naturalHeight !== 32)
      ) {
        setStatus("error");
        return;
      }

      drawMinecraftSkin(canvas, image, model);
      setStatus("ready");
    };
    image.onerror = () => {
      if (!cancelled) setStatus("error");
    };
    image.src = src;

    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [model, src]);

  return (
    <div
      aria-label={alt}
      className={`minecraft-skin-stage is-${status}`}
      role="img"
    >
      <canvas
        aria-hidden="true"
        className="minecraft-skin-character"
        height={32}
        ref={canvasRef}
        width={16}
      />
      {status === "loading" && (
        <span className="minecraft-skin-status">Загружаем персонажа…</span>
      )}
      {status === "error" && (
        <span className="minecraft-skin-status">Скин пока недоступен</span>
      )}
    </div>
  );
}
