import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
    price: 0,
    credits: 2,
    description: 'Essai gratuit',
    features: ['2 business plans', 'Support par email', 'Accès à l\'historique'],
    free: true,
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

export default function Pricing() {
  const [user, setUser] = useState<any>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUserAndCredits();
    loadPaystackScript();
  }, []);

  const loadPaystackScript = () => {
    if (!document.getElementById('paystack-script')) {
      const script = document.createElement('script');
      script.id = 'paystack-script';
      script.src = 'https://js.paystack.co/v1/inline.js';
      document.body.appendChild(script);
    }
  };

  const loadUserAndCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user?.id) {
      const { data } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();
      
      setUserCredits(data?.credits || 0);
    }
  };

  const handlePurchase = async (pack: typeof PACKS[0]) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour obtenir des crédits",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    const email = user.email;
    if (!email) {
      toast({
        title: "Email requis",
        description: "Votre compte doit avoir un email",
        variant: "destructive",
      });
      return;
    }

    setLoading(pack.id);

    // If pack is free, add credits directly
    if (pack.free) {
      try {
        // Check if user has already claimed the free pack
        const { data: existingFreePack } = await supabase
          .from('payment_history')
          .select('id')
          .eq('user_id', user.id)
          .eq('pack_type', 'mini')
          .eq('status', 'success')
          .maybeSingle();

        if (existingFreePack) {
          toast({
            title: "Pack gratuit déjà réclamé",
            description: "Vous avez déjà bénéficié du pack gratuit. Choisissez un autre pack.",
            variant: "destructive",
          });
          setLoading(null);
          return;
        }

        const { data: existingCredits } = await supabase
          .from('user_credits')
          .select('credits')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingCredits) {
          await supabase
            .from('user_credits')
            .update({ credits: existingCredits.credits + pack.credits })
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('user_credits')
            .insert({ user_id: user.id, credits: pack.credits });
        }

        // Record the free pack claim in payment history
        await supabase
          .from('payment_history')
          .insert({
            user_id: user.id,
            email: email,
            pack_type: pack.id,
            amount: 0,
            credits_added: pack.credits,
            status: 'success',
            reference: `free-${user.id}-${Date.now()}`,
          });

        toast({
          title: "Crédits gratuits ajoutés !",
          description: `${pack.credits} crédits ont été ajoutés à votre compte`,
        });

        await loadUserAndCredits();
        setLoading(null);
      } catch (error) {
        console.error('Error adding free credits:', error);
        toast({
          title: "Erreur",
          description: "Impossible d'ajouter les crédits gratuits",
          variant: "destructive",
        });
        setLoading(null);
      }
      return;
    }

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
      amount: pack.price * 100, // Convert to kobo
      currency: "XOF",
      metadata: {
        pack: pack.id,
        credits: pack.credits,
        userId: user?.id || null,
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choisissez votre pack</h1>
          <p className="text-muted-foreground text-lg">
            Achetez des crédits pour générer vos business plans professionnels
          </p>
          {user && (
            <div className="mt-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Crédits disponibles: {userCredits}
              </Badge>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PACKS.map((pack) => (
            <Card 
              key={pack.id} 
              className={`relative ${pack.popular ? 'border-primary shadow-lg' : ''} ${pack.free ? 'border-green-500 shadow-md' : ''}`}
            >
              {pack.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Le plus populaire
                  </Badge>
                </div>
              )}
              
              {pack.free && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-green-500 text-white hover:bg-green-600">
                    Gratuit
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl">{pack.name}</CardTitle>
                <CardDescription>{pack.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <div className="text-4xl font-bold">
                    {pack.free ? 'Gratuit' : `${pack.price.toLocaleString()} FCFA`}
                  </div>
                  <div className="text-muted-foreground mt-1">
                    {pack.credits} crédits {!pack.free && `(${Math.round(pack.price / pack.credits)} FCFA/crédit)`}
                  </div>
                </div>

                <ul className="space-y-3">
                  {pack.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full"
                  variant={pack.popular ? "default" : "outline"}
                  onClick={() => handlePurchase(pack)}
                  disabled={loading !== null}
                >
                  {loading === pack.id ? 'Chargement...' : pack.free ? 'Obtenir gratuitement' : 'Acheter avec Paystack'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="ghost" onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
