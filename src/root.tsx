import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteLoaderData,
} from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { contact } from "@/lib/data.server";

export const meta: Route.MetaFunction = () => [
  { title: "Fusian Dance Crew" },
  { name: "description", content: "Official website of Fusian Dance Crew" },
];

export function loader() {
  return { contact };
}

export function Layout({ children }: { children: React.ReactNode }) {
  // undefined only if the root loader itself failed
  const data = useRouteLoaderData<typeof loader>("root");
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <Meta />
        <Links />
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            {data && <Footer contact={data.contact} />}
          </div>
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl font-bold">{notFound ? "404" : "Error"}</h1>
      <p className="text-muted-foreground">
        {notFound ? "This page could not be found." : "An unexpected error occurred."}
      </p>
    </div>
  );
}
