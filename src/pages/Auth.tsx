import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import systemLogo from "@/assets/system-logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cedula.length !== 7 || !/^\d+$/.test(cedula)) {
      toast({
        title: "Error de validación",
        description: "El número de cédula debe tener exactamente 7 dígitos",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      const internalEmail = `${cedula}@gesell.local`;
      const { error } = await supabase.auth.signInWithPassword({
        email: internalEmail,
        password,
      });

      if (error) throw error;

      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido al sistema",
      });
    } catch (error: any) {
      toast({
        title: "Error al iniciar sesión",
        description: "Cédula o contraseña incorrectos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cedula.length !== 7 || !/^\d+$/.test(cedula)) {
      toast({
        title: "Error de validación",
        description: "El número de cédula debe tener exactamente 7 dígitos",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      const internalEmail = `${cedula}@gesell.local`;
      const { error } = await supabase.auth.signUp({
        email: internalEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            cedula: cedula,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error al registrarse",
        description: error.message === "User already registered" 
          ? "Esta cédula ya está registrada"
          : error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={systemLogo} alt="Sistema Cámara Gesell" className="h-24 w-24 object-contain" />
          </div>
          <CardTitle className="text-2xl">Sistema Cámara Gesell</CardTitle>
          <CardDescription>Gestión de sesiones y causas judiciales</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cedula">Número de Cédula</Label>
                  <Input
                    id="cedula"
                    type="text"
                    placeholder="1234567"
                    value={cedula}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 7);
                      setCedula(value);
                    }}
                    maxLength={7}
                    required
                  />
                  <p className="text-xs text-muted-foreground">7 dígitos sin puntos ni guiones</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Cargando..." : "Iniciar Sesión"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre Completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Juan Pérez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-cedula">Número de Cédula</Label>
                  <Input
                    id="signup-cedula"
                    type="text"
                    placeholder="1234567"
                    value={cedula}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 7);
                      setCedula(value);
                    }}
                    maxLength={7}
                    required
                  />
                  <p className="text-xs text-muted-foreground">7 dígitos sin puntos ni guiones</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Cargando..." : "Registrarse"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;