// Comportamiento de la web. Los precios y ajustes están en precios.js.
const $ = (id) => document.getElementById(id);
const todos = (s, d = document) => [...d.querySelectorAll(s)];
const valor = (id) => $(id).value.trim();
const euros = (n) => n.toLocaleString("es-ES", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + "\u00a0€";
const km = (n) => n.toLocaleString("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + "\u00a0km";
const crear = (etiqueta, clase, texto) => { const e = document.createElement(etiqueta); if (clase) e.className = clase; if (texto != null) e.textContent = texto; return e; };

// ---------- Cabecera, menú, vídeo y aparición ----------
new IntersectionObserver(([e]) => $("cabecera").classList.toggle("fija", !e.isIntersecting), { rootMargin: "-80px 0px 0px" }).observe(document.querySelector(".portada__marca"));

function menu(abierto) {
  $("menu").classList.toggle("abierto", abierto);
  $("cabecera").classList.toggle("menu-abierto", abierto);
  $("abrir").setAttribute("aria-expanded", abierto);
}
$("abrir").addEventListener("click", () => menu(!$("menu").classList.contains("abierto")));
$("menu").addEventListener("click", (e) => e.target.closest("a") && menu(false));
document.addEventListener("keydown", (e) => e.key === "Escape" && menu(false));

function video(parar) {
  if (parar) $("video").pause(); else $("video").play().catch(() => {});
  $("pausa").classList.toggle("parado", parar);
  $("pausa").setAttribute("aria-label", parar ? "Reproducir el vídeo" : "Pausar el vídeo");
}
$("pausa").addEventListener("click", () => video(!$("pausa").classList.contains("parado")));
if (matchMedia("(prefers-reduced-motion: reduce)").matches) { $("video").removeAttribute("autoplay"); video(true); }

const ver = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("ya"); ver.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
todos(".rv").forEach((e) => ver.observe(e));

// ---------- Servicios y cesta ----------
const catalogo = DONCUT.servicios;
const cesta = Object.fromEntries(catalogo.map((s) => [s.id, 0]));
const MAX = 9;
let viaje = null; // { km, precio, aprox }
let sinRuta = false;

const unidades = () => catalogo.reduce((n, s) => n + cesta[s.id], 0);
const hayServicio = () => unidades() > 0;
const parking = () => (document.querySelector("[name=parking]:checked") || {}).value;
const suplemento = () => (parking() === "no" ? DONCUT.sinParking : 0);
const total = () => catalogo.reduce((n, s) => n + cesta[s.id] * s.precio, 0) + (viaje ? viaje.precio : 0) + suplemento();

function cambiar(id, n) {
  cesta[id] = Math.max(0, Math.min(MAX, n));
  if (hayServicio()) fallo("servicios", "");
  $("resumen").hidden = true;
  pintar();
}

// Lista de precios
$("precio-corte").textContent = euros(DONCUT.servicios[0].precio);
[...new Set(DONCUT.servicios.map((s) => s.foto))].forEach((f, i) => {
  const im = new Image();
  im.src = "assets/img/" + f + ".jpg"; im.alt = ""; im.loading = "lazy"; im.dataset.foto = f;
  if (!i) im.className = "visible";
  $("fotos").append(im);
});
const enseñar = (f) => todos("#fotos img").forEach((i) => i.classList.toggle("visible", i.dataset.foto === f));

function fila(s, lista) {
  const li = crear("li"), t = crear("div"), b = crear("button", "mas", "Añadir");
  li.dataset.id = s.id;
  t.append(crear("b", "", s.nombre));
  if (s.detalle) t.append(crear("small", "", s.detalle));
  b.type = "button";
  b.addEventListener("click", () => { cambiar(s.id, cesta[s.id] + 1); if (s.foto) enseñar(s.foto); });
  if (s.foto) li.addEventListener("pointerenter", () => enseñar(s.foto));
  li.append(t, crear("span", "precio", euros(s.precio)), b);
  lista.append(li);
}
DONCUT.servicios.forEach((s) => fila(s, $("lista")));

// Contadores del formulario
function contador(s) {
  const c = crear("div", "contador"), t = crear("div"), ud = crear("div", "ud");
  c.dataset.id = s.id;
  t.append(crear("b", "", s.nombre));
  if (s.detalle) t.append(crear("small", "", s.detalle));
  const menos = crear("button", "", "−"), mas = crear("button", "", "+"), n = crear("output", "", "0");
  menos.type = mas.type = "button";
  menos.setAttribute("aria-label", "Quitar " + s.nombre);
  mas.setAttribute("aria-label", "Añadir " + s.nombre);
  n.setAttribute("aria-label", "Cantidad de " + s.nombre);
  menos.addEventListener("click", () => { cambiar(s.id, cesta[s.id] - 1); if (!cesta[s.id]) mas.focus(); });
  mas.addEventListener("click", () => cambiar(s.id, cesta[s.id] + 1));
  ud.append(menos, n, mas);
  c.append(t, crear("span", "precio", euros(s.precio)), ud);
  $("contadores").append(c);
}
DONCUT.servicios.forEach(contador);

// ---------- Presupuesto ----------
const fecha = () => new Date($("dia").value + "T12:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

function direccion() {
  const piso = valor("piso"), enCasa = $("lugar").value === "En casa";
  const detalle = [valor("escalera") && "esc. " + valor("escalera"), piso && (enCasa && !/casa/i.test(piso) ? "piso " : $("lugar").value === "En el hotel" ? "hab. " : "") + piso, valor("puerta") && "pta. " + valor("puerta")].filter(Boolean).join(", ");
  return [
    !$("c-sitio").hidden && valor("sitio"),
    valor("calle") && valor("calle") + (valor("numero") ? " " + valor("numero") : ""),
    detalle,
    [valor("cp"), valor("poblacion")].filter(Boolean).join(" "),
  ].filter(Boolean).join(", ");
}

const textoParking = () => ({ si: "Lo facilitas", no: euros(DONCUT.sinParking), ns: "Hasta " + euros(DONCUT.sinParking) })[parking()] || "Por indicar";

function pintar() {
  // lista y contadores
  todos("#lista li").forEach((li) => {
    const n = cesta[li.dataset.id], b = li.querySelector(".mas"), nombre = catalogo.find((s) => s.id === li.dataset.id).nombre;
    li.classList.toggle("con", n > 0);
    b.textContent = n ? "Añadido · " + n : "Añadir";
    b.setAttribute("aria-label", n ? nombre + ", " + n + " en tu reserva. Añadir otro" : "Añadir " + nombre);
  });
  todos(".contador").forEach((c) => {
    const n = cesta[c.dataset.id], [menos, mas] = todos("button", c);
    c.classList.toggle("con", n > 0);
    c.querySelector("output").textContent = n;
    menos.disabled = !n; mas.disabled = n >= MAX;
  });

  // tarjeta
  const l = $("lineas"); l.textContent = "";
  const linea = (t, v, tenue) => { const li = crear("li", tenue ? "tenue" : ""); li.append(crear("span", "", t), crear("b", "", v)); l.append(li); };
  catalogo.filter((s) => cesta[s.id]).forEach((s) => linea(s.nombre + (cesta[s.id] > 1 ? " × " + cesta[s.id] : ""), euros(s.precio * cesta[s.id])));
  if (!unidades()) linea("Servicios", "Por elegir", true);
  if (viaje) linea("Desplazamiento, " + km(viaje.km), euros(viaje.precio));
  else linea("Desplazamiento", sinRuta ? "A confirmar" : "Según tu dirección", true);
  linea(parking() === "no" ? "Parking, 2 h en zona azul o verde" : "Parking", textoParking(), !suplemento());
  $("total").textContent = $("total-corto").textContent = euros(total());

  const c = $("cita"); c.textContent = "";
  const dato = (t, v) => { const d = crear("div"); d.append(crear("dt", "", t), crear("dd", "", v)); c.append(d); };
  if (valor("calle")) dato("Dónde", direccion());
  if ($("dia").value) dato("Cuándo", fecha() + ", " + $("franja").value.toLowerCase());

  // cesta flotante
  const u = unidades();
  $("cesta-n").textContent = u + (u === 1 ? " servicio" : " servicios");
  $("cesta-total").textContent = euros(total());
  $("cesta").classList.toggle("visible", u > 0 && !enReserva);
}

let enReserva = false;
new IntersectionObserver(([e]) => { enReserva = e.isIntersecting; $("cesta").classList.toggle("visible", unidades() > 0 && !enReserva); }, { rootMargin: "-15% 0px" }).observe($("reserva"));

// ---------- Distancia ----------
const limpiar = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const sinTipo = (c) => c.replace(/^\s*(calle|c\/|c\.|carrer|cl\.?)\s+(de la |de les |dels |del |de l'|d'|de )?/i, "").trim();

async function pedir(url, ms = 7000) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(url, { signal: c.signal }); if (!r.ok) throw new Error(r.status); return await r.json(); }
  finally { clearTimeout(t); }
}

// Institut Cartogràfic i Geològic de Catalunya y, si no la encuentra, CartoCiudad (IGN)
async function situar(calle, numero, cp, poblacion) {
  const icgc = async (c) => {
    const d = await pedir("https://eines.icgc.cat/geocodificador/cerca?size=5&text=" + encodeURIComponent(c + " " + numero + ", " + poblacion));
    const dirs = (d.features || []).filter((f) => f.properties.layer === "address" && limpiar(f.properties.municipi || "") === limpiar(poblacion));
    const f = dirs.find((x) => x.properties.codi_postal === cp);
    return f && { lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], nombre: f.properties.etiqueta };
  };
  const carto = async () => {
    const d = await pedir("https://www.cartociudad.es/geocoder/api/geocoder/candidates?limit=5&q=" + encodeURIComponent(calle + " " + numero + ", " + poblacion));
    const f = d.find((x) => x.type === "portal" && x.postalCode === cp);
    return f && { lng: f.lng, lat: f.lat, nombre: f.address };
  };
  const intentos = [() => icgc(calle)];
  if (sinTipo(calle) !== calle) intentos.push(() => icgc(sinTipo(calle)));
  intentos.push(carto);
  for (const i of intentos) { const p = await i().catch(() => null); if (p) return p; }
  return null;
}

