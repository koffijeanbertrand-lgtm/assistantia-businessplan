import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Save, RefreshCw, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface BusinessPlanResultProps {
  businessPlan: string;
  onSave: () => void;
  onRestart: () => void;
}

export const BusinessPlanResult = ({
  businessPlan,
  onSave,
  onRestart,
}: BusinessPlanResultProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(businessPlan);
      setCopied(true);
      toast({
        title: "✓ Copié",
        description: "Le business plan a été copié dans le presse-papier",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le texte",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <header className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              🎉 Votre Business Plan est prêt !
            </h1>
            <p className="text-muted-foreground">
              Voici votre plan d'affaires professionnel généré par l'IA
            </p>
          </header>

          <Card className="p-6 md:p-10 shadow-card gradient-card mb-6">
            <div
              className="prose prose-slate dark:prose-invert max-w-none"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {businessPlan}
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleCopy}
              variant="outline"
              size="lg"
              className="transition-smooth hover:shadow-elegant"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-5 w-5" />
                  Copier le texte
                </>
              )}
            </Button>

            <Button
              onClick={onSave}
              size="lg"
              className="gradient-primary text-primary-foreground transition-smooth hover:shadow-elegant"
            >
              <Save className="mr-2 h-5 w-5" />
              Sauvegarder
            </Button>

            <Button
              onClick={onRestart}
              variant="secondary"
              size="lg"
              className="transition-smooth hover:shadow-elegant"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Recommencer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};