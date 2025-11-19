import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Loader2, History as HistoryIcon, LogOut, User } from "lucide-react";
import { BusinessPlanForm } from "@/components/BusinessPlanForm";
import { BusinessPlanResult } from "@/components/BusinessPlanResult";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { BusinessData } from "@/types/business";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

const Index = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [generatedPlan, setGeneratedPlan] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
      
      // Fetch user credits
      const { data: creditsData } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("user_id", userId)
        .single();
      
      setUserCredits(creditsData?.credits || 0);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt !",
    });
  };

  const handleGenerate = async (data: BusinessData) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour générer un business plan",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Check if user has credits
    if (userCredits <= 0) {
      toast({
        title: "Crédits insuffisants",
        description: "Vous devez acheter des crédits pour générer un business plan",
        variant: "destructive",
      });
      navigate("/pricing");
      return;
    }

    setIsGenerating(true);
    setBusinessData(data);

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        "generate-business-plan",
        {
          body: { businessData: data },
        }
      );

      if (functionError) throw functionError;

      if (functionData?.businessPlan) {
        setGeneratedPlan(functionData.businessPlan);
        
        // Deduct 1 credit
        const { error: creditError } = await supabase
          .from("user_credits")
          .update({ credits: userCredits - 1 })
          .eq("user_id", user.id);
        
        if (creditError) {
          console.error("Error deducting credits:", creditError);
        } else {
          setUserCredits(userCredits - 1);
        }
      } else {
        throw new Error("Aucun business plan généré");
      }
    } catch (error: any) {
      console.error("Error generating business plan:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la génération",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!businessData || !generatedPlan || !user) return;

    try {
      const { error } = await supabase.from("business_plans").insert({
        user_id: user.id,
        project_name: businessData.projectName,
        sector: businessData.sector,
        problem: businessData.problem,
        solution: businessData.solution,
        target_audience: businessData.targetAudience,
        business_model: businessData.businessModel,
        resources: businessData.resources,
        marketing_strategy: businessData.marketingStrategy,
        vision: businessData.vision,
        generated_plan: generatedPlan,
      });

      if (error) throw error;

      toast({
        title: "✅ Sauvegardé",
        description: "Votre business plan a été sauvegardé avec succès",
      });
    } catch (error: any) {
      console.error("Error saving business plan:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le business plan",
        variant: "destructive",
      });
    }
  };

  const handleRestart = () => {
    setGeneratedPlan("");
    setBusinessData(null);
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0].toUpperCase() || "U";
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 animate-glow">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Génération en cours...
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Notre IA analyse vos informations et rédige un business plan professionnel sur mesure
          </p>
        </div>
      </div>
    );
  }

  if (generatedPlan) {
    return (
      <BusinessPlanResult
        businessPlan={generatedPlan}
        onSave={handleSave}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <main className="min-h-screen gradient-hero">
      {/* Header avec navigation */}
      <div className="container mx-auto px-4 pt-6">
        <div className="flex justify-end gap-3 items-center">
          {user ? (
            <>
              {/* Display credits */}
              <div className="px-4 py-2 rounded-lg bg-primary/10 text-primary font-semibold">
                {userCredits} crédit{userCredits > 1 ? 's' : ''}
              </div>
              
              <Button
                onClick={() => navigate("/pricing")}
                variant="outline"
                className="transition-smooth"
              >
                Acheter des crédits
              </Button>
              
              <Button
                onClick={() => navigate("/history")}
                variant="outline"
                className="transition-smooth"
              >
                <HistoryIcon className="mr-2 h-4 w-4" />
                Historique
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="transition-smooth gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={profile?.avatar_url || ""} alt="Avatar" />
                      <AvatarFallback className="text-xs">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">
                      {profile?.full_name || user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Mon profil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              onClick={() => navigate("/auth")}
              variant="outline"
              className="transition-smooth"
            >
              Connexion / Inscription
            </Button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20">
        <header className="text-center mb-12 md:mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl gradient-primary mb-6 shadow-glow">
            <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 md:mb-6">
            Crée ton Business Plan en{" "}
            <span className="gradient-primary bg-clip-text text-transparent">
              1 minute
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Entre tes informations → l'IA rédige → tu récupères un Business Plan complet
          </p>
          {!user && (
            <p className="text-sm text-muted-foreground mt-4">
              <Link to="/auth" className="text-primary hover:underline">
                Connectez-vous
              </Link>{" "}
              pour sauvegarder vos business plans
            </p>
          )}
        </header>

        <BusinessPlanForm onSubmit={handleGenerate} />
      </div>
    </main>
  );
};

export default Index;