// Kilómetros por carretera. Si no responde ningún servicio, se estima en línea recta.
async function ruta(p) {
  const o = DONCUT.origen, puntos = o.lng + "," + o.lat + ";" + p.lng + "," + p.lat + "?overview=false";
  for (const s of ["https://routing.openstreetmap.de/routed-car/route/v1/driving/", "https://router.project-osrm.org/route/v1/driving/"]) {
    const d = await pedir(s + puntos).catch(() => null);
    if (d && d.code === "Ok") return { km: d.routes[0].distance / 1000, aprox: false };
  }
  const r = Math.PI / 180, a = Math.sin((p.lat - o.lat) * r / 2) ** 2 + Math.cos(o.lat * r) * Math.cos(p.lat * r) * Math.sin((p.lng - o.lng) * r / 2) ** 2;
  return { km: 12742 * Math.asin(Math.sqrt(a)) * 1.35, aprox: true };
}

let turno = 0, ultima = "", enCurso = null;
const clave = () => [valor("calle"), valor("numero"), valor("cp"), valor("poblacion")].join("|");
const completa = () => valor("calle") && valor("numero") && /^\d{5}$/.test(valor("cp")) && valor("poblacion");

function avisar(partes, bien) {
  const t = $("distancia-texto"); t.textContent = "";
  partes.forEach((p) => t.append(p.b ? crear("b", "", p.b) : p));
  $("distancia").classList.toggle("bien", !!bien);
}

