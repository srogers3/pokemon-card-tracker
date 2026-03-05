import { requireAdmin } from "@/lib/auth";
import { TestHatchClient } from "./test-hatch-client";

export default async function TestHatchPage() {
  await requireAdmin();
  return <TestHatchClient />;
}
