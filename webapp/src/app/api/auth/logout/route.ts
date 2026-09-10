import { authService } from "@/services/auth.service";
import { apiOk } from "@/lib/api/response";

export async function POST() {
  await authService.logout();
  return apiOk({ message: "Đăng xuất thành công" });
}
