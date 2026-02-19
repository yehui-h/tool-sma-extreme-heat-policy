import { createBrowserRouter, Navigate } from "react-router-dom";
import { SiteShell } from "@/app/layout/SiteShell";
import { AboutPage } from "@/pages/AboutPage";
import { HomePage } from "@/pages/HomePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <SiteShell />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "about",
        element: <AboutPage />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
