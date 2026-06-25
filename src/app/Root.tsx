import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

import { queryClient } from "@/lib/queryClient";
import { router } from "@/app/routes";
import ErrorBoundary from "@/components/ErrorBoundary";

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export default function Root() {
  const routerElement = (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  );

  if (!recaptchaSiteKey) {
    return routerElement;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={recaptchaSiteKey}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: "head",
      }}
    >
      {routerElement}
    </GoogleReCaptchaProvider>
  );
}
