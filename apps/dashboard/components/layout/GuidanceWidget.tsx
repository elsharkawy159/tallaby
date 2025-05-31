"use client";

import { useState } from "react";
import {
  MessageCircle,
  X,
  Book,
  HelpCircle,
  Video,
  FileText,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";

export const GuidanceWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  const guidanceOptions = [
    {
      title: "Live Chat Support",
      description: "Get instant help from our support team",
      icon: MessageCircle,
      action: () => console.log("Opening chat..."),
    },
    {
      title: "Knowledge Base",
      description: "Browse articles and tutorials",
      icon: Book,
      action: () => console.log("Opening knowledge base..."),
    },
    {
      title: "Video Tutorials",
      description: "Watch step-by-step guides",
      icon: Video,
      action: () => console.log("Opening videos..."),
    },
    {
      title: "FAQ",
      description: "Find answers to common questions",
      icon: HelpCircle,
      action: () => console.log("Opening FAQ..."),
    },
    {
      title: "Documentation",
      description: "Detailed technical guides",
      icon: FileText,
      action: () => console.log("Opening docs..."),
    },
  ];

  return (
    <>
      {/* Guidance Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-80">
          <Card className="bg-white shadow-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Need Help?</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {guidanceOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={option.action}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <option.icon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {option.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {option.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Guidance Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <HelpCircle className="h-6 w-6 text-white" />
        )}
      </Button>
    </>
  );
};
