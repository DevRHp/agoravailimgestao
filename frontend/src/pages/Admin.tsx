import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Users, History, Plus, Trash2, Edit2,
  Save, X, ArrowLeft, CheckCircle, Clock
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatsCard } from '@/components/StatsCard';
import { Carrinho, Funcionario, UsoCarrinho, CartStatus } from '@/lib/types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Admin() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [carrinhos, setCarrinhos] = useState<Carrinho[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [historico, setHistorico] = useState<UsoCarrinho[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFuncDialogOpen, setIsFuncDialogOpen] = useState(false);
  const [editingCart, setEditingCart] = useState<Carrinho | null>(null);
  const [editingFunc, setEditingFunc] = useState<Funcionario | null>(null);

  // Form states
  const [cartForm, setCartForm] = useState({
    nome: '',
    identificador_fisico: '',
    ip_esp32: '',
    localizacao: '',
    status: 'DISPONIVEL' as CartStatus,
  });

  const [funcForm, setFuncForm] = useState({
    nif: '',
    nome: '',
    unidade: '',
    ativo: true,
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
      toast.error('Acesso negado');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      const [cartsData, funcsData, histData] = await Promise.all([
        api.getCarrinhos(),
        api.getFuncionarios(),
        api.getHistorico()
      ]);
      setCarrinhos(cartsData);
      setFuncionarios(funcsData);
      setHistorico(histData);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    }
  };

  const handleSaveCart = async () => {
    try {
      if (editingCart) {
        await api.updateCarrinho(editingCart.id, cartForm);
        toast.success('Carrinho atualizado!');
      } else {
        await api.createCarrinho(cartForm);
        toast.success('Carrinho cadastrado!');
      }
      setIsDialogOpen(false);
      resetCartForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar carrinho');
    }
  };

  const handleDeleteCart = async (id: string) => {
    if (!confirm('Deseja realmente excluir este carrinho?')) return;

    try {
      await api.deleteCarrinho(id);
      toast.success('Carrinho excluído!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir carrinho');
    }
  };

  const handleSaveFunc = async () => {
    try {
      if (editingFunc) {
        await api.updateFuncionario(editingFunc.id, funcForm);
        toast.success('Funcionário atualizado!');
      } else {
        await api.createFuncionario(funcForm);
        toast.success('Funcionário cadastrado!');
      }
      setIsFuncDialogOpen(false);
      resetFuncForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar funcionário');
    }
  };

  const handleDeleteFunc = async (id: string) => {
    if (!confirm('Deseja realmente excluir este funcionário?')) return;

    try {
      await api.deleteFuncionario(id);
      toast.success('Funcionário excluído!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir funcionário');
    }
  };

  const resetCartForm = () => {
    setCartForm({ nome: '', identificador_fisico: '', ip_esp32: '', localizacao: '', status: 'DISPONIVEL' });
    setEditingCart(null);
  };

  const resetFuncForm = () => {
    setFuncForm({ nif: '', nome: '', unidade: '', ativo: true });
    setEditingFunc(null);
  };

  const openEditCart = (cart: Carrinho) => {
    setEditingCart(cart);
    setCartForm({
      nome: cart.nome,
      identificador_fisico: cart.identificador_fisico,
      ip_esp32: cart.ip_esp32 || '',
      localizacao: cart.localizacao || '',
      status: cart.status as CartStatus,
    });
    setIsDialogOpen(true);
  };

  const openEditFunc = (func: Funcionario) => {
    setEditingFunc(func);
    setFuncForm({
      nif: func.nif,
      nome: func.nome,
      unidade: func.unidade || '',
      ativo: func.ativo,
    });
    setIsFuncDialogOpen(true);
  };

  const stats = {
    totalCarts: carrinhos.length,
    available: carrinhos.filter(c => c.status === 'DISPONIVEL').length,
    inUse: carrinhos.filter(c => c.status === 'EM_USO').length,
    totalFuncs: funcionarios.filter(f => f.ativo).length,
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background tech-grid">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      <header className="glass-card border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg gradient-text">Painel Administrativo</h1>
              <p className="text-xs text-muted-foreground">Gerenciamento do Sistema</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard title="Carrinhos" value={stats.totalCarts} icon={ShoppingCart} />
          <StatsCard title="Disponíveis" value={stats.available} icon={CheckCircle} variant="success" />
          <StatsCard title="Em Uso" value={stats.inUse} icon={Clock} variant="warning" />
          <StatsCard title="Funcionários" value={stats.totalFuncs} icon={Users} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="carrinhos" className="space-y-6">
          <TabsList className="bg-secondary/50 border border-border">
            <TabsTrigger value="carrinhos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Carrinhos
            </TabsTrigger>
            <TabsTrigger value="funcionarios" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4 mr-2" />
              Funcionários
            </TabsTrigger>
            <TabsTrigger value="historico" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <History className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Carrinhos Tab */}
          <TabsContent value="carrinhos" className="animate-fade-in">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Gerenciar Carrinhos</h2>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetCartForm(); }}>
                  <DialogTrigger asChild>
                    <Button variant="glow">
                      <Plus className="w-4 h-4" />
                      Novo Carrinho
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle>{editingCart ? 'Editar Carrinho' : 'Novo Carrinho'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium">Nome</label>
                        <Input
                          value={cartForm.nome}
                          onChange={(e) => setCartForm({ ...cartForm, nome: e.target.value })}
                          placeholder="Carrinho 01"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Identificador Físico</label>
                        <Input
                          value={cartForm.identificador_fisico}
                          onChange={(e) => setCartForm({ ...cartForm, identificador_fisico: e.target.value })}
                          placeholder="CART-001"
                          className="mt-1 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">IP ESP32</label>
                        <Input
                          value={cartForm.ip_esp32}
                          onChange={(e) => setCartForm({ ...cartForm, ip_esp32: e.target.value })}
                          placeholder="192.168.1.100"
                          className="mt-1 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <Select
                          value={cartForm.status}
                          onValueChange={(value) => setCartForm({ ...cartForm, status: value as CartStatus })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DISPONIVEL">Disponível</SelectItem>
                            <SelectItem value="EM_USO">Em Uso</SelectItem>
                            <SelectItem value="MANUTENCAO">Manutenção</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleSaveCart} className="flex-1" variant="glow">
                          <Save className="w-4 h-4" />
                          Salvar
                        </Button>
                        <Button onClick={() => setIsDialogOpen(false)} variant="outline">
                          <X className="w-4 h-4" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Nome</TableHead>
                      <TableHead>Identificador</TableHead>
                      <TableHead>Identificador</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carrinhos.map((cart) => (
                      <TableRow key={cart.id} className="border-border">
                        <TableCell className="font-medium">{cart.nome}</TableCell>
                        <TableCell className="font-mono text-sm">{cart.identificador_fisico}</TableCell>
                        <TableCell className="text-sm">{cart.localizacao || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${cart.status === 'DISPONIVEL' ? 'status-available' :
                            cart.status === 'EM_USO' ? 'status-in-use' : 'status-maintenance'
                            }`}>
                            {cart.status === 'DISPONIVEL' ? 'Disponível' :
                              cart.status === 'EM_USO' ? 'Em Uso' : 'Manutenção'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditCart(cart)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCart(cart.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Funcionários Tab */}
          <TabsContent value="funcionarios" className="animate-fade-in">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Gerenciar Funcionários</h2>
                <Dialog open={isFuncDialogOpen} onOpenChange={(open) => { setIsFuncDialogOpen(open); if (!open) resetFuncForm(); }}>
                  <DialogTrigger asChild>
                    <Button variant="glow">
                      <Plus className="w-4 h-4" />
                      Novo Funcionário
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle>{editingFunc ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium">NIF</label>
                        <Input
                          value={funcForm.nif}
                          onChange={(e) => setFuncForm({ ...funcForm, nif: e.target.value })}
                          placeholder="123456"
                          className="mt-1 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Nome</label>
                        <Input
                          value={funcForm.nome}
                          onChange={(e) => setFuncForm({ ...funcForm, nome: e.target.value })}
                          placeholder="João da Silva"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Unidade</label>
                        <Input
                          value={funcForm.unidade}
                          onChange={(e) => setFuncForm({ ...funcForm, unidade: e.target.value })}
                          placeholder="Setor A"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={funcForm.ativo}
                          onChange={(e) => setFuncForm({ ...funcForm, ativo: e.target.checked })}
                          className="rounded border-border"
                        />
                        <label className="text-sm">Ativo</label>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleSaveFunc} className="flex-1" variant="glow">
                          <Save className="w-4 h-4" />
                          Salvar
                        </Button>
                        <Button onClick={() => setIsFuncDialogOpen(false)} variant="outline">
                          <X className="w-4 h-4" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>NIF</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {funcionarios.map((func) => (
                      <TableRow key={func.id} className="border-border">
                        <TableCell className="font-mono">{func.nif}</TableCell>
                        <TableCell className="font-medium">{func.nome}</TableCell>
                        <TableCell>{func.unidade || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${func.ativo ? 'status-available' : 'status-maintenance'
                            }`}>
                            {func.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditFunc(func)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteFunc(func.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Histórico Tab */}
          <TabsContent value="historico" className="animate-fade-in">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-6">Histórico de Uso</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Carrinho</TableHead>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>NIF</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Fim</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historico.map((uso) => (
                      <TableRow key={uso.id} className="border-border">
                        <TableCell className="font-medium">{(uso.carrinho as any)?.nome || '-'}</TableCell>
                        <TableCell>{(uso.funcionario as any)?.nome || '-'}</TableCell>
                        <TableCell className="font-mono">{(uso.funcionario as any)?.nif || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {new Date(uso.data_hora_inicio).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {uso.data_hora_fim ? new Date(uso.data_hora_fim).toLocaleString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${uso.status === 'EM_USO' ? 'status-in-use' : 'status-available'
                            }`}>
                            {uso.status === 'EM_USO' ? 'Em Uso' : 'Finalizado'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}