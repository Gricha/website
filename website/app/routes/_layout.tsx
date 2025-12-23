import { Outlet } from "react-router";
import { Footer } from "../components/Footer";
import { Socials } from "../components/Socials";

export default function SiteLayout() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 selection:bg-emerald-200 selection:text-gray-900 dark:selection:bg-emerald-900 dark:selection:text-gray-100">
      <main className="mb-8 mt-12">
        <Outlet />
      </main>
      <Socials />
      <Footer />
    </div>
  );
}
