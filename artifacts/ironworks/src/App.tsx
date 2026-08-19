import { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Home } from "@/pages/Home";
import { ProductPage } from "@/pages/ProductPage";
import { ContactPage } from "@/pages/ContactPage";
import { ServicesPage } from "@/pages/ServicesPage";
import { ServiceDetailPage } from "@/pages/ServiceDetailPage";
import { PreMadeDetailPage } from "@/pages/PreMadeDetailPage";
import { AdminGear } from "@/components/AdminGear";
import { init as initTracker } from "@/analytics/tracker";

const AdminPanel = lazy(() => import("@/pages/AdminPanel").then((module) => ({ default: module.AdminPanel })));

function AdminRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AdminPanel />
    </Suspense>
  );
}

const queryClient = new QueryClient();
const scrollPositions = new Map<string, number>();
let navigationWasPop = false;

function routeScrollKey() {
  return `${window.location.pathname}${window.location.search}`;
}

function ScrollToRouteTop() {
  const [location] = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.history.scrollRestoration = 'manual';
    const handlePopState = () => {
      navigationWasPop = true;
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useLayoutEffect(() => {
    const previousKey = routeScrollKey();

    const scrollToTarget = () => {
      const key = routeScrollKey();
      const hash = window.location.hash.replace('#', '');
      if (navigationWasPop) {
        const savedY = scrollPositions.get(key);
        if (typeof savedY === 'number') {
          window.scrollTo({ top: savedY, left: 0, behavior: 'auto' });
          return;
        }
      }
      if (hash) {
        document.getElementById(hash)?.scrollIntoView({ block: 'start' });
        return;
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };

    scrollToTarget();
    window.requestAnimationFrame(scrollToTarget);
    const timeouts = [80, 220, 500, 900].map((delay) => window.setTimeout(scrollToTarget, delay));

    navigationWasPop = false;

    return () => {
      scrollPositions.set(previousKey, window.scrollY);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [location]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/shop/:id" component={ProductPage} />
      <Route path="/pre-made/:id" component={PreMadeDetailPage} />
      <Route path="/services" component={ServicesPage} />
      <Route path="/services/:slug" component={ServiceDetailPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/admin" component={AdminRoute} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    initTracker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ScrollToRouteTop />
          <Router />
          <AdminGear />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
