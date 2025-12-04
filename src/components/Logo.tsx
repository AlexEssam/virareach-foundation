import { Zap } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} gradient-primary rounded-xl flex items-center justify-center shadow-glow animate-glow`}>
        <Zap className="w-1/2 h-1/2 text-primary-foreground" />
      </div>
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold text-gradient`}>
          ViraReach
        </span>
      )}
    </div>
  );
}
