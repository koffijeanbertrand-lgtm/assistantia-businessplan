import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Key, Save } from "lucide-react";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openaiKey, setOpenaiKey] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAndLoadSettings();
  }, []);

  const checkAdminAndLoadSettings = async () => {
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

      loadSettings();
    } catch (error: any) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = () => {
    const storedOpenai = localStorage.getItem("admin_openai_key") || "";
    const storedUrl = localStorage.getItem("admin_supabase_url") || "";
    const storedAnon = localStorage.getItem("admin_supabase_anon_key") || "";
    
    setOpenaiKey(storedOpenai);
    setSupabaseUrl(storedUrl);
    setSupabaseAnonKey(storedAnon);
  };

  const handleSave = () => {
    setSaving(true);
    
    try {
      localStorage.setItem("admin_openai_key", openaiKey);
      localStorage.setItem("admin_supabase_url", supabaseUrl);
      localStorage.setItem("admin_supabase_anon_key", supabaseAnonKey);
      
      toast({
        title: "Succès",
        description: "Paramètres enregistrés avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les paramètres",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
            Configurez les clés API de votre application
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Clés API
            </CardTitle>
            <CardDescription>
              Ces informations sont stockées localement dans votre navigateur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="openai">OpenAI API Key</Label>
              <Input
                id="openai"
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Clé API pour la génération de business plans
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supabase-url">Supabase URL</Label>
              <Input
                id="supabase-url"
                type="password"
                placeholder="https://..."
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                URL de votre projet Supabase
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supabase-anon">Supabase Anon Key</Label>
              <Input
                id="supabase-anon"
                type="password"
                placeholder="eyJ..."
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Clé publique anonyme de Supabase
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer les paramètres
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
