import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, Users, CheckCircle, Star, ArrowRight, Zap, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Landing = () => {
  const navigate = useNavigate();

  const stats = [
    { icon: Users, value: "10K+", label: "Utilisateurs" },
    { icon: TrendingUp, value: "25K+", label: "Plans générés" },
    { icon: Star, value: "4.9/5", label: "Satisfaction" },
  ];

  const features = [
    { icon: Zap, title: "Génération instantanée", description: "Créez votre business plan en quelques minutes grâce à l'IA" },
    { icon: Shield, title: "100% Sécurisé", description: "Vos données sont cryptées et protégées" },
    { icon: Clock, title: "Disponible 24/7", description: "Générez votre plan à tout moment" },
  ];

  const testimonials = [
    {
      name: "Marie Dupont",
      role: "Fondatrice, TechStart",
      content: "Cette application a transformé ma façon de créer des business plans. Rapide, efficace et professionnel !",
      rating: 5,
    },
    {
      name: "Jean Martin",
      role: "CEO, InnovCorp",
      content: "Un outil indispensable pour tout entrepreneur. La qualité des plans générés est impressionnante.",
      rating: 5,
    },
    {
      name: "Sophie Bernard",
      role: "Consultante",
      content: "J'utilise cette plateforme pour tous mes clients. Les résultats sont toujours au-delà des attentes.",
      rating: 5,
    },
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
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Connexion
            </Button>
            <Button onClick={() => navigate("/generate")} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              Commencer gratuitement
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="text-center max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="inline-block">
            <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
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
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 h-14 group shadow-elegant"
            >
              Générer mon plan
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate("/auth")}
              className="text-lg px-8 h-14"
            >
              Voir un exemple
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 animate-slide-up">
            {stats.map((stat, index) => (
              <Card key={index} className="border-primary/20 bg-gradient-card shadow-card hover:shadow-elegant transition-shadow">
                <CardContent className="pt-6 text-center space-y-2">
                  <stat.icon className="h-8 w-8 mx-auto text-primary" />
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-transparent to-muted/30">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Pourquoi choisir{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              BusinessPlan AI
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Une solution complète pour entrepreneurs ambitieux
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-primary/20 bg-gradient-card shadow-card hover:shadow-elegant transition-all hover:-translate-y-1 group"
            >
              <CardContent className="pt-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ce que disent nos{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              utilisateurs
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Des milliers d'entrepreneurs nous font confiance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="border-primary/20 bg-gradient-card shadow-card hover:shadow-elegant transition-all"
            >
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                <div className="border-t border-border/50 pt-4">
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 shadow-elegant max-w-4xl mx-auto">
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">
              Prêt à transformer{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                votre idée
              </span>
              {" "}en succès ?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Rejoignez des milliers d'entrepreneurs qui utilisent déjà BusinessPlan AI
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/generate")}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 h-14 group shadow-elegant"
              >
                Commencer maintenant
                <Sparkles className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Pas de carte requise
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Essai gratuit
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Support 24/7
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2024 BusinessPlan AI. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
