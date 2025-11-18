import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [creditsAdded, setCreditsAdded] = useState(0);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    const reference = searchParams.get('reference');
    const pack = searchParams.get('pack');
    const email = searchParams.get('email');

    if (!reference || !pack || !email) {
      toast({
        title: "Erreur",
        description: "Informations de paiement manquantes",
        variant: "destructive",
      });
      setVerifying(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: {
          reference,
          pack,
          email: decodeURIComponent(email),
          userId: user?.id,
        },
      });

      if (error) throw error;

      if (data.success) {
        setSuccess(true);
        setCreditsAdded(data.credits);
        toast({
          title: "Paiement réussi !",
          description: `${data.credits} crédits ajoutés à votre compte`,
        });
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast({
        title: "Erreur de vérification",
        description: error.message || "Impossible de vérifier le paiement",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-lg">Vérification de votre paiement...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">
            {success ? 'Paiement réussi !' : 'Paiement en cours'}
          </CardTitle>
          <CardDescription>
            {success 
              ? `${creditsAdded} crédits ont été ajoutés à votre compte`
              : 'Votre paiement est en cours de traitement'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {success && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                Vous pouvez maintenant générer {creditsAdded} business plan{creditsAdded > 1 ? 's' : ''} supplémentaire{creditsAdded > 1 ? 's' : ''}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={() => navigate('/')}
            >
              Créer mon business plan
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/pricing')}
            >
              Acheter plus de crédits
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
