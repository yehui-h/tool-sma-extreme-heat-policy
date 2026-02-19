import { RouterProvider } from "react-router-dom";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { AppProviders } from "@/app/providers";
import { router } from "@/router/routes";

function App() {
  return (
    <AppProviders>
      <NuqsAdapter>
        <RouterProvider router={router} />
      </NuqsAdapter>
    </AppProviders>
  );
}

export default App;
