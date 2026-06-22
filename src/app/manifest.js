export default function manifest() {
  return {
    name: 'Nutrimemi - Gestión Nutricional',
    short_name: 'Nutrimemi',
    description: 'App experto en gestión de consultas de nutrición',
    start_url: '/',
    display: 'standalone',
    background_color: '#F6F4DF',
    theme_color: '#F6F4DF',
    icons: [
      {
        src: '/logopwa.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'any maskable',
      },
      {
        src: '/logopwa.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  }
}
