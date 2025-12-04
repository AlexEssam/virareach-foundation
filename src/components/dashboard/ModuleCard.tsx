import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon, ArrowRight, Lock } from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  locked?: boolean;
  onClick?: () => void;
}

export function ModuleCard({ title, description, icon: Icon, color, locked = false, onClick }: ModuleCardProps) {
  return (
    <Card 
      variant="module" 
      className={`relative overflow-hidden ${locked ? 'opacity-60' : ''}`}
      onClick={locked ? undefined : onClick}
    >
      {/* Gradient overlay on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 100%)` }}
      />
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div 
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
          {locked ? (
            <Lock className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          )}
        </div>
        <CardTitle className="text-lg mt-4">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <Button 
          variant={locked ? "outline" : "glow"} 
          className="w-full"
          disabled={locked}
        >
          {locked ? "Coming Soon" : "Open Module"}
        </Button>
      </CardContent>
    </Card>
  );
}
