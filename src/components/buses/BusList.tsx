import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bus as BusIcon, AlertTriangle, CheckCircle2, MapPin, Users, Clock } from 'lucide-react';
import { mockBuses } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Bus, EstadoBus, CreateDespachoDTO } from '@/types';
import { DespachoModal } from './DespachoModal';
import { toast } from 'sonner';

const estadoColors: Record<EstadoBus, string> = {
  DISPONIBLE: 'bg-muted text-muted-foreground',
  DESPACHADO: 'bg-success/10 text-success border-success/20',
  EN_RUTA: 'bg-primary/10 text-primary border-primary/20',
  MANTENIMIENTO: 'bg-warning/10 text-warning border-warning/20',
  INACTIVO: 'bg-destructive/10 text-destructive border-destructive/20',
};

interface BusCardProps {
  bus: Bus;
  onDespachar?: (bus: Bus) => void;
  showDespacharButton?: boolean;
}

function BusCard({ bus, onDespachar, showDespacharButton = false }: BusCardProps) {
  return (
    <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold">{bus.placa}</h3>
          <p className="text-sm text-muted-foreground">
            {bus.marca} {bus.modelo}
          </p>
        </div>
        <Badge 
          variant="outline" 
          className={cn(estadoColors[bus.estado])}
        >
          {bus.estado}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Capacidad</span>
          <span className="font-medium">{bus.capacidad} pasajeros</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Conductor</span>
          {bus.conductorAsignado ? (
            <div className="flex items-center gap-1 text-success">
              <CheckCircle2 className="w-3 h-3" />
              <span className="font-medium truncate max-w-[120px]">
                {bus.conductorAsignado.nombreCompleto.split(' ')[0]}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-warning">
              <AlertTriangle className="w-3 h-3" />
              <span>Sin asignar</span>
            </div>
          )}
        </div>

        {bus.conductoresAsociados && bus.conductoresAsociados.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Conductores</span>
            <div className="flex items-center gap-1 text-primary">
              <Users className="w-3 h-3" />
              <span className="font-medium">{bus.conductoresAsociados.length} asignados</span>
            </div>
          </div>
        )}
      </div>

      {showDespacharButton && bus.estado === 'DISPONIBLE' && onDespachar && (
        <Button
          size="sm"
          className="w-full mt-3 gap-2"
          onClick={() => onDespachar(bus)}
        >
          <MapPin className="w-4 h-4" />
          Despachar
        </Button>
      )}
    </div>
  );
}

export function BusList() {
  const [buses, setBuses] = useState<Bus[]>(mockBuses);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [showDespachoModal, setShowDespachoModal] = useState(false);

  const busesDisponibles = buses.filter(bus => bus.estado === 'DISPONIBLE');
  const busesDespachados = buses.filter(bus => 
    bus.estado === 'DESPACHADO' || bus.estado === 'EN_RUTA'
  );

  const handleOpenDespacho = (bus: Bus) => {
    if (bus.estado !== 'DISPONIBLE') {
      toast.error('Solo se pueden despachar buses disponibles');
      return;
    }
    setSelectedBus(bus);
    setShowDespachoModal(true);
  };

  const handleDespachar = (despacho: CreateDespachoDTO) => {
    setBuses(prev => 
      prev.map(bus => 
        bus.id === despacho.busId 
          ? { ...bus, estado: 'DESPACHADO' as EstadoBus }
          : bus
      )
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BusIcon className="w-5 h-5 text-primary" />
            Flota de Buses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="disponibles" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="disponibles" className="gap-2">
                <Clock className="w-4 h-4" />
                Por Despachar ({busesDisponibles.length})
              </TabsTrigger>
              <TabsTrigger value="despachados" className="gap-2">
                <MapPin className="w-4 h-4" />
                Despachados ({busesDespachados.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="disponibles">
              {busesDisponibles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay buses disponibles para despachar
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {busesDisponibles.map(bus => (
                    <BusCard 
                      key={bus.id} 
                      bus={bus} 
                      onDespachar={handleOpenDespacho}
                      showDespacharButton
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="despachados">
              {busesDespachados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay buses despachados
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {busesDespachados.map(bus => (
                    <BusCard key={bus.id} bus={bus} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <DespachoModal
        open={showDespachoModal}
        onOpenChange={setShowDespachoModal}
        bus={selectedBus}
        onDespachar={handleDespachar}
      />
    </>
  );
}
