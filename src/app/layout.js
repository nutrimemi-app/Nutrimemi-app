import "./globals.css";
import AppProviders from "@/components/AppProviders";

export const metadata = {
  title: "Nutrimemi - Gestión de Nutrición",
  description: "App experto en gestión de consultas de nutrición",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nutrimemi",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#F6F4DF",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "'Outfit', sans-serif" }}>
        <AppProviders>
          {children}
        </AppProviders>
        <div className="no-print" style={{position:'fixed', bottom:0, right:0, background:'black', color:'white', fontSize:'10px', padding:'2px', zIndex:9999, opacity: 0.5}}>
          v4.0.0
        </div>
      </body>
    </html>
  );
}
