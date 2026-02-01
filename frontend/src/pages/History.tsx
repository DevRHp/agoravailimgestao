import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History as HistoryIcon, ArrowLeft, Calendar, User, ShoppingCart, Clock, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsoCarrinho } from '@/lib/types';

export default function History() {
  const navigate = useNavigate();
  const [historico, setHistorico] = useState<UsoCarrinho[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHistorico();
  }, []);

  const fetchHistorico = async () => {
    setIsLoading(true);
    try {
      const data = await api.getHistorico();
      setHistorico(data);
    } catch {
      // Silent error or toast
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const calculateDuration = (inicio: string | null, fim: string | null) => {
    if (!inicio) return '-';
    const start = new Date(inicio);
    const end = fim ? new Date(fim) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} min`;
    }

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}min`;
  };

  const filteredHistorico = historico.filter(h => {
    const searchLower = searchTerm.toLowerCase();
    // Using simple property access, API returns nested objects
    const funcName = (h.funcionario as any)?.nome || '';
    const funcNif = (h.funcionario as any)?.nif || '';
    const cartName = (h.carrinho as any)?.nome || '';

    return (
      funcName.toLowerCase().includes(searchLower) ||
      funcNif.toLowerCase().includes(searchLower) ||
      cartName.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: historico.length,
    emUso: historico.filter(h => h.status === 'EM_USO').length,
    finalizados: historico.filter(h => h.status === 'FINALIZADO').length,
  };

  return (
    <div className="min-h-screen bg-background tech-grid">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      <Header />

      <main className="container mx-auto px-4 py-8 relative">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <HistoryIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Histórico de Uso</h1>
            <p className="text-muted-foreground">Registro de retiradas e devoluções</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="glass-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Total de Registros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Em Uso Agora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-warning">{stats.emUso}</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Finalizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-success">{stats.finalizados}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="glass-card p-4 mb-6">
          <Input
            placeholder="Buscar por funcionário, NIF ou carrinho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-secondary/50 border-border"
          />
        </div>

        {/* History Table */}
        <Card className="glass-card border-border overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Carregando histórico...
              </div>
            ) : filteredHistorico.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum registro encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Funcionário
                        </div>
                      </TableHead>
                      <TableHead className="text-muted-foreground">NIF</TableHead>
                      <TableHead className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4" />
                          Carrinho
                        </div>
                      </TableHead>
                      <TableHead className="text-muted-foreground">Retirada</TableHead>
                      <TableHead className="text-muted-foreground">Devolução</TableHead>
                      <TableHead className="text-muted-foreground">Duração</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistorico.map((uso) => (
                      <TableRow key={uso.id} className="border-border">
                        <TableCell className="font-medium text-foreground">
                          {(uso.funcionario as any)?.nome || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {(uso.funcionario as any)?.nif || '-'}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {(uso.carrinho as any)?.nome || '-'}
                        </TableCell>
                        <TableCell className="text-foreground whitespace-nowrap">
                          {formatDateTime(uso.data_hora_inicio)}
                        </TableCell>
                        <TableCell className="text-foreground whitespace-nowrap">
                          {formatDateTime(uso.data_hora_fim)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {calculateDuration(uso.data_hora_inicio, uso.data_hora_fim)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={uso.status === 'EM_USO' ? 'default' : 'secondary'}
                            className={
                              uso.status === 'EM_USO'
                                ? 'bg-warning/20 text-warning border-warning/30'
                                : 'bg-success/20 text-success border-success/30'
                            }
                          >
                            {uso.status === 'EM_USO' ? 'Em Uso' : 'Finalizado'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
