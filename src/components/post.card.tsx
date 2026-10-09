"use client";

import { Card, CardContent } from "./ui/card";
import { InstaPost } from "@/lib/models/insta-post";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

// Extend window type for Instagram embed
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

export function PostCard({ post, className }: { post: InstaPost; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Instagram embed script if it doesn't exist
    if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
      const script = document.createElement("script");
      script.src = "//www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    } else {
      // If script already exists, process embeds
      if (window.instgrm) {
        window.instgrm.Embeds.process();
      }
    }
  }, [post.url]);

  // post.url is validated in lib/data.ts, so interpolating it into HTML is safe.
  const html = `<blockquote class="instagram-media" data-instgrm-permalink="${post.url}" data-instgrm-version="14" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><a href="${post.url}" target="_blank" rel="noopener noreferrer">View this post on Instagram</a></blockquote>`;

  return (
    <div className="flex justify-center">
      <Card
        ref={cardRef}
        className={cn("hover:shadow-md transition-shadow hover:scale-102 overflow-hidden", className)}
      >
        <CardContent>
          {/* embed.js replaces the blockquote with an iframe, so React must not own that node */}
          <div dangerouslySetInnerHTML={{ __html: html }} className="instagram-embed-container" />
        </CardContent>
      </Card>
    </div>
  );
}
