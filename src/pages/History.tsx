import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Eye, Clock, ArrowLeft } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

interface BusinessPlan {
  id: string;
  project_name: string;
  sector: string;
  created_at: string;
  generated_plan: string;
}

const History = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [plans, setPlans] = useState<BusinessPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<BusinessPlan | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session) {
      fetchPlans();
    }
  }, [session]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("business_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("business_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPlans(plans.filter(p => p.id !== id));
      if (selectedPlan?.id === id) {
        setSelectedPlan(null);
      }

      toast({
        title: "✅ Supprimé",
        description: "Le business plan a été supprimé",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le business plan",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Historique des Business Plans
              </h1>
              <p className="text-muted-foreground">
                {plans.length} business plan{plans.length > 1 ? "s" : ""} créé{plans.length > 1 ? "s" : ""}
              </p>
            </div>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="transition-smooth"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </div>

          {plans.length === 0 ? (
            <Card className="p-12 text-center shadow-card gradient-card">
              <p className="text-muted-foreground mb-4">
                Vous n'avez pas encore créé de business plan
              </p>
              <Button onClick={() => navigate("/")} className="gradient-primary">
                Créer mon premier Business Plan
              </Button>
            </Card>
          ) : selectedPlan ? (
            <div className="space-y-6 animate-fade-in">
              <Card className="p-6 shadow-card gradient-card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      {selectedPlan.project_name}
                    </h2>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDate(selectedPlan.created_at)}
                    </p>
                  </div>
                  <Button
                    onClick={() => setSelectedPlan(null)}
                    variant="ghost"
                  >
                    Fermer
                  </Button>
                </div>
                <div className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap">
                  {selectedPlan.generated_plan}
                </div>
              </Card>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className="p-6 shadow-card gradient-card transition-smooth hover:shadow-elegant"
                >
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {plan.project_name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    <span className="font-medium">Secteur:</span> {plan.sector}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(plan.created_at)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSelectedPlan(plan)}
                      size="sm"
                      className="flex-1 gradient-primary"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Voir
                    </Button>
                    <Button
                      onClick={() => handleDelete(plan.id)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;