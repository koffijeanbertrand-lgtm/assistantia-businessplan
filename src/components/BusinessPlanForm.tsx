import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Rocket } from "lucide-react";
import type { BusinessData } from "@/types/business";

interface BusinessPlanFormProps {
  onSubmit: (data: BusinessData) => void;
}

export const BusinessPlanForm = ({ onSubmit }: BusinessPlanFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<BusinessData>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (data: BusinessData) => {
    setIsSubmitting(true);
    await onSubmit(data);
    setIsSubmitting(false);
  };

  return (
    <Card className="max-w-3xl mx-auto p-6 md:p-10 shadow-card gradient-card animate-fade-in">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="projectName" className="text-foreground font-medium">
            Nom du projet <span className="text-destructive">*</span>
          </Label>
          <Input
            id="projectName"
            {...register("projectName", { required: "Ce champ est requis" })}
            placeholder="Ex: MonAppli"
            className="transition-smooth focus:shadow-elegant"
          />
          {errors.projectName && (
            <p className="text-sm text-destructive">{errors.projectName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sector" className="text-foreground font-medium">
            Secteur d'activité <span className="text-destructive">*</span>
          </Label>
          <Input
            id="sector"
            {...register("sector", { required: "Ce champ est requis" })}
            placeholder="Ex: E-commerce, SaaS, Santé..."
            className="transition-smooth focus:shadow-elegant"
          />
          {errors.sector && (
            <p className="text-sm text-destructive">{errors.sector.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem" className="text-foreground font-medium">
            Problème à résoudre <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="problem"
            {...register("problem", { required: "Ce champ est requis" })}
            placeholder="Quel problème ton projet résout-il ?"
            rows={3}
            className="transition-smooth focus:shadow-elegant resize-none"
          />
          {errors.problem && (
            <p className="text-sm text-destructive">{errors.problem.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="solution" className="text-foreground font-medium">
            Solution proposée <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="solution"
            {...register("solution", { required: "Ce champ est requis" })}
            placeholder="Comment résous-tu ce problème ?"
            rows={3}
            className="transition-smooth focus:shadow-elegant resize-none"
          />
          {errors.solution && (
            <p className="text-sm text-destructive">{errors.solution.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience" className="text-foreground font-medium">
            Public cible <span className="text-destructive">*</span>
          </Label>
          <Input
            id="targetAudience"
            {...register("targetAudience", { required: "Ce champ est requis" })}
            placeholder="Ex: PME, étudiants, freelances..."
            className="transition-smooth focus:shadow-elegant"
          />
          {errors.targetAudience && (
            <p className="text-sm text-destructive">{errors.targetAudience.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessModel" className="text-foreground font-medium">
            Modèle économique <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="businessModel"
            {...register("businessModel", { required: "Ce champ est requis" })}
            placeholder="Comment vas-tu générer des revenus ?"
            rows={2}
            className="transition-smooth focus:shadow-elegant resize-none"
          />
          {errors.businessModel && (
            <p className="text-sm text-destructive">{errors.businessModel.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="resources" className="text-foreground font-medium">
            Ressources nécessaires <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="resources"
            {...register("resources", { required: "Ce champ est requis" })}
            placeholder="Équipe, budget, technologies..."
            rows={2}
            className="transition-smooth focus:shadow-elegant resize-none"
          />
          {errors.resources && (
            <p className="text-sm text-destructive">{errors.resources.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="marketingStrategy" className="text-foreground font-medium">
            Stratégie marketing <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="marketingStrategy"
            {...register("marketingStrategy", { required: "Ce champ est requis" })}
            placeholder="Comment vas-tu acquérir tes clients ?"
            rows={2}
            className="transition-smooth focus:shadow-elegant resize-none"
          />
          {errors.marketingStrategy && (
            <p className="text-sm text-destructive">{errors.marketingStrategy.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="vision" className="text-foreground font-medium">
            Vision & objectifs <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="vision"
            {...register("vision", { required: "Ce champ est requis" })}
            placeholder="Quelle est ta vision à 3-5 ans ?"
            rows={2}
            className="transition-smooth focus:shadow-elegant resize-none"
          />
          {errors.vision && (
            <p className="text-sm text-destructive">{errors.vision.message}</p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full gradient-primary text-primary-foreground font-semibold text-lg py-6 transition-bounce hover:scale-105 shadow-elegant"
        >
          <Rocket className="mr-2 h-5 w-5" />
          Générer mon Business Plan
        </Button>
      </form>
    </Card>
  );
};