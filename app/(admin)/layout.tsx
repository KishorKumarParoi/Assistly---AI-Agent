import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const AdminLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const { userId } = await auth();
  if (userId === null) redirect("/login");

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <Header />

      <div className="flex flex-col flex-1 lg:flex-row bg-gray-100">
        <Sidebar />
        <div className="flex flex-1 justify-center lg:justify-start items-start max-w-5xl mx-auto w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
