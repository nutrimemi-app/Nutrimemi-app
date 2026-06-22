import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";
import BottomNav from "@/components/BottomNav";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

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
      <body className={outfit.className}>
        <UIProvider>
          <AuthProvider>
            <div className="pwa-container">
              {children}
              <BottomNav />
            </div>
          </AuthProvider>
        </UIProvider>
      </body>
    </html>
  );
}
