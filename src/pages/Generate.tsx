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

const Generate = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
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
    if (!user || !businessData || !generatedPlan) return;

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
        title: "Sauvegardé !",
        description: "Votre business plan a été sauvegardé avec succès",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la sauvegarde",
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-primary/5 p-4">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative">
            <Sparkles className="h-20 w-20 text-primary animate-glow mx-auto" />
            <Loader2 className="h-10 w-10 text-accent animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Génération en cours...
            </h2>
            <p className="text-muted-foreground">
              Notre IA analyse vos données et crée votre business plan personnalisé
            </p>
          </div>
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Sparkles className="h-6 w-6 text-primary animate-glow" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              BusinessPlan AI
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/history")}
                  className="gap-2"
                >
                  <HistoryIcon className="h-4 w-4" />
                  Historique
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline-block">
                        {profile?.full_name || user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      Profil
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
              <Button onClick={() => navigate("/auth")} size="sm">
                Se connecter
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Générez votre{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent">
                Business Plan
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Remplissez le formulaire ci-dessous et laissez notre IA créer un business plan professionnel pour vous
            </p>
          </div>

          <BusinessPlanForm onSubmit={handleGenerate} />
        </div>
      </main>
    </div>
  );
};

export default Generate;
