/** Barra inferior acordada (docs/spec/02 §1). El orden es parte del contrato. */
export const TABS = [
  { name: 'index', title: 'Inicio', icon: 'home-outline' },
  { name: 'movimientos', title: 'Movimientos', icon: 'swap-horizontal' },
  { name: 'billeteras', title: 'Billeteras', icon: 'wallet-outline' },
  { name: 'planificacion', title: 'Planificación', icon: 'calendar-month-outline' },
  { name: 'reportes', title: 'Reportes', icon: 'chart-box-outline' },
] as const;
