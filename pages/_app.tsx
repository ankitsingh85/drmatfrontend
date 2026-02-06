import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import AnimatedCursor from "react-animated-cursor";

// Contexts
import { CartProvider } from "@/context/CartContext";
import { UserProvider } from "@/context/UserContext";
import { OrderProvider } from "@/context/OrderContext";

// Global Loader
import { LoaderProvider } from "@/components/global/LoderProvider";

export default function App({ Component, pageProps }: AppProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  return (
    <UserProvider>
      <CartProvider>
        <OrderProvider>
          <LoaderProvider>
            <Component {...pageProps} />

            {/* Optional cursor */}
            {/* {isDesktop && (
              <AnimatedCursor
                innerSize={12}
                outerSize={20}
                color="79, 70, 229"
                outerAlpha={0.3}
                innerScale={0.7}
                outerScale={2}
              />
            )} */}
          </LoaderProvider>
        </OrderProvider>
      </CartProvider>
    </UserProvider>
  );
}
