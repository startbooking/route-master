import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateEnvioDineroDTO, Municipio } from '@/types';
import { mockMunicipios, mockConductores, mockBuses } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  User, 
  MapPin, 
  DollarSign, 
  Truck,
  Phone,
  FileText
} from 'lucide-react';

const envioDineroSchema = z.object({
  remitenteDocumento: z.string().min(5, 'Documento requerido').max(20),
  remitenteTipoDocumento: z.enum(['CC', 'CE', 'TI', 'PA']),
  remitenteNombre: z.string().min(3, 'Nombre requerido').max(100),
  remitenteTelefono: z.string().optional(),
  destinatarioDocumento: z.string().min(5, 'Documento requerido').max(20),
  destinatarioNombre: z.string().min(3, 'Nombre requerido').max(100),
  destinatarioTelefono: z.string().optional(),
  monto: z.number().min(1000, 'Monto mínimo: $1,000'),
  conductorId: z.number().min(1, 'Seleccione un conductor'),
  municipioDestinoId: z.number().min(1, 'Seleccione destino'),
  observaciones: z.string().optional(),
});

interface EnvioDineroFormProps {
  onSubmit: (dto: CreateEnvioDineroDTO, municipioOrigen: Municipio) => Promise<any>;
  loading: boolean;
  municipioOrigen: Municipio;
}

const COMISION_PORCENTAJE = 0.05;

export function EnvioDineroForm({ onSubmit, loading, municipioOrigen }: EnvioDineroFormProps) {
  const [monto, setMonto] = useState<number>(0);

  // Get conductores from buses that are DESPACHADO from this municipality
  const conductoresDisponibles = useMemo(() => {
    const busesDespachados = mockBuses.filter(b => 
      b.estado === 'DESPACHADO' && b.conductorAsignado
    );
    return busesDespachados
      .map(b => b.conductorAsignado!)
      .filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
  }, []);

  // Filter destinations (exclude origin)
  const municipiosDestino = useMemo(() => {
    return mockMunicipios.filter(m => m.id !== municipioOrigen.id && m.activo);
  }, [municipioOrigen]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateEnvioDineroDTO>({
    resolver: zodResolver(envioDineroSchema),
    defaultValues: {
      remitenteTipoDocumento: 'CC',
      monto: 0,
      conductorId: 0,
      municipioDestinoId: 0,
    },
  });

  const watchMonto = watch('monto');
  const comision = Math.round((watchMonto || 0) * COMISION_PORCENTAJE);
  const montoTotal = (watchMonto || 0) + comision;

  const handleFormSubmit = async (data: CreateEnvioDineroDTO) => {
    const result = await onSubmit(data, municipioOrigen);
    if (result) {
      reset();
      setMonto(0);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Remitente Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />
              Datos del Remitente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Label>Tipo Doc.</Label>
                <Select
                  defaultValue="CC"
                  onValueChange={(value) => setValue('remitenteTipoDocumento', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">CC</SelectItem>
                    <SelectItem value="CE">CE</SelectItem>
                    <SelectItem value="TI">TI</SelectItem>
                    <SelectItem value="PA">PA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Número Documento</Label>
                <Input
                  {...register('remitenteDocumento')}
                  placeholder="Ej: 1234567890"
                />
                {errors.remitenteDocumento && (
                  <p className="text-xs text-destructive mt-1">{errors.remitenteDocumento.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label>Nombre Completo</Label>
              <Input
                {...register('remitenteNombre')}
                placeholder="Nombre del remitente"
              />
              {errors.remitenteNombre && (
                <p className="text-xs text-destructive mt-1">{errors.remitenteNombre.message}</p>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Teléfono (opcional)
              </Label>
              <Input
                {...register('remitenteTelefono')}
                placeholder="Ej: 3001234567"
              />
            </div>
          </CardContent>
        </Card>

        {/* Destinatario Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-secondary" />
              Datos del Destinatario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Número Documento</Label>
              <Input
                {...register('destinatarioDocumento')}
                placeholder="Ej: 1234567890"
              />
              {errors.destinatarioDocumento && (
                <p className="text-xs text-destructive mt-1">{errors.destinatarioDocumento.message}</p>
              )}
            </div>

            <div>
              <Label>Nombre Completo</Label>
              <Input
                {...register('destinatarioNombre')}
                placeholder="Nombre del destinatario"
              />
              {errors.destinatarioNombre && (
                <p className="text-xs text-destructive mt-1">{errors.destinatarioNombre.message}</p>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Teléfono (opcional)
              </Label>
              <Input
                {...register('destinatarioTelefono')}
                placeholder="Ej: 3001234567"
              />
            </div>

            <div>
              <Label>Ciudad Destino</Label>
              <Select
                onValueChange={(value) => setValue('municipioDestinoId', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione destino" />
                </SelectTrigger>
                <SelectContent>
                  {municipiosDestino.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.nombre}, {m.departamento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.municipioDestinoId && (
                <p className="text-xs text-destructive mt-1">{errors.municipioDestinoId.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monto y Conductor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-secondary" />
              Información del Envío
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monto a Enviar</Label>
                <Input
                  type="number"
                  {...register('monto', { valueAsNumber: true })}
                  placeholder="0"
                  min={1000}
                  step={1000}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setMonto(value);
                    setValue('monto', value);
                  }}
                />
                {errors.monto && (
                  <p className="text-xs text-destructive mt-1">{errors.monto.message}</p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  Conductor
                </Label>
                <Select
                  onValueChange={(value) => setValue('conductorId', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione conductor" />
                  </SelectTrigger>
                  <SelectContent>
                    {conductoresDisponibles.length === 0 ? (
                      <SelectItem value="0" disabled>
                        No hay conductores disponibles
                      </SelectItem>
                    ) : (
                      conductoresDisponibles.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.nombreCompleto} - {c.licenciaNumero}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.conductorId && (
                  <p className="text-xs text-destructive mt-1">{errors.conductorId.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Observaciones (opcional)
              </Label>
              <Textarea
                {...register('observaciones')}
                placeholder="Notas adicionales sobre el envío..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monto:</span>
              <span className="font-medium">{formatCurrency(watchMonto || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Comisión (5%):</span>
              <span className="font-medium">{formatCurrency(comision)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total a Pagar:</span>
              <span className="text-primary">{formatCurrency(montoTotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Origen: {municipioOrigen.nombre}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading || conductoresDisponibles.length === 0}
          className="gap-2 min-w-[200px]"
          size="lg"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Registrando...' : 'Registrar Envío'}
        </Button>
      </div>
    </form>
  );
}