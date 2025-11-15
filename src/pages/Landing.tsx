import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Zap, Shield, Clock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Landing = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      
      if (!session) return;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      setIsAdmin(!!roleData);
    };

    checkUserStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (!session) {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const features = [
    { icon: Zap, title: "Génération instantanée", description: "Créez votre business plan en quelques minutes grâce à l'IA" },
    { icon: Shield, title: "100% Sécurisé", description: "Vos données sont cryptées et protégées" },
    { icon: Clock, title: "Disponible 24/7", description: "Générez votre plan à tout moment" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary animate-glow" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              BusinessPlan AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/admin")}
                className="text-muted-foreground hover:text-primary"
              >
                <Settings className="h-5 w-5" />
              </Button>
            )}
            {isLoggedIn ? (
              <>
                <Button variant="ghost" onClick={handleSignOut}>
                  Déconnexion
                </Button>
                <Button onClick={() => navigate("/generate")} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  Générer un plan
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Connexion
                </Button>
                <Button onClick={() => navigate("/generate")} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  Commencer gratuitement
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="text-center max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="inline-block">
            <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 animate-pulse">
              ✨ Propulsé par l'Intelligence Artificielle
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Créez votre{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
              Business Plan
            </span>
            {" "}en quelques minutes
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transformez vos idées en plans d'affaires professionnels grâce à notre IA avancée. 
            Simple, rapide et efficace.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              onClick={() => navigate("/generate")}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 h-14 group shadow-elegant animate-scale-in"
            >
              Générer mon plan
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/generate")}
              className="border-2 border-primary/20 hover:bg-primary/5 text-lg px-8 h-14"
            >
              Voir un exemple
            </Button>
          </div>

          {/* Floating Cards Animation */}
          <div className="relative mt-16 h-96">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full max-w-3xl h-full">
                {/* Central Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-primary/20 via-accent/10 to-transparent rounded-full blur-3xl animate-pulse" />
                
                {/* Floating Cards */}
                <div className="absolute top-0 left-0 animate-float-slow">
                  <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-glow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Zap className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Rapide</h3>
                          <p className="text-sm text-muted-foreground">En quelques clics</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="absolute top-0 right-0 animate-float-medium">
                  <Card className="bg-card/80 backdrop-blur-sm border-accent/20 shadow-glow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <Shield className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Sécurisé</h3>
                          <p className="text-sm text-muted-foreground">Données protégées</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 animate-float-fast">
                  <Card className="bg-card/80 backdrop-blur-sm border-primary-glow/20 shadow-glow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary-glow/10">
                          <Clock className="h-6 w-6 text-primary-glow" />
                        </div>
                        <div>
                          <h3 className="font-semibold">24/7</h3>
                          <p className="text-sm text-muted-foreground">Toujours disponible</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pourquoi choisir{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              BusinessPlan AI
            </span>
            ?
          </h2>
          <p className="text-muted-foreground text-lg">
            Une solution complète pour vos besoins en business plan
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-elegant transition-all duration-300 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20 shadow-elegant">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Prêt à transformer vos idées en succès ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Rejoignez des milliers d'entrepreneurs qui font confiance à notre plateforme
            </p>
            <Button 
              size="lg"
              onClick={() => navigate("/generate")}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 h-14 group shadow-glow"
            >
              Commencer maintenant
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">BusinessPlan AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 BusinessPlan AI. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
