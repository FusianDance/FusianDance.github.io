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
  }, [post.html]);

  return (
    <div className="flex justify-center">
      <Card
        ref={cardRef}
        className={cn("hover:shadow-md transition-shadow hover:scale-102 overflow-hidden", className)}
      >
        <CardContent>
          <div dangerouslySetInnerHTML={{ __html: post.html }} className="instagram-embed-container" />
        </CardContent>
      </Card>
    </div>
  );
}
