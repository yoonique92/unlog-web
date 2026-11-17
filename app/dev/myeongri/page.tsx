import { notFound } from "next/navigation";
import MyeongriDevTool from "./MyeongriDevTool";

export default function MyeongriDevPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <MyeongriDevTool />;
}
