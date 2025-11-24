import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function PaystackTest() {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [publicKeyConfigured, setPublicKeyConfigured] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if Paystack script is loaded
    const checkScript = () => {
      if (window.PaystackPop) {
        setScriptLoaded(true);
      } else {
        loadPaystackScript();
      }
    };

    const loadPaystackScript = () => {
      if (!document.getElementById('paystack-script')) {
        const script = document.createElement('script');
        script.id = 'paystack-script';
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        script.onload = () => {
          console.log('Paystack script loaded');
          setScriptLoaded(true);
        };
        script.onerror = () => {
          console.error('Failed to load Paystack script');
          setScriptLoaded(false);
        };
        document.body.appendChild(script);
      }
    };

    // Check if public key is configured
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    setPublicKeyConfigured(!!publicKey);

    checkScript();
  }, []);

  const handleTestPayment = () => {
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    
    if (!publicKey) {
      toast({
        title: "Clé publique manquante",
        description: "VITE_PAYSTACK_PUBLIC_KEY n'est pas configurée",
        variant: "destructive",
      });
      return;
    }

    if (!window.PaystackPop) {
      toast({
        title: "Script non chargé",
        description: "Le script Paystack n'est pas encore chargé",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);

    try {
      const paystack = new window.PaystackPop();
      paystack.newTransaction({
        key: publicKey,
        email: "test@example.com",
        amount: 100, // 1 FCFA in kobo
        currency: "XOF",
        metadata: {
          test: true,
          description: "Test de configuration Paystack"
        },
        callback: (response: any) => {
          console.log('Test payment callback:', response);
          toast({
            title: "Test réussi !",
            description: `Référence: ${response.reference}`,
          });
          setTesting(false);
        },
        onClose: () => {
          console.log('Test payment modal closed');
          setTesting(false);
          toast({
            title: "Test annulé",
            description: "La fenêtre de paiement a été fermée",
          });
        },
      });
    } catch (error) {
      console.error('Test payment error:', error);
      toast({
        title: "Erreur de test",
        description: `Erreur: ${error}`,
        variant: "destructive",
      });
      setTesting(false);
    }
  };

  const getPublicKeyPreview = () => {
    const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!key) return "Non configurée";
    return `${key.substring(0, 10)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Test Paystack</h1>
            <p className="text-muted-foreground">
              Vérifiez la configuration de Paystack avant la production
            </p>
          </div>

          <div className="space-y-6">
            {/* Configuration Status */}
            <Card>
              <CardHeader>
                <CardTitle>État de la configuration</CardTitle>
                <CardDescription>
                  Vérification des éléments nécessaires au fonctionnement de Paystack
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {scriptLoaded ? (
                      <CheckCircle className="text-green-500" />
                    ) : (
                      <XCircle className="text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">Script Paystack</p>
                      <p className="text-sm text-muted-foreground">
                        https://js.paystack.co/v1/inline.js
                      </p>
                    </div>
                  </div>
                  <Badge variant={scriptLoaded ? "default" : "destructive"}>
                    {scriptLoaded ? "Chargé" : "Non chargé"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {publicKeyConfigured ? (
                      <CheckCircle className="text-green-500" />
                    ) : (
                      <XCircle className="text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">Clé publique Paystack</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {getPublicKeyPreview()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={publicKeyConfigured ? "default" : "destructive"}>
                    {publicKeyConfigured ? "Configurée" : "Manquante"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Test Payment */}
            <Card>
              <CardHeader>
                <CardTitle>Test de paiement</CardTitle>
                <CardDescription>
                  Lancez un paiement test de 1 FCFA pour vérifier l'intégration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Informations du test :</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Email: test@example.com</li>
                    <li>• Montant: 1 FCFA</li>
                    <li>• Devise: XOF</li>
                    <li>• Mode: Test</li>
                  </ul>
                </div>

                <Button
                  onClick={handleTestPayment}
                  disabled={!scriptLoaded || !publicKeyConfigured || testing}
                  className="w-full"
                  size="lg"
                >
                  {testing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Test en cours...
                    </>
                  ) : (
                    "Lancer le test de paiement"
                  )}
                </Button>

                {(!scriptLoaded || !publicKeyConfigured) && (
                  <p className="text-sm text-muted-foreground text-center">
                    Veuillez corriger les problèmes de configuration ci-dessus
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Documentation */}
            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium mb-1">Configuration requise :</h4>
                  <p className="text-muted-foreground">
                    La variable d'environnement <code className="bg-muted px-1 py-0.5 rounded">VITE_PAYSTACK_PUBLIC_KEY</code> doit être définie avec votre clé publique Paystack.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Mode test vs production :</h4>
                  <p className="text-muted-foreground">
                    Utilisez votre clé publique de test pour les tests, et votre clé publique de production uniquement en production.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Vérification :</h4>
                  <p className="text-muted-foreground">
                    Assurez-vous que tous les indicateurs sont verts avant de passer en production.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button variant="ghost" onClick={() => navigate('/')}>
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
