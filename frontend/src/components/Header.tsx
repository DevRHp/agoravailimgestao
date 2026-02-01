import { ShoppingCart, LogOut, Settings, Lock, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="glass-card border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer" 
          onClick={() => navigate('/')}
        >
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg gradient-text">CartControl</h1>
            <p className="text-xs text-muted-foreground">Sistema IoT</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/historico')}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Histórico</span>
          </Button>

          {user ? (
            <>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/admin')}
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/auth')}
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Área Admin</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
