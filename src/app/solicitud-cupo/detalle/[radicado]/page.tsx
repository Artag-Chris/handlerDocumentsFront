"use client"

import SolicitudDetalle from "@/components/solicitud-detalle"

type PageProps = {
  params: {
    radicado: string
  }
  searchParams?: Record<string, string | string[] | undefined>
}

export default function DetalleSolicitudPage({
  params,
}: PageProps) {
  return (
    <SolicitudDetalle 
      radicado={decodeURIComponent(params.radicado)} 
    />
  )
}