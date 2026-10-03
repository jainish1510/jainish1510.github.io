"use client";

import { useRef, type ReactNode } from "react";
import { ReadingProgress } from "./reading-progress";

export function ArticleBody({ postId, children }: { postId: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <>
      <ReadingProgress target={ref} postId={postId} />
      <div ref={ref} className="prose-studio">
        {children}
      </div>
    </>
  );
}