function calcular() {
  if (!completa() || clave() === ultima) return enCurso;
  const mio = ++turno; ultima = clave(); viaje = null; sinRuta = false; pintar();
  avisar(["Calculando el desplazamiento…"]);
  enCurso = (async () => {
    const p = await situar(valor("calle"), valor("numero"), valor("cp"), valor("poblacion"));
    if (mio !== turno) return;
    if (!p) {
      sinRuta = true; pintar();
      return avisar(["No encontramos esa dirección. Revisa la calle, el número y el código postal. También puedes seguir y te confirmamos el desplazamiento."]);
    }
    const r = await ruta(p);
    if (mio !== turno) return;
    const k = Math.round(r.km * 10) / 10;
    viaje = { km: k, precio: Math.round(k * DONCUT.euroPorKm * 100) / 100, aprox: r.aprox };
    const texto = [p.nombre + ". ", { b: (r.aprox ? "Unos " : "") + km(k) + " × " + euros(DONCUT.euroPorKm) + " = " + euros(viaje.precio) }];
    if (k > DONCUT.kmAviso) texto.push(". Está algo lejos: te confirmamos antes si llegamos.");
    avisar(texto, true); pintar();
  })();
  return enCurso;
}

// Si cambia la dirección, el cálculo anterior deja de valer
["calle", "numero", "cp", "poblacion"].forEach((id) => {
  $(id).addEventListener("input", () => {
    if (clave() === ultima) return;
    turno++; ultima = ""; viaje = null; sinRuta = false;
    avisar(["Escribe la dirección y calculamos el desplazamiento."]);
  });
  $(id).addEventListener("change", calcular);
});

// ---------- Formulario por pasos ----------
const pasos = todos(".paso");
let paso = 0;

const manana = new Date(); manana.setDate(manana.getDate() + 1);
$("dia").min = manana.getFullYear() + "-" + String(manana.getMonth() + 1).padStart(2, "0") + "-" + String(manana.getDate()).padStart(2, "0");

function fallo(id, texto) {
  const e = $("e-" + id), c = $(id);
  e.textContent = texto; e.hidden = !texto;
  if (c) { if (texto) c.setAttribute("aria-invalid", "true"); else c.removeAttribute("aria-invalid"); }
  return texto ? id : null;
}

