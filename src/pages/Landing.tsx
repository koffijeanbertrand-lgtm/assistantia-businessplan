import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Zap, Shield, Clock, Settings, User, LogOut, History, Check, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { ContactForm } from "@/components/ContactForm";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const PACKS = [
  {
    id: 'mini',
    name: 'Mini Pack',
    price: 2000,
    credits: 2,
    description: 'Parfait pour tester',
    features: ['2 business plans', 'Support par email', 'Accès à l\'historique'],
  },
  {
    id: 'starter',
    name: 'Starter Pack',
    price: 5000,
    credits: 6,
    description: 'Le plus populaire',
    popular: true,
    features: ['6 business plans', 'Support prioritaire', 'Accès à l\'historique', 'Modèles avancés'],
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    price: 10000,
    credits: 15,
    description: 'Pour les entrepreneurs actifs',
    features: ['15 business plans', 'Support VIP 24/7', 'Accès à l\'historique', 'Modèles avancés', 'Export PDF premium'],
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPaystackScript();
    checkUserStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (!session) {
        setIsAdmin(false);
        setUserEmail("");
        setUserProfile(null);
      } else {
        checkUserStatus();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadPaystackScript = () => {
    if (!document.getElementById('paystack-script')) {
      const script = document.createElement('script');
      script.id = 'paystack-script';
      script.src = 'https://js.paystack.co/v1/inline.js';
      document.body.appendChild(script);
    }
  };

  const checkUserStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
    
    if (!session) return;

    setUserEmail(session.user.email || "");

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    setUserProfile(profile);

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .single();

    setIsAdmin(!!roleData);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getUserInitials = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return userEmail.charAt(0).toUpperCase();
  };

  const handlePurchase = (pack: typeof PACKS[0]) => {
    if (!userEmail && !isLoggedIn) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour acheter des crédits",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    const email = userEmail || prompt('Entrez votre email pour continuer:');
    if (!email) {
      toast({
        title: "Email requis",
        description: "Veuillez fournir votre email pour continuer",
        variant: "destructive",
      });
      return;
    }

    setLoading(pack.id);

    const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!paystackPublicKey) {
      toast({
        title: "Configuration manquante",
        description: "La clé publique Paystack n'est pas configurée",
        variant: "destructive",
      });
      setLoading(null);
      return;
    }

    const paystack = new window.PaystackPop();
    paystack.newTransaction({
      key: paystackPublicKey,
      email: email,
      amount: pack.price * 100,
      currency: "XOF",
      metadata: {
        pack: pack.id,
        credits: pack.credits,
        userId: userProfile?.id || null,
      },
      callback: (response: any) => {
        console.log('Payment successful:', response);
        navigate(`/payment-success?reference=${response.reference}&pack=${pack.id}&email=${encodeURIComponent(email)}`);
      },
      onClose: () => {
        setLoading(null);
        toast({
          title: "Paiement annulé",
          description: "Vous avez annulé le paiement",
        });
      },
    });
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
            {isLoggedIn ? (
              <>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userProfile?.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{userProfile?.full_name || "Utilisateur"}</p>
                      <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/history")} className="cursor-pointer">
                      <History className="mr-2 h-4 w-4" />
                      Historique
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-primary/20 via-accent/10 to-transparent rounded-full blur-3xl animate-pulse" />
                
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

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Choisissez votre{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              pack de crédits
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Achetez des crédits pour générer vos business plans
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PACKS.map((pack, index) => (
            <Card 
              key={pack.id}
              className={`relative group hover:shadow-elegant transition-all duration-300 ${
                pack.popular 
                  ? 'border-primary/50 shadow-glow scale-105' 
                  : 'border-border/50 hover:border-primary/30'
              } animate-fade-in`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {pack.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent">
                  Plus populaire
                </Badge>
              )}
              <CardContent className="p-6 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="font-bold text-xl">{pack.name}</h3>
                  <p className="text-sm text-muted-foreground">{pack.description}</p>
                  <div className="py-4">
                    <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {pack.price.toLocaleString()} FCFA
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {pack.credits} crédits
                    </div>
                  </div>
                </div>

                <ul className="space-y-3">
                  {pack.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    pack.popular
                      ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90'
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                  onClick={() => handlePurchase(pack)}
                  disabled={loading === pack.id}
                >
                  {loading === pack.id ? (
                    <>
                      <CreditCard className="mr-2 h-4 w-4 animate-pulse" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Acheter maintenant
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Paiement sécurisé via Paystack • Tous les prix sont en FCFA
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="container mx-auto px-4 py-20">
        <ContactForm />
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20 shadow-elegant">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Prêt à démarrer votre projet ?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Rejoignez des centaines d'entrepreneurs qui ont créé leur business plan avec notre IA
            </p>
            <Button 
              size="lg"
              onClick={() => navigate("/generate")}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 h-14"
            >
              Commencer maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">BusinessPlan AI</span>
            </div>
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/paystack-test")}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Test Paystack
              </Button>
              <p className="text-sm text-muted-foreground">
                © 2024 BusinessPlan AI. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
