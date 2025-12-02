import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Key, Shield, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        navigate("/");
        return;
      }
    } catch (error: any) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground mt-2">
            Configuration sécurisée de votre application
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Gestion sécurisée des clés API
            </CardTitle>
            <CardDescription>
              Les clés API sont gérées de manière sécurisée via Supabase Secrets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Key className="h-4 w-4" />
              <AlertTitle>Configuration sécurisée</AlertTitle>
              <AlertDescription className="mt-2 space-y-3">
                <p>
                  Pour des raisons de sécurité, les clés API sensibles (OpenAI, Paystack, etc.) 
                  sont stockées dans les <strong>Supabase Secrets</strong> et accessibles uniquement 
                  par les Edge Functions côté serveur.
                </p>
                <p>
                  Cette approche protège vos clés contre le vol via des attaques XSS 
                  et empêche toute exposition dans le code client.
                </p>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Secrets actuellement configurés :</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><code>OPENAI_API_KEY</code> - Génération de business plans</li>
                <li><code>PAYSTACK_SECRET_KEY</code> - Vérification des paiements</li>
                <li><code>PAYSTACK_PUBLIC_KEY</code> - Interface de paiement</li>
                <li><code>SUPABASE_SERVICE_ROLE_KEY</code> - Opérations administratives</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                Pour modifier ou ajouter des secrets, accédez à la console Supabase :
              </p>
              <Button variant="outline" asChild>
                <a 
                  href="https://supabase.com/dashboard/project/eayorbhlwmpsfeyzmkuj/settings/functions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Gérer les Secrets Supabase
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
