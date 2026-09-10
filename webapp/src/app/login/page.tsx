import { Zap } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoginForm } from "@/app/login/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{ redirectTo?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirectTo } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader className="items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Zap className="h-5 w-5" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">SB Admin</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Quản lý khách hàng &amp; hóa đơn điện
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <LoginForm redirectTo={redirectTo} />
        </CardContent>
      </Card>
    </div>
  );
}