const reglas = [
  () => [["servicios", hayServicio() ? "" : "Añade al menos un servicio."]],
  () => [
    ["calle", valor("calle") ? "" : "Escribe la calle."],
    ["numero", valor("numero") ? "" : "Falta el número."],
    ["piso", valor("piso") || $("lugar").value !== "En casa" ? "" : "Indica piso o «casa»."],
    ["cp", /^\d{5}$/.test(valor("cp")) ? "" : "Escribe cinco cifras."],
    ["poblacion", valor("poblacion") ? "" : "Escribe la población."],
    ["parking", parking() ? "" : "Elige una opción."],
  ],
  () => [
    ["dia", !$("dia").value ? "Elige un día." : $("dia").value < $("dia").min ? "Elige un día a partir de mañana." : ""],
    ["nombre", valor("nombre") ? "" : "Escribe tu nombre."],
    ["acepto", $("acepto").checked ? "" : "Marca la casilla para continuar."],
  ],
];
const donde = { servicios: () => document.querySelector("#contadores .ud button:last-child"), parking: () => $("pk-si") };
const revisar = (n) => reglas[n]().map(([id, t]) => fallo(id, t)).find(Boolean);

function irAPaso(n) {
  paso = n;
  pasos.forEach((p, i) => { p.hidden = i !== n; });
  todos("#progreso li").forEach((li, i) => {
    li.classList.toggle("activo", i === n); li.classList.toggle("hecho", i < n);
    if (i === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
  });
  $("atras").hidden = !n;
  $("seguir").textContent = n < 2 ? "Siguiente" : "Solicitar cita por WhatsApp";
  $("resumen").hidden = true;
  if ($("ficha").getBoundingClientRect().top < 80) $("ficha").scrollIntoView();
  const primero = todos("button:not(:disabled),input,select", pasos[n])[0];
  if (primero) primero.focus({ preventScroll: true });
}

function sitio() {
  const l = $("lugar").value, casa = l === "En casa";
  $("c-sitio").hidden = casa;
  $("l-sitio").textContent = { "En el hotel": "Nombre del hotel", "En el trabajo": "Empresa" }[l] || "Nombre del lugar";
  $("l-piso").textContent = l === "En el hotel" ? "Habitación" : "Piso";
  $("piso").placeholder = casa ? "3.º o casa" : "Opcional";
  fallo("piso", "");
}

$("ficha").addEventListener("input", (e) => {
  const id = e.target.name === "parking" ? "parking" : e.target.id;
  if ($("e-" + id)) fallo(id, "");
  $("resumen").hidden = true;
  pintar();
});
$("lugar").addEventListener("change", () => { sitio(); pintar(); });
$("atras").addEventListener("click", () => irAPaso(paso - 1));

$("ficha").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const mal = revisar(paso);
  if (mal) return (donde[mal] ? donde[mal]() : $(mal)).focus();
  if (paso === 1) {
    $("seguir").disabled = true;
    try { await calcular(); } finally { $("seguir").disabled = false; }
  }
  if (paso < 2) return irAPaso(paso + 1);

  const texto = [
    "Hola, quisiera reservar una visita de DONCUT.",
    "Servicios: " + catalogo.filter((s) => cesta[s.id]).map((s) => s.nombre + " × " + cesta[s.id]).join(", "),
    "Cuándo: " + fecha() + ", " + $("franja").value.toLowerCase(),
    "Lugar: " + $("lugar").value,
    "Dirección: " + direccion(),
    "Parking: " + { si: "sí, lo facilito", no: "no, " + euros(DONCUT.sinParking), ns: "no lo sé" }[parking()],
    valor("acceso") && "Cómo llegar: " + valor("acceso"),
    "Desplazamiento: " + (viaje ? km(viaje.km) + (viaje.aprox ? " (estimado)" : "") + ", " + euros(viaje.precio) : "por confirmar"),
    "Total aproximado: " + euros(total()) + (viaje ? "" : " más desplazamiento"),
    "Nombre: " + valor("nombre"),
    $("adaptada").checked && "Necesito más tiempo o una visita adaptada.",
    valor("notas") && "Notas: " + valor("notas"),
  ].filter(Boolean).join("\n");
  $("resumen-titulo").textContent = DONCUT.whatsapp ? "Tu solicitud" : "Vista previa. Así llegará tu solicitud:";
  $("resumen-texto").textContent = texto;
  $("resumen").hidden = false;
  if (DONCUT.whatsapp) window.open("https://wa.me/" + DONCUT.whatsapp + "?text=" + encodeURIComponent(texto), "_blank", "noopener");
});

// ---------- Dónde ----------
todos(".panel").forEach((p) => p.addEventListener("click", () => {
  todos(".panel").forEach((o) => { o.classList.toggle("activo", o === p); o.setAttribute("aria-pressed", o === p); });
  $("lugar").value = p.dataset.lugar; sitio(); pintar();
}));

$("pk-precio").textContent = euros(DONCUT.sinParking);
sitio(); pintar();
