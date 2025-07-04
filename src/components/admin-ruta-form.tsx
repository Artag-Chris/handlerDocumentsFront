"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Clock, School, AlertCircle, Plus, Trash2, ArrowLeft } from "lucide-react"

import { DIAS_SEMANA } from "@/dummyData/dummyRutas"
import { RutaFormData, Parada } from "@/interfaces"
import { useConductorStore } from "@/lib/conductor-store"
import { useInstitutionStore } from "@/lib/instituition-store"
import { useRutaStore } from "@/lib/ruta-store"
import { useVehiculoStore } from "@/lib/vehiculo-store"

export default function AdminRutaForm() {
  const router = useRouter()
  const { addRuta, isLoading } = useRutaStore()
  const { vehiculos } = useVehiculoStore()
  const { conductores } = useConductorStore()
  const { institutions } = useInstitutionStore()

  const [formData, setFormData] = useState<RutaFormData>({
    nombre: "",
    codigo: "",
    descripcion: "",
    institucionId: "",
    conductorId: "",
    vehiculoId: "",
    horarioSalida: "",
    horarioRegreso: "",
    diasOperacion: [],
    paradas: [],
    observaciones: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [nuevaParada, setNuevaParada] = useState<Omit<Parada, "id">>({
    nombre: "",
    direccion: "",
    horario: "",
    orden: 1,
    referencia: "",
  })
  const [errorParada, setErrorParada] = useState("")

  const conductoresActivos = conductores.filter((c) => c.estado === "Activo")
  const vehiculosDisponibles = vehiculos.filter((v) => v.estado === "Activo")
  const institucionesActivas = institutions.filter((inst) => inst.activa)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) newErrors.nombre = "El nombre de la ruta es obligatorio"
    if (!formData.codigo.trim()) newErrors.codigo = "El código de la ruta es obligatorio"
    if (!formData.institucionId) newErrors.institucionId = "Debe seleccionar una institución"
    if (!formData.conductorId) newErrors.conductorId = "Debe seleccionar un conductor"
    if (!formData.vehiculoId) newErrors.vehiculoId = "Debe seleccionar un vehículo"
    if (!formData.horarioSalida) newErrors.horarioSalida = "El horario de salida es obligatorio"
    if (!formData.horarioRegreso) newErrors.horarioRegreso = "El horario de regreso es obligatorio"
    if (formData.diasOperacion.length === 0) newErrors.diasOperacion = "Debe seleccionar al menos un día de operación"
    if (formData.paradas.length === 0) newErrors.paradas = "Debe agregar al menos una parada"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof RutaFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const handleDiaChange = (dia: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      diasOperacion: checked ? [...prev.diasOperacion, dia] : prev.diasOperacion.filter((d) => d !== dia),
    }))

    if (errors.diasOperacion) {
      setErrors((prev) => ({
        ...prev,
        diasOperacion: "",
      }))
    }
  }

  const handleParadaInputChange = (field: keyof Omit<Parada, "id">, value: any) => {
    setNuevaParada((prev) => ({
      ...prev,
      [field]: value,
    }))
    setErrorParada("")
  }

  const agregarParada = () => {
    if (!nuevaParada.nombre.trim() || !nuevaParada.direccion.trim() || !nuevaParada.horario) {
      setErrorParada("Todos los campos marcados con * son obligatorios")
      return
    }

    const parada: Parada = {
      ...nuevaParada,
      id: Date.now().toString(),
    }

    setFormData((prev) => ({
      ...prev,
      paradas: [...prev.paradas, parada],
    }))

    setNuevaParada({
      nombre: "",
      direccion: "",
      horario: "",
      orden: formData.paradas.length + 2,
      referencia: "",
    })

    if (errors.paradas) {
      setErrors((prev) => ({
        ...prev,
        paradas: "",
      }))
    }
  }

  const eliminarParada = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      paradas: prev.paradas.filter((p) => p.id !== id).map((p, i) => ({ ...p, orden: i + 1 })),
    }))
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      await addRuta(formData)
      router.push("/dashboard/transporte/rutas")
    } catch (error) {
      console.error("Error al crear ruta:", error)
    }
  }

  const vehiculoSeleccionado = vehiculos.find((v) => v.id === formData.vehiculoId)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crear Nueva Ruta</h1>
          <p className="text-gray-600">Complete la información para crear una nueva ruta de transporte</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Información de la Ruta
          </CardTitle>
          <CardDescription>Complete todos los campos obligatorios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la ruta *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                placeholder="Ej: Ruta Centro - San Judas"
                className={errors.nombre ? "border-red-500" : ""}
              />
              {errors.nombre && <p className="text-sm text-red-500">{errors.nombre}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo">Código de la ruta *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => handleInputChange("codigo", e.target.value.toUpperCase())}
                placeholder="Ej: R001"
                className={errors.codigo ? "border-red-500" : ""}
              />
              {errors.codigo && <p className="text-sm text-red-500">{errors.codigo}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion || ""}
              onChange={(e) => handleInputChange("descripcion", e.target.value)}
              placeholder="Descripción de la ruta"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="institucionId" className="flex items-center gap-2">
                <School className="w-4 h-4" />
                Institución educativa *
              </Label>
              <Select
                value={formData.institucionId}
                onValueChange={(value) => handleInputChange("institucionId", value)}
              >
                <SelectTrigger id="institucionId" className={errors.institucionId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Seleccionar institución" />
                </SelectTrigger>
                <SelectContent>
                  {institucionesActivas.map((institucion) => (
                    <SelectItem key={institucion.id} value={institucion.id}>
                      {institucion.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.institucionId && <p className="text-sm text-red-500">{errors.institucionId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="conductorId">Conductor *</Label>
              <Select value={formData.conductorId} onValueChange={(value) => handleInputChange("conductorId", value)}>
                <SelectTrigger id="conductorId" className={errors.conductorId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Seleccionar conductor" />
                </SelectTrigger>
                <SelectContent>
                  {conductoresActivos.map((conductor) => (
                    <SelectItem key={conductor.id} value={conductor.id}>
                      {conductor.nombreCompleto} - {conductor.licenciaConducir}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.conductorId && <p className="text-sm text-red-500">{errors.conductorId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehiculoId">Vehículo *</Label>
              <Select value={formData.vehiculoId} onValueChange={(value) => handleInputChange("vehiculoId", value)}>
                <SelectTrigger id="vehiculoId" className={errors.vehiculoId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Seleccionar vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehiculosDisponibles.map((vehiculo) => (
                    <SelectItem key={vehiculo.id} value={vehiculo.id}>
                      {vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo} ({vehiculo.cupoMaximo} pasajeros)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehiculoId && <p className="text-sm text-red-500">{errors.vehiculoId}</p>}
            </div>
          </div>

          {vehiculoSeleccionado && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600 font-medium">Vehículo seleccionado:</p>
              <p className="text-lg font-bold text-blue-800">
                {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo} - {vehiculoSeleccionado.placa}
              </p>
              <p className="text-sm text-blue-600">Capacidad: {vehiculoSeleccionado.cupoMaximo} pasajeros</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horarioSalida" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horario de salida *
              </Label>
              <Input
                id="horarioSalida"
                type="time"
                value={formData.horarioSalida}
                onChange={(e) => handleInputChange("horarioSalida", e.target.value)}
                className={errors.horarioSalida ? "border-red-500" : ""}
              />
              {errors.horarioSalida && <p className="text-sm text-red-500">{errors.horarioSalida}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="horarioRegreso" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horario de regreso *
              </Label>
              <Input
                id="horarioRegreso"
                type="time"
                value={formData.horarioRegreso}
                onChange={(e) => handleInputChange("horarioRegreso", e.target.value)}
                className={errors.horarioRegreso ? "border-red-500" : ""}
              />
              {errors.horarioRegreso && <p className="text-sm text-red-500">{errors.horarioRegreso}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Días de operación *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {DIAS_SEMANA.map((dia) => (
                <div key={dia.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={dia.value}
                    checked={formData.diasOperacion.includes(dia.value)}
                    onCheckedChange={(checked) => handleDiaChange(dia.value, checked as boolean)}
                  />
                  <Label htmlFor={dia.value} className="text-sm">
                    {dia.label}
                  </Label>
                </div>
              ))}
            </div>
            {errors.diasOperacion && <p className="text-sm text-red-500">{errors.diasOperacion}</p>}
          </div>

          <div className="space-y-4">
            <Label>Paradas de la ruta *</Label>

            {/* Formulario para agregar nueva parada */}
            <Card className="p-4 bg-gray-50">
              <h4 className="font-medium mb-3">Agregar nueva parada</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="nombreParada">Nombre *</Label>
                  <Input
                    id="nombreParada"
                    value={nuevaParada.nombre}
                    onChange={(e) => handleParadaInputChange("nombre", e.target.value)}
                    placeholder="Ej: Plaza Principal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horarioParada">Horario *</Label>
                  <Input
                    id="horarioParada"
                    type="time"
                    value={nuevaParada.horario}
                    onChange={(e) => handleParadaInputChange("horario", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2 mt-3">
                <Label htmlFor="direccionParada">Dirección *</Label>
                <Input
                  id="direccionParada"
                  value={nuevaParada.direccion}
                  onChange={(e) => handleParadaInputChange("direccion", e.target.value)}
                  placeholder="Dirección completa"
                />
              </div>
              <div className="space-y-2 mt-3">
                <Label htmlFor="referenciaParada">Referencia</Label>
                <Input
                  id="referenciaParada"
                  value={nuevaParada.referencia}
                  onChange={(e) => handleParadaInputChange("referencia", e.target.value)}
                  placeholder="Punto de referencia"
                />
              </div>
              {errorParada && <p className="text-sm text-red-500">{errorParada}</p>}
              <Button onClick={agregarParada} className="mt-3" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Agregar parada
              </Button>
            </Card>

            {/* Lista de paradas agregadas */}
            {formData.paradas.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Paradas agregadas:</h4>
                {formData.paradas.map((parada, index) => (
                  <div key={parada.id} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">#{index + 1}</span>
                          <span className="font-medium">{parada.nombre}</span>
                          <span className="text-sm text-gray-500">{parada.horario}</span>
                        </div>
                        <p className="text-sm text-gray-600">{parada.direccion}</p>
                        {parada.referencia && <p className="text-xs text-gray-500">Ref: {parada.referencia}</p>}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => eliminarParada(parada.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {errors.paradas && <p className="text-sm text-red-500">{errors.paradas}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones adicionales</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones || ""}
              onChange={(e) => handleInputChange("observaciones", e.target.value)}
              placeholder="Información adicional sobre la ruta"
              rows={3}
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Verifique que todos los horarios y paradas estén correctamente configurados antes de crear la ruta
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear Ruta"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
