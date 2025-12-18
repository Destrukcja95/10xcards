import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";

// Add any providers that wrap your app here (e.g., ThemeProvider, QueryClientProvider)
interface ProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: ProvidersProps) {
  // Add your providers here
  // Example:
  // return (
  //   <QueryClientProvider client={queryClient}>
  //     <ThemeProvider>
  //       {children}
  //     </ThemeProvider>
  //   </QueryClientProvider>
  // );
  return <>{children}</>;
}

// Custom render function that wraps components with providers
function customRender(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Setup userEvent with the rendered component
function setup(jsx: ReactElement) {
  return {
    user: userEvent.setup(),
    ...customRender(jsx),
  };
}

// Re-export everything from testing-library
export * from "@testing-library/react";

// Override render with custom render
export { customRender as render, setup };
