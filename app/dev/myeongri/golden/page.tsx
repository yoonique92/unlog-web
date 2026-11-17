import { notFound } from "next/navigation";
import GoldenCaseBuilder from "./GoldenCaseBuilder";
import { isMyeongriDevRouteEnabled } from "../../../../lib/myeongri/devAccess";

export default function GoldenCaseBuilderPage() {
  if (!isMyeongriDevRouteEnabled()) notFound();
  return <GoldenCaseBuilder />;
}
