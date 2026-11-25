// =====================================================================
//  PRECIOS Y AJUSTES DE DONCUT. Este es el único archivo que hay que tocar
//  para cambiar servicios, precios, euros por kilómetro o el WhatsApp.
// =====================================================================
const DONCUT = {
  // Con prefijo y sin espacios, por ejemplo "34600000000".
  // Vacío = vista previa: enseña la solicitud sin enviarla.
  whatsapp: "",

  // Precios en euros.
  servicios: [
    { id: "corte", nombre: "Corte", detalle: "Clásico o degradado, con peinado", precio: 35, foto: "s-corte" },
    { id: "corte-barba", nombre: "Corte y barba", detalle: "El servicio completo", precio: 50, foto: "s-corte-barba" },
    { id: "barba", nombre: "Arreglo de barba", detalle: "Perfilado, rebaje y contornos", precio: 25, foto: "s-barba" },
    { id: "afeitado", nombre: "Afeitado tradicional", detalle: "A navaja, con toalla caliente", precio: 30, foto: "s-afeitado" },
    { id: "padre-hijo", nombre: "Padre e hijo", detalle: "Dos cortes en la misma visita", precio: 60, foto: "s-padre-hijo" },
  ],

  // Desplazamiento
  euroPorKm: 0.4, // en total, por cada km entre el origen y la dirección
  origen: { lat: 41.401, lng: 2.136 }, // Ronda del General Mitre, Barcelona
  kmAviso: 40, // a partir de aquí se avisa de que hay que confirmar la visita

  // Se suma si no facilitan parking: 2 horas en zona azul o verde de Barcelona.
  // Tarifas oficiales 2026 (AREA, B:SM), etiqueta C o B: azul 6,00-7,00 €, verde 7,00-8,00 €.
  sinParking: 7,
};
